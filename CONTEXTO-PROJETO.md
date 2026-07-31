# CONTEXTO DO PROJETO "AURORA JOIAS" — para uso por outra IA

> Este arquivo existe pra qualquer IA (Claude, GPT, Gemini, etc.) conseguir
> entender o projeto inteiro rapidamente, sem precisar reconstruir o
> histórico a partir do zero. Se você é uma IA lendo isso agora: leia o
> arquivo inteiro antes de mexer em qualquer coisa. O `README.md` (na raiz
> também) é mais focado em "como configurar/publicar"; este arquivo é mais
> focado em "o que é isso, pra quem é, e o que já foi aprendido no caminho".

## O que é e por que existe

Site estático (HTML/CSS/JS puro, sem framework, sem build step) que simula
uma loja de joias fictícia ("Aryah Joias") pra conduzir a um pedido de
namoro, seguido de uma página "Nossa História" cheia de conteúdo pessoal
(timeline em constelação, quiz do casal, contrato de namoro cômico,
playlist, cápsula do tempo, galeria de fotos, mapa dos lugares, easter
eggs, etc). É um projeto de programação **pessoal e não comercial**,
construído aos poucos com ajuda de IA, ao longo de várias sessões de
conversa (este arquivo é o resultado de várias rodadas de pedidos e
correções).

**As pessoas envolvidas:** Gabriel Schmeisk (quem está construindo o site
e vai fazer o pedido) e Ana, apelido Poloni, nome completo **Ana Julia
Poloni** (quem vai receber o site/pedido). O site é feito **para ela**
ver — qualquer conteúdo (quiz, adjetivos, perguntas) deve fazer sentido
sendo lido por ela, não por ele.

## Regras de escrita (sempre seguir)

- Escrever como o Gabriel escreveria: tom natural, direto, carinhoso,
  levemente informal — nunca "arrumadinho" ou genérico demais.
- **NUNCA usar travessão (—)** em texto que ela vai ler (é característico
  de IA) — usar vírgula ou ponto no lugar. Isso já foi verificado
  automaticamente várias vezes ao longo do projeto (busca por `—` em
  todos os textos de `js/config.js`).
- **Nunca reproduzir letra de música ou verso de poeta com direito
  autoral**, nem trecho curto entre aspas. Pode citar o **nome/título** de
  uma música normalmente (ex.: "Um Dia Te Levo Comigo" é citada várias
  vezes pelo nome, nunca pela letra). O casal gosta de Jorge & Mateus —
  várias referências no site citam títulos reais dessa dupla (Sosseguei,
  Um Dia Te Levo Comigo, Pra Sempre Com Você, Duas Metades, Amo Noite e
  Dia) só pelo nome/tema, nunca com letra copiada.
- Todo texto pessoal deve soar genuíno e observador (detalhes específicos
  dos dois), nunca clichê. Evitar metáforas grandiosas demais (ex.: já foi
  removida uma metáfora sobre "bilhões de anos de poeira virando estrela"
  por soar exagerada/genérica).
- Erros de português são levados a sério — o Gabriel já pediu correção
  explícita de frases como "guarda essa carta guardadinha" (redundante) e
  "só sabe de uma coisa" (não devia ser assim). Sempre reler o que foi
  escrito procurando concordância, redundância e frases que não soam
  naturais faladas em voz alta.
- Não é possível gerar ilustrações artísticas (imagem gerada por IA) — só
  tipografia, ícones (Bootstrap Icons), emojis/caracteres Unicode (úteis
  pra decoração que precisa sobreviver à exportação em imagem, ver seção
  de exportação abaixo) e fotos reais que o Gabriel for adicionando.

## Dados reais do casal (já usados no conteúdo, não inventar por cima)

- Ana (Poloni) e Gabriel (Gabriel Schmeisk).
- Bichos dela (ainda não moram juntos, por isso "seus bichos", não
  "nossos"): Koda, Xixico, Kovu (cachorros — o Kovu "torce" descaradamente
  por ela, apesar de fingir neutralidade), Yuk, Ahadi, Shury (gatos), Sol
  e Lua (calopsitas). Em memória: Negão, **Slinky** (ajudou muito ela numa
  fase difícil; o Gabriel não chegou a conhecê-lo direito, mas conheceu a
  família dela de verdade nesse momento difícil), Tommy, Anne, Iris.
- Aniversário dela: **8 de agosto**.
- Primeiro encontro: **30 de maio**, no Colina, em Orlândia.
- Data oficial ("nosso data", primeiro "eu te amo"): **14 de junho**, no
  carro, depois de sair da Brooks.
- **21 de junho**: dia da estrada de terra (carro atolou, tentou tirar com
  o triângulo do carro, não ajudou muito, mas viraram boa lembrança rindo).
- **12 de julho**: foram a Nuporanga (ideia era só passar rápido pra pegar
  uma blusa de frio, foram na feira), e o Gabriel acabou conhecendo o tio
  e a tia dela sem planejar, "foi difícil, mas deu tudo certo".
- **20 de julho**: ela conheceu os avós dele em Santa Rosa de Viterbo,
  foram ao Parque Curupira (Ribeirão Preto), sentaram num balanço em Sales
  de Oliveira — ela achou que ele ia pedir em namoro ali (as alianças
  ainda não tinham chegado).
- Ela ama girassol **de verdade**, não é força de expressão. Ama viajar,
  hambúrguer do **Grill** com picles (o restaurante preferido do casal), é
  vegetariana.
- **O "código" deles**: quando ela pergunta se ele ama muito ela, ele
  responde "sim, tal qual o Chaves ama sanduíche de presunto" — essa
  frase aparece em vários lugares do site (perguntas do checkout, quiz,
  easter egg da loja).
- Slinky nunca deve ser tratado com humor leve — é um assunto sensível
  (perda de um bicho de estimação numa fase difícil da vida dela).

## Arquitetura (mapa de arquivos)

```
index.html          → site principal inteiro: loja falsa → checkout/suspense
                       → carta final → "Nossa História" (tudo dentro de UMA
                       página, screens alternados via display:none/'')
galeria.html         → álbum de fotos/vídeos PERMANENTE, independente,
                       carrega utils.js (compartilha funções com index.html)
checklist.html        → "Nosso Checklist" (lista de programas/experiências
                       do casal), página PERMANENTE e independente, com
                       contador de progresso ("X de Y feitos" + barra) —
                       ver seção própria abaixo
diagnostico.html     → testes técnicos + reset do site + reset PARCIAL do
                       contrato de namoro (ela NUNCA vê essa página)

css/style.css        → TODO o CSS do projeto inteiro (um arquivo só)

js/config.js         → TODA a configuração e conteúdo editável (nomes, textos,
                       timeline, quiz, playlist, listas, placeholders de mídia,
                       lista mestra de easter eggs). REGRA FIXA: config nova
                       sempre vai aqui, nunca espalhada pelo código.
js/db.js             → camada de acesso ao IndexedDB (Dexie) — mídia do
                       usuário + configs (obterConfiguracao/salvarConfiguracao)
js/sync.js           → sincronização entre aparelhos via Supabase Storage
                       (bucket público, sem login — o "segredo" é o
                       EXPERIENCE_ID fixo) + reset remoto + backup/share
js/romance.js        → toda a lógica da página "Nossa História" (o maior
                       arquivo do projeto: timeline, mapa, quiz, playlist,
                       adjetivos, carta de discussão, easter egg da lua,
                       preview da loja, etc)
js/suspense.js       → perguntas de checkout → assinatura → vídeo → carta final
js/store.js          → lógica da loja falsa (inclui os easter eggs de 5 toques)
js/futuro.js         → mensagens/cápsulas pro futuro
js/checklist.js      → lógica da checklist.html (renderiza CHECKLIST_ENCONTROS,
                       marca/desmarca item, contador de progresso). Usa
                       obterConfiguracao/salvarConfiguracao normalmente,
                       então entra no backup/sincronização como qualquer
                       config pequena (ver seção própria abaixo)
js/export.js         → geração de itens pra baixar/imprimir (mapa, constelação,
                       carta em PDF, polaroid) + backup completo (.zip)
js/utils.js          → funções COMPARTILHADAS entre index.html, galeria.html e
                       diagnostico.html: placeholders de imagem, modo vela,
                       bloqueio de zoom, descoberta de itens da galeria,
                       contador de toques repetidos, contador de easter eggs,
                       código Morse, cores de fundo
js/galeria.js        → lógica específica da galeria.html
js/diagnostics.js    → lógica da diagnostico.html
js/desktop-block.js  → bloqueia acesso via desktop (QR code), bypass de teste
js/main.js           → ponto de entrada do index.html, decide qual "estágio"
                       mostrar ao carregar (loja / checkout / final)
```

