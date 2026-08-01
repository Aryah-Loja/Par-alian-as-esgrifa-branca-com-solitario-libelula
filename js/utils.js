/**
 * UTILS.JS — Funções utilitárias compartilhadas.
 */

// Testa (via HEAD) se um arquivo existe em /assets. Usada por
// resolverFotoPlaceholder() (js/config.js), entre outras.
async function arquivoExisteNoServidor(caminho) {
    try {
        const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store' });
        return resposta.ok;
    } catch (e) {
        return false;
    }
}

/* ---------------- Trava de rolagem compartilhada por TODOS os modais ---------------- */
// Trava o scroll do fundo (inclusive o "bounce" do iOS) enquanto qualquer
// modal/overlay está aberto, restaurando a posição ao fechar. Contagem de
// referências: só destrava quando todos os overlays que travaram também
// destravaram (um modal fechando não derruba a trava de outro ainda aberto).
let __auroraScrollSalvo = 0;
let __auroraScrollContagem = 0;
function bloquearScrollFundoLembranca() {
    if (__auroraScrollContagem === 0) {
        __auroraScrollSalvo = window.scrollY || document.documentElement.scrollTop || 0;
        document.documentElement.classList.add('aurora-scroll-lock');
        document.body.style.top = `-${__auroraScrollSalvo}px`;
    }
    __auroraScrollContagem++;
}
function desbloquearScrollFundoLembranca() {
    __auroraScrollContagem = Math.max(0, __auroraScrollContagem - 1);
    if (__auroraScrollContagem === 0) {
        document.documentElement.classList.remove('aurora-scroll-lock');
        document.body.style.top = '';
        window.scrollTo(0, __auroraScrollSalvo);
    }
}

// Modo "luz de vela": escurece a tela e mostra o texto de uma carta já
// revelada (carta final, cápsula do tempo, carta de discussão) num papel
// iluminado. Recebe o HTML já pronto, só troca a apresentação visual.
// `opcoes.aoContinuar`, se fornecido, mostra um botão "Continuar" (usado
// pela carta final, para seguir ao flashback/"Nossa História").
function abrirModoVela(eyebrowTexto, textoHtml, assinaturaTexto, opcoes = {}) {
    const overlay = document.getElementById('modoVelaOverlay');
    if (!overlay) return;
    document.getElementById('modoVelaEyebrow').textContent = eyebrowTexto || '';
    document.getElementById('modoVelaTexto').innerHTML = textoHtml || '';
    document.getElementById('modoVelaAssinatura').textContent = assinaturaTexto || '';
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();

    // Player embutido, só usado pela cápsula do tempo (ver
    // iniciarEnvelopeCapsula em js/romance.js).
    const videoWrap = document.getElementById('modoVelaVideoWrap');
    if (videoWrap) {
        videoWrap.innerHTML = '';
        if (opcoes.videoYoutubeId) {
            const iframeVideo = document.createElement('iframe');
            iframeVideo.src = `https://www.youtube.com/embed/${opcoes.videoYoutubeId}?rel=0&modestbranding=1`;
            iframeVideo.title = 'Vídeo da cápsula do tempo';
            iframeVideo.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
            iframeVideo.setAttribute('allowfullscreen', '');
            videoWrap.appendChild(iframeVideo);
            videoWrap.classList.remove('d-none');
        } else {
            videoWrap.classList.add('d-none');
        }
    }

    const continuarWrap = document.getElementById('modoVelaContinuarWrap');
    const btnContinuar = document.getElementById('btnModoVelaContinuar');
    const btnFechar = document.getElementById('btnFecharModoVela');
    const exigeContinuar = !!opcoes.aoContinuar;

    if (exigeContinuar) {
        continuarWrap.classList.remove('d-none');
        btnContinuar.onclick = opcoes.aoContinuar;
    } else {
        continuarWrap.classList.add('d-none');
        btnContinuar.onclick = null;
    }

    // Com "Continuar" obrigatório (só a carta final usa), o X de fechar
    // some e clicar fora não fecha — evita pular o passo que avança o estágio.
    if (exigeContinuar) {
        btnFechar.classList.add('d-none');
        btnFechar.onclick = null;
        overlay.onclick = null;
    } else {
        btnFechar.classList.remove('d-none');
        // `opcoes.aoFechar`, se fornecido, roda depois de fechar (usado pela
        // cápsula do tempo para resetar o envelope).
        const fechar = () => {
            overlay.classList.add('d-none');
            if (videoWrap) videoWrap.innerHTML = ''; // remove o player, não só esconde (evita YouTube tocando escondido)
            desbloquearScrollFundoLembranca();
            if (typeof opcoes.aoFechar === 'function') opcoes.aoFechar();
        };
        btnFechar.onclick = fechar;
        overlay.onclick = (evt) => { if (evt.target === overlay) fechar(); };
    }
}

