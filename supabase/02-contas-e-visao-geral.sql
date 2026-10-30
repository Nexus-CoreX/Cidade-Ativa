-- =====================================================================
-- Cidade Ativa · Migração 02: contas da prefeitura + visão geral
-- Rode DEPOIS do 01-estrutura.sql. Não apaga dados; pode rodar mais de uma vez.
-- Supabase > SQL Editor > New query > cole tudo > Run.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Novos campos do perfil
--    admin  = pode cadastrar contas da prefeitura e dar/tirar admin
--    mestre = conta inicial; ninguém consegue alterá-la pelo site
-- ---------------------------------------------------------------------
alter table public.perfis add column if not exists email  text;
alter table public.perfis add column if not exists admin  boolean not null default false;
alter table public.perfis add column if not exists mestre boolean not null default false;

-- Garante que todo usuário do Auth tenha perfil (ex.: contas criadas antes dos scripts)
insert into public.perfis (id, nome)
select id, coalesce(nullif(trim(raw_user_meta_data ->> 'nome'), ''), split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

update public.perfis p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;

-- O perfil passa a guardar também o e-mail (para a lista da equipe)
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and perfil = 'prefeitura' and admin);
$$;

-- ---------------------------------------------------------------------
-- 2. Criação de usuários direto no Supabase Auth (uso interno)
--    Já nasce com e-mail confirmado. Não pode ser chamada pelo site.
-- ---------------------------------------------------------------------
create or replace function public._criar_usuario(p_email text, p_senha text, p_nome text)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha deve ter pelo menos 6 caracteres.'; end if;
  if coalesce(trim(p_nome), '') = '' then raise exception 'Informe o nome.'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Este e-mail já está cadastrado.';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_senha, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('nome', trim(p_nome)), now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  return v_id;   -- o gatilho ao_criar_usuario já criou o perfil (como cidadão)
end $$;
revoke all on function public._criar_usuario(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Conta mestre (rodada só pelo SQL Editor — veja 03-conta-mestre.sql)
--    Se o e-mail já tiver conta, ela é promovida (a senha não muda).
-- ---------------------------------------------------------------------
create or replace function public.criar_conta_mestre(p_email text, p_senha text, p_nome text)
returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    v_id := public._criar_usuario(p_email, p_senha, p_nome);
    update public.perfis set perfil = 'prefeitura', admin = true, mestre = true where id = v_id;
    return 'Conta mestre criada: ' || lower(trim(p_email));
  end if;
  update public.perfis set perfil = 'prefeitura', admin = true, mestre = true where id = v_id;
  return 'Conta já existia e foi promovida a mestre (senha mantida): ' || lower(trim(p_email));
end $$;
revoke all on function public.criar_conta_mestre(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Funções usadas pela tela "Equipe" (somente administradores)
-- ---------------------------------------------------------------------
create or replace function public.criar_conta_prefeitura(p_nome text, p_email text, p_senha text, p_admin boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.e_admin() then raise exception 'Apenas administradores podem cadastrar contas da prefeitura.'; end if;
  v_id := public._criar_usuario(p_email, p_senha, p_nome);
  update public.perfis set perfil = 'prefeitura', admin = coalesce(p_admin, false) where id = v_id;
  return v_id;
end $$;

-- Verificações comuns antes de alterar alguém da equipe
create or replace function public._checar_alvo(p_id uuid)
returns void language plpgsql stable security definer set search_path = public as $$
declare v public.perfis;
begin
  if not public.e_admin() then raise exception 'Apenas administradores podem alterar a equipe.'; end if;
  if p_id = auth.uid() then raise exception 'Você não pode alterar o seu próprio acesso.'; end if;
  select * into v from public.perfis where id = p_id;
  if not found or v.perfil <> 'prefeitura' then raise exception 'Conta da prefeitura não encontrada.'; end if;
  if v.mestre then raise exception 'A conta mestre não pode ser alterada.'; end if;
end $$;
revoke all on function public._checar_alvo(uuid) from public, anon, authenticated;

create or replace function public.definir_admin(p_id uuid, p_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._checar_alvo(p_id);
  update public.perfis set admin = coalesce(p_admin, false) where id = p_id;
end $$;

-- Tira o acesso da prefeitura: a conta continua existindo, mas vira cidadão
create or replace function public.remover_acesso_prefeitura(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._checar_alvo(p_id);
  update public.perfis set perfil = 'cidadao', admin = false where id = p_id;
end $$;

revoke all on function public.criar_conta_prefeitura(text, text, text, boolean) from public, anon;
revoke all on function public.definir_admin(uuid, boolean) from public, anon;
revoke all on function public.remover_acesso_prefeitura(uuid) from public, anon;
grant execute on function public.criar_conta_prefeitura(text, text, text, boolean) to authenticated;
grant execute on function public.definir_admin(uuid, boolean) to authenticated;
grant execute on function public.remover_acesso_prefeitura(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Visão geral: qualquer usuário logado vê todas as ocorrências
--    (criar continua só para o próprio usuário; status só pela prefeitura)
-- ---------------------------------------------------------------------
drop policy if exists "ocorrencias: ver" on public.ocorrencias;
create policy "ocorrencias: ver" on public.ocorrencias for select to authenticated using (true);

drop policy if exists "historico: ver" on public.historico;
create policy "historico: ver" on public.historico for select to authenticated using (true);
