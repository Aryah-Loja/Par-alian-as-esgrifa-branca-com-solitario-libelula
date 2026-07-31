/**
 * ============================================================================
 * CONFIG.JS — Painel de controle do projeto
 * ============================================================================
 * Este é o ÚNICO arquivo que você deve precisar editar no dia a dia.
 * Aqui ficam: os placeholders de mídia (Prioridade 3), os nomes, a história,
 * as perguntas, o quiz, a timeline, a playlist, as regras do contrato e os
 * textos principais do site.
 *
 * Nada neste arquivo depende de URLs temporárias — todo caminho de mídia usa
 * um identificador (ex: "imagem_casal_1") que é resolvido pela função
 * getAsset() lá embaixo. Basta colocar o arquivo real na pasta indicada,
 * com o nome indicado, que o site passa a usá-lo automaticamente.
 * ============================================================================
 */

/* ----------------------------------------------------------------------
   PESSOAS
   ---------------------------------------------------------------------- */
const NOME_DELA = "Ana Poloni"; // Como o site vai chamá-la na maior parte do tempo (Poloni também aparece em alguns textos)
const NOME_DELA_APELIDO = "Poloni";
const NOME_DELE = "Gabriel";
const NOME_DELE_COMPLETO = "Gabriel Schmeisk";

/* ----------------------------------------------------------------------
   IDENTIDADE FIXA DA EXPERIÊNCIA (sincronização entre aparelhos)
   ----------------------------------------------------------------------
   Diferente de um "código de compartilhamento" aleatório, este projeto é
   feito para UMA única pessoa e UMA única experiência. Por isso usamos um
   identificador FIXO: não importa em qual aparelho o link for aberto, ele
   sempre lê/escreve o mesmo registro na nuvem (ver js/sync.js). É isso que
   permite abrir o link puro (sem parâmetros na URL) em qualquer celular e
   ver exatamente o mesmo estado.
   Troque esta string se um dia for reaproveitar o projeto para outro
   casal, para não misturar dados de experiências diferentes.
   ---------------------------------------------------------------------- */
const EXPERIENCE_ID = 'aurora-ana-gabriel-namoro';

/* ----------------------------------------------------------------------
   VALORES PADRÃO DA HOME DA JOALHERIA
   ----------------------------------------------------------------------
   Preenchidos automaticamente nos campos de "Personalize seu pedido"
   assim que o site abre (podem ainda ser alterados manualmente na tela,
   caso necessário). Edite aqui para trocar os valores padrão de uma vez.
   ---------------------------------------------------------------------- */
const PEDIDO_PADRAO = {
    aroMasc: '19',
    aroFem: '13',
    aroSolitario: '13',
    gravacaoMasc: 'Poloni ♡ 14/06',
    gravacaoFem: 'Schmeisk ♡ 14/06'
};

/* ----------------------------------------------------------------------
   REGISTRO DE PLACEHOLDERS (PRIORIDADE 3)
   ----------------------------------------------------------------------
   Cada entrada representa um arquivo que você vai enviar para o GitHub.
   - "arquivo": nome exato do arquivo dentro de assets/img, assets/video ou
     assets/audio (mantenha esses nomes ou atualize aqui se preferir outros).
   - "tipo": "imagem" | "video" | "audio"
   - "descricao": o que deve aparecer nesse espaço.

   Enquanto o arquivo real não existir, o site mostra automaticamente um
   quadro elegante no lugar (sem imagem quebrada, sem link temporário).
   ---------------------------------------------------------------------- */
