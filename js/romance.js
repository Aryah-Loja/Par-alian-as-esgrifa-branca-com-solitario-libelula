/**
 * ============================================================================
 * ROMANCE.JS — Página "Nossa História"
 * ============================================================================
 * Reúne: contador vivo do relacionamento, timeline com fotos, "nossos
 * momentos", playlist, quiz, seleção de regras do contrato, lembranças
 * (prints salvos pelo usuário), cápsula do tempo e o easter egg do
 * sobrenome.
 * ============================================================================
 */

/* ---------------- Contador vivo do relacionamento ---------------- */
function calcularDuracaoRelacionamento(inicioIso) {
    const inicio = new Date(inicioIso);
    const agora = new Date();
    let anos = agora.getFullYear() - inicio.getFullYear();
    let meses = agora.getMonth() - inicio.getMonth();
    let dias = agora.getDate() - inicio.getDate();
    let horas = agora.getHours() - inicio.getHours();
    let minutos = agora.getMinutes() - inicio.getMinutes();
    let segundos = agora.getSeconds() - inicio.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }
    if (dias < 0) { const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate(); dias += ultimoDiaMesAnterior; meses--; }
    if (meses < 0) { meses += 12; anos--; }

    return { anos: Math.max(0, anos), meses: Math.max(0, meses), dias: Math.max(0, dias), horas, minutos, segundos };
}

async function obterOuCriarDataPrimeiroAcesso() {
    let data = await obterConfiguracao('aurora_primeiro_acesso');
    if (!data) { data = new Date().toISOString(); await salvarConfiguracao('aurora_primeiro_acesso', data); }
    return data;
}

let contadorVivoIntervalo = null;
async function iniciarContadorVivo() {
    const grid = document.getElementById('liveCounterGrid');
    if (!grid) return;
    if (contadorVivoIntervalo) clearInterval(contadorVivoIntervalo);
    const dataInicio = await obterOuCriarDataPrimeiroAcesso();

    function atualizar() {
        const d = calcularDuracaoRelacionamento(dataInicio);
        document.getElementById('lcAnos').textContent = d.anos;
        document.getElementById('lcMeses').textContent = d.meses;
        document.getElementById('lcDias').textContent = d.dias;
        document.getElementById('lcHoras').textContent = String(d.horas).padStart(2, '0');
        document.getElementById('lcMinutos').textContent = String(d.minutos).padStart(2, '0');
        document.getElementById('lcSegundos').textContent = String(d.segundos).padStart(2, '0');
    }
    atualizar();
    contadorVivoIntervalo = setInterval(atualizar, 1000);
}

/* ---------------- Timeline ---------------- */
/* ---------------- "Nosso céu" (timeline em forma de constelação) ----------------
 * Mesma fonte de dados de sempre (TIMELINE_MARCOS, em js/config.js) — só
 * muda a apresentação: em vez de uma lista, cada marco vira uma estrela
 * numa constelação. Tocar na estrela abre um modal com a foto e o texto
 * daquele momento (mesmo conteúdo de antes, só que revelado sob demanda).
 */
function renderizarTimeline() {
    const constelacao = document.getElementById('ceuConstelacao');
    const fundo = document.getElementById('ceuFundoEstrelas');
    if (!constelacao) return;
    constelacao.innerHTML = '<span id="dataPedidoTimeline" class="d-none"></span>';

    // Estrelinhas de fundo, só decorativas (não clicáveis) — geradas uma
    // vez, posição e tamanho aleatórios, pra dar o clima de céu de verdade.
    if (fundo && !fundo.dataset.gerado) {
        fundo.dataset.gerado = '1';
        const TOTAL_ESTRELAS_FUNDO = 45;
        for (let i = 0; i < TOTAL_ESTRELAS_FUNDO; i++) {
            const estrela = document.createElement('span');
            estrela.className = 'ceu-estrela-fundo';
            estrela.style.left = `${Math.random() * 100}%`;
            estrela.style.top = `${Math.random() * 100}%`;
            const tamanho = 1 + Math.random() * 1.6;
            estrela.style.width = `${tamanho}px`;
            estrela.style.height = `${tamanho}px`;
            estrela.style.animationDelay = `${Math.random() * 4}s`;
            fundo.appendChild(estrela);
        }
    }

    // Zigue-zague descendo a tela — dá o efeito de constelação sem
    // depender de coordenadas fixas (funciona com qualquer quantidade de
    // marcos, caso a timeline cresça no futuro).
    const PADRAO_X = [22, 68, 32, 74, 26, 64]; // posições em % alternando pros dois lados, repete se precisar
    const ESPACO_VERTICAL_PX = 92; // distância entre uma estrela e a próxima, descendo a tela
    TIMELINE_MARCOS.forEach((marco, i) => {
        const estrela = document.createElement('button');
        estrela.type = 'button';
        estrela.className = 'ceu-estrela' + (marco.ehPedido ? ' ceu-estrela-pedido' : '');
        estrela.style.left = `${PADRAO_X[i % PADRAO_X.length]}%`;
        estrela.style.top = `${i * ESPACO_VERTICAL_PX + 30}px`;
        estrela.innerHTML = `<span class="ceu-estrela-brilho"></span><span class="ceu-estrela-label">${marco.ehPedido ? 'Hoje' : (marco.data || '')}</span>`;
        estrela.addEventListener('click', () => abrirEstrelaModal(i));
        constelacao.appendChild(estrela);
    });

    // A altura do céu precisa acompanhar quantos marcos existem — cresce
    // sozinho se a timeline ganhar mais itens no futuro, sem cortar
    // nenhuma estrela nem sobrar espaço vazio demais.
    const container = document.getElementById('ceuEstreladoContainer');
    if (container) container.style.minHeight = `${TIMELINE_MARCOS.length * ESPACO_VERTICAL_PX + 100}px`;

    iniciarEstrelasCadentes();
    iniciarEasterEggDaLua();
}

/* ---------------- Easter egg da lua: 5 toques revelam uma mensagem em Morse ---------------- */
function iniciarEasterEggDaLua() {
    const lua = document.getElementById('ceuLua');
    const overlay = document.getElementById('luaEasterEggOverlay');
    if (!lua || !overlay || lua.dataset.easterEggIniciado) return;
    lua.dataset.easterEggIniciado = '1';

    const morseEl = document.getElementById('luaEasterEggMorse');

    contarToquesRepetidos(lua, 5, () => {
        morseEl.textContent = paraCodigoMorse(MENSAGEM_SECRETA_LUA);
        overlay.classList.remove('d-none');
        overlay.scrollTop = 0;
        bloquearScrollFundoLembranca();
        marcarEasterEggEncontrado('luaMorse');
    });

    const fecharLuaEasterEgg = () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); };
    document.getElementById('btnFecharLuaEasterEgg').addEventListener('click', fecharLuaEasterEgg);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fecharLuaEasterEgg(); });
}

// Estrelas cadentes: puramente decorativas, cruzam o céu de vez em
// quando pra dar mais profundidade, em posições/tempos/direções
// aleatórios que se repetem em loop.
function iniciarEstrelasCadentes() {
    const camada = document.getElementById('ceuEstrelasCadentes');
    if (!camada || camada.dataset.gerado) return;
    camada.dataset.gerado = '1';

    const TOTAL_CADENTES = 5;
    for (let i = 0; i < TOTAL_CADENTES; i++) {
        const cadente = document.createElement('span');
        cadente.className = 'ceu-estrela-cadente';

        // Cruza de um lado do céu até o outro: às vezes indo pra direita,
        // às vezes pra esquerda, sempre descendo um pouco, nunca sempre
        // o mesmo trajeto. Como se estivesse vindo de longe: a POSIÇÃO
        // INICIAL já fica fora da área visível (menos de 0% ou mais de
        // 100%), então o começo do trajeto acontece escondido pelo
        // overflow:hidden da camada, e a estrela só "aparece" quando já
        // está cruzando de verdade, em vez de simplesmente surgir do nada
        // já dentro do céu.
        const indoDireita = Math.random() < 0.5;
        const distanciaX = 220 + Math.random() * 180; // 220 a 400px de travessia, cruzando de fora pra dentro e seguindo pro outro lado
        const dx = indoDireita ? distanciaX : -distanciaX;
        const dy = 50 + Math.random() * 110; // sempre descendo um pouco, em graus variados

        // CORREÇÃO (risco branco "sobrando" onde não devia): o rastro
        // (::before) antes sempre apontava pra um lado fixo (esquerda),
        // então quando a estrela ia pra outro sentido, o rastro ficava
        // apontando pra FRENTE do movimento em vez de atrás dele — dava a
        // impressão de um traço solto, fora do lugar. Calculando o ângulo
        // de verdade a partir de (dx, dy) e girando o rastro 180° em
        // relação a ele, o rastro sempre fica atrás da estrela, não
        // importa a direção que ela cruzar.
        const anguloMovimento = Math.atan2(dy, dx) * (180 / Math.PI);
        const anguloRastro = anguloMovimento + 180;

        cadente.style.setProperty('--cadente-dx', `${dx}px`);
        cadente.style.setProperty('--cadente-dy', `${dy}px`);
        cadente.style.setProperty('--cadente-rastro-rot', `${anguloRastro}deg`);
        cadente.style.top = `${Math.random() * 55}%`;
        cadente.style.left = indoDireita ? `${-25 - Math.random() * 15}%` : `${115 + Math.random() * 15}%`;
        cadente.style.animationDelay = `${Math.random() * 8 + i * 3}s`;
        cadente.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
        camada.appendChild(cadente);
    }

    iniciarNaveAlienigena(camada);
}

/**
 * Easter egg raro: uma navezinha alienígena cruza o céu bem devagar, uma
 * vez a cada 3 minutos (tempo real, não só na abertura da página) — se
 * ela ficar olhando o céu por tempo suficiente, tem chance de ver.
 *
 * CORREÇÃO (ela mal andava e ficava só no canto): o "--nave-dx" era
 * definido em porcentagem (140%/-140%) e usado dentro de um
 * transform: translate(...) no CSS — só que porcentagem em translate()
 * é relativa ao tamanho do PRÓPRIO elemento sendo movido, não ao
 * tamanho da tela/contêiner. Como a navezinha tem só 46px de largura,
 * 140% disso é ~64px: ela nascia fora da tela, "tremia" uns 64px pro
 * lado e sumia, sem nunca realmente atravessar o céu — por isso parecia
 * aparecer pouco tempo e ficar presa num canto. Agora a distância é
 * calculada em pixels a partir da largura real do céu na tela (mais uma
 * folga extra pra nascer e morrer totalmente fora da vista), então ela
 * de fato atravessa a tela inteira de um lado a outro.
 */
