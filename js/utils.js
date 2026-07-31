/**
 * ============================================================================
 * UTILS.JS — Funções utilitárias compartilhadas
 * ============================================================================
 */

/**
 * Testa (via HEAD request) se um arquivo existe de verdade em
 * /assets — genérico, sem ligação com nenhuma feature específica.
 * Usada por resolverFotoPlaceholder() (js/config.js), entre outras.
 */
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
// modal/overlay do site está aberto, restaurando a posição exata de onde a
// pessoa estava ao fechar. Mora em utils.js (carregado em index.html,
// galeria.html, checklist.html e diagnostico.html) justamente para poder
// ser usada por QUALQUER modal em QUALQUER página — antes vivia só em
// romance.js, então diagnostico.html (e qualquer modal fora do romance.js)
// não tinha como usá-la.
//
// É uma contagem de referências: se dois overlays travarem a rolagem de
// forma sobreposta (ex.: um modal abre outro por cima), só destrava de
// verdade quando todo mundo que travou também destravou — o primeiro a
// fechar não derruba a trava do outro que ainda está aberto.
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

/**
 * Modo "luz de vela" — escurece a tela e mostra o texto de uma carta já
 * revelada (carta final, cápsula do tempo ou carta de discussão) num
 * papel iluminado, como se estivesse sendo lida à luz de uma vela.
 * Recebe o HTML já pronto (com qualquer troca de nome já feita), não o
 * texto bruto — não refaz nenhuma lógica de revelação, só troca a
 * apresentação visual.
 *
 * `opcoes.aoContinuar`, se fornecido, mostra um botão "Continuar" dentro
 * do próprio modo vela (usado só pela carta final, que precisa seguir
 * pro flashback/"Nossa História" depois de lida).
 */
function abrirModoVela(eyebrowTexto, textoHtml, assinaturaTexto, opcoes = {}) {
    const overlay = document.getElementById('modoVelaOverlay');
    if (!overlay) return;
    document.getElementById('modoVelaEyebrow').textContent = eyebrowTexto || '';
    document.getElementById('modoVelaTexto').innerHTML = textoHtml || '';
    document.getElementById('modoVelaAssinatura').textContent = assinaturaTexto || '';
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();

    // Player embutido, hoje só usado pela cápsula do tempo (ver
    // iniciarEnvelopeCapsula em js/romance.js) — as outras cartas que usam
    // este mesmo modal (final e de discussão) não passam videoYoutubeId,
    // então este bloco fica escondido e vazio pra elas.
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

    /* CORREÇÃO (item 2 do prompt de correções): quando existe um botão
       "Continuar" obrigatório (hoje só a carta final usa isso), o X de
       fechar precisa sumir e clicar fora também não pode fechar — fechar
       sem apertar "Continuar" pulava o passo que salva o estágio como
       'final' e leva pro flashback/"Nossa História", deixando o site
       travado sem conseguir avançar. Nas demais cartas (cápsula do tempo,
       carta de discussão), que não usam aoContinuar, o X continua
       funcionando exatamente como antes. */
    if (exigeContinuar) {
        btnFechar.classList.add('d-none');
        btnFechar.onclick = null;
        overlay.onclick = null;
    } else {
        btnFechar.classList.remove('d-none');
        // `opcoes.aoFechar`, se fornecido, roda depois de fechar o modo vela
        // (usado pela cápsula do tempo pra fechar o envelope de novo e
        // deixar pronto pra abrir do zero na próxima vez — ver
        // iniciarEnvelopeCapsula em romance.js).
        const fechar = () => {
            overlay.classList.add('d-none');
            // Some o player junto (não só esconde): sem isso, um vídeo do
            // YouTube tocando continuaria rodando com áudio escondido atrás
            // do overlay fechado.
            if (videoWrap) videoWrap.innerHTML = '';
            desbloquearScrollFundoLembranca();
            if (typeof opcoes.aoFechar === 'function') opcoes.aoFechar();
        };
        btnFechar.onclick = fechar;
        overlay.onclick = (evt) => { if (evt.target === overlay) fechar(); };
    }
}

/* ---------------- Substituição segura de imagens (placeholders) ---------------- */
/**
 * Aplica getAsset() a uma <img> e prepara um "onerror" elegante: se o
 * arquivo real ainda não foi enviado para o /assets, mostra um quadro com
 * ícone + legenda em vez de um ícone de imagem quebrada.
 */
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