const PLACEHOLDERS = {
    // ---- Produto (loja falsa) ----
    imagem_produto_principal:   { arquivo: 'produto-principal.jpg',   tipo: 'imagem', descricao: 'Foto principal da "aliança" (pode ser qualquer foto de alianças/anéis genérica)' },
    imagem_produto_detalhe:     { arquivo: 'produto-detalhe.jpg',     tipo: 'imagem', descricao: 'Detalhe do solitário/libélula' },
    imagem_produto_estojo:      { arquivo: 'produto-estojo.jpg',      tipo: 'imagem', descricao: 'Aliança no estojo' },
    imagem_produto_par:         { arquivo: 'produto-par.jpg',         tipo: 'imagem', descricao: 'Par de alianças completo' },
    imagem_colecao_flor_rosa:   { arquivo: 'colecao-flor-rosa.jpg',   tipo: 'imagem', descricao: 'Destaque "coleção Flor Rosa"' },
    imagem_colecao_libelula:    { arquivo: 'colecao-libelula.jpg',    tipo: 'imagem', descricao: 'Destaque "coleção Libélula"' },
    imagem_colecao_prata:       { arquivo: 'colecao-prata.jpg',       tipo: 'imagem', descricao: 'Destaque "linha Prata 950"' },
    imagem_colecao_estojos:     { arquivo: 'colecao-estojos.jpg',     tipo: 'imagem', descricao: 'Destaque "estojos"' },
    imagem_relacionado_colar:   { arquivo: 'relacionado-colar.jpg',   tipo: 'imagem', descricao: '"Você também pode gostar" — colar' },
    imagem_relacionado_brinco:  { arquivo: 'relacionado-brinco.jpg',  tipo: 'imagem', descricao: '"Você também pode gostar" — brinco' },
    imagem_relacionado_pulseira:{ arquivo: 'relacionado-pulseira.jpg',tipo: 'imagem', descricao: '"Você também pode gostar" — pulseira' },
    imagem_relacionado_estojo:  { arquivo: 'relacionado-estojo.jpg',  tipo: 'imagem', descricao: '"Você também pode gostar" — estojo' },

    // ---- Casal / galeria de suspense ----
    imagem_casal_1: { arquivo: 'casal-1.jpg', tipo: 'imagem', descricao: 'Foto do casal — usada na galeria de polaroids durante o suspense' },
    imagem_casal_2: { arquivo: 'casal-2.jpg', tipo: 'imagem', descricao: 'Foto do casal — galeria de polaroids' },
    imagem_casal_3: { arquivo: 'casal-3.jpg', tipo: 'imagem', descricao: 'Foto do casal — galeria de polaroids' },
    imagem_foto_final: { arquivo: 'foto-final.jpg', tipo: 'imagem', descricao: 'Foto principal exibida logo após a "identidade confirmada"' },

    // ---- Flashback cinematográfico ----
    imagem_flashback_1: { arquivo: 'flashback-1.jpg', tipo: 'imagem', descricao: 'Flashback — A mais linda' },
    imagem_flashback_2: { arquivo: 'flashback-2.jpg', tipo: 'imagem', descricao: 'Flashback — "A mais doce"' },
    imagem_flashback_3: { arquivo: 'flashback-3.jpg', tipo: 'imagem', descricao: 'Flashback — "A mais amorosa' },
    imagem_flashback_4: { arquivo: 'flashback-4.jpg', tipo: 'imagem', descricao: 'Flashback — "A mais loba?' },
    imagem_flashback_5: { arquivo: 'flashback-5.jpg', tipo: 'imagem', descricao: 'Flashback — "e a partir de hoje, minha namorada' },

    // ---- Timeline (Nossa História) ----
    // Igual bichos/mapa: só salvar o arquivo como .jpg com esse nome
    // base em assets/img/, sem precisar editar nada aqui.
    imagem_timeline_1: { arquivoBase: 'timeline-1', tipo: 'imagem', descricao: 'Timeline — quando você comentou com a Vitória / dias antes de se conhecerem' },
    imagem_timeline_2: { arquivoBase: 'timeline-2', tipo: 'imagem', descricao: 'Timeline — 11/05, carona e primeira conversa de verdade' },
    imagem_timeline_3: { arquivoBase: 'timeline-3', tipo: 'imagem', descricao: 'Timeline — 30/05, primeiro encontro no Colina (Orlândia) e o beijo' },
    imagem_timeline_4: { arquivoBase: 'timeline-4', tipo: 'imagem', descricao: 'Timeline — o dia do atoleiro na estrada de terra' },
    imagem_timeline_5: { arquivoBase: 'timeline-5', tipo: 'imagem', descricao: 'Timeline — despedida do Slinky / acolhimento da família dela' },
    imagem_timeline_6: { arquivoBase: 'timeline-6', tipo: 'imagem', descricao: 'Timeline — 14/06, o "eu te amo" depois da Brooks' },
    imagem_timeline_7: { arquivoBase: 'timeline-7', tipo: 'imagem', descricao: 'Timeline — 20/07, apresentação pros avós em Santa Rosa de Viterbo, Parque Curupira e o balanço em Sales de Oliveira' },
    imagem_timeline_8: { arquivoBase: 'timeline-8', tipo: 'imagem', descricao: 'Timeline — 12/07, o dia em Nuporanga que acabei conhecendo o tio e a tia dela' },
    imagem_timeline_9: { arquivoBase: 'timeline-9', tipo: 'imagem', descricao: 'Timeline — 26/07, o dia que ela conheceu minha casa de verdade e eu voltei na casa do tio dela' },
    imagem_timeline_hoje: { arquivoBase: 'timeline-hoje', tipo: 'imagem', descricao: 'Timeline — foto de hoje, marcando o dia do pedido' },

    // ---- Nossos momentos (mesa de fotos) ----
    imagem_momento_1: { arquivo: 'momento-1.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_2: { arquivo: 'momento-2.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_3: { arquivo: 'momento-3.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_4: { arquivo: 'momento-4.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },

    // ---- Seus bichos (clique no nome de cada um abre a foto) ----
    // "arquivoBase" (sem extensão) em vez de "arquivo": o arquivo deve
    // ser salvo como .jpg — não precisa editar nada aqui além de colocar
    // o arquivo na pasta (ver resolverFotoPlaceholder).
    bicho_koda: { arquivoBase: 'bicho-koda', tipo: 'imagem', descricao: 'Koda' },
    bicho_xixico: { arquivoBase: 'bicho-xixico', tipo: 'imagem', descricao: 'Xixico' },
    bicho_kovu: { arquivoBase: 'bicho-kovu', tipo: 'imagem', descricao: 'Kovu' },
    bicho_yuk: { arquivoBase: 'bicho-yuk', tipo: 'imagem', descricao: 'Yuk' },
    bicho_ahadi: { arquivoBase: 'bicho-ahadi', tipo: 'imagem', descricao: 'Ahadi' },
    bicho_shury: { arquivoBase: 'bicho-shury', tipo: 'imagem', descricao: 'Shury' },
    bicho_sol: { arquivoBase: 'bicho-sol', tipo: 'imagem', descricao: 'Sol' },
    bicho_lua: { arquivoBase: 'bicho-lua', tipo: 'imagem', descricao: 'Lua' },
    bicho_negao: { arquivoBase: 'bicho-negao', tipo: 'imagem', descricao: 'Negão (em memória)' },
    bicho_slinky: { arquivoBase: 'bicho-slinky', tipo: 'imagem', descricao: 'Slinky (em memória)' },
    bicho_tommy: { arquivoBase: 'bicho-tommy', tipo: 'imagem', descricao: 'Tommy (em memória)' },
    bicho_anne: { arquivoBase: 'bicho-anne', tipo: 'imagem', descricao: 'Anne (em memória)' },
    bicho_iris: { arquivoBase: 'bicho-iris', tipo: 'imagem', descricao: 'Iris (em memória)' },

    // ---- Fotos de cada local do "Nosso mapa" ----
    mapa_colina: { arquivoBase: 'mapa-colina', tipo: 'imagem', descricao: 'Colina, Orlândia' },
    mapa_brooks: { arquivoBase: 'mapa-brooks', tipo: 'imagem', descricao: 'Brooks, Franca' },
    mapa_estrada: { arquivoBase: 'mapa-estrada', tipo: 'imagem', descricao: 'A estrada de terra' },
    mapa_santa_rosa: { arquivoBase: 'mapa-santa-rosa', tipo: 'imagem', descricao: 'Santa Rosa de Viterbo' },
    mapa_curupira: { arquivoBase: 'mapa-curupira', tipo: 'imagem', descricao: 'Parque Curupira' },
    mapa_familia: { arquivoBase: 'mapa-familia', tipo: 'imagem', descricao: 'A família, casa do tio dela' },
    mapa_balanco: { arquivoBase: 'mapa-balanco', tipo: 'imagem', descricao: 'O balanço em Sales de Oliveira' },
    mapa_nuporanga: { arquivoBase: 'mapa-nuporanga', tipo: 'imagem', descricao: 'Nuporanga' },
    mapa_verace: { arquivoBase: 'mapa-verace', tipo: 'imagem', descricao: 'Verace, Ribeirão Preto' },
    mapa_praca_bike: { arquivoBase: 'mapa-praca-bike', tipo: 'imagem', descricao: 'Praça da Bike, Ribeirão Preto' },
    mapa_cruzeiro: { arquivoBase: 'mapa-cruzeiro', tipo: 'imagem', descricao: 'Cruzeiro, São Simão' },
    mapa_mostarda: { arquivoBase: 'mapa-mostarda', tipo: 'imagem', descricao: 'Mostarda, São Joaquim da Barra' },
    mapa_proximo: { arquivoBase: 'mapa-proximo', tipo: 'imagem', descricao: 'Próximo destino' },

    // ---- Áudio ----
    audio_nossa_musica: { arquivo: 'nossa-musica.mp3', tipo: 'audio', descricao: 'A trilha que toca ao abrir a carta final (ex: Um Dia Te Levo Comigo)' },
    audio_playlist_1: { arquivo: 'playlist-1.mp3', tipo: 'audio', descricao: 'Faixa 1 da playlist do casal' },
    audio_playlist_2: { arquivo: 'playlist-2.mp3', tipo: 'audio', descricao: 'Faixa 2 da playlist do casal' },
    audio_playlist_3: { arquivo: 'playlist-3.mp3', tipo: 'audio', descricao: 'Faixa 3 da playlist do casal' },
    audio_playlist_4: { arquivo: 'playlist-4.mp3', tipo: 'audio', descricao: 'Faixa 4 da playlist do casal' },
};

/**
 * Devolve a URL utilizável de um placeholder. Sempre aponta para a pasta
 * local de assets — nunca para um link temporário externo.
 */
function getAsset(id) {
    const item = PLACEHOLDERS[id];
    if (!item) { console.warn(`Placeholder desconhecido: ${id}`); return ''; }
    const pasta = item.tipo === 'imagem' ? 'assets/img' : (item.tipo === 'video' ? 'assets/video' : 'assets/audio');
    return `${pasta}/${item.arquivo}`;
}

/**
 * Resolve a foto de um placeholder "por nome" (arquivoBase, sem extensão
 * fixa) — o arquivo precisa estar salvo como .jpg em assets/img/.
 * Usada hoje pelas fotos de "Seus bichos" (ver PLACEHOLDERS acima).
 * Se o arquivo não existir, devolve um SVG de espaço reservado (com a
 * legenda do item) em vez de quebrar como imagem ausente.
 */
const __cacheResolverFotoPlaceholder = {};
async function resolverFotoPlaceholder(id) {
    if (id in __cacheResolverFotoPlaceholder) return __cacheResolverFotoPlaceholder[id];

    const item = PLACEHOLDERS[id];
    if (!item || !item.arquivoBase) {
        console.warn(`resolverFotoPlaceholder: placeholder "${id}" não tem arquivoBase configurado.`);
        return gerarSvgPlaceholderComLegenda(item ? item.descricao : id);
    }

    const caminho = `assets/img/${item.arquivoBase}.jpg`;
    if (await arquivoExisteNoServidor(caminho)) {
        __cacheResolverFotoPlaceholder[id] = caminho;
        return caminho;
    }

    // Arquivo ainda não foi adicionado na pasta. Não guarda esse "não
    // encontrado" no cache (diferente do sucesso), assim, se a foto for
    // adicionada depois sem recarregar a página, uma nova tentativa ainda
    // pode encontrar.
    return gerarSvgPlaceholderComLegenda(item.descricao);
}

/**
 * Igual a resolverFotoPlaceholder, mas recebe o "arquivoBase" diretamente
 * em vez de um id cadastrado em PLACEHOLDERS. Usada pelos locais do "Nosso
 * mapa" adicionados pelo painel (diagnostico.html → "Adicionar local ao
 * mapa"), que não passam por PLACEHOLDERS — o nome do arquivo é gerado
 * automaticamente a partir do nome do local, e o Gabriel só precisa
 * salvar a foto em assets/img/ com esse nome, no formato .jpg.
 */
const __cacheResolverFotoPorBase = {};
async function resolverFotoPorBase(arquivoBase, legenda) {
    if (!arquivoBase) return gerarSvgPlaceholderComLegenda(legenda);
    if (arquivoBase in __cacheResolverFotoPorBase) return __cacheResolverFotoPorBase[arquivoBase];

    const caminho = `assets/img/${arquivoBase}.jpg`;
    if (await arquivoExisteNoServidor(caminho)) {
        __cacheResolverFotoPorBase[arquivoBase] = caminho;
        return caminho;
    }

    return gerarSvgPlaceholderComLegenda(legenda);
}

/* ----------------------------------------------------------------------
   GALERIA DE LEMBRANÇAS (página própria — galeria.html)
   ----------------------------------------------------------------------
   Simples de propósito: o site descobre sozinho quantos itens existem e
   se cada um é foto ou vídeo, só pela extensão do arquivo. Você não
   precisa contar nem classificar nada.

   Salve as fotos e vídeos dentro de assets/img/galeria/ sempre com o
   nome "galeria_" + número em sequência, começando em 1:

       galeria_1.jpg
       galeria_2.mp4      <- um vídeo, nesse exemplo (funciona igual pra foto)
       galeria_3.jpg
       ...

   Para adicionar um novo item, só salve o arquivo com o próximo número
   da sequência. Não precisa editar nenhum arquivo do projeto — nem
   contar quantos itens existem, nem dizer se é foto ou vídeo (o site vê
   sozinho pela extensão do arquivo: .jpg = foto, .mp4 = vídeo).

   O site para de procurar depois de alguns números seguidos sem
   encontrar nada — então, DENTRO de cada faixa (ver
   GALERIA_INICIO_VIDEOS abaixo), não precisa se preocupar em deixar
   buracos pequenos na numeração.

   MARGEM DE SEGURANÇA ENTRE FOTOS E VÍDEOS: por padrão, fotos e vídeos
   dividem a mesma sequência de números, então inserir uma foto nova no
   meio obrigaria a renumerar todo vídeo que viesse depois dela. Pra
   evitar isso, o site varre a galeria em DUAS faixas separadas:
   de 1 até (GALERIA_INICIO_VIDEOS - 1) pra fotos, e de
   GALERIA_INICIO_VIDEOS em diante pra vídeos — cada faixa com sua
   própria tolerância a buracos, então uma faixa vazia não atrapalha a
   outra. Isso dá uma margem despreocupada: pode ir salvando fotos novas
   (galeria_1, galeria_2, ...) até o número logo abaixo do valor de
   GALERIA_INICIO_VIDEOS sem nunca precisar renomear vídeo nenhum. Se um
   dia chegar perto do limite, basta AUMENTAR o valor de
   GALERIA_INICIO_VIDEOS (não precisa renomear nada, só abre mais espaço
   pra fotos) — só não pode DIMINUIR se já existir vídeo com número menor
   que o novo valor, senão ele passaria a ser varrido na faixa errada
   (não teria problema técnico, ele ainda seria achado, só ficaria fora
   da faixa "oficial" dele).

   VÍDEOS DO YOUTUBE (sem precisar do arquivo — ótimo pra vídeos
   grandes): como esses não são um arquivo local, adicione o link numa
   lista à parte, em GALERIA_YOUTUBE (abaixo). Roda embutido dentro do
   site (não abre o app/site do YouTube). Recomendo subir como "Não
   listado" no YouTube, assim só quem tem o link acessa.

   Legendas são opcionais (funcionam para foto, vídeo local ou vídeo do
   YouTube): para dar uma frase a uma foto/vídeo local específico,
   adicione uma entrada em GALERIA_LEGENDAS usando o mesmo número do
   arquivo; para um vídeo do YouTube, escreva a legenda junto dele em
   GALERIA_YOUTUBE.
   ---------------------------------------------------------------------- */
const PASTA_GALERIA = 'assets/img/galeria';

// A partir de qual número os VÍDEOS começam — tudo abaixo disso é faixa
// reservada pra fotos (ver explicação completa acima). 101 dá margem pra
// 100 fotos (galeria_1 a galeria_100) sem mexer em vídeo nenhum; aumente
// esse número quando quiser mais espaço.
const GALERIA_INICIO_VIDEOS = 101;

const GALERIA_LEGENDAS = {
    1: 'Você me cativa.',
    2: 'Sua companhia me deixa feliz.',
    3: 'Você ilumina qualquer lugar.',
    4: 'Você é meu sossego.',
    5: 'Você é espontânea.',
    6: 'Você tem um coração sincero.',
    7: 'Você faz o simples ser inesquecível.',
    8: 'Você é extraordinária.',
    9: 'Seu sorriso é viciante.',
    10: 'Você é delicada sem ser frágil.',
    11: 'Você é o meu lugar favorito.',
    12: 'Você é forte.',
    13: 'Você é rara.',
    14: 'Você tem uma calma bonita.',
    15: 'Você deixa tudo mais leve.',
    16: 'Você é admirável.',
    17: 'Você sorri com a alma.',
    18: 'Você é o meu melhor acaso.',
    19: 'Você é fascinante.',
    20: 'Você é minha paz.',
    21: 'Você é gentil.',
    22: 'Você é mais bonita do que imagina.',
    23: 'Você tem um abraço que cura.',
    24: 'Você faz meu coração desacelerar.',
    25: 'Você é singular.',
    26: 'Seu jeitinho é único.',
    27: 'Você é inesquecível.',
    28: 'Você é meu porto seguro.',
    29: 'Você tem um brilho diferente.',
    30: 'Você é minha felicidade favorita.',
    31: 'Você é cativante.',
    32: 'Você faz qualquer dia valer a pena.',
    33: 'Você é doce na medida certa.',
    34: 'Você me inspira.',
    35: 'Você é meu lar.',
    36: 'Você é simplesmente você.',
    37: 'Você transforma momentos em memórias.',
    38: 'Você é linda até distraída.',
    39: 'Você faz o tempo passar depressa.',
    40: 'Você é tudo o que eu pedi a Deus.',
    41: 'Você é acolhedora.',
    42: 'Você é a minha melhor escolha.',
    43: 'Você faz meu mundo mais bonito.',
    44: 'Você é um presente.',
    45: 'Você é meu capítulo favorito.',
    46: 'Você é minha pessoa favorita.',
    47: 'Você é o melhor dos meus dias.',
    48: 'Você sempre será a minha resposta.'
    49: 'teste.'
};

/* Vídeos do YouTube (não precisam de arquivo — ver explicação acima).
   Cole o link como veio do "Compartilhar" do YouTube (celular ou
   navegador) — aceita inclusive links curtos youtu.be e Shorts. */
const GALERIA_YOUTUBE = [
    // { link: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', legenda: 'Legenda opcional' },
];

/**
 * Extrai só o ID do vídeo de qualquer formato de link que o YouTube
 * costuma gerar (watch?v=, youtu.be/, shorts/, embed/) — ou devolve o
 * próprio valor se já for só o ID (assim a pessoa pode colar o link
 * inteiro sem se preocupar em "limpar" ele antes).
 */
function extrairIdYoutube(valor) {
    if (!valor) return '';
    const texto = String(valor).trim();
    const padroes = [
        /youtu\.be\/([a-zA-Z0-9_-]{6,20})/,
        /[?&]v=([a-zA-Z0-9_-]{6,20})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,20})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,20})/
    ];
    for (const padrao of padroes) {
        const m = texto.match(padrao);
        if (m) return m[1];
    }
    return texto; // já era só o ID (ou algo não reconhecido — usa como veio)
}

/* Extensão padronizada para descoberta automática — ver montarGaleria() em
 * js/galeria.js. Fotos sempre em .jpg (minúsculo) e vídeos sempre em .mp4
 * (minúsculo) — nenhuma outra extensão nem variação de maiúscula/minúscula
 * é testada. */
const EXTENSOES_FOTO_ACEITAS = ['jpg'];
const GALERIA_EXTENSOES_FOTO = EXTENSOES_FOTO_ACEITAS;
const GALERIA_EXTENSOES_VIDEO = ['mp4'];

/* Extensões de áudio aceitas em qualquer lugar do site que resolve um
 * áudio "por nome", sem precisar dizer a extensão exata em config.js —
 * mesmo espírito de GALERIA_EXTENSOES_VIDEO, mas pra arquivos estáticos
 * de áudio colocados direto em assets/audio/ (ver resolverAudioPorBase
 * mais abaixo). Hoje usada pela música especial de aniversário. */
const AUDIO_EXTENSOES_ACEITAS = ['mp3', 'ogg', 'wav', 'm4a'];

/* ----------------------------------------------------------------------
   NOSSA HISTÓRIA — LINHA DO TEMPO
   ---------------------------------------------------------------------- */
