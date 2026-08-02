/**
 * GALERIA.JS — Álbum permanente de lembranças. 100% estático: itens são
 * arquivos em assets/img/galeria/ (galeria_1.jpg, galeria_2.mp4, ...) ou
 * links do YouTube (GALERIA_YOUTUBE em js/config.js). Descoberta
 * automática: testa cada número em sequência contra cada extensão aceita
 * e usa a primeira que existir; para depois de alguns números seguidos
 * sem achar nada — não precisa reservar números nem editar configuração.
 */

let __galeriaFotosCarregadas = 0;

// Lista ordenada de tudo que entrou na galeria (fotos, vídeos locais e do
// YouTube), na mesma ordem em que aparecem na grade — usada para navegar
// entre itens (anterior/próxima) dentro do lightbox.
let __galeriaItens = [];

// Marca quando a varredura termina de verdade, para o listener de
// pageshow saber se precisa reiniciar ao restaurar a página do bfcache
// (trocar de app no celular raramente fecha a aba; o navegador só congela
// e restaura a página como estava, sem rodar DOMContentLoaded de novo).
let __galeriaCarregamentoCompleto = false;

// Colunas do masonry (fotos e vídeos), guardadas em nível de módulo para
// sobreviver a redimensionamentos de tela sem refazer a busca no servidor.
let __galeriaColunasFotos = [];
let __galeriaColunasVideos = [];
let __galeriaUltimoNumeroColunas = 0;

// Qual das duas "galerias" está visível agora — controla o texto/ícone do
// botão e o que verificarSeGaleriaFicouVazia() deve checar.
let __galeriaModoAtual = 'fotos'; // 'fotos' | 'videos'

// Evita escanear a seção de vídeos mais de uma vez se a pessoa apertar
// "Ver vídeos" de novo depois que a seção já carregou (ou enquanto ainda
// está carregando) — depois da primeira vez, alternar só troca qual seção
// está visível, sem varrer o servidor de novo.
let __galeriaVideosCarregamentoIniciado = false;

// Guarda se as fotos ainda estão carregando, para mostrarSecaoVideos()
// poder esconder a barra #galeriaCarregando também (se a pessoa trocar
// para vídeos antes das fotos terminarem) e mostrarSecaoFotos() só trazê-la
// de volta se ainda fizer sentido.
let __galeriaFotosAindaCarregando = false;

// As "colunas" são divs de verdade (não column-count do CSS), evitando que
// o navegador rebalanceie os itens conforme cada foto carrega com altura
// diferente da esperada. A quantidade de colunas replica os
// mesmos pontos de corte que existiam antes no CSS: 1 coluna no celular,
// 2/3/4 conforme a tela cresce.
function galeriaNumeroDeColunas() {
    const largura = window.innerWidth;
    if (largura >= 980) return 4;
    if (largura >= 640) return 3;
    if (largura >= 480) return 2;
    return 1;
}

function galeriaMontarColunas(masonry, qtd) {
    masonry.innerHTML = '';
    const colunas = [];
    for (let i = 0; i < qtd; i++) {
        const col = document.createElement('div');
        col.className = 'galeria-coluna';
        masonry.appendChild(col);
        colunas.push(col);
    }
    return colunas;
}

/**
 * Reconstrói as colunas de UM masonry específico (fotos OU vídeos) e
 * redistribui nelas os itens que já estavam montados, sem refazer nenhuma
 * busca no servidor — usada tanto na abertura quanto no redimensionamento
 * de tela (ver listener de "resize" em montarGaleria).
 */
function galeriaRedistribuirColunas(masonry, novoNumero) {
    const itensAtuais = Array.from(masonry.querySelectorAll('.galeria-item'))
        .sort((a, b) => Number(a.dataset.ordem) - Number(b.dataset.ordem));
    const colunas = galeriaMontarColunas(masonry, novoNumero);
    itensAtuais.forEach((item, indice) => colunas[indice % colunas.length].appendChild(item));
    return colunas;
}

