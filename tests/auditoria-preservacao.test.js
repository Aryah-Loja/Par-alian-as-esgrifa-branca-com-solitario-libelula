'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
    mesclarArrayPreservando,
    mesclarConfiguracaoPreservando,
    mesclarChecklistVersionado
} = require('../js/export.js');

const raiz = path.resolve(__dirname, '..');

function teste(nome, executar) {
    try {
        executar();
        console.log(`OK  ${nome}`);
    } catch (erro) {
        console.error(`ERRO ${nome}`);
        throw erro;
    }
}

teste('união por id preserva registros dos dois aparelhos', () => {
    const resultado = mesclarArrayPreservando(
        [{ id: 'a', texto: 'local' }],
        [{ id: 'b', texto: 'remoto' }]
    );
    assert.deepEqual(resultado.map(x => x.id), ['a', 'b']);
});

teste('tombstone remoto vence registro de mesmo id sem apagar os demais', () => {
    const resultado = mesclarArrayPreservando(
        [{ id: 'a', texto: 'local' }, { id: 'b', texto: 'fica' }],
        [{ id: 'a', excluidoEm: '2026-09-01T12:00:00.000Z' }]
    );
    assert.equal(resultado.find(x => x.id === 'a').excluidoEm, '2026-09-01T12:00:00.000Z');
    assert.equal(resultado.find(x => x.id === 'b').texto, 'fica');
});

teste('edição posterior a um tombstone recria o mesmo registro', () => {
    const resultado = mesclarArrayPreservando(
        [{ id: 'a', texto: 'apagado', excluidoEm: '2026-09-01T12:00:00.000Z', atualizadoEm: '2026-09-01T11:00:00.000Z' }],
        [{ id: 'a', texto: 'recriado', atualizadoEm: '2026-09-01T13:00:00.000Z' }]
    );
    assert.equal(resultado[0].texto, 'recriado');
    assert.equal('excluidoEm' in resultado[0], false);
});

teste('edição mais recente do mesmo id prevalece', () => {
    const resultado = mesclarArrayPreservando(
        [{ id: 'a', texto: 'antigo', atualizadoEm: 10 }],
        [{ id: 'a', texto: 'novo', atualizadoEm: 20 }]
    );
    assert.equal(resultado[0].texto, 'novo');
});

teste('checklist combina marcações positivas sem regressão', () => {
    const conflitos = [];
    const resultado = JSON.parse(mesclarConfiguracaoPreservando(
        'aurora_checklist_encontros',
        JSON.stringify({ item_a: true, item_b: false }),
        JSON.stringify({ item_b: true, item_c: true }),
        conflitos
    ));
    assert.deepEqual(resultado, { item_a: true, item_b: true, item_c: true });
    assert.equal(conflitos.length, 0);
});

teste('checklist versionado propaga também uma desmarcação posterior', () => {
    const resultado = mesclarChecklistVersionado(
        { item_a: true, item_b: true },
        { item_a: false, item_c: true },
        { item_a: 10, item_b: 30 },
        { item_a: 20, item_c: 25 }
    );
    assert.deepEqual(resultado, { item_a: false, item_b: true, item_c: true });
});

teste('metadados de exclusão usam o maior relógio por chave', () => {
    const resultado = JSON.parse(mesclarConfiguracaoPreservando(
        'aurora_config_excluidas_em',
        JSON.stringify({ a: 10, b: 30 }),
        JSON.stringify({ a: 20, c: 5 }),
        []
    ));
    assert.deepEqual(resultado, { a: 20, b: 30, c: 5 });
});

teste('estágio final nunca regride', () => {
    assert.equal(mesclarConfiguracaoPreservando('aurora_stage', 'final', 'checkout', []), 'final');
    assert.equal(mesclarConfiguracaoPreservando('aurora_stage', 'checkout', 'final', []), 'final');
});

