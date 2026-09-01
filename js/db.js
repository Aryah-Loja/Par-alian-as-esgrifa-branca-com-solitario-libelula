/**
 * DB.JS — Armazenamento local (IndexedDB via Dexie).
 * Tabelas: "media" (um registro por item — vídeo, assinatura, lembranças,
 * mensagens; campos id/tipo/blob/mimeType/texto/criadoEm) e "configuracoes"
 * (pares chave/valor pequenos). Cada mídia é seu próprio registro (em vez de
 * um array dentro de um único registro) para evitar bugs de Blob no Safari.
 * Toda escrita de mídia é seguida de uma leitura de confirmação.
 */

const db = new Dexie('AuroraDB');

// Coordena múltiplas abas abertas ao mesmo tempo durante um upgrade de schema.
db.on('blocked', () => {
    console.warn('AuroraDB: upgrade bloqueado por outra aba/página aberta com uma versão mais antiga do banco. Feche as outras abas do site e recarregue esta página.');
});
db.on('versionchange', () => {
    // Outra aba abriu uma versão mais nova do banco; fecha esta conexão.
    db.close();
    console.warn('AuroraDB: uma versão mais nova do banco foi aberta em outra aba. Esta conexão foi fechada — recarregue a página se algo parar de responder.');
});

// v1 = estrutura antiga, mantida só para migração automática.
db.version(1).stores({ arquivos: 'id' });

