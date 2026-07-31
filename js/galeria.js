/**
 * ============================================================================
 * GALERIA.JS — Álbum permanente de lembranças
 * ============================================================================
 * 100% estático: os itens são arquivos colocados manualmente em
 * assets/img/galeria/ (galeria_1.jpg, galeria_2.mp4, ...) ou links do
 * YouTube (GALERIA_YOUTUBE em js/config.js). Não usa banco de dados nem
 * sincronização — só HTML/CSS/JS lendo arquivos do próprio repositório.
 *
 * DESCOBERTA AUTOMÁTICA: em vez de exigir configurar quantos itens
 * existem e qual o tipo de cada um, o site tenta cada número em
 * sequência (galeria_1, galeria_2, ...) contra cada extensão aceita
 * (fotos e vídeos, ver GALERIA_EXTENSOES_FOTO/VIDEO em js/config.js) e
 * usa a primeira que encontrar — o tipo (foto ou vídeo) é decidido pela
 * própria extensão do arquivo que existir. Para de procurar depois de
 * alguns números seguidos sem encontrar nada, então não precisa
 * "reservar" números nem editar nenhuma configuração ao adicionar itens.
 * ============================================================================
 */

let __galeriaFotosCarregadas = 0;

// Lista ordenada de tudo que entrou na galeria (fotos, vídeos locais e do
// YouTube), na mesma ordem em que aparecem na grade — usada para navegar
// entre itens (anterior/próxima) dentro do lightbox.
let __galeriaItens = [];

// CORREÇÃO (galeria "trava" pela metade se a pessoa sai do site no meio
// do carregamento): no celular, sair do site (trocar de app, apagar a
// tela) quase nunca fecha a aba de verdade — o navegador congela a
// página como está e, ao voltar, restaura ela exatamente daquele jeito
// (bfcache), sem rodar DOMContentLoaded de novo. Como montarGaleria() só
// era chamada nesse evento, uma varredura interrompida nunca era
// retomada: a pessoa via só as fotos que já tinham entrado na grade até
// o momento de sair. Esta flag marca quando a varredura termina de
// verdade, para o listener de pageshow (abaixo) saber se precisa
// reiniciar o carregamento ao restaurar a página de um congelamento.
let __galeriaCarregamentoCompleto = false;

// Colunas do masonry, guardadas em nível de módulo (não só dentro de
// montarGaleria) porque a seção de vídeos (carregarVideosDaGaleria,
// disparada pelo botão "Ver vídeos" — ver mais abaixo) precisa continuar
// adicionando itens nas MESMAS colunas depois que a montagem inicial (só
// fotos) já terminou.
let __galeriaColunas = [];
let __galeriaUltimoNumeroColunas = 0;

// Evita escanear/montar a seção de vídeos mais de uma vez se a pessoa
// apertar "Ver vídeos" de novo depois que a seção já carregou (ou
// enquanto ainda está carregando).
let __galeriaVideosCarregamentoIniciado = false;

// As "colunas" são divs de verdade (ver CSS .galeria-coluna), não a
// propriedade column-count do CSS — isso evita que o navegador fique
// rebalanceando/pulando os itens de coluna conforme cada foto termina de
// carregar com uma altura diferente da esperada (era a causa do efeito
// "carregando de baixo pra cima"). A quantidade de colunas replica os
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