/* ---------------- Substituição segura de imagens (placeholders) ---------------- */
// Gera um SVG de placeholder com ícone + legenda, usado quando um arquivo
// real ainda não foi enviado para /assets.
function gerarSvgPlaceholderComLegenda(legenda) {
    const texto = (legenda || 'Adicione esta foto').slice(0, 40);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
            <rect width="400" height="400" fill="#f3e6e8"/>
            <path d="M200 240c-34-24-62-48-62-79a38 38 0 0 1 62-29 38 38 0 0 1 62 29c0 31-28 55-62 79z" fill="#e0b4bc"/>
            <text x="200" y="300" font-family="sans-serif" font-size="15" fill="#8f4d57" text-anchor="middle">${texto}</text>
        </svg>
    `);
}

// Aplica getAsset() a uma <img> com "onerror" elegante: mostra a imagem de
// substituição em vez do ícone de imagem quebrada. Mantém sempre um <img>
// de verdade (não uma <div>), para trocas futuras de "src" continuarem funcionando.
function aplicarImagemPlaceholder(imgEl, placeholderId, legenda) {
    if (!imgEl) return;
    imgEl.dataset.placeholderId = placeholderId;
    imgEl.onerror = function () {
        if (this.dataset.fallbackAplicado) return;
        this.dataset.fallbackAplicado = '1';
        this.src = gerarSvgPlaceholderComLegenda(legenda);
    };
    imgEl.src = getAsset(placeholderId);
}

// Rede de segurança global: qualquer <img> que falhe ao carregar recebe uma
// imagem de substituição, em vez do ícone padrão de "imagem quebrada".
const SVG_PLACEHOLDER_GENERICO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#f3e6e8"/>
        <path d="M200 260c-40-28-72-56-72-92a44 44 0 0 1 72-34 44 44 0 0 1 72 34c0 36-32 64-72 92z" fill="#e0b4bc"/>
    </svg>
`);

function iniciarFallbackImagensGlobais() {
    document.addEventListener('error', (e) => {
        const el = e.target;
        if (el && el.tagName === 'IMG' && !el.dataset.fallbackAplicado && el.src !== SVG_PLACEHOLDER_GENERICO) {
            el.dataset.fallbackAplicado = '1';
            el.src = SVG_PLACEHOLDER_GENERICO;
        }
    }, true);
}

/* ---------------- Código Morse (easter egg da lua) ---------------- */
const TABELA_MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
    H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
    O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
    V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

/** Converte um texto (sem acento) em código Morse, com "/" separando palavras. */
function paraCodigoMorse(texto) {
    return texto
        .toUpperCase()
        .split(' ')
        .map(palavra => palavra.split('').map(letra => TABELA_MORSE[letra] || '').filter(Boolean).join(' '))
        .join(' / ');
}


// Conta toques repetidos no mesmo elemento numa janela curta de tempo e
// dispara um callback ao atingir a quantidade necessária (base dos easter eggs).
function contarToquesRepetidos(elemento, quantidadeNecessaria, aoCompletar) {
    const JANELA_ENTRE_TOQUES_MS = 1800;
    let contador = 0;
    let ultimoToqueEm = 0;

    elemento.addEventListener('click', () => {
        const agora = Date.now();
        if (agora - ultimoToqueEm > JANELA_ENTRE_TOQUES_MS) contador = 0;
        ultimoToqueEm = agora;
        contador++;

        if (contador >= quantidadeNecessaria) {
            contador = 0;
            aoCompletar();
        }
    });
}

// Marca um easter egg como encontrado (persistido, sem duplicar) e
// atualiza o contador discreto no canto da tela (só o total, não quais).
async function marcarEasterEggEncontrado(id) {
    let encontrados = [];
    try { encontrados = JSON.parse(await obterConfiguracao('easterEggsEncontrados') || '[]'); } catch (e) { /* trata como nenhum encontrado ainda */ }
    if (!Array.isArray(encontrados)) encontrados = [];

    if (!encontrados.includes(id)) {
        encontrados.push(id);
        try { await salvarConfiguracao('easterEggsEncontrados', encontrados, false, false); } catch (e) { /* não crítico se falhar salvar */ }
    }
    atualizarContadorEasterEggs(encontrados.length);
}

// O contador visível só aparece dentro de "Nossa História" (nunca na loja
// ou checkout/carta); ativado por goToRomancePage() (js/romance.js). Os
// easter eggs da loja continuam sendo contados por baixo dos panos antes
// disso. Some sozinho quando todos já foram encontrados.
let contadorEasterEggsFaseFinal = false;
let contadorEasterEggsQuantidadeAtual = 0;

function ativarContadorEasterEggsFaseFinal() {
    contadorEasterEggsFaseFinal = true;
    aplicarVisibilidadeContadorEasterEggs();
}

function aplicarVisibilidadeContadorEasterEggs() {
    const wrap = document.getElementById('contadorEasterEggs');
    if (!wrap) return;
    const total = IDS_TODOS_OS_EASTER_EGGS.length;
    const deveAparecer = contadorEasterEggsFaseFinal && contadorEasterEggsQuantidadeAtual < total;
    wrap.classList.toggle('d-none', !deveAparecer);
}

function atualizarContadorEasterEggs(quantidadeEncontrada) {
    contadorEasterEggsQuantidadeAtual = quantidadeEncontrada;
    const el = document.getElementById('contadorEasterEggsTexto');
    if (el) {
        const total = IDS_TODOS_OS_EASTER_EGGS.length;
        el.textContent = `${quantidadeEncontrada} de ${total}`;
    }
    aplicarVisibilidadeContadorEasterEggs();
}

// Chamado uma vez no carregamento para ter o número certo desde o início.
async function iniciarContadorEasterEggs() {
    let encontrados = [];
    try { encontrados = JSON.parse(await obterConfiguracao('easterEggsEncontrados') || '[]'); } catch (e) { /* nenhum ainda */ }
    if (!Array.isArray(encontrados)) encontrados = [];
    atualizarContadorEasterEggs(encontrados.length);
}

