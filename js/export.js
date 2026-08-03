/**
 * EXPORT.JS — Exportar lembranças (carta em PNG/PDF, certificado de namoro,
 * Polaroid) e o backup/restauração completos (também usados pela
 * sincronização entre aparelhos, ver sync.js).
 */

/* ----------------------------------------------------------------------
   LEMBRANÇAS PRA IMPRIMIR — constelação e carta física com QR code. Ambas
   leem TIMELINE_MARCOS / textoVersiculoBase() na hora de gerar a imagem.
   ---------------------------------------------------------------------- */

function mostrarStatusExportar(mensagem, tipo) {
    const statusEl = document.getElementById('exportarStatus');
    if (!statusEl) return;
    statusEl.textContent = mensagem;
    statusEl.className = tipo ? `save-status ${tipo}` : 'save-status';
}

/** Cartão postal do "Nosso mapa" — um card por lugar, com foto (se já tiver sido adicionada) + nome + texto. */
// Calcula quantas colunas usar e o tamanho de foto que cabe para qualquer
// quantidade de itens, sem cortar nem espremer.
function calcularGradeParaCaber(quantidade, larguraDisponivel, alturaDisponivel, tamanhoMaximoFoto, tamanhoMinimoFoto) {
    quantidade = Math.max(1, quantidade);
    let melhor = null;
    for (let colunas = 1; colunas <= quantidade; colunas++) {
        const linhas = Math.ceil(quantidade / colunas);
        const larguraPorItem = larguraDisponivel / colunas;
        const alturaPorItem = alturaDisponivel / linhas;
        const tamanhoFoto = Math.min(larguraPorItem, alturaPorItem, tamanhoMaximoFoto);
        if (!melhor || tamanhoFoto > melhor.tamanhoFoto) melhor = { colunas, linhas, tamanhoFoto };
    }
    melhor.tamanhoFoto = Math.max(tamanhoMinimoFoto, melhor.tamanhoFoto);
    return melhor;
}

/** Constelação pra imprimir — reaproveita TIMELINE_MARCOS, sempre no visual escuro/estrelado. */
async function gerarConstelacao() {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador de imagem. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando a constelação...', 'pending');

    try {
        const el = document.getElementById('constelacaoExportavel');

        const lista = document.getElementById('constelacaoLista');
        lista.innerHTML = '';

        const larguraUtil = IMPRIMIVEL_LARGURA_PX - 140;
        const alturaUtil = IMPRIMIVEL_ALTURA_PX - 360;
        const { colunas, tamanhoFoto } = calcularGradeParaCaber(TIMELINE_MARCOS.length, larguraUtil, alturaUtil, 220, 64);
        lista.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;

        const fonteData = Math.max(14, Math.min(22, tamanhoFoto * 0.13));

        for (const marco of TIMELINE_MARCOS) {
            const item = document.createElement('div');
            item.className = 'constelacao-item' + (marco.ehPedido ? ' constelacao-item-pedido' : '');
            const fotoSrc = await resolverFotoPlaceholderOuAsset(marco.foto);
            const tamanhoEsteItem = marco.ehPedido ? tamanhoFoto * 1.18 : tamanhoFoto;
            item.innerHTML = `
                <span class="constelacao-item-estrela" aria-hidden="true">✦</span>
                <img src="${fotoSrc}" alt="${marco.ehPedido ? 'Hoje' : marco.data}" style="width:${tamanhoEsteItem}px; height:${tamanhoEsteItem}px;">
                <p class="constelacao-item-data" style="font-size:${fonteData}px;">${marco.ehPedido ? 'Hoje' : (marco.data || '')}</p>`;
            lista.appendChild(item);
        }

        const canvas = await html2canvas(el, { backgroundColor: '#0f0810', width: IMPRIMIVEL_LARGURA_PX, height: IMPRIMIVEL_ALTURA_PX, scale: 1 });
        await baixarCanvasComoPng(canvas, 'nosso-ceu.png');
        mostrarStatusExportar('Constelação exportada com sucesso. Pode imprimir no tamanho 10x15cm.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar a constelação', err);
        mostrarStatusExportar('Não foi possível exportar a constelação.', 'err');
    }
}

// Tenta o formato flexível (arquivoBase) e cai para o fixo (getAsset) se não achar.
async function resolverFotoPlaceholderOuAsset(id) {
    const item = PLACEHOLDERS[id];
    if (item && item.arquivoBase) return resolverFotoPlaceholder(id);
    return getAsset(id);
}