async function montarGaleria() {
    __galeriaCarregamentoCompleto = false;
    __galeriaItens = [];
    __galeriaFotosCarregadas = 0;
    __galeriaVideosCarregamentoIniciado = false;
    __galeriaModoAtual = 'fotos';

    const masonry = document.getElementById('galeriaMasonry');
    if (!masonry) return;

    // Garante que a página sempre abre mostrando a galeria de FOTOS (a
    // seção de vídeos, se tinha ficado visível de uma restauração de
    // congelamento do navegador — ver pageshow mais abaixo —, é escondida
    // e zerada de novo).
    const secaoVideos = document.getElementById('galeriaSecaoVideos');
    if (secaoVideos) secaoVideos.classList.add('d-none');
    const masonryVideos = document.getElementById('galeriaMasonryVideos');
    if (masonryVideos) masonryVideos.innerHTML = '';
    __galeriaColunasVideos = [];
    const vazioVideos = document.getElementById('galeriaVideosVazio');
    if (vazioVideos) vazioVideos.classList.add('d-none');
    const btnVideos = document.getElementById('btnGaleriaVerVideos');
    if (btnVideos) {
        btnVideos.disabled = false;
        btnVideos.innerHTML = '<i class="bi bi-camera-reels me-1"></i>Ver vídeos';
    }

    __galeriaColunasFotos = galeriaMontarColunas(masonry, galeriaNumeroDeColunas());

    // Se a tela girar/redimensionar a ponto de mudar a quantidade de
    // colunas, reconstrói as colunas e redistribui os itens já montados
    // (sem refazer nenhuma busca no servidor) — mantém a mesma ordem. Faz
    // isso pras DUAS galerias (fotos e vídeos), já que qualquer uma das
    // duas pode estar com itens montados na hora do redimensionamento.
    __galeriaUltimoNumeroColunas = __galeriaColunasFotos.length;
    // Debounce de 150ms: sem isso, "resize" dispara repetidas vezes durante
    // um redimensionamento contínuo ou rotação de tela.
    let __timeoutResizeGaleria = null;
    window.addEventListener('resize', () => {
        clearTimeout(__timeoutResizeGaleria);
        __timeoutResizeGaleria = setTimeout(() => {
            const novoNumero = galeriaNumeroDeColunas();
            if (novoNumero === __galeriaUltimoNumeroColunas) return;
            __galeriaUltimoNumeroColunas = novoNumero;
            __galeriaColunasFotos = galeriaRedistribuirColunas(masonry, novoNumero);
            const masonryVideosAtual = document.getElementById('galeriaMasonryVideos');
            if (masonryVideosAtual && masonryVideosAtual.querySelector('.galeria-item')) {
                __galeriaColunasVideos = galeriaRedistribuirColunas(masonryVideosAtual, novoNumero);
            }
        }, 150);
    });

    const barraWrap = document.getElementById('galeriaCarregando');
    const barra = document.getElementById('galeriaCarregandoBarra');
    const texto = document.getElementById('galeriaCarregandoTexto');
    const atualizarBarra = (fracao, mensagem) => {
        if (!barra) return;
        barra.style.width = `${Math.max(0, Math.min(100, fracao * 100))}%`;
        if (texto && mensagem) texto.textContent = mensagem;
    };

    // Cada item entra na grade e começa a carregar assim que é descoberto
    // (aoEncontrarItem), sem esperar o resto da varredura terminar.
    let totalEncontrados = 0;
    let totalCarregados = 0;
    let varreduraTerminou = false;
    __galeriaFotosAindaCarregando = true;
    const atualizarProgresso = () => {
        if (totalEncontrados === 0) {
            atualizarBarra(0, varreduraTerminou ? '' : 'Procurando fotos...');
            return;
        }
        const fracao = totalCarregados / totalEncontrados;
        atualizarBarra(fracao, `Carregando fotos: ${totalCarregados}/${totalEncontrados}`);
        if (varreduraTerminou && totalCarregados >= totalEncontrados && barraWrap) {
            __galeriaFotosAindaCarregando = false;
            setTimeout(() => barraWrap.classList.add('d-none'), 400);
        }
    };
    const contarCarregado = () => { totalCarregados++; atualizarProgresso(); };
    const aoEncontrarItem = (item) => {
        totalEncontrados++;
        // Cada foto entra sempre na mesma coluna (round-robin pelo índice),
        // nunca muda depois de colocada.
        const colunaAlvo = __galeriaColunasFotos[__galeriaItens.length % __galeriaColunasFotos.length];
        adicionarItemNaGrade(item.numero, item.caminho, item.tipo, colunaAlvo, contarCarregado);
        atualizarProgresso();
    };

    // A abertura da página monta só as fotos (vídeos são mais pesados);
    // eles só entram na grade quando a pessoa aperta "Ver vídeos" (ver
    // carregarVideosDaGaleria). Um cache parcial (só fotos) já é
    // suficiente aqui, sem exigir o cache completo.
    const itensEmCache = galeriaLerCache(false);
    const fotosEmCache = itensEmCache
        ? itensEmCache.filter(item => item.tipo === 'foto').sort((a, b) => a.numero - b.numero)
        : null;
    if (fotosEmCache && fotosEmCache.length) {
        fotosEmCache.forEach(aoEncontrarItem);
        varreduraTerminou = true;
        // Conhecer os itens do cache não é o mesmo que as fotos já terem
        // carregado de verdade (cada <img> ainda precisa baixar) — chamar
        // atualizarProgresso() deixa a mesma lógica decidir quando esconder
        // a barra, só depois que totalCarregados alcançar totalEncontrados.
        atualizarProgresso();
    } else {
        await galeriaEscanearFotos(null, aoEncontrarItem);
        varreduraTerminou = true;
        if (totalEncontrados === 0 && barraWrap) {
            __galeriaFotosAindaCarregando = false;
            barraWrap.classList.add('d-none');
        }
        atualizarProgresso();
    }

    __galeriaCarregamentoCompleto = true;

    setTimeout(verificarSeGaleriaFicouVazia, 1200);

    // Atualiza o cache de FOTOS em segundo plano (throttlado, ver
    // GALERIA_REVALIDACAO_INTERVALO_MS em js/utils.js) — se Gabriel tiver
    // adicionado fotos novas, elas aparecem na PRÓXIMA abertura da
    // Galeria, sem travar esta. Vídeos nunca revalidam sozinhos aqui, só
    // quando a pessoa aperta "Ver vídeos" de propósito.
    galeriaRevalidarEmSegundoPlano();
}

