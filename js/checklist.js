/**
 * CHECKLIST.JS — "Nosso Checklist" (checklist.html)
 * Lista de programas/experiências do casal (CHECKLIST_ENCONTROS, em
 * js/config.js). Progresso salvo via obterConfiguracao/salvarConfiguracao
 * ('aurora_checklist_encontros'), sincronizado entre aparelhos.
 * Estado salvo: objeto só com os itens marcados, chave "<catIdx>_<itemIdx>".
 */

const CHECKLIST_CHAVE_CONFIG = 'aurora_checklist_encontros';

// Itens adicionados pelo casal direto na tela (fora de CHECKLIST_ENCONTROS):
// { id, catIdx, texto, criadoEm }, com "id" único e "catIdx" apontando pra
// uma categoria já existente. Usa o mesmo objeto de estado dos itens
// originais, com "id" como chave.
const CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG = 'aurora_checklist_itens_customizados';

// Estado em memória (carregado uma vez em montarChecklist), só mutado e
// persistido localmente a cada mudança, sem reler o banco — evita perder
// marcações ao tocar vários checkboxes em sequência rápida.
let __checklistEstadoAtual = null;

// Itens customizados em memória, mesmo princípio do estado acima.
let __checklistItensCustomizados = null;

function checklistTotalItens() {
    const totalOriginal = CHECKLIST_ENCONTROS.reduce((soma, cat) => soma + cat.itens.length, 0);
    return totalOriginal + (__checklistItensCustomizados ? __checklistItensCustomizados.length : 0);
}

function checklistItensCustomizadosDaCategoria(catIdx) {
    if (!__checklistItensCustomizados) return [];
    return __checklistItensCustomizados.filter(item => Number(item.catIdx) === Number(catIdx));
}

async function checklistCarregarEstadoDoBanco() {
    try {
        const bruto = await obterConfiguracao(CHECKLIST_CHAVE_CONFIG);
        const estado = bruto ? JSON.parse(bruto) : {};
        return (estado && typeof estado === 'object' && !Array.isArray(estado)) ? estado : {};
    } catch (e) {
        console.error('Falha ao ler o checklist salvo:', e);
        return {};
    }
}

async function checklistCarregarItensCustomizadosDoBanco() {
    try {
        const bruto = await obterConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        console.error('Falha ao ler os itens adicionados no checklist:', e);
        return [];
    }
}

/** Atualiza o cartão de progresso geral + o contador de cada categoria, sem redesenhar a lista inteira. */
function checklistAtualizarProgresso(estado) {
    const total = checklistTotalItens();
    const feitos = Object.keys(estado).filter(id => estado[id]).length;
    const faltam = total - feitos;
    const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;

    const textoEl = document.getElementById('checklistProgressoTexto');
    const percentualEl = document.getElementById('checklistProgressoPercentual');
    const faltamEl = document.getElementById('checklistProgressoFaltam');
    const barraEl = document.getElementById('checklistProgressoBarra');

    if (textoEl) textoEl.textContent = `${feitos} de ${total} feitos`;
    if (percentualEl) percentualEl.textContent = `${percentual}%`;
    if (barraEl) barraEl.style.width = `${percentual}%`;
    if (faltamEl) {
        faltamEl.textContent = faltam === 0
            ? 'Checklist completo. Já vivemos tudo isso juntos! 🎉'
            : `Faltam ${faltam} pra completar a lista inteira.`;
    }

    document.querySelectorAll('[data-checklist-cat-contador]').forEach(el => {
        const catIdx = el.getAttribute('data-checklist-cat-contador');
        const cat = CHECKLIST_ENCONTROS[catIdx];
        if (!cat) return;
        const customizadosDaCategoria = checklistItensCustomizadosDaCategoria(catIdx);
        const totalCategoria = cat.itens.length + customizadosDaCategoria.length;
        const feitosOriginais = cat.itens.filter((_, itemIdx) => estado[`${catIdx}_${itemIdx}`]).length;
        const feitosCustom = customizadosDaCategoria.filter(item => estado[item.id]).length;
        el.textContent = `${feitosOriginais + feitosCustom} de ${totalCategoria}`;
    });
}

