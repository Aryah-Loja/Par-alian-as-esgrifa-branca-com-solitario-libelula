/**
 * FUTURO.JS — "Deixe uma mensagem para nós do futuro"
 * Texto, voz ou vídeo — cada mensagem vira um registro na tabela "media" do
 * IndexedDB (ver db.js).
 */

let futuroStream = null;
let futuroStreamEspelhado = null;
let futuroRecorder = null;
let futuroChunks = [];
let futuroModo = null; // 'texto' | 'audio' | 'video'
let futuroBlobPendente = null;
let futuroMimePendente = null;
let futuroTimerIntervalo = null;
let futuroTimerSegundos = 0;
let futuroTimeoutMaximo = null;
const FUTURO_VIDEO_DURACAO_MAXIMA_SEGUNDOS = 30; // limite pra não encher o banco de dados com vídeos longos (ver prompt de correções)
const FUTURO_AUDIO_DURACAO_MAXIMA_SEGUNDOS = 60; // idem, só que pro áudio (mais leve, por isso o limite é maior)

function pararStreamFuturo() {
    if (futuroStream) { futuroStream.getTracks().forEach(t => t.stop()); futuroStream = null; }
    if (futuroStreamEspelhado) { futuroStreamEspelhado.parar(); futuroStreamEspelhado = null; }
}

