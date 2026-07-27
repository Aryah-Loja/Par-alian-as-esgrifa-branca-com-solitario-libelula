/* ============================================================
   SECRET.JS — Sistema de Códigos Secretos (100% independente)
   ============================================================
   Este arquivo NÃO reutiliza nenhuma função de login, cadastro,
   LocalStorage, IndexedDB, mensagens, timeline, pedidos ou
   qualquer outro sistema já existente no projeto Aurora Joias.
   Toda a lógica dos códigos vive aqui, isolada, pra que editar,
   remover ou adicionar um código no futuro nunca corra o risco
   de quebrar qualquer outra parte do site.

   COMO ADICIONAR UM NOVO CÓDIGO NO FUTURO:
   Acrescente uma nova entrada no objeto CODIGOS_SECRETOS logo
   abaixo, seguindo o mesmo formato das existentes (chave já em
   maiúsculo, sem acento e sem espaço). Nenhuma outra parte deste
   arquivo, nem de qualquer outro arquivo do projeto, precisa ser
   alterada.
   ============================================================ */

/**
 * Objeto central com todos os códigos secretos cadastrados.
 * Toda a lógica de validação usa SOMENTE este objeto.
 *
 * Campos de cada código (uso só administrativo, ela nunca vê):
 *  - nomeInterno: nome curto pra identificar o código
 *  - finalidade:  o que esse código libera
 *  - arquivo:     página aberta quando o código é aceito
 *  - descricao:   detalhe extra de controle
 *  - criadoEm:    data de criação deste código
 */
const CODIGOS_SECRETOS = {
    'X7KVM': {
        nomeInterno: 'codigo-carta',
        finalidade: 'Abre a carta romântica exclusiva',
        arquivo: 'secret/letter.html',
        descricao: 'Página isolada com uma carta emocionante, tema romântico, animações suaves.',
        criadoEm: '27/07/2026'
    },
    'Q3ZTN': {
        nomeInterno: 'codigo-video',
        finalidade: 'Abre a página do vídeo exclusivo',
        arquivo: 'secret/video.html',
        descricao: 'Player pronto pra receber o arquivo definitivo sem mexer na lógica da página.',
        criadoEm: '27/07/2026'
    },
    'W9LXR': {
        nomeInterno: 'codigo-vales',
        finalidade: 'Abre o livrinho de vales-presente do amor',
        arquivo: 'secret/coupon.html',
        descricao: 'Cada toque puxa um vale-presente aleatório de uma lista editável (ex.: hambúrguer do Grill, escolher o filme, massagem).',
        criadoEm: '27/07/2026'
    },
    'K4QWZ': {
        nomeInterno: 'codigo-bilhete',
        finalidade: 'Abre o bilhete da sorte apaixonado',
        arquivo: 'secret/fortune.html',
        descricao: 'Cada toque puxa uma mensagem/previsão romântica aleatória de uma lista editável, estilo bilhete de sorte.',
        criadoEm: '27/07/2026'
    },
    'R8NVX': {
        nomeInterno: 'codigo-roleta',
        finalidade: 'Abre a roleta de ideias de encontro',
        arquivo: 'secret/wheel.html',
        descricao: 'Roleta girável que sorteia uma ideia de encontro/programa de uma lista editável.',
        criadoEm: '27/07/2026'
    }
};

/**
 * Deixa o código digitado num formato único de comparação:
 * maiúsculo, sem acento e sem nenhum espaço (início, fim ou meio).
 * Assim "x7kvm", " X7 KVM ", "X7-KVM" e "X7KVM" caem todos na
 * mesma chave dentro de CODIGOS_SECRETOS.
 */
function normalizarCodigoSecreto(texto) {
    if (typeof texto !== 'string') return '';
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toUpperCase()
        .replace(/[\s-]+/g, ''); // remove espaços e hífens em qualquer posição
}

/**
 * Função completamente independente que recebe o código digitado,
 * valida contra CODIGOS_SECRETOS e abre a página correspondente.
 * Não toca em nenhum outro sistema do site.
 */
function handleSecretCode(codigoDigitado) {
    const codigoNormalizado = normalizarCodigoSecreto(codigoDigitado);

    if (!codigoNormalizado) {
        exibirFeedbackCodigoSecreto('Código inválido', 'erro');
        return;
    }

    const codigoEncontrado = CODIGOS_SECRETOS[codigoNormalizado];

    if (!codigoEncontrado) {
        exibirFeedbackCodigoSecreto('Código inválido', 'erro');
        return;
    }

    // Código certo: mostra uma pequena animação de sucesso antes de abrir
    // a página correspondente, em vez de trocar de tela instantaneamente.
    exibirFeedbackCodigoSecreto('', 'sucesso');
    setTimeout(function () {
        window.location.href = codigoEncontrado.arquivo;
    }, 850);
}

/**
 * Mostra o feedback visual do campo (mensagem de erro, ou a animação
 * de sucesso). Isolado só pro bloco de código secreto, não mexe em
 * nenhum outro elemento da página.
 */
function exibirFeedbackCodigoSecreto(mensagem, tipo) {
    const feedbackEl = document.getElementById('codigoSecretoFeedback');
    const inputEl = document.getElementById('codigoSecretoInput');

    if (feedbackEl) {
        feedbackEl.classList.remove('codigo-secreto-erro', 'codigo-secreto-sucesso');
        feedbackEl.textContent = mensagem;
        if (tipo === 'erro') feedbackEl.classList.add('codigo-secreto-erro');
        if (tipo === 'sucesso') feedbackEl.classList.add('codigo-secreto-sucesso');
    }

    if (inputEl) {
        inputEl.classList.remove('codigo-secreto-input-erro', 'codigo-secreto-input-sucesso');
        if (tipo === 'erro') {
            inputEl.classList.add('codigo-secreto-input-erro');
            setTimeout(function () {
                inputEl.classList.remove('codigo-secreto-input-erro');
            }, 400);
        }
        if (tipo === 'sucesso') {
            inputEl.classList.add('codigo-secreto-input-sucesso');
        }
    }
}

/* Liga o botão "Abrir" e a tecla Enter ao handleSecretCode(). Só faz
   isso se os elementos existirem na página (index.html), então este
   arquivo pode ser incluído em qualquer lugar sem quebrar nada. */
document.addEventListener('DOMContentLoaded', function () {
    const btnAbrir = document.getElementById('btnAbrirCodigoSecreto');
    const inputCodigo = document.getElementById('codigoSecretoInput');

    if (!btnAbrir || !inputCodigo) return;

    btnAbrir.addEventListener('click', function () {
        handleSecretCode(inputCodigo.value);
    });

    inputCodigo.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSecretCode(inputCodigo.value);
        }
    });
});
