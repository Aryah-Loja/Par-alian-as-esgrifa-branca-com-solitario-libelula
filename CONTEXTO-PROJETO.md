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
  família dela de verdade nesse momento difícil), Tommy, Anne.
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
diagnostico.html     → testes técnicos + reset do site (ela NUNCA vê essa página)

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
entrega" (com botão "Não" que foge pela tela inteira), carta final que
abre direto em modo "luz de vela" com música, flashback cinematográfico,
"Nossa História" completa (constelação da timeline com meteoros/nave
alienígena/lua clicável, mapa dos lugares, quiz do casal, playlist de 4
faixas, contrato de namoro com cláusulas cômicas/ousadas, cápsula do
tempo, carta de discussão protegida por senha, adjetivos com frase
própria cada, "nossos momentos" com 4 fotos aleatórias da galeria de
verdade), galeria de fotos com descoberta automática e barra de
carregamento, exportação de mapa/constelação/carta física/polaroid
(todas com fallback de compartilhamento pro iPhone), backup completo em
.zip, sincronização entre aparelhos via Supabase, reset remoto com
confirmação, e um contador discreto de easter eggs.

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
- Preencher `URL_DO_SITE` em `config.js` assim que decidir onde hospedar.
- Testar tudo de verdade num iPhone físico — boa parte dos bugs
  encontrados até aqui só aparecem no aparelho real, não em simulação.
- Ideias discutidas mas não implementadas: diário de bordo vivo, mais
  locais de easter egg (preço da pulseira, texto do prazo de entrega),
  indicador de progresso mais rico no contador de easter eggs.