**Importante sobre `js/utils.js`:** ele é carregado nas TRÊS páginas HTML.
Qualquer função nova que precise ser usada em mais de uma página (ex.:
descoberta de fotos da galeria, contador de easter eggs) deve morar lá, e
NÃO deve ser duplicada em outro arquivo — já aconteceu de uma duplicata
quebrar `diagnostico.html` inteiro (erro de "identificador já declarado")
quando as duas cópias coexistiram sem querer. Antes de criar uma função,
verificar se ela já existe em outro arquivo carregado na mesma página.

## Convenções e coisas que a IA deve saber ANTES de mexer

- **Sem framework, sem npm, sem build.** Scripts carregados via `<script
  src="js/arquivo.js">` direto no HTML, na ordem que aparece — ordem
  importa (ex.: `config.js` sempre primeiro, `utils.js` antes de qualquer
  arquivo que use suas funções).
- **`const`/funções top-level em arquivos carregados juntos não podem ter
  o mesmo nome** — script clássico, sem módulos, todo mundo compartilha o
  mesmo escopo global. Sempre checar quais arquivos JS uma página carrega
  antes de duplicar um nome.
- Todo texto de conteúdo pessoal vive em `js/config.js` — nunca hard-code
  texto novo direto no HTML/JS se ele for "conteúdo" (nomes, frases,
  histórias). HTML só tem estrutura + texto de interface genérico.
- **Sem framework de teste automatizado no repositório**, mas ao longo do
  projeto foi usado (fora do repo, só como ferramenta de verificação)
  jsdom + Node pra simular DOM e testar fluxos de clique sem precisar de
  navegador de verdade. Recomendado fazer isso antes de entregar qualquer
  mudança: montar um teste rápido em jsdom simulando os cliques principais
  e conferir que os elementos certos aparecem/somem.
- **Todas as fotos/vídeos/áudios são resolvidos via placeholder** (objeto
  `PLACEHOLDERS` em `config.js` + funções `getAsset()` /
  `resolverFotoPlaceholder()` / `aplicarImagemPlaceholder()` em
  `utils.js`/`config.js`). Enquanto o arquivo de verdade não existe, um
  SVG "adicione esta foto" aparece no lugar — nunca quebra como imagem
  ausente. Ao adicionar uma foto nova a alguma seção, sempre seguir esse
  padrão em vez de referenciar um caminho fixo direto.
- **Entrega de correções/pedidos: mandar SEMPRE só o(s) arquivo(s)
  individual(is) que foram de fato modificados** (ex.: `js/romance.js`,
  `js/utils.js`), nunca o projeto inteiro zipado de novo — isso vale
  mesmo que várias sessões diferentes tenham ido mexendo em arquivos
  diferentes. Só reempacotar o `.zip` inteiro se o Gabriel pedir isso
  explicitamente (ex.: pra subir no GitHub Pages do zero).

## Bugs reais já encontrados e corrigidos (padrões a evitar repetir)

Estes já causaram problemas de verdade no site e a correção de cada um
está comentada no código, mas vale saber de antemão:

1. **`position: fixed` dentro de ancestral com `overflow: hidden` no
   Safari do iPhone** — um modal/overlay dentro de uma seção com
   `overflow:hidden` parecia "não fazer nada" ao tocar (o iOS clipa
   `position:fixed` nesse caso, mesmo sem `transform` no ancestral, ao
   contrário do que a spec sugeriria). Solução: qualquer overlay/modal
   novo deve ser filho direto do `<body>`, nunca aninhado dentro de uma
   seção com overflow:hidden.
2. **`align-items: center` num overlay com `overflow-y: auto` e conteúdo
   mais alto que a tela** faz o overlay abrir mostrando o meio/fim do
   conteúdo, não o topo (clássico bug de centering + overflow). Todos os
   overlays de carta/texto longo usam `align-items: flex-start` +
   padding responsivo (`clamp()`) + `overlay.scrollTop = 0` ao abrir.
3. **iOS ignora `user-scalable=no` do viewport** (decisão da Apple, desde
   iOS 10, por acessibilidade) — toques rápidos/duplos ainda ativam o
   zoom nativo mesmo com isso no meta viewport. A correção certa é CSS
   `touch-action: manipulation` (aplicado globalmente em `html, body` e em
   elementos clicáveis específicos), não tentar bloquear via
   `preventDefault` em JS sozinho (o bloqueio em JS existe também, em
   `bloquearZoom()`, mas só como reforço).
4. **Bloqueio de duplo-toque baseado só em tempo (sem checar o
   elemento/posição) suprime cliques legítimos** — um easter egg de 5
   toques rápidos no MESMO botão tinha os cliques "engolidos" por um
   bloqueador de zoom que prevenia `touchend` em qualquer par de toques
   rápidos na tela inteira. Corrigido pra só bloquear quando os dois
   toques caem no mesmo elemento E na mesma posição (aproximada).
5. **Trava de rolagem (`bloquearScrollFundoLembranca`/
   `desbloquearScrollFundoLembranca`) com uma única variável
   compartilhada** quebra se dois overlays travarem a rolagem de forma
   sobreposta (o primeiro a fechar destrava tudo, mesmo com o outro ainda
   aberto). Agora é contagem de referências — só destrava de verdade
   quando todo mundo que travou também destravou.
6. **`html2canvas` (usado pra gerar as imagens de exportar: mapa,
   constelação, carta em PDF) não é confiável com `clip-path` nem `mask`
   — evitar essas propriedades em qualquer elemento que precise ser
   exportado como imagem.** Prefira `border-radius`, gradientes
   (`linear-gradient`/`radial-gradient`) e texto/caracteres Unicode reais
   (esses sim renderizam bem no html2canvas) pra qualquer decoração.
7. **Exportar arquivo via `<a download>` com uma `data:` URI não funciona
   no Safari do iPhone** — o toque não faz nada visível, mesmo com o
   arquivo gerado certinho por trás (dá a impressão de "não fez nada" com
   uma mensagem de sucesso enganosa). A correção geral é
   `salvarOuCompartilharArquivo()` em `utils.js`: tenta `navigator.share`
   com um `File` de verdade primeiro (funciona bem no iPhone), cai pro
   link de download tradicional depois, e abre em nova aba como último
   recurso. Qualquer exportação nova (imagem, PDF, zip) deve usar essa
   função, nunca um link de download direto sozinho.