/**
 * Alterna entre as duas "galerias" (fotos e vídeos) — chamada pelo clique
 * no botão único #btnGaleriaVerVideos (ver galeria.html). Na primeira vez
 * que a pessoa pede pra ver vídeos, dispara a varredura de verdade
 * (carregarVideosDaGaleria); nas vezes seguintes só troca qual seção está
 * visível, sem varrer o servidor de novo.
 */
async function alternarSecaoVideos() {
    if (__galeriaModoAtual === 'videos') {
        mostrarSecaoFotos();
        return;
    }
    if (__galeriaVideosCarregamentoIniciado) {
        mostrarSecaoVideos();
        return;
    }
    await carregarVideosDaGaleria();
}

/** Mostra a galeria de FOTOS e esconde a de vídeos (sem mexer no que já foi carregado em nenhuma das duas). */
function mostrarSecaoFotos() {
    __galeriaModoAtual = 'fotos';
    const masonryFotos = document.getElementById('galeriaMasonry');
    const secaoVideos = document.getElementById('galeriaSecaoVideos');
    if (masonryFotos) masonryFotos.classList.remove('d-none');
    if (secaoVideos) secaoVideos.classList.add('d-none');
    const btn = document.getElementById('btnGaleriaVerVideos');
    if (btn) btn.innerHTML = '<i class="bi bi-camera-reels me-1"></i>Ver vídeos';
    // Só reexibe a barra de carregamento se as fotos ainda estiverem
    // carregando de verdade (__galeriaFotosAindaCarregando).
    const barraFotos = document.getElementById('galeriaCarregando');
    if (barraFotos) barraFotos.classList.toggle('d-none', !__galeriaFotosAindaCarregando);
    verificarSeGaleriaFicouVazia();
}

