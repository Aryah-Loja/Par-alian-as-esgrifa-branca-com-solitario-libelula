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
    const padrao = /^galeria_(\d+)\.(jpg|jpeg|mp4)$/i;

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

    const manifesto = {
        geradoEm: new Date().toISOString(),
        itens
    };

    const caminhoSaida = path.join(PASTA_GALERIA, NOME_MANIFESTO);
    fs.writeFileSync(caminhoSaida, JSON.stringify(manifesto, null, 2) + '\n');

    console.log(`[manifesto] ${itens.length} item(ns) encontrados. Escrito em ${caminhoSaida}`);
}

gerarManifesto();