function iniciarNaveAlienigena(camada) {
    const TRES_MINUTOS_MS = 3 * 60 * 1000;

    function cruzarUmaVez() {
        if (!document.body.contains(camada)) return; // saiu da página "Nossa História" — não continua gerando em segundo plano
        const nave = document.createElement('div');
        nave.className = 'ceu-nave-alienigena';
        nave.innerHTML = '<span class="ceu-nave-cupula"></span><span class="ceu-nave-corpo"></span><span class="ceu-nave-luz ceu-nave-luz-1"></span><span class="ceu-nave-luz ceu-nave-luz-2"></span><span class="ceu-nave-luz ceu-nave-luz-3"></span>';
        const indoDireita = Math.random() < 0.5;
        nave.style.top = `${10 + Math.random() * 50}%`;
        nave.style.left = indoDireita ? '-20%' : '120%';

        // Distância real do trajeto: largura da camada do céu (ou da
        // janela, se por algum motivo a camada ainda não tiver tamanho)
        // mais uma folga extra, pra ela nascer e desaparecer totalmente
        // fora da vista dos dois lados, atravessando a tela toda.
        const largura = camada.getBoundingClientRect().width || window.innerWidth;
        const distancia = largura + 120;
        nave.style.setProperty('--nave-dx', `${indoDireita ? distancia : -distancia}px`);

        // Trajeto bem mais longo agora (tela inteira, não só ~64px) —
        // aumenta a duração da animação também, senão ela cruzaria rápido
        // demais e deixaria de parecer "bem devagar".
        nave.style.animationDuration = '16s';

        camada.appendChild(nave);
        nave.addEventListener('animationend', () => nave.remove());
    }

    setTimeout(cruzarUmaVez, 30000 + Math.random() * 60000); // primeira aparição entre 30s e 1min30s, pra não depender só de quem fica 3min+ olhando
    setInterval(cruzarUmaVez, TRES_MINUTOS_MS);
}

function iniciarFechamentoEstrelaModal() {
    const overlay = document.getElementById('estrelaModalOverlay');
    const fechar = document.getElementById('btnFecharEstrelaModal');
    if (!overlay || overlay.dataset.iniciado === '1') return;
    overlay.dataset.iniciado = '1';
    const fecharEstrelaModal = () => {
        overlay.classList.add('d-none');
        desbloquearScrollFundoLembranca();
        // Mesma correção do "espaço vazio/roxo no fim da tela" usada ao
        // fechar o lightbox de fotos e a lojinha (ver forcarRecalculoDeLayout()
        // em js/utils.js) — sem isso, fechar o modal às vezes deixava a
        // altura da página desatualizada, mostrando só a cor de fundo
        // escura/roxa por baixo, como se o conteúdo tivesse sumido.
        forcarRecalculoDeLayout();
    };
    fechar.addEventListener('click', fecharEstrelaModal);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fecharEstrelaModal(); });
}

// Guarda qual estrela está aberta no momento, pra "anterior"/"próxima"
// saberem de onde partir (ver estrelaModalAnterior/estrelaModalProxima).
let estrelaIndiceAtual = 0;

async function abrirEstrelaModal(indice) {
    const marco = TIMELINE_MARCOS[indice];
    if (!marco) return;
    estrelaIndiceAtual = indice;
    const overlay = document.getElementById('estrelaModalOverlay');
    // CORREÇÃO (site travando/fundo roxo ao usar "anterior"/"próxima"):
    // essa função também é chamada ao NAVEGAR entre lembranças com o modal
    // já aberto (estrelaModalAnterior/estrelaModalProxima), não só ao abrir
    // do zero. bloquearScrollFundoLembranca() usa contagem de referências
    // (ver js/utils.js) — travar de novo a cada troca de lembrança, sem um
    // desbloquear correspondente (só existe UM desbloquear, ao fechar o
    // modal), fazia a contagem nunca voltar a 0, deixando a trava de
    // scroll (aurora-scroll-lock) presa pra sempre depois de fechar. Só
    // trava aqui se o modal estava REALMENTE fechado antes desta chamada.
    const jaEstavaAberto = !overlay.classList.contains('d-none');
    const foto = document.getElementById('estrelaModalFoto');
    const dataEl = document.getElementById('estrelaModalData');
    const textoEl = document.getElementById('estrelaModalTexto');

    // Setas de navegação: escondidas nas pontas (não dá "próxima" na
    // última estrela nem "anterior" na primeira) — é uma linha do tempo,
    // então não faz sentido dar a volta como no lightbox de fotos.
    const btnAnterior = document.getElementById('btnEstrelaAnterior');
    const btnProxima = document.getElementById('btnEstrelaProxima');
    if (btnAnterior) btnAnterior.classList.toggle('d-none', indice <= 0);
    if (btnProxima) btnProxima.classList.toggle('d-none', indice >= TIMELINE_MARCOS.length - 1);

    // resolverFotoPlaceholderOuAsset (js/export.js) resolve a extensão real
    // do arquivo (.jpg/.jpeg/.png/.webp) em vez de assumir .jpg fixo.
    const fotoSrc = await resolverFotoPlaceholderOuAsset(marco.foto);
    foto.dataset.placeholderId = marco.foto;
    foto.onerror = function () {
        if (this.dataset.fallbackAplicado) return;
        this.dataset.fallbackAplicado = '1';
        this.src = gerarSvgPlaceholderComLegenda('Foto do momento');
    };
    foto.src = fotoSrc;

    const nomeEstrela = marco.ehPedido ? (document.getElementById('dataPedidoTimeline')?.textContent || 'Hoje') : (marco.data || '');
    dataEl.textContent = nomeEstrela;
    textoEl.textContent = marco.texto || '';
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0; // sempre abre mostrando o começo do texto, nunca no meio
    if (!jaEstavaAberto) bloquearScrollFundoLembranca();

    foto.onclick = async () => {
        const todasFotos = await Promise.all(TIMELINE_MARCOS.map(m => resolverFotoPlaceholderOuAsset(m.foto)));
        const todasLegendas = TIMELINE_MARCOS.map(m => m.ehPedido ? (document.getElementById('dataPedidoTimeline')?.textContent || 'Hoje') : (m.data || ''));
        abrirLightboxGaleria(todasFotos, indice, todasLegendas);
    };
}

function estrelaModalAnterior() {
    if (estrelaIndiceAtual > 0) abrirEstrelaModal(estrelaIndiceAtual - 1);
}
function estrelaModalProxima() {
    if (estrelaIndiceAtual < TIMELINE_MARCOS.length - 1) abrirEstrelaModal(estrelaIndiceAtual + 1);
}

// Setas do teclado (← →) navegam entre as estrelas enquanto o modal
// estiver aberto — só reage se o modal da estrela estiver visível, pra
// não capturar as setas quando a pessoa está em outra parte da página.
document.addEventListener('keydown', (evt) => {
    const overlay = document.getElementById('estrelaModalOverlay');
    if (!overlay || overlay.classList.contains('d-none')) return;
    if (evt.key === 'ArrowLeft') estrelaModalAnterior();
    else if (evt.key === 'ArrowRight') estrelaModalProxima();
});

/* ---------------- "Nossos momentos" (mesa de fotos) ---------------- */
async function iniciarGaleriaMomentos() {
    const galeria = document.getElementById('momentosGallery');
    if (!galeria) return;
    const cartoes = Array.from(galeria.querySelectorAll('.table-photo'));

    let fotos = [];
    try {
        fotos = await descobrirFotosParaDestaque();
    } catch (e) {
        fotos = [];
    }

    // CORREÇÃO ("é inaceitável espaço vazio"): a varredura rápida acima é
    // deliberadamente limitada (só a faixa de fotos, para de procurar ao
    // achar GALERIA_DESTAQUE_FOTOS_ALVO) para não pesar na home. Se por
    // qualquer motivo ela não achar fotos suficientes para preencher os 4
    // cartões, refaz a busca com a varredura COMPLETA e exaustiva (a
    // mesma que a página da Galeria usa, sem nenhum limite de tolerância
    // a buracos) antes de aceitar que realmente não há fotos.
    if (fotos.length < cartoes.length) {
        try {
            const todosOsItens = await galeriaEscanearCompleta(null, null);
            const todasAsFotos = todosOsItens.filter(item => item.tipo === 'foto').map(item => item.caminho);
            if (todasAsFotos.length > fotos.length) fotos = todasAsFotos;
        } catch (e) {
            // mantém o que a varredura rápida já tinha achado
        }
    }

    // Sorteia até 4 fotos, sem repetir nenhuma (embaralha e pega as
    // primeiras N) — toda vez que a página é aberta, uma seleção
    // diferente de momentos aparece aqui.
    const embaralhadas = fotos.slice().sort(() => Math.random() - 0.5);
    let escolhidas = embaralhadas.slice(0, cartoes.length);

    // CORREÇÃO (espaço vazio inaceitável): se existir pelo menos UMA foto
    // real mas menos de 4 no total (ex.: site recém-criado, ainda subindo
    // fotos), repete as que existem para preencher os 4 cartões em vez de
    // deixar quadros vazios com placeholder — só cai no placeholder "adicione
    // esta foto" se não existir NENHUMA foto real na galeria.
    if (escolhidas.length > 0 && escolhidas.length < cartoes.length) {
        const preenchidas = [];
        for (let i = 0; i < cartoes.length; i++) preenchidas.push(escolhidas[i % escolhidas.length]);
        escolhidas = preenchidas;
    }

    cartoes.forEach((cartao, i) => {
        const img = cartao.querySelector('img');
        if (escolhidas[i]) {
            img.src = escolhidas[i];
            img.alt = 'Foto do casal';
            cartao.classList.remove('d-none');
        } else {
            // Só chega aqui se a galeria não tiver NENHUMA foto real ainda
            // (site recém criado) — cai no mesmo SVG "adicione esta foto"
            // usado no resto do site, em vez de simplesmente sumir ou quebrar.
            aplicarImagemPlaceholder(img, null, 'Foto do casal');
        }
        cartao.style.cursor = escolhidas[i] ? 'pointer' : '';
        cartao.onclick = escolhidas[i] ? () => abrirLightboxGaleria(escolhidas, i) : null;
    });
}

/* ---------------- Quiz do casal ---------------- */
let quizIndiceAtual = 0;
let quizRespostasEscolhidas = [];
let quizAcertos = 0; // pontuação (item 3 do prompt de correções)