/** Carta física com QR code — mesmo texto/carinho da carta final, pensada pra imprimir em papel A4 e guardar de verdade. */
async function gerarCartaFisica() {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') { mostrarStatusExportar('Não foi possível carregar o exportador de PDF. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando a carta física...', 'pending');

    try {
        const textoFinal = textoVersiculoBase().replace(/\{AMOR\}/g, NOME_DELA);
        document.getElementById('cartaFisicaTexto').textContent = textoFinal;
        document.getElementById('cartaFisicaAssinatura').textContent = TEXTOS.assinaturaCartaFinal;

        const qrWrap = document.getElementById('cartaFisicaQrWrap');
        const qrDiv = document.getElementById('cartaFisicaQr');
        qrDiv.innerHTML = '';
        if (typeof URL_DO_SITE !== 'undefined' && URL_DO_SITE && typeof qrcode === 'function') {
            try {
                const qr = qrcode(0, 'M');
                qr.addData(URL_DO_SITE);
                qr.make();
                qrDiv.innerHTML = qr.createSvgTag({ scalable: true });
                qrWrap.classList.remove('d-none');
            } catch (e) {
                console.error('Não foi possível gerar o QR code da carta física:', e);
                qrWrap.classList.add('d-none');
            }
        } else {
            qrWrap.classList.add('d-none'); // sem URL_DO_SITE configurada ainda (js/config.js) — a carta sai só com o texto, normalmente
        }

        const canvas = await html2canvas(document.getElementById('cartaFisicaExportavel'), { backgroundColor: '#FBF7F0', scale: 2 });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const larguraA4 = 210, alturaA4 = 297, margem = 15;
        const larguraImagemMM = larguraA4 - margem * 2;
        const alturaImagemMM = larguraImagemMM * (canvas.height / canvas.width);
        const alturaPaginaMM = alturaA4 - margem * 2;

        // Se a carta couber numa página, centraliza; se for mais comprida
        // que A4, divide automaticamente em quantas páginas forem necessárias.
        if (alturaImagemMM <= alturaPaginaMM) {
            const yInicial = margem + (alturaPaginaMM - alturaImagemMM) / 2;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margem, yInicial, larguraImagemMM, alturaImagemMM);
        } else {
            const pxPorMM = canvas.width / larguraImagemMM;
            const alturaPaginaPX = Math.floor(alturaPaginaMM * pxPorMM);
            let yAtualPX = 0;
            let primeiraPagina = true;

            while (yAtualPX < canvas.height) {
                const alturaFatiaPX = Math.min(alturaPaginaPX, canvas.height - yAtualPX);
                const canvasFatia = document.createElement('canvas');
                canvasFatia.width = canvas.width;
                canvasFatia.height = alturaFatiaPX;
                const ctx = canvasFatia.getContext('2d');
                ctx.fillStyle = '#FBF7F0';
                ctx.fillRect(0, 0, canvasFatia.width, canvasFatia.height);
                ctx.drawImage(canvas, 0, yAtualPX, canvas.width, alturaFatiaPX, 0, 0, canvas.width, alturaFatiaPX);

                const alturaFatiaMM = alturaFatiaPX / pxPorMM;
                if (!primeiraPagina) pdf.addPage();
                pdf.addImage(canvasFatia.toDataURL('image/png'), 'PNG', margem, margem, larguraImagemMM, alturaFatiaMM);

                yAtualPX += alturaFatiaPX;
                primeiraPagina = false;
            }
        }

        const blobPdf = pdf.output('blob'); // pdf.save() sozinho não faz nada no Safari do iPhone, mesmo bug do PNG
        await salvarOuCompartilharArquivo(blobPdf, 'nossa-carta.pdf', 'application/pdf');
        mostrarStatusExportar('Carta física exportada com sucesso. Pode imprimir em papel A4.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar a carta física', err);
        mostrarStatusExportar('Não foi possível exportar a carta física.', 'err');
    }
}

/* ----------------------------------------------------------------------
   Foto estilo Polaroid com legenda — NOVO FLUXO (item 5 do prompt):
   1. clicar em "Gerar Polaroid" abre a câmera;
   2. tirar a foto naquele momento;
   3. confirmar ou tirar novamente;
   4. só então a Polaroid é gerada (com a data automática do pedido +
      frase personalizada opcional) e salva no banco, para aparecer em
      qualquer aparelho depois de sincronizar.
   ---------------------------------------------------------------------- */
let polaroidCameraStream = null;
let polaroidFotoCapturadaDataUrl = null;

