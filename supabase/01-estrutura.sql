-- =====================================================================
-- Cidade Ativa · Estrutura do banco no Supabase
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
-- ATENÇÃO: apaga e recria as tabelas do app. Rode só na primeira instalação;
-- depois rode 02-contas-e-visao-geral.sql e 03-conta-mestre.sql.
-- =====================================================================

-- Limpeza (cuidado: apaga os dados das tabelas do Cidade Ativa)
drop table if exists public.historico cascade;
drop table if exists public.ocorrencias cascade;
drop table if exists public.perfis cascade;
drop function if exists public.e_prefeitura() cascade;
drop function if exists public.atualizar_status(bigint, text, text) cascade;

-- ---------------------------------------------------------------------
-- 1. Perfis: dados públicos de cada usuário do Supabase Auth
-- ---------------------------------------------------------------------
create table public.perfis (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text not null,
  perfil    text not null default 'cidadao' check (perfil in ('cidadao', 'prefeitura')),
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra.
-- Todo cadastro pelo site vira "cidadao"; contas da prefeitura são promovidas
-- manualmente (ou use a conta mestre, veja 03-conta-mestre.sql).
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- Usuários que já existiam antes deste script também ganham perfil
insert into public.perfis (id, nome)
select id, coalesce(nullif(trim(raw_user_meta_data ->> 'nome'), ''), split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Ajudante usado nas regras de segurança
create function public.e_prefeitura()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and perfil = 'prefeitura');
$$;

-- ---------------------------------------------------------------------
-- 2. Ocorrências
-- ---------------------------------------------------------------------
create table public.ocorrencias (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  autor     text not null default '',
  descricao text not null check (length(trim(descricao)) > 0),
  categoria text not null check (categoria in ('buraco', 'iluminacao', 'lixo', 'sinalizacao', 'outros')),
  status    text not null default 'Recebida'
            check (status in ('Recebida', 'Em análise', 'Em andamento', 'Resolvida')),
  endereco  text,
  lat       double precision not null,
  lng       double precision not null,
  foto_url  text,
  criado_em timestamptz not null default now()
);
create index on public.ocorrencias (user_id);
create index on public.ocorrencias (status);

-- ---------------------------------------------------------------------
-- 3. Histórico (linha do tempo de cada ocorrência)
-- ---------------------------------------------------------------------
create table public.historico (
  id             bigint generated always as identity primary key,
  ocorrencia_id  bigint not null references public.ocorrencias (id) on delete cascade,
  status         text not null,
  nota           text not null,
  por            text not null,
  criado_em      timestamptz not null default now()
);
create index on public.historico (ocorrencia_id);

-- Ao registrar: garante autor/status corretos (o navegador não decide isso)
create or replace function public.preparar_ocorrencia()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id   := auth.uid();
  new.autor     := coalesce((select nome from public.perfis where id = auth.uid()), '');
  new.status    := 'Recebida';
  new.criado_em := now();
  return new;
end $$;
create trigger antes_inserir_ocorrencia before insert on public.ocorrencias
  for each row execute function public.preparar_ocorrencia();

-- Depois de registrar: primeira entrada do histórico
create or replace function public.historico_inicial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.historico (ocorrencia_id, status, nota, por)
  values (new.id, 'Recebida', 'Ocorrência registrada.', 'Sistema');
  return new;
end $$;
create trigger depois_inserir_ocorrencia after insert on public.ocorrencias
  for each row execute function public.historico_inicial();

-- Prefeitura muda o status: atualiza a ocorrência e grava o histórico juntos
create function public.atualizar_status(p_id bigint, p_status text, p_nota text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  if not public.e_prefeitura() then
    raise exception 'Apenas a prefeitura pode alterar o status.';
  end if;
  if p_status not in ('Recebida', 'Em análise', 'Em andamento', 'Resolvida') then
    raise exception 'Status inválido.';
  end if;
  select nome into v_nome from public.perfis where id = auth.uid();
  update public.ocorrencias set status = p_status where id = p_id;
  if not found then raise exception 'Ocorrência não encontrada.'; end if;
  insert into public.historico (ocorrencia_id, status, nota, por)
  values (p_id, p_status, coalesce(nullif(trim(p_nota), ''), 'Status atualizado.'), v_nome);
end $$;

-- ---------------------------------------------------------------------
-- 4. Segurança (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.perfis      enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.historico   enable row level security;

-- Perfis: cada um vê o seu; a prefeitura vê todos. Ninguém edita pelo site
-- (assim um cidadão não consegue se promover a prefeitura).
create policy "perfis: ver" on public.perfis for select to authenticated
  using (id = auth.uid() or public.e_prefeitura());

-- Ocorrências: cidadão vê e cria as próprias; prefeitura vê todas.
-- Alteração de status só pela função atualizar_status().
create policy "ocorrencias: ver" on public.ocorrencias for select to authenticated
  using (user_id = auth.uid() or public.e_prefeitura());
create policy "ocorrencias: criar" on public.ocorrencias for insert to authenticated
  with check (user_id = auth.uid());

-- Histórico: visível para quem pode ver a ocorrência
create policy "historico: ver" on public.historico for select to authenticated
  using (exists (select 1 from public.ocorrencias o where o.id = ocorrencia_id
                 and (o.user_id = auth.uid() or public.e_prefeitura())));

grant execute on function public.atualizar_status(bigint, text, text) to authenticated;
revoke execute on function public.atualizar_status(bigint, text, text) from anon;

-- ---------------------------------------------------------------------
-- 5. Fotos (Supabase Storage)
-- Bucket público para leitura (as fotos abrem por link); envio só por
-- usuários logados, cada um dentro da própria pasta (<id do usuário>/...).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: enviar" on storage.objects;
create policy "fotos: enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- DEPOIS de criar a conta da prefeitura pelo site, promova-a com:
--
--   update public.perfis set perfil = 'prefeitura'
--   where id = (select id from auth.users where email = 'email-da-prefeitura@exemplo.com');
-- =====================================================================
