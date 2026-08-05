/**
 * UTILS.JS — Funções utilitárias compartilhadas.
 */

// Data em que este aparelho abriu o site pela primeira vez — usada tanto
// pelo contador vivo do relacionamento (js/romance.js) quanto pelo
// backup/sincronização (js/export.js, dataInicioRelacionamento). Mora
// aqui (não em romance.js) porque export.js também é carregado em
// diagnostico.html e checklist.html, que não carregam romance.js —
// antes disso causava "obterOuCriarDataPrimeiroAcesso is not defined" e
// quebrava a sincronização/backup em silêncio nessas duas páginas.
async function obterOuCriarDataPrimeiroAcesso() {
    let data = await obterConfiguracao('aurora_primeiro_acesso');
    if (!data) { data = new Date().toISOString(); await salvarConfiguracao('aurora_primeiro_acesso', data); }
    return data;
}

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

    // Player embutido: usado pela cápsula do tempo (vídeo do YouTube, via
    // opcoes.videoYoutubeId) e pela carta de discussão (vídeo do pedido
    // já gravado no aparelho, via opcoes.videoLocalUrl — um blob local,
    // sem precisar subir em lugar nenhum). opcoes.videoLegenda mostra uma
    // mensagem pequena em cima do vídeo (ex.: "lembre-se que nos amamos").
    const videoWrap = document.getElementById('modoVelaVideoWrap');
    const videoLegendaEl = document.getElementById('modoVelaVideoLegenda');
    if (videoWrap) {
        videoWrap.innerHTML = '';
        if (opcoes.videoLocalUrl) {
            const videoLocal = document.createElement('video');
            videoLocal.controls = true;
            videoLocal.playsInline = true;
            videoLocal.preload = 'metadata';
            videoLocal.src = opcoes.videoLocalUrl;
            videoWrap.appendChild(videoLocal);
            videoWrap.classList.remove('d-none');
        } else if (opcoes.videoYoutubeId) {
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
    if (videoLegendaEl) {
        if (opcoes.videoLegenda && videoWrap && !videoWrap.classList.contains('d-none')) {
            videoLegendaEl.textContent = opcoes.videoLegenda;
            videoLegendaEl.classList.remove('d-none');
        } else {
            videoLegendaEl.textContent = '';
            videoLegendaEl.classList.add('d-none');
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
            if (videoLegendaEl) { videoLegendaEl.textContent = ''; videoLegendaEl.classList.add('d-none'); }
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

/**
 * Tenta recuperar uma foto que "existe" no servidor (por isso não caiu no
 * placeholder de "arquivo faltando") mas mesmo assim não carrega no
 * navegador. Cobre dois casos, ambos com a mesma raiz — o arquivo por
 * dentro é de um formato diferente do que a extensão do nome promete:
 *
 * 1) Foto do iPhone que ficou fisicamente em HEIC, só com a extensão
 *    trocada pra .jpg por fora.
 * 2) Qualquer outro arquivo salvo com a extensão errada (ex.: um PNG
 *    renomeado à mão pra .jpg).
 *
 * O Safari é bem tolerante e decodifica pelo conteúdo real do arquivo
 * quase sempre, então essas fotos abrem normalmente no iPhone. O Chrome
 * (PC ou Android, sempre o mesmo motor) é mais rígido com isso e recusa
 * — por isso o mesmo arquivo funciona num aparelho e quebra em outro.
 *
 * Faz isso: baixa o arquivo, olha os primeiros bytes (a "assinatura" do
 * formato, independente da extensão do nome). Se for HEIC/HEIF, converte
 * pra JPEG de verdade usando a biblioteca heic2any (carregada via CDN,
 * ver index.html/galeria.html). Para qualquer outro caso de formato
 * incompatível com a extensão (PNG/WEBP/GIF/BMP disfarçado de .jpg, por
 * exemplo), usa createImageBitmap — nativo do navegador, decodifica pelo
 * conteúdo real do arquivo igual o Safari faz — e redesenha num <canvas>
 * pra gerar uma versão nova, com o formato batendo de verdade. Devolve
 * uma URL local já corrigida, ou null se não for nada disso (aí é falta
 * de arquivo mesmo, ou o arquivo está mesmo corrompido).
 */
// Espera a biblioteca heic2any (carregada via <script defer> no
// index.html/galeria.html) ficar pronta, em vez de desistir na primeira
// checada. Em teoria "defer" garante que ela já rodou antes do
// DOMContentLoaded, mas na prática (CDN lento, bloqueador de conteúdo do
// Samsung Internet, rede ruim) o script pode ainda não ter terminado —
// ou até ter falhado — no exato instante em que uma foto quebra. Sem
// essa espera, a tentativa de recuperação desistia pra sempre (nunca
// tentava de novo), fazendo a foto HEIC parecer "quebrada" fora do
// Safari mesmo quando a biblioteca acabava carregando um instante depois.
function aguardarHeic2Any(timeoutMs = 12000) {
    if (typeof heic2any === 'function') return Promise.resolve(true);
    return new Promise((resolve) => {
        const inicio = Date.now();
        const intervalo = setInterval(() => {
            if (typeof heic2any === 'function') {
                clearInterval(intervalo);
                resolve(true);
            } else if (Date.now() - inicio > timeoutMs) {
                clearInterval(intervalo);
                resolve(false); // esgotou o tempo: provavelmente falhou/CDN bloqueado mesmo
            }
        }, 200);
    });
}

// Tenta decodificar o blob pelo conteúdo real (não pela extensão do nome
// do arquivo) usando createImageBitmap, nativo do navegador — cobre PNG,
// WEBP, GIF, BMP etc. salvos com a extensão errada. Redesenha num
// <canvas> e devolve uma URL local em JPEG, já corrigida.
async function tentarRecuperarPorAssinaturaGenerica(blobOriginal) {
    try {
        const bitmap = await createImageBitmap(blobOriginal);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const blobFinal = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blobFinal) return null;
        return URL.createObjectURL(blobFinal);
    } catch (e) {
        return null; // realmente não é uma imagem decodificável (arquivo corrompido, faltando de verdade etc.)
    }
}

async function tentarRecuperarComoHeic(url) {
    try {
        const resposta = await fetch(url, { cache: 'no-store' });
        if (!resposta.ok) return null;
        const blobOriginal = await resposta.blob();

        // Assinatura ISOBMFF: bytes 4-7 = "ftyp", bytes 8-11 = a "marca"
        // do formato. HEIC/HEIF usam um punhado de marcas conhecidas.
        const cabecalho = new Uint8Array(await blobOriginal.slice(0, 12).arrayBuffer());
        const ehFtyp = cabecalho.length >= 12 && cabecalho[4] === 0x66 && cabecalho[5] === 0x74 && cabecalho[6] === 0x79 && cabecalho[7] === 0x70; // "ftyp"
        const marca = ehFtyp ? String.fromCharCode(cabecalho[8], cabecalho[9], cabecalho[10], cabecalho[11]) : '';
        const marcasHeic = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];

        if (ehFtyp && marcasHeic.includes(marca)) {
            // É mesmo HEIC/HEIF disfarçado: precisa da heic2any pra converter.
            const bibliotecaPronta = await aguardarHeic2Any();
            if (!bibliotecaPronta || typeof heic2any !== 'function') return null; // esgotou a espera: biblioteca realmente não carregou (ex.: sem internet)
            const convertido = await heic2any({ blob: blobOriginal, toType: 'image/jpeg', quality: 0.92 });
            const blobFinal = Array.isArray(convertido) ? convertido[0] : convertido;
            return URL.createObjectURL(blobFinal);
        }

        // Não é HEIC — tenta o caminho genérico (PNG/WEBP/GIF/etc. salvo
        // com a extensão errada, ou qualquer outra incompatibilidade de
        // formato que o Chrome recusa mas o Safari tolera).
        return await tentarRecuperarPorAssinaturaGenerica(blobOriginal);
    } catch (e) {
        console.warn('Não foi possível recuperar imagem com formato/extensão incompatível:', url, e);
        return null;
    }
}

function iniciarFallbackImagensGlobais() {
    document.addEventListener('error', async (e) => {
        const el = e.target;
        if (el && el.tagName === 'IMG' && !el.dataset.fallbackAplicado && el.src !== SVG_PLACEHOLDER_GENERICO) {
            el.dataset.fallbackAplicado = '1';
            const urlOriginal = el.src;
            const urlRecuperada = await tentarRecuperarComoHeic(urlOriginal);
            if (urlRecuperada) {
                delete el.dataset.fallbackAplicado; // se a versão recuperada também falhar por algum motivo, deixa tentar de novo (vai cair no placeholder, já que não vai bater a assinatura HEIC de novo)
                el.src = urlRecuperada;
            } else {
                el.src = SVG_PLACEHOLDER_GENERICO;
            }
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

    // Em modo "rever a lojinha" (ver modoVisualizacaoLojaAtiva, js/store.js)
    // os easter eggs já foram todos descobertos de verdade antes; a tela
    // ainda aparece de novo, mas nada é gravado no banco.
    const emRevivida = typeof modoVisualizacaoLojaAtiva !== 'undefined' && modoVisualizacaoLojaAtiva;
    if (!encontrados.includes(id) && !emRevivida) {
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
        // Zera qualquer rolagem "presa" num container que não devia ter
        // rolagem própria nenhuma (ex.: #romancePage, que já tem
        // overflow:hidden — mas pode acumular um scrollTop interno em
        // alguns navegadores/toques, escondendo o topo do conteúdo).
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const romancePage = document.getElementById('romancePage');
        if (romancePage) romancePage.scrollTop = 0;
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

/* ----------------------------------------------------------------------
   MENSAGEM DE PERMISSÃO DE CÂMERA/MICROFONE BLOQUEADA
   ----------------------------------------------------------------------
   Depois que o navegador REALMENTE bloqueia câmera/microfone para um
   site (usuário negou uma vez, ou o site está travado nas configurações
   do navegador), ele para de mostrar aquele popup de "Permitir" — clicar
   de novo no botão da página não adianta nada, porque o navegador nem
   chega a perguntar de novo. É só isso que resolve: mudar a permissão
   nas configurações do próprio navegador/aparelho e, depois, recarregar
   a página (só reabrir não é suficiente em vários navegadores, o reload
   é o que faz ele reavaliar a permissão).
   Esta função não "desbloqueia" nada sozinha (isso o JavaScript não
   consegue fazer, é uma proteção de segurança do navegador) — ela só
   identifica o motivo e explica o caminho certo pra esse aparelho. */
function ehIOSSafariComoNavegador() {
    const ua = navigator.userAgent || '';
    return ehIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function instrucoesDesbloquearPermissaoMidia(err) {
    const nome = err && err.name;

    if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
        return 'Não encontrei câmera ou microfone neste aparelho (ou outro app está usando eles agora). Feche outros apps que possam estar usando a câmera/microfone e tente de novo.';
    }
    if (nome === 'NotReadableError' || nome === 'TrackStartError') {
        return 'A câmera/microfone não respondeu — geralmente é outro aplicativo (ou outra aba) usando eles ao mesmo tempo. Feche os outros apps/abas e tente de novo.';
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        return 'Este site precisa ser aberto por um link "https://" para gravar áudio/vídeo — links "http://" sem o "s" são bloqueados pelo próprio navegador por segurança.';
    }

    // A partir daqui, é permissão negada de verdade (NotAllowedError /
    // PermissionDeniedError / SecurityError) — o botão "permitir" na
    // página não resolve mais; precisa mudar isso nas configurações do
    // navegador e recarregar.
    if (ehIOSSafariComoNavegador()) {
        return 'A câmera/microfone estão bloqueados para este site nas configurações do iPhone. Vá em Ajustes > Safari > Câmera (e Microfone) e permita, ou Ajustes > Safari > Configurações de Site (na parte de baixo) e libere este site. Depois, volte aqui e recarregue a página.';
    }
    if (ehIOS()) {
        return 'A câmera/microfone estão bloqueados para este site. Vá em Ajustes do iPhone > procure o app do navegador que você está usando (Chrome, Firefox etc.) > libere Câmera e Microfone. Depois volte aqui e recarregue a página.';
    }
    if (/android/i.test(navigator.userAgent || '')) {
        return 'A câmera/microfone estão bloqueados para este site. Toque no ícone de cadeado (ou "i") ao lado do endereço no topo do navegador > Permissões do site > libere Câmera e Microfone. Depois recarregue a página.';
    }
    return 'A câmera/microfone estão bloqueados para este site nas configurações do navegador. Procure o ícone de cadeado/informações ao lado do endereço, abra as permissões do site e libere Câmera e Microfone — depois recarregue a página.';
}

/* ----------------------------------------------------------------------
   TOQUE + VIBRAÇÃO NOS MOMENTOS-CHAVE
   ----------------------------------------------------------------------
   Um sininho bem suave (sintetizado na hora via Web Audio — sem precisar
   de nenhum arquivo de áudio externo) e uma vibração levinha no celular
   (só existe em Android; iOS Safari não libera vibração pra web, então
   lá simplesmente não faz nada, sem gerar erro) — chamados juntos nos
   momentos que merecem um "confirmado com carinho": abrir a cápsula do
   tempo, revelar uma previsão, marcar um item do checklist, registrar o
   humor do dia, assinar o contrato.
   Guarda a preferência (som ligado/desligado) em 'aurora_som_ativo' —
   respeita a escolha da pessoa entre uma sessão e outra.
   ---------------------------------------------------------------------- */
let __auroraSomAtivo = true;
let __auroraAudioCtx = null;

(async () => {
    const salvo = await obterConfiguracao('aurora_som_ativo');
    if (salvo === 'false') __auroraSomAtivo = false;
})();

function alternarSomAmbiente(ativo) {
    __auroraSomAtivo = ativo;
    salvarConfiguracao('aurora_som_ativo', String(ativo));
}

function tocarSininho(intensidade = 1) {
    if (!__auroraSomAtivo) return;
    try {
        if (!__auroraAudioCtx) __auroraAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = __auroraAudioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const agora = ctx.currentTime;
        // Dois tons curtos e suaves (um acorde simples), com fade-out —
        // soa como um "tin" delicado, não como notificação de app.
        [880, 1318.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, agora);
            gain.gain.linearRampToValueAtTime(0.09 * intensidade, agora + 0.02 + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.9);
            osc.connect(gain).connect(ctx.destination);
            osc.start(agora + i * 0.05);
            osc.stop(agora + 1);
        });
    } catch (e) { /* Web Audio indisponível — silenciosamente ignora */ }
}

function vibrarLeve(padrao = 15) {
    try { if (navigator.vibrate) navigator.vibrate(padrao); } catch (e) { /* iOS/Safari: API não existe — ignora */ }
}

// Função única pra chamar nos momentos-chave — som + vibração juntos.
function celebrarMomento(intensidade = 1) {
    tocarSininho(intensidade);
    vibrarLeve(intensidade > 1 ? [12, 30, 12] : 15);
}

/* ---------------------------------------------------------------------
 * VIBRAÇÃO LEVE AO TOCAR, NO SITE INTEIRO (30/07 em diante)
 * ----------------------------------------------------------------------
 * O "encolher ao tocar" (ver comentário "Toque com molejo" em
 * css/style.css, `button:active, a:active...`) já existe globalmente —
 * não precisa de JS nenhum, é só `:active` + transition, e já cobre
 * qualquer botão/link do site. O que faltava mesmo era a vibração: só a
 * checklist e alguns poucos momentos-chave de "Nossa História" tinham
 * (via celebrarMomento(), acima). Esse listener estende só a VIBRAÇÃO
 * (bem mais sutil que celebrarMomento) pro site inteiro, sem mexer no
 * efeito visual, que já está bom.
 *
 * IMPORTANTE: não adiciona nenhuma animação/classe nova no elemento —
 * fazer isso competiria com a transição de transform que já existe no
 * ":active" de cada botão (as duas mexem na mesma propriedade ao mesmo
 * tempo), o que dava um "pulo" feio bem no instante de soltar o toque.
 * Só a vibração é nova aqui.
 *
 * Qualquer botão que já dispare sua própria vibração (ex.: celebrarMomento
 * nos momentos especiais) pode ficar de fora com data-sem-toque-global,
 * pra não vibrar duas vezes seguidas no mesmo toque.
 */
function iniciarToqueFeedbackGlobal() {
    const SELETOR_TOCAVEL = 'button, .btn, [role="button"], a.btn, .toque-feedback';
    document.addEventListener('click', (evento) => {
        const alvo = evento.target.closest(SELETOR_TOCAVEL);
        if (!alvo || alvo.disabled || alvo.classList.contains('disabled')) return;
        if (alvo.hasAttribute('data-sem-toque-global')) return;
        vibrarLeve(8);
    }, { passive: true });
}
document.addEventListener('DOMContentLoaded', iniciarToqueFeedbackGlobal);

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

/* ----------------------------------------------------------------------
   SHA-256 EM JAVASCRIPT PURO (sem depender do Web Crypto / crypto.subtle)
   ----------------------------------------------------------------------
   O Web Crypto (crypto.subtle) só existe em "contexto seguro": HTTPS ou
   http://localhost. Ele NÃO existe quando a página é aberta direto do
   disco (file:///...), que é como a maioria testa o site localmente
   antes de subir pro GitHub Pages — nesse caso crypto.subtle é
   `undefined` e qualquer senha passava a ser recusada, mesmo digitando
   certo. Esta implementação (algoritmo padrão do NIST) roda em qualquer
   contexto — file://, http:// local ou https:// — sem precisar de
   nenhuma biblioteca externa.
   ---------------------------------------------------------------------- */
function sha256Hex(mensagem) {
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    const K = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    const bytesOriginais = new TextEncoder().encode(mensagem || '');
    const bitLen = bytesOriginais.length * 8;
    let tamanhoComPadding = bytesOriginais.length + 1;
    while (tamanhoComPadding % 64 !== 56) tamanhoComPadding++;
    tamanhoComPadding += 8;

    const bytes = new Uint8Array(tamanhoComPadding);
    bytes.set(bytesOriginais);
    bytes[bytesOriginais.length] = 0x80;
    // bitLen como inteiro de 64 bits big-endian (mensagens deste projeto
    // nunca chegam nem perto de 2^32 bits, então os 4 bytes altos ficam 0)
    const view = new DataView(bytes.buffer);
    view.setUint32(tamanhoComPadding - 4, bitLen >>> 0, false);

    const w = new Array(64);
    for (let offset = 0; offset < bytes.length; offset += 64) {
        for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i-15], 7) ^ rotr(w[i-15], 18) ^ (w[i-15] >>> 3);
            const s1 = rotr(w[i-2], 17) ^ rotr(w[i-2], 19) ^ (w[i-2] >>> 10);
            w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
        }

        let [a,b,c,d,e,f,g,h] = H;
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
            const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + temp1) | 0;
            d = c; c = b; b = a; a = (temp1 + temp2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

/* ----------------------------------------------------------------------
   VERIFICAÇÃO DE SENHA POR HASH (SENHA_AREA_MEMORIAS_HASH,
   SENHA_CARTA_DISCUSSAO_HASH, SENHA_RESET_SITE_HASH — todas em
   js/config.js)
   ----------------------------------------------------------------------
   Calcula o SHA-256 do que a pessoa digitou e compara com o hash salvo,
   em vez de comparar a senha em texto puro. Isso NÃO é segurança de
   verdade (ver nota em SENHA_RESET_SITE_HASH, js/config.js) — só evita
   que a senha apareça legível de bandeja pra quem abrir o código-fonte
   por curiosidade. Usa a implementação própria de SHA-256 acima (em vez
   de crypto.subtle) justamente para funcionar também quando a página é
   testada localmente com file:// (ver explicação acima).
   ---------------------------------------------------------------------- */
async function verificarSenhaHash(digitada, hashEsperado) {
    try {
        const hashDigitada = sha256Hex(digitada || '');
        return hashDigitada === hashEsperado;
    } catch (e) {
        console.error('Falha ao verificar senha:', e);
        return false;
    }
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

/* ----------------------------------------------------------------------
   VERIFICAÇÃO / CONVERSÃO DE VÍDEO
   ----------------------------------------------------------------------
   É comum um arquivo ter extensão/nome de mp4 (ou o iPhone/app de origem
   entregar assim) sem ser, de fato, um mp4 que o navegador consegue abrir
   (ex.: é na verdade um .mov com um codec que o Chrome não decodifica, um
   .avi só renomeado, um mp4 com um codec de vídeo não suportado etc.).
   Extensão nenhuma garante o CONTEÚDO — só testando de verdade é que dá
   pra saber.

   1. testarVideoReproduzivel(): tenta carregar os metadados num <video>
      escondido. Se falhar, o arquivo não é reproduzível como está.
   2. converterVideoSeNecessario(): se o teste falhar, converte de
      verdade pra um mp4 H.264/AAC usando ffmpeg.wasm — carregado sob
      demanda (não pesa no site pra quem nunca precisar disso; é uma
      biblioteca de ~25MB, então só baixa quando realmente vai converter
      algo).
   ---------------------------------------------------------------------- */

// Testa se o navegador consegue mesmo carregar os metadados do vídeo —
// não basta a extensão dizer .mp4, o CONTEÚDO precisa ser algo que o
// navegador entenda de verdade.
function testarVideoReproduzivel(blob) {
    return new Promise((resolve) => {
        let resolvido = false;
        let url;
        try {
            url = URL.createObjectURL(blob);
        } catch (e) {
            resolve(false);
            return;
        }

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;

        const finalizar = (ok) => {
            if (resolvido) return;
            resolvido = true;
            URL.revokeObjectURL(url);
            video.removeAttribute('src');
            resolve(ok);
        };

        // CORREÇÃO: vídeos gravados pelo próprio site via MediaRecorder
        // (ver salvarVideoComSeguranca, js/suspense.js) saem sem o cabeçalho
        // de duração (sem "Cues"), e por isso o navegador reporta
        // video.duration = Infinity — um comportamento normal e documentado
        // do MediaRecorder, não um sinal de arquivo quebrado (o vídeo toca
        // normalmente do início ao fim). Antes, `Number.isFinite(...)`
        // rejeitava Infinity como se o vídeo não abrisse, fazendo o vídeo do
        // pedido sumir da tela inicial (romance.js, garantirBackupDeVideoDisponivel)
        // e vídeos bons da galeria aparecerem como "não abriu" no diagnóstico.
        // `duration > 0` sozinho já cobre isso: verdadeiro pra Infinity e pra
        // qualquer duração real, falso pra NaN/0 (arquivo de fato incompatível).
        video.onloadedmetadata = () => finalizar(video.duration > 0);
        video.onerror = () => finalizar(false);
        // Alguns navegadores não disparam nenhum dos dois eventos com um
        // arquivo realmente incompatível — depois de 6s, assume que não deu certo.
        setTimeout(() => finalizar(false), 6000);

        video.src = url;
    });
}

let __ffmpegInstancia = null;

// Carrega o ffmpeg.wasm (versão single-thread, que funciona em qualquer
// hospedagem estática comum, sem precisar de cabeçalhos especiais de
// servidor) só na primeira vez que uma conversão de verdade for precisa.
async function carregarFFmpegSobDemanda(aoProgredir) {
    if (__ffmpegInstancia) return __ffmpegInstancia;

    if (typeof FFmpeg === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@ffmpeg/[email protected]/dist/ffmpeg.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Não consegui carregar o conversor de vídeo (verifique sua internet e tente de novo).'));
            document.head.appendChild(script);
        });
    }

    const { createFFmpeg } = FFmpeg;
    const instancia = createFFmpeg({
        log: false,
        corePath: 'https://unpkg.com/@ffmpeg/[email protected]/dist/ffmpeg-core.js',
        progress: ({ ratio }) => {
            if (aoProgredir && Number.isFinite(ratio) && ratio >= 0) aoProgredir(Math.min(99, Math.round(ratio * 100)));
        }
    });
    await instancia.load();
    __ffmpegInstancia = instancia;
    return instancia;
}

/**
 * Recebe um File/Blob de vídeo. Se o navegador não conseguir mesmo tocá-lo
 * (apesar da extensão/nome dizer mp4), converte de verdade pra um mp4
 * H.264/AAC compatível, usando ffmpeg.wasm. Devolve sempre um Blob pronto
 * pra salvar — o original, se já estiver tudo certo, ou o convertido, se
 * precisou. `aoProgredir(percentual, etapa)` é opcional, pra mostrar
 * status na tela durante a conversão (que pode levar alguns minutos num
 * celular, dependendo do tamanho do vídeo).
 */
async function converterVideoSeNecessario(arquivo, aoProgredir) {
    if (!arquivo || !(arquivo.type || '').startsWith('video/')) return arquivo;

    if (aoProgredir) aoProgredir(0, 'verificando');
    const reproduzivel = await testarVideoReproduzivel(arquivo);
    if (reproduzivel) return arquivo;

    if (aoProgredir) aoProgredir(0, 'preparando-conversor');
    const ffmpeg = await carregarFFmpegSobDemanda((p) => aoProgredir && aoProgredir(p, 'convertendo'));
    const { fetchFile } = FFmpeg;

    const nomeOriginal = arquivo.name || '';
    const extensaoOriginal = nomeOriginal.includes('.') ? nomeOriginal.slice(nomeOriginal.lastIndexOf('.')) : '.mp4';
    const nomeEntrada = `entrada${extensaoOriginal}`;

    try {
        ffmpeg.FS('writeFile', nomeEntrada, await fetchFile(arquivo));
        await ffmpeg.run(
            '-i', nomeEntrada,
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            'saida.mp4'
        );
        const dados = ffmpeg.FS('readFile', 'saida.mp4');
        if (aoProgredir) aoProgredir(100, 'concluido');
        return new Blob([dados.buffer], { type: 'video/mp4' });
    } finally {
        try { ffmpeg.FS('unlink', nomeEntrada); } catch (e) { /* pode nem ter chegado a escrever */ }
        try { ffmpeg.FS('unlink', 'saida.mp4'); } catch (e) { /* pode ter falhado antes de gerar */ }
    }
}