async function abrirCameraPolaroid() {
    const modal = document.getElementById('polaroidCameraModal');
    if (!modal) return;
    const jaEstavaAberto = !modal.classList.contains('d-none');
    modal.classList.remove('d-none');
    if (!jaEstavaAberto) bloquearScrollFundoLembranca(); // repetirFotoPolaroid() chama isto de novo com o modal já aberto — não trava duas vezes

    // Pré-preenche a legenda com a data padrão (Polaroid de Aniversário),
    // só na primeira abertura — assim não sobrescreve o que a pessoa já
    // tiver digitado ao tirar a foto de novo (repetirFotoPolaroid).
    if (!jaEstavaAberto) {
        const legendaInput = document.getElementById('polaroidLegendaInput');
        if (legendaInput && !legendaInput.value) legendaInput.value = TEXTOS.polaroidFrasePadrao;
    }
    document.getElementById('polaroidCameraErro').classList.add('d-none');
    document.getElementById('polaroidCameraPreviewWrap').classList.remove('d-none');
    document.getElementById('polaroidCameraConfirmWrap').classList.add('d-none');

    try {
        polaroidCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        document.getElementById('polaroidCameraVideo').srcObject = polaroidCameraStream;
    } catch (err) {
        console.error('Não foi possível abrir a câmera para a Polaroid:', err);
        document.getElementById('polaroidCameraErro').classList.remove('d-none');
    }
}

function pararCameraPolaroid() {
    if (polaroidCameraStream) {
        polaroidCameraStream.getTracks().forEach(track => track.stop());
        polaroidCameraStream = null;
    }
}

function fecharModalCameraPolaroid() {
    pararCameraPolaroid();
    const modal = document.getElementById('polaroidCameraModal');
    if (modal) { modal.classList.add('d-none'); desbloquearScrollFundoLembranca(); }
}

function capturarFotoPolaroid() {
    const video = document.getElementById('polaroidCameraVideo');
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // A câmera entrega o frame não espelhado (só a TELA espelha o preview
    // via CSS), então espelhamos aqui também para bater com o que foi visto.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    polaroidFotoCapturadaDataUrl = canvas.toDataURL('image/png');

    document.getElementById('polaroidCameraFotoCapturada').src = polaroidFotoCapturadaDataUrl;
    document.getElementById('polaroidCameraPreviewWrap').classList.add('d-none');
    document.getElementById('polaroidCameraConfirmWrap').classList.remove('d-none');
    pararCameraPolaroid(); // libera a câmera enquanto a pessoa decide confirmar ou repetir
}

function repetirFotoPolaroid() {
    polaroidFotoCapturadaDataUrl = null;
    abrirCameraPolaroid();
}

async function confirmarFotoEGerarPolaroid() {
    if (!polaroidFotoCapturadaDataUrl) return;
    const fraseCustom = (document.getElementById('polaroidLegendaInput').value || '').trim();
    const foto = polaroidFotoCapturadaDataUrl;
    fecharModalCameraPolaroid();
    await gerarPolaroidComFoto(foto, fraseCustom);
}

/** Gera a Polaroid a partir da foto confirmada, baixa uma cópia e salva no banco (visível em qualquer aparelho). */
async function gerarPolaroidComFoto(fotoDataUrl, fraseCustom) {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando polaroid...', 'pending');

    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    const dataTexto = dataPedidoIso ? formatarDataPedido(dataPedidoIso) : formatarDataPedido(new Date().toISOString());
    const frase = fraseCustom || TEXTOS.polaroidFrasePadrao; // sem frase informada -> usa a frase padrão do projeto

    document.getElementById('polaroidExportavelData').textContent = dataTexto;
    document.getElementById('polaroidExportavelLegenda').textContent = frase;
    document.getElementById('polaroidExportavelImg').src = fotoDataUrl;

    try {
        const canvas = await html2canvas(document.getElementById('polaroidExportavel'), { backgroundColor: '#ffffff', scale: 2 });
        await baixarCanvasComoPng(canvas, 'nosso-momento-polaroid.png'); // download local: mantém PNG (qualidade máxima, é só um arquivo)

        // JPEG reduz o tamanho (a foto não tem transparência a perder).
        const blobPolaroid = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
        if (blobPolaroid) {
            await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: blobPolaroid, mimeType: 'image/jpeg' });
            await exibirPolaroidSalva();
        }

        mostrarStatusExportar('Polaroid gerada, baixada e salva com sucesso, vai aparecer em qualquer aparelho.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar polaroid', err);
        mostrarStatusExportar('Não foi possível gerar a polaroid.', 'err');
    }
}