/** Mostra a galeria de VÍDEOS e esconde a de fotos. */
function mostrarSecaoVideos() {
    __galeriaModoAtual = 'videos';
    const masonryFotos = document.getElementById('galeriaMasonry');
    const vazioFotos = document.getElementById('galeriaVazio');
    const secaoVideos = document.getElementById('galeriaSecaoVideos');
    if (masonryFotos) masonryFotos.classList.add('d-none');
    if (vazioFotos) vazioFotos.classList.add('d-none'); // recado de "álbum de fotos vazio" não faz sentido aqui
    if (secaoVideos) secaoVideos.classList.remove('d-none');
    const btn = document.getElementById('btnGaleriaVerVideos');
    if (btn) btn.innerHTML = '<i class="bi bi-images me-1"></i>Ver fotos';
    // A barra de carregamento das fotos vive fora de #galeriaSecaoVideos no
    // HTML, então precisa ser escondida explicitamente aqui; mostrarSecaoFotos() decide se volta.
    const barraFotos = document.getElementById('galeriaCarregando');
    if (barraFotos) barraFotos.classList.add('d-none');
}

/**
 * Varre/monta a seção de vídeos (locais, a partir de GALERIA_INICIO_VIDEOS,
 * e do YouTube — GALERIA_YOUTUBE em js/config.js) na grade PRÓPRIA de
 * #galeriaSecaoVideos — uma "galeria" separada da grade de fotos, não mais
 * itens acrescentados no fim dela. Chamada só pela primeira vez que a
 * pessoa aperta "Ver vídeos" (ver alternarSecaoVideos acima); da segunda
 * vez em diante só alterna a visibilidade das seções já montadas.
 */
async function carregarVideosDaGaleria() {
    __galeriaVideosCarregamentoIniciado = true;

    const btn = document.getElementById('btnGaleriaVerVideos');
    const masonryVideos = document.getElementById('galeriaMasonryVideos');
    const barraWrap = document.getElementById('galeriaCarregandoVideos');
    const barra = document.getElementById('galeriaCarregandoVideosBarra');
    const texto = document.getElementById('galeriaCarregandoVideosTexto');
    const vazio = document.getElementById('galeriaVideosVazio');
    if (!masonryVideos) return;

    // Já troca pra "outra galeria" (só vídeos) no clique — a seção aparece
    // vazia, com a própria barra de carregamento, em vez de ficar
    // acrescentando itens embaixo da grade de fotos que já estava na tela.
    mostrarSecaoVideos();
    if (vazio) vazio.classList.add('d-none');
    if (barraWrap) barraWrap.classList.remove('d-none');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando vídeos...';
    }

    __galeriaColunasVideos = galeriaMontarColunas(masonryVideos, galeriaNumeroDeColunas());

    const atualizarBarra = (fracao, mensagem) => {
        if (barra) barra.style.width = `${Math.max(0, Math.min(100, fracao * 100))}%`;
        if (texto && mensagem) texto.textContent = mensagem;
    };

    let totalEncontrados = 0;
    let totalCarregados = 0;
    let varreduraTerminouVideos = false;
    const atualizarProgresso = () => {
        if (totalEncontrados === 0) { atualizarBarra(0, 'Procurando vídeos...'); return; }
        atualizarBarra(totalCarregados / totalEncontrados, `Carregando vídeos: ${totalCarregados}/${totalEncontrados}`);
        if (varreduraTerminouVideos && totalCarregados >= totalEncontrados && barraWrap) {
            setTimeout(() => barraWrap.classList.add('d-none'), 400);
        }
    };
    const contarCarregado = () => { totalCarregados++; atualizarProgresso(); };
    const aoEncontrarItem = (item) => {
        totalEncontrados++;
        const colunaAlvo = __galeriaColunasVideos[__galeriaItens.length % __galeriaColunasVideos.length];
        adicionarItemNaGrade(item.numero, item.caminho, item.tipo, colunaAlvo, contarCarregado);
        atualizarProgresso();
    };

    try {
        // Mesmo raciocínio do cache de fotos em montarGaleria(): só serve
        // aqui um cache que já prova ter cobrido vídeos também (exigirCompleto
        // = true), senão varre de verdade (ou usa o manifesto, dentro de
        // galeriaEscanearVideos).
        const itensEmCache = galeriaLerCache(true);
        const videosEmCache = itensEmCache
            ? itensEmCache.filter(item => item.tipo === 'video').sort((a, b) => a.numero - b.numero)
            : null;
        if (videosEmCache) {
            videosEmCache.forEach(aoEncontrarItem);
        } else {
            await galeriaEscanearVideos(null, aoEncontrarItem);
        }
    } catch (e) {
        // Sem problema: os vídeos locais simplesmente não aparecem dessa
        // vez, e os do YouTube (logo abaixo) continuam funcionando normal,
        // já que não dependem de nenhuma varredura no servidor.
    }

    montarItensYoutube(__galeriaColunasVideos);

    varreduraTerminouVideos = true;
    if (totalEncontrados === 0 && barraWrap) {
        barraWrap.classList.add('d-none');
    }
    atualizarProgresso();

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-images me-1"></i>Ver fotos';
    }

    const totalItensDeVideo = __galeriaItens.filter(item => item.tipo === 'video' || item.tipo === 'youtube').length;
    if (totalItensDeVideo === 0) {
        // Ainda não tem nenhum vídeo na pasta/config: mostra o recado na
        // própria seção de vídeos (a pessoa pode voltar pra fotos pelo
        // botão, que continua "Ver fotos") e permite tentar de novo numa
        // próxima abertura da Galeria (ex.: depois que Gabriel subir o
        // primeiro vídeo) — ver reset em montarGaleria().
        if (vazio) vazio.classList.remove('d-none');
        __galeriaVideosCarregamentoIniciado = false;
    }
}