// Força o navegador a recalcular o layout (lendo offsetHeight, que obriga
// um reflow síncrono) depois de trocas de tela que mexem na altura do
// documento — evita um espaço vazio no fim da página até um F5 manual.
function forcarRecalculoDeLayout() {
    requestAnimationFrame(() => {
        document.body.style.display = 'none';
        void document.body.offsetHeight; // força o navegador a recalcular o layout de verdade
        document.body.style.display = '';
    });
}

// Força um reflow quando a aba volta a ficar visível — evita um espaço em
// branco no fim da página que só sumiria com F5.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    forcarRecalculoDeLayout();
});

// Voltar entre páginas (ex.: galeria.html <-> index.html) pelo gesto/botão
// "voltar" costuma restaurar do bfcache e disparar "pageshow" em vez de
// visibilitychange — o mesmo reflow forçado resolve aqui também.
window.addEventListener('pageshow', () => {
    forcarRecalculoDeLayout();
});

/* ----------------------------------------------------------------------
   Descoberta de itens da galeria (compartilhado entre galeria.html e
   "Nossos momentos" em index.html). Usa cache local + manifesto para
   evitar varreduras lentas a cada abertura — ver CONTEXTO-PROJETO.md.
   ---------------------------------------------------------------------- */
const GALERIA_MAX_NUMERO = 500;       // teto de segurança, nunca deve ser alcançado na prática
const GALERIA_LACUNA_PARA_PARAR = 6;  // depois de 6 números seguidos sem nada, para de procurar

/* ----------------------------------------------------------------------
   MANIFESTO DA GALERIA — assets/img/galeria/manifesto.json lista tudo que
   existe, evitando descobrir arquivo por arquivo via HEAD request. Gerado
   automaticamente (scripts/gerar-manifesto-galeria.js + GitHub Actions) a
   cada novo upload de fotos/vídeos. Sem manifesto, cai de volta na
   varredura por HEAD — ver CONTEXTO-PROJETO.md para o raciocínio completo.
   ---------------------------------------------------------------------- */
let __galeriaManifestoPromise = null;

// Busca e valida o manifesto.json; devolve a lista de itens pronta, ou
// `null` se não existir/estiver inválido (usa a varredura por HEAD nesse caso).
function galeriaCarregarManifesto() {
    if (__galeriaManifestoPromise) return __galeriaManifestoPromise;

    __galeriaManifestoPromise = (async () => {
        try {
            // 'no-cache': permite guardar a resposta mas obriga revalidar com
            // o servidor antes de usá-la (evita servir um manifesto desatualizado).
            const resposta = await fetch(`${PASTA_GALERIA}/manifesto.json`, { cache: 'no-cache' });
            if (!resposta.ok) return null;
            const dados = await resposta.json();
            if (!dados || !Array.isArray(dados.itens)) return null;

            // Array vazio é um resultado válido (galeria realmente vazia);
            // só `null` significa "sem manifesto, tenta o jeito antigo".
            return dados.itens
                .filter(item => item && Number.isFinite(item.numero) && (item.tipo === 'foto' || item.tipo === 'video') && item.ext)
                .map(item => ({
                    numero: item.numero,
                    tipo: item.tipo,
                    caminho: `${PASTA_GALERIA}/galeria_${item.numero}.${item.ext}`
                }));
        } catch (e) {
            return null; // sem manifesto (404), JSON inválido, ou rede falhou — segue com a varredura antiga
        }
    })();

    return __galeriaManifestoPromise;
}

/* ---------------- Cache local da descoberta (localStorage) ---------------- */
// Guarda { itens: [{numero, caminho, tipo}], completo: boolean, salvoEm }.
// `completo` distingue uma varredura completa (fotos+vídeos, única
// confiável para a página da Galeria) de uma parcial (só fotos, para
// "Nossos momentos"). Um cache parcial nunca sobrescreve um completo.
const GALERIA_CACHE_CHAVE = 'aurora_galeria_cache_v1';

function galeriaLerCacheBruto() {
    try {
        const bruto = localStorage.getItem(GALERIA_CACHE_CHAVE);
        if (!bruto) return null;
        const dados = JSON.parse(bruto);
        if (!dados || !Array.isArray(dados.itens)) return null;
        return dados;
    } catch (e) {
        return null; // localStorage bloqueado (modo privado, cota cheia, etc.) — segue sem cache, sem quebrar nada
    }
}

/**
 * Lê o cache pronto para uso. `exigirCompleto = true` (usado pela página
 * da Galeria) só devolve algo se o cache cobrir fotos E vídeos por
 * inteiro; `false` (usado por "Nossos momentos") aceita qualquer cache
 * existente, já que ali só interessam as fotos.
 */
function galeriaLerCache(exigirCompleto = false) {
    const dados = galeriaLerCacheBruto();
    if (!dados) return null;
    if (exigirCompleto && !dados.completo) return null;
    return dados.itens;
}

function galeriaSalvarCacheSeMelhor(itens, completo) {
    try {
        const atual = galeriaLerCacheBruto();
        if (atual && atual.completo && !completo) return; // não piora um cache completo com um parcial
        localStorage.setItem(GALERIA_CACHE_CHAVE, JSON.stringify({ itens, completo, salvoEm: Date.now() }));
    } catch (e) {
        // sem espaço/permissão de localStorage — sem cache dessa vez, mas nada quebra
    }
}