const TIMELINE_MARCOS = [
    {
        data: 'Antes de tudo',
       texto: `A primeira vez que eu te vi foi alguns dias antes da gente realmente se conhecer. Você estava andando pelo refeitório da UNIP junto com a Vitória e nao pude deixar de perceber sua beleza. Naquele mesmo dia, já dentro da van, falei para a Vitória: "Sua amiga de cabelo loiro é uma gata." Ela, sendo a fofoqueira oficial da história, fez questão de tentar me fazer te chamar kk, me disse para te adicionar no Instagram, mas eu fiquei com vergonha. Passei alguns dias pensando em uma boa estratégia pra te chamar... e, no fim das contas, foi você quem me adicionou primeiro. Mal sabia eu que aquele simples clique seria o começo da história mais bonita da minha vida.`,
        foto: 'imagem_timeline_1'
    },
    {
        data: '11 de maio',
        texto: `Nosso primeiro encontro de verdade aconteceu no dia 11 de maio, a Vitória pediu uma carona depois da faculdade e você veio junto. Desde os primeiros minutos a conversa simplesmente fluía, parecia que a gente já se conhecia há muito tempo. Rimos, conversamos sobre um monte de coisas e, quando a viagem acabou, fiquei com aquela sensação boa de querer conversar mais com você. Nos dias seguintes continuei te dando carona e procurava qualquer oportunidade para estar perto; Até que um dia, por pura coincidência... ou nem tanto assim, seu power bank acabou ficando comigo rsrs. Confesso que não fiz muita questão de devolver imediatamente. Afinal, era a desculpa perfeita para continuar falando com você e conhecer um pouquinho mais da menina que, sem perceber, já estava ocupando meus pensamentos.`,
        foto: 'imagem_timeline_2'
    },
    {
        data: '30 de maio',
        texto: `Chegou então o dia do nosso primeiro encontro. Marcamos às 20h30, no Colina, em Orlândia. Na prática, o relógio já se aproximava das 22h quando você finalmente chegou... porque alguém resolveu demorar uma eternidade para ficar pronta, mas, sinceramente? Eu esperaria o tempo que fosse necessário. Quando você apareceu, toda arrumada, eu fiquei completamente sem palavras, çembro até hoje do brilho dos seus olhos e de como eu só conseguia pensar no quanto você era perfeita, atrasasa, mas perfeita. Depois de conversar bastante, fomos para o carro e passamos horas ali, estacionados em frente à praça, falando sobre a vida, rindo, vendo gatos pretos vagando pela rua e nos conhecendo melhor. Eu queria muito te beijar, mas a coragem simplesmente não aparecia, já estava quase ligando o carro para ir embora quando você olhou para mim, sorriu e perguntou: "E o nosso beijo, nada?". Naquele instante, o mundo pareceu parar, nosso primeiro beijo foi exatamente como eu imaginava... ou talvez até melhor. Foi ali que tudo começou de verdade, e foi naquele momento que eu tive a sensação de que havia encontrado a mulher da minha vida.`,
        foto: 'imagem_timeline_3'
    },
    {
        data: 'Um momento difícil',
        texto: `Nem todos os nossos momentos foram fáceis, também enfrentamos dias que colocaram nosso coração à prova, e tudo isso aconteceu quando nossa história ainda estava só começando. Na verdade, eu mal te conhecia, mas já sentia uma vontade enorme de cuidar de você. Um desses momentos foi quando levamos o Slinky ao veterinário, eu vi de perto a dor que você sentiu, porque sabia o quanto ele era especial e o quanto tinha feito parte da sua vida, principalmente por ter estado ao seu lado em um dos momentos mais difíceis que você já viveu, mas também vi a mulher forte que você é, porque, sinceramente, não sei se eu teria sido tão forte quanto você foi. Se eu pudesse, teria tirado toda aquela tristeza do seu coração, mas como isso não estava ao meu alcance, escolhi fazer a única coisa que eu podia, permanecer ao seu lado em cada segundo. Foi nesse momento que também conheci sua família de verdade, busquei seu pai no trabalho, conversei com sua mãe, conheci seu irmão e, mesmo em circunstâncias tão delicadas, fui recebido com um carinho que jamais vou esquecer. Talvez não tenha sido a forma como eu imaginava conhecer as pessoas mais importantes da sua vida, mas hoje percebo que aquele dia também fez parte da nossa história, porque foi ali que entendi que amar alguém não é apenas compartilhar os momentos felizes, é permanecer quando tudo parece pesado, é segurar a mão da pessoa que você ama quando ela mais precisa, e foi nesse dia que tive ainda mais certeza de que queria caminhar ao seu lado em todos os capítulos da nossa história.`,
        foto: 'imagem_timeline_5'
    },
    {
        data: '14 de junho',
        texto: `O dia 14 de junho sempre vai ter um lugar especial no meu coração, e talvez seja por isso que essa data também esteja marcada nas nossas alianças, como um símbolo de tudo que começou naquele momento. Naquela noite, depois de sairmos da Brooks, ficamos mais um tempo dentro do carro, como já estava virando costume, conversando sobre tudo e sobre nada ao mesmo tempo. Foi ali que, pela primeira vez, criei coragem para dizer as três palavras que já faziam tempo que estavam presas dentro de mim: "eu te amo". Você sorriu e respondeu exatamente do mesmo jeito, e naquele instante parecia que tudo tinha se encaixado. A verdade é que nós dois já sentíamos aquilo há algum tempo, você já tinha deixado escapar alguns "amor" antes, mas naquele dia foi diferente, porque transformamos em palavras algo que o nosso coração já sabia. Foi o dia em que a nossa história ganhou um novo significado, o dia em que escolhemos oficialmente caminhar um ao lado do outro. E como se aquele momento já não fosse perfeito o bastante, "Um Dia Te Levo Comigo" tocava ao fundo, sem que a gente imaginasse que aquela música se tornaria a trilha sonora da nossa história. Hoje, quando ela toca, eu volto exatamente para aquele carro, para aquele momento e para a certeza que senti naquele dia: era você quem eu queria levar comigo, não apenas em uma música, mas em todos os dias da minha vida. E agora, sempre que olharmos para nossas alianças e vermos essa data gravada, vamos lembrar que tudo começou ali, com um simples "eu te amo" que mudou completamente a nossa história.`,
        foto: 'imagem_timeline_6'
    },
    {
        data: '21 de junho',
        texto: `Em uma das nossas aventuras, acabamos indo parar em uma estrada de terra e, como era de se esperar, a situação saiu um pouco do planejado. O carro atolou de vez, eu me sujei inteiro de barro tentando tirar ele dali, perdi até o triângulo no meio daquela confusão e, mesmo com tudo dando errado, a gente (ou você) não conseguiu parar de rir. No fim, aquele que poderia ter sido apenas um momento de estresse virou uma das nossas lembranças mais engraçadas. Acho que é isso que eu mais gosto na gente, qualquer situação fica melhor quando estou com você, porque até os perrengues se transformam em histórias que vamos lembrar sorrindo. Com você eu aprendi que não são apenas os momentos perfeitos que fazem uma história ser especial, mas também aqueles em que tudo sai diferente do planejado e, ainda assim, a gente olha um para o outro e pensa: "isso vai virar uma boa lembrança".`,
        foto: 'imagem_timeline_4'
    },
    {
        data: '12 de julho',
       texto: `Um dia, depois de comermos um lanche, fomos para Nuporanga apenas de passagem, porque iríamos ao Feartem. No caminho, passamos pela casa dos seus tios, a ideia era ser algo rápido, você só precisava usar o banheiro e depois continuaríamos o passeio. Lembro que você estava com vergonha de usar o banheiro da minha casa quando passamos lá antes, então acabou sendo uma solução simples que, sem a gente imaginar, virou mais um capítulo da nossa história. Enquanto você estava lá, seus tios pediram para eu entrar e, de repente, eu estava conhecendo mais uma parte importante da sua vida, sem estar preparado para aquele momento. Confesso que bateu aquele nervosismo, porque nossa história ainda era muito recente e tudo estava acontecendo muito rápido, mas ao mesmo tempo foi especial perceber que, aos poucos, eu começava a fazer parte do seu mundo. No final, aquilo que era para ser apenas uma parada rápida antes do Feartem acabou virando mais uma lembrança nossa, daquelas situações inesperadas que a vida coloca no caminho e que depois fazem a gente sorrir quando lembra.`,
        foto: 'imagem_timeline_8'
    },
    {
        data: '20 de julho',
      texto: `Te levei para conhecer meus avós, em Santa Rosa de Viterbo, um daqueles momentos em que eu percebi que, aos poucos, você estava entrando cada vez mais na minha vida. Depois fomos passear no Parque Curupira, em Ribeirão Preto, aproveitamos o dia juntos e, no final, acabamos sentados em um balanço em Sales de Oliveira, apenas nós dois, conversando e aproveitando aquele momento simples, mas especial. Eu lembro do seu jeito naquele dia, parecia que você estava esperando que algo acontecesse, como se imaginasse que aquele seria o momento do pedido de namoro. E a verdade é que eu também queria muito que fosse, talvez mais do que você imaginava, porque naquele momento eu já tinha certeza do que sentia por você. Só que existia um pequeno detalhe, as nossas alianças ainda não tinham chegado. Eu queria que tudo fosse especial, queria que aquele momento tivesse o significado que você merece, então guardei aquela vontade, esperei mais um pouco e trouxe ela para este dia. Hoje eu vejo que valeu a pena esperar, porque algumas coisas simplesmente precisam acontecer no momento certo.`,
      foto: 'imagem_timeline_7'
    },
    {
        data: '26 de julho',
        texto: `Você conheceu minha casa de verdade, oficialmente, dessa vez kkkkk, foi um momento em que eu pude te receber no meu espaço, mostrar um pouco mais da minha vida e deixar você fazer parte dela. Depois, voltei com você à casa do seu tio, mas dessa vez foi diferente daquela primeira vez em que eu "escapei" de conhecer todo mundo sem nem estar preparado. Agora foi no momento certo, com calma, e eu finalmente pude conhecer 1% dos seus primos, sua avó e conversar melhor com sua mãe. Confesso que eu estava um pouco ansioso, queria que tudo acontecesse da melhor forma possível, mas no final deu tudo certo. Fiquei aliviado e feliz por perceber que tinha valido a pena esperar, porque algumas coisas realmente precisam acontecer no tempo certo. E como quase sempre acontece com a gente, depois de um dia cheio de momentos especiais, terminamos do jeito que eu mais gosto, juntinhos, assistindo mais um episódio da nossa primeira série juntos, criando mais uma daquelas pequenas lembranças que, no futuro, vão parecer simples, mas que para mim sempre terão um significado enorme.`,
        foto: 'imagem_timeline_9'
    },
    {
        data: '01 de agosto',
        texto: `E hoje, enquanto escrevo isso, ainda não sei como essa história vai continuar. Estou fazendo tudo às escondidas, sem saber se esse pedido vai acontecer exatamente como imaginei, se você vai se emocionar, se alguma coisa vai sair diferente do planejado ou até se algum detalhe vai dar errado no caminho. Mas, mesmo sem saber o final desse momento, existe uma coisa que eu tenho certeza: tudo isso foi feito com o coração mais sincero que eu poderia ter.

Mesmo com pouco tempo juntos, parece que a gente se conhece há anos. É uma sensação difícil de explicar, como se a vida tivesse preparado o caminho para que nossos mundos se encontrassem no momento certo. Eu tenho a certeza de que encontrei o amor da minha vida, e acredito de verdade que foi Deus quem colocou você no meu caminho.

Talvez hoje, quando você estiver lendo isso, eu já saiba como foi esse momento que tanto imaginei, talvez tenha sido exatamente como planejei ou talvez tenha sido completamente diferente, mas espero que, independente de qualquer coisa, você consiga sentir o principal: o quanto eu amo você. Porque antes mesmo de saber o resultado desse pedido, antes mesmo de saber como seria esse dia, eu já sabia de uma coisa... eu queria viver a minha história ao seu lado.`,
        foto: 'imagem_timeline_hoje',
        ehPedido: true
    }
];

/* ----------------------------------------------------------------------
   PERGUNTAS ROMÂNTICAS — "Enquanto confirmamos seu pedido"
   ----------------------------------------------------------------------
   O botão "Não" nunca é clicável de verdade (ver suspense.js), então as
   duas opções podem ser lidas como duas formas diferentes de dizer "sim".
   ---------------------------------------------------------------------- */
const PERGUNTAS_SUSPENSE = [
    {
        texto: `Notamos que esse modelo de aliança tem um valor bem alto. Antes de continuarmos, você confirma que tem certeza da pessoa que vai usá-la?`,
        sim: `Confirmo, tenho toda certeza`,
        nao: `Deixa eu pensar melhor`
    },
    {
        texto: `Nosso sistema também perguntou: você tem noção de quando esse pedido vai ser entregue? A pessoa que vai receber deve estar bem ansiosa.`,
        sim: `Não faço a minima ideia, e a ansiedade é mútua`,
        nao: `Sim, já tenho data marcada`
    },
    {
        texto: `Última confirmação antes de fechar esse pedido: você tá certa dessa escolha, nos dias fáceis e principalmente nos difíceis?`,
        sim: `Tô certa(o), sem dúvida nenhuma`,
        nao: `Preciso pensar mais um pouco`
    }
];

/* ----------------------------------------------------------------------
   QUIZ DO CASAL
   ----------------------------------------------------------------------
   CORREÇÃO: a versão antiga se chamava "o quanto você me conhece?" mas
   as perguntas eram só sobre ELA (flor favorita dela, bichos dela...) —
   não fazia sentido pedir pra ela "provar" que conhece a própria vida.
   Agora é um quiz do casal de verdade: fatos e histórias dos dois juntos.
   Edite as opções e o índice de "certa" (começando em 0) se quiser
   ajustar algo.
   ---------------------------------------------------------------------- */
