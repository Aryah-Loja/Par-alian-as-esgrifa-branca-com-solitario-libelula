/**
 * MAIN.JS — Ponto de entrada da aplicação.
 * Bloqueia desktop, sincroniza com a nuvem, preenche nomes, inicializa os
 * módulos e decide em que ponto da experiência retomar (loja / rastreio /
 * "Nossa História"), conforme o estágio salvo em aurora_stage.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // tela de bloqueio já exibida, para o resto da inicialização
    }

    await sincronizarNaAbertura();

    document.querySelectorAll('.js-nome').forEach(el => { el.textContent = NOME_DELA; });
    document.querySelectorAll('.js-nome-apelido').forEach(el => { el.textContent = NOME_DELA_APELIDO; });
    document.querySelectorAll('.js-nome-dele').forEach(el => { el.textContent = NOME_DELE; });

    bloquearZoom();
    iniciarFallbackImagensGlobais();
    await obterOuCriarDataPrimeiroAcesso();
    solicitarArmazenamentoPersistente();

    iniciarLoja();
    iniciarSuspense();
    iniciarModuloFuturo();
    iniciarModuloRomance();
    iniciarModuloExport();
    iniciarModuloSync();

    // Estágio da experiência: 'final' = já viu tudo; data de pedido definida
    // = pedido feito mas jornada interrompida (retoma de onde parou); nenhum
    // dos dois = ainda não começou (mostra a loja).
    const estagio = await obterConfiguracao('aurora_stage');
    if (estagio === 'final') {
        document.getElementById('maintenancePopup').style.display = 'none';
        desbloquearScrollFundoLembranca();
        await solicitarSenhaMemorias();
        goToRomancePage();
    } else {
        const dataPedidoExistente = await obterConfiguracao('aurora_data_pedido');
        if (dataPedidoExistente) {
            document.getElementById('maintenancePopup').style.display = 'none';
            desbloquearScrollFundoLembranca();
            definirFundoBody(CORES_FUNDO.escuro);
            document.getElementById('lojaScreen').style.display = 'none';
            document.getElementById('suspenseOverlay').style.display = 'flex';
            document.getElementById('loaderSuspense').classList.add('d-none');
            const videoJaGravado = await obterMedia('video_pedido');
            if (videoJaGravado) {
                finalizarSequencia();
            } else {
                iniciarRastreio();
            }
        } else {
            definirFundoBody(CORES_FUNDO.claro);
        }
    }

    verificarOrientacao();
    esconderVinhetaCarregamento();
});
