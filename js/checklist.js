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

// Estado em memória, carregado uma vez em montarChecklist() e usado como
// fonte única da verdade daqui pra frente. CORREÇÃO (condição de corrida):
// a versão anterior relia obterConfiguracao() -> mutava -> salvava a cada
// clique; marcar vários itens em sequência rápida (comum ao tocar vários
// checkboxes um atrás do outro) fazia dois toggles lerem o MESMO estado
// antigo antes de qualquer um salvar, e o segundo salvamento sobrescrevia
// o primeiro, perdendo a marcação. Mantendo o objeto em memória e só
// persistindo (sem reler) a cada mudança, isso não pode mais acontecer.
let __checklistEstadoAtual = null;

function checklistTotalItens() {
    return CHECKLIST_ENCONTROS.reduce((soma, cat) => soma + cat.itens.length, 0);
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
        const feitosCategoria = cat.itens.filter((_, itemIdx) => estado[`${catIdx}_${itemIdx}`]).length;
        el.textContent = `${feitosCategoria} de ${cat.itens.length}`;
    });
}

async function checklistAlternarItem(catIdx, itemIdx, marcado) {
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    const id = `${catIdx}_${itemIdx}`;
    if (marcado) __checklistEstadoAtual[id] = true; else delete __checklistEstadoAtual[id];
    checklistAtualizarProgresso(__checklistEstadoAtual); // atualiza a tela na hora, sem esperar o banco
    await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, JSON.stringify(__checklistEstadoAtual));
}

function checklistHtmlItem(catIdx, itemIdx, texto, marcado) {
    const id = `${catIdx}_${itemIdx}`;
    return `
        <label class="checklist-item${marcado ? ' checklist-item-feito' : ''}" for="checklistItem_${id}">
            <input type="checkbox" id="checklistItem_${id}" data-cat="${catIdx}" data-item="${itemIdx}" ${marcado ? 'checked' : ''}>
            <span class="checklist-item-check"><i class="bi bi-check-lg"></i></span>
            <span class="checklist-item-texto">${texto}</span>
        </label>
    `;
}

function checklistHtmlCategoria(cat, catIdx, estado) {
    const itensHtml = cat.itens.map((texto, itemIdx) => checklistHtmlItem(catIdx, itemIdx, texto, !!estado[`${catIdx}_${itemIdx}`])).join('');
    return `
        <section class="checklist-categoria">
            <div class="checklist-categoria-header">
                <p class="checklist-categoria-titulo"><span class="checklist-categoria-emoji">${cat.emoji}</span>${cat.nome}</p>
                <span class="checklist-categoria-contador" data-checklist-cat-contador="${catIdx}"></span>
            </div>
            <div class="checklist-categoria-itens">${itensHtml}</div>
        </section>
    `;
}

async function montarChecklist() {
    const container = document.getElementById('checklistCategorias');
    if (!container) return;

    const carregando = document.getElementById('checklistCarregando');
    __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    const estado = __checklistEstadoAtual;

    container.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => checklistHtmlCategoria(cat, catIdx, estado)).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', async (evt) => {
            const catIdx = evt.target.getAttribute('data-cat');
            const itemIdx = evt.target.getAttribute('data-item');
            evt.target.closest('.checklist-item').classList.toggle('checklist-item-feito', evt.target.checked);
            await checklistAlternarItem(catIdx, itemIdx, evt.target.checked);
        });
    });

    checklistAtualizarProgresso(estado);
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
});