function adicionarItemNaGrade(numero, src, tipo, masonry, aoCarregar) {
    const legenda = (typeof GALERIA_LEGENDAS === 'object' && GALERIA_LEGENDAS[numero]) ? GALERIA_LEGENDAS[numero] : '';

    const item = document.createElement('figure');
    item.className = (tipo === 'video') ? 'galeria-item galeria-item-video m-0' : 'galeria-item m-0';
    const indice = __galeriaItens.length; // capturado já aqui para o onerror de recuperação HEIC (mais abaixo) conseguir atualizar a entrada certa

    if (tipo === 'video') {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none'; // não baixa nada ainda — só quando o item entrar perto da tela (ver lazyCarregarVideo)

        // Proteção: alguns vídeos gravados direto do celular (metadata no
        // fim do arquivo, codecs variados) não disparam onloadedmetadata de
        // forma confiável em todo navegador — sem essa proteção, o item
        // ficava preso invisível (opacity: 0) pra sempre, dando a
        // impressão de que "o vídeo não carregou". revelarUmaVez() garante
        // que o item aparece de qualquer forma depois de um tempo, mesmo
        // sem o evento, e cancela o timeout se o evento realmente disparar.
        let jaRevelado = false;
        let timeoutRevelacao = null;
        const revelarUmaVez = () => {
            if (jaRevelado) return;
            jaRevelado = true;
            clearTimeout(timeoutRevelacao);
            __galeriaFotosCarregadas++;
            observarRevelacao(item);
            if (aoCarregar) aoCarregar();
        };

        video.onloadedmetadata = revelarUmaVez;
        video.onloadeddata = revelarUmaVez; // fallback extra — dispara em mais casos que onloadedmetadata
        video.onerror = () => { clearTimeout(timeoutRevelacao); item.remove(); verificarSeVideosFicaramVazios(); if (aoCarregar) aoCarregar(); };

        // Só define src/preload quando o item entra perto da área visível
        // (IntersectionObserver, mesmo mecanismo usado para revelar o item).
        lazyCarregarVideo(item, () => {
            video.preload = 'metadata';
            video.src = `${src}#t=0.5`; // pede o frame de 0.5s como "capa" (evita quadro preto do início em alguns vídeos)
            timeoutRevelacao = setTimeout(revelarUmaVez, 2500);
        });

        const iconePlay = document.createElement('div');
        iconePlay.className = 'galeria-video-play';
        iconePlay.innerHTML = '<i class="bi bi-play-fill"></i>';

        item.appendChild(video);
        item.appendChild(iconePlay);
    } else {
        const img = document.createElement('img');
        img.alt = legenda || `Lembrança ${numero}`;
        // loading="lazy" adia o download até o item chegar perto da tela;
        // decoding="async" evita travar a thread principal ao decodificar.
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = src;
        img.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); if (aoCarregar) aoCarregar(); };
        img.onerror = async () => {
            // Antes de desistir da foto (removendo o item da grade), tenta
            // recuperar o caso mais comum de "existe no servidor mas não
            // carrega": uma foto do iPhone que ficou em HEIC por dentro,
            // só com a extensão trocada pra .jpg por fora (ver
            // tentarRecuperarComoHeic() em js/utils.js).
            if (img.dataset.tentouRecuperarHeic) { item.remove(); verificarSeGaleriaFicouVazia(); if (aoCarregar) aoCarregar(); return; }
            img.dataset.tentouRecuperarHeic = '1';
            const urlRecuperada = await tentarRecuperarComoHeic(src);
            if (urlRecuperada) {
                img.src = urlRecuperada;
                if (__galeriaItens[indice]) __galeriaItens[indice].src = urlRecuperada; // pro lightbox usar a versão já convertida
                return;
            }
            item.remove();
            verificarSeGaleriaFicouVazia();
            if (aoCarregar) aoCarregar();
        };

        item.appendChild(img);
    }

    if (legenda) {
        const cap = document.createElement('figcaption');
        cap.className = 'galeria-legenda';
        cap.textContent = legenda;
        item.appendChild(cap);
    }

    __galeriaItens.push({ src, legenda, tipo });
    item.dataset.ordem = indice; // usado só se a tela redimensionar e as colunas precisarem ser remontadas (ver resize em montarGaleria)
    item.addEventListener('click', () => abrirLightbox(indice));
    masonry.appendChild(item);
}

