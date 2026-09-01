/**
 * PRESENCA.JS — "Os dois online agora" + Recadinho (com histórico e
 * recado pra quem entrar depois)
 * ----------------------------------------------------------------------
 * Indicador discreto e fixo no canto (ver #presencaIndicador em index.html
 * e .presenca-indicador em css/style.css). Usa o recurso de Presence do
 * Supabase Realtime (mesmo projeto já usado em js/sync.js para o backup
 * na nuvem — reaproveita SUPABASE_URL e SUPABASE_ANON_KEY de lá).
 * Presence não precisa de nenhuma tabela: cada aba entra num "canal"
 * compartilhado e o Supabase avisa a todo mundo quem mais está
 * conectado, em tempo real, via WebSocket.
 *
 * Importante: como o site não tem login, não dá pra saber COM CERTEZA se
 * as duas conexões são de fato Ana e Gabriel (podem ser duas abas da
 * mesma pessoa) — é só uma aproximação razoável, não uma garantia.
 *
 * RECADINHO: tocar no indicador abre um campo pra mandar uma mensagem
 * curta — funciona a qualquer momento, mesmo sozinho no site. Duas
 * camadas trabalham juntas:
 *   1) Broadcast do Supabase Realtime, no mesmo canal da presença — se a
 *      outra pessoa estiver com o site aberto agora, a mensagem chega
 *      instantaneamente, sem precisar recarregar nada.
 *   2) Um arquivo JSON no MESMO bucket do Supabase Storage já usado pelo
 *      backup (ver RECADOS_ARQUIVO abaixo) guarda cada recado enviado —
 *      isso dá um histórico de tudo que já foi trocado E faz o papel de
 *      "recado pra quem entrar depois": se ninguém mais estava online na
 *      hora do envio, o recado fica esperando ali e aparece sozinho,
 *      automaticamente, assim que a outra pessoa abrir "Nossa História"
 *      (ver verificarRecadosPendentes, chamada em goToRomancePage no
 *      js/romance.js) — sem precisar dos dois online ao mesmo tempo.
 *
 * Como o site não tem login, quem "recebe" um recado pendente é definido
 * pelo APARELHO, não pela pessoa: guardamos localmente (localStorage) os
 * ids dos recados que ESTE aparelho enviou, pra nunca mostrar de volta
 * pra quem escreveu como se fosse uma mensagem nova recebida (ver
 * recadoFoiEnviadoPorMim/recadoMarcarComoEnviadoPorMim). Igual ao resto
 * do site, isso é uma aproximação razoável pra um casal sem login, não
 * uma garantia absoluta.
 *
 * Antes de cada gravação, o histórico remoto é relido, unido por id e
 * confirmado por uma nova leitura. Uma corrida simultânea é repetida uma
 * vez; falhas de rede nunca viram uma lista vazia gravável.
 */
const PRESENCA_CANAL = 'aurora-presenca';

// Arquivo de recados na nuvem — mesmo bucket do backup (SUPABASE_BUCKET,
// ver js/sync.js), mesmo padrão de nome fixo do EXPERIENCE_ID (js/config.js).
const RECADOS_ARQUIVO = `${typeof EXPERIENCE_ID !== 'undefined' ? EXPERIENCE_ID : 'aurora'}-recados.json`;
const RECADOS_LIMITE_HISTORICO = 200; // trunca os mais antigos além disso, pra o arquivo não crescer sem limite
const RECADOS_ENVIADOS_POR_MIM_CHAVE = 'aurora_recados_enviados_por_mim';

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

// Guarda o(s) último(s) recado(s) recebido(s)/pendente(s) nesta aba, só
// pra poder mostrar um preview curto deles quando a pessoa aperta
// "Responder" (sempre em relação ao mais recente do lote).
let recadoUltimoRecebido = null;

// Cache local do histórico completo (carregado da nuvem uma vez por
// sessão e mantido atualizado conforme novos recados são enviados ou
// recebidos) — usado tanto pra render do histórico quanto pra achar
// pendentes.
let recadosCache = { mensagens: [] };
let recadosCacheCarregado = false;

function estaEmNossaHistoria() {
    const romancePage = document.getElementById('romancePage');
    return !!romancePage && getComputedStyle(romancePage).display !== 'none';
}