/** Usado por diagnostico.html ("Limpar cache da Galeria"), e por quem quiser forçar uma varredura de verdade na próxima abertura. */
function galeriaLimparCache() {
    try { localStorage.removeItem(GALERIA_CACHE_CHAVE); } catch (e) { /* nada a fazer */ }
}

const GALERIA_REVALIDACAO_INTERVALO_MS = 3 * 60 * 60 * 1000; // intervalo mínimo entre revalidações, 3h

// Roda galeriaEscanearFotos em segundo plano só se o cache não existir ou já
// estiver velho o suficiente. Revalida só fotos (não vídeos, que só varrem
// quando a pessoa aperta "Ver vídeos"). Chamada sempre depois de já mostrar
// algo na tela — nunca decide o que aparece agora.
function galeriaRevalidarEmSegundoPlano() {
    const dados = galeriaLerCacheBruto();
    if (dados && (Date.now() - (dados.salvoEm || 0)) < GALERIA_REVALIDACAO_INTERVALO_MS) return;
    galeriaEscanearFotos(null, null).catch(() => { /* sem problema, tenta de novo na próxima abertura */ });
}

// Confere (via HEAD) se um caminho existe no servidor.
async function galeriaArquivoExiste(caminho) {
    try {
        const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store' });
        return resposta.ok;
    } catch (e) {
        return false;
    }
}

// Testa a extensão fixa de foto e/ou vídeo para "galeria_N", em paralelo.
// Devolve { caminho, tipo } da primeira que existir, ou `null`.
async function galeriaDescobrirItem(numero, tipoAlvo) {
    const candidatos = [
        ...(tipoAlvo !== 'video' ? GALERIA_EXTENSOES_FOTO.map(ext => ({ ext, tipo: 'foto' })) : []),
        ...(tipoAlvo !== 'foto' ? GALERIA_EXTENSOES_VIDEO.map(ext => ({ ext, tipo: 'video' })) : [])
    ];

    const testarUmaExtensao = async (c, controlador) => {
        const caminho = `${PASTA_GALERIA}/galeria_${numero}.${c.ext}`;
        const tentar = async () => {
            const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store', signal: controlador.signal });
            if (resposta.ok) return { encontrado: true, resultado: { caminho, tipo: c.tipo } };
            // Só um 404 de verdade confirma ausência; outros status (429,
            // 503...) são falhas passageiras e merecem nova tentativa.
            return { encontrado: false, confirmado: resposta.status === 404 };
        };
        try {
            const r = await tentar();
            if (r.encontrado) return r.resultado;
            if (r.confirmado) return null; // 404 de verdade: sem retry, resposta rápida e definitiva
        } catch (e) {
            if (controlador.signal.aborted) throw e; // cancelado porque outra extensão já achou — não é erro de rede, não faz sentido re-tentar
        }
        // Status ambíguo (não confirmado 404) — vale uma segunda tentativa.
        try {
            const r2 = await tentar();
            if (r2.encontrado) return r2.resultado;
            return null;
        } catch (e2) {
            return null; // falhou de novo — aí sim trata como "não achou"
        }
    };

    const testarTodasAsExtensoes = async () => {
        const controlador = new AbortController();
        const tentativas = candidatos.map(async (c) => {
            const resultado = await testarUmaExtensao(c, controlador);
            if (resultado) return resultado;
            throw new Error('galeria: extensão não encontrada'); // faz Promise.any pular essa tentativa
        });

        try {
            const achou = await Promise.any(tentativas);
            controlador.abort(); // corta as combinações que ainda estavam em andamento — não precisa mais delas
            return achou;
        } catch (erroAgregado) {
            return null; // nenhuma das combinações existe
        }
    };

    return testarTodasAsExtensoes();
}

// Varre uma faixa de números da galeria (`inicio` até `teto`, ou até bater
// a tolerância de buracos seguidos) chamando `aoEncontrar(numero, resultado)`
// para cada item real. `lacunaTolerancia = Infinity` desativa a parada
// antecipada (usado na faixa de fotos, naturalmente pequena e limitada).
async function galeriaVarrerFaixa(inicio, teto, aoEncontrar, aoProgredir, tipoAlvo, lacunaTolerancia = GALERIA_LACUNA_PARA_PARAR) {
    const TAMANHO_LOTE = 24; // testado em paralelo por vez
    let proximoNumero = inicio;
    let lacunaAtual = 0;

    while (proximoNumero <= teto && lacunaAtual < lacunaTolerancia) {
        const numerosDoLote = [];
        for (let i = 0; i < TAMANHO_LOTE; i++) numerosDoLote.push(proximoNumero + i);

        const resultados = await Promise.all(numerosDoLote.map(n => galeriaDescobrirItem(n, tipoAlvo)));

        for (let i = 0; i < resultados.length; i++) {
            if (resultados[i]) {
                lacunaAtual = 0;
                aoEncontrar(numerosDoLote[i], resultados[i]);
            } else {
                lacunaAtual++;
                if (lacunaAtual >= lacunaTolerancia) break; // já sabe que vai parar — não precisa olhar o resto do lote
            }
        }

        proximoNumero += TAMANHO_LOTE;
        if (aoProgredir) aoProgredir(proximoNumero);
    }
}