const QUIZ_PERGUNTAS = [
    {
        pergunta: 'Qual foi o dia do nosso primeiro "eu te amo"?',
        opcoes: ['30 de maio', '14 de junho', '20 de julho', '8 de agosto'],
        certa: 1,
        certoMsg: 'Isso mesmo, 14 de junho, no carro depois de sair da Brooks 💛',
        erradoMsg: 'Foi 14 de junho, no carro, depois de sair da Brooks. Nossa data oficial.'
    },
    {
        pergunta: 'Eu te amo, tal qual...?',
        opcoes: ['O Chaves ama sanduíche de presunto', 'o gato ama um cochilo', 'a novela ama final feliz', 'ninguém ama nada poha'],
        certa: 0,
        certoMsg: 'Isso, sempre foi assim e sempre vai ser 😄',
        erradoMsg: 'Tal qual o Chaves ama sanduíche de presunto. Nosso código, não esquece mais!'
    },
    {
        pergunta: 'Qual é o nosso restaurante preferido?',
        opcoes: ['Esquinão', 'Alô Gordão', 'Alex Lanches', 'O Brooks'],
        certa: 3,
        certoMsg: 'O Brooks! 4 opções de lanches veganos, ta doido 🍔',
        erradoMsg: 'É o Brooks zé mané. Clássico nosso.'
    },
    {
        pergunta: 'Quando o carro atolou naquela estrada de terra, o que eu tentei usar pra tirar o carro do buraco?',
        opcoes: ['Cana de Açucar', 'Um tábua', 'O triângulo do carro', 'Chamamos o guincho direto'],
        certa: 2,
        certoMsg: 'Isso mesmo, o triângulo, que nem serviu pra muita coisa 😂',
        erradoMsg: 'Tentei com o triângulo do carro, que praticamente não ajudou em nada, mas rimos muito.'
    },
    {
        pergunta: 'Quem é a pessoa mais carinhosa da relação?',
        opcoes: ['Ana', 'Gabriel', 'Os dois empatados', 'Nenhum dos dois'],
        certa: 0,
        certoMsg: 'Você, com certeza, e eu aprendendo todo dia um pouco mais 💛',
        erradoMsg: 'É você. Longe disso ser uma competição, mas se fosse, você ganhava fácil.'
    },
    {
        pergunta: 'Quem é a pessoa mais gastadora da relação?',
        opcoes: ['Gabriel', 'Ana', 'Os dois igual', 'Nenhum, somos super econômicos'],
        certa: 0,
        certoMsg: 'Eu, assumo com orgulho 😅',
        erradoMsg: 'Sou eu, e olha que nem tento negar.'
    },
    {
        pergunta: 'Qual foi a história que eu contei que te conquistou?',
        opcoes: ['De como eu odeio a unip e todos os professores', 'A do maquinista que morreu nos trilhos do trem', 'A de uma viagem pra praia', 'Nenhuma das opções'],
        certa: 1,
        certoMsg: 'Essa mesma, a do maquinista puramente inventada 😄',
        erradoMsg: 'Foi a história do maquinista que morreu nos trilhos do trem.'
    },
    {
        pergunta: 'Onde foi o nosso primeiro encontro de verdade?',
        opcoes: ['Colina', 'Unip', 'Shopping', 'Praça da Bike'],
        certa: 0,
        certoMsg: 'Colina, 30 de maio. Inesquecível 💛',
        erradoMsg: 'Foi no Colina, em Orlândia, dia 30/05, o dia em que tudo se encaixou.'
    },
    {
        pergunta: 'Onde a gente se conheceu, antes de tudo começar de verdade?',
        opcoes: ['Pelo Instagram', 'Numa festa', 'Na UNIP', 'Através de amigos em comum'],
        certa: 2,
        certoMsg: 'Isso, na UNIP. De lá pra cá olha onde a gente chegou 💛',
        erradoMsg: 'Foi na UNIP. O comecinho de tudo, bem antes da gente imaginar onde isso ia dar.'
    },
    {
        pergunta: 'Qual foi a primeira pizzaria que a gente foi junto?',
        opcoes: ['Verace', 'Uma rede grande de pizza', 'Uma pizzaria qualquer do bairro', 'A gente nunca foi numa pizzaria junto'],
        certa: 0,
        certoMsg: 'A Verace, a primeira de muitas 🍕',
        erradoMsg: 'Foi a Verace, nossa primeira pizzaria juntos.'
    },
    {
        pergunta: 'Qual foi o primeiro lugar que eu falei que queria te levar?',
        opcoes: ['Um show', 'Uma cachoeira', 'Outro estado', 'A praia'],
        certa: 3,
        certoMsg: 'A praia! Ainda vamos riscar isso da lista juntos 🌊',
        erradoMsg: 'Foi a praia. Um sonho nosso que ainda vamos realizar.'
    }
];

/* ----------------------------------------------------------------------
   PLAYLIST DO CASAL
   ----------------------------------------------------------------------
   CORREÇÃO: "Um Dia Te Levo Comigo" (audio_nossa_musica / nossa-musica.mp3)
   NÃO entra nessa lista numerada — ela é a trilha exclusiva que toca ao
   abrir a carta final (ver abrirEnvelope() em js/suspense.js), papel
   diferente da playlist. Colocá-la como "faixa 1" aqui empurrava o
   arquivo que você realmente batizou de playlist_1 pra posição 2, dando
   a impressão de que a faixa 1 estava tocando a música errada. Agora a
   playlist tem 4 faixas de verdade, na ordem que você escolher.

   Sugestões de Jorge & Mateus pra cada momento, caso queira usar (edite
   título/artista/arquivo com a música real que escolher):
     - carona pra faculdade → "De Tanto Te Querer" (o clima de quem já
       estava gostando antes de admitir)
     - dia do atoleiro → algo mais animado, tipo "Propaganda"
     - dia do pedido → "Sosseguei" combina bem com a ideia de gente que
       já não precisa procurar mais nada
     - quarta faixa livre → qualquer uma que tenha um significado especial
   ---------------------------------------------------------------------- */
const PLAYLIST_FAIXAS = [
    {
        titulo: 'Um dia te Levo Comigo',
        artista: 'Jorge & Mateus',
        motivo: 'A vida pode até passar sem graça às vezes, mas quando você está perto, tudo fica bem. Essa música sempre vai representar isso para mim: a vontade de ter você ao meu lado em todos os caminhos da vida.',
        src: 'audio_playlist_1'
    },
    {
       titulo: 'Inesperado',
       artista: 'Jorge & Mateus',
       motivo: 'Eu nem conhecia essa música, mas na primeira vez que ouvi, lembrei de nós, principalmente de você. É tão especial quando a gente encontra alguém que parece completar a nossa vida de uma forma que a gente nunca esperava. Você chegou de repente, mudou meus dias e, hoje, eu só quero mais você na minha vida, em todos os momentos.',
       src: 'audio_playlist_2'
    },
    {
       titulo: 'Cor de Ouro',
       artista: 'Gustavo Lima',
       motivo: 'Nem preciso explicar muito o motivo dessa música, né? Kkkkk. Esse cabelo cor de ouro sempre foi uma das primeiras coisas que me chamou atenção em você, aquele detalhe que fez eu olhar e pensar: "essa menina é linda". Hoje ela representa muito mais do que isso, representa a pessoa incrível que você é, por dentro e por fora, e claro, a loirinha que conquistou completamente o meu coração.',
       src: 'audio_playlist_3'
    },
    {
       titulo: 'Partilhar',
       artista: 'Rubel',
       motivo: 'Essa música representa uma das coisas mais bonitas que eu sinto sobre nós: a vontade de dividir a vida com você. Não apenas os grandes momentos, mas também os dias simples, as conversas sem hora pra acabar, as risadas por coisas bobas e todos aqueles pequenos detalhes que fazem a vida ser melhor quando estamos juntos. Porque no fim, o que eu mais quero é continuar partilhando minha história com você, meus sonhos, meus medos, minhas conquistas e todos os momentos que ainda vamos viver.',
       src: 'audio_playlist_4'
    }
];

/* ----------------------------------------------------------------------
   REGRAS DO "CONTRATO DE NAMORO"
   ---------------------------------------------------------------------- */
const OPCOES_REGRAS_CONTRATO = [
    { 
        id: 'girassol', 
        icon: 'bi-flower1', 
        label: 'Sempre ter um girassol por perto', 
        artigo: 'Fica estabelecido que nunca poderá faltar um girassol nessa história, seja em forma de flor, lembrança ou qualquer detalhe que represente a luz e a alegria que você trouxe para a minha vida.' 
    },

    { 
        id: 'batata', 
        icon: 'bi-basket2', 
        label: 'Dividir a última batata frita', 
        artigo: 'Fica acordado que a última batata frita deverá ser dividida igualmente entre as partes, sendo proibido pegar escondido, guardar para depois ou fingir que não viu que era a última.' 
    },

    { 
        id: 'kovu', 
        icon: 'bi-paw', 
        label: 'O Kovu sempre fazer parte das aventuras', 
        artigo: 'Fica determinado que o Kovu será oficialmente incluído nas aventuras sempre que possível, pois ele já faz parte da nossa história e merece participar das próximas lembranças que ainda vamos criar.' 
    },

    { 
        id: 'maos_dadas', 
        icon: 'bi-hand-index-thumb', 
        label: 'Nunca soltar a mão um do outro', 
        artigo: 'Fica registrado que, em qualquer caminho, passeio ou momento da vida, as partes deverão se lembrar que andar de mãos dadas continua sendo uma das formas mais simples de dizer "estou aqui com você".' 
    },

    { 
        id: 'praia', 
        icon: 'bi-sun', 
        label: 'Realizar nosso sonho da praia', 
        artigo: 'Fica como compromisso futuro a realização de uma viagem para a praia, com direito a areia nos pés, pôr do sol e uma nova memória para guardar juntos.' 
    },

    { 
        id: 'musica_sertaneja', 
        icon: 'bi-music-note-beamed', 
        label: 'Cantar nossas músicas sem vergonha', 
        artigo: 'Fica autorizado o uso de Jorge & Mateus, Zé Neto & Cristiano e demais músicas importantes para nossa história em volume elevado durante viagens e momentos especiais.' 
    },

    { 
        id: 'bomdia', 
        icon: 'bi-sunrise-fill', 
        label: 'Nunca esquecer do bom dia', 
        artigo: 'Fica estabelecido que, mesmo nos dias mais corridos, deverá existir uma demonstração de carinho capaz de lembrar que o amor continua presente em todos os dias.' 
    },

    { 
        id: 'conchinha', 
        icon: 'bi-moon-stars-fill', 
        label: 'Conchinha sempre que possível', 
        artigo: 'Fica garantido o direito de solicitar abraços, carinho e momentos de proximidade sempre que uma das partes sentir vontade de estar mais perto da outra.' 
    },

    { 
        id: 'filmes', 
        icon: 'bi-film', 
        label: 'Continuar nossas sessões de filmes', 
        artigo: 'Fica acordado que filmes, séries e momentos simples juntos continuarão fazendo parte da rotina, independentemente da qualidade da escolha ou da quantidade de comentários durante a sessão.' 
    },

    { 
        id: 'sonhos', 
        icon: 'bi-stars', 
        label: 'Ser o maior apoio um do outro', 
        artigo: 'Fica firmado o compromisso de que ambas as partes deverão apoiar os sonhos, conquistas e desafios uma da outra, comemorando vitórias e segurando a mão nos momentos difíceis.' 
    },

    { 
        id: 'manha_preguicosa', 
        icon: 'bi-sunrise2', 
        label: 'Ter manhãs sem pressa juntos', 
        artigo: 'Fica autorizado o direito de aproveitar manhãs tranquilas, com preguiça, abraços e o famoso pedido de "só mais cinco minutos" sem qualquer reclamação.' 
    },

    { 
        id: 'banho_dois', 
        icon: 'bi-droplet-fill', 
        label: 'Banho a dois quando der certo', 
        artigo: 'Fica previsto que, quando todas as condições técnicas forem favoráveis, momentos de carinho e proximidade deverão ser aproveitados sem pressa.' 
    },

    { 
        id: 'so_mais_um_pouco', 
        icon: 'bi-fire', 
        label: 'Sempre ter direito a mais um abraço', 
        artigo: 'Fica garantido que nenhuma despedida será finalizada sem a possibilidade de pedir mais um abraço, mais um beijo ou mais alguns minutos juntos.' 
    },

    { 
        id: 'acordar_grudados', 
        icon: 'bi-emoji-heart-eyes-fill', 
        label: 'Acordar perto de você sempre que possível', 
        artigo: 'Fica estabelecido como objetivo futuro aproveitar o máximo possível dos momentos simples, incluindo acordar ao lado de quem torna os dias melhores.' 
    },

    { 
        id: 'beijo_obrigatorio', 
        icon: 'bi-heart-fill', 
        label: 'Nenhuma discussão termina sem amor', 
        artigo: 'Fica proibido esquecer que, mesmo em momentos de diferença ou dificuldade, as partes continuam estando do mesmo lado e deverão resolver tudo com respeito e carinho.' 
    },

    { 
        id: 'lava_louca', 
        icon: 'bi-cup-hot', 
        label: 'Dividir as tarefas da vida', 
        artigo: 'Fica determinado que nenhuma responsabilidade deverá ser carregada sozinha, sendo dever de ambas as partes construir uma vida baseada em parceria e ajuda mútua.' 
    },

    { 
        id: 'ela_paga_jantar', 
        icon: 'bi-wallet2', 
        label: 'Um jantar por sua conta de vez em quando', 
        artigo: 'Fica previsto que, ocasionalmente, a parte responsável poderá surpreender a outra com um jantar, ficando proibidas reclamações sobre escolhas do restaurante.' 
    },

    { 
        id: 'ele_escolhe_filme', 
        icon: 'bi-joystick', 
        label: 'Escolher o filme sem guerra', 
        artigo: 'Fica estabelecido que a escolha do filme deverá ocorrer através de um sistema democrático, justo e totalmente sujeito a negociações e argumentos convincentes.' 
    },

    { 
        id: 'ela_dirige', 
        icon: 'bi-car-front-fill', 
        label: 'Dividir as aventuras de carro', 
        artigo: 'Fica acordado que todas as viagens deverão ser acompanhadas de boas conversas, músicas favoritas e momentos que façam o caminho valer tanto quanto o destino.' 
    },

    { 
        id: 'lado_bom_cama', 
        icon: 'bi-moon-fill', 
        label: 'Disputar o melhor lado da cama', 
        artigo: 'Fica registrado que a disputa pelo melhor lado da cama será permitida oficialmente, sendo reconhecido que provavelmente nunca haverá um vencedor definitivo.' 
    },

    { 
        id: 'aguentar_ronco', 
        icon: 'bi-volume-up-fill', 
        label: 'Aceitar meu ronquinho com amor', 
        artigo: 'Fica declarado que pequenos defeitos fazem parte do pacote completo, incluindo eventuais roncos, que deverão ser aceitos junto com todos os momentos de carinho e amor.' 
    }
];
/* ----------------------------------------------------------------------
   CARTA FINAL — escrita na sua voz
   ----------------------------------------------------------------------
   Cada ocorrência de {AMOR} vira, com uma transição suave, o nome dela.
   O texto cita "Um Dia Te Levo Comigo" só pelo NOME da música (sem
   nenhuma letra reproduzida) — é regra do projeto não reproduzir letra
   de música com direito autoral, nem trecho curto.
   ---------------------------------------------------------------------- */
