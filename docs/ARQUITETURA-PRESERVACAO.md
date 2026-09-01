# Arquitetura de preservação

## Regra central

Nenhum upload ou restore começa apagando o estado atual. O banco local é a
fonte durável do aparelho; `localStorage` é apenas um espelho. Uma falha deve
terminar com a versão anterior ainda utilizável.

## Banco local

- `media`: um registro por foto, vídeo, áudio ou texto, com id persistente.
- `configuracoes`: valores pequenos e metadados de sincronização.
- `diagnosticos`: diário técnico local limitado, sem senhas, tokens ou
  conteúdo sentimental.
- Exclusões de mídia gravam `excluidoEm` em vez de remover o registro.
- Exclusões de configurações autorizadas gravam um relógio em
  `aurora_config_excluidas_em`; novas gravações atualizam
  `aurora_config_modificados_em`.

## Backup local

`gerarBackupZipBlob()` cria o formato `poloni-backup` versão 4. Antes de
entregar o arquivo, lê todas as configurações e mídias. O manifesto inclui:

- versão do formato e schema;
- ids, tipos, datas, tamanho e SHA-256 das mídias;
- contagens de configurações e mídias;
- total de bytes de mídia.

Mídia ausente, vazia ou impossível de ler aborta o backup. O backup anterior
não é tocado.

## Restore e merge

O ZIP inteiro, CRC, manifesto, arquivos, tamanhos e hashes são validados antes
da transação. Depois:

1. listas com ids são unidas;
2. tombstones de mesmo id vencem registros antigos;
3. o checklist usa relógio por item, inclusive para propagar uma desmarcação
   posterior; backups antigos sem relógio mantêm a união positiva;
4. o estágio `final` nunca regride;
5. conflitos escalares mantêm o valor local e registram o remoto no diário de
   conflitos preservados;
6. mídias divergentes mantêm uma versão canônica e outra com sufixo
   `__preservado_...`.

Somente após preparar tudo ocorre uma transação aditiva no IndexedDB.

## Publicação remota

Cada sincronização cria uma pasta imutável:

```text
<experience-id>/geracoes/<generation-id>/
  parte-000.zip
  parte-001.zip
  manifest.json
```

Partes têm no máximo 5 MB, mantendo o upload padrão abaixo da recomendação de
6 MB do Supabase. Cada uma é enviada sem sobrescrita e relida para confirmar
o tamanho. O ZIP completo tem SHA-256. O arquivo
`<experience-id>-meta.json` só muda depois dessas confirmações e aponta para a
geração atual, com revisão monotônica e histórico das três gerações recentes.

Antes de publicar, o aparelho baixa e mescla a geração remota atual. Uma
trava remota temporária serializa publicações entre aparelhos; seu token é
confirmado novamente imediatamente antes do commit. A trava expira após dez
minutos se um navegador for interrompido. A revisão também é relida antes do
commit; qualquer conflito tenta novamente sem apagar as gerações já enviadas.

## Limites de segurança e privacidade

O site é estático e não tem autenticação de usuários. O bucket atual é
público e a chave `anon` necessariamente fica disponível no cliente. Senhas da
interface evitam uso casual, mas não são uma fronteira forte de segurança.
Não guardar novos segredos ou dados pessoais sensíveis nesse bucket sem antes
migrar para autenticação e políticas restritivas.

As bibliotecas críticas ficam versionadas em `vendor/`; Supabase continua
dependendo de rede para sincronizar, mas a abertura do banco e a geração de
backup não dependem de CDN.

Versões verificadas nesta auditoria: Dexie `4.4.5`, JSZip `3.10.1` e
Supabase JS `2.112.4`. SHA-256 dos arquivos vendorizados, na mesma ordem:
`67246e0d7a764182cf4450728cdf2fcb6a246ff67cae97dc548cdb38b973f115`,
`acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e` e
`f8ce7fab799af1916019cbd0b485b39bb80dbdbc6dc062909a751c9e5198e04c`.

## Recuperação

1. Não force novo upload quando houver erro.
2. Baixe um backup manual do aparelho mais completo.
3. Abra `diagnostico.html`, consulte o código de erro e baixe o relatório
   técnico.
4. Preserve a geração remota atual e as anteriores.
5. Restaure o ZIP no aparelho desejado; o restore mescla, não substitui.
6. Rode `npm test` antes de publicar qualquer correção.