/**
 * Aplica getAsset() a uma <img> e prepara um "onerror" elegante: se o
 * arquivo real ainda não foi enviado para o /assets, mostra uma imagem de
 * substituição (ícone + legenda) em vez do ícone de imagem quebrada do
 * navegador. Mantém sempre um elemento <img> de verdade (em vez de trocar
 * por uma <div>), para que trocas futuras de "src" (ex: miniaturas do
 * produto) continuem funcionando normalmente.
 */
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

/**
 * Rede de segurança global: qualquer <img> do site que falhe ao carregar
 * (arquivo de placeholder ainda não enviado, link quebrado, etc.) recebe
 * uma imagem de substituição elegante em vez do ícone padrão de "imagem
 * quebrada" do navegador. Complementa aplicarImagemPlaceholder() para os
 * casos em que o src é trocado dinamicamente (ex: miniaturas do produto).
 */
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


/**
 * Conta toques repetidos no MESMO elemento dentro de uma janela curta de
 * tempo (evita contar cliques espalhados ao longo do dia) e dispara um
 * callback ao atingir a quantidade necessária. Mecanismo genérico por
 * trás de todos os easter eggs de "N toques" do site (loja e a lua do
 * Nosso céu).
 */
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

/**
 * Contador de easter eggs — compartilhado por TODOS eles (loja, lua,
 * frete). Marca o id como encontrado (persistido, sobrevive a reload),
 * sem contar duas vezes o mesmo, e atualiza o contador discreto no canto
 * da tela. Não revela QUAIS ela já achou, só o total.
 */
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

/**
 * CORREÇÃO (item 1 do prompt de correções): o contador só pode aparecer
 * depois que o pedido de namoro já aconteceu, dentro de "Nossa História" —
 * nunca na loja inicial nem no checkout/carta. `contadorEasterEggsFaseFinal`
 * só vira true dentro de ativarContadorEasterEggsFaseFinal(), chamada em
 * goToRomancePage() (js/romance.js). Antes disso, os easter eggs da loja
 * continuam sendo contados e persistidos normalmente por baixo dos panos,
 * só o número não é exibido ainda. Quando todos os 9 já foram encontrados,
 * o contador some sozinho (não tem mais função depois de completo).
 */
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

/** Chamado uma vez no carregamento da página pra ter o número certo desde o início (mesmo com o contador ainda escondido). */
async function iniciarContadorEasterEggs() {
    let encontrados = [];
    try { encontrados = JSON.parse(await obterConfiguracao('easterEggsEncontrados') || '[]'); } catch (e) { /* nenhum ainda */ }
    if (!Array.isArray(encontrados)) encontrados = [];
    atualizarContadorEasterEggs(encontrados.length);
}

/**
 * CORREÇÃO ("espaço vazio/roxo no fim da tela"): força o navegador a
 * recalcular o layout de verdade (lendo offsetHeight, que obriga um
 * reflow síncrono) depois de qualquer troca de tela que mexe na altura
 * do documento. Sem isso, o valor de altura interno do navegador às
 * vezes fica desatualizado até um reload manual (F5), deixando uma
 * faixa vazia no fim da página, só com a cor de fundo do body (o
 * "roxo" escuro de CORES_FUNDO.escuro, ver definirFundoBody()), sem
 * nenhum conteúdo em cima. Reaproveitada em vários gatilhos diferentes,
 * ver comentários abaixo de cada um.
 */
function forcarRecalculoDeLayout() {
    requestAnimationFrame(() => {
        document.body.style.display = 'none';
        void document.body.offsetHeight; // força o navegador a recalcular o layout de verdade
        document.body.style.display = '';
    });
}

