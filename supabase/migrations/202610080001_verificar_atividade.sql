-- Execute uma vez no SQL Editor do projeto Supabase.
-- Sem acesso a tabelas, dados pessoais ou privilégios elevados.
begin;
create or replace function public.poloni_verificar_atividade()
returns boolean
language sql
volatile
security invoker
set search_path = ''
as $$ select true; $$;
revoke all on function public.poloni_verificar_atividade() from public;
grant execute on function public.poloni_verificar_atividade() to anon, authenticated;
commit;
notify pgrst, 'reload schema';