function montarItensYoutube(colunas) {
    if (!Array.isArray(GALERIA_YOUTUBE)) return;

    GALERIA_YOUTUBE.forEach((entrada) => {
        const idYoutube = extrairIdYoutube((entrada && entrada.link) || '');
        if (!idYoutube) return;
        const legenda = (entrada && entrada.legenda) || '';

        const item = document.createElement('figure');
        item.className = 'galeria-item galeria-item-video m-0';

        const capa = document.createElement('img');
        capa.loading = 'lazy';
        capa.alt = legenda || 'Vídeo do YouTube';
        // hqdefault sempre existe pra qualquer vídeo público/não-listado do YouTube, sem precisar de chave de API.
        capa.src = `https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg`;
        capa.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };
        capa.onerror = () => { item.remove(); verificarSeVideosFicaramVazios(); };

        const iconePlay = document.createElement('div');
        iconePlay.className = 'galeria-video-play galeria-video-play-youtube';
        iconePlay.innerHTML = '<i class="bi bi-youtube"></i>';

        item.appendChild(capa);
        item.appendChild(iconePlay);

        if (legenda) {
            const cap = document.createElement('figcaption');
            cap.className = 'galeria-legenda';
            cap.textContent = legenda;
            item.appendChild(cap);
        }

        const indice = __galeriaItens.length;
        __galeriaItens.push({ src: idYoutube, legenda, tipo: 'youtube' });
        item.dataset.ordem = indice;
        item.addEventListener('click', () => abrirLightbox(indice));
        colunas[indice % colunas.length].appendChild(item);
    });
}

function verificarSeGaleriaFicouVazia() {
    if (__galeriaModoAtual !== 'fotos') return; // a seção de vídeos cuida do próprio recado de vazio (ver verificarSeVideosFicaramVazios, abaixo)
    const masonry = document.getElementById('galeriaMasonry');
    const vazio = document.getElementById('galeriaVazio');
    if (masonry && masonry.querySelectorAll('.galeria-item').length === 0) vazio.classList.remove('d-none');
}

