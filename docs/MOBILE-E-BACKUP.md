# Mesversários e backup em dispositivos móveis

A seção de mesversários fica depois de Mensagem rápida, antes de Seu mural, com navegação na mesma ordem. Ao abrir uma carta, o foco vai ao título do formulário: o teclado só aparece quando a pessoa toca num campo. Campos de data/número ocupam uma coluna em telas pequenas; campos, títulos e botões respeitam a largura disponível.

O ZIP mantém o formato poloni-backup v4. O empacotador calcula SHA-256 e prepara o arquivo em um Web Worker nos navegadores compatíveis, com alternativa no processo principal. O botão mostra a memória em processamento e o percentual do arquivo. Fotos/vídeos usam STORE; apenas o manifesto textual usa DEFLATE. Cada Blob é lido uma vez durante a geração. Arquivos com checksum, tamanho e MIME iguais compartilham uma entrada física no ZIP, mantendo todas as identidades no manifesto. A restauração existente aceita essa referência compartilhada.

Otimizações autorizadas podem trazer o campo otimizacao com sha256Original, sha256Otimizado e data. Na mesclagem, a versão reduzida só substitui a origem quando ambos os checksums e a ordem dos relógios conferem. Uma restauração antiga não reintroduz os bytes de origem conhecidos. Conteúdos realmente diferentes ou edições posteriores continuam sendo preservados pela política normal de conflitos. Nenhuma otimização ocorre no celular durante a exportação.

Validação: testes automáticos de integridade, deduplicação, restauração, progresso, mídia vazia e conflitos; navegador Chromium em larguras 320/360/390/430/768/1280, incluindo formulário real dentro da página Nossa História, persistência da carta, geração com worker e continuidade do processamento da interface. Safari/iPhone físico não foi executado nesta sessão.