/**
 * Rede de segurança pra "espaço em branco no fim da página depois de sair
 * e voltar, que só some com F5": em navegadores de celular, quando o
 * app fica em segundo plano no meio de alguma transição (um overlay
 * fechando, a barra de endereço mudando de tamanho), o layout às vezes
 * fica com um valor de altura desatualizado até a página recalcular tudo
 * de novo — o que normalmente só acontece mesmo num reload. Forçando um
 * reflow manual quando a aba volta a ficar visível, resolve sem precisar
 * de F5.
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    forcarRecalculoDeLayout();
});

/**
 * CORREÇÃO (espaço vazio "roxo" ao sair da galeria.html de volta pro
 * index.html, ou ao voltar de qualquer outra página pelo gesto/botão
 * "voltar" do navegador): esses casos são navegação entre PÁGINAS
 * diferentes (galeria.html <-> index.html), não uma troca de tela dentro
 * da mesma página, então o listener de visibilitychange acima não é
 * suficiente sempre - o Safari/Chrome do celular costuma restaurar a
 * página anterior direto do cache de navegação (bfcache) sem recarregar
 * nada, o que dispara o evento "pageshow" em vez de visibilitychange. O
 * mesmo reflow forçado resolve aqui.
 */
window.addEventListener('pageshow', () => {
    forcarRecalculoDeLayout();
});

/* ----------------------------------------------------------------------
   Descoberta de itens da galeria (compartilhado entre galeria.html e
   "Nossos momentos" em index.html)
   ----------------------------------------------------------------------
   REFORMULAÇÃO (30/07/2026) — motivo: tanto a página da Galeria quanto o
   quadro "Nossos momentos" descobriam quais fotos/vídeos existem "no
   chute": iam testando galeria_1, galeria_2, galeria_3... um por um (em
   lotes) via requisições HEAD, do ZERO, toda vez que a página abria. Pior
   ainda: depois que o pedido de namoro já aconteceu, TODA abertura do
   site cai direto em "Nossa História" (ver js/main.js), que inclui
   "Nossos momentos" — ou seja, essa varredura rodava a cada vez que ela
   abria o link, não só na primeira vez. Isso é a causa principal tanto da
   Galeria demorando quanto do site "demorando mais que o normal" ao
   abrir.
   Duas mudanças resolvem isso, mantendo intacto o espírito de "só jogar
   os arquivos numerados na pasta, sem editar nada" (ver comentário grande
   em js/config.js):
   1) CACHE LOCAL (`localStorage`, por aparelho): o resultado de uma
      varredura completa fica guardado. Da SEGUNDA abertura em diante (no
      mesmo aparelho/navegador), tanto a Galeria quanto "Nossos momentos"
      usam esse cache e aparecem na hora, sem esperar nenhuma requisição
      de rede — a varredura de verdade roda só em segundo plano, sem
      travar a tela, só pra pegar fotos/vídeos novos que Gabriel tenha
      adicionado depois.
   2) MAIS PARALELISMO na varredura em si (quando ela precisa mesmo
      acontecer, como na primeiríssima abertura de um aparelho): antes
      cada lote de 8 números esperava terminar pra só então começar o
      próximo; agora o lote é maior (24), fazendo bem menos idas-e-voltas
      até o servidor no total.
   ---------------------------------------------------------------------- */
const GALERIA_MAX_NUMERO = 500;       // teto de segurança, nunca deve ser alcançado na prática
const GALERIA_LACUNA_PARA_PARAR = 6;  // depois de 6 números seguidos sem nada, para de procurar

/* ----------------------------------------------------------------------
   MANIFESTO DA GALERIA (correção de velocidade no celular)
   ----------------------------------------------------------------------
   PROBLEMA: sem o manifesto, a ÚNICA forma de descobrir quais fotos/vídeos
   existem é perguntar ao servidor, um por um, via HEAD request
   (galeriaDescobrirItem/galeriaVarrerFaixa abaixo). Cada requisição HEAD é
   rápida no wi-fi/cabo de um computador (poucos ms de ida-e-volta), mas no
   4G/5G do celular cada uma pode levar centenas de ms — e como o navegador
   limita quantas conexões abre ao mesmo tempo para o mesmo servidor
   (normalmente 6), os "lotes de 24 em paralelo" do código abaixo na
   prática viram várias filas de 6, multiplicando ainda mais o tempo total.
   É por isso que a Galeria (e "Nossa História", que espera a mesma busca
   terminar antes de aparecer — ver iniciarGaleriaMomentos() em
   js/romance.js) carregava rápido no computador e devagar no celular.

   SOLUÇÃO: em vez de "perguntar" arquivo por arquivo, o site agora tenta
   primeiro buscar um único arquivo pequeno — assets/img/galeria/manifesto.json
   — que já lista tudo que existe. Isso troca dezenas/centenas de idas-e-
   voltas ao servidor por UMA só, e a Galeria/"Nossa História" ficam prontas
   quase instantaneamente, mesmo em rede ruim. Esse arquivo é gerado
   automaticamente (ver scripts/gerar-manifesto-galeria.js e o workflow do
   GitHub Actions em .github/workflows/gerar-manifesto-galeria.yml) toda
   vez que fotos/vídeos novos são enviados para o repositório — ninguém
   precisa editar nada manualmente.

   Se o manifesto ainda não existir (ex.: projeto ainda não configurado com
   o GitHub Actions, ou alguém apagou o arquivo), o site cai automaticamente
   de volta no método antigo de varredura por HEAD request — nada quebra,
   só volta a ficar mais lento até o manifesto existir.
   ---------------------------------------------------------------------- */
