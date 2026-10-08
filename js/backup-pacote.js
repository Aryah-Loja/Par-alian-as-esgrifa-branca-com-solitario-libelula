/* O mesmo empacotador é usado no worker, no navegador e nos testes. */
async function empacotarBackupSeguro(manifest, registros, progresso = () => {}) {
    const zip = new JSZip();
    const conhecidos = new Map();
    manifest.medias = [];
    manifest.estatisticas.medias = 0;
    manifest.estatisticas.bytesMidia = 0;
    const hash = async bytes => {
        if (typeof crypto === 'undefined' || !crypto.subtle) return null;
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    };
    const extensao = mime => {
        const tipo = String(mime || '').split(';')[0].trim();
        return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' })[tipo] || 'bin';
    };
    const midias = registros.filter(item => item.tipo !== 'diagnostico');
    for (let i = 0; i < midias.length; i++) {
        const registro = midias[i];
        progresso({ fase: 'midias', atual: i + 1, total: midias.length });
        const entrada = { id: registro.id, tipo: registro.tipo, subtipo: registro.subtipo || null, criadoEm: registro.criadoEm || Date.now(), atualizadoEm: registro.atualizadoEm || registro.criadoEm || Date.now(), excluidoEm: registro.excluidoEm || null };
        if (registro.otimizacao) entrada.otimizacao = registro.otimizacao;
        if (registro.blob) {
            if (!registro.blob.size) throw new Error(`A mídia "${registro.id}" está vazia. O backup anterior foi preservado.`);
            // Uma leitura por mídia serve tanto ao checksum quanto ao ZIP.
            const bytes = new Uint8Array(await registro.blob.arrayBuffer());
            entrada.sha256 = await hash(bytes);
            entrada.mimeType = registro.mimeType || registro.blob.type || null;
            entrada.tamanho = bytes.length;
            const chave = entrada.sha256 && `${entrada.sha256}:${entrada.tamanho}:${entrada.mimeType}`;
            const anterior = chave && conhecidos.get(chave);
            entrada.arquivo = anterior || `${registro.id}.${extensao(entrada.mimeType)}`;
            if (!anterior) {
                zip.file(`media/${entrada.arquivo}`, bytes);
                if (chave) conhecidos.set(chave, entrada.arquivo);
            }
            manifest.estatisticas.bytesMidia += bytes.length;
        } else if (typeof registro.texto === 'string') {
            entrada.texto = registro.texto;
            entrada.sha256Texto = await hash(new TextEncoder().encode(registro.texto));
        } else continue;
        manifest.medias.push(entrada);
    }
    manifest.estatisticas.medias = manifest.medias.length;
    zip.file('manifest.json', JSON.stringify(manifest), { compression: 'DEFLATE', compressionOptions: { level: 6 } });
    for (const arquivo of Object.values(zip.files)) arquivo.date = new Date('2000-01-01T00:00:00Z');
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE', streamFiles: true }, estado => progresso({ fase: 'arquivo', percentual: Math.floor(estado.percent) }));
    return new Blob([bytes], { type: 'application/zip' });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { empacotarBackupSeguro };