8. **Elementos gerados dinamicamente (grid de fotos, listas) com tamanho
   FIXO no CSS quebram quando a quantidade de itens muda** (mapa e
   constelação pra imprimir cortavam conteúdo assim que mais lugares/
   marcos eram adicionados). Ver `calcularGradeParaCaber()` em
   `export.js`: calcula colunas e tamanho de foto dinamicamente a partir
   da quantidade real de itens, sempre cabendo no canvas fixo de
   exportação (10x15cm).
9. **`<html>` tinha cor de fundo fixa no CSS enquanto só o `<body>` mudava
   de cor via JS** (`definirFundoBody()`) — qualquer diferença mínima de
   altura entre os dois (comum no celular, com a barra de endereço
   mudando de tamanho) deixava aparecer um fundo claro por baixo, como uma
   faixa em branco no fim da página. `definirFundoBody()` agora seta os
   dois (`document.documentElement` e `document.body`) sempre juntos.
10. **Alternar `display:none` → `''` num elemento com filhos `.reveal-up`
    (animação de entrada com `animation-fill-mode: forwards`) REINICIA a
    animação do zero** (o navegador recria o subtree inteiro), fazendo o
    conteúdo reaparecer invisível por um instante mesmo na segunda vez que
    a pessoa vê aquela tela. Ao reexibir uma tela que já foi vista antes,
    forçar essas animações pro estado final (`el.style.animation='none';
    el.style.opacity='1'`) em vez de deixar tocar de novo.
11. **Imagens/vídeos com `width`/`height` fixos sem `object-fit: cover`
    esticam o conteúdo** se a proporção real do arquivo for diferente
    (aconteceu na polaroid ao vivo do suspense e no preview da câmera).
    Qualquer imagem/vídeo com dimensão forçada precisa de
    `object-fit: cover` junto.
12. **Overlays reutilizados por várias "cartas" diferentes** (carta final,
    cápsula do tempo, carta de discussão) devem, sempre que possível,
    reaproveitar a MESMA função genérica (`abrirModoVela()` em
    `utils.js`) em vez de cada uma ter sua lógica de exibição própria —
    reduz duplicação e concentra os bugs de exibição de carta num lugar
    só, mais fácil de corrigir de vez.
13. **Um handler `async` de checkbox/toggle que faz "ler estado do banco →
    mutar → salvar" a cada clique tem uma condição de corrida real**
    quando dois toggles acontecem em sequência rápida (ex.: marcar vários
    itens de uma lista um atrás do outro): os dois liam o mesmo estado
    antigo antes de qualquer um terminar de salvar, e o segundo salvamento
    sobrescrevia o primeiro, perdendo a marcação (achado com um teste
    jsdom automatizado no checklist, ver `js/checklist.js`). Correção
    padrão: manter o estado em memória (carregado uma vez) como fonte da
    verdade, mutando e persistindo sempre o MESMO objeto, nunca relendo do
    banco entre uma mudança e outra.

14. **Botão "anterior"/"próxima" entre lembranças em "Nosso céu" travava o
    site e deixava um fundo roxo depois de fechar o modal.**
    `abrirEstrelaModal()` (`js/romance.js`) é chamada tanto pra abrir o
    modal do zero quanto pra trocar de lembrança com o modal já aberto
    (`estrelaModalAnterior()`/`estrelaModalProxima()`), mas chamava
    `bloquearScrollFundoLembranca()` (trava de scroll por CONTAGEM DE
    REFERÊNCIAS, ver item 5 acima) toda vez, sem checar se o modal já
    estava aberto. Resultado: cada troca de lembrança somava mais uma
    trava, mas só existe UM `desbloquearScrollFundoLembranca()` (ao
    fechar o modal de vez), então a contagem nunca voltava a 0 depois de
    navegar por mais de uma lembrança, deixando a trava de scroll
    (`aurora-scroll-lock`) presa pra sempre, o site "travado" (sem
    resposta a toque/scroll) e um fundo roxo aparecendo por baixo.
    Corrigido guardando se o overlay já estava visível ANTES da chamada
    (`jaEstavaAberto`) e só chamando `bloquearScrollFundoLembranca()`
    quando ele estava realmente fechado.

15. **Sair do site no celular no meio do carregamento da Galeria
    (`galeria.html`) deixava a varredura pela metade pra sempre.** No
    celular, trocar de app/apagar a tela quase nunca fecha a aba de
    verdade, o navegador só CONGELA a página como está (bfcache) e, ao
    voltar, restaura ela exatamente daquele jeito, sem rodar
    `DOMContentLoaded` de novo. Como `montarGaleria()` (`js/galeria.js`)
    só era chamada nesse evento, uma varredura interrompida nunca era
    retomada, sobravam só as fotos que já tinham entrado na grade até o
    momento de sair. Corrigido com um listener de `pageshow`: se
    `evento.persisted` for `true` (restaurado de um congelamento) e a
    varredura ainda não tinha terminado (flag `__galeriaCarregamentoCompleto`),
    refaz `montarGaleria()` do zero — rápido, porque HEAD/imagens já
    baixadas vêm do cache do navegador.

16. **"Nossos momentos" (mesa de 4 fotos em "Nossa História") às vezes não
    conseguia achar foto nenhuma, mostrando placeholder vazio.** Duas
    causas combinadas em `descobrirFotosParaDestaque()`/`galeriaDescobrirItem()`
    (`js/utils.js`): (a) qualquer resposta HEAD que não fosse sucesso era
    tratada como "a foto não existe", inclusive falhas passageiras de
    rede (429/503/instabilidade de 4G) que não são um 404 de verdade; (b)
    a varredura desistia depois de alguns números seguidos sem achar nada
    (tolerância a "buracos" pensada pra varredura completa, que não faz
    sentido numa faixa pequena e já limitada). Corrigido em 3 camadas: só
    um 404 confirmado conta como "não existe" (qualquer outra falha tenta
    de novo); a varredura da faixa de fotos não desiste mais por buraco
    (`Infinity` de tolerância); e, como rede de segurança em
    `iniciarGaleriaMomentos()` (`js/romance.js`), se mesmo assim não
    achar NENHUMA foto, refaz com a varredura completa e exaustiva da
    Galeria, e se existir pelo menos 1 foto real mas menos de 4, repete
    as que existem pra preencher os 4 cartões — só cai no placeholder
    "adicione esta foto" se a galeria estiver mesmo totalmente vazia.
    Além disso, `iniciarGaleriaMomentos()` agora só resolve depois que
    cada `<img>` escolhida REALMENTE terminar de carregar no navegador
    (evento `load`/`error`, com timeout de segurança de 6s) — antes ela
    retornava assim que decidia quais fotos mostrar (HEAD só confirma que
    o arquivo existe, não baixa a foto), então a tela de carregamento de
    "Nossa História" podia esconder antes das fotos aparecerem de
    verdade.

17. **As 4 fotos de "Nossos momentos" às vezes pareciam todas do mesmo
    dia**, porque a escolha era um sorteio totalmente livre entre as
    fotos encontradas e fotos do mesmo momento tendem a ter números de
    arquivo seguidos (`galeria_12.jpg`, `galeria_13.jpg`...). Corrigido
    com `escolherFotosEspalhadas()` (`js/utils.js`): ordena as fotos pela
    numeração, divide a faixa em pedaços iguais (um pedaço por cartão) e
    sorteia uma foto de dentro de CADA pedaço — garante que as 4 escolhas
    vêm de regiões diferentes da numeração (ex.: foto 4, foto 12, foto
    20, foto 27) em vez de poderem sair vizinhas por acaso. Para isso,
    `descobrirFotosParaDestaque()` também passou a devolver `{numero,
    caminho}` (não só o caminho) e passou a varrer a faixa de fotos
    INTEIRA (sem meta de quantidade nem ponto de início sorteado como
    antes), já que a seleção por espaçamento precisa conhecer todas as
    fotos existentes na faixa pra dividir em pedaços corretamente.

