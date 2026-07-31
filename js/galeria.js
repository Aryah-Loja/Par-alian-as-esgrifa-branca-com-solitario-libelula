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

async function montarGaleria() {
    __galeriaCarregamentoCompleto = false;
    __galeriaItens = [];
    __galeriaFotosCarregadas = 0;

    const masonry = document.getElementById('galeriaMasonry');
    if (!masonry) return;

    // As "colunas" agora são divs de verdade (ver CSS .galeria-coluna),
    // não a propriedade column-count do CSS — isso evita que o navegador
    // fique rebalanceando/pulando os itens de coluna conforme cada foto
    // termina de carregar com uma altura diferente da esperada (era a
    // causa do efeito "carregando de baixo pra cima"). A quantidade de
    // colunas replica os mesmos pontos de corte que existiam antes no
    // CSS: 1 coluna no celular, 2/3/4 conforme a tela cresce.
    const numeroDeColunas = () => {
        const largura = window.innerWidth;
        if (largura >= 980) return 4;
        if (largura >= 640) return 3;
        if (largura >= 480) return 2;
        return 1;
    };

    let colunas = [];
    const montarColunas = (qtd) => {
        masonry.innerHTML = '';
        colunas = [];
        for (let i = 0; i < qtd; i++) {
            const col = document.createElement('div');
            col.className = 'galeria-coluna';
            masonry.appendChild(col);
            colunas.push(col);
        }
    };
    montarColunas(numeroDeColunas());

    // Se a tela girar/redimensionar a ponto de mudar a quantidade de
    // colunas, reconstrói as colunas e redistribui os itens já montados
    // (sem refazer nenhuma busca no servidor) — mantém a mesma ordem.
    let __ultimoNumeroColunas = colunas.length;
    window.addEventListener('resize', () => {
        const novoNumero = numeroDeColunas();
        if (novoNumero === __ultimoNumeroColunas) return;
        __ultimoNumeroColunas = novoNumero;
        const itensAtuais = Array.from(masonry.querySelectorAll('.galeria-item'))
            .sort((a, b) => Number(a.dataset.ordem) - Number(b.dataset.ordem));
        montarColunas(novoNumero);
        itensAtuais.forEach((item, indice) => colunas[indice % colunas.length].appendChild(item));
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
        // Cada foto/vídeo entra sempre na MESMA coluna a partir do seu
        // índice (round-robin) — nunca muda de coluna depois de
        // colocada, diferente do balanceamento automático do CSS
        // column-count, que reordenava tudo conforme as alturas reais
        // iam ficando conhecidas.
        const colunaAlvo = colunas[__galeriaItens.length % colunas.length];
        adicionarItemNaGrade(item.numero, item.caminho, item.tipo, colunaAlvo, contarCarregado);
        atualizarProgresso();
    };

    // REFORMULAÇÃO (30/07/2026 — ver comentário grande em js/utils.js):
    // se já existe um cache COMPLETO de uma visita anterior neste mesmo
    // aparelho, usa ele direto — pula a varredura por completo, a grade
    // já entra montada com tudo, sem esperar nenhuma requisição de rede.
    // Só faz a varredura de verdade quando não há cache ainda (ex.:
    // primeira vez que a Galeria abre neste aparelho).
    const itensEmCache = galeriaLerCache(true);
    if (itensEmCache && itensEmCache.length) {
        itensEmCache
            .slice()
            .sort((a, b) => a.numero - b.numero)
            .forEach(aoEncontrarItem);
        varreduraTerminou = true;
        if (barraWrap) barraWrap.classList.add('d-none');
    } else {
        await galeriaEscanearCompleta(null, aoEncontrarItem);
        varreduraTerminou = true;
        if (totalEncontrados === 0 && barraWrap) barraWrap.classList.add('d-none');
        atualizarProgresso();
    }

    montarItensYoutube(colunas);

    __galeriaCarregamentoCompleto = true;

    setTimeout(verificarSeGaleriaFicouVazia, 1200);

    // Atualiza o cache em segundo plano (throttlado, ver GALERIA_REVALIDACAO_INTERVALO_MS
    // em js/utils.js) — se Gabriel tiver adicionado fotos/vídeos novos, eles
    // aparecem na PRÓXIMA abertura da Galeria, sem travar esta.
    galeriaRevalidarEmSegundoPlano();
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
        video.preload = 'metadata';
        video.src = `${src}#t=0.5`; // pede o frame de 0.5s como "capa" (evita quadro preto do início em alguns vídeos)

        // Proteção: alguns vídeos gravados direto do celular (metadata no
        // fim do arquivo, codecs variados) não disparam onloadedmetadata de
        // forma confiável em todo navegador — sem essa proteção, o item
        // ficava preso invisível (opacity: 0) pra sempre, dando a
        // impressão de que "o vídeo não carregou". revelarUmaVez() garante
        // que o item aparece de qualquer forma depois de um tempo, mesmo
        // sem o evento, e cancela o timeout se o evento realmente disparar.
        let jaRevelado = false;
        const revelarUmaVez = () => {
            if (jaRevelado) return;
            jaRevelado = true;
            clearTimeout(timeoutRevelacao);
            __galeriaFotosCarregadas++;
            observarRevelacao(item);
            if (aoCarregar) aoCarregar();
        };
        const timeoutRevelacao = setTimeout(revelarUmaVez, 2500);

        video.onloadedmetadata = revelarUmaVez;
        video.onloadeddata = revelarUmaVez; // fallback extra — dispara em mais casos que onloadedmetadata
        video.onerror = () => { clearTimeout(timeoutRevelacao); item.remove(); verificarSeGaleriaFicouVazia(); if (aoCarregar) aoCarregar(); };

        const iconePlay = document.createElement('div');
        iconePlay.className = 'galeria-video-play';
        iconePlay.innerHTML = '<i class="bi bi-play-fill"></i>';

        item.appendChild(video);
        item.appendChild(iconePlay);
    } else {
        const img = document.createElement('img');
        img.alt = legenda || `Lembrança ${numero}`;
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
