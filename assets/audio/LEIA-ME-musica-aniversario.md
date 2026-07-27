# Música do especial de aniversário (8 de agosto)

Pra essa música tocar sozinha junto com o bloco de "Feliz aniversário"
(que só aparece quando o site é aberto no dia 8 de agosto), basta
colocar o arquivo aqui nesta pasta (`assets/audio/`) com o nome exato:

```
musica-aniversario.mp3
```

## Extensão do arquivo: qualquer uma dessas serve

`.mp3`, `.ogg`, `.wav` ou `.m4a` — maiúsculo ou minúsculo, tanto faz. O
site testa sozinho até achar a extensão certa. Essa lista fica em
`AUDIO_EXTENSOES_ACEITAS`, em `js/config.js`.

## Como funciona

O site tenta tocar a música sozinho assim que o bloco de aniversário
aparece. Alguns navegadores (principalmente no iPhone) bloqueiam
autoplay com som, então existe um pequeno botão redondo (ícone de nota
musical) junto do bloco pra ela dar o play manualmente se precisar, e
também pra pausar/retomar quando quiser. A música toca em loop enquanto
ela estiver na página.

## O que escolher

Qualquer música que combine com o momento, dá pra usar uma das músicas
já citadas no site (Jorge & Mateus, por exemplo) ou outra de escolha
sua, só lembrando de nunca reproduzir a letra em texto em nenhum lugar
do site, só a própria música tocando.

## Enquanto o arquivo não existir

Sem problema, o resto do bloco de aniversário continua funcionando
normalmente; simplesmente nada toca e o botão de música não aparece.
Assim que adicionar o arquivo com o nome certo, é só recarregar a
página no dia 8 de agosto.