// Varre a galeria inteira (fotos e vídeos) e devolve todos os itens
// encontrados. Usada só em galeria.html, a única tela com barra de
// carregamento visível pra cobrir o tempo da varredura. `aoProgredir`
// alimenta essa barra a cada lote; `aoEncontrarItem`, se passado, é
// chamado a cada item já encontrado (não só no final), para exibir cada
// foto assim que é descoberta. A faixa de fotos varre até o fim sem
// desistir por buracos na numeração; a de vídeos mantém a tolerância normal.
async function galeriaEscanearCompleta(aoProgredir, aoEncontrarItem) {
    const doManifesto = await galeriaCarregarManifesto();
    if (doManifesto) {
        const itensOrdenados = doManifesto.slice().sort((a, b) => a.numero - b.numero);
        if (aoEncontrarItem) itensOrdenados.forEach(aoEncontrarItem);
        galeriaSalvarCacheSeMelhor(itensOrdenados, true);
        return itensOrdenados;
    }

    const itensEncontrados = [];
    const aoEncontrar = (numero, resultado) => {
        itensEncontrados.push({ numero, ...resultado });
        if (aoEncontrarItem) aoEncontrarItem({ numero, ...resultado });
    };

    await galeriaVarrerFaixa(1, GALERIA_INICIO_VIDEOS - 1, aoEncontrar, aoProgredir, 'foto', Infinity);
    await galeriaVarrerFaixa(GALERIA_INICIO_VIDEOS, GALERIA_MAX_NUMERO, aoEncontrar, aoProgredir, 'video');

    // Varredura completa (fotos + vídeos, faixa inteira): o resultado mais
    // confiável que existe, então sempre pode virar o cache — ver bloco de
    // cache no topo deste arquivo.
    galeriaSalvarCacheSeMelhor(itensEncontrados, true);

    return itensEncontrados;
}

/* ----------------------------------------------------------------------
   BOTÃO "VER VÍDEOS" NA GALERIA — galeria.html usa só galeriaEscanearFotos()
   na abertura (vídeos são arquivos pesados); a faixa de vídeos só é varrida
   quando a pessoa aperta "Ver vídeos" (galeriaEscanearVideos, abaixo).
   galeriaEscanearCompleta() segue existindo como fallback de "Nossos
   momentos" (js/romance.js), usada só se nenhuma foto for achada de outro jeito.
   ---------------------------------------------------------------------- */

// Varre (ou usa manifesto/cache) só a faixa de fotos da galeria.
async function galeriaEscanearFotos(aoProgredir, aoEncontrarItem) {
    const doManifesto = await galeriaCarregarManifesto();
    if (doManifesto) {
        const fotos = doManifesto.filter(item => item.tipo === 'foto').sort((a, b) => a.numero - b.numero);
        if (aoEncontrarItem) fotos.forEach(aoEncontrarItem);
        // Guarda o manifesto inteiro como cache completo (já veio tudo numa
        // única resposta), deixando "Ver vídeos" instantâneo depois.
        galeriaSalvarCacheSeMelhor(doManifesto, true);
        return fotos;
    }

    const fotosEncontradas = [];
    const aoEncontrar = (numero, resultado) => {
        fotosEncontradas.push({ numero, ...resultado });
        if (aoEncontrarItem) aoEncontrarItem({ numero, ...resultado });
    };
    await galeriaVarrerFaixa(1, GALERIA_INICIO_VIDEOS - 1, aoEncontrar, aoProgredir, 'foto', Infinity);
    galeriaSalvarCacheSeMelhor(fotosEncontradas, false); // parcial — não sobrescreve um cache completo já salvo
    return fotosEncontradas;
}

// Varre (ou usa manifesto/cache) só a faixa de vídeos locais, a partir de
// GALERIA_INICIO_VIDEOS. Chamada só quando a pessoa aperta "Ver vídeos".
async function galeriaEscanearVideos(aoProgredir, aoEncontrarItem) {
    const doManifesto = await galeriaCarregarManifesto();
    if (doManifesto) {
        const videos = doManifesto.filter(item => item.tipo === 'video').sort((a, b) => a.numero - b.numero);
        if (aoEncontrarItem) videos.forEach(aoEncontrarItem);
        galeriaSalvarCacheSeMelhor(doManifesto, true);
        return videos;
    }

    const videosEncontrados = [];
    const aoEncontrar = (numero, resultado) => {
        videosEncontrados.push({ numero, ...resultado });
        if (aoEncontrarItem) aoEncontrarItem({ numero, ...resultado });
    };
    await galeriaVarrerFaixa(GALERIA_INICIO_VIDEOS, GALERIA_MAX_NUMERO, aoEncontrar, aoProgredir, 'video');

    // Combina com as fotos já conhecidas (se houver) para virar um cache
    // COMPLETO (fotos + vídeos) — assim, numa próxima visita a este mesmo
    // aparelho, apertar "Ver vídeos" de novo já usa o cache, sem varrer a
    // rede outra vez.
    const cacheAtual = galeriaLerCacheBruto();
    const fotosConhecidas = (cacheAtual && Array.isArray(cacheAtual.itens))
        ? cacheAtual.itens.filter(item => item.tipo === 'foto')
        : [];
    galeriaSalvarCacheSeMelhor([...fotosConhecidas, ...videosEncontrados], true);

    return videosEncontrados;
}