let __galeriaManifestoPromise = null;

/**
 * Busca e valida assets/img/galeria/manifesto.json. Devolve a lista de
 * itens ({numero, caminho, tipo}) já pronta, ou `null` se o arquivo não
 * existir/estiver inválido (nesse caso quem chamou deve usar a varredura
 * por HEAD como antes). O resultado é guardado em memória (não repete a
 * busca várias vezes na mesma visita à página).
 */
function galeriaCarregarManifesto() {
    if (__galeriaManifestoPromise) return __galeriaManifestoPromise;

    __galeriaManifestoPromise = (async () => {
        try {
            // GET normal (com cache do navegador/CDN) — bem mais barato que
            // as centenas de HEAD "no-store" da varredura manual, e ainda
            // se beneficia de cache HTTP entre visitas.
            const resposta = await fetch(`${PASTA_GALERIA}/manifesto.json`);
            if (!resposta.ok) return null;
            const dados = await resposta.json();
            if (!dados || !Array.isArray(dados.itens)) return null;

            const itens = dados.itens
                .filter(item => item && Number.isFinite(item.numero) && (item.tipo === 'foto' || item.tipo === 'video') && item.ext)
                .map(item => ({
                    numero: item.numero,
                    tipo: item.tipo,
                    caminho: `${PASTA_GALERIA}/galeria_${item.numero}.${item.ext}`
                }));

            return itens.length ? itens : null;
        } catch (e) {
            return null; // sem manifesto (404), JSON inválido, ou rede falhou — segue com a varredura antiga
        }
    })();

    return __galeriaManifestoPromise;
}

/* ---------------- Cache local da descoberta (localStorage) ---------------- */
// Guarda { itens: [{numero, caminho, tipo}], completo: boolean, salvoEm }.
// `completo` distingue um cache que já varreu a Galeria INTEIRA (fotos +
// vídeos, gerado por galeriaEscanearCompleta — o único confiável para
// montar a página da Galeria) de um cache PARCIAL (só a faixa de fotos,
// gerado por descobrirFotosParaDestaque — suficiente para "Nossos
// momentos", que só precisa de fotos). Nunca deixamos um cache parcial
// sobrescrever um completo já salvo, pra Galeria nunca perder itens que
// já sabia que existiam.
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

// De quanto em quanto tempo, no máximo, vale a pena refazer a varredura de
// verdade em segundo plano (só pra pegar fotos/vídeos novos que Gabriel
// tenha adicionado) — sem isso, o cache nunca atualizaria sozinho.
const GALERIA_REVALIDACAO_INTERVALO_MS = 3 * 60 * 60 * 1000; // 3 horas

/**
 * Roda `galeriaEscanearCompleta` em segundo plano (sem bloquear nada na
 * tela) só se o cache não existir ainda ou já estiver "velho" o
 * suficiente (ver GALERIA_REVALIDACAO_INTERVALO_MS) — assim uma pessoa
 * que abre o site várias vezes seguidas não dispara uma varredura nova a
 * cada abertura, mas o cache também não fica desatualizado pra sempre.
 * Chamada tanto por "Nossos momentos" (index.html) quanto pela página da
 * Galeria, sempre DEPOIS de já ter mostrado algo na tela (cache ou
 * varredura própria) — nunca é o que decide o que aparece agora.
 */
function galeriaRevalidarEmSegundoPlano() {
    const dados = galeriaLerCacheBruto();
    if (dados && (Date.now() - (dados.salvoEm || 0)) < GALERIA_REVALIDACAO_INTERVALO_MS) return;
    galeriaEscanearCompleta(null, null).catch(() => { /* sem problema, tenta de novo na próxima abertura */ });
}

