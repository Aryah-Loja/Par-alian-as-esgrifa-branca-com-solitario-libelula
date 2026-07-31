/**
 * ============================================================================
 * DB.JS — Armazenamento local (IndexedDB via Dexie)
 * ============================================================================
 * ARQUITETURA NOVA (substitui a versão antiga que guardava tudo dentro de
 * um único registro/array no IndexedDB).
 *
 * Por que a versão antiga falhava no Safari/iPhone?
 * Ela guardava vários Blobs (vídeo, áudio, imagens) dentro de UM único
 * campo de array de UM único registro. Alguns navegadores baseados em
 * WebKit (Safari, inclusive no iPhone) têm um histórico de bugs ao
 * serializar/deserializar Blobs aninhados dentro de arrays/objetos
 * complexos no IndexedDB — especialmente após um reload de página ou em
 * abas privadas. O resultado: dados corrompidos ou simplesmente perdidos.
 *
 * A solução usada aqui: CADA mídia é o seu PRÓPRIO registro, no seu
 * próprio nível superior, com sua própria chave primária. Isso é o
 * padrão recomendado para Blobs em IndexedDB e funciona de forma
 * consistente em Safari, Chrome, Android e iPhone.
 *
 * Estrutura das tabelas (stores):
 *   - media:            um registro por item de mídia (vídeo do pedido,
 *                        assinatura, mensagens para o futuro, lembranças).
 *                        Campos: id, tipo, blob, mimeType, texto, criadoEm.
 *   - configuracoes:     pares chave/valor pequenos (datas, estágio atual,
 *                        regras do contrato, respostas do quiz).
 *
 * Toda escrita de mídia é seguida de uma LEITURA DE CONFIRMAÇÃO — só
 * consideramos "salvo" depois de reler o dado do banco com sucesso.
 * ============================================================================
 */

const db = new Dexie('AuroraDB');

// Robustez para múltiplas abas/páginas abertas ao mesmo tempo no mesmo
// aparelho (ex.: index.html e checklist.html em abas diferentes). Sem
// isso, se uma futura versão do schema precisar rodar um upgrade, uma
// aba com conexão antiga aberta pode travar a outra indefinidamente.
db.on('blocked', () => {
    console.warn('AuroraDB: upgrade bloqueado por outra aba/página aberta com uma versão mais antiga do banco. Feche as outras abas do site e recarregue esta página.');
});
db.on('versionchange', () => {
    // Outra aba abriu uma versão mais nova do banco de dados; fecha esta
    // conexão para não deixar a outra aba travada esperando.
    db.close();
    console.warn('AuroraDB: uma versão mais nova do banco foi aberta em outra aba. Esta conexão foi fechada — recarregue a página se algo parar de responder.');
});

// v1 = estrutura antiga (mantida apenas para permitir migração automática
// de quem já tinha aberto o site antes desta atualização).
db.version(1).stores({ arquivos: 'id' });

// v2 = nova estrutura, um registro por item de mídia.
db.version(2).stores({
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave'
}).upgrade(async (tx) => {
    // Migração automática: se existiam registros na tabela antiga
    // ('arquivos'), tenta reaproveitá-los na nova estrutura.
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
        // Migração concluída com sucesso: limpa a tabela antiga para não
        // deixar vídeo/áudio/fotos duplicados (uma cópia em 'arquivos',
        // outra em 'media') ocupando espaço de armazenamento pra sempre.
        // Só chega aqui se o loop acima terminou sem lançar exceção.
        await tx.table('arquivos').clear();
    } catch (e) {
        console.error('Migração da estrutura antiga falhou (não é crítico, o site continua funcionando):', e);
    }
});

/**
 * Marca "agora" como o momento da última alteração local (usado pela
 * sincronização — ver js/sync.js — para decidir se este aparelho tem
 * dados mais novos que a nuvem, ou vice-versa) e avisa o módulo de
 * sincronização para agendar um envio. Escreve direto nas tabelas (sem
 * passar por salvarConfiguracao) para não entrar em recursão.
 */
async function marcarAtualizacaoLocal(imediato = false) {
    const agora = String(Date.now());
    try { localStorage.setItem('aurora_atualizado_em', agora); } catch (e) { /* ignora */ }
    try { await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: agora }); } catch (e) { /* ignora */ }
    if (typeof agendarEnvioNuvem === 'function') agendarEnvioNuvem(imediato);
}