async function montarGaleria() {
    __galeriaCarregamentoCompleto = false;
    __galeriaItens = [];
    __galeriaFotosCarregadas = 0;
    __galeriaVideosCarregamentoIniciado = false;

    const masonry = document.getElementById('galeriaMasonry');
    if (!masonry) return;

    __galeriaColunas = galeriaMontarColunas(masonry, galeriaNumeroDeColunas());

    // Se a tela girar/redimensionar a ponto de mudar a quantidade de
    // colunas, reconstrói as colunas e redistribui os itens já montados
    // (sem refazer nenhuma busca no servidor) — mantém a mesma ordem.
    __galeriaUltimoNumeroColunas = __galeriaColunas.length;
    // CORREÇÃO (performance mobile — item 1 da revisão): sem debounce, o
    // navegador dispara "resize" repetidas vezes durante um redimensionamento
    // contínuo ou rotação de tela, recalculando/reordenando o DOM a cada
    // disparo. Agrupa numa única execução 150ms depois do último evento.
    let __timeoutResizeGaleria = null;
    window.addEventListener('resize', () => {
        clearTimeout(__timeoutResizeGaleria);
        __timeoutResizeGaleria = setTimeout(() => {
            const novoNumero = galeriaNumeroDeColunas();
            if (novoNumero === __galeriaUltimoNumeroColunas) return;
            __galeriaUltimoNumeroColunas = novoNumero;
            const itensAtuais = Array.from(masonry.querySelectorAll('.galeria-item'))
                .sort((a, b) => Number(a.dataset.ordem) - Number(b.dataset.ordem));
            __galeriaColunas = galeriaMontarColunas(masonry, novoNumero);
            itensAtuais.forEach((item, indice) => __galeriaColunas[indice % __galeriaColunas.length].appendChild(item));
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

    // CORREÇÃO (galeria demorando muito pra aparecer): antes, a varredura
    // (achar quais números existem) e o carregamento (o navegador baixar
    // cada imagem/vídeo) eram duas fases sequenciais — nada aparecia na
    // tela até a varredura INTEIRA (fotos + vídeos) terminar. Agora cada
    // item já entra na grade e começa a carregar assim que é descoberto
    // (aoEncontrarItem abaixo), sem esperar o resto da varredura terminar
    // — então a primeira foto já aparece logo no primeiro lote conferido,
    // em vez de só depois de toda a galeria ser varrida.
    let totalEncontrados = 0;
    let totalCarregados = 0;
    let varreduraTerminou = false;
    const atualizarProgresso = () => {
        if (totalEncontrados === 0) {
            atualizarBarra(0, varreduraTerminou ? '' : 'Procurando fotos...');
            return;
        }
        const fracao = totalCarregados / totalEncontrados;
        atualizarBarra(fracao, `Carregando fotos: ${totalCarregados}/${totalEncontrados}`);
        if (varreduraTerminou && totalCarregados >= totalEncontrados && barraWrap) {
            setTimeout(() => barraWrap.classList.add('d-none'), 400);
        }
    };
    const contarCarregado = () => { totalCarregados++; atualizarProgresso(); };
    const aoEncontrarItem = (item) => {
        totalEncontrados++;
        // Cada foto entra sempre na MESMA coluna a partir do seu índice
        // (round-robin) — nunca muda de coluna depois de colocada,
        // diferente do balanceamento automático do CSS column-count, que
        // reordenava tudo conforme as alturas reais iam ficando
        // conhecidas.
        const colunaAlvo = __galeriaColunas[__galeriaItens.length % __galeriaColunas.length];
        adicionarItemNaGrade(item.numero, item.caminho, item.tipo, colunaAlvo, contarCarregado);
        atualizarProgresso();
    };

    // REFORMULAÇÃO (botão "Ver vídeos", 30/07/2026 — ver comentário grande
    // em js/utils.js): a abertura da página monta só as FOTOS agora —
    // vídeo é sempre um arquivo mais pesado que foto, então deixar de
    // montar (e começar a baixar) os vídeos de cara torna a Galeria mais
    // leve pra abrir, mesmo quando já existe cache. Os vídeos (locais e do
    // YouTube) só entram na grade quando a pessoa aperta "Ver vídeos" (ver
    // carregarVideosDaGaleria, mais abaixo).
    //
    // Um cache parcial (só fotos, de uma visita anterior a esta página ou
    // a "Nossos momentos") já é suficiente aqui — ver galeriaLerCache em
    // js/utils.js — então nem precisa exigir o cache completo (que também
    // cobriria vídeos) só para mostrar as fotos.
    const itensEmCache = galeriaLerCache(false);
    const fotosEmCache = itensEmCache
        ? itensEmCache.filter(item => item.tipo === 'foto').sort((a, b) => a.numero - b.numero)
        : null;
    if (fotosEmCache && fotosEmCache.length) {
        fotosEmCache.forEach(aoEncontrarItem);
        varreduraTerminou = true;
        // CORREÇÃO (barra de carregamento sumindo): antes a barra era
        // escondida AQUI, na hora, assim que os itens do cache eram
        // conhecidos — mas conhecer os itens não é o mesmo que as fotos
        // já terem carregado de verdade no navegador (cada <img> ainda
        // precisa baixar, ver adicionarItemNaGrade). Como a partir da
        // segunda visita ao mesmo aparelho é o cache que sempre roda
        // (ver galeriaLerCache acima), a barra passou a sumir na hora em
        // TODA abertura normal da Galeria, sem nunca mostrar o
        // progresso de verdade. Chamar atualizarProgresso() aqui, como já
        // acontece no ramo sem cache logo abaixo, deixa a MESMA lógica
        // (dentro de atualizarProgresso) decidir quando esconder — só
        // depois que totalCarregados alcançar totalEncontrados.
        atualizarProgresso();
    } else {
        await galeriaEscanearFotos(null, aoEncontrarItem);
        varreduraTerminou = true;
        if (totalEncontrados === 0 && barraWrap) barraWrap.classList.add('d-none');
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
 * Varre/monta a seção de vídeos (locais, a partir de GALERIA_INICIO_VIDEOS,
 * e do YouTube — GALERIA_YOUTUBE em js/config.js) na grade da Galeria.
 * Chamada só pelo clique no botão "Ver vídeos" (#btnGaleriaVerVideos, ver
 * galeria.html), nunca sozinha na abertura da página.
 */
async function carregarVideosDaGaleria() {
    if (__galeriaVideosCarregamentoIniciado) return;
    __galeriaVideosCarregamentoIniciado = true;

    const wrap = document.getElementById('galeriaVideosToggleWrap');
    const btn = document.getElementById('btnGaleriaVerVideos');
    const barraWrap = document.getElementById('galeriaCarregandoVideos');
    const barraLinha = document.getElementById('galeriaCarregandoVideosBarraWrap');
    const barra = document.getElementById('galeriaCarregandoVideosBarra');
    const texto = document.getElementById('galeriaCarregandoVideosTexto');
    const atualizarBarra = (fracao, mensagem) => {
        if (barra) barra.style.width = `${Math.max(0, Math.min(100, fracao * 100))}%`;
        if (texto && mensagem) texto.textContent = mensagem;
    };

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando vídeos...';
    }
    if (barraLinha) barraLinha.classList.remove('d-none');
    if (barraWrap) barraWrap.classList.remove('d-none');
    atualizarBarra(0, 'Procurando vídeos...');

    let totalEncontrados = 0;
    let totalCarregados = 0;
    const atualizarProgresso = () => {
        if (totalEncontrados === 0) { atualizarBarra(0, 'Procurando vídeos...'); return; }
        atualizarBarra(totalCarregados / totalEncontrados, `Carregando vídeos: ${totalCarregados}/${totalEncontrados}`);
    };
    const contarCarregado = () => { totalCarregados++; atualizarProgresso(); };
    const aoEncontrarItem = (item) => {
        totalEncontrados++;
        const colunaAlvo = __galeriaColunas[__galeriaItens.length % __galeriaColunas.length];
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

    montarItensYoutube(__galeriaColunas);

    if (barraWrap) barraWrap.classList.add('d-none');

    const totalItensDeVideo = __galeriaItens.filter(item => item.tipo === 'video' || item.tipo === 'youtube').length;
    if (totalItensDeVideo === 0) {
        // Ainda não tem nenhum vídeo na pasta/config: mostra um recado no
        // lugar do botão e permite tentar de novo mais tarde (ex.: depois
        // que Gabriel subir o primeiro vídeo).
        if (barraLinha) barraLinha.classList.add('d-none');
        if (barraWrap) barraWrap.classList.remove('d-none');
        if (texto) texto.textContent = 'Nenhum vídeo por aqui ainda.';
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-camera-reels me-1"></i>Ver vídeos';
        }
        __galeriaVideosCarregamentoIniciado = false;
    } else if (wrap) {
        // Vídeos já estão na grade: some com o botão, não precisa mais dele.
        wrap.classList.add('d-none');
    }

    setTimeout(verificarSeGaleriaFicouVazia, 300);
}

function adicionarItemNaGrade(numero, src, tipo, masonry, aoCarregar) {
    const legenda = (typeof GALERIA_LEGENDAS === 'object' && GALERIA_LEGENDAS[numero]) ? GALERIA_LEGENDAS[numero] : '';

    const item = document.createElement('figure');
    item.className = (tipo === 'video') ? 'galeria-item galeria-item-video m-0' : 'galeria-item m-0';

    if (tipo === 'video') {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none'; // CORREÇÃO (performance mobile): não baixa nada ainda — só quando o item entrar perto da tela (ver lazyCarregarVideo abaixo)

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
        video.onerror = () => { clearTimeout(timeoutRevelacao); item.remove(); verificarSeGaleriaFicouVazia(); if (aoCarregar) aoCarregar(); };

        // CORREÇÃO (performance mobile — item 1 da revisão): antes o vídeo
        // baixava os metadados (uma requisição de rede) assim que era
        // descoberto, mesmo estando fora da tela — em um álbum que só
        // cresce, isso soma requisições desnecessárias em toda abertura da
        // Galeria. Agora só define `src`/`preload` quando o item entra
        // perto da área visível (mesmo mecanismo do IntersectionObserver
        // usado pra revelar o item, com margem maior pra antecipar).
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
        // CORREÇÃO (performance mobile — item 1 da revisão): `loading="lazy"`
        // faz o próprio navegador adiar o download até o item chegar perto
        // da tela, em vez de baixar TODAS as fotos do álbum de uma vez só
        // — importante porque o álbum foi feito pra crescer com o tempo.
        // `decoding="async"` evita travar a thread principal decodificando
        // a imagem (mais sensível em aparelhos de entrada).
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = src;
        img.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); if (aoCarregar) aoCarregar(); };
        img.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); if (aoCarregar) aoCarregar(); };

        item.appendChild(img);
    }

    if (legenda) {
        const cap = document.createElement('figcaption');
        cap.className = 'galeria-legenda';
        cap.textContent = legenda;
        item.appendChild(cap);
    }

    const indice = __galeriaItens.length;
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
        capa.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };

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
    const masonry = document.getElementById('galeriaMasonry');
    const vazio = document.getElementById('galeriaVazio');
    if (masonry && masonry.querySelectorAll('.galeria-item').length === 0) vazio.classList.remove('d-none');
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

// CORREÇÃO (galeria "trava" pela metade se a pessoa sai do site no meio do
// carregamento): se a página está sendo restaurada de um congelamento do
// navegador (bfcache — ver comentário de __galeriaCarregamentoCompleto
// acima) e a varredura ainda não tinha terminado quando ela foi
// congelada, refaz o carregamento do zero. As requisições HEAD já feitas
// e as imagens já baixadas costumam vir do cache do próprio navegador,
// então isso normalmente é rápido — muito mais rápido que a primeira vez.
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
    if (btnVerVideos) btnVerVideos.addEventListener('click', carregarVideosDaGaleria);

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