function renderizarQuizDots() {
    const dots = document.getElementById('quizDots');
    if (!dots) return;
    dots.innerHTML = '';
    QUIZ_PERGUNTAS.forEach((_, i) => {
        const span = document.createElement('span');
        if (i < quizIndiceAtual) span.classList.add('done');
        dots.appendChild(span);
    });
}

function mostrarPerguntaQuiz() {
    const p = QUIZ_PERGUNTAS[quizIndiceAtual];
    renderizarQuizDots();
    document.getElementById('quizPergunta').textContent = p.pergunta;

    const opcoesWrap = document.getElementById('quizOpcoes');
    opcoesWrap.innerHTML = '';
    const reacaoEl = document.getElementById('quizReacao');
    reacaoEl.textContent = ''; reacaoEl.classList.remove('visivel');

    p.opcoes.forEach((opcao, i) => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'quiz-opcao-btn'; btn.textContent = opcao;
        btn.addEventListener('click', () => responderQuiz(i, btn));
        opcoesWrap.appendChild(btn);
    });
}

async function responderQuiz(indiceEscolhido, btnClicado) {
    const p = QUIZ_PERGUNTAS[quizIndiceAtual];
    document.querySelectorAll('#quizOpcoes .quiz-opcao-btn').forEach(b => { b.disabled = true; });

    const acertou = indiceEscolhido === p.certa;
    if (acertou) quizAcertos++;
    btnClicado.classList.add('selecionada', acertou ? 'certa' : 'errada');
    quizRespostasEscolhidas.push({ pergunta: p.pergunta, resposta: p.opcoes[indiceEscolhido], acertou });

    const reacaoEl = document.getElementById('quizReacao');
    reacaoEl.textContent = acertou ? p.certoMsg : p.erradoMsg;
    reacaoEl.classList.add('visivel');

    if (acertou && typeof confetti === 'function') {
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 }, colors: ['#B76E79', '#FAF9F6', '#ffffff'] });
    }

    setTimeout(async () => {
        quizIndiceAtual++;
        if (quizIndiceAtual < QUIZ_PERGUNTAS.length) {
            mostrarPerguntaQuiz();
        } else {
            document.getElementById('quizCard').classList.add('d-none');
            const finalMsg = document.getElementById('quizFinalMsg');
            document.getElementById('quizPontuacaoTexto').textContent = `Você acertou ${quizAcertos} de ${QUIZ_PERGUNTAS.length}`;
            document.getElementById('quizResumoTexto').textContent =
                `O que importa mesmo é que a gente continua escrevendo essas respostas juntos, todos os dias, ${NOME_DELA}.`;
            finalMsg.classList.remove('d-none');
            finalMsg.classList.add('reveal-up');
            await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(quizRespostasEscolhidas));
        }
    }, 1600);
}

function iniciarQuiz() {
    quizIndiceAtual = 0; quizRespostasEscolhidas = []; quizAcertos = 0;
    document.getElementById('quizCard').classList.remove('d-none');
    document.getElementById('quizFinalMsg').classList.add('d-none');
    mostrarPerguntaQuiz();
}

/* ---------------- Regras do contrato ---------------- */
let regrasSelecionadas = [];
const MAX_REGRAS = 8; // até 8 regras personalizadas (item 4 do prompt de correções, era 5)
const MIN_REGRAS = 2;

function renderRulesGrid() {
    const grid = document.getElementById('rulesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    OPCOES_REGRAS_CONTRATO.forEach(op => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        card.dataset.id = op.id;
        card.innerHTML = `<div class="rule-check"><i class="bi bi-check-lg"></i></div><i class="bi ${op.icon} rule-icon"></i><p>${op.label}</p>`;
        card.addEventListener('click', () => toggleRegra(op.id, card));
        grid.appendChild(card);
    });
    atualizarEstadoSelecaoRegras();
}

function toggleRegra(id, card) {
    const idx = regrasSelecionadas.indexOf(id);
    if (idx >= 0) { regrasSelecionadas.splice(idx, 1); card.classList.remove('selecionada'); }
    else { if (regrasSelecionadas.length >= MAX_REGRAS) return; regrasSelecionadas.push(id); card.classList.add('selecionada'); }
    atualizarEstadoSelecaoRegras();
}

function atualizarEstadoSelecaoRegras() {
    const contador = document.getElementById('regrasContador');
    const btn = document.getElementById('btnGerarContrato');
    if (!contador || !btn) return;
    const n = regrasSelecionadas.length;
    contador.textContent = `${n} de ${MAX_REGRAS} selecionadas (mínimo ${MIN_REGRAS})`;
    btn.disabled = n < MIN_REGRAS;
    document.querySelectorAll('.rule-card').forEach(c => {
        const isSel = regrasSelecionadas.includes(c.dataset.id);
        c.classList.toggle('disabled', !isSel && n >= MAX_REGRAS);
    });
}

