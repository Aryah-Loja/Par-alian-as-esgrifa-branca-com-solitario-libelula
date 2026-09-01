'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAGIC = Buffer.from('POLONIENC01', 'ascii');
const TAMANHO_SALT = 16;
const TAMANHO_IV = 12;
const TAMANHO_TAG = 16;
const FORMATO = 'poloni-backup-criptografado-v1';

function sha256(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

function derivarChave(segredo, salt) {
    if (typeof segredo !== 'string' || segredo.length < 32) {
        throw new Error('A chave de recuperação precisa ter pelo menos 32 caracteres.');
    }
    return crypto.scryptSync(segredo, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
}

function criptografarBuffer(conteudo, segredo) {
    const salt = crypto.randomBytes(TAMANHO_SALT);
    const iv = crypto.randomBytes(TAMANHO_IV);
    const cifra = crypto.createCipheriv('aes-256-gcm', derivarChave(segredo, salt), iv);
    const criptografado = Buffer.concat([cifra.update(conteudo), cifra.final()]);
    const tag = cifra.getAuthTag();
    return Buffer.concat([MAGIC, salt, iv, tag, criptografado]);
}

function descriptografarBuffer(pacote, segredo) {
    if (!Buffer.isBuffer(pacote)) pacote = Buffer.from(pacote);
    if (pacote.length <= MAGIC.length + TAMANHO_SALT + TAMANHO_IV + TAMANHO_TAG ||
        !pacote.subarray(0, MAGIC.length).equals(MAGIC)) {
        throw new Error('Arquivo criptografado inválido ou formato desconhecido.');
    }
    let offset = MAGIC.length;
    const salt = pacote.subarray(offset, offset += TAMANHO_SALT);
    const iv = pacote.subarray(offset, offset += TAMANHO_IV);
    const tag = pacote.subarray(offset, offset += TAMANHO_TAG);
    const conteudo = pacote.subarray(offset);
    const decifra = crypto.createDecipheriv('aes-256-gcm', derivarChave(segredo, salt), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(conteudo), decifra.final()]);
}

function valorArgumento(nome, obrigatorio = true) {
    const indice = process.argv.indexOf(nome);
    if (indice < 0) {
        if (obrigatorio) throw new Error(`Argumento obrigatório ausente: ${nome}.`);
        return null;
    }
    const valor = process.argv[indice + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`Informe um valor depois de ${nome}.`);
    return valor;
}

function lerSegredo() {
    const arquivoChave = valorArgumento('--chave-arquivo', false);
    if (arquivoChave) {
        const texto = fs.readFileSync(path.resolve(arquivoChave), 'utf8');
        const linha = texto.split(/\r?\n/).find(item => item.startsWith('POLONI_BACKUP_PASSPHRASE='));
        if (!linha) throw new Error('O arquivo informado não contém a chave de recuperação.');
        return linha.slice('POLONI_BACKUP_PASSPHRASE='.length).trim();
    }
    return process.env.POLONI_BACKUP_PASSPHRASE || '';
}

function gerarChave(arquivoSaida) {
    const destino = path.resolve(arquivoSaida);
    if (fs.existsSync(destino)) throw new Error(`A chave já existe e não será sobrescrita: ${destino}`);
    const segredo = crypto.randomBytes(48).toString('base64url');
    const conteudo = [
        'CHAVE DE RECUPERAÇÃO DO BACKUP POLONI',
        '',
        'Guarde este arquivo fora do computador e nunca envie para o GitHub.',
        'Sem esta chave, os backups externos criptografados não podem ser abertos.',
        '',
        `POLONI_BACKUP_PASSPHRASE=${segredo}`,
        ''
    ].join('\n');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, conteudo, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    try { fs.chmodSync(destino, 0o600); } catch (_) { /* Windows protege pelo perfil do usuário */ }
    return { destino, fingerprint: sha256(Buffer.from(segredo)).slice(0, 16) };
}

function atualizarRecibo(caminhoRecibo, dados) {
    if (!caminhoRecibo) return;
    const destino = path.resolve(caminhoRecibo);
    const recibo = JSON.parse(fs.readFileSync(destino, 'utf8'));
    recibo.criptografia = dados;
    fs.writeFileSync(destino, `${JSON.stringify(recibo, null, 2)}\n`, 'utf8');
}

function executarCli() {
    const acao = process.argv[2];
    if (acao === 'gerar-chave') {
        const resultado = gerarChave(valorArgumento('--saida'));
        console.log(JSON.stringify({ ok: true, ...resultado }, null, 2));
        return;
    }

    const entrada = path.resolve(valorArgumento('--entrada'));
    const saida = path.resolve(valorArgumento('--saida'));
    const segredo = lerSegredo();
    const conteudo = fs.readFileSync(entrada);
    fs.mkdirSync(path.dirname(saida), { recursive: true });

    if (acao === 'criptografar') {
        const pacote = criptografarBuffer(conteudo, segredo);
        fs.writeFileSync(saida, pacote);
        const conferido = descriptografarBuffer(pacote, segredo);
        if (sha256(conferido) !== sha256(conteudo)) throw new Error('A conferência após criptografar não reproduziu o arquivo original.');
        const dados = {
            formato: FORMATO,
            algoritmo: 'AES-256-GCM + scrypt',
            arquivo: path.basename(saida),
            bytes: pacote.length,
            sha256: sha256(pacote),
            sha256Original: sha256(conteudo),
            criadoEm: new Date().toISOString()
        };
        atualizarRecibo(valorArgumento('--recibo', false), dados);
        console.log(JSON.stringify({ ok: true, ...dados }, null, 2));
        return;
    }

    if (acao === 'descriptografar') {
        const aberto = descriptografarBuffer(conteudo, segredo);
        fs.writeFileSync(saida, aberto);
        console.log(JSON.stringify({ ok: true, arquivo: saida, bytes: aberto.length, sha256: sha256(aberto) }, null, 2));
        return;
    }

    throw new Error('Use gerar-chave, criptografar ou descriptografar.');
}

if (require.main === module) {
    try { executarCli(); }
    catch (erro) {
        console.error(`FALHA: ${erro.message}`);
        process.exitCode = 1;
    }
}

module.exports = { FORMATO, sha256, criptografarBuffer, descriptografarBuffer, gerarChave };
