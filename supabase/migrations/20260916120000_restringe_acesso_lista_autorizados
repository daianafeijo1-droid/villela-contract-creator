-- ============================================================
-- VILLELA CONTRACT CREATOR
-- CORREÇÃO DE SEGURANÇA — RESTRINGE ACESSO À TABELA registros
--
-- PROBLEMA CORRIGIDO:
-- A migração anterior (20260916001907) liberou SELECT/INSERT/
-- UPDATE/DELETE em `registros` para QUALQUER usuário autenticado
-- (USING (true) / WITH CHECK (true)). Como o app permitia
-- autocadastro público ("Criar minha conta da equipe"), qualquer
-- visitante podia criar uma conta e enxergar/editar/apagar todo o
-- histórico de contratos e a base de Clientes em Atendimento
-- (CNPJ, telefone, e-mail, valores).
--
-- CORREÇÃO:
-- 1. Cria uma tabela de e-mails autorizados (`equipe_autorizada`),
--    para não precisar editar SQL toda vez que alguém da equipe
--    for adicionado — basta inserir uma linha nela.
-- 2. Restringe leitura/edição/exclusão de `registros` a quem
--    estiver autenticado E na lista de autorizados.
-- 3. Mantém o comportamento de visitante sem login: só pode
--    inserir registros do tipo "contrato" (geração de contrato
--    continua liberada sem exigir login).
-- ============================================================


-- ============================================================
-- 1. TABELA DE E-MAILS AUTORIZADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.equipe_autorizada (
  email TEXT PRIMARY KEY,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipe_autorizada ENABLE ROW LEVEL SECURITY;

-- Ninguém acessa essa tabela pelo cliente (nem para leitura);
-- só o service_role (usado nas políticas abaixo) e o dashboard
-- do Supabase (que usa a service key) enxergam o conteúdo.
REVOKE ALL ON public.equipe_autorizada FROM anon, authenticated;
GRANT ALL ON public.equipe_autorizada TO service_role;

-- Semeia com o e-mail já em uso pela equipe.
-- Para adicionar alguém no futuro, rode no SQL Editor do Supabase:
--   INSERT INTO public.equipe_autorizada (email) VALUES ('novo.email@grupovillela.com');
INSERT INTO public.equipe_autorizada (email)
VALUES ('daiana.santos@grupovillela.com')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 2. FUNÇÃO AUXILIAR: o e-mail do usuário logado está autorizado?
--
-- SECURITY DEFINER para poder ler `equipe_autorizada` mesmo com o
-- RLS dela bloqueando o próprio usuário autenticado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.e_equipe_autorizada()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.equipe_autorizada
    WHERE email = LOWER(auth.jwt() ->> 'email')
  );
$$;

REVOKE ALL ON FUNCTION public.e_equipe_autorizada() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.e_equipe_autorizada() TO authenticated;


-- ============================================================
-- 3. REMOVER POLÍTICAS ABERTAS DA MIGRAÇÃO ANTERIOR
-- ============================================================

DROP POLICY IF EXISTS "Equipe autenticada pode ler registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode criar registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode editar registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode remover registros" ON public.registros;
DROP POLICY IF EXISTS "Visitantes podem registrar contratos gerados" ON public.registros;


-- ============================================================
-- 4. PERMISSÕES DE ROLE (grant amplo; as políticas abaixo é que
--    de fato restringem quem consegue usar cada uma)
-- ============================================================

REVOKE ALL ON public.registros FROM anon;
GRANT INSERT ON public.registros TO anon;

REVOKE ALL ON public.registros FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;


-- ============================================================
-- 5. VISITANTE SEM LOGIN — só pode registrar contratos gerados
-- ============================================================

CREATE POLICY "Visitantes podem registrar contratos gerados"
ON public.registros
FOR INSERT
TO anon
WITH CHECK (tipo = 'contrato');


-- ============================================================
-- 6. EQUIPE AUTORIZADA — leitura, criação, edição e exclusão
-- ============================================================

CREATE POLICY "Equipe autorizada pode ler registros"
ON public.registros
FOR SELECT
TO authenticated
USING (public.e_equipe_autorizada());

CREATE POLICY "Equipe autorizada pode criar registros"
ON public.registros
FOR INSERT
TO authenticated
WITH CHECK (public.e_equipe_autorizada());

CREATE POLICY "Equipe autorizada pode editar registros"
ON public.registros
FOR UPDATE
TO authenticated
USING (public.e_equipe_autorizada())
WITH CHECK (public.e_equipe_autorizada());

CREATE POLICY "Equipe autorizada pode remover registros"
ON public.registros
FOR DELETE
TO authenticated
USING (public.e_equipe_autorizada());


-- ============================================================
-- 7. RESULTADO ESPERADO
--
-- VISITANTE (sem login):
--   INSERT contrato .......... ✅
--   SELECT / UPDATE / DELETE . ❌
--
-- QUALQUER CONTA AUTENTICADA que NÃO esteja em equipe_autorizada:
--   INSERT / SELECT / UPDATE / DELETE ...... ❌
--
-- CONTA AUTENTICADA cujo e-mail ESTÁ em equipe_autorizada:
--   INSERT / SELECT / UPDATE / DELETE ...... ✅
--
-- IMPORTANTE: como o app não oferece mais autocadastro público
-- (ver alterações em src/lib/auth.ts e src/components/login-gate.tsx),
-- novas contas da equipe devem ser criadas pelo painel do Supabase
-- (Authentication → Users → Add user) E adicionadas à tabela
-- equipe_autorizada com o INSERT mostrado no passo 1.
-- ============================================================