function gerarContratoPersonalizado(idsEscolhidos) {
    const lista = document.getElementById('contractArticlesList');
    if (!lista) return;
    lista.innerHTML = '';
    idsEscolhidos.forEach((id, i) => {
        const regra = OPCOES_REGRAS_CONTRATO.find(o => o.id === id);
        if (!regra) return;
        const li = document.createElement('li');
        li.innerHTML = `<strong>Art. ${i + 1}º —</strong> ${regra.artigo}`;
        lista.appendChild(li);
    });
    document.getElementById('regrasSelecaoWrap').classList.add('d-none');
    const contratoWrap = document.getElementById('contratoWrap');
    contratoWrap.classList.remove('d-none');
    setTimeout(() => contratoWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
}

async function prepararContrato() {
    renderRulesGrid();
    let salvo = null;
    try { salvo = JSON.parse(await obterConfiguracao('aurora_regras_contrato') || 'null'); } catch (e) { salvo = null; }

    if (Array.isArray(salvo) && salvo.length >= MIN_REGRAS) {
        regrasSelecionadas = salvo.slice(0, MAX_REGRAS);
        document.querySelectorAll('.rule-card').forEach(c => { if (regrasSelecionadas.includes(c.dataset.id)) c.classList.add('selecionada'); });
        atualizarEstadoSelecaoRegras();
        gerarContratoPersonalizado(regrasSelecionadas);
    }
}

/* ---------------- Cápsula do tempo ---------------- */
async function calcularDataDesbloqueioCapsula() {
    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    if (!dataPedidoIso) return null;
    const alvo = new Date(dataPedidoIso);
    alvo.setDate(alvo.getDate() + CAPSULA_DIAS_PARA_DESBLOQUEIO);
    return alvo;
}

async function prepararCapsulaDoTempo() {
    const wrap = document.getElementById('capsulaTempoWrap');
    if (!wrap) return;
    const dataAlvo = await calcularDataDesbloqueioCapsula();
    if (!dataAlvo) { wrap.classList.add('d-none'); return; }
    wrap.classList.remove('d-none');

    // Hora do servidor, não do aparelho — ver obterHoraConfiavel em
    // js/sync.js: evita que adiantar a data do celular abra a cápsula
    // antes da hora.
    const agora = await obterHoraConfiavel();
    const bloqueada = document.getElementById('capsulaBloqueada');
    const desbloqueada = document.getElementById('capsulaDesbloqueada');

    if (agora < dataAlvo) {
        bloqueada.classList.remove('d-none'); desbloqueada.classList.add('d-none');
        const diasRestantes = Math.max(1, Math.ceil((dataAlvo - agora) / 86400000));
        document.getElementById('capsulaContagem').textContent = diasRestantes === 1 ? 'falta 1 dia' : `faltam ${diasRestantes} dias`;
    } else {
        bloqueada.classList.add('d-none'); desbloqueada.classList.remove('d-none');
        iniciarEnvelopeCapsula();
    }
}

/**
 * CORREÇÃO DE SEGURANÇA: esta função revela o texto da carta (e o botão do
 * vídeo, se houver) — antes, ela confiava cegamente em quem a chamava
 * (só era chamada a partir do branch já "desbloqueado" de
 * prepararCapsulaDoTempo). Isso significa que alguém abrindo o console do
 * navegador e digitando "iniciarEnvelopeCapsula()" diretamente conseguia
 * pular a checagem de data inteira. Agora a própria função reconfere a
 * data (com a hora do servidor) antes de mostrar qualquer coisa — mesmo
 * chamada "na unha" pelo console, ela se recusa a abrir antes da hora.
 * Aviso importante (sem prometer o que este site não pode cumprir): isso
 * cobre bem o golpe mais comum (mudar a data/hora do aparelho) e impede
 * abrir o console e pular direto pra função de revelar. Mas como é um
 * site estático, sem servidor/autenticação por trás, alguém tecnicamente
 * capaz de abrir os arquivos-fonte (js/config.js) ainda consegue ler o
 * texto e o ID do vídeo antes da data — isso é uma limitação de QUALQUER
 * site que roda só no navegador, não uma falha específica deste código.
 */
async function iniciarEnvelopeCapsula() {
    const envelope = document.getElementById('capsulaEnvelope');
    const hint = document.getElementById('capsulaHint');
    const textoEl = document.getElementById('capsulaTexto');
    const assinaturaEl = document.getElementById('capsulaAssinatura');
    if (!envelope || envelope.dataset.iniciado === '1') return;

    // CORREÇÃO DE SEGURANÇA (achada testando de verdade, simulando alguém
    // chamando esta função pelo console do navegador): a checagem NUNCA
    // pode confiar no parâmetro "dataAlvoConhecida" recebido de fora —
    // ele existe só como otimização (evita recalcular quando quem chamou,
    // aqui dentro do próprio arquivo, já sabe a data). Se essa validação
    // usasse o valor recebido, bastava chamar
    // "iniciarEnvelopeCapsula(new Date(0))" no console pra passar uma
    // data forjada lá do passado e abrir a carta na hora. Por isso a
    // linha abaixo IGNORA por completo o parâmetro na hora de validar e
    // recalcula a data real (mesma fonte usada em prepararCapsulaDoTempo).
    const dataAlvoReal = await calcularDataDesbloqueioCapsula();
    const agora = await obterHoraConfiavel();
    if (!dataAlvoReal || agora < dataAlvoReal) return; // recusa revelar — reconfirmação real, não decorativa

    envelope.dataset.iniciado = '1';

    textoEl.textContent = textoCapsulaDoTempo();
    assinaturaEl.textContent = `Com amor, ${NOME_DELE}.`;

    // Vídeo do YouTube com a mensagem em vídeo pra cápsula do tempo (se um
    // ID tiver sido preenchido em CAPSULA_YOUTUBE_ID, js/config.js): entra
    // como opção pro abrirModoVela, no addEventListener de clique logo
    // abaixo — embutido ali dentro, junto do texto da carta (modo "luz de
    // vela"), não direto no envelope, que fica visível só um instante
    // antes desse overlay abrir.

    // CORREÇÃO (carta ficando "flutuando" na tela depois de fechar): esta
    // carta pode ser aberta e fechada várias vezes (ao contrário da carta
    // final, que só abre uma vez e segue direto pro flashback). Por isso
    // ela precisa VOLTAR ao estado fechado sempre que o modo vela for
    // fechado — tanto visualmente (o envelope fecha de novo) quanto no
    // controle interno (`emAnimacao`), senão um segundo toque no envelope
    // não fazia nada (ficava travado como "já abriu" pra sempre).
    let emAnimacao = false;
    function fecharEnvelopeCapsula() {
        emAnimacao = false;
        envelope.classList.remove('aberto');
        hint.classList.remove('visivel');
        setTimeout(() => hint.classList.add('visivel'), 600);
    }

    envelope.addEventListener('click', () => {
        if (emAnimacao) return; emAnimacao = true;
        hint.classList.remove('visivel');
        envelope.classList.add('aberto');

        // A carta abre direto no modo "luz de vela" (pedido explícito) — não
        // existe mais nenhuma versão "solta" da carta fora desse modo, então
        // ela nunca fica flutuando por cima da tela depois de fechada.
        setTimeout(() => {
            abrirModoVela('Um ano depois', textoEl.innerHTML, assinaturaEl.textContent, {
                aoFechar: fecharEnvelopeCapsula,
                videoYoutubeId: CAPSULA_YOUTUBE_ID ? extrairIdYoutube(CAPSULA_YOUTUBE_ID) : ''
            });
        }, 900);
    });

    requestAnimationFrame(() => { envelope.classList.add('envelope-visivel'); setTimeout(() => hint.classList.add('visivel'), 500); });
}

/* ---------------- Playlist do casal ---------------- */
let playlistIndiceAtual = 0;

function renderizarListaFaixasPlaylist() {
    const lista = document.getElementById('playlistTracklist');
    if (!lista) return;
    lista.innerHTML = '';
    PLAYLIST_FAIXAS.forEach((faixa, i) => {
        const item = document.createElement('div');
        item.className = 'playlist-track-item' + (i === playlistIndiceAtual ? ' ativa' : '');
        item.innerHTML = `<span><span class="pi-num">${String(i + 1).padStart(2, '0')}</span>${faixa.titulo}</span><i class="bi ${i === playlistIndiceAtual ? 'bi-soundwave' : 'bi-play-fill'}"></i>`;
        item.addEventListener('click', () => carregarFaixaPlaylist(i, true));
        lista.appendChild(item);
    });
}

function atualizarInfoFaixaAtualPlaylist() {
    const faixa = PLAYLIST_FAIXAS[playlistIndiceAtual];
    document.getElementById('playlistTitulo').textContent = faixa.titulo;
    document.getElementById('playlistArtista').textContent = faixa.artista;
    document.getElementById('playlistMotivo').textContent = faixa.motivo;
    renderizarListaFaixasPlaylist();
}

function atualizarBotaoPlayPausePlaylist(tocando) {
    const btn = document.getElementById('btnPlaylistPlayPause');
    if (!btn) return;
    btn.innerHTML = tocando ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
}

function carregarFaixaPlaylist(indice, autoplay) {
    playlistIndiceAtual = ((indice % PLAYLIST_FAIXAS.length) + PLAYLIST_FAIXAS.length) % PLAYLIST_FAIXAS.length;
    const audio = document.getElementById('playlistAudio');
    audio.src = getAsset(PLAYLIST_FAIXAS[playlistIndiceAtual].src);
    atualizarInfoFaixaAtualPlaylist();
    document.getElementById('playlistProgressoInner').style.width = '0%';
    document.getElementById('playlistTempoAtual').textContent = '0:00';
    document.getElementById('playlistTempoTotal').textContent = '0:00';

    if (autoplay) {
        const promessa = audio.play();
        if (promessa !== undefined) promessa.then(() => atualizarBotaoPlayPausePlaylist(true)).catch(() => atualizarBotaoPlayPausePlaylist(false));
    } else {
        atualizarBotaoPlayPausePlaylist(false);
    }
}

function togglePlaylistPlayPause() {
    const audio = document.getElementById('playlistAudio');
    if (!audio.src) { carregarFaixaPlaylist(playlistIndiceAtual, true); return; }
    if (audio.paused) {
        const promessa = audio.play();
        if (promessa !== undefined) promessa.then(() => atualizarBotaoPlayPausePlaylist(true)).catch(() => atualizarBotaoPlayPausePlaylist(false));
    } else { audio.pause(); atualizarBotaoPlayPausePlaylist(false); }
}

function playlistProximaFaixa() { carregarFaixaPlaylist(playlistIndiceAtual + 1, true); }
function playlistFaixaAnterior() { carregarFaixaPlaylist(playlistIndiceAtual - 1, true); }

function iniciarPlaylistDaGente() {
    const audio = document.getElementById('playlistAudio');
    if (!audio) return;
    if (audio.dataset.iniciado === '1') { atualizarInfoFaixaAtualPlaylist(); return; }
    audio.dataset.iniciado = '1';

    audio.addEventListener('timeupdate', () => {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        document.getElementById('playlistProgressoInner').style.width = pct + '%';
        document.getElementById('playlistTempoAtual').textContent = formatarTempoPlaylist(audio.currentTime);
        document.getElementById('playlistTempoTotal').textContent = formatarTempoPlaylist(audio.duration);
    });
    audio.addEventListener('ended', playlistProximaFaixa);

    const barra = document.getElementById('playlistProgressoOuter');
    barra.addEventListener('click', (evt) => {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        const rect = barra.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (evt.clientX - rect.left) / rect.width));
        audio.currentTime = pct * audio.duration;
    });

    document.getElementById('btnPlaylistPlayPause').addEventListener('click', togglePlaylistPlayPause);
    document.getElementById('btnPlaylistProxima').addEventListener('click', playlistProximaFaixa);
    document.getElementById('btnPlaylistAnterior').addEventListener('click', playlistFaixaAnterior);

    carregarFaixaPlaylist(0, false);
}

/* ---------------- Lembranças (prints de conversas antigas) ---------------- */
async function adicionarLembrancas(fileList) {
    const arquivos = Array.from(fileList || []).filter(f => f.type && f.type.startsWith('image/'));
    if (!arquivos.length) return;

    for (const file of arquivos) {
        const id = gerarIdUnico('lembranca');
        // Comprime antes de salvar: fotos de celular hoje em dia costumam vir
        // com vários MB, e isso soma rápido quando são várias lembranças —
        // corta bastante o tamanho sem perda visível na tela do celular.
        const { blob, mimeType } = await comprimirImagem(file);
        await salvarMedia({ id, tipo: 'lembranca', blob, mimeType });
    }
    renderizarLembrancas();
}

async function renderizarLembrancas() {
    const grid = document.getElementById('lembrancasGrid');
    const vazio = document.getElementById('lembrancasVazio');
    if (!grid) return;

    const lista = (await obterMediaPorTipo('lembranca')).sort((a, b) => a.criadoEm - b.criadoEm);
    grid.innerHTML = '';
    if (!lista.length) { vazio.classList.remove('d-none'); return; }
    vazio.classList.add('d-none');

    lista.forEach(item => {
        const url = URL.createObjectURL(item.blob);
        const wrapper = document.createElement('div');
        wrapper.className = 'lembranca-item-wrap';

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'lembranca-item';
        botao.innerHTML = `<img src="${url}" alt="Print de uma conversa antiga">`;

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.className = 'lembranca-item-excluir';
        btnExcluir.setAttribute('aria-label', 'Remover esta foto');
        btnExcluir.innerHTML = '<i class="bi bi-trash3-fill"></i>';
        btnExcluir.addEventListener('click', async (evt) => {
            evt.stopPropagation(); // não abre o lightbox ao clicar no "x"
            if (!confirm('Remover esta foto das lembranças? Essa ação não pode ser desfeita, e também remove ela do outro aparelho na próxima sincronização.')) return;
            btnExcluir.disabled = true;
            const ok = await excluirMedia(item.id); // já marca a atualização local e agenda o envio pra nuvem
            if (ok) {
                renderizarLembrancas();
            } else {
                btnExcluir.disabled = false;
                alert('Não consegui remover essa foto agora. Tenta de novo em instantes.');
            }
        });

        wrapper.appendChild(botao);
        wrapper.appendChild(btnExcluir);
        grid.appendChild(wrapper);
    });

    const urlsLembrancas = Array.from(grid.querySelectorAll('img')).map(img => img.src);
    grid.querySelectorAll('.lembranca-item').forEach((botao, i) => botao.addEventListener('click', () => abrirLightboxGaleria(urlsLembrancas, i)));
}

/* ---------------- Lightbox reutilizável ---------------- */
let lightboxItensAtuais = [];
let lightboxIndiceAtual = 0;
let lightboxLegendasAtuais = null;

// Trava de scroll (bloquearScrollFundoLembranca/desbloquearScrollFundoLembranca)
// agora mora em utils.js — é usada por praticamente todos os modais do site,
// não só pelo lightbox, então precisa estar disponível em qualquer página que
// carregue utils.js (index.html, galeria.html, checklist.html, diagnostico.html).

function abrirLightboxGaleria(itens, indiceInicial, legendas) {
    if (!itens || !itens.length) return;
    lightboxItensAtuais = itens;
    lightboxLegendasAtuais = Array.isArray(legendas) ? legendas : null;
    lightboxIndiceAtual = indiceInicial || 0;
    atualizarImagemLightbox();
    bloquearScrollFundoLembranca();
    document.getElementById('lembrancaLightbox').classList.remove('d-none');
}

function atualizarImagemLightbox() {
    document.getElementById('lembrancaLightboxImg').src = lightboxItensAtuais[lightboxIndiceAtual];
    const mostrarNav = lightboxItensAtuais.length > 1;
    document.getElementById('btnLightboxAnterior').classList.toggle('d-none', !mostrarNav);
    document.getElementById('btnLightboxProxima').classList.toggle('d-none', !mostrarNav);

    const legendaEl = document.getElementById('lembrancaLightboxLegenda');
    const legenda = lightboxLegendasAtuais ? lightboxLegendasAtuais[lightboxIndiceAtual] : '';
    if (legendaEl) {
        legendaEl.textContent = legenda || '';
        legendaEl.classList.toggle('d-none', !legenda);
    }
}

