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

// Marca "agora" como última alteração local (usado por js/sync.js para
// decidir quem tem dados mais novos) e agenda o envio à nuvem.
async function marcarAtualizacaoLocal(imediato = false) {
    const agora = String(Date.now());
    try { localStorage.setItem('aurora_atualizado_em', agora); } catch (e) { /* ignora */ }
    try { await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: agora }); } catch (e) { /* ignora */ }
    if (typeof agendarEnvioNuvem === 'function') agendarEnvioNuvem(imediato);
}

// Salva um item de mídia e relê do banco para confirmar a integridade.
// Sincroniza imediatamente (sem agrupar), já que mídia é uma ação rara.
async function salvarMedia(registro) {
    if (!registro || !registro.id) throw new Error('salvarMedia requer um id');
    registro.criadoEm = registro.criadoEm || Date.now();

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
    try { return await db.media.get(id); } catch (e) { console.error(`Falha ao ler mídia "${id}":`, e); return null; }
}

async function obterMediaPorTipo(tipo) {
    try { return await db.media.where('tipo').equals(tipo).toArray(); } catch (e) { console.error(`Falha ao listar mídias do tipo "${tipo}":`, e); return []; }
}

async function excluirMedia(id) {
    try {
        await db.media.delete(id);
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
    try { localStorage.removeItem(chave); } catch (e) { console.error('Falha ao remover do localStorage:', chave, e); }
    try { await db.configuracoes.delete(chave); } catch (e) { console.error('Falha ao remover configuração do IndexedDB:', chave, e); }
    await marcarAtualizacaoLocal(imediato);
}

async function obterConfiguracao(chave) {
    try {
        const local = localStorage.getItem(chave);
        if (local !== null) return local;
    } catch (e) { /* segue para o IndexedDB */ }
    try {
        const registro = await db.configuracoes.get(chave);
        if (!registro) return null;
        // Normaliza para string mesmo se o valor salvo não for uma string.
        return typeof registro.valor === 'string' ? registro.valor : JSON.stringify(registro.valor);
    } catch (e) {
        console.error('Falha ao ler configuração:', chave, e);
        return null;
    }
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
