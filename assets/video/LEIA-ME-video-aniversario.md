# Vídeo do especial de aniversário (8 de agosto)

Pra esse vídeo aparecer dentro do bloco de "Feliz aniversário" (que só
aparece quando o site é aberto no dia 8 de agosto), basta colocar o
vídeo aqui nesta pasta (`assets/video/`) com o nome exato:

```
video-aniversario.mp4
```

## Extensão do arquivo: qualquer uma dessas serve

`.mp4`, `.mov` ou `.webm` — maiúsculo ou minúsculo, tanto faz (`.MP4`
funciona igual a `.mp4`). O site testa sozinho até achar a extensão
certa. Essa lista fica em `GALERIA_EXTENSOES_VIDEO`, em `js/config.js`.

## O que escolher

Diferente do vídeo de "Um instante em câmera lenta" (que toca mudo e em
loop), esse aqui aparece com controles e pode ter áudio de verdade, já
que é pensado como uma mensagem de aniversário gravada (um vídeo falando
com ela, por exemplo). Fica a critério: pode ser um recado, uma
homenagem com fotos, o que fizer mais sentido nesse dia.

## Enquanto o vídeo não existir

Sem problema, o resto do bloco de aniversário (texto, música, corações e
balões) continua funcionando normalmente; só o espaço do vídeo fica
escondido, sem espaço vazio nem nada quebrado. Assim que adicionar o
arquivo com o nome certo, é só recarregar a página no dia 8 de agosto
(ou testar mudando a data, se o site tiver esse modo de teste).