function lightboxFotoAnterior() { lightboxIndiceAtual = (lightboxIndiceAtual - 1 + lightboxItensAtuais.length) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function lightboxProximaFoto() { lightboxIndiceAtual = (lightboxIndiceAtual + 1) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function fecharLembrancaAmpliada() {
    document.getElementById('lembrancaLightbox').classList.add('d-none');
    document.getElementById('lembrancaLightboxImg').src = '';
    lightboxItensAtuais = [];
    lightboxLegendasAtuais = null;
    desbloquearScrollFundoLembranca();
    // Mesma correção do "espaço vazio/roxo no fim da tela" (ver
    // forcarRecalculoDeLayout() em js/utils.js): fechar o lightbox tira o
    // body do position:fixed do scroll-lock, e sem forçar esse reflow o
    // navegador às vezes mantém a altura antiga calculada, sobrando uma
    // faixa vazia com a cor de fundo escura até um F5 manual.
    forcarRecalculoDeLayout();
}

/* ---------------- Navegação para "Nossa História" ---------------- */
function pausarMusicaFundoImediatamente() {
    const audio = document.getElementById('musicaFundo');
    if (audio && !audio.paused) audio.pause();
}

/**
 * Tela de carregamento discreta de "Nossa História" — mostrada assim que a
 * página começa a montar (vídeo do pedido, assinatura, timeline, cápsula do
 * tempo, lembranças, mensagens pro futuro etc. — várias leituras no
 * IndexedDB) e escondida assim que tudo estiver pronto.
 */
function mostrarLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    const barra = document.getElementById('romanceLoadingBarra');
    if (barra) barra.style.width = '6%';
    if (overlay) { overlay.style.opacity = '1'; overlay.classList.remove('d-none'); }
    bloquearScrollFundoLembranca(); // mesma trava usada no lightbox — consistente em todo o site
}

function esconderLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    desbloquearScrollFundoLembranca();
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('d-none'), 300);
}

/**
 * Roda várias tarefas (promises) em PARALELO e avança a barra conforme cada
 * uma termina — dá um retrato real do progresso, em vez de uma barra
 * "fake" que só finge andar. Uma falha isolada não trava as demais.
 */
async function executarComBarraDeProgresso(tarefas) {
    const barra = document.getElementById('romanceLoadingBarra');
    const total = tarefas.length || 1;
    let concluidas = 0;
    const marcarProgresso = () => {
        concluidas++;
        if (barra) barra.style.width = `${Math.max(6, Math.round((concluidas / total) * 100))}%`;
    };
    await Promise.all(tarefas.map(tarefa =>
        Promise.resolve(tarefa)
            .then(marcarProgresso)
            .catch(err => { console.error('Falha ao carregar um item de Nossa História:', err); marcarProgresso(); })
    ));
}

async function goToRomancePage(primeiraVez) {
    document.getElementById('lojaScreen').style.display = 'none';
    document.getElementById('checkoutScreen').style.display = 'none';
    document.getElementById('suspenseOverlay').style.display = 'none';
    document.getElementById('processingOverlay').style.display = 'none';
    document.getElementById('romancePage').style.display = 'block';
    definirFundoBody(CORES_FUNDO.escuro);
    window.scrollTo(0, 0);
    mostrarLoadingRomance();

    document.getElementById('heroSubRomanceTexto').textContent = TEXTOS.heroSubRomance;
    document.getElementById('encerramentoRomanceTexto').textContent = TEXTOS.encerramentoRomance;

    // Só corta a música de fundo (a que tocou na revelação da carta) se
    // NÃO for a primeira vez chegando aqui — ou seja, em qualquer visita
    // depois do dia do pedido em si. Na primeira vez (vindo direto do
    // pedido de verdade), a música continua tocando naturalmente pra
    // dentro de "Nossa História", sem cortar de repente.
    if (!primeiraVez) pausarMusicaFundoImediatamente();
    iniciarPlaylistDaGente();

    // CORREÇÃO (item 1 do prompt de correções): só a partir daqui o
    // contador de girassóis pode aparecer (ver js/utils.js).
    ativarContadorEasterEggsFaseFinal();

    // Rápidas e sem leitura pesada no banco — chamadas direto, sem entrar na barra de progresso.
    iniciarQuiz();
    renderizarTimeline();
    iniciarFechamentoEstrelaModal();
    exibirEasterEggSobrenome();
    renderizarCoisasQueElaAma();
    renderizarSeusBichos();
    renderizarMapaDaRelacao();
    iniciarMapaModal();
    iniciarCartaDiscussao();
    iniciarAdjetivosParaEla();

    if (typeof VIDEO_PROCESSO_YOUTUBE_URL !== 'undefined' && VIDEO_PROCESSO_YOUTUBE_URL) {
        const iframeProcesso = document.getElementById('videoProcessoIframe');
        const wrapProcesso = document.getElementById('videoProcessoWrap');
        const idProcesso = extrairIdYoutube(VIDEO_PROCESSO_YOUTUBE_URL);
        if (iframeProcesso && wrapProcesso && idProcesso) {
            // Embutido dentro do site (mesmo esquema usado no vídeo do
            // pedido e na galeria) — não abre mais o app/site do YouTube.
            iframeProcesso.src = `https://www.youtube.com/embed/${idProcesso}?rel=0&modestbranding=1`;
            wrapProcesso.classList.remove('d-none');
        }
    }

    /* CORREÇÃO DE VELOCIDADE (carregamento lento com muita coisa salva e
     * vídeo longo): antes, cada leitura no IndexedDB abaixo rodava uma de
     * cada vez (await em sequência) — o tempo total era a SOMA de todas.
     * Agora rodam em PARALELO (Promise.all): o tempo total passa a ser o
     * da mais lenta (normalmente o próprio vídeo do pedido), não a soma de
     * todas as outras leituras pequenas. localStorage NÃO é uma opção
     * viável aqui: tem limite de ~5–10MB e é síncrono (travaria a aba
     * inteira ao tentar guardar um vídeo de dezenas de MB) — o IndexedDB
     * (assíncrono, sem esse limite) já é a ferramenta certa; o ganho real
     * está em paralelizar as leituras, não em trocar de tecnologia. */
    const tarefas = [
        prepararContrato(),
        iniciarContadorVivo(),
        renderizarLembrancas(),
        renderizarMensagensFuturo(),
        prepararCapsulaDoTempo(),
        verificarEspecialAniversario(),
        iniciarMomentoLento(),
        iniciarGaleriaMomentos(), // agora varre a galeria de verdade pra sortear fotos, então entra aqui e não mais na lista "rápida" abaixo

        obterConfiguracao('aurora_data_pedido').then(dataPedidoIso => {
            if (!dataPedidoIso) return;
            document.getElementById('dataPedidoTexto').textContent = `Nosso pedido: ${formatarDataPedidoComHora(dataPedidoIso)}`;
            const elTimeline = document.getElementById('dataPedidoTimeline');
            if (elTimeline) elTimeline.textContent = formatarDataPedido(dataPedidoIso);

            const dias = Math.max(0, Math.floor((Date.now() - new Date(dataPedidoIso).getTime()) / 86400000));
            document.getElementById('counterText').textContent = dias === 0 ? 'hoje é o nosso primeiro dia' : `${dias} dia${dias === 1 ? '' : 's'} desde que topamos essa juntos`;

            const localData = document.getElementById('contratoLocalData');
            if (localData) localData.textContent = `Nuporanga - SP, ${formatarDataPedido(dataPedidoIso)}.`;
        }),

        obterMedia('video_pedido').then(video => {
            if (video && video.blob) {
                const url = URL.createObjectURL(video.blob);
                document.getElementById('romanceVideo').src = url;
                document.getElementById('romanceVideoWrap').classList.remove('d-none');
                const btnBaixar = document.getElementById('btnBaixarVideoPedido');
                if (btnBaixar) btnBaixar.href = url; // mesmo blob já carregado — download não refaz nenhuma leitura
            }
        }),

        obterMedia('assinatura').then(assinatura => {
            if (assinatura && assinatura.texto) {
                document.getElementById('romanceSignatureImg').src = assinatura.texto;
                document.getElementById('contratoSignatureImg').src = assinatura.texto;
                document.getElementById('romanceSignatureWrap').classList.remove('d-none');
            }
        }),

        renderizarResumoChecklist()
    ];

    await executarComBarraDeProgresso(tarefas);
    esconderLoadingRomance();

    // Mesma correção do "espaço vazio/roxo no fim da tela" (ver
    // forcarRecalculoDeLayout() em js/utils.js): essa é a maior troca de
    // tela do site (loja/checkout/suspense -> romancePage, os únicos dois
    // elementos que realmente definem a altura do documento), tanto na
    // primeira vez (logo depois do flashback) quanto ao reabrir o link já
    // no estágio final. Sem esse reflow forçado aqui, o mesmo tipo de
    // faixa vazia podia aparecer bem na entrada de "Nossa História".
    forcarRecalculoDeLayout();
}

/* ----------------------------------------------------------------------
   PROTEÇÃO POR SENHA DA ÁREA DE MEMÓRIAS (item 8 do prompt)
   ----------------------------------------------------------------------
   Implementada por último, depois de todas as outras correções e
   melhorias terem sido concluídas e testadas (ver README.md).
   Fluxo: no primeiro acesso (pedido ainda não concluído) a experiência
   acontece normalmente, sem nenhuma senha. A partir do momento em que o
   pedido é concluído ('aurora_stage' === 'final'), toda vez que o link
   for aberto de novo, pedimos a senha antes de exibir "Nossa História"
   (ver o gate em js/main.js). Uma vez digitada corretamente, a sessão
   (esta aba) fica desbloqueada — reabrir o navegador pede de novo.
   ---------------------------------------------------------------------- */
function memoriasJaDesbloqueadasNestaSessao() {
    try { return sessionStorage.getItem('aurora_memorias_desbloqueadas') === '1'; } catch (e) { return false; }
}

/**
 * Exibe o gate de senha e só resolve a Promise quando a senha certa for
 * digitada (ou já tiver sido desbloqueada nesta sessão/aba).
 */
