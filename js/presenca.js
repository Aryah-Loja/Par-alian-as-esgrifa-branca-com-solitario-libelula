/**
 * PRESENCA.JS — "Os dois online agora"
 * ----------------------------------------------------------------------
 * Indicador discreto e fixo no canto (ver #presencaIndicador em index.html
 * e .presenca-indicador em css/style.css) que aparece só quando há mais de
 * uma aba/aparelho conectado ao mesmo tempo — ou seja, quando dá pra supor
 * que Ana e Gabriel estão no site juntos, agora.
 *
 * Usa o recurso de Presence do Supabase Realtime (mesmo projeto já usado
 * em js/sync.js para o backup na nuvem — reaproveita SUPABASE_URL e
 * SUPABASE_ANON_KEY de lá). Presence não precisa de nenhuma tabela: cada
 * aba entra num "canal" compartilhado e o Supabase avisa a todo mundo
 * quem mais está conectado, em tempo real, via WebSocket.
 *
 * Importante: como o site não tem login, não dá pra saber COM CERTEZA se
 * as duas conexões são de fato Ana e Gabriel (podem ser duas abas da
 * mesma pessoa) — é só uma aproximação razoável, não uma garantia.
 */
const PRESENCA_CANAL = 'aurora-presenca';

function atualizarIndicadorPresenca(totalConexoes) {
    const el = document.getElementById('presencaIndicador');
    if (!el) return;
    el.classList.toggle('visivel', totalConexoes >= 2);
}

function iniciarPresenca() {
    // Precisa do cliente do Supabase (carregado via CDN em index.html) e
    // das mesmas credenciais já usadas pelo backup na nuvem (js/sync.js).
    if (typeof window.supabase === 'undefined' || !syncEstaConfigurado()) return;

    let canal;
    try {
        const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const chaveDaAba = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        canal = cliente.channel(PRESENCA_CANAL, { config: { presence: { key: chaveDaAba } } });

        canal.on('presence', { event: 'sync' }, () => {
            const estado = canal.presenceState();
            atualizarIndicadorPresenca(Object.keys(estado).length);
        });

        canal.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await canal.track({ entrou_em: new Date().toISOString() });
            }
        });
    } catch (e) {
        console.warn('Indicador de presença indisponível (sem internet ou Supabase fora do ar) — sem problema, o resto do site funciona normal.', e);
        return;
    }

    // Ao fechar/trocar de aba, sai do canal pra não ficar "fantasma"
    // contando presença de quem já saiu.
    window.addEventListener('beforeunload', () => {
        try { canal.unsubscribe(); } catch (e) { /* já desconectado, sem problema */ }
    });
}