function iniciarTimerFuturo() {
    futuroTimerSegundos = 0;
    const timerEl = document.getElementById('futuroTimer');
    if (timerEl) { timerEl.textContent = '00:00'; timerEl.classList.remove('d-none'); }
    futuroTimerIntervalo = setInterval(() => {
        futuroTimerSegundos++;
        const min = String(Math.floor(futuroTimerSegundos / 60)).padStart(2, '0');
        const seg = String(futuroTimerSegundos % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${min}:${seg}`;
    }, 1000);
}

function pararTimerFuturo() {
    if (futuroTimerIntervalo) { clearInterval(futuroTimerIntervalo); futuroTimerIntervalo = null; }
    const timerEl = document.getElementById('futuroTimer');
    if (timerEl) timerEl.classList.add('d-none');
}

function resetarFuturoOverlayEstado() {
    futuroModo = null; futuroBlobPendente = null; futuroMimePendente = null; futuroChunks = [];
    pararTimerFuturo();
    if (futuroTimeoutMaximo) { clearTimeout(futuroTimeoutMaximo); futuroTimeoutMaximo = null; }

    document.getElementById('futuroEscolha').classList.remove('d-none');
    document.getElementById('futuroTextoArea').classList.add('d-none');
    document.getElementById('futuroGravacaoArea').classList.add('d-none');
    document.getElementById('futuroSucesso').classList.add('d-none');

    const statusEl = document.getElementById('futuroStatus');
    statusEl.textContent = ''; statusEl.className = 'save-status';
    document.getElementById('futuroTextoInput').value = '';

    const previewVideo = document.getElementById('futuroPreviewVideo');
    const playbackVideo = document.getElementById('futuroPlaybackVideo');
    const playbackAudio = document.getElementById('futuroPlaybackAudio');
    previewVideo.classList.add('d-none'); previewVideo.srcObject = null;
    playbackVideo.classList.add('d-none'); playbackVideo.removeAttribute('src');
    playbackAudio.classList.add('d-none'); playbackAudio.removeAttribute('src');
    document.getElementById('futuroVozIndicador').classList.add('d-none');

    document.getElementById('btnFuturoIniciar').classList.remove('d-none');
    document.getElementById('btnFuturoParar').classList.add('d-none');
    document.getElementById('futuroAcoesGravacao').classList.add('d-none');
}

function abrirFuturoOverlay() {
    document.getElementById('futuroOverlay').classList.remove('d-none');
    bloquearScrollFundoLembranca();
    resetarFuturoOverlayEstado();
}

function fecharFuturoOverlay() {
    document.getElementById('futuroOverlay').classList.add('d-none');
    desbloquearScrollFundoLembranca();
    if (futuroTimeoutMaximo) { clearTimeout(futuroTimeoutMaximo); futuroTimeoutMaximo = null; }
    if (futuroRecorder && futuroRecorder.state !== 'inactive') { try { futuroRecorder.stop(); } catch (e) { /* já estava parado, sem problema */ } }
    pararStreamFuturo();
    pararTimerFuturo();
}

async function escolherModoFuturo(modo) {
    futuroModo = modo;
    document.getElementById('futuroEscolha').classList.add('d-none');
    const statusEl = document.getElementById('futuroStatus');
    statusEl.textContent = ''; statusEl.className = 'save-status';

    if (modo === 'texto') {
        document.getElementById('futuroTextoArea').classList.remove('d-none');
        document.getElementById('futuroTextoInput').focus();
        return;
    }

    document.getElementById('futuroGravacaoArea').classList.remove('d-none');
    const previewVideo = document.getElementById('futuroPreviewVideo');
    const vozIndicador = document.getElementById('futuroVozIndicador');

    try {
        const constraints = modo === 'video'
            ? { video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } }, audio: true }
            : { audio: true };
        futuroStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (modo === 'video') { previewVideo.srcObject = futuroStream; previewVideo.classList.remove('d-none'); vozIndicador.classList.add('d-none'); }
        else { previewVideo.classList.add('d-none'); vozIndicador.classList.remove('d-none'); }
    } catch (err) {
        statusEl.textContent = instrucoesDesbloquearPermissaoMidia(err);
        statusEl.className = 'save-status err';
        console.error('Permissão negada para mensagem do futuro:', err);
    }
}

function iniciarGravacaoFuturo() {
    if (!futuroStream) return;
    futuroChunks = []; futuroBlobPendente = null;
    const statusEl = document.getElementById('futuroStatus');
    statusEl.textContent = ''; statusEl.className = 'save-status';

    const opcoesGravacao = montarOpcoesMediaRecorder(futuroModo); // limita o bitrate para reduzir backup, tráfego e uso de Storage

    // Espelha o vídeo antes de gravar (ver criarStreamEspelhado em js/utils.js).
    const streamParaGravar = futuroModo === 'video'
        ? (futuroStreamEspelhado = criarStreamEspelhado(futuroStream)).stream
        : futuroStream;

    try {
        futuroRecorder = new MediaRecorder(streamParaGravar, opcoesGravacao);
    } catch (err) {
        // Fallback para navegadores sem suporte a videoBitsPerSecond/audioBitsPerSecond.
        try {
            const mimeType = getSupportedMimeTypeParaModo(futuroModo);
            futuroRecorder = mimeType ? new MediaRecorder(streamParaGravar, { mimeType }) : new MediaRecorder(streamParaGravar);
        } catch (err2) {
            console.error('Falha ao iniciar o gravador de mídia', err2);
            statusEl.textContent = 'Não foi possível iniciar a gravação neste navegador.';
            statusEl.className = 'save-status err';
            if (futuroStreamEspelhado) { futuroStreamEspelhado.parar(); futuroStreamEspelhado = null; }
            return;
        }
    }

    futuroRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) futuroChunks.push(e.data); };

    futuroRecorder.onstop = () => {
        pararTimerFuturo();
        if (futuroTimeoutMaximo) { clearTimeout(futuroTimeoutMaximo); futuroTimeoutMaximo = null; }
        if (futuroStreamEspelhado) { futuroStreamEspelhado.parar(); futuroStreamEspelhado = null; }

        const tipoFinal = futuroRecorder.mimeType || (futuroModo === 'video' ? 'video/webm' : 'audio/webm');
        futuroBlobPendente = new Blob(futuroChunks, { type: tipoFinal });
        futuroMimePendente = tipoFinal;

        if (futuroModo === 'video') {
            document.getElementById('futuroPreviewVideo').classList.add('d-none');
            const playbackVideo = document.getElementById('futuroPlaybackVideo');
            atribuirObjectURLGerenciado(playbackVideo, futuroBlobPendente); playbackVideo.classList.remove('d-none');
        } else {
            document.getElementById('futuroVozIndicador').classList.add('d-none');
            const playbackAudio = document.getElementById('futuroPlaybackAudio');
            atribuirObjectURLGerenciado(playbackAudio, futuroBlobPendente); playbackAudio.classList.remove('d-none');
        }
        document.getElementById('futuroAcoesGravacao').classList.remove('d-none');
    };

    futuroRecorder.start();
    iniciarTimerFuturo();
    document.getElementById('btnFuturoIniciar').classList.add('d-none');
    document.getElementById('btnFuturoParar').classList.remove('d-none');

    // Limite de duração automático: 30s pro vídeo, 1 minuto pro áudio
    // (áudio é bem mais leve, por isso aguenta mais tempo).
    const limiteSegundos = futuroModo === 'video' ? FUTURO_VIDEO_DURACAO_MAXIMA_SEGUNDOS : FUTURO_AUDIO_DURACAO_MAXIMA_SEGUNDOS;
    const limiteTexto = futuroModo === 'video' ? '30 segundos' : '1 minuto';
    futuroTimeoutMaximo = setTimeout(() => {
        statusEl.textContent = `Chegou no limite de ${limiteTexto}, parando a gravação automaticamente.`;
        statusEl.className = 'save-status pending';
        pararGravacaoFuturo();
    }, limiteSegundos * 1000);
}

function pararGravacaoFuturo() {
    if (futuroTimeoutMaximo) { clearTimeout(futuroTimeoutMaximo); futuroTimeoutMaximo = null; }
    if (futuroRecorder && futuroRecorder.state !== 'inactive') futuroRecorder.stop();
    document.getElementById('btnFuturoParar').classList.add('d-none');
}

function regravarMensagemFuturo() {
    futuroBlobPendente = null; futuroMimePendente = null; futuroChunks = [];
    document.getElementById('futuroAcoesGravacao').classList.add('d-none');
    document.getElementById('btnFuturoIniciar').classList.remove('d-none');

    const playbackVideo = document.getElementById('futuroPlaybackVideo');
    const playbackAudio = document.getElementById('futuroPlaybackAudio');
    liberarObjectURLGerenciado(playbackVideo);
    liberarObjectURLGerenciado(playbackAudio);
    playbackVideo.classList.add('d-none'); playbackVideo.removeAttribute('src');
    playbackAudio.classList.add('d-none'); playbackAudio.removeAttribute('src');

    if (futuroModo === 'video') {
        const previewVideo = document.getElementById('futuroPreviewVideo');
        previewVideo.classList.remove('d-none');
        if (futuroStream) previewVideo.srcObject = futuroStream;
    } else {
        document.getElementById('futuroVozIndicador').classList.remove('d-none');
    }

    const statusEl = document.getElementById('futuroStatus');
    statusEl.textContent = ''; statusEl.className = 'save-status';
}

async function salvarMensagemFuturoGravada() {
    if (!futuroBlobPendente) return;
    const statusEl = document.getElementById('futuroStatus');
    statusEl.textContent = 'Salvando mensagem...'; statusEl.className = 'save-status pending';

    const id = gerarIdUnico('futuro');
    const sucesso = await salvarMedia({ id, tipo: 'mensagem_futuro', subtipo: futuroModo, blob: futuroBlobPendente, mimeType: futuroMimePendente });

    pararStreamFuturo();

    if (sucesso) {
        document.getElementById('futuroGravacaoArea').classList.add('d-none');
        document.getElementById('futuroSucesso').classList.remove('d-none');
        const videoGrande = futuroModo === 'video' && futuroBlobPendente.size > 45 * 1024 * 1024;
        statusEl.textContent = videoGrande
            ? `Essa mensagem ficou com ${(futuroBlobPendente.size / (1024 * 1024)).toFixed(1)}MB. Ela será dividida e sincronizada, mas pode demorar mais e consumir bastante espaço da nuvem. Guarde também uma cópia fora do site.`
            : '';
        statusEl.className = videoGrande ? 'save-status pending' : 'save-status';
        renderizarMensagensFuturo();
    } else {
        statusEl.textContent = 'Não foi possível confirmar o salvamento. Tente novamente.';
        statusEl.className = 'save-status err';
    }
}

async function salvarMensagemFuturoTexto() {
    const textarea = document.getElementById('futuroTextoInput');
    const texto = textarea.value.trim();
    const statusEl = document.getElementById('futuroStatus');

    if (!texto) { statusEl.textContent = 'Escreva algo antes de guardar :)'; statusEl.className = 'save-status err'; return; }

    statusEl.textContent = 'Salvando mensagem...'; statusEl.className = 'save-status pending';
    const id = gerarIdUnico('futuro');
    const sucesso = await salvarMedia({ id, tipo: 'mensagem_futuro', subtipo: 'texto', texto });

    if (sucesso) {
        document.getElementById('futuroTextoArea').classList.add('d-none');
        document.getElementById('futuroSucesso').classList.remove('d-none');
        statusEl.textContent = '';
        renderizarMensagensFuturo();
    } else {
        statusEl.textContent = 'Não foi possível confirmar o salvamento. Tente novamente.';
        statusEl.className = 'save-status err';
    }
}

async function renderizarMensagensFuturo() {
    const lista = await obterMediaPorTipo('mensagem_futuro');
    const container = document.getElementById('mensagensFuturoLista');
    const vazio = document.getElementById('mensagensFuturoVazio');
    if (!container) return;

    container.innerHTML = '';
    if (!lista.length) { vazio.classList.remove('d-none'); return; }
    vazio.classList.add('d-none');

    const ordenada = [...lista].sort((a, b) => b.criadoEm - a.criadoEm);
    const iconePorTipo = { texto: 'bi-chat-heart-fill', audio: 'bi-mic-fill', video: 'bi-camera-video-fill' };

    ordenada.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'mensagem-futuro-item';
        const cabecalho = document.createElement('p');
        cabecalho.className = 'mensagem-futuro-data';
        cabecalho.innerHTML = `<i class="bi ${iconePorTipo[msg.subtipo] || 'bi-heart-fill'} mensagem-futuro-tipo-icon"></i>${formatarDataHoraMensagem(new Date(msg.criadoEm).toISOString())}`;
        item.appendChild(cabecalho);

        if (msg.subtipo === 'texto') {
            const p = document.createElement('p');
            p.className = 'mensagem-futuro-texto';
            p.textContent = msg.texto || '';
            item.appendChild(p);
        } else if (msg.subtipo === 'audio' && msg.blob) {
            const audio = document.createElement('audio');
            audio.className = 'mensagem-futuro-audio'; audio.controls = true; audio.preload = 'metadata'; atribuirObjectURLGerenciado(audio, msg.blob);
            item.appendChild(audio);
        } else if (msg.subtipo === 'video' && msg.blob) {
            const video = document.createElement('video');
            video.className = 'mensagem-futuro-video-el'; video.controls = true; video.playsInline = true; video.preload = 'metadata'; atribuirObjectURLGerenciado(video, msg.blob);
            item.appendChild(video);
        }
        container.appendChild(item);
    });
}

function iniciarModuloFuturo() {
    document.getElementById('btnMensagemFuturo').addEventListener('click', abrirFuturoOverlay);
    document.getElementById('btnFecharFuturo').addEventListener('click', fecharFuturoOverlay);
    document.getElementById('btnFuturoTexto').addEventListener('click', () => escolherModoFuturo('texto'));
    document.getElementById('btnFuturoVoz').addEventListener('click', () => escolherModoFuturo('audio'));
    document.getElementById('btnFuturoVideo').addEventListener('click', () => escolherModoFuturo('video'));
    document.getElementById('btnFuturoIniciar').addEventListener('click', iniciarGravacaoFuturo);
    document.getElementById('btnFuturoParar').addEventListener('click', pararGravacaoFuturo);
    document.getElementById('btnFuturoRegravar').addEventListener('click', regravarMensagemFuturo);
    document.getElementById('btnFuturoSalvarGravacao').addEventListener('click', salvarMensagemFuturoGravada);
    document.getElementById('btnFuturoSalvarTexto').addEventListener('click', salvarMensagemFuturoTexto);
}