function solicitarSenhaMemorias() {
    return new Promise((resolve) => {
        if (memoriasJaDesbloqueadasNestaSessao()) { resolve(); return; }

        const overlay = document.getElementById('senhaMemoriasOverlay');
        const input = document.getElementById('senhaMemoriasInput');
        const erro = document.getElementById('senhaMemoriasErro');
        if (!overlay || !input) { resolve(); return; } // defensivo: se o HTML não existir, não bloqueia a experiência

        overlay.classList.remove('d-none');
        erro.classList.add('d-none');
        input.value = '';
        bloquearScrollFundoLembranca();
        setTimeout(() => input.focus(), 300);

        function tentarDesbloquear() {
            const senhaDigitada = (input.value || '').trim();
            if (senhaDigitada === SENHA_AREA_MEMORIAS) {
                try { sessionStorage.setItem('aurora_memorias_desbloqueadas', '1'); } catch (e) { /* ignora */ }
                overlay.classList.add('d-none');
                desbloquearScrollFundoLembranca();
                resolve();
            } else {
                erro.classList.remove('d-none');
                input.value = '';
                input.focus();
                overlay.querySelector('.senha-memorias-box').classList.remove('senha-shake');
                void overlay.offsetWidth; // força reflow para reiniciar a animação de "errado"
                overlay.querySelector('.senha-memorias-box').classList.add('senha-shake');
            }
        }

        document.getElementById('btnSenhaMemoriasEntrar').onclick = tentarDesbloquear;
        input.onkeydown = (evt) => { if (evt.key === 'Enter') tentarDesbloquear(); };
    });
}

/* ---------------- "Um instante em câmera lenta" ---------------- */
async function iniciarMomentoLento() {
    const wrap = document.getElementById('momentoLentoWrap');
    const video = document.getElementById('momentoLentoVideo');
    const fraseEl = document.getElementById('momentoLentoFrase');
    if (!wrap || !video) return;

    const caminho = await resolverVideoPorBase(MOMENTO_LENTO_ARQUIVO_BASE);
    if (!caminho) return; // vídeo ainda não foi colocado na pasta — seção continua escondida (d-none), sem quebrar nada

    video.src = caminho;
    video.playbackRate = MOMENTO_LENTO_VELOCIDADE;
    video.addEventListener('loadedmetadata', () => { video.playbackRate = MOMENTO_LENTO_VELOCIDADE; }); // alguns navegadores resetam a velocidade ao trocar de src
    video.play().catch(() => { /* autoplay mudo costuma ser permitido, mas por segurança não travamos nada se falhar */ });
    wrap.classList.remove('d-none');

    if (Array.isArray(MOMENTO_LENTO_FRASES) && MOMENTO_LENTO_FRASES.length) {
        let indice = 0;
        const TEMPO_POR_FRASE_MS = 4200;
        const mostrarFrase = () => {
            fraseEl.classList.remove('visivel');
            setTimeout(() => {
                fraseEl.textContent = MOMENTO_LENTO_FRASES[indice % MOMENTO_LENTO_FRASES.length];
                fraseEl.classList.add('visivel');
                indice++;
            }, 350);
        };
        mostrarFrase();
        setInterval(mostrarFrase, TEMPO_POR_FRASE_MS);
    }
}

/* ---------------- Especial de 8 de agosto (aniversário) ---------------- */
async function verificarEspecialAniversario() {
    const bloco = document.getElementById('aniversarioBloco');
    if (!bloco) return;

    // Hora do servidor (mesma fonte usada na cápsula do tempo, ver
    // obterHoraConfiavel em js/sync.js) — assim, mudar a data do celular
    // não faz esse bloco aparecer fora do dia certo.
    const agora = await obterHoraConfiavel();
    const ehHoje = agora.getDate() === ANIVERSARIO_DIA && (agora.getMonth() + 1) === ANIVERSARIO_MES;
    if (!ehHoje) return;

    document.getElementById('aniversarioTexto').textContent = textoAniversario();
    bloco.classList.remove('d-none');

    // Vídeo especial do aniversário — some sozinho se o arquivo ainda não
    // existir em assets/video/ (mesmo padrão do "momento em câmera lenta").
    const videoWrap = document.getElementById('aniversarioVideoWrap');
    const video = document.getElementById('aniversarioVideo');
    if (videoWrap && video) {
        const caminhoVideo = await resolverVideoPorBase(ANIVERSARIO_VIDEO_ARQUIVO_BASE);
        if (caminhoVideo) {
            video.src = caminhoVideo;
            videoWrap.classList.remove('d-none');
        }
    }

    // Música especial do aniversário — some sozinha se o arquivo ainda não
    // existir em assets/audio/. Tenta tocar sozinha; se o navegador
    // bloquear autoplay com som, o botão continua visível pra ela dar o
    // play manualmente (e também serve pra pausar/retomar a qualquer hora).
    const audio = document.getElementById('aniversarioAudio');
    const btnMusica = document.getElementById('btnAniversarioMusica');
    if (audio && btnMusica) {
        const caminhoAudio = await resolverAudioPorBase(ANIVERSARIO_MUSICA_ARQUIVO_BASE);
        if (caminhoAudio) {
            audio.src = caminhoAudio;
            btnMusica.classList.remove('d-none');

            const atualizarIconeBotao = (tocando) => {
                btnMusica.innerHTML = tocando
                    ? '<i class="bi bi-pause-fill"></i>'
                    : '<i class="bi bi-music-note-beamed"></i>';
                btnMusica.classList.toggle('tocando', tocando);
            };
            btnMusica.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play().then(() => atualizarIconeBotao(true)).catch(() => atualizarIconeBotao(false));
                } else {
                    audio.pause();
                    atualizarIconeBotao(false);
                }
            });

            audio.play().then(() => atualizarIconeBotao(true)).catch(() => atualizarIconeBotao(false));
        }
    }

    // Corações e balões subindo de baixo pra cima na tela, só hoje.
    iniciarChuvaDeAniversario();
}

/* Cria corações/balões que sobem de baixo pra cima da tela por um tempo
 * (ANIVERSARIO_CHUVA_DURACAO_MS), só chamada quando é o dia dela de
 * verdade (ver verificarEspecialAniversario acima). Cada elemento é
 * descartado sozinho quando a animação termina, então não acumula nada
 * na página com o passar do tempo. */
function iniciarChuvaDeAniversario() {
    const container = document.getElementById('aniversarioChuvaContainer');
    if (!container || !Array.isArray(ANIVERSARIO_CHUVA_ITENS) || !ANIVERSARIO_CHUVA_ITENS.length) return;

    const INTERVALO_MS = 220;
    const inicio = Date.now();

    const criarItem = () => {
        const item = document.createElement('span');
        item.className = 'aniversario-chuva-item';
        item.textContent = ANIVERSARIO_CHUVA_ITENS[Math.floor(Math.random() * ANIVERSARIO_CHUVA_ITENS.length)];

        const posicaoHorizontal = Math.random() * 96; // % da largura da tela
        const desvio = 20 + Math.random() * 60; // px de "vento" durante a subida
        const duracaoS = 5 + Math.random() * 3.5;
        const tamanhoRem = 1.4 + Math.random() * 1.3;

        item.style.left = `${posicaoHorizontal}%`;
        item.style.fontSize = `${tamanhoRem}rem`;
        item.style.setProperty('--aniversario-desvio', `${desvio}px`);
        item.style.animationDuration = `${duracaoS}s`;

        container.appendChild(item);
        item.addEventListener('animationend', () => item.remove());
    };

    const temporizador = setInterval(() => {
        if (Date.now() - inicio > ANIVERSARIO_CHUVA_DURACAO_MS) {
            clearInterval(temporizador);
            return;
        }
        criarItem();
    }, INTERVALO_MS);
    criarItem(); // primeiro item já na hora, sem esperar o primeiro intervalo
}

/* ---------------- "Se um dia estiver triste, lembre-se disso" ---------------- */
let __adjetivosOrdem = [];
function iniciarAdjetivosParaEla() {
    const card = document.getElementById('adjetivoCard');
    const botao = document.getElementById('btnAdjetivoMaisUm');
    if (!card || !Array.isArray(ADJETIVOS_PARA_ELA) || !ADJETIVOS_PARA_ELA.length) return;

    function embaralharNovoBaralho() {
        __adjetivosOrdem = ADJETIVOS_PARA_ELA.map((_, i) => i);
        for (let i = __adjetivosOrdem.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [__adjetivosOrdem[i], __adjetivosOrdem[j]] = [__adjetivosOrdem[j], __adjetivosOrdem[i]];
        }
    }

    function mostrarProximaCarta() {
        if (!__adjetivosOrdem.length) embaralharNovoBaralho(); // esgotou o baralho — embaralha de novo, sem repetir a mesma logo em seguida
        const indice = __adjetivosOrdem.pop();
        const item = ADJETIVOS_PARA_ELA[indice];

        card.classList.remove('adjetivo-card-visivel');
        setTimeout(() => {
            document.getElementById('adjetivoPalavra').textContent = item.adjetivo;
            const motivoEl = document.getElementById('adjetivoMotivo');
            motivoEl.textContent = item.motivo || '';
            motivoEl.classList.toggle('d-none', !item.motivo);
            card.classList.add('adjetivo-card-visivel');
        }, 220);
    }

    embaralharNovoBaralho();
    mostrarProximaCarta();
    botao.addEventListener('click', mostrarProximaCarta);
    card.addEventListener('click', mostrarProximaCarta);
}

/* ---------------- "Se um dia a gente discutir, leia isso" ---------------- */
function iniciarCartaDiscussao() {
    const botao = document.getElementById('btnCartaDiscussao');
    const overlay = document.getElementById('cartaDiscussaoOverlay');
    const fechar = document.getElementById('btnFecharCartaDiscussao');
    if (!botao || !overlay) return;

    const passoSenha = document.getElementById('cartaDiscussaoPassoSenha');
    const passoPergunta = document.getElementById('cartaDiscussaoPassoPergunta');
    const senhaInput = document.getElementById('cartaDiscussaoSenhaInput');
    const senhaErro = document.getElementById('cartaDiscussaoSenhaErro');
    const mensagemFofa = document.getElementById('cartaDiscussaoMensagemFofa');

    function mostrarPasso(passo) {
        [passoSenha, passoPergunta].forEach(p => p.classList.add('d-none'));
        passo.classList.remove('d-none');
        overlay.scrollTop = 0; // cada passo novo começa mostrando o topo, nunca no meio/fim
    }

    function abrirDoZero() {
        senhaErro.classList.add('d-none');
        mensagemFofa.classList.add('d-none');
        document.getElementById('btnCartaDiscussaoSim').classList.remove('d-none');
        document.getElementById('btnCartaDiscussaoNao').classList.remove('d-none');
        overlay.classList.remove('d-none');
        bloquearScrollFundoLembranca();
        mostrarPasso(passoPergunta);
    }

    function irParaSenha() {
        document.getElementById('cartaDiscussaoDica').textContent = DICA_SENHA_CARTA_DISCUSSAO;
        senhaInput.value = '';
        senhaErro.classList.add('d-none');
        mostrarPasso(passoSenha);
        setTimeout(() => senhaInput.focus(), 300);
    }

    function tentarSenha() {
        const digitada = (senhaInput.value || '').trim().toLowerCase().replace(/\s+/g, '');
        if (digitada === SENHA_CARTA_DISCUSSAO) {
            overlay.classList.add('d-none');
            desbloquearScrollFundoLembranca();
            // Já abre direto no modo "luz de vela" (pedido explícito).
            abrirModoVela('Se um dia a gente discutir', textoCartaDiscussao(), NOME_DELE + '.');
        } else {
            senhaErro.classList.remove('d-none');
            senhaInput.value = '';
            senhaInput.focus();
        }
    }

    botao.addEventListener('click', abrirDoZero);
    document.getElementById('btnCartaDiscussaoSenhaEntrar').addEventListener('click', tentarSenha);
    senhaInput.addEventListener('keydown', (evt) => { if (evt.key === 'Enter') tentarSenha(); });

    // Não deixa digitar espaço nenhum, e sempre mantém a primeira letra
    // maiúscula enquanto ela digita (a comparação em tentarSenha() ignora
    // maiúscula/minúscula de qualquer forma, isso é só visual).
    senhaInput.addEventListener('input', () => {
        const semEspaco = senhaInput.value.replace(/\s/g, '');
        senhaInput.value = semEspaco.charAt(0).toUpperCase() + semEspaco.slice(1);
    });

    document.getElementById('btnCartaDiscussaoSim').addEventListener('click', irParaSenha);

    document.getElementById('btnCartaDiscussaoNao').addEventListener('click', () => {
        mensagemFofa.textContent = TEXTOS.brigamosMensagemFofa;
        mensagemFofa.classList.remove('d-none');
        document.getElementById('btnCartaDiscussaoSim').classList.add('d-none');
        document.getElementById('btnCartaDiscussaoNao').classList.add('d-none');
    });

    fechar.addEventListener('click', () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); });
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); } });
}