/**
 * Mesma ideia de verificarSeGaleriaFicouVazia(), mas pra seção de vídeos —
 * separada porque um item de vídeo pode falhar ao carregar (onerror, ver
 * adicionarItemNaGrade/montarItensYoutube) bem depois da varredura inicial
 * já ter terminado e contado esse item como "encontrado". Não precisa
 * checar __galeriaModoAtual como a de fotos faz: #galeriaVideosVazio já
 * vive DENTRO de #galeriaSecaoVideos, que fica com d-none quando a seção
 * não está em exibição — então "revelar" essa mensagem enquanto a seção
 * está escondida não vaza nada pra tela.
 */
function verificarSeVideosFicaramVazios() {
    const masonry = document.getElementById('galeriaMasonryVideos');
    const vazio = document.getElementById('galeriaVideosVazio');
    if (masonry && vazio && masonry.querySelectorAll('.galeria-item').length === 0) vazio.classList.remove('d-none');
}

// Observer separado do de revelação (observarRevelacao): este dispara mais
// cedo (rootMargin maior) porque o vídeo ainda precisa baixar os metadados
// depois de "entrar" — se usasse a mesma margem apertada da revelação, a
// pessoa veria o item em branco por um instante extra ao rolar rápido.
let __galeriaObserverVideo = null;
function lazyCarregarVideo(item, aoEntrar) {
    if (!('IntersectionObserver' in window)) { aoEntrar(); return; }
    if (!__galeriaObserverVideo) {
        __galeriaObserverVideo = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    __galeriaObserverVideo.unobserve(entrada.target);
                    entrada.target.__aoEntrar();
                }
            });
        }, { rootMargin: '600px 0px' });
    }
    item.__aoEntrar = aoEntrar;
    __galeriaObserverVideo.observe(item);
}

let __galeriaObserver = null;
function observarRevelacao(item) {
    if (!('IntersectionObserver' in window)) { item.classList.add('visivel'); return; }
    if (!__galeriaObserver) {
        __galeriaObserver = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visivel');
                    __galeriaObserver.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15 });
    }
    __galeriaObserver.observe(item);
}

let __galeriaIndiceAtual = 0;

function abrirLightbox(indice) {
    const item = __galeriaItens[indice];
    if (!item) return;
    __galeriaIndiceAtual = indice;

    const { src, legenda, tipo } = item;

    const overlay = document.getElementById('galeriaLightbox');
    const img = document.getElementById('galeriaLightboxImg');
    const video = document.getElementById('galeriaLightboxVideo');
    const youtubeWrap = document.getElementById('galeriaLightboxYoutubeWrap');
    const youtube = document.getElementById('galeriaLightboxYoutube');
    const cap = document.getElementById('galeriaLightboxLegenda');
    const download = document.getElementById('galeriaLightboxDownload');

    img.classList.add('d-none');
    video.classList.add('d-none');
    youtubeWrap.classList.add('d-none');
    video.pause();
    video.removeAttribute('src');
    video.load();
    youtube.src = '';
    img.src = '';

    if (tipo === 'youtube') {
        youtubeWrap.classList.remove('d-none');
        youtube.src = `https://www.youtube.com/embed/${src}?autoplay=1&rel=0&modestbranding=1`;
        download.classList.add('d-none'); // vídeo do YouTube não dá pra baixar por um link direto
    } else if (tipo === 'video') {
        video.classList.remove('d-none');
        video.src = src;
        video.currentTime = 0;
        video.play().catch(() => { /* autoplay bloqueado é normal — a pessoa só toca em play */ });
        download.classList.remove('d-none');
        download.href = src;
        download.download = src.split('/').pop();
    } else {
        img.classList.remove('d-none');
        img.src = src;
        download.classList.remove('d-none');
        download.href = src;
        download.download = src.split('/').pop();
    }

    cap.textContent = legenda || '';
    atualizarBotoesNavegacaoLightbox();
    bloquearScrollFundo();
    overlay.classList.add('aberto');
}

function atualizarBotoesNavegacaoLightbox() {
    const prev = document.getElementById('galeriaLightboxPrev');
    const next = document.getElementById('galeriaLightboxNext');
    const mostrarNav = __galeriaItens.length > 1;
    if (prev) prev.classList.toggle('d-none', !mostrarNav);
    if (next) next.classList.toggle('d-none', !mostrarNav);
}

