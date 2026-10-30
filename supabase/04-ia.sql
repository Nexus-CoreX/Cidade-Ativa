-- =====================================================================
-- Cidade Ativa · Migração 04: limite de uso da IA
-- Rode depois do 02. Não apaga dados; pode rodar mais de uma vez.
-- Cada usuário pode pedir no máximo 20 classificações por hora
-- (protege a cota/créditos do serviço de IA contra abuso).
-- =====================================================================

create table if not exists public.ia_uso (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists ia_uso_user_tempo on public.ia_uso (user_id, criado_em);
alter table public.ia_uso enable row level security;   -- sem políticas: só a função abaixo mexe na tabela

-- Chamada pela Edge Function "classificar" antes de consultar a IA
create or replace function public.registrar_uso_ia()
returns integer language plpgsql security definer set search_path = public as $$
declare v_qtd integer;
begin
  if auth.uid() is null then raise exception 'Faça login para usar a IA.'; end if;
  delete from public.ia_uso where criado_em < now() - interval '1 day';
  select count(*) into v_qtd from public.ia_uso
   where user_id = auth.uid() and criado_em > now() - interval '1 hour';
  if v_qtd >= 20 then
    raise exception 'Limite de sugestões da IA atingido. Tente novamente mais tarde.';
  end if;
  insert into public.ia_uso (user_id) values (auth.uid());
  return 20 - v_qtd - 1;   -- quantas ainda restam nesta hora
end $$;

revoke all on function public.registrar_uso_ia() from public, anon;
grant execute on function public.registrar_uso_ia() to authenticated;
