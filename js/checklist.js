/**
 * ============================================================================
 * CHECKLIST.JS — "Nosso Checklist" (checklist.html)
 * ============================================================================
 * Lista de programas/experiências do casal (CHECKLIST_ENCONTROS, em
 * js/config.js), cada item marcável. O progresso é salvo via
 * obterConfiguracao/salvarConfiguracao ('aurora_checklist_encontros') —
 * a mesma camada usada pelo resto do site — e entra automaticamente no
 * backup/sincronização entre aparelhos (ver a inclusão desse campo em
 * gerarBackupZipBlob/aplicarBackupDeZip, em js/export.js).
 *
 * FORMATO DO ESTADO SALVO: objeto só com os itens MARCADOS, ex.:
 *   { "0_3": true, "2_1": true }
 * onde a chave é "<índice da categoria>_<índice do item>" dentro de
 * CHECKLIST_ENCONTROS. Item desmarcado simplesmente não aparece no objeto
 * (evita salvar uma porção de "false" à toa). Por ser baseado em POSIÇÃO,
 * reordenar ou remover itens de CHECKLIST_ENCONTROS no meio da lista faz
 * o progresso salvo "escorregar" para os itens vizinhos — para adicionar
 * itens novos no futuro, o mais seguro é sempre ACRESCENTAR no final de
 * uma categoria (ou no final da lista, como categoria nova).
 * ============================================================================
 */

const CHECKLIST_CHAVE_CONFIG = 'aurora_checklist_encontros';

// Itens que o próprio casal adiciona direto pela tela (não fazem parte da
// lista original CHECKLIST_ENCONTROS, em js/config.js). Cada item é
// { id, catIdx, texto, criadoEm }: "id" é uma string única gerada na hora
// (nunca baseada em posição, por isso pode ser removido sem bagunçar os
// vizinhos), "catIdx" é o índice de uma categoria JÁ EXISTENTE em
// CHECKLIST_ENCONTROS (o casal escolhe entre as categorias já criadas,
// não cria categoria nova). Marcado/desmarcado usa o MESMO objeto de
// estado dos itens originais (CHECKLIST_CHAVE_CONFIG), só que com o "id"
// do item customizado como chave, em vez de "<catIdx>_<itemIdx>".
// Entra no backup/sincronização entre aparelhos como qualquer config
// pequena (ver a inclusão desse campo em gerarBackupZipBlob/
// aplicarBackupDeZip, em js/export.js) — assim, um item adicionado num
// aparelho aparece no outro na próxima sincronização, igual ao progresso.
const CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG = 'aurora_checklist_itens_customizados';

// Estado em memória, carregado uma vez em montarChecklist() e usado como
// fonte única da verdade daqui pra frente. CORREÇÃO (condição de corrida):
// a versão anterior relia obterConfiguracao() -> mutava -> salvava a cada
// clique; marcar vários itens em sequência rápida (comum ao tocar vários
// checkboxes um atrás do outro) fazia dois toggles lerem o MESMO estado
// antigo antes de qualquer um salvar, e o segundo salvamento sobrescrevia
// o primeiro, perdendo a marcação. Mantendo o objeto em memória e só
// persistindo (sem reler) a cada mudança, isso não pode mais acontecer.
let __checklistEstadoAtual = null;

// Lista em memória dos itens customizados, mesmo princípio do estado acima:
// carregada uma vez em montarChecklist() e só mutada/persistida daqui pra
// frente (evita a mesma condição de corrida ao adicionar/remover rápido).
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

// Recebe direto o "id" final (já pronto, "<catIdx>_<itemIdx>" pra item
// original ou o id gerado pra item customizado) — trata os dois tipos de
// item da mesma forma, já que o estado salvo é só um mapa id -> true.
async function checklistAlternarItem(id, marcado) {
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    if (marcado) __checklistEstadoAtual[id] = true; else delete __checklistEstadoAtual[id];
    checklistAtualizarProgresso(__checklistEstadoAtual); // atualiza a tela na hora, sem esperar o banco
    await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, JSON.stringify(__checklistEstadoAtual));
}

// Escapa o texto antes de jogar no innerHTML — importante aqui porque o
// texto de um item customizado vem de um <textarea> digitado na hora (os
// itens originais de CHECKLIST_ENCONTROS já são texto de confiança, escrito
// direto no código, mas passar todo mundo pela mesma função é mais simples
// e não muda nada visualmente pros itens originais).
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
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // BLOQUEIO_DESKTOP_ATIVO: tela de bloqueio já exibida, para tudo o mais
    }

    bloquearZoom();

    // Puxa qualquer marcação feita no outro aparelho antes de desenhar a
    // lista (mesmo mecanismo de main.js) — assim, quem abre o checklist
    // direto (sem passar pela página principal antes) também vê o
    // progresso mais recente.
    if (typeof sincronizarNaAbertura === 'function') {
        try { await sincronizarNaAbertura(); } catch (e) { console.error('Falha ao sincronizar o checklist com a nuvem:', e); }
    }

    await montarChecklist();
    iniciarModalAdicionarItemChecklist();
});
