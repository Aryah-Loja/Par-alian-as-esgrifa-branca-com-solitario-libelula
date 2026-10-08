/** Textos de mesversário: cada carta tem uma chave própria, incluída no backup. */
const MESVERSARIO_PREFIXO = 'aurora_mesversario_item:';
const MESVERSARIO_RASCUNHO = 'aurora_mesversario_rascunho';
let mesversarioEditando = null;
let mesversarioOcupado = false;
let mesversarioRender = 0;

function validarTextoMesversario(item) {
    if (!Number.isInteger(item.mes) || item.mes < 1 || item.mes > 1200) throw new Error('Informe um mês de namoro entre 1 e 1.200.');
    if (typeof item.texto !== 'string' || !item.texto.trim() || item.texto.length > 20000) throw new Error('Escreva seu texto, com até 20.000 caracteres.');
    if (typeof item.titulo !== 'string' || item.titulo.length > 120) throw new Error('O título pode ter até 120 caracteres.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.data) || !Number.isFinite(Date.parse(`${item.data}T12:00:00`)) || new Date(`${item.data}T12:00:00`).getDate() !== Number(item.data.slice(-2))) throw new Error('Escolha uma data válida.');
    return { ...item, titulo: item.titulo.trim(), texto: item.texto.trim() };
}

async function obterTextosMesversario() {
    const chaves = new Set((await db.configuracoes.where('chave').startsWith(MESVERSARIO_PREFIXO).toArray()).map(x => x.chave));
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave?.startsWith(MESVERSARIO_PREFIXO)) chaves.add(chave);
        }
    } catch (_) { /* o banco continua disponível */ }
    const itens = [];
    for (const chave of chaves) {
        const item = JSON.parse(await obterConfiguracao(chave));
        if (!item || chave !== MESVERSARIO_PREFIXO + item.id || typeof item.texto !== 'string') throw new Error('Uma carta não pôde ser lida. Seus textos foram preservados; tente novamente.');
        if (!item.excluidoEm) itens.push(item);
    }
    return itens.sort((a, b) => b.mes - a.mes || b.criadoEm - a.criadoEm);
}

async function guardarTextoMesversario(dados, anterior = null) {
    const item = validarTextoMesversario(dados);
    const agora = Math.max(Date.now(), Number(anterior?.atualizadoEm || 0) + 1);
    const registro = { ...item, id: anterior?.id || gerarIdUnico('mesversario'), criadoEm: anterior?.criadoEm || agora, atualizadoEm: agora };
    if (!await salvarConfiguracao(MESVERSARIO_PREFIXO + registro.id, JSON.stringify(registro), true)) throw new Error('Não foi possível guardar o texto neste aparelho. Seu texto continua no formulário.');
    return registro;
}

function mesversarioStatus(texto, erro = false) {
    const el = document.getElementById('mesversarioStatus');
    if (el) { el.textContent = texto; el.className = `save-status mt-2 ${erro ? 'err' : 'ok'}`; }
}

async function renderizarMesversarios() {
    const lista = document.getElementById('mesversarioLista');
    if (!lista) return;
    const render = ++mesversarioRender;
    try {
        const itens = await obterTextosMesversario();
        if (render !== mesversarioRender) return;
        lista.replaceChildren();
        document.getElementById('mesversarioVazio').classList.toggle('d-none', itens.length > 0);
        for (const item of itens) {
            const card = document.createElement('article'); card.className = 'mesversario-carta';
            const topo = document.createElement('div'); topo.className = 'mesversario-carta-topo';
            const mes = document.createElement('span'); mes.className = 'mesversario-mes'; mes.textContent = `${item.mes} ${item.mes === 1 ? 'mês' : 'meses'} de nós`;
            const data = document.createElement('time'); data.dateTime = item.data; data.textContent = new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR'); topo.append(mes, data);
            const titulo = document.createElement('h3'); titulo.textContent = item.titulo || 'Mais um capítulo nosso';
            const texto = document.createElement('p'); texto.className = 'mesversario-texto'; texto.textContent = item.texto;
            const acoes = document.createElement('div'); acoes.className = 'mesversario-acoes';
            const editar = document.createElement('button'); editar.type = 'button'; editar.textContent = 'Editar texto'; editar.addEventListener('click', () => abrirMesversario(item));
            const excluir = document.createElement('button'); excluir.type = 'button'; excluir.textContent = 'Excluir'; excluir.setAttribute('aria-label', `Excluir texto de ${item.mes} meses`);
            excluir.addEventListener('click', async () => {
                if (mesversarioOcupado || !confirm('Excluir este texto dos aparelhos na próxima sincronização?')) return;
                mesversarioOcupado = true; excluir.disabled = true;
                try {
                    const atual = JSON.parse(await obterConfiguracao(MESVERSARIO_PREFIXO + item.id));
                    const agora = Math.max(Date.now(), Number(atual.atualizadoEm || 0) + 1);
                    if (!await salvarConfiguracao(MESVERSARIO_PREFIXO + item.id, JSON.stringify({ ...atual, excluidoEm: agora, atualizadoEm: agora }), true)) throw new Error('Não foi possível excluir agora.');
                    if (mesversarioEditando?.id === item.id) fecharMesversario(true);
                    await renderizarMesversarios(); mesversarioStatus('Texto excluído neste aparelho; a sincronização foi solicitada.');
                } catch (e) { mesversarioStatus(e.message, true); }
                finally { mesversarioOcupado = false; excluir.disabled = false; }
            });
            acoes.append(editar, excluir); card.append(topo, titulo, texto, acoes); lista.append(card);
        }
    } catch (e) { mesversarioStatus(e.message, true); }
}

