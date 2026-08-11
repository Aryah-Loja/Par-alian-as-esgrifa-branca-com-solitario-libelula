/**
 * PRIMEIRAS-VEZES.JS — registros criados pelo casal, com foto opcional.
 * Textos ficam em configuração e fotos na tabela de mídia; ambos entram
 * no backup usado pela sincronização Supabase.
 */

const CHAVE_PRIMEIRAS_VEZES = 'aurora_primeiras_vezes';
let primeirasVezesUrlsTemporarias = [];

async function obterPrimeirasVezes() {
    try {
        const bruto = await obterConfiguracao(CHAVE_PRIMEIRAS_VEZES);
        const lista = JSON.parse(bruto || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        console.error('Falha ao ler Nossas primeiras vezes:', e);
        return [];
    }
}

async function renderizarPrimeirasVezes() {
    const listaEl = document.getElementById('primeirasVezesLista');
    const vazioEl = document.getElementById('primeirasVezesVazio');
    if (!listaEl || !vazioEl) return;

    primeirasVezesUrlsTemporarias.forEach(url => URL.revokeObjectURL(url));
    primeirasVezesUrlsTemporarias = [];
    listaEl.innerHTML = '';

    const registros = (await obterPrimeirasVezes()).sort((a, b) => {
        const dataA = new Date(a.data || a.criadoEm || 0).getTime();
        const dataB = new Date(b.data || b.criadoEm || 0).getTime();
        return dataB - dataA;
    });
    vazioEl.classList.toggle('d-none', registros.length > 0);

    for (const registro of registros) {
        const card = document.createElement('article');
        card.className = 'primeira-vez-card';

        if (registro.mediaId) {
            const media = await obterMedia(registro.mediaId);
            if (media && media.blob) {
                const url = URL.createObjectURL(media.blob);
                primeirasVezesUrlsTemporarias.push(url);
                const img = document.createElement('img');
                img.className = 'primeira-vez-foto';
                img.src = url;
                img.alt = registro.titulo || 'Uma das nossas primeiras vezes';
                card.appendChild(img);
            }
        }

        const conteudo = document.createElement('div');
        conteudo.className = 'primeira-vez-conteudo';
        const topo = document.createElement('div');
        topo.className = 'primeira-vez-topo';
        const data = document.createElement('span');
        data.className = 'primeira-vez-data';
        data.textContent = formatarDataPrimeiraVez(registro.data);
        const excluir = document.createElement('button');
        excluir.type = 'button';
        excluir.className = 'primeira-vez-excluir';
        excluir.setAttribute('aria-label', 'Excluir esta primeira vez');
        excluir.innerHTML = '<i class="bi bi-trash3"></i>';
        excluir.addEventListener('click', () => excluirPrimeiraVez(registro.id));
        topo.append(data, excluir);

        const titulo = document.createElement('h3');
        titulo.className = 'primeira-vez-titulo';
        titulo.textContent = registro.titulo || 'Uma primeira vez nossa';
        conteudo.append(topo, titulo);

        if (registro.local) {
            const local = document.createElement('p');
            local.className = 'primeira-vez-local';
            local.innerHTML = '<i class="bi bi-geo-alt-fill"></i> ';
            local.appendChild(document.createTextNode(registro.local));
            conteudo.appendChild(local);
        }
        if (registro.texto) {
            const texto = document.createElement('p');
            texto.className = 'primeira-vez-texto';
            texto.textContent = registro.texto;
            conteudo.appendChild(texto);
        }

        card.appendChild(conteudo);
        listaEl.appendChild(card);
    }
}

function formatarDataPrimeiraVez(valor) {
    if (!valor) return 'Data não informada';
    const partes = String(valor).split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return valor;
    return new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function abrirPrimeirasVezesFormulario() {
    const overlay = document.getElementById('primeirasVezesOverlay');
    if (!overlay) return;
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();
    document.getElementById('primeirasVezesTituloInput')?.focus();
}

function fecharPrimeirasVezesFormulario() {
    const overlay = document.getElementById('primeirasVezesOverlay');
    if (!overlay) return;
    overlay.classList.add('d-none');
    desbloquearScrollFundoLembranca();
    forcarRecalculoDeLayout();
}

async function salvarPrimeiraVez() {
    const tituloEl = document.getElementById('primeirasVezesTituloInput');
    const dataEl = document.getElementById('primeirasVezesDataInput');
    const localEl = document.getElementById('primeirasVezesLocalInput');
    const textoEl = document.getElementById('primeirasVezesTextoInput');
    const fotoEl = document.getElementById('primeirasVezesFotoInput');
    const status = document.getElementById('primeirasVezesStatus');
    const botao = document.getElementById('btnSalvarPrimeiraVez');
    const titulo = tituloEl.value.trim();

    if (!titulo) {
        status.textContent = 'Conte qual foi essa primeira vez.';
        status.className = 'save-status err mt-2';
        return;
    }

    botao.disabled = true;
    status.textContent = 'Guardando essa lembrança...';
    status.className = 'save-status pending mt-2';

    try {
        const id = gerarIdUnico('primeira_vez');
        const arquivo = fotoEl.files && fotoEl.files[0];
        let mediaId = null;
        if (arquivo) {
            const comprimida = await comprimirImagem(arquivo);
            mediaId = `${id}_foto`;
            const salvou = await salvarMedia({ id: mediaId, tipo: 'primeira_vez_foto', blob: comprimida.blob, mimeType: comprimida.mimeType });
            if (!salvou) throw new Error('A foto não pôde ser confirmada no armazenamento.');
        }

        const registros = await obterPrimeirasVezes();
        registros.push({
            id,
            titulo,
            data: dataEl.value || '',
            local: localEl.value.trim(),
            texto: textoEl.value.trim(),
            mediaId,
            criadoEm: Date.now()
        });
        await salvarConfiguracao(CHAVE_PRIMEIRAS_VEZES, JSON.stringify(registros), true);

        tituloEl.value = '';
        dataEl.value = '';
        localEl.value = '';
        textoEl.value = '';
        fotoEl.value = '';
        status.textContent = 'Primeira vez guardada e enviada para sincronização.';
        status.className = 'save-status ok mt-2';
        await renderizarPrimeirasVezes();
        setTimeout(fecharPrimeirasVezesFormulario, 900);
    } catch (e) {
        console.error('Falha ao salvar primeira vez:', e);
        status.textContent = e.message || 'Não foi possível salvar agora.';
        status.className = 'save-status err mt-2';
    } finally {
        botao.disabled = false;
    }
}

async function excluirPrimeiraVez(id) {
    if (!confirm('Excluir esta lembrança e a foto dela em todos os aparelhos na próxima sincronização?')) return;
    const registros = await obterPrimeirasVezes();
    const removido = registros.find(item => item.id === id);
    await salvarConfiguracao(CHAVE_PRIMEIRAS_VEZES, JSON.stringify(registros.filter(item => item.id !== id)), true);
    if (removido && removido.mediaId) await excluirMedia(removido.mediaId);
    await renderizarPrimeirasVezes();
}

function iniciarPrimeirasVezes() {
    const abrir = document.getElementById('btnAdicionarPrimeiraVez');
    const fechar = document.getElementById('btnFecharPrimeirasVezes');
    const salvar = document.getElementById('btnSalvarPrimeiraVez');
    const overlay = document.getElementById('primeirasVezesOverlay');
    if (!abrir || abrir.dataset.iniciado) return;
    abrir.dataset.iniciado = '1';
    abrir.addEventListener('click', abrirPrimeirasVezesFormulario);
    fechar?.addEventListener('click', fecharPrimeirasVezesFormulario);
    salvar?.addEventListener('click', salvarPrimeiraVez);
    overlay?.addEventListener('click', evt => { if (evt.target === overlay) fecharPrimeirasVezesFormulario(); });
    renderizarPrimeirasVezes();
}

document.addEventListener('DOMContentLoaded', iniciarPrimeirasVezes);
