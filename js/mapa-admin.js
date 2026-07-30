/**
 * ============================================================================
 * MAPA-ADMIN.JS — Painel "Adicionar local ao mapa" (usado só em diagnostico.html)
 * ============================================================================
 * Deixa adicionar novos locais no "Nosso mapa" (ver MAPA_LUGARES em
 * js/config.js e a renderização em js/romance.js) direto pelo site, sem
 * precisar editar código.
 *
 * Os locais adicionados aqui são guardados com salvarConfiguracao() (ver
 * js/db.js) na chave 'aurora_mapa_lugares_extra' — o mesmo mecanismo usado
 * pelo resto do site pra dados pequenos (data do pedido, respostas do
 * quiz, etc). Isso significa que eles entram automaticamente no backup e
 * na sincronização com a nuvem (ver mapaLugaresExtra em js/export.js), e
 * aparecem no "Nosso mapa" em qualquer aparelho que abrir o site depois,
 * sem precisar mexer em config.js nem publicar o site de novo.
 *
 * A foto continua sendo manual, de propósito (não dá pra fazer upload de
 * arquivo puro por um site estático sem backend de verdade): depois de
 * salvar o local aqui, salve o arquivo da foto em assets/img/ com o nome
 * mostrado no campo "Nome do arquivo da foto" — ele é gerado sozinho a
 * partir do nome do local, seguindo o mesmo padrão "mapa-..." já usado
 * pelos locais fixos (ver comentário de PLACEHOLDERS em js/config.js).
 * Aceita .jpg, .jpeg, .png ou .webp, igual ao resto do site (ver
 * EXTENSOES_FOTO_ACEITAS) — a foto aparece sozinha assim que existir,
 * sem precisar editar nada de novo aqui.
 * ============================================================================
 */

const CHAVE_MAPA_LUGARES_EXTRA_ADMIN = 'aurora_mapa_lugares_extra';

function mapaAdminSlugificar(nome) {
    return (nome || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '');
}

