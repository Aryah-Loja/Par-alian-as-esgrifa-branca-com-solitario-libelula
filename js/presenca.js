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
 *
 * RECADINHO RÁPIDO: enquanto os dois estiverem online, tocar no indicador
 * abre um campo pra mandar uma mensagem curta, que aparece na hora na
 * tela do outro (com opção de responder). Usa broadcast do Supabase
 * Realtime no MESMO canal da presença (nenhuma tabela nova, nenhum
 * histórico salvo) — só chega a quem estiver com o site aberto agora; se
 * a pessoa não estiver conectada naquele instante, a mensagem se perde
 * (não é uma caixa de mensagens, é um "toc-toc" na hora).
 */
const PRESENCA_CANAL = 'aurora-presenca';

// Guarda a última contagem recebida do Supabase pra poder reavaliar a
// visibilidade sem precisar de um novo evento de presença — por exemplo,
// quando a pessoa entra em "Nossa História" bem depois de a outra pessoa
// já estar conectada (nenhum evento novo dispara nesse momento).
let presencaUltimoTotal = 0;

// Referência ao canal do Supabase já inscrito, guardada aqui pra
// enviarRecadoAtual() conseguir usar canal.send(...) sem precisar
// recriar o canal — só fica preenchida depois de 'SUBSCRIBED'.
let presencaCanalAtivo = null;

// 'gabriel' | 'ana' — escolhida no picker do recado ou herdada
// automaticamente ao tocar em "Responder" (vira a pessoa oposta a quem
// mandou o último recado recebido).
let recadoPessoaEscolhida = null;

// Guarda o último recado recebido nesta aba, só pra poder mostrar um
// preview curto dele quando a pessoa aperta "Responder".
let recadoUltimoRecebido = null;

function estaEmNossaHistoria() {
    const romancePage = document.getElementById('romancePage');
    return !!romancePage && getComputedStyle(romancePage).display !== 'none';
}

// Indicador só faz sentido dentro de "Nossa História" (onde antes ficava
// o botão de som) — nas telas anteriores (loja/checkout) ele fica sempre
// escondido, mesmo que os dois já estejam conectados.
function atualizarIndicadorPresenca(totalConexoes) {
    presencaUltimoTotal = totalConexoes;
    const el = document.getElementById('presencaIndicador');
    if (!el) return;
    el.classList.toggle('visivel', totalConexoes >= 2 && estaEmNossaHistoria());
}

// Chamada por js/romance.js assim que "Nossa História" é exibida, pra
// reavaliar a visibilidade com a contagem mais recente já conhecida.
function refrescarIndicadorPresenca() {
    atualizarIndicadorPresenca(presencaUltimoTotal);
}

/* ------------------------- Recadinho rápido ------------------------- */

// Volta o overlay de escrever pro estado inicial: escolher quem está
// mandando (Gabriel ou Poloni).
function recadoMostrarEscolhaPessoa() {
    const escolha = document.getElementById('recadoEscolhaPessoa');
    const escrever = document.getElementById('recadoEscreverBloco');
    if (escolha) escolha.classList.remove('d-none');
    if (escrever) escrever.classList.add('d-none');
}

// Mostra o campo de texto já sabendo quem está escrevendo — chamada
// tanto ao escolher a pessoa no picker quanto (automaticamente) ao
// responder um recado recebido.
function recadoMostrarBlocoEscrever(pessoa) {
    recadoPessoaEscolhida = pessoa;

    const escolha = document.getElementById('recadoEscolhaPessoa');
    const escrever = document.getElementById('recadoEscreverBloco');
    if (escolha) escolha.classList.add('d-none');
    if (escrever) escrever.classList.remove('d-none');

    const rotulo = document.getElementById('recadoEscrevendoComo');
    if (rotulo) rotulo.textContent = `Escrevendo como ${pessoa === 'gabriel' ? NOME_DELE : NOME_DELA_APELIDO}:`;

    const preview = document.getElementById('recadoRespondendoPreview');
    if (preview) {
        if (recadoUltimoRecebido && recadoUltimoRecebido.texto) {
            const trecho = recadoUltimoRecebido.texto.length > 80
                ? `${recadoUltimoRecebido.texto.slice(0, 80)}…`
                : recadoUltimoRecebido.texto;
            preview.textContent = `Respondendo: "${trecho}"`;
            preview.classList.remove('d-none');
        } else {
            preview.classList.add('d-none');
        }
    }

    const input = document.getElementById('recadoTextoInput');
    if (input) { input.value = ''; input.focus(); }
    const status = document.getElementById('recadoEnviarStatus');
    if (status) { status.textContent = ''; status.className = 'save-status mt-2'; }
}

// respondendo=true pula direto pro campo de texto, já com a pessoa
// "oposta" a quem mandou o último recado (ver btnResponderRecado);
// respondendo=false (abertura pelo indicador de presença) sempre volta
// pro picker do zero.
function abrirRecadoCompose(respondendo) {
    const overlay = document.getElementById('recadoComposeOverlay');
    if (!overlay) return;
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();

    if (respondendo && recadoUltimoRecebido) {
        const outraPessoa = recadoUltimoRecebido.de === 'gabriel' ? 'ana' : 'gabriel';
        recadoMostrarBlocoEscrever(outraPessoa);
    } else {
        recadoUltimoRecebido = null;
        recadoMostrarEscolhaPessoa();
    }
}