function mesversarioDadosFormulario() {
    return { mes: Number(document.getElementById('mesversarioMes').value), data: document.getElementById('mesversarioData').value, titulo: document.getElementById('mesversarioTitulo').value, texto: document.getElementById('mesversarioTexto').value };
}
function guardarRascunhoMesversario() {
    try { localStorage.setItem(MESVERSARIO_RASCUNHO, JSON.stringify({ ...mesversarioDadosFormulario(), anterior: mesversarioEditando })); }
    catch (_) { mesversarioStatus('O rascunho não pôde ser guardado. Mantenha a página aberta até salvar.', true); }
}
function abrirMesversario(item = null) {
    if (mesversarioOcupado) return;
    let rascunho = null;
    try { rascunho = JSON.parse(localStorage.getItem(MESVERSARIO_RASCUNHO) || 'null'); } catch (_) { /* ignora rascunho inválido */ }
    if (item && rascunho?.texto && rascunho.anterior?.id !== item.id && !confirm('Há um rascunho de outra carta. Deseja substituí-lo para editar este texto?')) return;
    if (item && rascunho?.anterior?.id === item.id) item = { ...item, ...rascunho, id: item.id };
    const base = new Date(`${String(DATA_PEDIDO_OFICIAL).slice(0, 10)}T12:00:00`);
    const hoje = new Date();
    const meses = Math.max(1, (hoje.getFullYear() - base.getFullYear()) * 12 + hoje.getMonth() - base.getMonth() - (hoje.getDate() < base.getDate() ? 1 : 0));
    const valores = item || rascunho || { mes: meses, data: `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`, titulo: '', texto: '' };
    mesversarioEditando = item || rascunho?.anterior || null;
    for (const [key, id] of Object.entries({ mes: 'mesversarioMes', data: 'mesversarioData', titulo: 'mesversarioTitulo', texto: 'mesversarioTexto' })) document.getElementById(id).value = valores[key] ?? '';
    document.getElementById('mesversarioFormulario').classList.remove('d-none');
    document.getElementById('btnNovoMesversario').setAttribute('aria-expanded', 'true');
    document.getElementById('mesversarioFormTitulo').textContent = mesversarioEditando ? 'Revisar sua carta' : 'Uma carta para este mês';
    mesversarioStatus(rascunho && !item ? 'Seu rascunho foi recuperado.' : '');
    document.getElementById('mesversarioTexto').focus();
}
function fecharMesversario(limpar = false) {
    if (!limpar) guardarRascunhoMesversario();
    else {
        try { localStorage.removeItem(MESVERSARIO_RASCUNHO); } catch (_) { /* opcional */ }
        document.getElementById('mesversarioFormulario').reset();
    }
    document.getElementById('mesversarioFormulario').classList.add('d-none');
    document.getElementById('btnNovoMesversario').setAttribute('aria-expanded', 'false');
    mesversarioEditando = null;
    document.getElementById('btnNovoMesversario').focus();
}
function iniciarMesversarios() {
    const abrir = document.getElementById('btnNovoMesversario');
    if (!abrir || abrir.dataset.iniciado) return;
    abrir.dataset.iniciado = '1';
    abrir.addEventListener('click', () => abrirMesversario());
    document.getElementById('btnFecharMesversario').addEventListener('click', () => { if (!mesversarioOcupado) fecharMesversario(); });
    const form = document.getElementById('mesversarioFormulario');
    form.addEventListener('input', guardarRascunhoMesversario);
    form.addEventListener('submit', async evt => {
        evt.preventDefault(); if (mesversarioOcupado) return;
        mesversarioOcupado = true;
        const dados = mesversarioDadosFormulario();
        form.querySelectorAll('input, textarea').forEach(el => { el.disabled = true; });
        const botao = document.getElementById('btnSalvarMesversario'); botao.disabled = true;
        document.getElementById('btnFecharMesversario').disabled = true;
        try {
            await guardarTextoMesversario(dados, mesversarioEditando);
            fecharMesversario(true);
            mesversarioStatus('Carta guardada neste aparelho. A sincronização com a nuvem foi solicitada.');
            await renderizarMesversarios();
        } catch (e) { guardarRascunhoMesversario(); mesversarioStatus(e.message, true); }
        finally { mesversarioOcupado = false; botao.disabled = false; document.getElementById('btnFecharMesversario').disabled = false; form.querySelectorAll('input, textarea').forEach(el => { el.disabled = false; }); }
    });
    renderizarMesversarios();
    window.addEventListener('poloni:nuvem-atualizada', renderizarMesversarios);
    window.addEventListener('storage', evt => { if (evt.key?.startsWith(MESVERSARIO_PREFIXO)) renderizarMesversarios(); });
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', iniciarMesversarios);
if (typeof module !== 'undefined' && module.exports) module.exports = { validarTextoMesversario, guardarTextoMesversario, obterTextosMesversario };