/** Confere (via HEAD, sem baixar o arquivo inteiro) se um caminho existe no servidor. */
async function galeriaArquivoExiste(caminho) {
    try {
        const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store' });
        return resposta.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Tenta descobrir o item "galeria_N" testando a extensão fixa de foto
 * (.jpg) e/ou de vídeo (.mp4), em paralelo quando os dois tipos são
 * relevantes. Devolve { caminho, tipo } da primeira que existir, ou
 * `null` se nenhuma existir.
 */
async function galeriaDescobrirItem(numero, tipoAlvo) {
    // Só testa a extensão fixa do(s) tipo(s) relevante(s) — quem varre
    // uma faixa (ver galeriaVarrerFaixa) informa `tipoAlvo` ('foto' ou
    // 'video') e só a extensão daquele tipo é testada.
    const candidatos = [
        ...(tipoAlvo !== 'video' ? GALERIA_EXTENSOES_FOTO.map(ext => ({ ext, tipo: 'foto' })) : []),
        ...(tipoAlvo !== 'foto' ? GALERIA_EXTENSOES_VIDEO.map(ext => ({ ext, tipo: 'video' })) : [])
    ];

    const testarUmaExtensao = async (c, controlador) => {
        const caminho = `${PASTA_GALERIA}/galeria_${numero}.${c.ext}`;
        const tentar = async () => {
            const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store', signal: controlador.signal });
            if (resposta.ok) return { encontrado: true, resultado: { caminho, tipo: c.tipo } };
            // CORREÇÃO ("Nossos momentos" às vezes não achava foto nenhuma):
            // só um 404 de verdade significa "o arquivo não existe". Qualquer
            // outro status (429 de limite de requisições, 503/500 de
            // instabilidade do servidor, etc.) é uma falha PASSAGEIRA, não uma
            // confirmação de ausência — tratar isso como "não encontrado" sem
            // repetir a tentativa fazia buscas com rede instável (comum em
            // 4G) confundirem "servidor engasgou" com "essa foto não existe",
            // cortando fotos reais da seleção.
            return { encontrado: false, confirmado: resposta.status === 404 };
        };
        try {
            const r = await tentar();
            if (r.encontrado) return r.resultado;
            if (r.confirmado) return null; // 404 de verdade: sem retry, resposta rápida e definitiva
        } catch (e) {
            if (controlador.signal.aborted) throw e; // cancelado porque outra extensão já achou — não é erro de rede, não faz sentido re-tentar
        }
        // Erro de rede ou status ambíguo (não é um 404 confirmado) — sempre
        // vale uma segunda tentativa antes de desistir de vez, porque aqui
        // NÃO temos certeza se o arquivo existe ou não. Sem essa distinção,
        // um arquivo que EXISTE de verdade podia sumir de "Nossos momentos"
        // (ou da galeria) só por causa de uma falha de rede passageira.
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

/**
 * Varre uma faixa de números da galeria (de `inicio` até `teto`, ou até
 * bater a tolerância de buracos seguidos — `lacunaTolerancia`), chamando
 * `aoEncontrar(numero, resultado)` pra cada item real que achar.
 * Extraída como função própria (em vez de duplicar o laço em cada lugar
 * que precisa dela: descobrirFotosParaDestaque(), galeriaEscanearCompleta()
 * pra dar suporte a DUAS faixas independentes — uma pra fotos, outra pra
 * vídeos (ver GALERIA_INICIO_VIDEOS em js/config.js) — sem duplicar a
 * lógica de descoberta em cada lugar que precisa dela.
 *
 * `lacunaTolerancia` (padrão GALERIA_LACUNA_PARA_PARAR) permite que quem
 * chama desative a parada antecipada por buraco (passando Infinity) —
 * usado na faixa de fotos abaixo, que já é naturalmente pequena e
 * limitada por GALERIA_INICIO_VIDEOS, então não há necessidade da
 * otimização de "desistir cedo" e ela só causava fotos reais que vinham
 * depois de um buraco na numeração (ex.: pulou um número ao subir as
 * fotos) serem cortadas da galeria.
 */
async function galeriaVarrerFaixa(inicio, teto, aoEncontrar, aoProgredir, tipoAlvo, lacunaTolerancia = GALERIA_LACUNA_PARA_PARAR) {
    // Lote aumentado de 8 para 24 (REFORMULAÇÃO 30/07/2026): como essa
    // varredura de verdade só roda mesmo na primeira abertura de cada
    // aparelho (depois disso entra o cache, ver bloco acima), vale testar
    // mais números em paralelo por vez — bem menos idas-e-voltas até o
    // servidor até cobrir a faixa inteira.
    const TAMANHO_LOTE = 24;
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

/**
 * Varre a galeria inteira (fotos e vídeos) e devolve TODOS os itens
 * encontrados ({ numero, caminho, tipo }). Usada só dentro de
 * galeria.html (js/galeria.js), a única tela que precisa mesmo da lista
 * completa — e a única que tem uma barra de carregamento visível pra
 * cobrir o tempo dessa varredura. `aoProgredir`, se passado, é chamado a
 * cada lote conferido, pra alimentar essa barra.
 *
 * `aoEncontrarItem`, se passado, é chamado IMEDIATAMENTE a cada item
 * real encontrado (em vez de só no final) — permite que quem chama já
 * comece a carregar/exibir a foto/vídeo assim que ela é descoberta, ao
 * invés de esperar a varredura inteira (fotos + vídeos) terminar pra só
 * então começar a mostrar qualquer coisa na tela.
 *
 * CORREÇÃO (galeria demorando pra aparecer e "parando" antes da hora):
 * cada item agora é entregue via `aoEncontrarItem` assim que é achado —
 * quem chama (galeria.js) já bota a foto na grade e começa a carregá-la
 * na hora, sem esperar a varredura inteira terminar primeiro. As duas
 * faixas continuam em sequência (fotos, depois vídeos) pra manter a
 * ordem de exibição (fotos em ordem crescente, depois os vídeos), mas
 * como as fotos já vão aparecendo desde o primeiro lote, a demora
 * percebida cai bastante mesmo sem paralelizar as faixas. Além disso, a
 * faixa de fotos agora varre até o fim sem desistir por causa de
 * buracos na numeração (ver `lacunaTolerancia` em galeriaVarrerFaixa) —
 * evita cortar fotos reais que vêm depois de um número faltando/pulado
 * (a faixa de vídeos continua com a tolerância normal, já que ali sim
 * vale a pena desistir cedo pra não varrer até GALERIA_MAX_NUMERO à toa).
 */
async function galeriaEscanearCompleta(aoProgredir, aoEncontrarItem) {
    // CORREÇÃO (celular demorando muito): se existir um manifesto pronto
    // (ver bloco "MANIFESTO DA GALERIA" acima), usa ele direto — uma única
    // requisição em vez de dezenas/centenas de HEAD request. Só cai na
    // varredura manual abaixo se o manifesto não existir ou vier vazio.
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

/**
 * CORREÇÃO (checagem duplicada/pesada na home): "Nossos momentos"
 * (index.html) só precisa de umas poucas fotos pra sortear entre elas —
 * não faz sentido ela repetir a MESMA varredura pesada e completa (até
 * GALERIA_MAX_NUMERO, fotos e vídeos) que a página galeria.html já faz
 * direito, com barra de carregamento própria pra isso. Aqui a varredura
 * olha só a faixa de fotos (nem entra na faixa de vídeo, que "Nossos
 * momentos" nem usa), o que já é bem mais leve.
 *
 * CORREÇÃO (fotos escolhidas ficavam "grudadas", parecendo do mesmo
 * dia): para poder escolher fotos espalhadas pela numeração (ver
 * escolherFotosEspalhadas abaixo) é preciso conhecer TODAS as fotos
 * existentes na faixa, não só um pedaço perto de um ponto sorteado —
 * por isso a varredura agora sempre percorre a faixa inteira (sem parar
 * ao achar uma quantidade-alvo), mantendo o NÚMERO de cada foto, não só
 * o caminho do arquivo.
 */
const GALERIA_DESTAQUE_TETO_MAX = 150; // trava de segurança: mesmo que GALERIA_INICIO_VIDEOS seja configurado bem alto no futuro, essa varredura continua leve

async function descobrirFotosParaDestaque() {
    // CORREÇÃO (a página "Nossa História" ficava presa na tela de
    // "preparando nossa história..." por muito tempo no celular): antes
    // desta função rodar sempre a varredura por HEAD abaixo, mesmo sem
    // cache — e como ela é uma das tarefas que goToRomancePage() espera
    // terminar antes de esconder o overlay de carregamento (ver
    // js/romance.js), essa varredura lenta em rede móvel travava a
    // entrada inteira em "Nossa História", não só a Galeria. Usar o
    // manifesto (quando existir) resolve os dois casos de uma vez.
    const doManifesto = await galeriaCarregarManifesto();
    if (doManifesto) {
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

    // Infinity: não desiste por causa de buracos na numeração — a faixa é
    // pequena (no máximo GALERIA_DESTAQUE_TETO_MAX números) e usa HEAD
    // (bem leve), então varrer até o fim garante achar todas as fotos
    // reais em vez de cortar cedo demais.
    await galeriaVarrerFaixa(1, tetoFotos, aoEncontrar, null, 'foto', Infinity);

    // Cache PARCIAL (só fotos) — só é salvo se ainda não existir um cache
    // completo melhor (ver galeriaSalvarCacheSeMelhor). Guarda `tipo: 'foto'`
    // em cada item pra ficar no mesmo formato usado pelo cache completo.
    galeriaSalvarCacheSeMelhor(fotosEncontradas.map(f => ({ numero: f.numero, caminho: f.caminho, tipo: 'foto' })), false);

    return fotosEncontradas;
}

/**
 * Escolhe `quantidade` fotos dentro de `fotos` ({numero, caminho}[])
 * tentando ao máximo EVITAR números próximos entre si — fotos tiradas no
 * mesmo dia/momento tendem a ter números seguidos (ex.: galeria_12,
 * galeria_13, galeria_14), então escolher de perto demais dava a
 * impressão de que todas as fotos em destaque eram do mesmo dia.
 *
 * Estratégia: ordena pela numeração e divide a faixa em `quantidade`
 * pedaços (aproximadamente) iguais, sorteando UMA foto de dentro de cada
 * pedaço. Assim, com fotos numeradas de 1 a 28 e 4 fotos pedidas, por
 * exemplo, cada escolha sai de um quarto diferente da numeração (tipo
 * foto 1, foto 8, foto 16, foto 24 — nunca duas do mesmo pedaço), o que
 * bate com o espaçamento pedido (ex.: foto 1, foto 5, foto 13, foto 25).
 * Devolve só os caminhos, já na ordem de exibição embaralhada (a divisão
 * em pedaços cuida do espaçamento; a ordem de exibição pode ser livre).
 */
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

    // CORREÇÃO (bug relatado: vídeo do pedido não salvava no iPhone): o
    // WebKit do iOS (Safari e também o Chrome no iPhone, que usa o mesmo
    // motor por exigência da Apple) tem bugs conhecidos onde informar
    // videoBitsPerSecond/audioBitsPerSecond — mesmo dentro de valores
    // razoáveis — faz o MediaRecorder gravar um arquivo vazio ou
    // corrompido, SEM lançar nenhum erro visível no JavaScript. Como essa
    // otimização de tamanho não é confiável nesse ambiente, no iOS usamos
    // só o mimeType (o vídeo pode ficar um pouco maior, mas grava de
    // verdade — o que importa muito mais aqui).
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

/**
 * CORREÇÃO: os botões de exportar (constelação, carta em PDF) usavam só
 * um link com atributo "download" — isso funciona bem no
 * computador e no Android, mas no Safari do iPhone (o navegador que essa
 * pessoa realmente vai usar) o atributo "download" é praticamente
 * ignorado quando o link aponta pra uma data URI: o toque não faz nada
 * visível, mesmo com o arquivo gerado certinho por trás. Por isso a
 * mensagem de sucesso aparecia mas nenhum arquivo chegava a lugar nenhum.
 *
 * Solução: tenta primeiro a folha de compartilhamento nativa
 * (navigator.share com um arquivo de verdade), que no iPhone é o jeito
 * confiável de salvar direto nas Fotos ou nos Arquivos. Se o aparelho
 * não suportar isso, cai pro link de download tradicional (funciona bem
 * fora do iPhone). Se nem isso rolar, abre a imagem numa aba nova como
 * último recurso, pra pelo menos dar pra segurar o dedo e salvar.
 */
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