// "Nossos momentos" (index.html) só precisa de umas poucas fotos para
// sortear — varredura mais leve que galeriaEscanearCompleta, olhando só a
// faixa de fotos e sempre até o fim (sem parar numa quantidade-alvo), para
// poder espalhar a escolha por toda a numeração (ver escolherFotosEspalhadas).
const GALERIA_DESTAQUE_TETO_MAX = 150; // trava de segurança

async function descobrirFotosParaDestaque() {
    // Usa o manifesto quando existir (evita travar "Nossa História" numa
    // varredura lenta em rede móvel, já que goToRomancePage() espera esta
    // função terminar antes de esconder o overlay de carregamento).
    const doManifesto = await galeriaCarregarManifesto();
    if (doManifesto) {
        // Alimenta o mesmo cache completo de galeriaEscanearCompleta(): o
        // manifesto já traz fotos e vídeos juntos.
        galeriaSalvarCacheSeMelhor(doManifesto, true);
        return doManifesto
            .filter(item => item.tipo === 'foto')
            .map(item => ({ numero: item.numero, caminho: item.caminho }));
    }

    const tetoFotos = Math.min(GALERIA_INICIO_VIDEOS - 1, GALERIA_DESTAQUE_TETO_MAX);
    if (tetoFotos < 1) return [];

    const fotosEncontradas = [];
    const aoEncontrar = (numero, resultado) => {
        if (resultado.tipo === 'foto') fotosEncontradas.push({ numero, caminho: resultado.caminho });
    };

    // Infinity: faixa pequena, varre até o fim para achar todas as fotos reais.
    await galeriaVarrerFaixa(1, tetoFotos, aoEncontrar, null, 'foto', Infinity);

    // Cache parcial (só fotos); não sobrescreve um cache completo melhor.
    galeriaSalvarCacheSeMelhor(fotosEncontradas.map(f => ({ numero: f.numero, caminho: f.caminho, tipo: 'foto' })), false);

    return fotosEncontradas;
}

// Escolhe `quantidade` fotos de `fotos`, evitando números próximos entre si
// (fotos do mesmo dia tendem a ter números seguidos). Ordena por número,
// divide em `quantidade` pedaços aproximadamente iguais e sorteia uma foto
// de cada pedaço.
function escolherFotosEspalhadas(fotos, quantidade) {
    if (!Array.isArray(fotos) || fotos.length === 0 || quantidade <= 0) return [];

    const ordenadas = fotos.slice().sort((a, b) => a.numero - b.numero);

    // Menos fotos disponíveis do que o pedido: não há como espalhar de
    // verdade, devolve todas as que existem (quem chama decide como
    // preencher os cartões restantes, ex.: repetindo).
    if (ordenadas.length <= quantidade) {
        return ordenadas.map(f => f.caminho).sort(() => Math.random() - 0.5);
    }

    const tamanhoPedaco = ordenadas.length / quantidade;
    const escolhidas = [];
    for (let i = 0; i < quantidade; i++) {
        const inicio = Math.floor(i * tamanhoPedaco);
        const fim = Math.max(Math.floor((i + 1) * tamanhoPedaco), inicio + 1);
        const pedaco = ordenadas.slice(inicio, fim);
        escolhidas.push(pedaco[Math.floor(Math.random() * pedaco.length)]);
    }

    return escolhidas.map(f => f.caminho).sort(() => Math.random() - 0.5);
}

function bloquearZoom() {
    // Pinça em iOS Safari dispara eventos "gesture*" que ignoram o
    // user-scalable=no do viewport — precisam ser bloqueados manualmente.
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    // Pinça em navegadores baseados em Chromium chega como touchmove
    // com 2+ toques simultâneos.
    document.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // Duplo toque para zoom: só conta como duplo toque de verdade se as
    // duas batidas caírem no MESMO elemento e bem pertinho uma da outra —
    // do contrário, qualquer sequência de toques rápidos em lugares
    // diferentes (ex.: os easter eggs de 5 toques) tinha o clique
    // suprimido sem querer, porque preventDefault() aqui impede o clique
    // sintético de disparar depois.
    let ultimoToque = 0;
    let ultimoToqueAlvo = null;
    let ultimoToqueX = 0;
    let ultimoToqueY = 0;
    document.addEventListener('touchend', (e) => {
        const agora = Date.now();
        const toque = e.changedTouches && e.changedTouches[0];
        const x = toque ? toque.clientX : 0;
        const y = toque ? toque.clientY : 0;
        const distancia = Math.hypot(x - ultimoToqueX, y - ultimoToqueY);

        if (agora - ultimoToque <= 300 && e.target === ultimoToqueAlvo && distancia < 30) {
            e.preventDefault();
        }
        ultimoToque = agora;
        ultimoToqueAlvo = e.target;
        ultimoToqueX = x;
        ultimoToqueY = y;
    }, { passive: false });

    document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
    });
}

/* ---------------- Orientação de tela ---------------- */
function ehPaisagem() {
    const angle = (screen.orientation && typeof screen.orientation.angle === 'number')
        ? screen.orientation.angle
        : window.orientation || 0;
    if (angle === 90 || angle === -90 || angle === 270) return true;
    return window.innerWidth > window.innerHeight;
}