// Marca/desmarca um item (original ou customizado) pelo id final.
async function checklistAlternarItem(id, marcado) {
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    if (marcado) __checklistEstadoAtual[id] = true; else delete __checklistEstadoAtual[id];
    checklistAtualizarProgresso(__checklistEstadoAtual); // atualiza a tela na hora, sem esperar o banco
    await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, JSON.stringify(__checklistEstadoAtual));
}

// Escapa o texto antes de jogar no innerHTML (itens customizados vêm de um <textarea>).
function checklistEscaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function checklistHtmlItem(id, texto, marcado, removivel) {
    const textoSeguro = checklistEscaparHtml(texto);
    return `
        <div class="checklist-item-linha">
            <label class="checklist-item${marcado ? ' checklist-item-feito' : ''}${removivel ? ' checklist-item-personalizado' : ''}" for="checklistItem_${id}">
                <input type="checkbox" id="checklistItem_${id}" data-checklist-id="${id}" ${marcado ? 'checked' : ''}>
                <span class="checklist-item-check"><i class="bi bi-check-lg"></i></span>
                <span class="checklist-item-texto">${textoSeguro}</span>
            </label>
            ${removivel ? `<button type="button" class="checklist-item-remover" data-remover-id="${id}" aria-label="Remover este item"><i class="bi bi-x-lg"></i></button>` : ''}
        </div>
    `;
}

function checklistHtmlCategoria(cat, catIdx, estado) {
    const itensOriginaisHtml = cat.itens
        .map((texto, itemIdx) => {
            const id = `${catIdx}_${itemIdx}`;
            return checklistHtmlItem(id, texto, !!estado[id], false);
        })
        .join('');

    const itensCustomHtml = checklistItensCustomizadosDaCategoria(catIdx)
        .map(item => checklistHtmlItem(item.id, item.texto, !!estado[item.id], true))
        .join('');

    return `
        <section class="checklist-categoria">
            <div class="checklist-categoria-header">
                <p class="checklist-categoria-titulo"><span class="checklist-categoria-emoji">${cat.emoji}</span>${cat.nome}</p>
                <span class="checklist-categoria-contador" data-checklist-cat-contador="${catIdx}"></span>
            </div>
            <div class="checklist-categoria-itens">${itensOriginaisHtml}${itensCustomHtml}</div>
        </section>
    `;
}

/** Liga os eventos (marcar/desmarcar, remover) da lista atual — chamada de novo a cada re-renderização. */
function checklistLigarEventosDaLista(container) {
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', async (evt) => {
            const id = evt.target.getAttribute('data-checklist-id');
            evt.target.closest('.checklist-item').classList.toggle('checklist-item-feito', evt.target.checked);
            await checklistAlternarItem(id, evt.target.checked);
        });
    });

    container.querySelectorAll('[data-remover-id]').forEach(botao => {
        botao.addEventListener('click', async (evt) => {
            evt.preventDefault();
            const id = botao.getAttribute('data-remover-id');
            await checklistRemoverItemCustomizado(id);
        });
    });
}

/** Redesenha a lista inteira a partir do estado já em memória (sem reler o banco) — usada ao montar a página e após adicionar/remover um item customizado. */
function checklistRenderizarLista() {
    const container = document.getElementById('checklistCategorias');
    if (!container) return;
    const estado = __checklistEstadoAtual || {};

    container.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => checklistHtmlCategoria(cat, catIdx, estado)).join('');
    checklistLigarEventosDaLista(container);
    checklistAtualizarProgresso(estado);
}

function checklistGerarIdCustomizado() {
    return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Adiciona um item novo numa categoria já existente (escolhida pelo casal), salva e sincroniza como qualquer config pequena. */
async function checklistAdicionarItemCustomizado(catIdx, texto) {
    const textoLimpo = (texto || '').trim();
    if (!textoLimpo) return;
    if (!__checklistItensCustomizados) __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();

    __checklistItensCustomizados.push({
        id: checklistGerarIdCustomizado(),
        catIdx: Number(catIdx),
        texto: textoLimpo,
        criadoEm: Date.now()
    });

    await salvarConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG, JSON.stringify(__checklistItensCustomizados));
    checklistRenderizarLista();
}