## Checklist de encontros ("Nosso Checklist")

Página separada `checklist.html` (+ `js/checklist.js`), acessível pelo botão
"Ver nosso checklist" na seção "Nosso checklist" de `index.html` (dentro de
"Nossa História"). Lista 132 programas/experiências do casal, agrupados em
9 categorias (`CHECKLIST_ENCONTROS`, em `js/config.js` — conteúdo extraído
de uma lista pronta fornecida pelo Gabriel, texto dos itens não deve ser
reescrito sem necessidade).

- **Formato do estado salvo:** chave `aurora_checklist_encontros`
  (`obterConfiguracao`/`salvarConfiguracao`, como qualquer config pequena),
  valor é um objeto só com os itens MARCADOS: `{ "<catIdx>_<itemIdx>": true }`.
  Item desmarcado simplesmente não existe no objeto.
- **IDs são por POSIÇÃO**, não por texto — reordenar ou remover itens no
  meio de uma categoria em `CHECKLIST_ENCONTROS` faz o progresso salvo
  "escorregar" para os itens vizinhos. Pra adicionar itens novos no
  futuro, sempre ACRESCENTAR no final de uma categoria (ou como categoria
  nova no final da lista).
- **Entra no backup/sincronização entre aparelhos** como qualquer outra
  config: precisou ser adicionado EXPLICITAMENTE em duas pontas de
  `js/export.js` (`gerarBackupZipBlob` e `aplicarBackupDeZip`), porque o
  manifest do zip lista campos um por um, não faz backup de toda a tabela
  `configuracoes` automaticamente — qualquer config nova que precise
  sincronizar entre aparelhos tem que ser adicionada nesses dois lugares
  também, não só salva com `salvarConfiguracao`.
- **Estado em memória como fonte da verdade** (`__checklistEstadoAtual` em
  `js/checklist.js`): a primeira versão relia ler o estado do banco a cada
  toggle, o que causava uma condição de corrida real (achada num teste
  jsdom automatizado) — marcar vários itens em sequência rápida perdia
  marcações, porque dois toggles liam o mesmo estado antigo antes de
  qualquer um salvar. Corrigido carregando o estado uma vez ao montar a
  página e só mutando/persistindo esse mesmo objeto daí pra frente, nunca
  relendo do banco entre um toggle e outro.
- `checklist.html` carrega Dexie + JSZip (para sincronizar de verdade,
  igual ao index.html) e chama `sincronizarNaAbertura()` ao abrir — ao
  contrário de `galeria.html`, que é 100% estática e não sincroniza nada.
- Resumo de progresso ("X de Y já vivemos juntos" + barra) também aparece
  dentro de "Nossa História" (`renderizarResumoChecklist()`, em
  `js/romance.js`), sem precisar abrir a página separada.

**Adicionar item pelo site (novo, 30/07/2026):** botão "Adicionar item"
no card de progresso de `checklist.html` abre um modal (escolher uma das
9 categorias já existentes + escrever o texto). Itens adicionados assim
NÃO entram em `CHECKLIST_ENCONTROS` (que continua só com o conteúdo
original) — ficam numa lista separada, chave de config
`aurora_checklist_itens_customizados` (array de
`{ id, catIdx, texto, criadoEm }`, `id` gerado na hora tipo
`custom_<timestamp>_<random>`, `catIdx` aponta pra uma categoria já
existente). Isso evita o problema de "IDs por posição" descrito acima:
um item customizado pode ser removido sem bagunçar a marcação dos
vizinhos, porque o id dele nunca é reaproveitado. Marcado/desmarcado usa
o MESMO objeto `aurora_checklist_encontros` de sempre, só que com esse
id como chave em vez de `<catIdx>_<itemIdx>`. Item customizado aparece
no fim da categoria escolhida, com borda tracejada + botão "x" pra
remover (com confirmação) — itens originais não têm esse botão.
**Entra no backup/sincronização** como qualquer config nova: adicionado
em `js/export.js` (`gerarBackupZipBlob` e `aplicarBackupDeZip`, igual
ao que já existia pra `aurora_checklist_encontros`). O total usado no
card de progresso (`checklistTotalItens()`, `js/checklist.js`) e no
resumo dentro de "Nossa História" (`renderizarResumoChecklist()`,
`js/romance.js`) foi ajustado pra somar os itens customizados ao total
original de 132.

## Reset parcial do contrato de namoro (adicionado nesta sessão)

`diagnostico.html` agora tem, além do "Resetar site" (total), um botão
**"Resetar só o contrato"** — motivo: uma vez que o contrato é gerado
(`regrasSelecionadas.length >= MIN_REGRAS`), `prepararContrato()` em
`js/romance.js` some com a grade de seleção e só mostra o contrato já
pronto, então não existia nenhum jeito de refazer a escolha das cláusulas
sem apagar o site inteiro.

- Botão em `diagnostico.html` (`#btnResetarContrato`), lógica em
  `executarResetContrato()` (`js/diagnostics.js`). Mesma senha do reset
  total (`SENHA_RESET_SITE`) por ser destrutivo, mas bem mais restrito.
- Apaga só a chave `aurora_regras_contrato` via nova função
  `excluirConfiguracao(chave, imediato)` (`js/db.js`, generalizável para
  qualquer reset parcial futuro) — remove de localStorage + IndexedDB e
  chama `marcarAtualizacaoLocal(true)`, então a remoção **sincroniza
  normalmente com o outro aparelho** pelo caminho de backup de sempre
  (próximo `gerarBackupZipBlob()` não vai incluir `regrasContrato`, então
  `aplicarBackupDeZip()` no outro aparelho também não vai restaurá-lo).
- **NÃO usa** o marcador de "reset publicado na nuvem"
  (`publicarResetNaNuvem()`/`meta.resetado`) — esse mecanismo é exclusivo
  do reset TOTAL. Um reset parcial não precisa (nem deve) forçar o outro
  aparelho a se limpar por completo.
- `solicitarSenhaReset()` agora aceita `{ titulo, subtitulo }` opcionais
  para customizar o texto do modal de senha (antes era fixo "Resetar o
  site" / "apaga tudo", o que ficaria enganoso reaproveitado para o reset
  parcial do contrato e para a troca de vídeo do pedido — ambos os
  usos já foram corrigidos para textos específicos).

## Sistema de easter eggs

Lista mestra em `IDS_TODOS_OS_EASTER_EGGS` (`js/config.js`) — qualquer
easter egg novo precisa ter seu id incluído ali, senão o contador (ver
abaixo) não bate o total. Hoje são 9:
- 7 na loja (`LOJA_EASTER_EGGS`, em `config.js`): 5 toques em cada
  elemento marcado com a classe `easter-egg-gatilho` (mecanismo genérico
  em `contarToquesRepetidos()`, `utils.js`).
- 1 na lua do "Nosso céu" (código Morse, sem tradução — de propósito, a
  graça é ela decifrar sozinha).
- 1 no calculador de frete da loja (digitar "140626", a data deles).