/* ---------------- Tipos de mídia suportados por navegador ---------------- */
function getSupportedMimeType() {
    const tipos = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (const t of tipos) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

/** Detecta iOS (iPhone/iPad/iPod) — inclui o caso do iPadOS moderno, que se disfarça de "Macintosh" mas tem tela de toque. */
function ehIOS() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+ reporta como "Macintosh", só diferenciável pelo suporte a toque.
    return ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
}

function getSupportedMimeTypeParaModo(modo) {
    if (modo === 'video') return getSupportedMimeType();
    const tiposAudio = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const t of tiposAudio) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

/* ----------------------------------------------------------------------
   BITRATES DE GRAVAÇÃO (evita estourar o limite de 50MB do Supabase)
   ----------------------------------------------------------------------
   Sem esses limites, o MediaRecorder usa o bitrate padrão do navegador,
   que costuma ser bem mais alto do que o necessário para uma tela de
   celular (em alguns navegadores, 8Mbps+ para 720p) — um vídeo de 1-2
   minutos nesse bitrate facilmente passa de 50-100MB. Com os valores
   abaixo, um vídeo de 720p em ~2 minutos fica em torno de 20-30MB,
   mantendo qualidade boa para visualização no celular.
   ---------------------------------------------------------------------- */
const OPCOES_GRAVACAO_VIDEO = { videoBitsPerSecond: 2_000_000, audioBitsPerSecond: 96_000 }; // ~2Mbps vídeo + 96kbps áudio
const OPCOES_GRAVACAO_AUDIO = { audioBitsPerSecond: 96_000 };

/* ----------------------------------------------------------------------
   ESPELHAMENTO REAL DO VÍDEO GRAVADO (não só a pré-visualização)
   ----------------------------------------------------------------------
   Em alguns aparelhos/navegadores, o stream BRUTO da câmera frontal já
   vem espelhado por baixo dos panos (não é um efeito visual — é assim
   que o próprio arquivo gravado sai). Um espelhamento por CSS (como o
   usado na pré-visualização da Polaroid) só muda o que aparece NA TELA;
   não afeta o que o MediaRecorder efetivamente grava. Pra corrigir o
   ARQUIVO de verdade, é preciso redesenhar cada quadro num <canvas>
   espelhado e gravar a partir dele — é isso que criarStreamEspelhado()
   faz abaixo, devolvendo um novo MediaStream (vídeo espelhado + o áudio
   original, sem processamento) pronto para o MediaRecorder.
   ---------------------------------------------------------------------- */
function criarStreamEspelhado(streamOriginal) {
    // Navegador sem suporte a captureStream (raro) — devolve o stream original sem espelhar, pra não quebrar a gravação.
    if (!streamOriginal || typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        return { stream: streamOriginal, parar: () => {} };
    }

    const trilhaVideo = streamOriginal.getVideoTracks()[0];
    const config = (trilhaVideo && trilhaVideo.getSettings) ? trilhaVideo.getSettings() : {};
    const largura = config.width || 1280;
    const altura = config.height || 720;

    const videoOrigem = document.createElement('video');
    videoOrigem.muted = true;
    videoOrigem.playsInline = true;
    videoOrigem.srcObject = streamOriginal;
    videoOrigem.play().catch(() => { /* alguns navegadores exigem interação — o loop abaixo espera o readyState mesmo assim */ });

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');

    let ativo = true;
    function desenharQuadro() {
        if (!ativo) return;
        if (videoOrigem.readyState >= 2) {
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoOrigem, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        requestAnimationFrame(desenharQuadro);
    }
    desenharQuadro();

    let streamCanvas, streamFinal;
    try {
        streamCanvas = canvas.captureStream(30);
        streamFinal = new MediaStream([...streamCanvas.getVideoTracks(), ...streamOriginal.getAudioTracks()]);
    } catch (e) {
        console.error('Falha ao espelhar o vídeo via canvas, gravando sem espelhar:', e);
        ativo = false;
        return { stream: streamOriginal, parar: () => {} };
    }

    return {
        stream: streamFinal,
        parar: () => { ativo = false; videoOrigem.pause(); videoOrigem.srcObject = null; }
    };
}
function montarOpcoesMediaRecorder(modo) {
    const mimeType = getSupportedMimeTypeParaModo(modo);

    // No iOS (Safari/Chrome, mesmo motor WebKit), informar
    // videoBitsPerSecond/audioBitsPerSecond pode fazer o MediaRecorder
    // gravar um arquivo vazio/corrompido sem erro visível — usamos só o
    // mimeType lá (vídeo maior, mas grava de verdade).
    if (ehIOS()) return mimeType ? { mimeType } : {};

    const bitrate = modo === 'video' ? OPCOES_GRAVACAO_VIDEO : OPCOES_GRAVACAO_AUDIO;
    return mimeType ? { mimeType, ...bitrate } : { ...bitrate };
}

/* ---------------- Fundo dinâmico do <body> (corrige "áreas brancas") ----------------
   Durante o bounce-scroll do iOS (ou quando o conteúdo é mais curto que a
   tela), o navegador revela a cor de fundo do <body>. Se o body estivesse
   sempre off-white, telas escuras (romance, suspense, flashback) mostrariam
   um "flash" branco feio no topo/rodapé. Alternamos a cor de fundo do body
   junto com a troca de tela. */
function definirFundoBody(cor) {
    document.body.style.backgroundColor = cor;
    document.documentElement.style.backgroundColor = cor; // ver comentário acima da função
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cor);
}

