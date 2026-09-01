'use strict';

const assert = require('node:assert/strict');
require('fake-indexeddb/auto');

global.Dexie = require('../vendor/dexie-4.4.5.min.js');
global.JSZip = require('../vendor/jszip-3.10.1.min.js');
global.location = { pathname: '/teste' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node-test' }, configurable: true });
global.POLONI_APP_VERSION = 'teste';
global.NOME_DELA = 'Ana';
global.NOME_DELE = 'Gabriel';
global.gerarIdUnico = prefixo => `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
global.chaveConfigPodeSerApagada = chave => chave === 'aurora_termometro_lista';

const armazenamento = new Map();
global.localStorage = {
    getItem: chave => armazenamento.has(chave) ? armazenamento.get(chave) : null,
    setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
    removeItem: chave => armazenamento.delete(chave)
};

const banco = require('../js/db.js');
Object.assign(global, banco);
global.obterOuCriarDataPrimeiroAcesso = async () => '2026-01-01T00:00:00.000Z';
const backup = require('../js/export.js');

(async () => {
    await banco.db.open();
    await banco.db.media.clear();
    await banco.db.configuracoes.clear();
    await banco.db.diagnosticos.clear();

    await banco.salvarConfiguracao('aurora_mural_ana', JSON.stringify([{ id: 'mural_a', texto: 'primeiro', data: '2026-01-01T00:00:00.000Z' }]));
    await banco.salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: new Blob(['versao-antiga'], { type: 'video/webm' }) });
    const zip = await backup.gerarBackupZipBlob();
    assert.ok(zip.size > 0, 'backup deve ter conteúdo');

    await new Promise(resolve => setTimeout(resolve, 5));
    await banco.salvarConfiguracao('aurora_mural_ana', JSON.stringify([{ id: 'mural_b', texto: 'segundo', data: '2026-01-02T00:00:00.000Z' }]));
    await banco.salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: new Blob(['versao-nova'], { type: 'video/webm' }) });
    await banco.salvarMedia({ id: 'foto_nova', tipo: 'lembranca', blob: new Blob(['foto'], { type: 'image/jpeg' }) });

    await backup.aplicarBackupDeZip(await zip.arrayBuffer());

    const mural = JSON.parse(await banco.obterConfiguracao('aurora_mural_ana'));
    assert.deepEqual(new Set(mural.map(item => item.id)), new Set(['mural_a', 'mural_b']), 'restore deve unir listas');
    const videoCanonico = await banco.obterMedia('video_pedido');
    assert.equal(await videoCanonico.blob.text(), 'versao-nova', 'mídia mais nova deve continuar canônica');
    assert.ok(await banco.obterMedia('foto_nova'), 'mídia criada depois do backup deve permanecer');
    const alternativas = (await banco.db.media.toArray()).filter(item => item.idOriginal === 'video_pedido');
    assert.equal(alternativas.length, 1, 'versão divergente antiga deve ser preservada como alternativa');

    await banco.salvarConfiguracao('aurora_data_pedido', 'permanente', false, false);
    await banco.salvarConfiguracao('aurora_termometro_lista', '[1]', false, false);
    const zipTombstone = new global.JSZip();
    zipTombstone.file('manifest.json', JSON.stringify({
        formato: 'poloni-backup',
        versao: 4,
        configuracoes: {
            aurora_config_excluidas_em: JSON.stringify({ aurora_data_pedido: 100, aurora_termometro_lista: 100 })
        },
        medias: []
    }));
    const dadosTombstone = await zipTombstone.generateAsync({ type: 'uint8array' });
    await backup.aplicarBackupDeZip(dadosTombstone);
    assert.equal(await banco.obterConfiguracao('aurora_data_pedido'), 'permanente', 'backup não pode apagar configuração permanente');
    assert.equal(await banco.obterConfiguracao('aurora_termometro_lista'), null, 'tombstone autorizado deve ser aplicado');

    const antes = { medias: await banco.db.media.count(), configs: await banco.db.configuracoes.count() };
    const corrompido = (await zip.arrayBuffer()).slice(0, Math.max(1, zip.size - 17));
    await assert.rejects(() => backup.aplicarBackupDeZip(corrompido), /corrupt|inválid|fim|data|signature|zip/i);
    assert.deepEqual(
        { medias: await banco.db.media.count(), configs: await banco.db.configuracoes.count() },
        antes,
        'backup corrompido não pode alterar o banco'
    );

    console.log('OK  backup/restore transacional preserva o estado atual e rejeita arquivo corrompido');
    await banco.db.delete();
})().catch(async erro => {
    console.error(erro);
    try { await banco.db.delete(); } catch (_) { /* encerra mesmo após falha */ }
    process.exitCode = 1;
});