// Indicador só faz sentido dentro de "Nossa História" (onde antes ficava
// o botão de som) — nas telas anteriores (loja/checkout) ele fica sempre
// escondido. Diferente de antes, agora ele fica visível mesmo sozinho
// (texto/ícone mudam conforme o estado), porque tocar nele sempre serve
// pra alguma coisa: deixar um recado esperando, mesmo sem ninguém do
// outro lado agora.
function atualizarIndicadorPresenca(totalConexoes) {
    presencaUltimoTotal = totalConexoes;
    const el = document.getElementById('presencaIndicador');
    if (!el) return;

    const osDoisOnline = totalConexoes >= 2;
    el.classList.toggle('visivel', estaEmNossaHistoria());
    el.classList.toggle('online-agora', osDoisOnline);

    const ponto = document.getElementById('presencaIndicadorPonto');
    if (ponto) ponto.classList.toggle('d-none', !osDoisOnline);

    const texto = document.getElementById('presencaIndicadorTexto');
    if (texto) texto.textContent = osDoisOnline ? 'Os dois online agora' : 'Deixar um recado';

    el.setAttribute('aria-label', osDoisOnline ? 'Os dois online agora — abrir recadinho' : 'Deixar um recado pra quando a outra pessoa entrar');
}

// Chamada por js/romance.js assim que "Nossa História" é exibida, pra
// reavaliar a visibilidade com a contagem mais recente já conhecida.
function refrescarIndicadorPresenca() {
    atualizarIndicadorPresenca(presencaUltimoTotal);
}

/* ------------------------- Guarda-local de "enviado por mim" ------------------------- */