/** Exibe a Polaroid já salva (se existir) — chamado na inicialização e sempre que uma nova é gerada/sincronizada. */
async function exibirPolaroidSalva() {
    const wrap = document.getElementById('polaroidSalvaWrap');
    if (!wrap) return;
    try {
        const registro = await obterMedia('polaroid_gerada');
        if (registro && registro.blob) {
            wrap.querySelector('img').src = URL.createObjectURL(registro.blob);
            wrap.classList.remove('d-none');
        } else {
            wrap.classList.add('d-none');
        }
    } catch (e) { console.error('Falha ao carregar a polaroid salva', e); }
}

/* ---------------- Helpers de exportação ---------------- */
async function baixarCanvasComoPng(canvas, nomeArquivo) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Não foi possível gerar a imagem a partir do canvas.');
    return salvarOuCompartilharArquivo(blob, nomeArquivo, 'image/png');
}

/* ----------------------------------------------------------------------
   BACKUP COMPLETO — FORMATO NOVO (item 3 do prompt de melhorias)
   ----------------------------------------------------------------------
   POR QUE O BACKUP ANTIGO FALHAVA AO RESTAURAR:
   A versão anterior guardava TUDO (vídeo, áudios, fotos, polaroid) como
   texto base64 dentro de um único arquivo .json gigantesco. Isso tem dois
   problemas sérios, principalmente no Safari/iPhone:
     1. Base64 infla o tamanho do arquivo em ~33%, então um vídeo de
        poucos minutos já gerava um .json de dezenas de MB.
     2. JSON.parse() em uma string desse tamanho é conhecido por falhar
        silenciosamente ou travar em navegadores baseados em WebKit
        (Safari/iOS), justamente o navegador usado neste projeto — ou
        seja, o backup "funcionava ao gerar" mas "não lia" depois.

   SOLUÇÃO: o backup agora é um arquivo .zip. Cada mídia (vídeo, áudios,
   fotos, polaroid, lembranças) vira um ARQUIVO BINÁRIO dentro do zip —
   sem base64, sem string gigante para o JSON.parse engasgar. Um
   "manifest.json" pequeno (só texto/configurações) descreve o resto.
   Isso também deixa o arquivo de backup consideravelmente menor.

   A lista de mídias é montada dinamicamente a partir de TUDO que existe
   na tabela "media" do IndexedDB — então qualquer arquivo salvo por
   qualquer funcionalidade do site (vídeo do pedido, assinatura, fotos
   enviadas, polaroids, mensagens para o futuro em texto/áudio/vídeo,
   lembranças) entra automaticamente no backup, sem precisar listar cada
   tipo manualmente.

   Compatibilidade: backups antigos (.json) ainda podem ser restaurados
   (ver restaurarBackupDeArquivo), mas todo backup novo já sai em .zip.
   ---------------------------------------------------------------------- */

/** Extensão de arquivo apropriada para um mimeType, usada só para nomear os arquivos dentro do zip. */
function extensaoParaMime(mimeType) {
    const mapa = {
        'video/webm': 'webm', 'video/mp4': 'mp4',
        'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif'
    };
    if (!mimeType) return 'bin';
    const base = mimeType.split(';')[0].trim();
    if (mapa[base]) return mapa[base];
    const partes = base.split('/');
    return partes[1] || 'bin';
}

/**
 * Lê uma configuração e tenta interpretar como JSON, sem derrubar o
 * backup inteiro se um valor individual estiver corrompido ou num
 * formato antigo incompatível (ex.: dado salvo por uma versão bem
 * anterior do site, antes de virar JSON.stringify). Antes, um único
 * JSON.parse() malformado dentro do manifesto abortava a função inteira
 * — e como tanto o botão "Backup" quanto a sincronização automática
 * chamam a mesma função, isso fazia parecer que "o backup parou de
 * funcionar" (a real causa era só um campo específico, não o backup
 * como um todo).
 */
async function obterConfigJSON(chave) {
    const bruto = await obterConfiguracao(chave);
    if (!bruto) return null;
    try {
        return JSON.parse(bruto);
    } catch (e) {
        console.error(`Backup: o valor salvo em "${chave}" não é um JSON válido — ignorando só esse campo neste backup (o resto continua normalmente).`, e);
        return null;
    }
}