// v2 = estrutura atual, um registro por item de mídia.
db.version(2).stores({
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave'
}).upgrade(async (tx) => {
    try {
        const antigos = await tx.table('arquivos').toArray();
        for (const registro of antigos) {
            if (registro.id === 'video_casal' && registro.data) {
                await tx.table('media').put({ id: 'video_pedido', tipo: 'video_pedido', blob: registro.data, mimeType: registro.data.type || 'video/webm', criadoEm: registro.criadoEm || Date.now() });
            }
            if (registro.id === 'assinatura' && registro.data) {
                await tx.table('media').put({ id: 'assinatura', tipo: 'assinatura', texto: registro.data, criadoEm: Date.now() });
            }
            if (registro.id === 'lembrancas' && Array.isArray(registro.data)) {
                for (let i = 0; i < registro.data.length; i++) {
                    const item = registro.data[i];
                    await tx.table('media').put({ id: `lembranca_${Date.now()}_${i}`, tipo: 'lembranca', blob: item.blob, mimeType: item.blob && item.blob.type, criadoEm: Date.now() + i });
                }
            }
            if (registro.id === 'mensagens_futuro' && Array.isArray(registro.data)) {
                for (const msg of registro.data) {
                    await tx.table('media').put({
                        id: msg.id || `futuro_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                        tipo: 'mensagem_futuro',
                        subtipo: msg.tipo,
                        texto: msg.texto || null,
                        blob: msg.blob || null,
                        mimeType: msg.mimeType || null,
                        criadoEm: msg.criadoEm ? new Date(msg.criadoEm).getTime() : Date.now()
                    });
                }
            }
        }
        // Migração ok: limpa a tabela antiga para não duplicar dados.
        await tx.table('arquivos').clear();
    } catch (e) {
        console.error('Migração da estrutura antiga falhou (não é crítico, o site continua funcionando):', e);
    }
});

// v3 acrescenta somente um diário técnico local. A migração é aditiva:
// nenhuma tabela ou registro sentimental é removido ou regravado.
db.version(3).stores({
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave',
    diagnosticos: '++id, codigo, criadoEm, operacao'
});

function gerarCodigoDiagnostico() {
    const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const aleatorio = Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, '0');
    return `POLONI-${data}-${aleatorio}`;
}

// Registra apenas metadados técnicos. Nunca recebe senha, token ou conteúdo
// sentimental. O diário é limitado para não crescer indefinidamente.
async function registrarDiagnosticoSeguro(operacao, erro, detalhes = {}) {
    try {
        const codigo = gerarCodigoDiagnostico();
        const registro = {
            codigo,
            criadoEm: Date.now(),
            pagina: location && location.pathname ? location.pathname : '',
            operacao: String(operacao || 'desconhecida').slice(0, 80),
            mensagem: String(erro && erro.message ? erro.message : erro || 'Falha sem mensagem').slice(0, 500),
            stack: erro && erro.stack ? String(erro.stack).slice(0, 1800) : null,
            navegador: navigator && navigator.userAgent ? navigator.userAgent.slice(0, 350) : '',
            versaoApp: typeof POLONI_APP_VERSION !== 'undefined' ? POLONI_APP_VERSION : null,
            detalhes: detalhes && typeof detalhes === 'object' ? detalhes : {}
        };
        await db.diagnosticos.add(registro);
        const total = await db.diagnosticos.count();
        if (total > 120) {
            const antigos = await db.diagnosticos.orderBy('id').limit(total - 100).primaryKeys();
            await db.diagnosticos.bulkDelete(antigos);
        }
        return codigo;
    } catch (_) {
        return null;
    }
}

// Marca "agora" como última alteração local (usado por js/sync.js para
// decidir quem tem dados mais novos) e agenda o envio à nuvem.
async function marcarAtualizacaoLocal(imediato = false) {
    const agora = String(Date.now());
    try { localStorage.setItem('aurora_atualizado_em', agora); } catch (e) { /* ignora */ }
    try { await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: agora }); } catch (e) { /* ignora */ }
    try { localStorage.setItem('aurora_sync_dirty', '1'); } catch (e) { /* ignora */ }
    try { await db.configuracoes.put({ chave: 'aurora_sync_dirty', valor: '1' }); } catch (e) { /* ignora */ }
    if (typeof agendarEnvioNuvem === 'function') agendarEnvioNuvem(imediato);
}

// Salva um item de mídia e relê do banco para confirmar a integridade.
// Sincroniza imediatamente (sem agrupar), já que mídia é uma ação rara.
async function salvarMedia(registro) {
    if (!registro || !registro.id) throw new Error('salvarMedia requer um id');
    registro.criadoEm = registro.criadoEm || Date.now();
    registro.atualizadoEm = Date.now();

    try {
        await db.media.put(registro);
    } catch (err) {
        console.error(`Falha ao salvar mídia "${registro.id}" no IndexedDB:`, err);
        return false;
    }

    try {
        const confere = await db.media.get(registro.id);
        if (!confere) return false;
        if (registro.blob && (!confere.blob || confere.blob.size !== registro.blob.size)) return false;
        await marcarAtualizacaoLocal(true);
        return true;
    } catch (err) {
        console.error(`Falha ao confirmar mídia "${registro.id}":`, err);
        return false;
    }
}

async function obterMedia(id) {
    try { const item = await db.media.get(id); return item && !item.excluidoEm ? item : null; } catch (e) { console.error(`Falha ao ler mídia "${id}":`, e); return null; }
}

async function obterMediaPorTipo(tipo) {
    try { return (await db.media.where('tipo').equals(tipo).toArray()).filter(item => !item.excluidoEm); } catch (e) { console.error(`Falha ao listar mídias do tipo "${tipo}":`, e); return []; }
}

async function excluirMedia(id) {
    try {
        const existente = await db.media.get(id);
        if (!existente) return true;
        if (existente.tipo === 'diagnostico') await db.media.delete(id);
        else await db.media.put(Object.assign({}, existente, { excluidoEm: Date.now(), atualizadoEm: Date.now() }));
        await marcarAtualizacaoLocal(true);
        return true;
    } catch (e) { console.error(`Falha ao excluir mídia "${id}":`, e); return false; }
}

/* ---------------- Configurações simples (chave/valor) ---------------- */
// Dados pequenos (datas, estágio, regras, respostas do quiz). localStorage
// é o cache rápido; IndexedDB é a fonte de verdade redundante.
// `imediato`: true para marcos importantes que não podem esperar o timer
// de agrupamento (1,2s).
async function salvarConfiguracao(chave, valor, imediato = false, afetaSincronizacao = true) {
    // Sempre serializa a mesma string nos dois armazenamentos, para que
    // obterConfiguracao() tenha um retorno consistente (string ou null).
    const valorSerializado = typeof valor === 'string' ? valor : JSON.stringify(valor);

    let sucessoLocal = false;
    try {
        localStorage.setItem(chave, valorSerializado);
        sucessoLocal = true;
    } catch (e) { console.error('localStorage indisponível para', chave, e); }

    let sucessoIndexedDB = false;
    try {
        await db.configuracoes.put({ chave, valor: valorSerializado });
        sucessoIndexedDB = true;
    } catch (e) { console.error('Falha ao salvar configuração no IndexedDB:', chave, e); }

    // Relógio por chave: permite distinguir uma exclusão legítima de um
    // valor antigo ressurgindo de outro aparelho. É metadado técnico e não
    // contém o conteúdo da configuração.
    if (afetaSincronizacao && !['aurora_config_modificados_em', 'aurora_config_excluidas_em'].includes(chave)) {
        try {
            const registro = await db.configuracoes.get('aurora_config_modificados_em');
            let mapa = {};
            try { mapa = JSON.parse(registro?.valor || localStorage.getItem('aurora_config_modificados_em') || '{}'); } catch (_) { mapa = {}; }
            mapa[chave] = Date.now();
            const serializado = JSON.stringify(mapa);
            await db.configuracoes.put({ chave: 'aurora_config_modificados_em', valor: serializado });
            try { localStorage.setItem('aurora_config_modificados_em', serializado); } catch (_) { /* IndexedDB basta */ }
        } catch (e) { console.error('Falha ao registrar versão da configuração:', chave, e); }
    }

    // Evita recursão em 'aurora_atualizado_em'; afetaSincronizacao=false é
    // para configs cosméticas que não devem contar como "dado novo".
    if (chave !== 'aurora_atualizado_em' && afetaSincronizacao) await marcarAtualizacaoLocal(imediato);

    return sucessoLocal || sucessoIndexedDB;
}

// Remove uma configuração (localStorage + IndexedDB) e sincroniza a
// remoção. Usado para resets parciais (termômetro, contrato — ver
// js/preservacao.js). Proteção permanente: só deixa apagar chaves que
// estão explicitamente na lista branca de js/preservacao.js — qualquer
// outra chave (dado do pedido, vídeo, fotos, cartas, mensagens, easter
// eggs, etc.) é recusada, mesmo que alguma função tente no futuro.
async function excluirConfiguracao(chave, imediato = true) {
    // Só permite apagar se js/preservacao.js confirmar explicitamente que a
    // chave está na lista branca de chaves resetáveis. Se preservacao.js não
    // tiver sido carregado nesta página por algum motivo, o padrão é RECUSAR
    // (nunca permitir por omissão) — protege mesmo que essa checagem falhe.
    const podeApagar = typeof chaveConfigPodeSerApagada === 'function' && chaveConfigPodeSerApagada(chave);
    if (!podeApagar) {
        console.error(`excluirConfiguracao bloqueada: "${chave}" é um dado permanente (ou a proteção de js/preservacao.js não está carregada) e não pode ser apagado por nenhum reset.`);
        return false;
    }
    const agora = Date.now();
    try { localStorage.removeItem(chave); } catch (e) { console.error('Falha ao remover do localStorage:', chave, e); }
    try {
        const registro = await db.configuracoes.get('aurora_config_excluidas_em');
        let mapa = {};
        try { mapa = JSON.parse(registro?.valor || localStorage.getItem('aurora_config_excluidas_em') || '{}'); } catch (_) { mapa = {}; }
        mapa[chave] = agora;
        const serializado = JSON.stringify(mapa);
        await db.transaction('rw', db.configuracoes, async () => {
            await db.configuracoes.delete(chave);
            await db.configuracoes.put({ chave: 'aurora_config_excluidas_em', valor: serializado });
        });
        try { localStorage.setItem('aurora_config_excluidas_em', serializado); } catch (_) { /* IndexedDB basta */ }
    } catch (e) { console.error('Falha ao registrar exclusão da configuração:', chave, e); }
    await marcarAtualizacaoLocal(imediato);
}

async function obterConfiguracao(chave) {
    // IndexedDB é a fonte de verdade. localStorage é apenas um espelho de
    // recuperação rápida; preferi-lo podia ressuscitar um valor antigo após
    // uma restauração concluída no banco.
    try {
        const registro = await db.configuracoes.get(chave);
        if (registro) {
            const valor = typeof registro.valor === 'string' ? registro.valor : JSON.stringify(registro.valor);
            try { if (localStorage.getItem(chave) !== valor) localStorage.setItem(chave, valor); } catch (_) { /* espelho opcional */ }
            return valor;
        }
    } catch (e) {
        await registrarDiagnosticoSeguro('db.ler_configuracao', e, { chave: String(chave).slice(0, 80) });
    }
    try {
        const local = localStorage.getItem(chave);
        if (local !== null) {
            try { await db.configuracoes.put({ chave, valor: local }); } catch (_) { /* mantém fallback */ }
            return local;
        }
    } catch (_) { /* nenhum armazenamento disponível */ }
    return null;
}

/* ---------------- Armazenamento persistente e estimativa de espaço ----------------
   Pede ao navegador para não apagar os dados do site sob pressão de espaço. */
async function solicitarArmazenamentoPersistente() {
    if (!(navigator.storage && navigator.storage.persist)) {
        return { suportado: false, concedido: false };
    }
    try {
        const jaPersistente = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        if (jaPersistente) return { suportado: true, concedido: true, jaEstava: true };
        const concedido = await navigator.storage.persist();
        return { suportado: true, concedido };
    } catch (e) {
        console.error('Falha ao solicitar armazenamento persistente:', e);
        return { suportado: true, concedido: false, erro: String(e) };
    }
}

async function obterEstimativaArmazenamento() {
    if (!(navigator.storage && navigator.storage.estimate)) return null;
    try {
        const estimativa = await navigator.storage.estimate();
        return {
            usadoMB: estimativa.usage ? +(estimativa.usage / (1024 * 1024)).toFixed(1) : null,
            totalMB: estimativa.quota ? +(estimativa.quota / (1024 * 1024)).toFixed(1) : null
        };
    } catch (e) {
        console.error('Falha ao obter estimativa de armazenamento:', e);
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        db,
        gerarCodigoDiagnostico,
        registrarDiagnosticoSeguro,
        marcarAtualizacaoLocal,
        salvarMedia,
        obterMedia,
        obterMediaPorTipo,
        excluirMedia,
        salvarConfiguracao,
        excluirConfiguracao,
        obterConfiguracao
    };
}