/* ---------------- "Nosso mapa" ---------------- */
// A página principal mostra só os primeiros lugares (pra não ficar poluída
// se a lista crescer); a trilha inteira fica disponível no modal "Ver todos
// os lugares" (ver iniciarMapaModal() logo abaixo).
const MAPA_QUANTIDADE_PREVIA = 4;

// resolverFotoPlaceholder devolve um caminho real em "assets/img/..." quando
// a foto já foi adicionada, ou um SVG gerado na hora (data:image/svg+xml...)
// quando ainda não existe — assim dá pra saber qual dos dois caso a caso.
function lugarTemFotoReal(caminho) {
    return typeof caminho === 'string' && caminho.startsWith('assets/img/');
}

async function preencherGridDoMapa(grid, lugares) {
    if (!grid) return;
    grid.innerHTML = '';

    // Resolve a foto de cada lugar em paralelo (mesma lógica usada em
    // "Seus bichos") pra já nascer sabendo quais pins mostram foto de
    // verdade e quais ainda caem no ícone.
    const fotosResolvidas = await Promise.all(lugares.map(lugar => {
        if (lugar.foto) return resolverFotoPlaceholder(lugar.foto); // lugares fixos (js/config.js)
        if (lugar.fotoBase) return resolverFotoPorBase(lugar.fotoBase, lugar.nome); // lugares adicionados pelo painel
        return Promise.resolve(null);
    }));

    lugares.forEach((lugar, i) => {
        const foto = fotosResolvidas[i];
        const temFoto = lugarTemFotoReal(foto);

        const card = document.createElement('div');
        card.className = 'mapa-card' + (lugar.futuro ? ' mapa-card-futuro' : '');
        card.innerHTML = `
            <div class="mapa-pin${temFoto ? ' mapa-pin-foto' : ''}">${
                temFoto
                    ? `<img src="${foto}" alt="${lugar.nome}">`
                    : `<i class="bi ${lugar.icon || 'bi-geo-alt-fill'}"></i>`
            }</div>
            <div class="mapa-linha"></div>
            <div class="mapa-conteudo">
                <p class="mapa-nome">${lugar.nome}</p>
                <p class="mapa-cidade">${lugar.cidade || ''}</p>
                <p class="mapa-texto">${lugar.texto || ''}</p>
            </div>`;

        // Só abre o visor de foto ampliada se já existir uma foto de
        // verdade pra esse lugar (sem sentido abrir o SVG de placeholder).
        if (temFoto) {
            card.classList.add('mapa-card-clicavel');
            card.addEventListener('click', () => abrirLightboxGaleria(fotosResolvidas.filter(lugarTemFotoReal), fotosResolvidas.filter(lugarTemFotoReal).indexOf(foto), lugares.filter((_, j) => lugarTemFotoReal(fotosResolvidas[j])).map(l => l.nome)));
        }

        grid.appendChild(card);
    });
}

// Locais adicionados pelo painel "Adicionar local ao mapa" (diagnostico.html)
// ficam guardados nessa chave de configuração — mesmo mecanismo de
// salvarConfiguracao()/obterConfiguracao() (js/db.js) usado pelo resto do
// site, então entram automaticamente no backup/sincronização com a nuvem
// (ver js/export.js) e aparecem em qualquer aparelho que abrir o site.
const CHAVE_MAPA_LUGARES_EXTRA = 'aurora_mapa_lugares_extra';

async function obterLugaresExtrasDoMapa() {
    try {
        const bruto = await obterConfiguracao(CHAVE_MAPA_LUGARES_EXTRA);
        const lista = JSON.parse(bruto || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        console.error('Falha ao ler locais extras do mapa:', e);
        return [];
    }
}

async function renderizarMapaDaRelacao() {
    const gridPrevia = document.getElementById('mapaTrilhaGrid');
    const gridCompleto = document.getElementById('mapaTrilhaGridCompleto');
    const verTodosWrap = document.getElementById('mapaVerTodosWrap');
    if (!gridPrevia || !Array.isArray(MAPA_LUGARES)) return;

    const extras = await obterLugaresExtrasDoMapa();
    // CORREÇÃO: antes, os locais adicionados pelo painel entravam sempre
    // no FINAL da lista (MAPA_LUGARES.concat(extras)) — como o card
    // "Próximo destino" (futuro: true) é o último item de MAPA_LUGARES,
    // todo local novo aparecia DEPOIS dele. Agora separamos o(s) card(s)
    // marcados como "futuro" e sempre os colocamos no final de verdade,
    // então qualquer local novo (fixo ou adicionado pelo painel) sempre
    // fica antes de "Próximo destino".
    const lugaresFixosSemFuturo = MAPA_LUGARES.filter(lugar => !lugar.futuro);
    const lugaresFuturo = MAPA_LUGARES.filter(lugar => lugar.futuro);
    const todosOsLugares = lugaresFixosSemFuturo.concat(extras, lugaresFuturo);

    const temMais = todosOsLugares.length > MAPA_QUANTIDADE_PREVIA;
    preencherGridDoMapa(gridPrevia, temMais ? todosOsLugares.slice(0, MAPA_QUANTIDADE_PREVIA) : todosOsLugares);
    preencherGridDoMapa(gridCompleto, todosOsLugares);

    if (verTodosWrap) verTodosWrap.classList.toggle('d-none', !temMais);
}

function iniciarMapaModal() {
    const overlay = document.getElementById('mapaModalOverlay');
    const btnAbrir = document.getElementById('btnMapaVerTodos');
    const btnFechar = document.getElementById('btnFecharMapaModal');
    if (!overlay || !btnAbrir || overlay.dataset.iniciado === '1') return;
    overlay.dataset.iniciado = '1';

    const abrir = () => {
        overlay.classList.remove('d-none');
        overlay.scrollTop = 0;
        bloquearScrollFundoLembranca();
    };
    const fechar = () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); };

    btnAbrir.addEventListener('click', abrir);
    btnFechar.addEventListener('click', fechar);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fechar(); });
}
function renderizarCoisasQueElaAma() {
    const grid = document.getElementById('coisasQueElaAmaGrid');
    if (!grid || !Array.isArray(COISAS_QUE_ELA_AMA)) return;
    grid.innerHTML = '';
    COISAS_QUE_ELA_AMA.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ama-card';
        card.innerHTML = `<i class="bi ${item.icon}"></i><p>${item.texto}</p>`;
        grid.appendChild(card);
    });
}

/* ---------------- Resumo do "Nosso checklist" (progresso + link para checklist.html) ---------------- */
async function renderizarResumoChecklist() {
    const textoEl = document.getElementById('checklistResumoTexto');
    const barraEl = document.getElementById('checklistResumoBarra');
    if (!textoEl || typeof CHECKLIST_ENCONTROS === 'undefined') return;

    let total = CHECKLIST_ENCONTROS.reduce((soma, cat) => soma + cat.itens.length, 0);
    try {
        const brutoCustom = await obterConfiguracao('aurora_checklist_itens_customizados');
        const listaCustom = brutoCustom ? JSON.parse(brutoCustom) : [];
        if (Array.isArray(listaCustom)) total += listaCustom.length;
    } catch (e) { /* mantém só o total original em caso de erro */ }

    let estado = {};
    try {
        const bruto = await obterConfiguracao('aurora_checklist_encontros');
        estado = bruto ? JSON.parse(bruto) : {};
    } catch (e) { estado = {}; }
    if (!estado || typeof estado !== 'object' || Array.isArray(estado)) estado = {};

    const feitos = Object.keys(estado).filter(id => estado[id]).length;
    const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;

    textoEl.textContent = feitos === 0
        ? `${total} coisas esperando pra gente viver junto.`
        : `${feitos} de ${total} já vivemos juntos.`;
    if (barraEl) barraEl.style.width = `${percentual}%`;
}