/** Gera o backup completo como um Blob .zip (usado tanto pelo botão "Backup" quanto pela sincronização — ver sync.js). */
async function gerarBackupZipBlob() {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o gerador de backup (JSZip). Verifique sua conexão.');

    const zip = new JSZip();
    const pastaMedia = zip.folder('media');

    const manifest = {
        versao: 3,
        criadoEm: new Date().toISOString(),
        // Última alteração local, usada por js/sync.js para decidir "puxar" ou "empurrar".
        atualizadoEm: parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now(),
        nomeDela: NOME_DELA,
        nomeDele: NOME_DELE,
        dataInicioRelacionamento: await obterOuCriarDataPrimeiroAcesso(),
        dataPedido: await obterConfiguracao('aurora_data_pedido'),
        stage: await obterConfiguracao('aurora_stage'),
        regrasContrato: await obterConfigJSON('aurora_regras_contrato'),
        quizRespostas: await obterConfigJSON('aurora_quiz_respostas'),
        videoPedidoYoutube: await obterConfiguracao('aurora_video_pedido_youtube'),
        checklistEncontros: await obterConfigJSON('aurora_checklist_encontros'),
        checklistItensCustomizados: await obterConfigJSON('aurora_checklist_itens_customizados'),
        mapaLugaresExtra: await obterConfigJSON('aurora_mapa_lugares_extra'),
        // Campos novos e opcionais (quadro de previsões, termômetro do dia,
        // cartas condicionais liberadas e vitrine de recados) — backups
        // antigos simplesmente não têm essas chaves (fica undefined) e
        // continuam restaurando normalmente; aplicarBackupDeZip só grava
        // cada uma se ela existir no manifesto (mesmo padrão dos campos acima).
        previsoesRespostasGabriel: await obterConfigJSON('aurora_previsoes_gabriel'),
        previsoesRespostasAna: await obterConfigJSON('aurora_previsoes_ana'),
        previsoesCriadoEm: await obterConfiguracao('aurora_previsoes_criado_em') || null,
        previsoesAnaSenhaHash: await obterConfiguracao('aurora_previsoes_ana_senha_hash') || null,
        termometroLista: await obterConfigJSON('aurora_termometro_lista'),
        cartasCondicionaisLiberadas: await obterConfigJSON('aurora_cartas_condicionais_liberadas'),
        vitrineRecados: await obterConfigJSON('aurora_vitrine_recados'),
        medias: []
    };

    let todosRegistros = [];
    try { todosRegistros = await db.media.toArray(); } catch (e) { console.error('Backup: falha ao listar mídias', e); }

    for (const registro of todosRegistros) {
        if (registro.tipo === 'diagnostico') continue; // arquivo de teste técnico, não faz parte da experiência

        const entrada = { id: registro.id, tipo: registro.tipo, subtipo: registro.subtipo || null, criadoEm: registro.criadoEm || Date.now() };

        try {
            if (registro.blob) {
                const nomeArquivo = `${registro.id}.${extensaoParaMime(registro.mimeType || registro.blob.type)}`;
                pastaMedia.file(nomeArquivo, registro.blob);
                entrada.arquivo = nomeArquivo;
                entrada.mimeType = registro.mimeType || registro.blob.type || null;
            } else if (registro.texto) {
                entrada.texto = registro.texto; // ex: assinatura (dataURL pequeno) ou mensagem de texto para o futuro
            } else {
                continue;
            }
            manifest.medias.push(entrada);
        } catch (e) { console.error(`Backup: falha ao empacotar a mídia "${registro.id}"`, e); }
    }

    zip.file('manifest.json', JSON.stringify(manifest));
    // Sem compressão adicional (STORE): mídia já vem comprimida (MP4/JPEG),
    // recomprimir só gastaria processamento à toa.
    return await zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

/* ----------------------------------------------------------------------
   LEMBRETE DE BACKUP MANUAL
   ----------------------------------------------------------------------
   A sincronização automática com a nuvem é ótima, mas é uma dependência
   de terceiro — vale ter, de vez em quando, uma cópia baixada de
   verdade, fora de qualquer serviço. Este lembrete aparece só na página
   final (depois que tudo já aconteceu), e só quando faz tempo que
   ninguém baixa um backup — nunca no meio da experiência, e nunca toda
   vez que a página abre (respeita "lembrar depois" por um tempo).
   ---------------------------------------------------------------------- */
const LEMBRETE_BACKUP_INTERVALO_DIAS = 14;

async function verificarLembreteBackup() {
    try {
        const estagio = await obterConfiguracao('aurora_stage');
        if (estagio !== 'final') return; // só faz sentido lembrar depois que tudo já aconteceu

        const intervaloMs = LEMBRETE_BACKUP_INTERVALO_DIAS * 24 * 60 * 60 * 1000;
        const agora = Date.now();

        const ultimoBackup = parseInt(await obterConfiguracao('aurora_ultimo_backup_manual'), 10) || 0;
        const adiadoEm = parseInt(await obterConfiguracao('aurora_lembrete_backup_adiado_em'), 10) || 0;

        const semBackupHaMuitoTempo = (agora - ultimoBackup) > intervaloMs;
        const naoFoiAdiadoRecentemente = (agora - adiadoEm) > intervaloMs;

        if (semBackupHaMuitoTempo && naoFoiAdiadoRecentemente) {
            const banner = document.getElementById('lembreteBackup');
            if (banner) banner.classList.remove('d-none');
        }
    } catch (e) { console.error('Falha ao checar lembrete de backup', e); }
}

function esconderLembreteBackup() {
    const banner = document.getElementById('lembreteBackup');
    if (banner) banner.classList.add('d-none');
}

async function adiarLembreteBackup() {
    await salvarConfiguracao('aurora_lembrete_backup_adiado_em', String(Date.now()), false, false);
    esconderLembreteBackup();
}

async function baixarBackupCompleto() {
    const botao = document.getElementById('btnBackup');
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparando backup...';

    try {
        const blob = await gerarBackupZipBlob();
        await salvarOuCompartilharArquivo(blob, `backup-nossa-historia-${new Date().toISOString().slice(0, 10)}.zip`, 'application/zip');

        // Registra quando o último backup manual foi feito — usado pelo
        // lembrete de backup (ver verificarLembreteBackup) pra não incomodar
        // toda vez, só quando já faz tempo que ninguém baixa uma cópia.
        await salvarConfiguracao('aurora_ultimo_backup_manual', String(Date.now()), false, false);
        esconderLembreteBackup();
    } catch (err) {
        console.error('Falha ao gerar backup completo', err);
        alert('Não foi possível gerar o backup agora. Tente novamente.');
    } finally {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
    }
}

/**
 * Aplica um backup no formato NOVO (.zip) no armazenamento local deste
 * aparelho. Recebe um ArrayBuffer ou Blob do arquivo .zip.
 */
async function aplicarBackupDeZip(zipDados) {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o leitor de backup (JSZip). Verifique sua conexão.');

    const zip = await JSZip.loadAsync(zipDados);
    const manifestArquivo = zip.file('manifest.json');
    if (!manifestArquivo) throw new Error('Backup inválido: manifest.json não encontrado dentro do arquivo.');

    const manifest = JSON.parse(await manifestArquivo.async('string'));
    if (!manifest || !manifest.versao) throw new Error('Backup inválido.');

    if (manifest.dataPedido) await salvarConfiguracao('aurora_data_pedido', manifest.dataPedido);
    if (manifest.dataInicioRelacionamento) await salvarConfiguracao('aurora_primeiro_acesso', manifest.dataInicioRelacionamento);
    if (manifest.stage) await salvarConfiguracao('aurora_stage', manifest.stage);
    if (manifest.regrasContrato) await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(manifest.regrasContrato));
    if (manifest.quizRespostas) await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(manifest.quizRespostas));
    if (manifest.videoPedidoYoutube) await salvarConfiguracao('aurora_video_pedido_youtube', manifest.videoPedidoYoutube);
    if (manifest.checklistEncontros) await salvarConfiguracao('aurora_checklist_encontros', JSON.stringify(manifest.checklistEncontros));
    if (manifest.checklistItensCustomizados) await salvarConfiguracao('aurora_checklist_itens_customizados', JSON.stringify(manifest.checklistItensCustomizados));
    if (manifest.mapaLugaresExtra) await salvarConfiguracao('aurora_mapa_lugares_extra', JSON.stringify(manifest.mapaLugaresExtra));
    if (manifest.previsoesRespostasGabriel) await salvarConfiguracao('aurora_previsoes_gabriel', JSON.stringify(manifest.previsoesRespostasGabriel));
    if (manifest.previsoesRespostasAna) await salvarConfiguracao('aurora_previsoes_ana', JSON.stringify(manifest.previsoesRespostasAna));
    if (manifest.previsoesCriadoEm) await salvarConfiguracao('aurora_previsoes_criado_em', manifest.previsoesCriadoEm);
    if (manifest.previsoesAnaSenhaHash) await salvarConfiguracao('aurora_previsoes_ana_senha_hash', manifest.previsoesAnaSenhaHash);
    if (manifest.termometroLista) await salvarConfiguracao('aurora_termometro_lista', JSON.stringify(manifest.termometroLista));
    if (manifest.cartasCondicionaisLiberadas) await salvarConfiguracao('aurora_cartas_condicionais_liberadas', JSON.stringify(manifest.cartasCondicionaisLiberadas));
    if (manifest.vitrineRecados) await salvarConfiguracao('aurora_vitrine_recados', JSON.stringify(manifest.vitrineRecados));

    // O backup é a "fotografia completa": listas locais são substituídas
    // pelas do backup (não acrescentadas), para não duplicar em cada sincronização.
    try {
        const antigasFuturo = await obterMediaPorTipo('mensagem_futuro');
        for (const antiga of antigasFuturo) await db.media.delete(antiga.id);
    } catch (e) { console.error('Falha ao limpar mensagens antigas antes de restaurar', e); }

    try {
        const antigasLembrancas = await obterMediaPorTipo('lembranca');
        for (const antiga of antigasLembrancas) await db.media.delete(antiga.id);
    } catch (e) { console.error('Falha ao limpar lembranças antigas antes de restaurar', e); }

    for (const entrada of (manifest.medias || [])) {
        try {
            const registro = {
                id: entrada.id || gerarIdUnico(entrada.tipo || 'item'),
                tipo: entrada.tipo,
                subtipo: entrada.subtipo || undefined,
                criadoEm: entrada.criadoEm || Date.now()
            };

            if (entrada.arquivo) {
                const arquivoZip = zip.file(`media/${entrada.arquivo}`);
                if (!arquivoZip) { console.error(`Backup: arquivo "${entrada.arquivo}" não encontrado dentro do zip`); continue; }
                registro.blob = await arquivoZip.async('blob');
                registro.mimeType = entrada.mimeType || registro.blob.type || null;
            } else if (entrada.texto) {
                registro.texto = entrada.texto;
            } else {
                continue;
            }

            await salvarMedia(registro);
        } catch (e) { console.error(`Backup: falha ao restaurar a mídia "${entrada.id}"`, e); }
    }

    await exibirPolaroidSalva();
}

