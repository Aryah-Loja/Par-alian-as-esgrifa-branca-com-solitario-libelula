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
    const relogiosDepoisDaEscrita = JSON.parse(await banco.obterConfiguracao('aurora_config_modificados_em'));
    assert.ok(Number(relogiosDepoisDaEscrita.aurora_mural_ana) > 0, 'valor e relógio por chave devem ser persistidos juntos');

    await Promise.all([
        banco.salvarConfiguracao('aurora_concorrente_a', 'a'),
        banco.salvarConfiguracao('aurora_concorrente_b', 'b')
    ]);
    const relogiosConcorrentes = JSON.parse(await banco.obterConfiguracao('aurora_config_modificados_em'));
    assert.ok(relogiosConcorrentes.aurora_concorrente_a > 0 && relogiosConcorrentes.aurora_concorrente_b > 0,
        'gravações concorrentes não podem perder o relógio de uma das chaves');

    const relogioSomenteNoEspelho = Object.assign({}, relogiosConcorrentes, { aurora_pendente_no_espelho: Date.now() + 1000 });
    armazenamento.set('aurora_config_modificados_em', JSON.stringify(relogioSomenteNoEspelho));
    await banco.salvarConfiguracao('aurora_depois_do_fallback', 'ok');
    const relogiosUnidos = JSON.parse(await banco.obterConfiguracao('aurora_config_modificados_em'));
    assert.equal(relogiosUnidos.aurora_pendente_no_espelho, relogioSomenteNoEspelho.aurora_pendente_no_espelho,
        'uma nova gravação deve manter relógios mais novos que existam somente no espelho');

    const chaveFallback = 'aurora_teste_fallback_local';
    const relogiosDb = JSON.parse(await banco.obterConfiguracao('aurora_config_modificados_em'));
    relogiosDb[chaveFallback] = 10;
    await banco.db.configuracoes.bulkPut([
        { chave: chaveFallback, valor: 'duravel-antigo' },
        { chave: 'aurora_config_modificados_em', valor: JSON.stringify(relogiosDb) }
    ]);
    armazenamento.set(chaveFallback, 'espelho-mais-novo');
    const relogiosLocal = Object.assign({}, relogiosDb, { [chaveFallback]: 20 });
    armazenamento.set('aurora_config_modificados_em', JSON.stringify(relogiosLocal));
    assert.equal(await banco.obterConfiguracao(chaveFallback), 'espelho-mais-novo', 'fallback local mais novo não pode ser regredido pelo banco');
    assert.equal((await banco.db.configuracoes.get(chaveFallback)).valor, 'espelho-mais-novo', 'fallback local deve reparar o IndexedDB');
    await banco.salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: new Blob(['versao-antiga'], { type: 'video/webm' }) });
    const zip = await backup.gerarBackupZipBlob();
    assert.ok(zip.size > 0, 'backup deve ter conteúdo');
    const manifestoGerado = JSON.parse(await (await global.JSZip.loadAsync(await zip.arrayBuffer())).file('manifest.json').async('string'));
    assert.equal(manifestoGerado.schemaBanco, 4, 'backup deve registrar o schema recuperável atual');

    await new Promise(resolve => setTimeout(resolve, 5));
    await banco.salvarConfiguracao('aurora_mural_ana', JSON.stringify([{ id: 'mural_b', texto: 'segundo', data: '2026-01-02T00:00:00.000Z' }]));
    await banco.salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: new Blob(['versao-nova'], { type: 'video/webm' }) });
    await banco.salvarMedia({ id: 'foto_nova', tipo: 'lembranca', blob: new Blob(['foto'], { type: 'image/jpeg' }) });

    const versoesAntesDoRestore = (await banco.db.media.toArray()).filter(item => item.idOriginal === 'video_pedido');
    assert.equal(versoesAntesDoRestore.length, 1, 'sobrescrever mídia deve preservar a versão anterior imediatamente');
    assert.equal(await versoesAntesDoRestore[0].blob.text(), 'versao-antiga', 'a cópia preservada deve manter todos os bytes anteriores');

    await backup.aplicarBackupDeZip(await zip.arrayBuffer());

    const mural = JSON.parse(await banco.obterConfiguracao('aurora_mural_ana'));
    assert.deepEqual(new Set(mural.map(item => item.id)), new Set(['mural_a', 'mural_b']), 'restore deve unir listas');
    const videoCanonico = await banco.obterMedia('video_pedido');
    assert.equal(await videoCanonico.blob.text(), 'versao-nova', 'mídia mais nova deve continuar canônica');
    assert.ok(await banco.obterMedia('foto_nova'), 'mídia criada depois do backup deve permanecer');
    const alternativas = (await banco.db.media.toArray()).filter(item => item.idOriginal === 'video_pedido');
    assert.equal(alternativas.length, 1, 'versão divergente antiga deve ser preservada como alternativa');

    const zipIso = new global.JSZip();
    zipIso.file('media/video_pedido.webm', new TextEncoder().encode('versao-iso-mais-nova'));
    zipIso.file('manifest.json', JSON.stringify({
        formato: 'poloni-backup',
        versao: 4,
        configuracoes: {},
        medias: [{
            id: 'video_pedido',
            tipo: 'video_pedido',
            arquivo: 'video_pedido.webm',
            mimeType: 'video/webm',
            tamanho: 'versao-iso-mais-nova'.length,
            criadoEm: '2099-01-01T00:00:00.000Z',
            atualizadoEm: '2099-01-01T00:00:00.000Z'
        }]
    }));
    await backup.aplicarBackupDeZip(await zipIso.generateAsync({ type: 'uint8array' }));
    assert.equal(await (await banco.obterMedia('video_pedido')).blob.text(), 'versao-iso-mais-nova', 'mídia com relógio ISO mais novo deve virar canônica');

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