function textoVersiculoBase() {
    if (CARTA_USAR_TEXTO_TESTE) return TEXTO_CARTA_TESTE;
    return `Eu queria saber escrever bonito do jeito que você merece, {AMOR}, mas a verdade é que o que eu sinto por você é muito maior do que qualquer frase bonita. A história mais bonita que eu poderia contar começou de um jeito simples, com você andando pelo refeitório da UNIP com a Vitória e eu criando coragem até para admitir que aquela menina de cabelo loiro tinha chamado minha atenção. Naquele momento eu ainda não fazia ideia, mas alguma coisa dentro de mim já parecia querer me aproximar de você.

Existem tantas músicas que falam sobre amor de um jeito que parece exagerado, até a gente viver algo que faz a gente entender que, na verdade, elas nem estavam exagerando. "Pra Sempre Com Você" sempre foi uma música bonita, mas hoje ela tem outro significado, porque quando eu escuto eu não penso apenas em uma música, eu penso em nós, penso nessa vontade simples de permanecer, de escolher você todos os dias, sem plano B, sem dúvidas, só ficar.

Um dia você me perguntou o que era o amor, meio de brincadeira, meio querendo saber de verdade. Eu não consegui responder direito naquela hora, e a verdade é que talvez eu ainda não saiba explicar completamente. Acho que o amor não é uma coisa que a gente entende por completo, é uma coisa que a gente sente. É escolher a mesma pessoa todos os dias, mesmo quando o dia não é perfeito, mesmo quando a vida aperta, mesmo quando existem dificuldades pelo caminho.

Eu não sei explicar exatamente por que deu tão certo entre a gente, só sei que deu. Em qualquer versão da minha vida, em qualquer caminho que eu pudesse seguir, eu escolheria encontrar você de novo. Escolheria nossas conversas, nossas risadas, nossos momentos simples, nossos perrengues que viram histórias e até aqueles dias difíceis que só fizeram a gente ficar mais perto.

Antes de você aparecer, minha vida seguia normalmente, quase no automático. Eu nem sabia que faltava alguma coisa até você chegar e mudar tudo de um jeito que eu nem sabia que precisava. Talvez seja por isso que "Um Dia Te Levo Comigo" significa tanto para mim, porque ela representa exatamente isso: alguém que chega e transforma dias comuns em momentos que a gente nunca mais esquece.

Então guarda isso comigo, {AMOR}: você chegou de repente, mudou meus dias e trouxe uma felicidade que eu nem sabia que estava procurando. Você tem esse jeito único de iluminar os lugares, de cuidar das pessoas e dos animais que ama, de sorrir e fazer tudo parecer mais leve.

Desde que você chegou, meus dias ficaram melhores, e eu só quero continuar escrevendo essa história ao seu lado, você não carrega apenas o sol nos olhos, você carrega o dia inteiro. Não carrega apenas a lua no sorriso, carrega todo o universo. Eu amo você!`;
}

/* ----------------------------------------------------------------------
   TESTE DA CARTA FINAL (item 6 do prompt)
   ----------------------------------------------------------------------
   Enquanto CARTA_USAR_TEXTO_TESTE estiver "true", a carta que abre depois
   da assinatura/vídeo mostra o texto abaixo (com o placeholder
   [CARTA_TESTE]) em vez do texto definitivo — útil para testar a
   animação do envelope, a troca de "{AMOR}" pelo nome dela, etc., sem
   comprometer o texto final ainda.

   Antes do grande dia:
     1. Troque CARTA_USAR_TEXTO_TESTE para "false".
     2. (Opcional) edite o texto definitivo em textoVersiculoBase(), acima.
   ---------------------------------------------------------------------- */
const CARTA_USAR_TEXTO_TESTE = false;
const TEXTO_CARTA_TESTE = `[CARTA_TESTE] Este é um texto provisório só para testar a abertura do envelope e a troca de "{AMOR}" pelo nome dela. Substitua este texto (ou desligue CARTA_USAR_TEXTO_TESTE, em js/config.js) antes da versão definitiva.`;

/* ----------------------------------------------------------------------
   CÁPSULA DO TEMPO — carta que se abre sozinha 1 ano após o pedido
   ---------------------------------------------------------------------- */
const CAPSULA_DIAS_PARA_DESBLOQUEIO = 1;
function textoCapsulaDoTempo() {
return `28 de julho de 2026.

Oi, meu amor.

Se você está lendo esta carta comigo agora, significa que ela ficou guardada durante um ano inteiro. Neste momento em que escrevo, ainda é dia 28 de julho de 2026 e eu nem sequer fiz o pedido de namoro, faltam apenas alguns dias e, para falar a verdade, estou com aquele frio na barriga, bem parecido com o que senti a primeira vez que te vi... E pensando agora, é engraçado escrever para um futuro que eu ainda não conheço.

Enquanto você lê estas palavras, nós já sabemos como essa história continuou, mas eu... ainda não. Neste instante eu só consigo imaginar, mas tenho certeza que somos muito felizes.

Eu ainda não sei onde vou fazer o pedido, tenho algumas ideias na cabeça, mas nenhuma decisão tomada, talvez brooks? Talvez em Ribeirão? Talvez numa praça aleatória de Sales, também não sei se o site que passei tanto tempo criando vai funcionar exatamente como planejei ou se ele vai decidir travar justamente na hora mais importante. Não sei se você vai seguir cada etapa do roteiro ou se vai simplesmente pular tudo porque a curiosidade falou mais alto. Muito menos sei qual vai ser a sua reação quando chegar ao final.

O que eu sei é que, desde que comecei a preparar tudo isso, cada detalhe tem um único propósito: fazer você se sentir tão amada quanto eu me sinto feliz por ter você na minha vida.

Neste exato momento, você provavelmente nem imagina que existe uma carta escrita para ser aberta daqui a um ano, provavelmente está vivendo um dia completamente normal, enquanto eu estou aqui, sentado no meu trabalho pensando em mil possibilidades, imaginando como vai ser olhar nos seus olhos e entregar a aliança que mudar completamente a nossa história.

Confesso que estou ansioso.

Ansioso para ver o seu sorriso quando perceber o que está acontecendo, ansioso para saber se você vai rir, chorar ou fazer os dois ao mesmo tempo, ansioso para descobrir se vou conseguir dizer tudo o que ensaiei ou se, quando chegar a hora, vou esquecer completamente as palavras.

Mas existe uma coisa da qual eu tenho absoluta certeza, mesmo antes de qualquer coisa, eu te amo com todo o meu coração.

Se tudo ocorreu bem, hoje faz exatamente 1 ano do seu "sim". E, sinceramente, acho que essa é a parte mais bonita desta carta, porque eu que estou escrevendo ainda não sei tudo que aconteceu, mas você que está lendo agora já sabe, doidera.

Agora que estamos aqui, um ano depois, significa que o tempo fez o que ele sempre faz: passou. E eu espero, de verdade, que ele tenha sido gentil com a gente.

Quando escrevi estas palavras, eu ainda não sabia como seria o nosso amanhã, não sabia quantas histórias viveríamos depois daquele dia, nem quantas vezes ainda iríamos rir, viajar, discutir por bobagens e fazer as pazes, não sabia quais sonhos realizaríamos, nem quantas memórias construiríamos juntos. A única certeza que eu tinha era uma: eu queria viver tudo isso ao seu lado.

Não sei explicar exatamente o que você fez comigo. Só sei que, antes de você, meus dias tinham uma forma... e depois de você essa forma mudou, quase sem que eu percebesse. Você trouxe leveza para partes da minha vida que eu nem sabia que estavam pesadas. Trouxe paz. Trouxe risadas sinceras. Trouxe aquele seu jeito único de olhar para mim, de cuidar de quem ama e de transformar momentos simples em lembranças que eu quero guardar para sempre.

Um ano parece pouco perto do tamanho do que eu sinto, mas foi tempo suficiente para eu ter certeza de uma coisa: não existe versão de mim que não escolheria você de novo, sabendo de tudo o que viveríamos, dos dias fáceis e dos difíceis. Se eu pudesse voltar para os próximos dias, sentindo novamente toda essa ansiedade que estou vivendo agora, eu faria exatamente tudo outra vez.

E sim... continua tal qual o Chaves ama sanduíche de presunto. Isso, com certeza, nunca vai mudar. 

Do seu amor, Gabriel`;
}

/* ID do vídeo do YouTube com a mensagem em vídeo pra cápsula do tempo (o
 * que você falar "sobre o que espera pro ano que vem"). Cole só o ID (o
 * trecho depois de "v=" no link do YouTube), não a URL inteira.
 * Ex.: em "https://youtube.com/watch?v=abc123XYZ" o ID é "abc123XYZ".
 * Deixe em branco ('') se não quiser esse botão — ele só aparece se tiver
 * algo aqui. IMPORTANTE (leia a explicação sobre segredo/segurança na
 * resposta do chat): como este é um site estático sem servidor próprio,
 * esse ID viaja dentro do arquivo js/config.js mesmo estando em branco até
 * você preencher — ele só é inserido na página (e some do código-fonte
 * "à vista") no momento em que a cápsula é realmente desbloqueada, mas
 * alguém tecnicamente capaz de abrir este arquivo ainda conseguiria lê-lo
 * antes da data. A trava por hora do servidor (ver obterHoraConfiavel em
 * js/sync.js) cobre o golpe mais comum, que é só adiantar a data do
 * celular. */
const CAPSULA_YOUTUBE_ID = 'SaE2B-xA3qM';

/* Link do YouTube com o vídeo mostrando todo o processo até o pedido
 * (o "making of"). Cole a URL completa aqui quando publicar o vídeo — o
 * botão só aparece na página se este campo não estiver vazio. */
const VIDEO_PROCESSO_YOUTUBE_URL = 'https://www.youtube.com/watch?v=SaE2B-xA3qM';

/* ----------------------------------------------------------------------
   EASTER EGG — brincadeira do sobrenome
   ---------------------------------------------------------------------- */
const TEXTO_EASTER_EGG_SOBRENOME = `O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor. O amor não se alegra com a injustiça, mas se alegra com a verdade. Tudo sofre, tudo crê, tudo espera, tudo suporta`;

/* ----------------------------------------------------------------------
   "COISAS QUE A POLONI AMA" — pequena seção da página de memórias
   ----------------------------------------------------------------------
   Lista enxuta (o pedido foi para não virar uma lista de curiosidades).
   Edite livremente; cada item vira um pequeno cartão na seção.
   ---------------------------------------------------------------------- */
const COISAS_QUE_ELA_AMA = [
    { icon: 'bi-flower1', texto: 'Girassol. Não é apenas uma flor que você gosta, é algo que combina com você: cheio de luz, alegria e aquela energia que faz qualquer lugar ficar mais bonito.' },

    { icon: 'bi-cup-straw', texto: 'Hambúrguer do Grill, com picles. Se pudesse, provavelmente escolheria esse toda semana sem pensar duas vezes.' },

    { icon: 'bi-egg-fried', texto: 'Arroz, feijão preto, batata frita e rúcula. Uma comida simples, mas que tem aquele jeito de comida que traz conforto e lembra casa.' },

    { icon: 'bi-heart-fill', texto: 'KitKat, Kinder Ovo e Ovomaltine. Qualquer coisa com chocolate tem grandes chances de ganhar seu coração.' },

    { icon: 'bi-bag-fill', texto: 'Pringles, Doritos, Cheetos de requeijão e Fandangos. O verdadeiro kit oficial para aqueles momentos em que bate vontade de um salgadinho.' },

    { icon: 'bi-tree-fill', texto: 'Natureza, mato e bichos. Um lugar tranquilo, longe da bagunça, é onde você parece encontrar paz de verdade.' },

    { icon: 'bi-bag-heart-fill', texto: 'Mas também existe seu lado que ama descobrir lugares novos, passear no shopping, conhecer restaurantes diferentes e transformar qualquer saída em uma lembrança.' },

    { icon: 'bi-airplane-fill', texto: 'Viajar. Eu amo ver o brilho no seu olhar quando você fala sobre conhecer lugares novos, criar histórias e viver experiências diferentes.' },

    { icon: 'bi-gift-fill', texto: 'Seu aniversário é uma data especial de verdade. É o seu dia, e eu sei o quanto isso importa para você, por isso sempre vai ser um dia que merece ser cuidado.' },

    { icon: 'bi-chat-heart-fill', texto: 'No começo você era mais quietinha, mas depois que ganhou confiança mostrou esse seu lado que fala, conta histórias e compartilha tudo. Eu amo ouvir você falando, até quando você nem percebe que está falando demais.' }
];

/* ----------------------------------------------------------------------
   SEUS BICHOS — pequena seção logo abaixo de "Coisas que você gosta".
   São seus, não nossos (ainda não moram juntos), por isso o texto trata
   como "seus bichos", não "nossos bichos". Toque no nome de qualquer um
   pra abrir a foto dele (usa o mesmo visor de foto do resto do site).
   ---------------------------------------------------------------------- */
const SEUS_BICHOS = [
    { nome: 'Koda', emoji: '🐶', foto: 'bicho_koda' },
    { nome: 'Xixico', emoji: '🐶', foto: 'bicho_xixico' },
    { nome: 'Kovu', emoji: '🐶', foto: 'bicho_kovu' },
    { nome: 'Yuk', emoji: '🐱', foto: 'bicho_yuk' },
    { nome: 'Ahadi', emoji: '🐱', foto: 'bicho_ahadi' },
    { nome: 'Shury', emoji: '🐱', foto: 'bicho_shury' },
    { nome: 'Sol', emoji: '🦜', foto: 'bicho_sol' },
    { nome: 'Lua', emoji: '🦜', foto: 'bicho_lua' }
];

