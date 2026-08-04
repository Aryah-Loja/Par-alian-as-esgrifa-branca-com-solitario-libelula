/**
 * PRESERVACAO.JS — Separação entre dados PERMANENTES e TEMPORÁRIOS.
 *
 * O pedido já aconteceu: este site nunca mais vai ser reutilizado para
 * outra pessoa, então, a partir de agora, é um registro histórico. Regra
 * central deste arquivo: por padrão, NADA pode ser apagado por um reset ou
 * pela ferramenta de diagnóstico — só as chaves explicitamente listadas em
 * CHAVES_CONFIG_RESETAVEIS abaixo (hoje: o termômetro do dia e, por um
 * botão separado com sua própria senha/confirmação, o contrato de namoro).
 * Tudo o mais (data/horário/local do pedido, vídeo, assinatura, fotos,
 * "momentos", cartas, mensagens, mural, códigos especiais, easter eggs
 * desbloqueados, checklist e qualquer outro conteúdo sentimental) fica
 * protegido automaticamente, sem precisar listar cada chave uma por uma.
 *
 * excluirConfiguracao() (js/db.js) consulta chaveConfigPodeSerApagada()
 * antes de apagar qualquer coisa, e limparArmazenamentoLocal() (js/sync.js,
 * usada tanto pelo botão de reset quanto pela detecção de reset remoto)
 * usa só as funções deste arquivo — nunca `db.media.clear()`,
 * `db.configuracoes.clear()` nem `localStorage.clear()` soltos.
 */

// Únicas chaves de configuração que alguma função de reset tem permissão
// de apagar. Qualquer chave fora desta lista é recusada por
// excluirConfiguracao() (js/db.js), mesmo que alguém tente no futuro.
const CHAVES_CONFIG_RESETAVEIS = [
    'aurora_termometro_lista',  // reset do termômetro do dia (discreto, diagnóstico)
    'aurora_regras_contrato'    // reset do contrato de namoro (botão próprio, com senha)
];

// Chaves puramente técnicas (cache de descoberta da Galeria) — não são
// conteúdo sentimental, só uma otimização que se refaz sozinha na próxima
// abertura. Podem ser limpas livremente junto com o reset do termômetro.
const CHAVES_CONFIG_CACHE_TECNICO = ['aurora_galeria_cache_v1'];

function chaveConfigPodeSerApagada(chave) {
    return CHAVES_CONFIG_RESETAVEIS.includes(chave) || CHAVES_CONFIG_CACHE_TECNICO.includes(chave);
}

/* ----------------------------------------------------------------------
   DADOS PERMANENTES DO PEDIDO
   ----------------------------------------------------------------------
   Grava (de novo, sempre) os 3 valores fixos definidos em js/config.js
   (DATA_PEDIDO_OFICIAL, HORARIO_PEDIDO_OFICIAL, LOCAL_PEDIDO_OFICIAL) nas
   configurações do site. Chamada em toda abertura da página (index.html e
   diagnostico.html) — então mesmo que algo em algum momento apague ou
   corrompa 'aurora_data_pedido'/'aurora_horario_pedido'/'aurora_local_pedido',
   a próxima abertura já corrige sozinha, sem depender de nenhuma ação manual.
   Usa afetaSincronizacao=false porque este valor é sempre igual em qualquer
   aparelho — não é "dado novo" que precise disparar uma sincronização. */
async function garantirDadosPermanentesDoPedido() {
    try {
        await salvarConfiguracao('aurora_data_pedido', DATA_PEDIDO_OFICIAL, false, false);
        await salvarConfiguracao('aurora_horario_pedido', HORARIO_PEDIDO_OFICIAL, false, false);
        await salvarConfiguracao('aurora_local_pedido', LOCAL_PEDIDO_OFICIAL, false, false);
    } catch (e) {
        console.error('Falha ao gravar os dados permanentes do pedido (não deve impedir o resto do site):', e);
    }
}

/* ----------------------------------------------------------------------
   RESET DO TERMÔMETRO (único dado realmente temporário do site)
   ---------------------------------------------------------------------- */
async function resetarTermometroDoDia() {
    await excluirConfiguracao('aurora_termometro_lista', true);
}

/* ----------------------------------------------------------------------
   LIMPEZA SEGURA DE CACHE TÉCNICO
   ----------------------------------------------------------------------
   sessionStorage e a Cache API do navegador (SW/assets) também são seguros
   de limpar por completo: nenhum dos dois guarda dado permanente do
   projeto, só coisas que o navegador refaz sozinho. */
async function limparCacheTecnico() {
    for (const chave of CHAVES_CONFIG_CACHE_TECNICO) {
        try { localStorage.removeItem(chave); } catch (e) { /* ignora */ }
        try { await db.configuracoes.delete(chave); } catch (e) { /* ignora */ }
    }
    try { sessionStorage.clear(); } catch (e) { /* ignora */ }
    try {
        if (window.caches && caches.keys) {
            const nomes = await caches.keys();
            await Promise.all(nomes.map(nome => caches.delete(nome)));
        }
    } catch (e) { /* ignora */ }
}