function recadosEnviadosPorMimObter() {
    try {
        const bruto = localStorage.getItem(RECADOS_ENVIADOS_POR_MIM_CHAVE);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (e) { return []; }
}

function recadoMarcarComoEnviadoPorMim(id) {
    try {
        const lista = recadosEnviadosPorMimObter();
        lista.push(id);
        // Mantém só os últimos 300 ids — não precisa crescer pra sempre.
        const cortada = lista.slice(-300);
        localStorage.setItem(RECADOS_ENVIADOS_POR_MIM_CHAVE, JSON.stringify(cortada));
    } catch (e) { /* localStorage indisponível — no pior caso, este aparelho pode ver de volta o próprio recado enviado, sem quebrar nada */ }
}

function recadoFoiEnviadoPorMim(id) {
    return recadosEnviadosPorMimObter().includes(id);
}

/* ------------------------- Nuvem: ler/gravar o arquivo de recados ------------------------- */

function recadosCaminhoLeitura() {
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${RECADOS_ARQUIVO}?t=${Date.now()}`;
}
function recadosCaminhoEscrita() {
    return `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${RECADOS_ARQUIVO}`;
}

// Só 404 significa "ainda não há histórico". Uma falha de rede nunca é
// convertida em lista vazia, pois isso permitiria sobrescrever recados
// existentes com um arquivo incompleto na tentativa seguinte.
async function recadosBuscarDaNuvem() {
    if (!syncEstaConfigurado()) return { mensagens: [] };
    const resposta = await fetch(recadosCaminhoLeitura());
    if (resposta.status === 404) return { mensagens: [] };
    if (!resposta.ok) throw new Error(`Falha ao ler recados (${resposta.status}).`);
    const dados = await resposta.json();
    if (!dados || !Array.isArray(dados.mensagens)) throw new Error('Histórico de recados inválido; gravação bloqueada para preservar os dados atuais.');
    return dados;
}

function recadosMesclarPreservando(...fontes) {
    const porId = new Map();
    for (const fonte of fontes) {
        for (const mensagem of fonte?.mensagens || []) {
            if (!mensagem?.id) continue;
            const anterior = porId.get(mensagem.id);
            porId.set(mensagem.id, anterior
                ? Object.assign({}, anterior, mensagem, { entregue: Boolean(anterior.entregue || mensagem.entregue) })
                : Object.assign({}, mensagem));
        }
    }
    const mensagens = Array.from(porId.values())
        .sort((a, b) => String(a.enviadoEm || '').localeCompare(String(b.enviadoEm || '')))
        .slice(-RECADOS_LIMITE_HISTORICO);
    return { mensagens, atualizadoEm: new Date().toISOString() };
}

async function recadosSalvarNaNuvem(dados) {
    if (!syncEstaConfigurado()) return false;
    const idsObrigatorios = new Set((dados?.mensagens || []).map(m => m.id).filter(Boolean));
    for (let tentativa = 0; tentativa < 2; tentativa++) {
        try {
            const atual = await recadosBuscarDaNuvem();
            const unido = recadosMesclarPreservando(atual, dados);
            const resposta = await fetch(recadosCaminhoEscrita(), {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'x-upsert': 'true'
                },
                body: JSON.stringify(unido)
            });
            if (!resposta.ok) throw new Error(`Falha ao gravar recados (${resposta.status}).`);

            // Confirma por releitura. Se outro aparelho gravou ao mesmo
            // tempo e venceu a corrida, a segunda tentativa une de novo.
            const confirmado = await recadosBuscarDaNuvem();
            const idsConfirmados = new Set(confirmado.mensagens.map(m => m.id));
            if ([...idsObrigatorios].every(id => idsConfirmados.has(id))) {
                recadosCache = recadosMesclarPreservando(confirmado, unido);
                recadosCacheCarregado = true;
                return true;
            }
        } catch (e) {
            console.warn('Não consegui salvar o recado na nuvem sem risco de sobrescrever o histórico.', e);
            if (typeof registrarDiagnosticoSeguro === 'function') await registrarDiagnosticoSeguro('recados_salvar', e, { tentativa: tentativa + 1 });
        }
    }
    return false;
}

// Garante que recadosCache está carregado (uma vez por sessão é
// suficiente pro histórico; verificarRecadosPendentes sempre busca uma
// cópia fresca da nuvem separadamente, pra não perder recados enviados
// de outro aparelho entre uma checagem e outra).
async function recadosGarantirCacheCarregado() {
    if (recadosCacheCarregado) return recadosCache;
    try {
        recadosCache = await recadosBuscarDaNuvem();
        recadosCacheCarregado = true;
    } catch (e) {
        console.warn('Histórico de recados indisponível; mantendo o cache local sem gravar por cima da nuvem.', e);
        if (typeof registrarDiagnosticoSeguro === 'function') await registrarDiagnosticoSeguro('recados_ler', e);
    }
    return recadosCache;
}

/* ------------------------- Recadinho: compor/enviar ------------------------- */

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

    // Avisa que, mesmo sozinho no site agora, o recado não se perde —
    // só não chega na hora (fica esperando na nuvem).
    const aviso = document.getElementById('recadoOfflineAviso');
    if (aviso) aviso.classList.toggle('d-none', presencaUltimoTotal >= 2);

    const input = document.getElementById('recadoTextoInput');
    if (input) { input.value = ''; input.focus(); }
    const status = document.getElementById('recadoEnviarStatus');
    if (status) { status.textContent = ''; status.className = 'save-status mt-2'; }
}

// respondendo=true pula direto pro campo de texto, já com a pessoa
// "oposta" a quem mandou o último recado (ver btnResponderRecado);
// respondendo=false (abertura pelo indicador) sempre volta pro picker
// do zero.
function abrirRecadoCompose(respondendo) {
    const overlay = document.getElementById('recadoComposeOverlay');
    if (!overlay) return;
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();

    // Histórico começa fechado toda vez que o overlay abre, mas já
    // atualiza o cache em segundo plano pra estar pronto se a pessoa
    // tocar em "Ver histórico".
    const historicoWrap = document.getElementById('recadoHistoricoWrap');
    const historicoToggle = document.getElementById('btnAlternarHistoricoRecados');
    if (historicoWrap) historicoWrap.classList.add('d-none');
    if (historicoToggle) historicoToggle.setAttribute('aria-expanded', 'false');
    recadosGarantirCacheCarregado();

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

// Envia o recado: sempre grava no histórico da nuvem primeiro (é isso
// que garante que ele nunca se perde, mesmo sem ninguém do outro lado
// agora) e, se a outra pessoa estiver online neste instante, também
// manda por broadcast pra chegar instantaneamente.
async function enviarRecadoAtual() {
    const input = document.getElementById('recadoTextoInput');
    const status = document.getElementById('recadoEnviarStatus');
    const botao = document.getElementById('btnEnviarRecado');
    const texto = input ? input.value.trim() : '';
    if (!texto || !recadoPessoaEscolhida) return;

    if (botao) botao.disabled = true;
    if (status) { status.textContent = 'Enviando...'; status.className = 'save-status mt-2'; }

    const mensagem = {
        id: gerarIdUnico('recado'),
        de: recadoPessoaEscolhida,
        texto,
        enviadoEm: new Date().toISOString(),
        entregue: false
    };

    // Este aparelho é quem está enviando — nunca deve ver este recado de
    // volta como se fosse "recebido" (ver verificarRecadosPendentes).
    recadoMarcarComoEnviadoPorMim(mensagem.id);

    // Atualiza o cache local e persiste na nuvem (é o que vira histórico
    // e recado-pra-quem-entrar-depois).
    await recadosGarantirCacheCarregado();
    recadosCache.mensagens.push(mensagem);
    if (recadosCache.mensagens.length > RECADOS_LIMITE_HISTORICO) {
        recadosCache.mensagens = recadosCache.mensagens.slice(-RECADOS_LIMITE_HISTORICO);
    }
    const salvouNaNuvem = await recadosSalvarNaNuvem(recadosCache);

    // Broadcast: só faz sentido (e só existe canal) se os dois estiverem
    // online agora — entrega instantânea, além da nuvem.
    if (presencaCanalAtivo && presencaUltimoTotal >= 2) {
        try {
            presencaCanalAtivo.send({ type: 'broadcast', event: 'recado', payload: mensagem });
        } catch (e) { /* nuvem já salvou o recado, não é crítico se o broadcast falhar */ }
    }

    if (botao) botao.disabled = false;
    if (status) {
        if (salvouNaNuvem) {
            status.textContent = presencaUltimoTotal >= 2 ? 'Enviado!' : 'Enviado! Vai aparecer assim que a outra pessoa entrar.';
            status.className = 'save-status ok mt-2';
        } else {
            status.textContent = presencaUltimoTotal >= 2 ? 'Enviado (mas não consegui guardar no histórico — sem internet?).' : 'Não consegui enviar agora (sem internet?) — tenta de novo em instantes.';
            status.className = 'save-status err mt-2';
        }
    }
    renderizarHistoricoRecados();
    setTimeout(fecharRecadoCompose, salvouNaNuvem ? 1100 : 1800);
}

/* ------------------------- Recadinho: receber (na hora ou pendente) ------------------------- */

// Mostra um ou mais recados de uma vez no overlay de recebido. Chamada
// tanto pelo broadcast em tempo real (lista de 1 item) quanto por
// verificarRecadosPendentes (pode ser mais de um, se a pessoa ficou
// offline por um tempo e mais de um recado foi deixado esperando).
function exibirRecadosRecebidos(lista) {
    const mensagens = (lista || []).filter(m => m && m.texto);
    if (!mensagens.length) return;
    recadoUltimoRecebido = mensagens[mensagens.length - 1];

    const overlay = document.getElementById('recadoRecebidoOverlay');
    const container = document.getElementById('recadoRecebidoLista');
    const eyebrow = document.getElementById('recadoRecebidoEyebrow');
    if (!overlay || !container) return;

    if (eyebrow) eyebrow.textContent = mensagens.length > 1 ? `Chegaram ${mensagens.length} recadinhos` : 'Chegou um recadinho';

    container.innerHTML = mensagens.map((m) => {
        const nome = m.de === 'gabriel' ? NOME_DELE : NOME_DELA_APELIDO;
        const textoEscapado = escaparHtml(m.texto);
        return `
            <div class="recado-recebido-item">
                <p class="recado-recebido-de">${nome} mandou um recado:</p>
                <p class="recado-recebido-texto">${textoEscapado}</p>
            </div>
        `;
    }).join('');

    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();
}

// Compatibilidade: mantém o nome antigo usado pelo listener de broadcast.
function exibirRecadoRecebido(payload) {
    exibirRecadosRecebidos([payload]);
}

function fecharRecadoRecebido() {
    const overlay = document.getElementById('recadoRecebidoOverlay');
    if (!overlay) return;
    overlay.classList.add('d-none');
    desbloquearScrollFundoLembranca();
}

// Chamada em goToRomancePage (js/romance.js) toda vez que "Nossa
// História" é exibida: busca uma cópia fresca do histórico na nuvem e
// mostra qualquer recado ainda não entregue que NÃO tenha sido enviado
// por este próprio aparelho — é isso que faz um recado deixado com o
// site offline aparecer sozinho pra outra pessoa assim que ela entrar,
// mesmo que os dois nunca tenham ficado online ao mesmo tempo.
async function verificarRecadosPendentes() {
    if (!syncEstaConfigurado()) return;
    let dados;
    try { dados = await recadosBuscarDaNuvem(); }
    catch (e) {
        if (typeof registrarDiagnosticoSeguro === 'function') await registrarDiagnosticoSeguro('recados_pendentes', e);
        return;
    }
    recadosCache = dados;
    recadosCacheCarregado = true;

    const pendentes = dados.mensagens.filter(m => !m.entregue && !recadoFoiEnviadoPorMim(m.id));
    if (!pendentes.length) return;

    exibirRecadosRecebidos(pendentes);

    // Marca como entregues e persiste — assim não aparecem de novo pra
    // mais ninguém (nem pra este aparelho, num recarregamento futuro).
    const idsPendentes = new Set(pendentes.map(m => m.id));
    dados.mensagens = dados.mensagens.map(m => idsPendentes.has(m.id) ? { ...m, entregue: true } : m);
    recadosCache = dados;
    await recadosSalvarNaNuvem(dados);
}

/* ------------------------- Histórico (dentro do compose) ------------------------- */

function formatarDataHoraRecado(iso) {
    try {
        return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
}

async function renderizarHistoricoRecados() {
    const lista = document.getElementById('recadoHistoricoLista');
    if (!lista) return;
    const dados = await recadosGarantirCacheCarregado();
    const mensagens = (dados.mensagens || []).slice().reverse();

    if (!mensagens.length) {
        lista.innerHTML = `<p class="recado-historico-vazio">Nenhum recado trocado ainda — o primeiro fica guardado aqui.</p>`;
        return;
    }

    lista.innerHTML = mensagens.map((m) => {
        const nome = m.de === 'gabriel' ? NOME_DELE : NOME_DELA_APELIDO;
        const textoEscapado = escaparHtml(m.texto).replace(/\n/g, '<br>');
        return `
            <div class="recado-historico-item">
                <div class="recado-historico-item-topo">
                    <span class="recado-historico-item-de">${nome}</span>
                    <span class="recado-historico-item-data">${formatarDataHoraRecado(m.enviadoEm)}</span>
                </div>
                <p class="recado-historico-item-texto">${textoEscapado}</p>
            </div>
        `;
    }).join('');
}

function alternarHistoricoRecados() {
    const wrap = document.getElementById('recadoHistoricoWrap');
    const toggle = document.getElementById('btnAlternarHistoricoRecados');
    const toggleTexto = document.getElementById('recadoHistoricoToggleTexto');
    if (!wrap || !toggle) return;
    const abrindo = wrap.classList.contains('d-none');
    wrap.classList.toggle('d-none', !abrindo);
    toggle.setAttribute('aria-expanded', String(abrindo));
    if (toggleTexto) toggleTexto.textContent = abrindo ? 'Esconder histórico de recados' : 'Ver histórico de recados';
    if (abrindo) renderizarHistoricoRecados();
}

/* ------------------------- Ligação dos toques ------------------------- */

// Liga os toques: indicador abre o recado (sempre, mesmo sozinho — ver
// atualizarIndicadorPresenca), botões do picker, enviar, responder,
// fechar e o toggle do histórico. Não depende do Supabase estar
// disponível — só conecta os elementos da tela; enviarRecadoAtual() já
// trata a falta de nuvem/canal sozinha.
function iniciarRecadoUI() {
    const indicador = document.getElementById('presencaIndicador');
    if (indicador) {
        const abrir = () => abrirRecadoCompose(false);
        indicador.addEventListener('click', abrir);
        indicador.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
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

    const btnHistorico = document.getElementById('btnAlternarHistoricoRecados');
    if (btnHistorico) btnHistorico.addEventListener('click', alternarHistoricoRecados);
}

function iniciarPresenca() {
    // Liga os toques do recadinho sempre, mesmo sem Supabase disponível
    // (o indicador funciona a qualquer momento agora; sem nuvem/canal,
    // enviarRecadoAtual() e verificarRecadosPendentes() simplesmente não
    // conseguem persistir/checar nada, sem quebrar o resto do site).
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

        // Recadinho em tempo real: broadcast no mesmo canal da presença
        // (ver seção acima). Por padrão o Supabase Realtime não ecoa o
        // broadcast de volta pra quem enviou, então não precisa de
        // nenhuma checagem extra pra ignorar o próprio recado aqui — mas
        // também marcamos como "enviado por mim" no envio (ver
        // enviarRecadoAtual), que é o que protege o histórico/pendentes.
        canal.on('broadcast', { event: 'recado' }, ({ payload }) => {
            exibirRecadoRecebido(payload);
            // Já chegou na hora — não precisa aparecer de novo depois
            // como "pendente" pra este mesmo aparelho num recarregamento.
            if (payload && payload.id) {
                recadosCache.mensagens = (recadosCache.mensagens || []).map(m => m.id === payload.id ? { ...m, entregue: true } : m);
                if (!recadosCache.mensagens.some(m => m.id === payload.id)) recadosCache.mensagens.push({ ...payload, entregue: true });
            }
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
