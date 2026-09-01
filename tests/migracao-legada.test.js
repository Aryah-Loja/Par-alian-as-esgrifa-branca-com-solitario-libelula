'use strict';

const assert = require('node:assert/strict');
require('fake-indexeddb/auto');

global.Dexie = require('../vendor/dexie-4.4.5.min.js');
global.location = { pathname: '/teste-migracao' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node-test' }, configurable: true });
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

(async () => {
    // Simula exatamente o estado que a versão antiga podia deixar: banco já
    // na v3, `arquivos` ainda preenchida e um item inválido no mesmo array.
    const antigo = new global.Dexie('AuroraDB');
    antigo.version(3).stores({
        arquivos: 'id',
        media: 'id, tipo, criadoEm',
        configuracoes: 'chave',
        diagnosticos: '++id, codigo, criadoEm, operacao'
    });
    await antigo.open();
    await antigo.table('arquivos').put({
        id: 'lembrancas',
        criadoEm: 1000,
        data: [
            { id: 'lembranca_valida', blob: new Blob(['foto-legada'], { type: 'image/jpeg' }) },
            null
        ]
    });
    antigo.close();

    const { db } = require('../js/db.js');
    await db.open();
    assert.equal(db.verno, 4, 'banco deve atualizar para a versão 4');
    assert.ok(await db.media.get('lembranca_valida'), 'registro legado válido deve ser recuperado');
    assert.equal(await db.table('arquivos').count(), 0, 'tabela antiga só deve ser limpa depois da recuperação');

    console.log('OK  migração v4 recupera registros legados mesmo com entrada inválida isolada');
    await db.delete();
})().catch(async erro => {
    console.error(erro);
    try { await global.Dexie.delete('AuroraDB'); } catch (_) { /* encerra mesmo após falha */ }
    process.exitCode = 1;
});
