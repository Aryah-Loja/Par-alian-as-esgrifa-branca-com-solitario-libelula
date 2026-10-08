# Verificação de atividade e proteção contra inatividade

O workflow `manter-supabase-ativo.yml` foi atualizado para consultar o PostgreSQL via RPC três vezes ao dia (00:17, 08:17 e 16:17 de Brasília), mesmo sem ninguém abrir o site. Depois consulta o ponteiro do backup no Storage. Falhas HTTP, dados inválidos e prazo esgotado causam falha visível no Actions, com retentativas limitadas.

A rotina antiga lia apenas um objeto público do Storage. Isso podia ser atendido pelo cache e não comprovava atividade do banco. A nova função retorna somente `true`, sem ler ou escrever dados pessoais, criar registros crescentes ou usar service_role.

## Ativação pendente

1. No SQL Editor do Supabase, execute uma vez `supabase/migrations/202610080001_verificar_atividade.sql`. O script é idempotente e concede apenas execução de uma função sem acesso a tabelas.
2. Publique o código e o workflow na branch padrão do repositório e habilite o GitHub Actions.
3. Execute manualmente “Verificar atividade e saúde do Supabase” na aba Actions. Confira o sucesso das consultas e habilite notificações de falhas nas preferências do GitHub.
4. Confira o aviso de inatividade enviado pelo Supabase e o último backup externo. Um projeto já pausado precisa ser retomado pelo painel antes da verificação.

Não foram aplicadas alterações no Supabase nem publicado o workflow nesta entrega: o material recebido é um ZIP sem conexão administrativa/Git autenticada. A existência local dos arquivos não significa automação ativa.

## Limites

Segundo a documentação oficial consultada em 08/10/2026, o plano gratuito pode pausar projetos com poucas consultas ao banco durante sete dias. Algumas consultas diárias normalmente ajudam, mas não oferecem garantia. Pausa não é a mesma coisa que exclusão imediata. A opção oferecida pelo Supabase para evitar pausa por inatividade é um plano pago; nenhuma assinatura foi contratada aqui.

GitHub informa que agendamentos podem atrasar/ser descartados e que workflows agendados de repositórios públicos são desativados após 60 dias sem atividade no repositório. Confira o Actions periodicamente ou use um agendador independente autorizado para chamar a mesma RPC. Não adicionamos commits fictícios, escritas no acervo ou restauração automática para mascarar esses limites.

A rotina não protege contra exclusão manual, conta comprometida, inadimplência, cota esgotada ou falha do provedor. Mantenha os backups externos criptografados e a chave de recuperação separada. O arquivo JSON de recadinhos permanece fora do ZIP de backup neste projeto; sua correção está fora desta adição.

Fontes:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## Transição enquanto o SQL não é aplicado

O workflow usa `--permitir-rpc-pendente`: somente quando o servidor confirma a ausência da função (HTTP 404/PGRST202), ele preserva a consulta de saúde do Storage e emite um aviso explícito de ativação pendente. Um workflow com esse aviso não comprova atividade do banco. Após executar o SQL, a próxima execução passa a consultar o banco automaticamente. Falhas de conexão, permissões, respostas inválidas e projeto indisponível continuam causando falha; não são escondidas pelo modo de transição.
