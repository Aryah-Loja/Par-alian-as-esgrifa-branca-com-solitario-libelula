'use strict';
const { extrairConstante } = require('./verificar-backup-remoto.js');

async function consultarComRetentativas(url, opcoes, validar, fetchFn = fetch, esperar = ms => new Promise(r => setTimeout(r, ms))) {
    let ultimoErro;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
        try {
            const resposta = await fetchFn(url, { ...opcoes, cache: 'no-store', signal: AbortSignal.timeout(20000) });
            if (!resposta.ok) {
                const detalhe = await resposta.json().catch(() => ({}));
                const erro = new Error(`Consulta recusada (HTTP ${resposta.status}). Verifique se o projeto está ativo e se a migração SQL foi aplicada.`);
                erro.status = resposta.status; erro.codigo = detalhe.code;
                throw erro;
            }
            const dados = await resposta.json();
            validar(dados);
            return dados;
        } catch (erro) {
            ultimoErro = erro;
            if (tentativa < 2) await esperar(1000 * (tentativa + 1));
        }
    }
    throw ultimoErro;
}

async function verificarAtividade({ fetchFn = fetch, esperar, permitirRpcPendente = false } = {}) {
    const url = extrairConstante('js/sync.js', 'SUPABASE_URL');
    const chave = extrairConstante('js/sync.js', 'SUPABASE_ANON_KEY');
    const bucket = extrairConstante('js/sync.js', 'SUPABASE_BUCKET');
    const codigo = extrairConstante('js/config.js', 'EXPERIENCE_ID');
    let bancoConsultado = false;
    try {
    await consultarComRetentativas(`${url}/rest/v1/rpc/poloni_verificar_atividade`, {
        method: 'POST', headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' }, body: '{}'
    }, dados => { if (dados !== true) throw new Error('O banco não confirmou a consulta de atividade.'); }, fetchFn, esperar);
    bancoConsultado = true;
    } catch (erro) {
        // A consulta anterior ao Storage permanece durante a ativação da RPC.
        // Outros erros (rede, permissão, pausa, dados incorretos) continuam fatais.
        if (!permitirRpcPendente || erro.status !== 404 || erro.codigo !== 'PGRST202') throw erro;
    }
    const meta = await consultarComRetentativas(`${url}/storage/v1/object/public/${bucket}/${codigo}-meta.json?atividade=${Date.now()}`, {}, dados => {
        if (!Number.isInteger(Number(dados?.revisao)) || Number(dados.revisao) < 1 || !dados.geracaoAtual?.id) throw new Error('Metadados do backup inválidos. Verifique o último backup independente.');
    }, fetchFn, esperar);
    return { ok: true, bancoConsultado, ativacaoSqlPendente: !bancoConsultado, revisao: Number(meta.revisao), verificadoEm: new Date().toISOString() };
}
if (require.main === module) verificarAtividade({ permitirRpcPendente: process.argv.includes('--permitir-rpc-pendente') }).then(r => {
    console.log(JSON.stringify(r, null, 2));
    if (r.ativacaoSqlPendente) {
        console.warn('::warning::Storage respondeu, mas falta aplicar a migração SQL. Atividade do PostgreSQL ainda não foi confirmada.');
        if (process.env.GITHUB_STEP_SUMMARY) require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Ativação SQL pendente\nO backup respondeu; a consulta direta ao banco ainda não está ativa. Execute supabase/migrations/202610080001_verificar_atividade.sql e rode novamente.\n');
    }
}).catch(() => {
    console.error('Falha na verificação de atividade. Confira se a migração SQL foi aplicada, se o projeto está ativo e se o backup responde. Nenhum dado foi apagado.');
    process.exitCode = 1;
});
module.exports = { consultarComRetentativas, verificarAtividade };