const BICHOS_EM_MEMORIA = [
    { nome: 'Negão', emoji: '🐶', foto: 'bicho_negao' },
    {
        nome: 'Slinky', emoji: '🐶', foto: 'bicho_slinky', destaque: true,
        textoEspecial: 'Confesso que não cheguei a te conhecer direito, Slinky, mas sei o quanto você ajudou ela em uma fase difícil, e isso te tornou especial pra mim também, mesmo à distância. Obrigado por ter cuidado dela antes de mim.'
    },
    { nome: 'Tommy', emoji: '🦜', foto: 'bicho_tommy' },
    { nome: 'Anne', emoji: '🦜', foto: 'bicho_anne' },
    { nome: 'Iris', emoji: '🦜', foto: 'bicho_iris' }
];

/* ----------------------------------------------------------------------
   "SE UM DIA A GENTE DISCUTIR, LEIA ISSO" — uma carta escondida (link
   discreto no rodapé da página de memórias) escrita pensando num dia
   ruim, não num dia bom. Edite à vontade.
   ---------------------------------------------------------------------- */
function textoCartaDiscussao() {
    return `Se você tá lendo isso agora, é bem provável que hoje não foi um dia fácil entre a gente. Só queria lembrar de uma coisa antes de qualquer outra: brigar não quer dizer que a gente errou em se escolher, quer dizer só que a gente é gente, com dia ruim, cansaço e um orgulho que às vezes fala mais alto do que devia.

Ninguém é perfeito, nem eu, nem você, e tudo bem. É tipo aquela "Duas Metades" que a gente ouve no rádio às vezes: a graça nunca foi achar alguém sem defeito nenhum, foi achar alguém que vale a pena apesar deles, e você vale, e muito.

Nada do que a gente discute hoje apaga o que a gente construiu até aqui. Continua tudo valendo: o Colina, a estrada de terra, o balanço em Sales de Oliveira, cada risada boba, cada silêncio que virou carinho com o tempo.

Se der, respira, volta e conversa comigo de novo. E se ainda não conseguir agora, tudo bem, eu espero. Só não esquece que eu escolhi você antes de qualquer briga, e vou continuar escolhendo bem depois dela.

Com amor, até nos dias difíceis,`;
}

/* ----------------------------------------------------------------------
   LEMBRANÇAS PRA IMPRIMIR — constelação (clara e escura) e carta física
   com QR code. Tudo gerado NA HORA a partir dos dados que já existem
   (TIMELINE_MARCOS, a carta final) — ou seja, sempre que você adicionar
   um marco novo na timeline, o próximo download já sai atualizado, sem
   precisar editar nada além desse array.
   ---------------------------------------------------------------------- */

// Link do site pra virar QR code na carta física. Deixe vazio ('') até
// saber onde o site vai ficar hospedado — enquanto estiver vazio, a carta
// física não mostra QR nenhum (só o texto), sem quebrar nada.
const URL_DO_SITE = '';

// Tamanho de impressão da constelação: formato "foto
// revelada" (10x15cm), o padrão de qualquer revelação de foto em loja ou
// farmácia — barato e fácil de imprimir. Em pixels, numa resolução boa
// o bastante pra imprimir sem serrilhado (~300 DPI).
const IMPRIMIVEL_LARGURA_PX = 1181; // 10cm a 300dpi
const IMPRIMIVEL_ALTURA_PX = 1772;  // 15cm a 300dpi

/* ----------------------------------------------------------------------
   CÂMERA LENTA DE UM MOMENTO — um vídeo curto, tocado bem devagar e em
   loop, com frases surgindo por cima aos poucos. Coloque o vídeo em
   assets/video/ com o nome abaixo, no formato .mp4. Enquanto o arquivo
   não existir, essa seção inteira fica escondida sozinha — sem quebrar
   nada nem mostrar um vídeo vazio.
   ---------------------------------------------------------------------- */
const MOMENTO_LENTO_ARQUIVO_BASE = 'momento-camera-lenta';
const MOMENTO_LENTO_VELOCIDADE = 0.45; // 1 = velocidade normal, quanto menor, mais lento
const MOMENTO_LENTO_FRASES = [
    'Esse instante nem durou muito.',
    'Mas eu quis guardar ele pra sempre, bem devagar.',
    'Pra sempre voltar e ver a mulher linda.',
    'Que está ao meu lado hoje, e para sempre.',
    'Eu te amo!.',
    'Ana Júlia Poloni.',
    'Sempre estarei aqui por você.',
    'E com você!',
    '<3'

];

/* ----------------------------------------------------------------------
   ESPECIAL DE 8 DE AGOSTO — aniversário dela. Toda vez que o site for
   aberto no dia 8 de agosto (checando pela hora do servidor, igual à
   cápsula do tempo — ver js/sync.js), essa seção aparece na página de
   memórias, acima de tudo o mais, com uma mensagem só desse dia.
   ---------------------------------------------------------------------- */
const ANIVERSARIO_DIA = 31;
const ANIVERSARIO_MES = 7; // agosto
function textoAniversario() {
    return `Hoje é diferente de todos os outros dias: hoje é o seu dia.

Espero que todo 8 de agosto te encontre cercada de amor, com aquele sorriso lindo que eu tanto amo e com pessoas que reconhecem a pessoa incrível que você é. Que a vida te devolva em dobro todo o carinho, cuidado e amor que você entrega para o mundo.

Que esse novo ciclo venha cheio de momentos que façam seus olhos brilharem: novas viagens, novos lugares para conhecer, novas histórias para guardar, novos bichinhos para amar e muitos motivos para sorrir. Que nunca falte saúde, paz e coragem para correr atrás de tudo aquilo que faz seu coração feliz.

E eu espero poder estar ao seu lado em todos esses momentos, colecionando memórias, descobrindo lugares novos, vivendo nossas pequenas aventuras e criando uma história que seja só nossa.

Feliz aniversário, meu amor. Hoje o dia é seu, mas eu que ganhei o presente de ter você na minha vida. Te amo ❤️`;
}

/* Vídeo especial que aparece junto com a mensagem de aniversário, dentro
 * do mesmo bloco. Coloque o arquivo em assets/video/ com esse nome (ver
 * assets/video/LEIA-ME-video-aniversario.md), no formato .mp4. Enquanto
 * o arquivo não existir, só o texto aparece, sem espaço vazio nem nada
 * quebrado. */
const ANIVERSARIO_VIDEO_ARQUIVO_BASE = 'video-aniversario';

/* Música especial que toca sozinha, só no dia 8 de agosto, junto com o
 * bloco de aniversário. Coloque o arquivo em assets/audio/ com esse nome
 * (ver assets/audio/LEIA-ME-musica-aniversario.md) — qualquer extensão de
 * AUDIO_EXTENSOES_ACEITAS serve. Enquanto o arquivo não existir, nada
 * toca (sem erro, sem botão quebrado). Alguns navegadores bloqueiam
 * autoplay com som; por isso existe um botão pequeno de tocar/pausar
 * junto do bloco, pra ela poder dar o play manualmente se precisar. */
const ANIVERSARIO_MUSICA_ARQUIVO_BASE = 'musica-aniversario';

/* "Chuva" de corações e balões subindo de baixo pra cima na tela, que
 * acontece só quando o bloco de aniversário aparece (ou seja, só no dia
 * dela). ANIVERSARIO_CHUVA_DURACAO_MS é por quanto tempo os elementos
 * continuam surgindo (em milissegundos); ANIVERSARIO_CHUVA_ITENS é o
 * conjunto de emojis usados, sorteados um de cada vez. */
const ANIVERSARIO_CHUVA_DURACAO_MS = 9000;
const ANIVERSARIO_CHUVA_ITENS = ['❤️', '🎈', '💛', '🎈', '💕', '🎈'];

/* ----------------------------------------------------------------------
   "SE UM DIA ESTIVER TRISTE, LEMBRE-SE DISSO" — um baralho de cartas, uma
   por vez, cada uma com um adjetivo + o motivo específico (não genérico)
   pelo qual você pensa isso dela. Fácil de editar: só adicionar/remover
   objetos dessa lista.
   ---------------------------------------------------------------------- */
