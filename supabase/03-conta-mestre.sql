-- =====================================================================
-- Cidade Ativa · Conta mestre (conta inicial da prefeitura)
-- 1. Troque o e-mail, a senha e o nome abaixo.
-- 2. Supabase > SQL Editor > New query > cole > Run.
-- 3. Entre no site pela aba "Prefeitura" com esse e-mail e senha.
--
-- A conta mestre é administradora: pelo botão "Equipe" ela cadastra novas
-- contas da prefeitura e decide quem também é admin. Ninguém consegue
-- alterar ou remover a conta mestre pelo site.
-- Se o e-mail já tiver conta no site, ela é promovida a mestre e a senha
-- atual é mantida.
-- =====================================================================

select public.criar_conta_mestre(
  'mestre@cidadeativa.com',   -- e-mail
  'TroqueEstaSenha!2026',     -- senha (mínimo 6 caracteres)
  'Conta Mestre'              -- nome que aparece no histórico
);