const CORES_FUNDO = {
    claro: '#FAF9F6',
    escuro: '#241419'
};

/* ---------------- Formatação de datas/tempo ---------------- */
function formatarDataPedido(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Igual a formatarDataPedido, mas incluindo a hora exata (usada no
 * certificado de namoro — "às 20h47", por exemplo — para registrar o
 * momento exato do pedido, não só o dia).
 */
function formatarDataPedidoComHora(iso) {
    const d = new Date(iso);
    const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr}, às ${horaStr}`;
}

function formatarDataHoraMensagem(iso) {
    const d = new Date(iso);
    const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr} às ${horaStr}`;
}

function formatarTempoPlaylist(segundos) {
    if (!isFinite(segundos) || segundos < 0) segundos = 0;
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${String(seg).padStart(2, '0')}`;
}

function gerarIdUnico(prefixo) {
    return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- Conversão DataURL -> Blob (usada ao restaurar backups antigos, ver js/export.js) ---------------- */
function dataURLParaBlob(dataUrl) {
    const partes = dataUrl.split(',');
    const mimeMatch = partes[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
    const binario = atob(partes[1]);
    const array = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) array[i] = binario.charCodeAt(i);
    return new Blob([array], { type: mime });
}

/* ----------------------------------------------------------------------
   COMPRESSÃO DE IMAGENS NO NAVEGADOR (evita estourar o limite de 50MB do
   Supabase e deixa a sincronização entre aparelhos mais rápida)
   ----------------------------------------------------------------------
   Fotos de celular hoje em dia costumam ter vários MB mesmo sendo
   exibidas em uma tela pequena. Antes de salvar, redimensionamos (lado
   maior limitado) e reexportamos como JPEG — sem precisar de nenhuma
   biblioteca externa, só <canvas>, que já existe em qualquer navegador.
   Isso normalmente reduz o arquivo em 60-85% sem perda visível no
   celular. Em qualquer falha, devolve o arquivo original sem alterações
   — comprimir nunca deve impedir a pessoa de salvar a foto.
   ---------------------------------------------------------------------- */
async function comprimirImagem(arquivo, { larguraMaxima = 1600, alturaMaxima = 1600, qualidade = 0.82 } = {}) {
    if (!arquivo || !arquivo.type || !arquivo.type.startsWith('image/')) return { blob: arquivo, mimeType: arquivo ? arquivo.type : '' };
    if (arquivo.type === 'image/gif') return { blob: arquivo, mimeType: arquivo.type }; // GIF animado perderia a animação passando pelo canvas

    try {
        const fonte = await carregarFonteDeImagem(arquivo);
        if (!fonte) return { blob: arquivo, mimeType: arquivo.type };

        const largura = fonte.width, altura = fonte.height;
        const escala = Math.min(1, larguraMaxima / largura, alturaMaxima / altura);
        const larguraFinal = Math.max(1, Math.round(largura * escala));
        const alturaFinal = Math.max(1, Math.round(altura * escala));

        const canvas = document.createElement('canvas');
        canvas.width = larguraFinal;
        canvas.height = alturaFinal;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(fonte, 0, 0, larguraFinal, alturaFinal);
        if (fonte.close) fonte.close(); // libera memória se for um ImageBitmap

        const blobComprimido = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', qualidade));
        if (!blobComprimido) return { blob: arquivo, mimeType: arquivo.type };

        // Só usa o resultado comprimido se ele realmente ficou menor — fotos já
        // pequenas/comprimidas às vezes ficam maiores ao reexportar como JPEG.
        if (blobComprimido.size >= arquivo.size) return { blob: arquivo, mimeType: arquivo.type };

        return { blob: blobComprimido, mimeType: 'image/jpeg' };
    } catch (e) {
        console.error('Falha ao comprimir imagem, salvando o arquivo original:', e);
        return { blob: arquivo, mimeType: arquivo.type };
    }
}

/** Decodifica um File/Blob de imagem em algo que dá pra desenhar num canvas (createImageBitmap, com fallback via <img>). */
async function carregarFonteDeImagem(arquivo) {
    try {
        if (window.createImageBitmap) return await createImageBitmap(arquivo);
    } catch (e) { /* alguns formatos (ex: HEIC sem suporte no navegador) falham aqui — cai no fallback abaixo */ }

    return await new Promise((resolve) => {
        const url = URL.createObjectURL(arquivo);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
    });
}

// No Safari do iPhone, o atributo "download" é praticamente ignorado
// quando o link aponta pra uma data URI — nada era salvo apesar da
// mensagem de sucesso. Tenta primeiro navigator.share (confiável no
// iPhone), cai para o link de download tradicional, e por fim abre numa
// aba nova como último recurso.
async function salvarOuCompartilharArquivo(blob, nomeArquivo, mimeType) {
    try {
        const arquivo = new File([blob], nomeArquivo, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            await navigator.share({ files: [arquivo] });
            return 'compartilhado';
        }
    } catch (e) {
        // Pessoa cancelou a folha de compartilhamento, ou o navegador recusou —
        // não é erro de verdade, só cai pro próximo jeito abaixo.
    }

    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = nomeArquivo;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        return 'baixado';
    } catch (e) {
        try {
            window.open(URL.createObjectURL(blob), '_blank');
            return 'aberto';
        } catch (e2) {
            return 'falhou';
        }
    }
}