async function mapaAdminObterLista() {
    try {
        const bruto = await obterConfiguracao(CHAVE_MAPA_LUGARES_EXTRA_ADMIN);
        const lista = JSON.parse(bruto || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        console.error('Falha ao ler locais extras do mapa:', e);
        return [];
    }
}

// imediato=true: adicionar um local é um marco raro e importante (como
// data do pedido/estágio), não uma configuração cosmética — vale sincronizar
// na hora, sem esperar o agrupamento de 1,2s.
async function mapaAdminSalvarLista(lista) {
    await salvarConfiguracao(CHAVE_MAPA_LUGARES_EXTRA_ADMIN, JSON.stringify(lista), true);
}

// Evita dois locais com o mesmo nome de arquivo (ex.: dois lugares
// chamados "Praça"): acrescenta um número no final até achar um nome livre.
function mapaAdminGerarFotoBaseUnico(nome, listaAtual, idIgnorar) {
    const base = 'mapa-' + (mapaAdminSlugificar(nome) || 'local');
    let candidato = base;
    let contador = 2;
    while (listaAtual.some(l => l.fotoBase === candidato && l.id !== idIgnorar)) {
        candidato = `${base}-${contador}`;
        contador++;
    }
    return candidato;
}

let mapaAdminEditandoId = null;

async function mapaAdminAtualizarPreviaFotoBase() {
    const nomeInput = document.getElementById('mapaAdminNome');
    const fotoBaseInput = document.getElementById('mapaAdminFotoBase');
    if (!nomeInput || !fotoBaseInput) return;
    const lista = await mapaAdminObterLista();
    fotoBaseInput.value = mapaAdminGerarFotoBaseUnico(nomeInput.value, lista, mapaAdminEditandoId);
}

function mapaAdminAtualizarIconePreview() {
    const input = document.getElementById('mapaAdminIcone');
    const preview = document.getElementById('mapaAdminIconePreview');
    if (!input || !preview) return;
    const classe = (input.value || 'bi-geo-alt-fill').trim();
    preview.className = 'bi ' + classe;
}

async function mapaAdminRenderizarLista() {
    const container = document.getElementById('mapaAdminLista');
    if (!container) return;
    const lista = await mapaAdminObterLista();

    if (!lista.length) {
        container.innerHTML = '<p class="small text-white-50 text-center mb-0">Nenhum local adicionado por aqui ainda.</p>';
        return;
    }

    container.innerHTML = '';
    lista.forEach(lugar => {
        const item = document.createElement('div');
        item.className = 'diag-item diag-neutro';
        item.innerHTML = `
            <i class="bi ${lugar.icon || 'bi-geo-alt-fill'}"></i>
            <div class="flex-grow-1">
                <strong>${lugar.nome}</strong>
                <p class="mb-1">${lugar.cidade || ''}${lugar.texto ? ' — ' + lugar.texto : ''}</p>
                <p class="mb-0">Foto: <code>assets/img/${lugar.fotoBase}.jpg</code> (ou .jpeg/.png/.webp)</p>
            </div>
            <div class="d-flex flex-column gap-1">
                <button type="button" class="btn btn-outline-light btn-sm rounded-pill" data-editar="${lugar.id}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" data-excluir="${lugar.id}"><i class="bi bi-trash"></i></button>
            </div>`;
        container.appendChild(item);
    });

    container.querySelectorAll('[data-editar]').forEach(btn => {
        btn.addEventListener('click', () => mapaAdminCarregarParaEdicao(btn.dataset.editar));
    });
    container.querySelectorAll('[data-excluir]').forEach(btn => {
        btn.addEventListener('click', () => mapaAdminExcluir(btn.dataset.excluir));
    });
}

async function mapaAdminCarregarParaEdicao(id) {
    const lista = await mapaAdminObterLista();
    const lugar = lista.find(l => l.id === id);
    if (!lugar) return;

    mapaAdminEditandoId = id;
    document.getElementById('mapaAdminNome').value = lugar.nome || '';
    document.getElementById('mapaAdminCidade').value = lugar.cidade || '';
    document.getElementById('mapaAdminTexto').value = lugar.texto || '';
    document.getElementById('mapaAdminIcone').value = lugar.icon || 'bi-geo-alt-fill';
    document.getElementById('mapaAdminFotoBase').value = lugar.fotoBase || '';
    mapaAdminAtualizarIconePreview();

    document.getElementById('btnMapaAdminSalvar').innerHTML = '<i class="bi bi-check-circle me-1"></i>Salvar edição';
    document.getElementById('btnMapaAdminCancelar').classList.remove('d-none');

    document.getElementById('mapaAdminNome').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mapaAdminCancelarEdicao() {
    mapaAdminEditandoId = null;
    document.getElementById('mapaAdminNome').value = '';
    document.getElementById('mapaAdminCidade').value = '';
    document.getElementById('mapaAdminTexto').value = '';
    document.getElementById('mapaAdminIcone').value = 'bi-geo-alt-fill';
    document.getElementById('mapaAdminFotoBase').value = '';
    mapaAdminAtualizarIconePreview();
    document.getElementById('btnMapaAdminSalvar').innerHTML = '<i class="bi bi-plus-circle me-1"></i>Adicionar local';
    document.getElementById('btnMapaAdminCancelar').classList.add('d-none');
}

async function mapaAdminExcluir(id) {
    if (!confirm('Excluir este local? Ele também some do mapa em qualquer outro aparelho na próxima sincronização.')) return;
    const lista = await mapaAdminObterLista();
    const novaLista = lista.filter(l => l.id !== id);
    await mapaAdminSalvarLista(novaLista);
    if (mapaAdminEditandoId === id) mapaAdminCancelarEdicao();
    await mapaAdminRenderizarLista();
}

async function mapaAdminSalvar() {
    const nomeInput = document.getElementById('mapaAdminNome');
    const cidadeInput = document.getElementById('mapaAdminCidade');
    const textoInput = document.getElementById('mapaAdminTexto');
    const iconeInput = document.getElementById('mapaAdminIcone');
    const fotoBaseInput = document.getElementById('mapaAdminFotoBase');
    const status = document.getElementById('mapaAdminStatus');

    const nome = nomeInput.value.trim();
    if (!nome) {
        status.textContent = 'Digite um nome pro local.';
        status.classList.remove('ok');
        status.classList.add('err');
        return;
    }

    const lista = await mapaAdminObterLista();
    const fotoBase = fotoBaseInput.value.trim() || mapaAdminGerarFotoBaseUnico(nome, lista, mapaAdminEditandoId);

    const lugar = {
        id: mapaAdminEditandoId || gerarIdUnico('mapa_extra'),
        nome,
        cidade: cidadeInput.value.trim(),
        texto: textoInput.value.trim(),
        icon: iconeInput.value.trim() || 'bi-geo-alt-fill',
        fotoBase
    };

    const novaLista = mapaAdminEditandoId
        ? lista.map(l => (l.id === mapaAdminEditandoId ? lugar : l))
        : lista.concat([lugar]);

    await mapaAdminSalvarLista(novaLista);

    status.classList.remove('err');
    status.classList.add('ok');
    status.textContent = `Local salvo! Agora salve a foto em assets/img/${fotoBase}.jpg (ou .jpeg/.png/.webp).`;

    mapaAdminCancelarEdicao();
    await mapaAdminRenderizarLista();
}

function iniciarPainelMapaAdmin() {
    const nomeInput = document.getElementById('mapaAdminNome');
    const iconeInput = document.getElementById('mapaAdminIcone');
    const botaoSalvar = document.getElementById('btnMapaAdminSalvar');
    const botaoCancelar = document.getElementById('btnMapaAdminCancelar');
    if (!nomeInput || !botaoSalvar) return;

    nomeInput.addEventListener('input', mapaAdminAtualizarPreviaFotoBase);
    iconeInput.addEventListener('input', mapaAdminAtualizarIconePreview);
    botaoSalvar.addEventListener('click', mapaAdminSalvar);
    botaoCancelar.addEventListener('click', mapaAdminCancelarEdicao);

    mapaAdminAtualizarIconePreview();
    mapaAdminRenderizarLista();
}

document.addEventListener('DOMContentLoaded', iniciarPainelMapaAdmin);