teste('todos os JavaScripts do projeto têm sintaxe válida', () => {
    const pastas = ['js', 'scripts'];
    for (const pasta of pastas) {
        for (const nome of fs.readdirSync(path.join(raiz, pasta)).filter(n => n.endsWith('.js'))) {
            execFileSync(process.execPath, ['--check', path.join(raiz, pasta, nome)], { stdio: 'pipe' });
        }
    }
});

teste('manifesto da galeria aponta apenas para arquivos existentes e não vazios', () => {
    const manifesto = JSON.parse(fs.readFileSync(path.join(raiz, 'assets/img/galeria/manifesto.json'), 'utf8'));
    assert.ok(Array.isArray(manifesto.itens));
    for (const item of manifesto.itens) {
        const relativo = `assets/img/galeria/galeria_${item.numero}.${item.ext}`;
        const arquivo = path.join(raiz, relativo.replaceAll('/', path.sep));
        assert.ok(fs.existsSync(arquivo), `arquivo ausente: ${relativo}`);
        assert.ok(fs.statSync(arquivo).size > 0, `arquivo vazio: ${relativo}`);
        assert.equal(fs.statSync(arquivo).size, item.tamanho, `tamanho divergente: ${relativo}`);
    }
});

teste('imagens com extensão JPEG têm conteúdo realmente compatível', () => {
    function caminhar(pasta) {
        return fs.readdirSync(pasta, { withFileTypes: true }).flatMap(item => {
            const destino = path.join(pasta, item.name);
            return item.isDirectory() ? caminhar(destino) : [destino];
        });
    }
    for (const arquivo of caminhar(path.join(raiz, 'assets')).filter(nome => /\.jpe?g$/i.test(nome))) {
        const cabecalho = fs.readFileSync(arquivo).subarray(0, 3);
        assert.deepEqual([...cabecalho], [0xff, 0xd8, 0xff], `JPEG com conteúdo incompatível: ${path.relative(raiz, arquivo)}`);
    }
});

teste('partes do backup ficam abaixo do limite recomendado para upload padrão', () => {
    const sync = fs.readFileSync(path.join(raiz, 'js/sync.js'), 'utf8');
    const correspondencia = sync.match(/TAMANHO_MAXIMO_PARTE_BYTES\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/);
    assert.ok(correspondencia, 'tamanho das partes não encontrado');
    assert.ok(Number(correspondencia[1]) < 6, 'parte deve ter menos de 6 MB');
});

teste('dependências críticas locais existem e CDNs sem versão não voltaram', () => {
    for (const nome of ['dexie-4.4.5.min.js', 'jszip-3.10.1.min.js', 'supabase-2.112.4.js']) {
        assert.ok(fs.statSync(path.join(raiz, 'vendor', nome)).size > 1000, `dependência inválida: ${nome}`);
    }
    for (const html of fs.readdirSync(raiz).filter(n => n.endsWith('.html'))) {
        const conteudo = fs.readFileSync(path.join(raiz, html), 'utf8');
        assert.equal(conteudo.includes('unpkg.com/dexie/dist/dexie.js'), false, `${html}: Dexie sem versão`);
        assert.equal(conteudo.includes('@supabase/supabase-js@2\"'), false, `${html}: Supabase sem versão exata`);
    }
});

teste('referências locais declaradas nos HTMLs existem', () => {
    for (const html of fs.readdirSync(raiz).filter(n => n.endsWith('.html'))) {
        const conteudo = fs.readFileSync(path.join(raiz, html), 'utf8');
        const referencias = [...conteudo.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]);
        for (const referencia of referencias) {
            const limpa = referencia.split('?')[0].split('#')[0];
            if (!limpa || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(limpa)) continue;
            const destino = path.resolve(path.dirname(path.join(raiz, html)), limpa);
            assert.ok(fs.existsSync(destino), `${html}: referência local ausente: ${limpa}`);
        }
    }
});

teste('duplicatas JavaScript antigas da raiz não existem', () => {
    assert.equal(fs.existsSync(path.join(raiz, 'romance.js')), false);
    assert.equal(fs.existsSync(path.join(raiz, 'utils.js')), false);
});

console.log('\nAuditoria automatizada concluída sem falhas.');