Cada um, ao ser encontrado, chama `marcarEasterEggEncontrado(id)`
(`utils.js`), que persiste no IndexedDB (via `obterConfiguracao`/
`salvarConfiguracao`) e atualiza um contador discreto e fixo no canto da
tela (`#contadorEasterEggs`, "X de 9" — nunca revela QUAIS foram achados,
só o total). Girassóis pequenos (`.easter-egg-dica`) marcam visualmente
onde tem um easter egg clicável; ficam bem discretos na primeira visita à
loja e um pouco maiores nas visitas seguintes (`aplicarTamanhoDicasEasterEgg()`
em `store.js`, usa a config `lojaJaVisitouAntes`).

Existe também um atalho de TESTE pra desktop (digitar
"abrirauroradesktop" em qualquer lugar da página) que NÃO conta como
easter egg — é ferramenta de desenvolvimento, não surpresa pra ela achar.

## Estado atual (o que já está pronto)

Praticamente tudo descrito no `README.md` já está implementado e
funcionando: loja falsa com checkout disfarçado de "perguntas de
entrega" (com botão "Não" que foge pela tela inteira, cupom falso,
popup de "manutenção" e carrossel promocional como detalhes de imersão),
carta final que abre direto em modo "luz de vela" com música, flashback
cinematográfico, "Nossa História" completa (contador vivo do tempo de
relacionamento, constelação da timeline com meteoros/nave alienígena/lua
clicável, mapa dos lugares, quiz do casal, playlist de 4 faixas, contrato
de namoro com cláusulas cômicas/ousadas, cápsula do tempo, carta de
discussão protegida por senha, baralho de adjetivos "se um dia estiver
triste, lembre-se disso", "nossos momentos" com 4 fotos aleatórias da
galeria de verdade, seção "coisas que a Poloni ama", seção "seus bichos",
vídeo em câmera lenta de um momento com frases sobrepostas, mensagem
especial que só aparece no dia do aniversário dela, easter egg do
sobrenome, proteção por senha pra reabrir a página depois que o pedido já
aconteceu, vídeo do pedido alternativo via YouTube), galeria de fotos com
descoberta automática e barra de carregamento, exportação de
mapa/constelação/cartão postal/carta física/polaroid (todas com fallback
de compartilhamento pro iPhone), backup completo em .zip, sincronização
entre aparelhos via Supabase, reset remoto com confirmação (total e
parcial, só do contrato), e um contador discreto de easter eggs.

## Funcionalidades que faltavam neste arquivo (auditoria de 27/07/2026)

O Gabriel pediu pra conferir se tudo que existe no código também está
documentado aqui. Lendo `js/config.js` seção por seção (cada bloco de
comentário com `/* ---- TÍTULO ---- */`) e cruzando com o que já estava
escrito neste arquivo, estas funcionalidades EXISTIAM no código mas não
estavam descritas aqui (agora estão, com as chaves/funções certas pra
achar rápido):

- **Proteção por senha da área de memórias** (a mais importante que
  faltava): depois que o pedido acontece (`aurora_stage === 'final'`),
  toda vez que o link for aberto de novo, `js/main.js` chama
  `solicitarSenhaMemorias()` (`js/romance.js`) ANTES de mostrar "Nossa
  História" — senha é `SENHA_AREA_MEMORIAS` (`'1406'`, em `js/config.js`).
  Uma vez digitada certo, fica desbloqueada só nesta sessão/aba
  (`sessionStorage`, chave `aurora_memorias_desbloqueadas`) — fechar e
  reabrir o navegador pede de novo. Tem uma animação de "errado" (shake)
  no overlay quando a senha não bate. **Diferente** da senha do reset
  (`SENHA_RESET_SITE`) e da senha da carta de discussão — são 3 senhas
  distintas, cada uma protegendo uma coisa diferente.