/**
 * Salva um item de mídia com verificação de integridade: escreve, depois
 * relê do banco para confirmar que os bytes realmente foram persistidos.
 * Retorna true/false.
 *
 * IMPORTANTE: dispara a sincronização IMEDIATAMENTE (sem esperar o
 * agrupamento de 1,2s) — vídeo, foto e áudio são ações únicas e raras,
 * bem diferente de configurações pequenas que podem mudar várias vezes
 * seguidas. Esperar aqui é o que causava vídeo/foto sumirem em outro
 * aparelho: se a pessoa travasse a tela ou trocasse de app logo depois
 * de gravar (comum no iPhone), o navegador suspendia o envio ainda
 * agendado antes dele sequer começar.
 */
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
        await marcarAtualizacaoLocal(true); // toda mídia salva com sucesso conta como uma etapa concluída — sincroniza na hora
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
// Usadas para dados pequenos (datas, estágio, seleção de regras, respostas
// do quiz). localStorage continua funcionando como cache rápido/síncrono,
// mas o IndexedDB é a fonte de verdade redundante — se o localStorage for
// limpo pelo navegador (comum em Safari após dias de inatividade), ainda
// recuperamos daqui.
// `imediato`: use `true` para marcos importantes (ex.: data do pedido,
// estágio "final") que não podem correr o risco de ficar só no timer de
// 1,2s agendado — o resto (respostas de quiz, regras do contrato) continua
// agrupado, para não martelar a rede a cada pequena mudança.
async function salvarConfiguracao(chave, valor, imediato = false, afetaSincronizacao = true) {
    // CORREÇÃO: antes, o localStorage recebia o valor já serializado
    // (JSON.stringify quando não era string), mas o IndexedDB recebia o
    // valor CRU. Se o localStorage fosse limpo pelo navegador (comum no
    // Safari após dias de inatividade) e a leitura caísse no fallback do
    // IndexedDB, obterConfiguracao() devolvia um tipo diferente do
    // esperado (array/objeto/booleano em vez de string) — quem fizesse
    // JSON.parse() nesse retorno recebia uma exceção e perdia o dado
    // silenciosamente (ex.: contador de easter eggs resetando). Agora os
    // dois armazenamentos recebem sempre a MESMA string serializada, então
    // obterConfiguracao() tem o mesmo retorno (string ou null) não importa
    // qual dos dois respondeu.
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

    // 'aurora_atualizado_em' é escrita diretamente por marcarAtualizacaoLocal/sincronizarNaAbertura;
    // evita chamar a si mesma em loop. `afetaSincronizacao = false` é para
    // configs puramente locais/cosméticas (ex.: quais easter eggs já foram
    // encontrados, se já visitou a loja antes) que NÃO devem contar como
    // "dado novo" para fins de sincronização/reset entre aparelhos.
    if (chave !== 'aurora_atualizado_em' && afetaSincronizacao) await marcarAtualizacaoLocal(imediato);

    // Retorna se pelo menos um dos dois armazenamentos confirmou a escrita
    // (antes esta função não informava nada ao chamador em caso de falha).
    return sucessoLocal || sucessoIndexedDB;
}

/**
 * Remove uma configuração pequena (localStorage + IndexedDB) e marca a
 * atualização local (imediata), para que a remoção também sincronize com
 * o outro aparelho na próxima vez que o backup for enviado à nuvem —
 * assim como salvarConfiguracao() faz para uma escrita. Usado para resets
 * PARCIAIS (ex.: só o contrato de namoro), diferente do reset total do
 * site (que limpa as tabelas inteiras — ver publicarResetNaNuvem/
 * limparArmazenamentoLocal em js/sync.js).
 */
async function excluirConfiguracao(chave, imediato = true) {
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
        // Blindagem: registros gravados ANTES da correção acima podem ter
        // guardado o valor cru (array/objeto/booleano) em vez da string
        // serializada. Normaliza aqui também, para que o contrato de
        // retorno desta função seja sempre "string ou null" — mesmo para
        // dados que já estavam salvos de forma inconsistente.
        return typeof registro.valor === 'string' ? registro.valor : JSON.stringify(registro.valor);
    } catch (e) {
        console.error('Falha ao ler configuração:', chave, e);
        return null;
    }
}

/* ---------------- Armazenamento persistente e estimativa de espaço ----------------
   Pede ao navegador para NÃO apagar automaticamente os dados deste site
   sob pressão de espaço (o que o Safari, em especial, faz com dados "não
   persistentes" após dias de inatividade). Nem todo navegador concede,
   mas pedir não tem efeito colateral negativo. Usado por main.js na
   inicialização e exibido em diagnostico.html. */
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
