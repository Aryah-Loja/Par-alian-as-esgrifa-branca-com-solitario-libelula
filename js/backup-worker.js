importScripts('../vendor/jszip-3.10.1.min.js', 'backup-pacote.js' + self.location.search);
self.onmessage = async ({ data }) => {
    try {
        let ultimoProgresso = '';
        const blob = await empacotarBackupSeguro(data.manifest, data.registros, progresso => {
            const chave = `${progresso.fase}:${progresso.atual ?? progresso.percentual}`;
            if (chave !== ultimoProgresso) self.postMessage({ progresso });
            ultimoProgresso = chave;
        });
        self.postMessage({ blob });
    } catch (erro) { self.postMessage({ erro: erro.message }); }
};