/** Remove um item customizado (nunca um item original da lista) e a marcação dele, se houver. */
async function checklistRemoverItemCustomizado(id) {
    if (!confirm('Remover este item da lista? Essa ação não pode ser desfeita, e também remove ele do outro aparelho na próxima sincronização.')) return;
    if (!__checklistItensCustomizados) __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();

    __checklistItensCustomizados = __checklistItensCustomizados.filter(item => item.id !== id);
    delete __checklistEstadoAtual[id];

    await salvarConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG, JSON.stringify(__checklistItensCustomizados));
    await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, JSON.stringify(__checklistEstadoAtual));
    checklistRenderizarLista();
}

/** Preenche o <select> do modal "Adicionar item" com as categorias já existentes em CHECKLIST_ENCONTROS. */
function checklistPreencherSelectDeCategorias() {
    const select = document.getElementById('checklistSelectCategoria');
    if (!select) return;
    select.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => `<option value="${catIdx}">${cat.emoji} ${cat.nome}</option>`).join('');
}

/** Liga o botão "Adicionar item", o modal (abrir/fechar/enviar) e a trava de scroll de fundo (mesmo mecanismo usado nos outros overlays do site, em js/utils.js). */
function iniciarModalAdicionarItemChecklist() {
    const overlay = document.getElementById('checklistModalOverlay');
    const btnAbrir = document.getElementById('btnChecklistAdicionarItem');
    const btnCancelar = document.getElementById('btnChecklistCancelarAdicionar');
    const form = document.getElementById('checklistFormAdicionar');
    const inputTexto = document.getElementById('checklistInputTexto');
    const selectCategoria = document.getElementById('checklistSelectCategoria');
    if (!overlay || !btnAbrir || !form) return;

    const abrir = () => {
        overlay.classList.remove('d-none');
        bloquearScrollFundoLembranca();
        setTimeout(() => { if (inputTexto) inputTexto.focus(); }, 50);
    };
    const fechar = () => {
        overlay.classList.add('d-none');
        desbloquearScrollFundoLembranca();
        form.reset();
    };

    btnAbrir.addEventListener('click', abrir);
    if (btnCancelar) btnCancelar.addEventListener('click', fechar);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fechar(); });

    form.addEventListener('submit', async (evt) => {
        evt.preventDefault();
        if (!selectCategoria || !inputTexto || !inputTexto.value.trim()) return;
        await checklistAdicionarItemCustomizado(selectCategoria.value, inputTexto.value);
        fechar();
    });
}

async function montarChecklist() {
    const container = document.getElementById('checklistCategorias');
    if (!container) return;

    const carregando = document.getElementById('checklistCarregando');
    __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();

    checklistRenderizarLista();
    checklistPreencherSelectDeCategorias();

    if (carregando) carregando.classList.add('d-none');
    container.classList.add('checklist-categorias-visivel');

    // Reforço: a página só fica "alta" (com os 132 itens) a partir daqui —
    // antes disso ela é só o cabeçalho + card de progresso + spinner. Se
    // sobrou algum scroll residual de antes desse momento (ex.: navegador
    // tentando restaurar posição, mesmo com history.scrollRestoration
    // manual, ver checklist.html), garante que a pessoa sempre vê o topo
    // (card de progresso) assim que a lista de verdade aparece.
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // BLOQUEIO_DESKTOP_ATIVO: tela de bloqueio já exibida, para tudo o mais
    }

    bloquearZoom();

    // Sincroniza com a nuvem antes de desenhar a lista.
    if (typeof sincronizarNaAbertura === 'function') {
        try { await sincronizarNaAbertura(); } catch (e) { console.error('Falha ao sincronizar o checklist com a nuvem:', e); }
    }

    await montarChecklist();
    iniciarModalAdicionarItemChecklist();
});