function lightboxItemAnterior() {
    if (__galeriaItens.length < 2) return;
    const novoIndice = (__galeriaIndiceAtual - 1 + __galeriaItens.length) % __galeriaItens.length;
    abrirLightbox(novoIndice);
}

function lightboxProximoItem() {
    if (__galeriaItens.length < 2) return;
    const novoIndice = (__galeriaIndiceAtual + 1) % __galeriaItens.length;
    abrirLightbox(novoIndice);
}

// Impede que o conteúdo por trás role enquanto o lightbox está aberto —
// trava tanto o scroll normal quanto o "bounce" do Safari/iOS, guardando a
// posição atual para restaurar exatamente onde a pessoa estava ao fechar.
let __galeriaScrollSalvo = 0;
function bloquearScrollFundo() {
    __galeriaScrollSalvo = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('galeria-scroll-lock');
    document.body.style.top = `-${__galeriaScrollSalvo}px`;
}

function desbloquearScrollFundo() {
    document.documentElement.classList.remove('galeria-scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, __galeriaScrollSalvo);
}

function fecharLightbox() {
    document.getElementById('galeriaLightbox').classList.remove('aberto');
    const video = document.getElementById('galeriaLightboxVideo');
    if (video) { video.pause(); }
    const youtube = document.getElementById('galeriaLightboxYoutube');
    if (youtube) { youtube.src = ''; } // para a reprodução do YouTube ao fechar
    desbloquearScrollFundo();
}

// Se a página for restaurada de um congelamento do navegador (bfcache) com
// a varredura ainda incompleta, refaz o carregamento do zero — geralmente
// rápido, pois HEAD requests e imagens já baixadas vêm do cache.
window.addEventListener('pageshow', (evento) => {
    if (!evento.persisted) return; // página realmente recarregada do zero: DOMContentLoaded já vai cuidar disso
    if (__galeriaCarregamentoCompleto) return; // já tinha terminado antes de sair: nada a fazer
    montarGaleria();
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // BLOQUEIO_DESKTOP_ATIVO: tela de bloqueio já exibida, para tudo o mais
    }

    montarGaleria();

    const btnVerVideos = document.getElementById('btnGaleriaVerVideos');
    if (btnVerVideos) btnVerVideos.addEventListener('click', alternarSecaoVideos);

    document.getElementById('galeriaLightboxClose').addEventListener('click', fecharLightbox);
    document.getElementById('galeriaLightbox').addEventListener('click', (evt) => {
        if (evt.target.id === 'galeriaLightbox') fecharLightbox();
    });
    document.getElementById('galeriaLightboxPrev').addEventListener('click', (evt) => { evt.stopPropagation(); lightboxItemAnterior(); });
    document.getElementById('galeriaLightboxNext').addEventListener('click', (evt) => { evt.stopPropagation(); lightboxProximoItem(); });

    document.addEventListener('keydown', (evt) => {
        const overlay = document.getElementById('galeriaLightbox');
        if (!overlay.classList.contains('aberto')) return;
        if (evt.key === 'Escape') fecharLightbox();
        if (evt.key === 'ArrowLeft') lightboxItemAnterior();
        if (evt.key === 'ArrowRight') lightboxProximoItem();
    });

    // Navegação por swipe (arrastar o dedo) — o gesto mais natural no celular.
    let __swipeXInicial = null;
    const overlay = document.getElementById('galeriaLightbox');
    overlay.addEventListener('touchstart', (evt) => {
        __swipeXInicial = evt.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', (evt) => {
        if (__swipeXInicial === null) return;
        const deltaX = evt.changedTouches[0].clientX - __swipeXInicial;
        __swipeXInicial = null;
        const LIMIAR_SWIPE = 50; // px mínimos para contar como swipe (evita confundir com toque/scroll)
        if (Math.abs(deltaX) < LIMIAR_SWIPE) return;
        if (deltaX > 0) lightboxItemAnterior(); else lightboxProximoItem();
    }, { passive: true });
});
