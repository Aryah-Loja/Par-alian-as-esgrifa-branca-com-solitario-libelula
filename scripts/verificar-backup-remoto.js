'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const JSZip = require('../vendor/jszip-3.10.1.min.js');

const raiz = path.resolve(__dirname, '..');

function extrairConstante(arquivo, nome) {
    const fonte = fs.readFileSync(path.join(raiz, arquivo), 'utf8');
    const resultado = fonte.match(new RegExp(`const\\s+${nome}\\s*=\\s*['\"]([^'\"]+)['\"]`));
    if (!resultado) throw new Error(`Não encontrei ${nome} em ${arquivo}.`);
    return resultado[1];
}

function sha256(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function buscarBytes(url, tentativas = 3) {
    let ultimoErro;
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        try {
            const resposta = await fetch(`${url}${url.includes('?') ? '&' : '?'}verificacao=${Date.now()}`, {
                cache: 'no-store',
                signal: AbortSignal.timeout(60000)
            });
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao baixar ${url}`);
            return Buffer.from(await resposta.arrayBuffer());
        } catch (erro) {
            ultimoErro = erro;
            if (tentativa < tentativas) await new Promise(resolve => setTimeout(resolve, tentativa * 750));
        }
    }
    throw ultimoErro;
}

async function verificarBackupRemoto(opcoes = {}) {
    const supabaseUrl = extrairConstante('js/sync.js', 'SUPABASE_URL');
    const bucket = extrairConstante('js/sync.js', 'SUPABASE_BUCKET');
    const codigo = extrairConstante('js/config.js', 'EXPERIENCE_ID');
    const basePublica = `${supabaseUrl}/storage/v1/object/public/${bucket}`;
    const metaBytes = await buscarBytes(`${basePublica}/${codigo}-meta.json`);
    const meta = JSON.parse(metaBytes.toString('utf8'));
    const geracao = meta && meta.geracaoAtual;
    if (!geracao || !geracao.id || !Array.isArray(geracao.partes) || !geracao.partes.length) {
        throw new Error('O arquivo de controle não aponta para uma geração completa.');
    }

    const partes = [];
    for (const parte of geracao.partes) {
        const bytes = await buscarBytes(`${basePublica}/${parte.objeto}`);
        if (bytes.length !== Number(parte.tamanho)) {
            throw new Error(`Parte incompleta: ${parte.objeto} (${bytes.length}/${parte.tamanho} bytes).`);
        }
        partes.push(bytes);
    }

    const zipBytes = Buffer.concat(partes);
    if (zipBytes.length !== Number(geracao.tamanho)) {
        throw new Error(`ZIP remontado com tamanho divergente (${zipBytes.length}/${geracao.tamanho}).`);
    }
    const hashZip = sha256(zipBytes);
    if (geracao.sha256 && hashZip !== geracao.sha256) throw new Error('SHA-256 do ZIP remoto não confere.');

    const zip = await JSZip.loadAsync(zipBytes, { checkCRC32: true });
    const arquivoManifesto = zip.file('manifest.json');
    if (!arquivoManifesto) throw new Error('manifest.json não existe dentro do backup.');
    const manifesto = JSON.parse(await arquivoManifesto.async('string'));
    if (manifesto.formato !== 'poloni-backup' || !Array.isArray(manifesto.medias)) {
        throw new Error('Manifesto interno do backup é inválido.');
    }

    let bytesMidia = 0;
    for (const media of manifesto.medias) {
        if (media.arquivo) {
            const arquivo = zip.file(`media/${media.arquivo}`);
            if (!arquivo) throw new Error(`Mídia ausente no ZIP: ${media.id}.`);
            const bytes = Buffer.from(await arquivo.async('uint8array'));
            if (bytes.length !== Number(media.tamanho)) throw new Error(`Tamanho divergente na mídia ${media.id}.`);
            if (media.sha256 && sha256(bytes) !== media.sha256) throw new Error(`SHA-256 divergente na mídia ${media.id}.`);
            bytesMidia += bytes.length;
        } else if (typeof media.texto === 'string') {
            if (media.sha256Texto && sha256(Buffer.from(media.texto, 'utf8')) !== media.sha256Texto) {
                throw new Error(`SHA-256 divergente no texto ${media.id}.`);
            }
        } else {
            throw new Error(`Registro sem conteúdo no manifesto: ${media.id}.`);
        }
    }
    if (manifesto.estatisticas && Number(manifesto.estatisticas.bytesMidia) !== bytesMidia) {
        throw new Error(`Total de mídia divergente (${bytesMidia}/${manifesto.estatisticas.bytesMidia}).`);
    }

    let arquivoSaida = opcoes.arquivoSaida || null;
    if (arquivoSaida) {
        arquivoSaida = path.resolve(arquivoSaida);
        fs.mkdirSync(path.dirname(arquivoSaida), { recursive: true });
        fs.writeFileSync(arquivoSaida, zipBytes);
    }

    const resultado = {
        ok: true,
        projeto: new URL(supabaseUrl).hostname.split('.')[0],
        bucket,
        codigo,
        revisao: Number(meta.revisao),
        geracao: geracao.id,
        geracaoCriadaEm: geracao.criadoEm || null,
        zipBytes: zipBytes.length,
        sha256: hashZip,
        medias: manifesto.medias.length,
        bytesMidia,
        configuracoes: Object.keys(manifesto.configuracoes || {}).length,
        arquivoSaida,
        verificadoEm: new Date().toISOString()
    };

    if (opcoes.reciboSaida) {
        const reciboSaida = path.resolve(opcoes.reciboSaida);
        fs.mkdirSync(path.dirname(reciboSaida), { recursive: true });
        fs.writeFileSync(reciboSaida, `${JSON.stringify(resultado, null, 2)}\n`, 'utf8');
        resultado.reciboSaida = reciboSaida;
    }

    return { resultado, zipBytes, meta, manifesto };
}

function valorArgumento(nome) {
    const indice = process.argv.indexOf(nome);
    if (indice < 0) return null;
    const valor = process.argv[indice + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`Informe um caminho depois de ${nome}.`);
    return valor;
}

if (require.main === module) {
    verificarBackupRemoto({
        arquivoSaida: valorArgumento('--saida'),
        reciboSaida: valorArgumento('--recibo')
    }).then(({ resultado }) => {
        console.log(JSON.stringify(resultado, null, 2));
    }).catch(erro => {
        console.error(`FALHA: ${erro.message}`);
        process.exitCode = 1;
    });
}

module.exports = { verificarBackupRemoto, extrairConstante, sha256, buscarBytes };