- **Senha da carta de discussão**: valor real é `SENHA_CARTA_DISCUSSAO =
  'teamo'` com dica `DICA_SENHA_CARTA_DISCUSSAO` ("as duas palavras que a
  gente nunca pode esquecer de dizer um pro outro"), em `js/config.js`.
  Isso já estava citado de forma genérica aqui ("carta de discussão
  protegida por senha"), mas sem os valores — agora estão registrados.
- **Especial de aniversário (8 de agosto)**: `ANIVERSARIO_DIA`/
  `ANIVERSARIO_MES` + `textoAniversario()` em `js/config.js`. Checando
  pela hora do servidor (mesma fonte de tempo confiável da cápsula, ver
  `obterHoraConfiavel()` em `js/sync.js`), toda vez que o site é aberto
  justo no dia 8 de agosto, uma seção com mensagem exclusiva aparece no
  topo de "Nossa História", acima de tudo o mais.
- **Câmera lenta de um momento**: `MOMENTO_LENTO_ARQUIVO_BASE` (nome do
  arquivo esperado em `assets/video/`), `MOMENTO_LENTO_VELOCIDADE` (0.45 =
  quase metade da velocidade normal) e `MOMENTO_LENTO_FRASES` (frases que
  vão surgindo por cima, uma de cada vez), tudo em `js/config.js`; lógica
  em `iniciarMomentoLento()` (`js/romance.js`). Segue o mesmo padrão de
  "some sozinho se o arquivo não existir" do resto do projeto — ver
  `assets/video/LEIA-ME-camera-lenta.md`.
- **Baralho "se um dia estiver triste, lembre-se disso"**: é como o
  `ADJETIVOS_PARA_ELA` (já citado aqui como "adjetivos com frase própria
  cada") é apresentado na tela — não é uma lista simples, é um baralho de
  cartas que ela vira uma de cada vez, cada carta com um adjetivo +
  motivo específico (não genérico). Tem mais de 70 adjetivos hoje.
- **Easter egg do sobrenome**: `TEXTO_EASTER_EGG_SOBRENOME` (`js/config.js`)
  + `exibirEasterEggSobrenome()` (`js/romance.js`) — uma mensagem
  brincando que ela "deixa de ser 'do Vale' e vira 'Schmeisk'". **Atenção:
  apesar do nome, isso NÃO é um dos 9 easter eggs "de verdade" contados no
  `IDS_TODOS_OS_EASTER_EGGS`** — é só um texto mostrado automaticamente em
  "Nossa História", não algo escondido pra ela descobrir. Não adicionar
  ao contador nem tratar como o easter egg nº 10.
- **Vídeo do pedido via YouTube (alternativa ao vídeo local)**: config
  `aurora_video_pedido_youtube` (só o ID do vídeo), lida por
  `iniciarVideoYoutubePedido()` em `js/romance.js`, fica logo abaixo de
  "Nossas lembranças". Existe porque o vídeo gravado localmente
  (IndexedDB) pode ficar grande demais pro armazenamento do celular —
  serve como alternativa/complemento, sincroniza normalmente como
  qualquer outra config pequena.
- **Seção "Coisas que a Poloni ama"**: lista `COISAS_QUE_ELA_AMA` em
  `js/config.js` (10 itens hoje, cada um com ícone Bootstrap + frase) —
  pequena seção da página de memórias, deliberadamente enxuta pra não
  virar uma lista de curiosidades genérica.
- **Exportação "cartão postal do mapa"**: além de mapa/constelação/carta
  física/polaroid (já citados aqui), `js/export.js` também gera um
  **cartão postal** (`gerarCartaoPostal()`, botão
  `#btnExportarCartaoPostal`) — mais um formato de exportação do mapa dos
  lugares, mesmo padrão de fallback de compartilhamento pro iPhone.
- **Detalhes de imersão da loja falsa** (menores, mas valem registro):
  popup de "manutenção" (`#maintenancePopup`, "algumas áreas do site
  estão passando por manutenção"), cupom falso que aparece 7s depois de
  entrar na loja (cancelado se avançar pro checkout antes — havia um bug
  real de corrida aqui, já corrigido, ver `cancelarCupomFalsoPendente()`
  em `js/store.js`) e um carrossel promocional com auto-rotação — tudo em
  `js/store.js`, reforça a ilusão de e-commerce real.
- **Vídeo, música e "chuva" de corações/balões no especial de 8 de
  agosto**: o bloco de aniversário já existente (`verificarEspecialAniversario()`
  em `js/romance.js`, `ANIVERSARIO_DIA`/`ANIVERSARIO_MES`/`textoAniversario()`
  em `js/config.js`) agora também: (1) mostra um vídeo dentro do próprio
  bloco, se o arquivo `assets/video/video-aniversario.{mp4,mov,webm}`
  existir (`ANIVERSARIO_VIDEO_ARQUIVO_BASE`, resolvido com
  `resolverVideoPorBase()`, já existente, mesmo padrão do vídeo de
  "câmera lenta"); (2) toca uma música só nesse dia, se o arquivo
  `assets/audio/musica-aniversario.{mp3,ogg,wav,m4a}` existir
  (`ANIVERSARIO_MUSICA_ARQUIVO_BASE`, resolvido por uma função nova,
  `resolverAudioPorBase()`, análoga a `resolverVideoPorBase()`, com nova
  constante de extensões `AUDIO_EXTENSOES_ACEITAS` em `js/config.js`) —
  como autoplay com som pode ser bloqueado pelo navegador, tem um botão
  redondo pequeno (`#btnAniversarioMusica`) pra ela dar o play/pause na
  mão; (3) dispara uma "chuva" de corações e balões subindo de baixo pra
  cima da tela (`iniciarChuvaDeAniversario()`, container fixo
  `#aniversarioChuvaContainer` já presente no `<body>` de `index.html`,
  duração configurável em `ANIVERSARIO_CHUVA_DURACAO_MS`/itens em
  `ANIVERSARIO_CHUVA_ITENS`, ambos em `js/config.js`). As três coisas só
  acontecem no dia 8 de agosto de verdade (mesma checagem de hora do
  servidor que já existia) e cada uma é totalmente opcional: vídeo e
  música ficam escondidos/mudos sozinhos enquanto os arquivos não
  existirem, sem quebrar nada. **Pendente:** o Gabriel ainda vai
  adicionar o vídeo e a música de verdade nas pastas (ver os dois
  `LEIA-ME*.md` novos em `assets/video/` e `assets/audio/`).

- **Contador vivo do relacionamento**: grid que mostra anos/meses/
  dias/horas/minutos/segundos "vivos" (atualiza a cada segundo),
  `iniciarContadorVivo()`/`calcularDuracaoRelacionamento()` em
  `js/romance.js`. **Ponto pra confirmar com o Gabriel**: a data usada
  como início da contagem é `aurora_primeiro_acesso` (a data em que ESTE
  SITE foi aberto pela primeira vez, guardada automaticamente na primeira
  visita via `obterOuCriarDataPrimeiroAcesso()`), não a data oficial do
  casal (14 de junho). Pode ser intencional (contar a partir de quando
  ela começou a ver o site/a jornada), mas se a intenção for contar o
  relacionamento desde 14/06, esse é o lugar certo pra ajustar.

## Verificação geral do site (feita nesta sessão, 27/07/2026)

Pedido explícito do Gabriel: conferir se havia algo inconsistente ou
quebrado no site como um todo, além de adicionar o reset do contrato.
Resultado: **nenhum bug novo encontrado**, o site está consistente com o
que este arquivo e o `README.md` já descreviam. O que foi checado
(programaticamente, não só lendo o código por cima):

1. **Duplicação de nomes top-level entre arquivos JS carregados na mesma
   página** (o bug nº 
   [ver item já catalogado sobre `diagnostico.html` quebrar por causa de
   função duplicada] já aconteceu antes) — rodada uma checagem em todas
   as 4 páginas (`index.html`, `galeria.html`, `checklist.html`,
   `diagnostico.html`) comparando `function`/`const`/`let`/`var`
   declarados no nível raiz de cada arquivo JS que a página carrega.
   **Nenhuma duplicata encontrada** em nenhuma das 4 combinações.
2. **IDs referenciados via `getElementById` nos arquivos JS de cada
   página vs. IDs que existem no HTML daquela página** — todo "id
   faltando" encontrado automaticamente foi conferido manualmente e é um
   FALSO POSITIVO esperado: são elementos criados dinamicamente via
   `innerHTML`/`createElement` em tempo de execução (ex.:
   `dataPedidoTimeline` em `romance.js`, `desktopBlockQr` em
   `desktop-block.js`) — não existem no HTML estático, mas são criados
   antes de serem lidos. Os poucos casos em que um elemento só existe em
   `index.html` mas a função que o lê mora em `utils.js` (compartilhado
   entre as 4 páginas) — `abrirModoVela()`, `aplicarVisibilidadeContadorEasterEggs()`,
   `atualizarContadorEasterEggs()` — já têm guarda `if (!elemento) return;`
   logo no início, então rodam sem erro nas páginas onde o elemento não
   existe (galeria/checklist/diagnóstico). Nenhuma correção necessária.
3. **Regra "nunca travessão (—) em texto que ela vai ler"** — refeita a
   busca por `—` em `js/config.js` filtrando comentários e o campo
   interno `descricao:` (que é só anotação pra você, nunca aparece pra
   ela). As ~35 ocorrências restantes são todas cabeçalhos de blocos de
   comentário (`SEÇÃO X — descrição`), nenhuma dentro de string/template
   literal de conteúdo real. **Regra sendo seguida corretamente.**
4. **Backup/restauração (`js/export.js`)** — confirmado que tanto
   `aurora_regras_contrato` (contrato) quanto `aurora_checklist_encontros`
   (checklist) estão presentes nos dois lados (`gerarBackupZipBlob` E
   `aplicarBackupDeZip`), como o padrão documentado exige.
5. **Config pendente de preenchimento** (`js/config.js`): `URL_DO_SITE`
   (vazio) e `CAPSULA_YOUTUBE_ID` (vazio) continuam pendentes — já
   documentado abaixo, não é bug, é decisão que só o Gabriel pode tomar
   (onde hospedar / se vai ter vídeo na cápsula). `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SENHA_RESET_SITE` e `EXPERIENCE_ID` já estão
   preenchidos com valores reais (não são mais placeholder).
6. **Sintaxe de todos os arquivos `js/*.js`** validada com
   `node --check` (sem erro em nenhum).
7. **Ordem de carregamento dos `<script>`** em cada uma das 4 páginas
   conferida contra as dependências reais de cada arquivo (`config.js`
   antes de quem usa `TEXTOS`/config; `utils.js` antes de quem usa suas
   funções) — sem problema em nenhuma página, incluindo o caso de
   `galeria.html` carregar `desktop-block.js` antes de `config.js` (não é
   problema porque `desktop-block.js` não depende de nada de `config.js`).

**Não foi possível** desta vez rodar um teste funcional real em jsdom
simulando cliques (como o próprio projeto recomenda antes de entregar
mudanças) porque este ambiente de sessão está sem acesso à rede para
instalar o pacote `jsdom` — se quiser esse nível de verificação a mais,
peça numa sessão com rede liberada, ou rode localmente com Node.

## Sistema de Códigos Secretos (novo, 27/07/2026)

Adicionado a pedido do Gabriel: dentro do modal "Mais opções" (no fim de
"Nossa História", `index.html`), agora existe um campo "Código Secreto"
onde ele pode digitar um dos 5 códigos cadastrados pra abrir um conteúdo
especial. **Sistema propositalmente isolado do resto do site** (não usa
login, cadastro, LocalStorage, IndexedDB nem nenhuma função de
`utils.js`/`romance.js`/etc), pra ele conseguir editar/adicionar/remover
código no futuro sem risco de quebrar mais nada:

```
/secret/secret.js       → CODIGOS_SECRETOS (objeto central), normalização
                           do texto digitado (maiúsculo, sem acento, sem
                           espaço/hífen) e handleSecretCode(código)
/secret/secret.css      → CSS exclusivo (campo, botão, animações,
                           estilo-base compartilhado pelas 5 páginas)
/secret/letter.html     → carta romântica (código X7KVM)
/secret/video.html      → player de vídeo, pronto pra receber
                           assets/video-secreto.{mp4,webm,mov} sem mexer
                           em código (código Q3ZTN)
/secret/coupon.html     → livrinho de vales-presente do amor: cada toque
                           puxa um vale aleatório (array VALES_PRESENTE,
                           editável dentro do próprio arquivo), evita
                           repetir o mesmo vale duas vezes seguidas
                           (código W9LXR)
/secret/fortune.html    → bilhete da sorte apaixonado: cada toque puxa
                           uma mensagem/previsão aleatória (array
                           BILHETES_DA_SORTE, editável dentro do próprio
                           arquivo) (código K4QWZ)
/secret/wheel.html      → roleta girável de ideias de encontro (array
                           IDEIAS_DE_ENCONTRO, editável dentro do
                           próprio arquivo; a roleta é desenhada
                           automaticamente a partir do array, então
                           adicionar/remover item não exige mexer no
                           desenho) (código R8NVX)
```

**Por que não repetiu galeria/cápsula/aniversário:** essas 3 ideias
originais do sistema de códigos secretos foram substituídas a pedido do
Gabriel porque o site já tem galeria de fotos (`galeria.html`), cápsula
do tempo (dentro de "Nossa História", `js/futuro.js`) e um bloco
especial de aniversário 8/8 (`verificarEspecialAniversario()` em
`js/romance.js`) — os 3 códigos novos (vales-presente, bilhete da sorte,
roleta de ideias de encontro) são conteúdo genuinamente novo, não
duplicam nada que já existia.

Código errado mostra só "Código inválido" (sem dica). Código certo
mostra uma pequena animação no campo antes de navegar pra página.
`diagnostico.html` ganhou uma seção "Códigos Secretos" que lê
`CODIGOS_SECRETOS` direto de `secret/secret.js` e lista nome interno,
finalidade, arquivo, descrição e data de criação de cada um, só pra
controle/manutenção (ela nunca vê essa página). **Pendente:** o vídeo
de verdade em `secret/assets/video-secreto.mp4` (mostra aviso enquanto
não existir).

## Mapa da relação: prévia + modal "Ver todos os lugares" (novo, 29/07/2026)

`MAPA_LUGARES` (`js/config.js`) cresceu de 8 para **13 lugares**: os 4 novos
são **Verace** (Ribeirão Preto), **Praça da Bike** (Ribeirão Preto),
**Cruzeiro** (São Simão) e **Mostarda** (São Joaquim da Barra) — todos com
`texto: ''` e um comentário `// Texto de exemplo — troque pelo que esse
lugar realmente significa pra vocês.` no código, ou seja, **ainda faltam as
frases de verdade pra cada um** (só o nome/cidade/ícone já foram
preenchidos). Fotos já registradas em `PLACEHOLDERS` (`mapa_verace`,
`mapa_praca_bike`, `mapa_cruzeiro`, `mapa_mostarda`), esperando os arquivos
`mapa-verace.*`, `mapa-praca-bike.*`, `mapa-cruzeiro.*`, `mapa-mostarda.*`
em `assets/img/`.

Como a lista cresceu, a seção "Nosso mapa" (dentro de "Nossa História",
`index.html`) agora mostra só uma **prévia** (os 4 primeiros lugares,
`MAPA_QUANTIDADE_PREVIA` em `js/romance.js`) com um botão "Ver todos os
lugares" que abre um **modal** com a trilha completa:

```
js/romance.js → preencherGridDoMapa(grid, lugares)   — função genérica que
                 já existia, agora reaproveitada pra preencher tanto o grid
                 da prévia (#mapaTrilhaGrid) quanto o do modal
                 (#mapaTrilhaGridCompleto)
              → renderizarMapaDaRelacao()             — decide o que entra
                 na prévia (só corta se `MAPA_LUGARES.length >
                 MAPA_QUANTIDADE_PREVIA`) e mostra/esconde o botão
                 (#mapaVerTodosWrap)
              → iniciarMapaModal()                    — abre/fecha o modal
                 (#mapaModalOverlay), mesma trava de rolagem de fundo
                 (bloquearScrollFundoLembranca/desbloquearScrollFundoLembranca)
                 usada pelos outros overlays do site
index.html    → #mapaVerTodosWrap / #btnMapaVerTodos (botão da prévia),
                 #mapaModalOverlay / #btnFecharMapaModal / #mapaTrilhaGridCompleto
                 (modal em si, reaproveita a classe .carta-discussao-overlay)
css/style.css → seção "Modal 'todos os nossos lugares' (trilha completa do
                 mapa)" (.mapa-modal-caixa, .mapa-modal-titulo)
```

Se a lista de lugares cair para `MAPA_QUANTIDADE_PREVIA` (4) ou menos, o
botão "Ver todos os lugares" fica escondido automaticamente e a prévia já
mostra a trilha inteira — não precisa de nenhum ajuste manual ao
adicionar/remover lugares no futuro, só editar `MAPA_LUGARES` como sempre.

## Reformulação da descoberta da Galeria (novo, 30/07/2026)

**Problema relatado:** a Galeria (`galeria.html`) demorava muito pra
carregar, e a ABERTURA do site também estava mais lenta que o normal.

**Causa raiz:** tanto `galeriaEscanearCompleta()` (Galeria) quanto
`descobrirFotosParaDestaque()` ("Nossos momentos", dentro de "Nossa
História") descobrem o que existe em `assets/img/galeria/` "no chute":
testam `galeria_1`, `galeria_2`, `galeria_3`... em lotes, via requisições
HEAD, contra o servidor. Isso sempre rodava DO ZERO a cada abertura de
página — e, o que é pior, depois que o pedido de namoro já aconteceu,
`js/main.js` manda a abertura do site inteiro direto pra
`goToRomancePage()` (que inclui "Nossos momentos"), ou seja, essa
varredura passou a rodar em TODA abertura do link, não só na primeira.

**Solução (mantendo o fluxo "só jogar o arquivo numerado na pasta, sem
editar nada em lugar nenhum" — ver comentário grande em `js/config.js`,
não mudou):**

1. **Cache local por aparelho** (`localStorage`, chave
   `aurora_galeria_cache_v1`, funções `galeriaLerCache`/
   `galeriaLerCache(true)`/`galeriaSalvarCacheSeMelhor`/
   `galeriaLimparCache`, todas em `js/utils.js`). Da segunda abertura em
   diante no mesmo aparelho/navegador, a Galeria e "Nossos momentos" usam
   esse cache e aparecem NA HORA, sem esperar nenhuma requisição de rede.
   Um cache "completo" (fotos + vídeos, gerado só por
   `galeriaEscanearCompleta`, usado pela Galeria) nunca é sobrescrito por
   um cache "parcial" (só fotos, gerado por `descobrirFotosParaDestaque`,
   usado por "Nossos momentos") — assim a Galeria nunca perde itens que já
   sabia que existiam.
2. **Revalidação em segundo plano, throttlada**
   (`galeriaRevalidarEmSegundoPlano()`, `js/utils.js`): tanto a Galeria
   quanto "Nossos momentos" disparam, DEPOIS de já mostrar algo na tela
   (cache ou varredura própria), uma nova varredura completa em segundo
   plano — mas só se o cache não existir ou já tiver mais de 3 horas
   (`GALERIA_REVALIDACAO_INTERVALO_MS`). Fotos/vídeos novos que Gabriel
   adicionar aparecem na PRÓXIMA abertura, nunca travando a abertura
   atual.
3. **Mais paralelismo na varredura em si** (`galeriaVarrerFaixa`, em
   `js/utils.js`): lote aumentado de 8 para 24 números por vez — só
   importa mesmo na primeiríssima abertura de cada aparelho (quando ainda
   não existe cache nenhum), bem menos idas-e-voltas até o servidor no
   total.
4. **Botão "Limpar cache da Galeria"** em `diagnostico.html` (seção
   "Galeria de lembranças", `executarLimparCacheGaleria()` em
   `js/diagnostics.js`) — força uma varredura de verdade na PRÓXIMA
   abertura deste aparelho específico, útil se Gabriel acabou de
   adicionar/remover fotos e quer ver a mudança sem esperar as 3 horas de
   throttle.

**Não muda:** o formato dos arquivos (`galeria_N.jpg`/`galeria_N.mp4`,
faixas separadas por `GALERIA_INICIO_VIDEOS`), `GALERIA_LEGENDAS`,
`GALERIA_YOUTUBE`, o lightbox, o masonry por colunas, a lógica de
"Nossos momentos" escolher fotos espalhadas pela numeração
(`escolherFotosEspalhadas`) — só a CAMADA DE DESCOBERTA foi reformulada.
Sintaxe de `js/utils.js`, `js/galeria.js`, `js/romance.js` e
`js/diagnostics.js` validada com `node --check` depois da mudança.

## Botão separado "Ver vídeos" na Galeria (novo, 30/07/2026)

**Problema relatado:** mesmo depois da reformulação da descoberta (seção
acima), abrir `galeria.html` sempre montava fotos E vídeos juntos na
grade (`galeriaEscanearCompleta`), e vídeo é sempre um arquivo bem mais
pesado que foto. Isso deixava a abertura da Galeria mais pesada do que
precisava, mesmo quando a pessoa só queria ver as fotos.

**Solução:** a abertura da Galeria agora monta só as fotos. Os vídeos
(locais, a partir de `GALERIA_INICIO_VIDEOS` = 101, e os do YouTube,
`GALERIA_YOUTUBE`) só entram na grade quando a pessoa aperta o botão
"Ver vídeos", que aparece separado, no topo de `galeria.html`, com sua
própria barrinha de carregamento.

```
js/utils.js  → galeriaEscanearFotos(aoProgredir, aoEncontrarItem)   — só
                a faixa 1..GALERIA_INICIO_VIDEOS-1 (usa manifesto/cache
                quando existir)
             → galeriaEscanearVideos(aoProgredir, aoEncontrarItem)  — só
                a faixa GALERIA_INICIO_VIDEOS..GALERIA_MAX_NUMERO,
                chamada só pelo clique no botão
             → galeriaEscanearCompleta() continua existindo, sem
                mudança, só para o fallback de "Nossos momentos"
                (romance.js) quando nada mais acha nenhuma foto
             → galeriaRevalidarEmSegundoPlano() agora revalida só
                fotos (galeriaEscanearFotos) — a faixa de vídeos nunca
                roda sozinha em segundo plano
js/galeria.js → montarGaleria() varre/monta só fotos na abertura
             → carregarVideosDaGaleria() (nova) varre/monta vídeos
                locais + YouTube, chamada pelo clique em
                #btnGaleriaVerVideos; some com o botão se achar algo,
                mostra "Nenhum vídeo por aqui ainda." e deixa tentar de
                novo depois se não achar nada
             → colunas do masonry viraram variável de módulo
                (`__galeriaColunas`) em vez de local a montarGaleria(),
                porque a seção de vídeos precisa continuar adicionando
                itens nas mesmas colunas depois que a montagem inicial
                já terminou
galeria.html → #galeriaVideosToggleWrap / #btnGaleriaVerVideos (botão)
                e #galeriaCarregandoVideos (barra própria, reaproveita
                as mesmas classes CSS da barra de fotos)
css/style.css → `.galeria-videos-toggle` (só espaçamento, sem CSS novo
                de barra/botão — reaproveita `.galeria-carregando*` e
                as classes utilitárias do Bootstrap já usadas em botões
                parecidos do site, ex. "Ver todos os lugares")
```

O cache local (`aurora_galeria_cache_v1`, mesma chave/formato de antes)
não mudou de estrutura: continua guardando `{itens, completo, salvoEm}`.
O que mudou é só QUANDO cada parte é lida/gravada: fotos gravam um cache
parcial (`completo: false`) se não houver manifesto; ao apertar "Ver
vídeos", o resultado se combina com as fotos já conhecidas e vira um
cache completo (`completo: true`), deixando um segundo clique (ou uma
próxima visita) instantâneo. `diagnostico.html` ("Limpar cache da
Galeria") continua limpando fotos e vídeos juntos, é a mesma chave.

**Não muda:** o formato dos arquivos, `GALERIA_LEGENDAS`,
`GALERIA_YOUTUBE`, o lightbox (navegação entre itens continua funcionando
igual, só que vídeos entram no `__galeriaItens` depois das fotos agora),
o masonry por colunas, "Nossos momentos" (continua só com fotos, como
já era). Sintaxe de `js/utils.js`, `js/galeria.js` e `js/diagnostics.js`
validada com `node --check` depois da mudança.

## Pendências / sugestões em aberto

- Sincronização de reset entre aparelhos foi reportada como
  intermitente numa sessão recente; o código foi revisado a fundo e
  parece correto (já passou por várias correções anteriores, com retry e
  confirmação de leitura) — se voltar a falhar, o primeiro passo é rodar
  "Testar conexão com a nuvem" em `diagnostico.html` antes de mexer no
  código, pra descartar problema de configuração do Supabase (bucket,
  chaves, cota do plano gratuito) antes de suspeitar de bug.
- Adicionar as fotos/vídeos reais nas pastas (ver os `LEIA-ME*.md`
  espalhados em `assets/`).
- Escrever a frase (`texto:`) de verdade dos 4 lugares novos do mapa
  (Verace, Praça da Bike, Cruzeiro, Mostarda) em `MAPA_LUGARES`
  (`js/config.js`) — hoje estão vazios com um comentário de placeholder.
  Adicionar também as 4 fotos correspondentes (ver seção "Mapa da relação"
  acima).
- Preencher `URL_DO_SITE` em `config.js` assim que decidir onde hospedar.
- Testar tudo de verdade num iPhone físico — boa parte dos bugs
  encontrados até aqui só aparecem no aparelho real, não em simulação.
- Ideias discutidas mas não implementadas: diário de bordo vivo, mais
  locais de easter egg (preço da pulseira, texto do prazo de entrega),
  indicador de progresso mais rico no contador de easter eggs.