/**
 * Compatibilidade com backups do FORMATO ANTIGO (.json com mídias em
 * base64) — para quem ainda tiver um backup gerado antes desta correção.
 * Backups novos nunca mais saem nesse formato (ver gerarBackupZipBlob).
 */
async function aplicarBackupLegadoDeJson(backup) {
    if (!backup || !backup.versao) throw new Error('Backup inválido');

    if (backup.dataPedido) await salvarConfiguracao('aurora_data_pedido', backup.dataPedido);
    if (backup.dataInicioRelacionamento) await salvarConfiguracao('aurora_primeiro_acesso', backup.dataInicioRelacionamento);
    if (backup.stage) await salvarConfiguracao('aurora_stage', backup.stage);
    if (backup.regrasContrato) await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(backup.regrasContrato));
    if (backup.quizRespostas) await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(backup.quizRespostas));
    if (backup.checklistEncontros) await salvarConfiguracao('aurora_checklist_encontros', JSON.stringify(backup.checklistEncontros));
    if (backup.checklistItensCustomizados) await salvarConfiguracao('aurora_checklist_itens_customizados', JSON.stringify(backup.checklistItensCustomizados));

    if (backup.assinatura) await salvarMedia({ id: 'assinatura', tipo: 'assinatura', texto: backup.assinatura });

    if (backup.video) {
        const blobVideo = dataURLParaBlob(backup.video);
        await salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: blobVideo, mimeType: backup.videoMime || 'video/webm' });
    }

    if (backup.polaroidGerada) {
        await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: dataURLParaBlob(backup.polaroidGerada) });
    }

    if (Array.isArray(backup.mensagensFuturo)) {
        try {
            const antigas = await obterMediaPorTipo('mensagem_futuro');
            for (const antiga of antigas) await db.media.delete(antiga.id);
        } catch (e) { console.error('Falha ao limpar mensagens antigas antes de restaurar', e); }

        for (const item of backup.mensagensFuturo) {
            await salvarMedia({
                id: item.id || gerarIdUnico('futuro'),
                tipo: 'mensagem_futuro',
                subtipo: item.tipo,
                texto: item.texto || null,
                blob: item.arquivo ? dataURLParaBlob(item.arquivo) : null,
                mimeType: item.mimeType || null,
                criadoEm: item.criadoEm ? new Date(item.criadoEm).getTime() : Date.now()
            });
        }
    }

    if (Array.isArray(backup.lembrancas)) {
        try {
            const antigas = await obterMediaPorTipo('lembranca');
            for (const antiga of antigas) await db.media.delete(antiga.id);
        } catch (e) { console.error('Falha ao limpar lembranças antigas antes de restaurar', e); }

        for (const item of backup.lembrancas) {
            await salvarMedia({ id: item.id || gerarIdUnico('lembranca'), tipo: 'lembranca', blob: dataURLParaBlob(item.imagem), criadoEm: item.criadoEm || Date.now() });
        }
    }

    await exibirPolaroidSalva();
}