const ADJETIVOS_PARA_ELA = [
    {
        adjetivo: 'Meu girassol 🌻',
        motivo: 'Porque você tem uma luz que é só sua. Do mesmo jeito que um girassol procura o sol, eu sinto que você sempre procura espalhar amor, cuidado e alegria por onde passa.'
    },
    {
        adjetivo: 'Linda',
        motivo: 'Não só pela beleza que todo mundo consegue ver, mas principalmente pelo jeito que você é quando ninguém está olhando, sendo você mesma, sem precisar provar nada para ninguém.'
    },
    {
        adjetivo: 'Amada',
        motivo: 'Se algum dia você esquecer o quanto é importante, lembra disso: existe alguém que agradece a Deus por ter colocado você no caminho dele.'
    },
    {
        adjetivo: 'Forte',
        motivo: 'Eu vi de perto que você é muito mais forte do que imagina. Mesmo nos dias difíceis, você continua cuidando, amando e tentando fazer o melhor.'
    },
    {
        adjetivo: 'Especial',
        motivo: 'Porque eu nunca conheci alguém que sente tanto, cuida tanto e ama tanto os animais e as pessoas que fazem parte da sua vida.'
    },
    {
        adjetivo: 'Única',
        motivo: 'Porque não existe outra Ana Poloni no mundo. O seu jeito de rir, olhar, falar e cuidar é algo que ninguém consegue copiar.'
    },
    {
        adjetivo: 'Minha escolha',
        motivo: 'Entre tantas pessoas nesse mundo, foi você quem apareceu no meu caminho. E se eu tivesse que escolher novamente, eu escolheria você.'
    },
    {
        adjetivo: 'Encantadora',
        motivo: 'Porque até nas coisas mais simples você consegue deixar tudo mais bonito. Às vezes você nem percebe, mas eu percebo.'
    },
    {
        adjetivo: 'Carinhosa',
        motivo: 'No jeito que você cuida dos seus bichinhos, da sua família e das pessoas que ama. Seu coração aparece nos pequenos detalhes.'
    },
    {
        adjetivo: 'Corajosa',
        motivo: 'Porque você deixou alguém conhecer seu coração, mesmo sendo alguém que demora para criar confiança. Obrigado por ter deixado eu conhecer esse seu lado.'
    },
    {
        adjetivo: 'Meu lugar favorito',
        motivo: 'Porque eu descobri que meu lugar favorito não é um lugar específico, é qualquer lugar onde eu esteja com você.'
    },
    {
        adjetivo: 'Aventureira',
        motivo: 'Porque até uma estrada de terra, um carro atolado e um monte de barro viraram uma das lembranças mais engraçadas da nossa história.'
    },
    {
        adjetivo: 'Companheira',
        motivo: 'Porque você não esteve comigo apenas nos momentos fáceis, você esteve presente quando a vida mostrou que amar também é permanecer.'
    },
    {
        adjetivo: 'Doce',
        motivo: 'No seu jeito de falar, no seu jeito de olhar e principalmente nesse coração enorme que você tenta esconder às vezes.'
    },
    {
        adjetivo: 'Autêntica',
        motivo: 'Porque você não precisa ser igual a ninguém. Uma das coisas que eu mais amo é ver você sendo exatamente quem você é.'
    },
    {
        adjetivo: 'Meu sorriso favorito',
        motivo: 'Porque existe algo no seu sorriso que muda completamente o meu dia, mesmo quando eu estava tendo um dia difícil.'
    },
    {
        adjetivo: 'Amorosa',
        motivo: 'Porque você ama de verdade. Não pela metade, não só quando é fácil, mas com aquele coração gigante que você tem.'
    },
    {
        adjetivo: 'Preciosa',
        motivo: 'Porque algumas pessoas passam pela nossa vida, mas poucas deixam uma marca que muda tudo. Você é uma delas.'
    },
    {
        adjetivo: 'Minha paz',
        motivo: 'Porque no meio da correria da vida, estar com você sempre parece deixar tudo um pouco mais tranquilo.'
    },
    {
        adjetivo: 'Incrível',
        motivo: 'Não porque você precisa ser perfeita, mas porque você consegue ser exatamente você, e isso já é uma das coisas mais bonitas que existem.'
    },
    {
        adjetivo: 'Brilhante',
        motivo: 'Porque existe uma luz em você que aparece no jeito que você fala, cuida e ama. Às vezes você nem percebe, mas quem está perto percebe.'
    },
    {
        adjetivo: 'Gentil',
        motivo: 'Porque mesmo quando ninguém está olhando, você continua escolhendo ser boa com as pessoas e principalmente com os animais.'
    },
    {
        adjetivo: 'Generosa',
        motivo: 'Porque você sempre encontra um jeito de cuidar, ajudar e entregar carinho para quem faz parte da sua vida.'
    },
    {
        adjetivo: 'Meu porto seguro',
        motivo: 'Porque perto de você eu sinto que posso ser exatamente quem eu sou, sem precisar fingir nada.'
    },
    {
        adjetivo: 'Sensível',
        motivo: 'Porque você sente tudo com intensidade, e apesar de às vezes isso machucar, é também uma das coisas mais bonitas em você.'
    },
    {
        adjetivo: 'Observadora',
        motivo: 'Porque você percebe detalhes que muitas pessoas deixam passar, e isso mostra o tamanho do seu coração.'
    },
    {
        adjetivo: 'Cuidadosa',
        motivo: 'Porque o amor aparece nos pequenos detalhes, e você demonstra isso todos os dias.'
    },
    {
        adjetivo: 'Meu presente',
        motivo: 'Porque eu ainda acho incrível que, em meio a tantas pessoas, foi você quem apareceu na minha vida.'
    },
    {
        adjetivo: 'Extraordinária',
        motivo: 'Porque comum nunca foi uma palavra que combinou com você. Desde o começo eu percebi que tinha algo diferente aí.'
    },
    {
        adjetivo: 'Rara',
        motivo: 'Porque pessoas com um coração como o seu não aparecem todos os dias.'
    },
    {
        adjetivo: 'Minha alegria',
        motivo: 'Porque até os dias mais comuns ficam melhores quando têm um pouco de você.'
    },
    {
        adjetivo: 'A pessoa certa',
        motivo: 'Porque algumas pessoas chegam e parecem encaixar em lugares da nossa vida que nem sabíamos que estavam vazios.'
    },
    {
        adjetivo: 'Minha calmaria',
        motivo: 'Porque seu abraço, sua presença e seu jeito têm uma forma de deixar tudo mais leve.'
    },
    {
        adjetivo: 'Especial demais',
        motivo: 'Porque você consegue amar coisas que muita gente esquece, como os animais, pequenos momentos e pessoas importantes.'
    },
    {
        adjetivo: 'Encantadora',
        motivo: 'Porque até quando você está brava, com sono ou distraída, ainda existe algo em você que me encanta.'
    },
    {
        adjetivo: 'Minha lembrança favorita',
        motivo: 'Porque eu tenho muitos momentos bons na vida, mas vários dos meus favoritos agora têm você neles.'
    },
    {
        adjetivo: 'Linda por dentro',
        motivo: 'Porque sua beleza mais bonita não é a que aparece no espelho, é a que aparece nas suas atitudes.'
    },
    {
        adjetivo: 'Minha companheira de aventuras',
        motivo: 'Porque até um carro atolado na lama virou uma lembrança que eu guardo com carinho, simplesmente porque era com você.'
    },
    {
        adjetivo: 'Corajosa demais',
        motivo: 'Porque amar, confiar e deixar alguém conhecer seu coração também exige coragem.'
    },
    {
        adjetivo: 'Minha melhor coincidência',
        motivo: 'Porque tudo começou de um jeito tão inesperado, e hoje eu não consigo imaginar minha história sem você.'
    },
    {
        adjetivo: 'Minha oração respondida',
        motivo: 'Porque eu acredito que Deus escreve histórias que a gente não entende no começo, mas agradece depois.'
    },
    {
        adjetivo: 'Minha inspiração',
        motivo: 'Porque ver a forma como você luta, ama e cuida me faz querer ser uma pessoa melhor.'
    },
    {
        adjetivo: 'Cheia de amor',
        motivo: 'Porque até quando você fala dos seus bichinhos, dá para perceber o tamanho do coração que você tem.'
    },
    {
        adjetivo: 'Minha casa',
        motivo: 'Porque algumas pessoas fazem a gente sentir que chegou em um lugar seguro, e você é uma delas.'
    },
    {
        adjetivo: 'Linda até distraída',
        motivo: 'Porque muitas vezes você nem percebe que está sendo observada, mas eu percebo todos os detalhes.'
    },
    {
        adjetivo: 'Minha escolha diária',
        motivo: 'Porque amar você não é só sobre um momento bonito, é sobre escolher você todos os dias.'
    },
    {
        adjetivo: 'Meu motivo de sorrir',
        motivo: 'Porque existem sorrisos que aparecem sem esforço, e muitos dos meus têm você como motivo.'
    },
    {
        adjetivo: 'Minha pessoa favorita',
        motivo: 'Porque entre tantas conversas, lugares e pessoas, ainda é com você que eu mais gosto de dividir meus momentos.'
    },
    {
        adjetivo: 'A menina do cabelo loiro',
        motivo: 'Porque tudo começou com uma frase simples para a Vitória: "sua amiga de cabelo loiro é muito linda". Eu não fazia ideia de onde aquilo ia chegar.'
    },
    {
        adjetivo: 'Minha história favorita',
        motivo: 'Porque nossa história ainda está no começo, mas já tem capítulos que eu nunca vou esquecer.'
    },
    {
        adjetivo: 'Meu futuro',
        motivo: 'Porque quando penso nos próximos anos, nos sonhos e nos planos, é impossível não imaginar você comigo.'
    },
    {
        adjetivo: 'Minha certeza',
        motivo: 'Porque mesmo sem saber tudo que o futuro guarda, uma coisa eu sei: sou muito feliz por ter encontrado você.'
    },
    // Mensagens especiais para dias difíceis

    {
        adjetivo: 'Um lembrete ❤️',
        motivo: 'A menina que eu vi andando com a Vitória na faculdade nem imaginava que um dia seria a pessoa mais importante da minha vida.'
    },
    {
        adjetivo: 'Respira 🌻',
        motivo: 'Nem todo dia vai ser fácil, mas lembra que nenhum dia difícil muda o quanto você é incrível.'
    },
    {
        adjetivo: 'Nunca esqueça',
        motivo: 'Você é muito mais do que seus dias ruins, seus erros ou suas preocupações. Você é alguém que merece todo amor do mundo.'
    },
    {
        adjetivo: 'Para quando sentir saudade',
        motivo: 'Lembra do nosso começo, das caronas, das risadas e de como uma história tão bonita começou de um jeito tão simples.'
    },
    {
        adjetivo: 'Minha sorte 🍀',
        motivo: 'Até hoje eu acho incrível pensar que, entre tantas pessoas no mundo, Deus colocou justamente você no meu caminho.'
    },
    {
        adjetivo: 'Meu amor',
        motivo: 'Se esse dia estiver difícil, lembra que existe alguém aqui que ama seu sorriso, seu olhar, seu jeito e tudo aquilo que faz você ser você.'
    },
    {
        adjetivo: 'Para sempre',
        motivo: 'Porque eu não quero apenas viver momentos bonitos com você, eu quero construir uma história inteira ao seu lado.'
    },
    {
        adjetivo: 'Minha pessoa favorita',
        motivo: 'Porque conversar com você, rir com você e simplesmente estar perto de você são algumas das minhas coisas favoritas.'
    }
];

/* ----------------------------------------------------------------------
   EASTER EGGS DA LOJA — 5 toques no mesmo elemento revelam uma mensagem
   escondida. Cada chave abaixo corresponde ao id de um elemento clicável
   em index.html (ver iniciarEasterEggsLoja em js/store.js).
   ---------------------------------------------------------------------- */
/* ----------------------------------------------------------------------
   CONTADOR DE EASTER EGGS
   ----------------------------------------------------------------------
   Lista mestra de TODOS os easter eggs "de verdade" do site (secretos,
   achados sem instrução nenhuma) — usada só pra saber o TOTAL pro
   contador discreto no canto da tela ("X de Y encontrados"). Se um
   easter egg novo for adicionado em qualquer lugar do site, inclua o id
   dele aqui também (ver marcarEasterEggEncontrado() em js/utils.js).
   Não inclui o atalho de teste pra desktop (abrirauroradesktop), que é
   uma ferramenta de desenvolvimento, não uma surpresa pra ela achar.
   ---------------------------------------------------------------------- */
const IDS_TODOS_OS_EASTER_EGGS = [
    'imagemPrincipalProduto', 'reviewGabrielClicavel', 'lojaLogoClicavel',
    'destaquePrataCard', 'pulseiraEsgrifaCard', 'instagramIconeClicavel', 'garantiaVitaliciaClicavel',
    'luaMorse', 'freteData'
];

const LOJA_EASTER_EGGS = {
    imagemPrincipalProduto: {
        titulo: 'Então você percebeu 👀',
        texto: `Eu sabia que essa foto ia chamar sua atenção. Engraçado pensar que, enquanto você estava olhando uma aliança em uma loja que nem existe, eu já estava olhando para uma aliança que existe de verdade e imaginando o momento em que ela chegaria até você. - K4QWZ`
    },

    reviewGabrielClicavel: {
        titulo: 'Sobre esse tal Gabriel S.',
        texto: `Sim, sou eu mesmo. Talvez seja a primeira vez na história que alguém deixa uma avaliação da própria compra antes mesmo dela acontecer, viu, sou diferenciado minha loba kkkkkk - X7KVM`
    },

    lojaLogoClicavel: {
        titulo: 'A Aryah guarda um segredo',
        texto: `Acho que ja deu pra entender que é tudo falso né? kkkkkk, mas essa loja nunca existiu de verdade. Cada detalhe dela foi criado só para te trazer até esse momento. A loja é falsa, as joias são uma história, mas a pessoa que pensou em tudo isso e o sentimento por trás dela são completamente reais.`
    },

    destaquePrataCard: {
        titulo: 'Prata 950? Interessante...',
        texto: `No fim, nenhum número gravado em uma joia conseguiria explicar o valor desse dia. Porque algumas coisas não têm medida: o primeiro olhar, as risadas, as conversas no carro e tudo que fez você se tornar tão importante para mim. - Q3ZTN`
    },

    pulseiraEsgrifaCard: {
        titulo: 'Você reparou nisso também?',
        texto: `Você sempre foi boa em perceber detalhes, talvez seja por isso que percebeu essa também, um dia te dou uma pulseira assim kkkk`
    },

    instagramIconeClicavel: {
        titulo: 'Instagram?',
        texto: `Infelizmente esse perfil não vai render nenhum seguidor novo. Ele só existe para deixar essa loja convincente. Mas pensando bem, o Instagram real já fez algo muito mais importante: foi onde uma conversa começou e onde uma história nasceu.`
    },

    garantiaVitaliciaClicavel: {
        titulo: 'Garantia vitalícia?',
        texto: `Essa talvez seja a única garantia dessa loja que é verdadeira. Não porque o amor seja perfeito todos os dias, mas porque eu quero continuar escolhendo você em cada fase, em cada capítulo e em cada versão da nossa história. - R8NVX`
    }
};

/**
 * Igual a resolverFotoPlaceholder, mas para um vídeo estático em
 * assets/video/ (não gravado pelo usuário, um arquivo que você mesmo
 * coloca na pasta) — o arquivo precisa estar salvo como .mp4. Devolve
 * null se não for encontrado (quem chamar decide o que fazer nesse
 * caso, ex.: esconder a seção toda).
 */
const __cacheResolverVideoPorBase = {};
async function resolverVideoPorBase(arquivoBase) {
    if (!arquivoBase) return null;
    if (arquivoBase in __cacheResolverVideoPorBase) return __cacheResolverVideoPorBase[arquivoBase];

    const caminho = `assets/video/${arquivoBase}.mp4`;
    if (await arquivoExisteNoServidor(caminho)) {
        __cacheResolverVideoPorBase[arquivoBase] = caminho;
        return caminho;
    }
    return null; // não guarda no cache — se o arquivo for adicionado depois, uma nova tentativa pode encontrar
}

/**
 * Igual a resolverVideoPorBase, mas para um áudio estático em
 * assets/audio/ (não gravado pelo usuário, um arquivo que você mesmo
 * coloca na pasta) — testa cada extensão de AUDIO_EXTENSOES_ACEITAS,
 * maiúscula e minúscula, e devolve null se nada for encontrado (quem
 * chamar decide o que fazer nesse caso, ex.: não tocar nada).
 */
const __cacheResolverAudioPorBase = {};
async function resolverAudioPorBase(arquivoBase) {
    if (!arquivoBase) return null;
    if (arquivoBase in __cacheResolverAudioPorBase) return __cacheResolverAudioPorBase[arquivoBase];

    const candidatos = AUDIO_EXTENSOES_ACEITAS.flatMap(ext => [ext, ext.toUpperCase()]);
    for (const ext of candidatos) {
        const caminho = `assets/audio/${arquivoBase}.${ext}`;
        if (await arquivoExisteNoServidor(caminho)) {
            __cacheResolverAudioPorBase[arquivoBase] = caminho;
            return caminho;
        }
    }
    return null; // não guarda no cache — se o arquivo for adicionado depois, uma nova tentativa pode encontrar
}

/* ----------------------------------------------------------------------
   MAPA DA RELAÇÃO — lugares que a gente já foi juntos, na ordem em que
   você quiser mostrar. Fácil de editar: só adicionar/remover objetos
   dessa lista. Nada mais no código precisa mudar.
   - nome: título do lugar
   - cidade: aparece embaixo do nome, menor
   - texto: uma frase curta sobre o que esse lugar significa
   - icon: qualquer ícone do Bootstrap Icons (ex.: 'bi-heart-fill'),
     pode repetir entre lugares, sem problema
   - futuro: true deixa o card com visual de "ainda vamos viver isso"
     (usado no card de próximo destino, mas pode usar em qualquer outro)
   ---------------------------------------------------------------------- */
