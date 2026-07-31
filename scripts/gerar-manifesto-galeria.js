#!/usr/bin/env node
/**
 * ============================================================================
 * GERAR-MANIFESTO-GALERIA.JS
 * ============================================================================
 * Varre a pasta assets/img/galeria/ e escreve assets/img/galeria/manifesto.json
 * com a lista de tudo que existe de verdade (galeria_1.jpg, galeria_2.mp4, ...).
 *
 * POR QUE ISSO EXISTE:
 * Sem esse arquivo, o site descobre quais fotos/vídeos existem "perguntando"
 * ao servidor um por um (requisição HEAD para galeria_1, galeria_2, ...) —
 * rápido no wi-fi de um computador, mas lento no 4G/5G de um celular, onde
 * cada requisição custa muito mais tempo de ida-e-volta. Com o manifesto,
 * o navegador faz UMA única requisição (baixa este JSON) e já sabe
 * exatamente o que existe, sem "adivinhar" nada — a Galeria e "Nossa
 * História" ficam prontas quase na hora, mesmo em rede ruim.
 *
 * QUANDO RODAR:
 * Não precisa rodar manualmente — o workflow em
 * .github/workflows/gerar-manifesto-galeria.yml já roda este script sozinho
 * (e salva o resultado no repositório) toda vez que algo muda dentro de
 * assets/img/galeria/. Só rode à mão se quiser gerar o arquivo localmente
 * antes de subir pro GitHub, ou pra testar:
 *
 *   node scripts/gerar-manifesto-galeria.js
 *
 * Continua sendo 100% "solte o arquivo com o próximo número e pronto" —
 * este script só documenta em um JSON o que já está na pasta, não muda a
 * forma de organizar os arquivos.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Precisam bater com PASTA_GALERIA / GALERIA_EXTENSOES_FOTO / GALERIA_EXTENSOES_VIDEO
// em js/config.js. Mantidos fixos aqui (em vez de tentar ler o config.js,
// que é um arquivo de browser, não um módulo Node) para o script não ter
// nenhuma dependência externa.
const PASTA_GALERIA = path.join(__dirname, '..', 'assets', 'img', 'galeria');
const EXTENSAO_FOTO = 'jpg';
const EXTENSAO_VIDEO = 'mp4';
const NOME_MANIFESTO = 'manifesto.json';

function gerarManifesto() {
    if (!fs.existsSync(PASTA_GALERIA)) {
        console.log(`[manifesto] Pasta ${PASTA_GALERIA} ainda não existe — nada para gerar (normal se nenhuma foto/vídeo foi adicionado ainda).`);
        return;
    }

    const arquivos = fs.readdirSync(PASTA_GALERIA);
    // Case-sensitive de propósito: js/config.js é explícito que o site só
    // testa ".jpg"/".mp4" em minúsculo, nenhuma variação de maiúscula
    // (ver EXTENSOES_FOTO_ACEITAS/GALERIA_EXTENSOES_VIDEO). Se o padrão
    // aqui fosse case-insensitive, um arquivo salvo como "galeria_3.JPG"
    // entraria no manifesto apontando para "galeria_3.jpg" — um caminho
    // que não existe de verdade (servidores como o GitHub Pages são
    // case-sensitive) — e o item quebraria na galeria. Mantendo os dois
    // lados (gerador e site) de acordo com a mesma regra evita esse
    // descompasso silencioso.
    const padrao = /^galeria_(\d+)\.(jpg|mp4)$/;

    const itens = [];
    for (const nomeArquivo of arquivos) {
        const m = nomeArquivo.match(padrao);
        if (!m) continue;

        const numero = parseInt(m[1], 10);
        const extEncontrada = m[2].toLowerCase();

        // Só aceita a extensão exata que o site sabe procurar (galeria.js
        // testa sempre minúsculo, .jpg pra foto e .mp4 pra vídeo) — evita
        // o manifesto listar um arquivo que o site depois não vai achar.
        if (extEncontrada !== EXTENSAO_FOTO && extEncontrada !== EXTENSAO_VIDEO) continue;

        const tipo = extEncontrada === EXTENSAO_VIDEO ? 'video' : 'foto';
        itens.push({ numero, tipo, ext: extEncontrada });
    }

    itens.sort((a, b) => a.numero - b.numero);

    const caminhoSaida = path.join(PASTA_GALERIA, NOME_MANIFESTO);

    // CORREÇÃO (commit automático toda vez que o workflow rodasse, mesmo
    // sem foto/vídeo novo nenhum): antes, `geradoEm` recebia um timestamp
    // novo em TODA execução — então o arquivo mudava sempre, mesmo quando
    // a lista de itens era idêntica à anterior, fazendo o passo "commitar
    // só se algo mudou" do workflow (ver .github/workflows/
    // gerar-manifesto-galeria.yml) nunca conseguir pular um commit de
    // verdade. Agora só reescreve o arquivo (com um `geradoEm` novo) se a
    // lista de itens for DIFERENTE da que já estava salva — sem mudança
    // real, o arquivo (e o timestamp) ficam exatamente como estavam.
    let itensAntigos = null;
    try {
        const anterior = JSON.parse(fs.readFileSync(caminhoSaida, 'utf8'));
        if (anterior && Array.isArray(anterior.itens)) itensAntigos = anterior.itens;
    } catch (e) {
        itensAntigos = null; // manifesto ainda não existe, ou está corrompido — gera do zero
    }

    const normalizar = (lista) => JSON.stringify(lista.map(i => ({ numero: i.numero, tipo: i.tipo, ext: i.ext })));
    if (itensAntigos && normalizar(itensAntigos) === normalizar(itens)) {
        console.log(`[manifesto] ${itens.length} item(ns) encontrados, igual ao manifesto já salvo — nada para atualizar.`);
        return;
    }

    const manifesto = {
        geradoEm: new Date().toISOString(),
        itens
    };

    fs.writeFileSync(caminhoSaida, JSON.stringify(manifesto, null, 2) + '\n');

    console.log(`[manifesto] ${itens.length} item(ns) encontrados. Escrito em ${caminhoSaida}`);
}

gerarManifesto();