async function restaurarBackupDeArquivo(arquivo) {
    const statusEl = document.getElementById('restaurarStatus');
    statusEl.textContent = 'Lendo arquivo de backup...';
    statusEl.className = 'save-status pending';

    // Suprime envios à nuvem durante a restauração (cada item restaurado
    // dispararia um envio); a sincronização de verdade acontece uma vez só,
    // no próximo carregamento da página.
    __auroraAplicandoBackupRemoto = true;
    try {
        const nome = (arquivo.name || '').toLowerCase();
        if (nome.endsWith('.json')) {
            // Formato antigo, compatibilidade com backups já existentes.
            const texto = await arquivo.text();
            const backup = JSON.parse(texto);
            await aplicarBackupLegadoDeJson(backup);
        } else {
            // Formato novo (.zip), padrão atual.
            const dados = await arquivo.arrayBuffer();
            await aplicarBackupDeZip(dados);
        }
        statusEl.textContent = 'Backup restaurado com sucesso! Recarregando...';
        statusEl.className = 'save-status ok';
        setTimeout(() => location.reload(), 1200);
    } catch (err) {
        console.error('Falha ao restaurar backup', err);
        statusEl.textContent = 'Não foi possível ler esse arquivo de backup. Confira se é o arquivo .zip gerado por este site.';
        statusEl.className = 'save-status err';
    } finally {
        __auroraAplicandoBackupRemoto = false;
    }
}

