#!/usr/bin/env node
/**
 * ============================================================================
 * ATUALIZAR-VERSAO.JS
 * ============================================================================
 * Troca o número depois de "?v=" em TODOS os links locais de css/js de TODOS
 * os arquivos .html do site (ex: css/style.css?v=20260805 vira
 * css/style.css?v=20260806151230) por um novo número baseado no momento
 * exato em que este script roda.
 *
 * POR QUE ISSO EXISTE:
 * O navegador do celular guarda uma cópia local (cache) do css/style.css e
 * de cada js/*.js pra não precisar baixar de novo toda vez. Isso é ótimo
 * pra velocidade, mas tem um efeito colateral: quando você atualiza o site
 * e sobe a versão nova pro GitHub Pages, o celular que já visitou o site
 * antes pode continuar usando a cópia antiga guardada nele, e a pessoa vê
 * a versão desatualizada mesmo o servidor já tendo a nova.
 *
 * O "?v=..." no final do link não muda NADA no conteúdo do arquivo — é só
 * uma etiqueta na URL. Mas pro navegador, "css/style.css?v=1" e
 * "css/style.css?v=2" são duas URLs diferentes, então trocar esse número
 * força o celular a ignorar a cópia guardada e baixar o arquivo de novo.
 * As tags <meta http-equiv="Cache-Control" ...> já colocadas no <head> de
 * cada página cuidam de garantir que o PRÓPRIO HTML seja sempre revalidado
 * com o servidor; este script cuida do CSS e dos JS carregados por ele.
 *
 * QUANDO RODAR:
 * Sempre que você mudar algo em css/style.css ou em qualquer arquivo dentro
 * de js/ (ou secret/secret.css, secret/secret.js) e for publicar a
 * atualização. Rode antes de subir pro GitHub:
 *
 *   node js/atualizar-versao.js
 *
 * e depois suba (commit/push) normalmente. Não precisa rodar se você só
 * mudou texto/conteúdo dentro do js/config.js? Precisa sim — qualquer
 * arquivo .js contado é local e se beneficia do versionamento, então é
 * mais seguro rodar sempre que publicar qualquer mudança.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

// Mesma lista de páginas que carregam css/js locais versionados.
const ARQUIVOS_HTML = [
    'index.html',
    'checklist.html',
    'diagnostico.html',
    'galeria.html',
    path.join('secret', 'coupon.html'),
    path.join('secret', 'fortune.html'),
    path.join('secret', 'gerar-hash.html'),
    path.join('secret', 'letter.html'),
    path.join('secret', 'video.html'),
    path.join('secret', 'wheel.html'),
];

// AAAAMMDDhhmmss — sempre maior que o anterior, sempre único.
function gerarNovaVersao() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return (
        d.getFullYear().toString() +
        p(d.getMonth() + 1) +
        p(d.getDate()) +
        p(d.getHours()) +
        p(d.getMinutes()) +
        p(d.getSeconds())
    );
}

const novaVersao = gerarNovaVersao();
// Só troca o número depois de "?v=" em arquivos .css/.js locais — não mexe
// em links de CDN (bootstrap, google fonts etc.), que nunca têm "?v=".
const PADRAO_VERSAO = /(\.(?:css|js)\?v=)\d+/g;

let totalArquivos = 0;
let totalTrocas = 0;

for (const nomeRelativo of ARQUIVOS_HTML) {
    const caminho = path.join(RAIZ, nomeRelativo);
    if (!fs.existsSync(caminho)) {
        console.warn(`(aviso) não encontrei ${nomeRelativo}, pulando`);
        continue;
    }
    const original = fs.readFileSync(caminho, 'utf8');
    let trocasNesteArquivo = 0;
    const atualizado = original.replace(PADRAO_VERSAO, (match, prefixo) => {
        trocasNesteArquivo++;
        return `${prefixo}${novaVersao}`;
    });
    if (trocasNesteArquivo > 0) {
        fs.writeFileSync(caminho, atualizado, 'utf8');
        totalArquivos++;
        totalTrocas += trocasNesteArquivo;
        console.log(`✓ ${nomeRelativo} — ${trocasNesteArquivo} link(s) atualizado(s)`);
    }
}

console.log(
    `\nNova versão: ${novaVersao}\n` +
    `${totalTrocas} link(s) em ${totalArquivos} arquivo(s) atualizados.\n` +
    `Agora é só subir (commit/push) as mudanças normalmente.`
);