const MAPA_LUGARES = [
    {
        nome: 'Colina',
        cidade: 'Orlândia',
        texto: '',
        icon: 'bi-heart-fill',
        foto: 'mapa_colina'
    },

    {
        nome: 'Brooks',
        cidade: 'Franca',
        texto: '',
        icon: 'bi-chat-heart-fill',
        foto: 'mapa_brooks'
    },

    {
        nome: 'A estrada de terra',
        cidade: 'Nosso pequeno caos',
        texto: '',
        icon: 'bi-signpost-fill',
        foto: 'mapa_estrada'
    },

    {
        nome: 'Minha Casa',
        cidade: 'Nuporanga',
        texto: '',
        icon: 'bi-shop',
        foto: 'mapa_nuporanga'
    },

    {
        nome: 'Casa da minha vó',
        cidade: 'Santa Rosa de Viterbo',
        texto: '',
        icon: 'bi-house-heart-fill',
        foto: 'mapa_santa_rosa'
    },

    {
        nome: 'Parque Curupira',
        cidade: 'Ribeirão Preto',
        texto: '',
        icon: 'bi-tree-fill',
        foto: 'mapa_curupira'
    },


    {
        nome: 'A família',
        cidade: 'Casa do seu tio',
        texto: '',
        icon: 'bi-people-fill',
        foto: 'mapa_familia'
    },

    {
        nome: 'Verace',
        cidade: 'Ribeirão Preto',
        // Texto de exemplo — troque pelo que esse lugar realmente significa pra vocês.
        texto: '',
        icon: 'bi-cup-hot-fill',
        foto: 'mapa_verace'
    },

    {
        nome: 'Praça da Bike',
        cidade: 'Ribeirão Preto',
        // Texto de exemplo — troque pelo que esse lugar realmente significa pra vocês.
        texto: '',
        icon: 'bi-bicycle',
        foto: 'mapa_praca_bike'
    },

    {
        nome: 'Cruzeiro',
        cidade: 'São Simão',
        // Texto de exemplo — troque pelo que esse lugar realmente significa pra vocês.
        texto: '',
        icon: 'bi-geo-alt-fill',
        foto: 'mapa_cruzeiro'
    },

    {
        nome: 'Mostarda',
        cidade: 'São Joaquim da Barra',
        // Texto de exemplo — troque pelo que esse lugar realmente significa pra vocês.
        texto: '',
        icon: 'bi-geo',
        foto: 'mapa_mostarda'
    },

    {
        nome: 'Próximo destino',
        cidade: 'Onde a vida levar a gente',
        texto: '',
        icon: 'bi-airplane-fill',
        futuro: true,
        foto: 'mapa_proximo'
    }
];

/* ----------------------------------------------------------------------
   CHECKLIST DE ENCONTROS ("Coisas para fazer juntos")
   ----------------------------------------------------------------------
   Lista de programas/experiências pro casal ir riscando junto, na página
   separada checklist.html (ver js/checklist.js). Cada item vira um id
   estável baseado na posição ("<índice da categoria>_<índice do item>"),
   calculado em checklist.js — NÃO reordenar itens já marcados sem se
   atentar a isso, porque o progresso salvo é por posição, não por texto.
   Chave salva no banco: 'aurora_checklist_encontros' (ver js/db.js e a
   inclusão no backup/sincronização em js/export.js).
   ---------------------------------------------------------------------- */
const CHECKLIST_ENCONTROS = [
    {
        nome: "Gastronomia",
        emoji: "🍕",
        itens: [
            "Pedir um kit festa e comer juntos",
            "Fazer brigadeiro e ver um filme",
            "Cozinhar uma receita nova juntos",
            "Fazer uma noite de pizza caseira",
            "Ir tomar sorvete à noite",
            "Fazer um café da manhã especial juntos",
            "Fazer um café da manhã na cama",
            "Pedir comida e fazer um \"cinema em casa\"",
            "Fazer fondue de chocolate",
            "Experimentar um restaurante novo",
            "Pedir comida no escuro (sem ver o cardápio antes)",
            "Fazer milk-shake caseiro",
            "Assar cookies juntos",
            "Fazer pipoca gourmet",
            "Fazer uma noite de fondue",
            "Experimentar uma comida que nenhum dos dois conhece",
            "Fazer um desafio de cozinhar sem receita",
            "Cozinhar usando apenas o que tem em casa",
            "Experimentar doces importados",
            "Fazer degustação de chocolates",
            "Fazer um jantar à luz de velas",
            "Preparar um café especial um para o outro",
            "Fazer panquecas no café da manhã",
            "Montar uma cesta de piquenique",
        ]
    },
    {
        nome: "Em Casa",
        emoji: "🏡",
        itens: [
            "Assistir reels juntos",
            "Fazer skincare em casa juntos",
            "Jogar Uno ou baralho",
            "Montar um quebra-cabeça",
            "Montar um quebra-cabeça de 1000 peças",
            "Montar Lego juntos",
            "Fazer uma guerra de travesseiros",
            "Ler um livro em voz alta um para o outro",
            "Dançar na sala de casa",
            "Fazer um dia sem celular",
            "Montar um forte de cobertas",
            "Fazer um karaokê em casa",
            "Brincar de \"verdade ou desafio\"",
            "Jogar xadrez",
            "Jogar dominó",
            "Fazer um caça ao tesouro em casa",
            "Fazer uma sessão de massagens",
            "Fazer uma faxina ouvindo música",
            "Organizar o guarda-roupa juntos",
        ]
    },
    {
        nome: "Filmes e Entretenimento",
        emoji: "🎬",
        itens: [
            "Assistir um filme antigo que nenhum dos dois viu",
            "Assistir uma série do começo ao fim",
            "Maratonar uma trilogia",
            "Assistir um documentário",
            "Ir ao cinema",
        ]
    },
    {
        nome: "Criatividade",
        emoji: "🎨",
        itens: [
            "Pintar telas ou desenhar juntos",
            "Pintar um quadro juntos",
            "Personalizar canecas ou camisetas",
            "Fazer um álbum de fotos",
            "Fazer um scrapbook do relacionamento",
            "Montar um mural de fotos",
            "Decorar um cantinho da casa",
            "Plantar uma muda juntos",
            "Montar um terrário",
        ]
    },
    {
        nome: "Passeios",
        emoji: "🚶",
        itens: [
            "Fazer um piquenique no parque",
            "Caminhar de mãos dadas sem destino",
            "Assistir ao pôr do sol",
            "Ver o nascer do sol com café",
            "Passear de bicicleta",
            "Fazer uma trilha leve",
            "Visitar um museu ou exposição",
            "Ir ao zoológico ou aquário",
            "Alimentar peixes ou patos",
            "Ir a uma cafeteria diferente",
            "Visitar uma feira de rua",
            "Fazer uma caminhada em um parque",
            "Visitar uma praça bonita",
            "Ver aviões decolando perto do aeroporto",
            "Ir a um mirante",
            "Passear sem destino de carro",
            "Fazer uma viagem bate-volta",
            "Conhecer uma cidade vizinha",
            "Ver a chuva da varanda com chocolate quente",
            "Ir a um escape room",
            "Visitar uma livraria",
            "Ir a uma feira de artesanato",
            "Visitar um brechó",
        ]
    },
    {
        nome: "Relacionamento",
        emoji: "💕",
        itens: [
            "Fazer um desafio \"Quem conhece melhor o outro?\"",
            "Escrever cartas um para o outro",
            "Fazer uma cápsula do tempo",
            "Tirar fotos estilo \"ensaio de casal\"",
            "Fazer uma sessão de fotos espontâneas",
            "Contar histórias engraçadas da infância",
            "Relembrar fotos e vídeos antigos do relacionamento",
            "Ver as estrelas e conversar sobre sonhos",
            "Dormir olhando as estrelas",
            "Escrever metas para o futuro juntos",
            "Fazer um quadro de metas do casal",
            "Planejar uma viagem dos sonhos",
            "Recriar o primeiro encontro",
            "Trocar presentes de até R$ 20",
            "Escolher roupas um para o outro",
            "Adotar um animal juntos",
        ]
    },
    {
        nome: "Música",
        emoji: "🎵",
        itens: [
            "Montar uma playlist juntos",
            "Montar uma playlist de viagem",
            "Escolher uma música e aprender a tocar ou cantar juntos",
        ]
    },
    {
        nome: "Aprendizado",
        emoji: "📚",
        itens: [
            "Estudar algo novo juntos",
            "Aprender palavras em outro idioma",
            "Aprender a fazer uma sobremesa nova",
        ]
    },
    {
        nome: "Viagens e Aventuras",
        emoji: "✈️",
        itens: [
            "Viajar para a praia",
            "Viajar para outro país",
            "Conhecer outro estado",
            "Conhecer toda a Região Norte",
            "Conhecer toda a Região Nordeste",
            "Conhecer toda a Região Centro-Oeste",
            "Conhecer toda a Região Sudeste",
            "Conhecer toda a Região Sul",
            "Conhecer uma cidade histórica",
            "Conhecer um cânion",
            "Ir a uma cachoeira",
            "Ver a neve pela primeira vez",
            "Viajar de avião juntos pela primeira vez",
            "Andar de barco",
            "Andar de balão",
            "Andar de helicóptero",
            "Andar de quadriciclo",
            "Esquiar na neve",
            "Ir a um parque de diversões",
            "Ir a um parque aquático",
            "Fazer rapel",
            "Fazer tirolesa",
            "Fazer rafting",
            "Fazer um passeio de caiaque",
            "Acampar em uma montanha",
            "Assistir ao nascer do sol do topo de um morro",
            "Fazer uma road trip de carro",
            "Fazer uma viagem sem destino definido",
            "Alugar um hotel para um fim de semana",
            "Fazer uma viagem em família",
        ]
    },
];

/* ----------------------------------------------------------------------
   PROTEÇÃO POR SENHA DA ÁREA DE MEMÓRIAS (item 8 do prompt — IMPLEMENTADO
   POR ÚLTIMO, depois de todas as demais correções e melhorias)
   ----------------------------------------------------------------------
   Depois que o pedido acontece e tudo é salvo, qualquer novo acesso à
   área de memórias passa a exigir esta senha (ver solicitarSenhaMemorias()
   em js/romance.js e o fluxo em js/main.js).
   ---------------------------------------------------------------------- */
/* ----------------------------------------------------------------------
   EASTER EGG DA LUA — 5 toques na lua do "Nosso céu" revelam essa
   mensagem em código Morse (ver iniciarEasterEggDaLua() em js/romance.js
   e paraCodigoMorse() em js/utils.js). De propósito SEM botão de
   tradução — a graça é ela mesma decifrar o código.
   ---------------------------------------------------------------------- */
const MENSAGEM_SECRETA_LUA = 'O sol ama tanto a lua que morre todas as noites para deixá-la respirar - K4QWZ';

const SENHA_AREA_MEMORIAS = '1406';

/* ----------------------------------------------------------------------
   SENHA DA CARTA "SE UM DIA A GENTE DISCUTIR, LEIA ISSO"
   ----------------------------------------------------------------------
   Antes de chegar na pergunta "Brigamos?" e na carta em si, pede essa
   senha, com uma dica que é só um lembrete carinhoso, não a resposta
   escancarada (ver iniciarCartaDiscussao() em js/romance.js).
   ---------------------------------------------------------------------- */
const SENHA_CARTA_DISCUSSAO = 'teamo';
const DICA_SENHA_CARTA_DISCUSSAO = 'A dica são duas palavras que a gente nunca pode esquecer de dizer um pro outro.';

/* ----------------------------------------------------------------------
   SENHA DO BOTÃO "RESETAR SITE"
   ----------------------------------------------------------------------
   Some qualquer indicação visual dessa senha na tela (o campo é do tipo
   "password", mascarado) — só quem souber o número consegue resetar o
   site. Nota honesta: como este é um site 100% estático (sem servidor
   próprio), qualquer pessoa que abrir o código-fonte da página encontra
   esta constante — não existe "segredo perfeito" possível nesse tipo de
   projeto (o mesmo já vale para a chave do Supabase, ver js/sync.js).
   Na prática isso não é um problema aqui: ninguém além de quem já tem
   este arquivo vai inspecionar o código, e o objetivo real da senha é
   evitar um toque acidental no botão, não resistir a um ataque.
   ---------------------------------------------------------------------- */
const SENHA_RESET_SITE = '13046700';

/* ----------------------------------------------------------------------
   TEXTOS-CHAVE (fáceis de localizar e editar)
   ---------------------------------------------------------------------- */
const TEXTOS = {
    heroTituloRomance: 'Nós',
    heroSubRomance: `Hoje eu tenho a felicidade de olhar para você e poder dizer oficialmente: você é minha namorada, a pessoa que começou como uma menina que eu vi andando pela faculdade e que, sem perceber, virou a pessoa mais importante da minha vida.

Eu estou muito feliz por tudo que construímos até aqui, cada momento simples que virou uma lembrança enorme, cada detalhe dessa história me trouxe até esse instante.

E se hoje eu tenho a certeza de uma coisa, é que esse é só o começo, porque enquanto eu seguro sua mão como seu namorado, eu já imagino todos os capítulos que ainda vamos escrever juntos, e quem sabe, quando menos esperarmos, eu vou estar segurando sua mão como seu marido.

Obrigado por ser você, por ter deixado eu entrar na sua vida e por transformar meus dias em algo muito melhor. ❤️`,
    encerramentoRomance: `Meu amor, obrigado por escolher viver essa vida ao meu lado, dia após dia, "o cordão de três dobras não se rompe com facilidade", quero construir nossa história com Deus no centro, fortalecendo o nosso amor a cada passo. Eu escolho você. Hoje, amanhã e por toda a vida..`,
    digitacaoSuspense: `Cada uma dessas fotos guarda um pedaço do casal, mas ainda falta a aliança comprada hoje.`,
    assinaturaCartaFinal: `Com muito amor para Ana Júlia Poloni.`,
    polaroidFrasePadrao: `O dia em que tudo começou.`,
    brigamosMensagemFofa: `Que bom que não sua curiosa. Deixa essa carta guardadinha aí, pro dia em que a gente realmente precisar dela. Até lá, só saiba de uma coisa: eu te amo.`
};