/* ---------------- "Seus bichos" ---------------- */
async function renderizarSeusBichos() {
    const grid = document.getElementById('seusBichosGrid');
    const memoria = document.getElementById('bichosEmMemoria');
    const slinkyBox = document.getElementById('bichoSlinkyDestaque');
    const slinkyTexto = document.getElementById('bichoSlinkyTexto');
    if (!grid) return;

    // Lista combinada (atuais + em memória, incluindo o Slinky) na mesma
    // ordem em que os cartões aparecem na tela — clicar em qualquer nome
    // abre a foto dele e dá pra navegar pros outros a partir dali.
    const todosOsBichos = [...(SEUS_BICHOS || []), ...(BICHOS_EM_MEMORIA || [])];
    // resolverFotoPlaceholder testa cada extensão aceita (EXTENSOES_FOTO_ACEITAS,
    // em js/config.js) até achar o arquivo de verdade — por isso é assíncrona.
    const todasAsFotos = await Promise.all(todosOsBichos.map(b => resolverFotoPlaceholder(b.foto)));
    const todosOsNomes = todosOsBichos.map(b => b.nome || '');

    if (Array.isArray(SEUS_BICHOS)) {
        grid.innerHTML = '';
        SEUS_BICHOS.forEach((bicho, i) => {
            const card = document.createElement('div');
            card.className = 'bicho-card';
            card.innerHTML = `<span class="bicho-emoji">${bicho.emoji}</span><span class="bicho-nome">${bicho.nome}</span>`;
            card.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, i, todosOsNomes));
            grid.appendChild(card);
        });
    }

    if (Array.isArray(BICHOS_EM_MEMORIA)) {
        const slinky = BICHOS_EM_MEMORIA.find(b => b.destaque);
        const indiceSlinky = todosOsBichos.indexOf(slinky);
        if (slinky && slinkyBox && slinkyTexto) {
            slinkyTexto.textContent = slinky.textoEspecial || '';
            slinkyBox.classList.remove('d-none');
            slinkyBox.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, indiceSlinky, todosOsNomes));
        }

        // Os demais "em memória" (sem o Slinky, que já ganhou o bloco de
        // destaque acima, pra não repetir o nome dele duas vezes) também
        // abrem foto ao tocar no nome.
        const outrosEmMemoria = BICHOS_EM_MEMORIA.filter(b => !b.destaque);
        if (memoria && outrosEmMemoria.length) {
            memoria.innerHTML = 'E no coração, pra sempre: ' + outrosEmMemoria.map(b => {
                const indice = todosOsBichos.indexOf(b);
                return `<span class="bicho-memoria-nome" data-indice="${indice}">${b.nome} ${b.emoji}</span>`;
            }).join(', ') + '.';
            memoria.querySelectorAll('.bicho-memoria-nome').forEach(span => {
                span.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, Number(span.dataset.indice), todosOsNomes));
            });
        }
    }
}

/* ---------------- Easter egg do sobrenome ---------------- */
function exibirEasterEggSobrenome() {
    const el = document.getElementById('easterEggSobrenome');
    if (el) el.textContent = TEXTO_EASTER_EGG_SOBRENOME;
}

/* ----------------------------------------------------------------------
   VÍDEO DO PEDIDO NO YOUTUBE (alternativa ao vídeo local, que pode ficar
   grande demais para o armazenamento do celular) — ver item do prompt.
   Fica logo abaixo de "Nossas lembranças". Guardado como configuração
   simples (só o ID do vídeo, texto pequeno) — sincroniza normalmente
   entre aparelhos como qualquer outra configuração do site.
   ---------------------------------------------------------------------- */
async function iniciarVideoYoutubePedido() {
    const idSalvo = await obterConfiguracao('aurora_video_pedido_youtube');
    exibirVideoYoutubePedido(idSalvo);

    document.getElementById('btnSalvarVideoYoutubePedido').addEventListener('click', salvarVideoYoutubePedido);
    document.getElementById('inputVideoYoutubePedido').addEventListener('keydown', (evt) => { if (evt.key === 'Enter') salvarVideoYoutubePedido(); });
    document.getElementById('btnEditarVideoYoutubePedido').addEventListener('click', () => {
        document.getElementById('romanceVideoYoutubePreenchido').classList.add('d-none');
        document.getElementById('romanceVideoYoutubeVazio').classList.remove('d-none');
        document.getElementById('inputVideoYoutubePedido').value = '';
    });
}

async function salvarVideoYoutubePedido() {
    const input = document.getElementById('inputVideoYoutubePedido');
    const status = document.getElementById('videoYoutubePedidoStatus');
    const valor = (input.value || '').trim();

    if (!valor) {
        status.textContent = 'Cole o link do vídeo primeiro.';
        status.className = 'save-status err';
        return;
    }

    const id = extrairIdYoutube(valor);
    if (!id) {
        status.textContent = 'Não consegui reconhecer esse link do YouTube.';
        status.className = 'save-status err';
        return;
    }

    await salvarConfiguracao('aurora_video_pedido_youtube', id);
    status.textContent = '';
    status.className = 'save-status';
    input.value = '';
    exibirVideoYoutubePedido(id);
}

function exibirVideoYoutubePedido(id) {
    const vazio = document.getElementById('romanceVideoYoutubeVazio');
    const preenchido = document.getElementById('romanceVideoYoutubePreenchido');
    if (id) {
        document.getElementById('romanceVideoYoutubeIframe').src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        vazio.classList.add('d-none');
        preenchido.classList.remove('d-none');
    } else {
        document.getElementById('romanceVideoYoutubeIframe').src = '';
        preenchido.classList.add('d-none');
        vazio.classList.remove('d-none');
    }
}

function iniciarModuloRomance() {
    iniciarVideoYoutubePedido();

    const btnGerarContrato = document.getElementById('btnGerarContrato');
    if (btnGerarContrato) {
        btnGerarContrato.addEventListener('click', async () => {
            if (regrasSelecionadas.length < MIN_REGRAS) return;
            await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(regrasSelecionadas));
            gerarContratoPersonalizado(regrasSelecionadas);
        });
    }

    document.getElementById('btnAdicionarLembranca').addEventListener('click', () => document.getElementById('inputLembrancas').click());
    document.getElementById('inputLembrancas').addEventListener('change', (evt) => { adicionarLembrancas(evt.target.files); evt.target.value = ''; });
    document.getElementById('btnFecharLembranca').addEventListener('click', fecharLembrancaAmpliada);
    document.getElementById('btnLightboxAnterior').addEventListener('click', lightboxFotoAnterior);
    document.getElementById('btnLightboxProxima').addEventListener('click', lightboxProximaFoto);
    document.getElementById('btnEstrelaAnterior').addEventListener('click', estrelaModalAnterior);
    document.getElementById('btnEstrelaProxima').addEventListener('click', estrelaModalProxima);

    document.getElementById('btnReverLoja').addEventListener('click', abrirLojaSomenteVisualizacao);
    document.getElementById('btnVoltarDaLoja').addEventListener('click', fecharLojaSomenteVisualizacao);

    // Item 3 do prompt de correções: permite recomeçar o quiz do casal do zero.
    document.getElementById('btnRefazerQuiz').addEventListener('click', iniciarQuiz);
}

/* ----------------------------------------------------------------------
   "REVER A LOJINHA" — só visualização, nunca afeta o que já foi gravado
   ----------------------------------------------------------------------
   Depois que tudo já aconteceu, a pessoa pode querer rever a "lojinha
   falsa" das alianças (o disfarce inicial do site) só por nostalgia. Isso
   NÃO deve, de jeito nenhum, poder reiniciar o pedido — por isso o botão
   "Confirmar Pagamento" da loja fica escondido enquanto estiver em modo
   visualização, e nada aqui grava nada no banco.
   ---------------------------------------------------------------------- */
function abrirLojaSomenteVisualizacao() {
    document.getElementById('romancePage').style.display = 'none';
    const loja = document.getElementById('lojaScreen');
    loja.style.display = '';
    definirFundoBody(CORES_FUNDO.claro);

    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.classList.add('d-none'); // impede reiniciar o pedido sem querer

    trocarNomeLojaParaVisualizacao(true);

    document.getElementById('modoVisualizacaoBarra').classList.remove('d-none');
    document.body.classList.add('modo-visualizacao-ativo'); // reserva espaço pra barra fixa não cobrir o fim da loja
    window.scrollTo(0, 0);

    // Mesma correção do "espaço vazio/roxo no fim da tela" usada ao voltar
    // da lojinha (ver forcarRecalculoDeLayout() em js/utils.js): troca
    // entre #romancePage e #lojaScreen também muda a altura real do
    // documento nesse sentido (entrando na lojinha), então precisa do
    // mesmo reflow forçado.
    forcarRecalculoDeLayout();
}

function fecharLojaSomenteVisualizacao() {
    document.getElementById('lojaScreen').style.display = 'none';
    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.classList.remove('d-none');

    trocarNomeLojaParaVisualizacao(false);

    document.getElementById('modoVisualizacaoBarra').classList.add('d-none');
    document.body.classList.remove('modo-visualizacao-ativo');
    const romancePage = document.getElementById('romancePage');
    romancePage.style.display = '';
    definirFundoBody(CORES_FUNDO.escuro);
    window.scrollTo(0, 0);

    // CORREÇÃO ("tela roxa/vazia" ao voltar da loja): alternar
    // display:none -> '' faz o navegador RECRIAR a renderização da página
    // inteira, o que reinicia do zero as animações de entrada
    // (".reveal-up", que começam com opacity:0 e só aparecem depois de
    // 0.8s). Como ela já tinha visto "Nossa História" antes, replay dessa
    // animação de novo só dá a impressão de uma tela em branco por um
    // instante. Aqui a gente força tudo a aparecer JÁ no estado final,
    // sem re-tocar a animação.
    romancePage.querySelectorAll('.reveal-up').forEach(el => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
    });

    // Mesma correção do "espaço vazio/roxo no fim da tela" (ver
    // forcarRecalculoDeLayout() em js/utils.js): como essa troca acontece
    // dentro da mesma página (display:none -> '', sem navegação de
    // verdade), o listener de "pageshow" não dispara aqui, então força o
    // reflow manualmente também.
    forcarRecalculoDeLayout();
}

/**
 * Troca o nome "Aryah" por "Poloni" (e variações) só enquanto está no
 * modo visualização da lojinha — nunca durante a experiência real do
 * pedido (ali o disfarce "Aryah Joias" precisa continuar intacto). Cada
 * elemento marcado com a classe "js-marca-loja" guarda o texto original
 * em data-original na primeira troca, pra sempre voltar exatamente como
 * era ao fechar — mesmo que o texto tenha maiúsculas, minúsculas, ou
 * esteja no meio de uma frase maior.
 */
function trocarNomeLojaParaVisualizacao(ligar) {
    document.querySelectorAll('.js-marca-loja').forEach((el) => {
        if (!el.hasAttribute('data-original')) el.setAttribute('data-original', el.textContent);
        const original = el.getAttribute('data-original');

        if (ligar) {
            el.textContent = original
                .replace(/ARYAH JOIAS/g, 'POLONI JOIAS')
                .replace(/Aryah Joias/g, 'Poloni Joias')
                .replace(/ARYAH/g, 'POLONI')
                .replace(/Aryah/g, 'Poloni');
        } else {
            el.textContent = original;
        }
    });

    if (ligar) {
        if (!window.__aurora_titulo_original) window.__aurora_titulo_original = document.title;
        document.title = document.title.replace(/Aryah Joias/i, 'Poloni Joias');
    } else if (window.__aurora_titulo_original) {
        document.title = window.__aurora_titulo_original;
    }
}