function iniciarModuloExport() {
    const maisOpcoesOverlay = document.getElementById('maisOpcoesOverlay');
    document.getElementById('btnMaisOpcoes').addEventListener('click', () => { maisOpcoesOverlay.classList.remove('d-none'); maisOpcoesOverlay.scrollTop = 0; bloquearScrollFundoLembranca(); });
    document.getElementById('btnFecharMaisOpcoes').addEventListener('click', () => { maisOpcoesOverlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); });
    maisOpcoesOverlay.addEventListener('click', (evt) => { if (evt.target === maisOpcoesOverlay) { maisOpcoesOverlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); } });

    document.getElementById('btnExportarConstelacao').addEventListener('click', () => gerarConstelacao());
    document.getElementById('btnExportarCartaFisica').addEventListener('click', gerarCartaFisica);

    // O clique abre a câmera em vez de gerar a Polaroid direto.
    document.getElementById('btnExportarPolaroid').addEventListener('click', abrirCameraPolaroid);
    document.getElementById('btnFecharCameraPolaroid').addEventListener('click', fecharModalCameraPolaroid);
    document.getElementById('btnCapturarFotoPolaroid').addEventListener('click', capturarFotoPolaroid);
    document.getElementById('btnRepetirFotoPolaroid').addEventListener('click', repetirFotoPolaroid);
    document.getElementById('btnConfirmarFotoPolaroid').addEventListener('click', confirmarFotoEGerarPolaroid);
    exibirPolaroidSalva(); // mostra a polaroid já salva anteriormente (neste aparelho ou sincronizada de outro)

    document.getElementById('btnBackup').addEventListener('click', baixarBackupCompleto);
    document.getElementById('btnRestaurarBackup').addEventListener('click', () => document.getElementById('inputRestaurarBackup').click());
    document.getElementById('inputRestaurarBackup').addEventListener('change', (evt) => {
        const arquivo = evt.target.files && evt.target.files[0];
        if (arquivo) restaurarBackupDeArquivo(arquivo);
        evt.target.value = '';
    });

    document.getElementById('btnLembreteBackupAgora').addEventListener('click', baixarBackupCompleto);
    document.getElementById('btnLembreteBackupDepois').addEventListener('click', adiarLembreteBackup);
    verificarLembreteBackup();
}