function fecharRecadoCompose() {
    const overlay = document.getElementById('recadoComposeOverlay');
    if (!overlay) return;
    overlay.classList.add('d-none');
    desbloquearScrollFundoLembranca();
}

// Envia o texto digitado pro outro aparelho via broadcast (não fica
// salvo em lugar nenhum — se ninguém mais estiver conectado agora, a
// mensagem simplesmente não chega a ninguém).
function enviarRecadoAtual() {
    const input = document.getElementById('recadoTextoInput');
    const status = document.getElementById('recadoEnviarStatus');
    const texto = input ? input.value.trim() : '';
    if (!texto || !recadoPessoaEscolhida) return;

    if (!presencaCanalAtivo) {
        if (status) { status.textContent = 'Sem conexão com o outro aparelho agora — tenta de novo em instantes.'; status.className = 'save-status err mt-2'; }
        return;
    }

    presencaCanalAtivo.send({
        type: 'broadcast',
        event: 'recado',
        payload: { de: recadoPessoaEscolhida, texto, enviadoEm: new Date().toISOString() },
    });

    if (status) { status.textContent = 'Enviado!'; status.className = 'save-status ok mt-2'; }
    setTimeout(fecharRecadoCompose, 900);
}

// Chamada pelo listener de broadcast 'recado' (ver iniciarPresenca
// abaixo) assim que uma mensagem chega do outro aparelho.
function exibirRecadoRecebido(payload) {
    if (!payload || !payload.texto) return;
    recadoUltimoRecebido = payload;

    const overlay = document.getElementById('recadoRecebidoOverlay');
    if (!overlay) return;
    const de = document.getElementById('recadoRecebidoDe');
    const textoEl = document.getElementById('recadoRecebidoTexto');
    if (de) de.textContent = `${payload.de === 'gabriel' ? NOME_DELE : NOME_DELA_APELIDO} mandou um recado:`;
    if (textoEl) textoEl.textContent = payload.texto;

    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();
}

function fecharRecadoRecebido() {
    const overlay = document.getElementById('recadoRecebidoOverlay');
    if (!overlay) return;
    overlay.classList.add('d-none');
    desbloquearScrollFundoLembranca();
}

// Liga os toques: indicador de presença abre o recado (só quando os
// dois estão online), botões do picker, enviar, responder e fechar.
// Não depende do Supabase estar disponível — só conecta os elementos da
// tela; enviarRecadoAtual() já trata a falta de canal sozinha.
function iniciarRecadoUI() {
    const indicador = document.getElementById('presencaIndicador');
    if (indicador) {
        const abrirSeOnline = () => { if (presencaUltimoTotal >= 2) abrirRecadoCompose(false); };
        indicador.addEventListener('click', abrirSeOnline);
        indicador.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirSeOnline(); } });
    }

    const btnGabriel = document.getElementById('btnRecadoSouGabriel');
    if (btnGabriel) btnGabriel.addEventListener('click', () => recadoMostrarBlocoEscrever('gabriel'));
    const btnAna = document.getElementById('btnRecadoSouAna');
    if (btnAna) btnAna.addEventListener('click', () => recadoMostrarBlocoEscrever('ana'));

    const btnFecharCompose = document.getElementById('btnFecharRecadoCompose');
    if (btnFecharCompose) btnFecharCompose.addEventListener('click', fecharRecadoCompose);
    const btnEnviar = document.getElementById('btnEnviarRecado');
    if (btnEnviar) btnEnviar.addEventListener('click', enviarRecadoAtual);

    const btnResponder = document.getElementById('btnResponderRecado');
    if (btnResponder) btnResponder.addEventListener('click', () => { fecharRecadoRecebido(); abrirRecadoCompose(true); });
    const btnFecharRecebido = document.getElementById('btnFecharRecadoRecebido');
    if (btnFecharRecebido) btnFecharRecebido.addEventListener('click', fecharRecadoRecebido);
}

function iniciarPresenca() {
    // Liga os toques do recadinho sempre, mesmo sem Supabase disponível
    // (o indicador só fica clicável quando presencaUltimoTotal >= 2, o
    // que só acontece se o canal abaixo funcionar de verdade).
    iniciarRecadoUI();

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

        // Recadinho rápido: broadcast no mesmo canal da presença (ver
        // seção acima). Por padrão o Supabase Realtime não ecoa o
        // broadcast de volta pra quem enviou, então não precisa de
        // nenhuma checagem extra pra ignorar o próprio recado.
        canal.on('broadcast', { event: 'recado' }, ({ payload }) => {
            exibirRecadoRecebido(payload);
        });

        canal.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                presencaCanalAtivo = canal;
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
        presencaCanalAtivo = null;
        try { canal.unsubscribe(); } catch (e) { /* já desconectado, sem problema */ }
    });
}
