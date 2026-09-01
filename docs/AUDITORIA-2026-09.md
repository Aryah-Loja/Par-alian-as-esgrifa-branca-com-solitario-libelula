# Auditoria técnica — setembro de 2026

## Escopo

Revisão do armazenamento local, backup, sincronização Supabase, restore,
concorrência entre aparelhos, mídias estáticas, dependências, pontos de XSS,
URLs temporárias, duplicatas e documentação.

## Riscos encontrados e tratamento

| Prioridade | Achado | Tratamento |
|---|---|---|
| Crítica | Backup remoto inteiro podia ser substituído sem commit atômico | Gerações imutáveis, validação das partes, checksum e ponteiro final |
| Crítica | Um navegador novo podia participar de decisões por timestamp local | Revisão remota monotônica e flag local explícita de alterações |
| Crítica | Dois aparelhos ainda podiam cruzar a última rechecagem de revisão | Lock remoto temporário, confirmação de posse pré-commit e expiração segura |
| Crítica | Restore podia destruir dados antes de provar que o arquivo estava íntegro | Validação completa e transação aditiva |
| Alta | Listas de dois aparelhos podiam perder itens | União por id e tombstones |
| Alta | Reset parcial podia ressuscitar em outro aparelho | Relógios por chave para modificação/exclusão |
| Alta | Recados tratavam falha de rede como histórico vazio | Leitura obrigatória, união por id, confirmação e repetição |
| Alta | Duas mídias `.mp4` tinham zero bytes | Removidas; gerador e teste agora rejeitam mídia vazia |
| Alta | Onze arquivos `.jpg` continham HEIC e doze continham WebP | Convertidos para JPEG real; teste rejeita extensão incompatível |
| Alta | Oito `.jpg` da galeria tinham bytes destruídos por conversão para texto | Removidos da galeria ativa, identificados abaixo e preservados no histórico Git |
| Média | Entradas remotas chegavam a `innerHTML` sem escape | Escape central e validação de classes/atributos |
| Média | Object URLs permaneciam vivos após re-render | Revogação e gerenciador central |
| Média | Galeria carregava `utils.js` sem o banco e gerava erro de referência | Preferências cosméticas usam fallback local seguro quando `db.js` não existe |
| Média | Bloqueio de desktop podia deixar evento de orientação acessar elementos removidos | Verificações de existência impedem a falha |
| Média | Dexie/Supabase não tinham versão exata e dependiam de CDN | Dexie 4.4.5, Supabase JS 2.112.4 e JSZip 3.10.1 fixos em `vendor/` |
| Baixa | `romance.js` e `utils.js` antigos duplicavam os arquivos de `js/` | Duplicatas removidas |
| Baixa | Documentação descrevia reset total e sincronização antiga | README e contexto atualizados |

## Proteções adicionadas

- diário técnico local com código `POLONI-AAAAMMDD-XXXXX`;
- painel de saúde e relatório técnico baixável;
- bloqueio de publicação de um estado anormalmente menor que o remoto;
- retenção indexada das três gerações recentes;
- partes remotas de 5 MB, abaixo do tamanho recomendado para upload padrão;
- workflow de auditoria em push e pull request;
- testes de merge, tombstones, checklist, estágio, sintaxe, manifesto, formato
  real das imagens, tamanho das partes, dependências e duplicatas.

## Pendências operacionais

- O bucket público continua sendo uma limitação de privacidade arquitetural.
- Gerações antigas que saem do índice não são apagadas automaticamente. Isso
  favorece recuperação, mas exige observar a cota do Storage.
- Foram encontrados pares de mídia com conteúdo idêntico (`105/106` e
  `117/118`, além de algumas fotos reaproveitadas em seções diferentes). Como
  os arquivos são válidos e podem representar posições intencionais na
  narrativa, foram mantidos; remover exige uma decisão editorial, não técnica.
- Os arquivos `galeria_14.jpg` a `galeria_21.jpg` eram irrecuperáveis a partir
  do conteúdo atual: todos continham sequências UTF-8 de caractere substituto
  no lugar de bytes binários originais. Eles permanecem no commit histórico
  `c7a3548`, com prefixos SHA-256 respectivamente: `69fa2732b5c12e76`,
  `07866d7e834aa71b`, `5680efc7ecf25e68`, `02de79b1f490b997`,
  `f9bda5163a1983b0`, `36d78d48ca1edf56`, `dde714e75b9c051e` e
  `b9d5c8c79bdc39e0`. Para recolocá-los, use as fotos originais de outro
  aparelho, não os blobs do histórico.
- O teste real de upload/download/delete usa somente um objeto temporário de
  diagnóstico; ele não altera o backup oficial nem seu ponteiro.
- Em 01/09/2026, o fluxo real foi executado no projeto
  `mdiohswwximmsggmrzue`: upload de 5 MB, download com SHA-256 idêntico,
  remoção confirmada e ponteiro oficial verificado como inalterado.
- O backup remoto oficial ainda está no formato legado. Ele será incorporado
  e migrado para gerações na próxima publicação normal; a auditoria não o
  sobrescreveu apenas para testar a migração.
- A interface continua direcionada a celular; validar no Safari/iPhone e no
  Chrome/Android antes de uma mudança visual importante.
