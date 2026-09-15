-- ============================================================
-- VILLELA CONTRACT CREATOR
-- SEGURANÇA DA TABELA public.registros
--
-- REGRA:
-- 1. Visitantes sem login:
--    - podem gerar contratos;
--    - podem inserir somente registros tipo "contrato";
--    - NÃO podem consultar, editar ou excluir registros.
--
-- 2. Usuário autorizado:
--    - pode visualizar o Histórico;
--    - pode visualizar Clientes em Atendimento;
--    - pode criar, editar e excluir registros.
--
-- 3. A autorização é vinculada ao e-mail da conta autenticada.
-- ============================================================


-- ============================================================
-- 1. REMOVER POLÍTICAS ANTIGAS
-- ============================================================

DROP POLICY IF EXISTS "Registros são públicos para leitura"
ON public.registros;

DROP POLICY IF EXISTS "Qualquer um pode criar registros"
ON public.registros;

DROP POLICY IF EXISTS "Qualquer um pode editar registros"
ON public.registros;

DROP POLICY IF EXISTS "Qualquer um pode remover registros"
ON public.registros;

DROP POLICY IF EXISTS "Equipe autenticada pode ler registros"
ON public.registros;

DROP POLICY IF EXISTS "Equipe autenticada pode editar registros"
ON public.registros;

DROP POLICY IF EXISTS "Equipe autenticada pode remover registros"
ON public.registros;

DROP POLICY IF EXISTS "Equipe autenticada pode criar registros"
ON public.registros;

DROP POLICY IF EXISTS "Visitantes podem registrar contratos gerados"
ON public.registros;


-- ============================================================
-- 2. GARANTIR RLS
-- ============================================================

ALTER TABLE public.registros
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. PERMISSÕES DA ROLE ANON
--
-- Visitante sem login:
-- somente INSERT.
-- ============================================================

REVOKE ALL
ON public.registros
FROM anon;

GRANT INSERT
ON public.registros
TO anon;


-- ============================================================
-- 4. PERMISSÕES DA ROLE AUTHENTICATED
--
-- A role autenticada recebe as permissões necessárias,
-- mas as POLÍTICAS abaixo determinam quem efetivamente
-- poderá utilizá-las.
-- ============================================================

REVOKE ALL
ON public.registros
FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.registros
TO authenticated;


-- ============================================================
-- 5. VISITANTE SEM LOGIN
--
-- Pode somente registrar contratos.
-- Não pode registrar clientes.
-- ============================================================

CREATE POLICY "Visitantes podem registrar contratos gerados"
ON public.registros
FOR INSERT
TO anon
WITH CHECK (
    tipo = 'contrato'
);


-- ============================================================
-- 6. USUÁRIO AUTORIZADO — LEITURA
--
-- Somente a conta autorizada poderá visualizar:
-- - Histórico de Contratos
-- - Clientes em Atendimento
-- - demais registros da tabela
-- ============================================================

CREATE POLICY "Daiana pode ler registros"
ON public.registros
FOR SELECT
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email')
    = LOWER('daiana.santos@grupovillela.com')
);


-- ============================================================
-- 7. USUÁRIO AUTORIZADO — INSERÇÃO
--
-- A conta autorizada pode criar contratos e clientes.
-- ============================================================

CREATE POLICY "Daiana pode criar registros"
ON public.registros
FOR INSERT
TO authenticated
WITH CHECK (
    LOWER(auth.jwt() ->> 'email')
    = LOWER('daiana.santos@grupovillela.com')
);


-- ============================================================
-- 8. USUÁRIO AUTORIZADO — EDIÇÃO
-- ============================================================

CREATE POLICY "Daiana pode editar registros"
ON public.registros
FOR UPDATE
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email')
    = LOWER('daiana.santos@grupovillela.com')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email')
    = LOWER('daiana.santos@grupovillela.com')
);


-- ============================================================
-- 9. USUÁRIO AUTORIZADO — EXCLUSÃO
-- ============================================================

CREATE POLICY "Daiana pode remover registros"
ON public.registros
FOR DELETE
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email')
    = LOWER('daiana.santos@grupovillela.com')
);


-- ============================================================
-- 10. RESULTADO ESPERADO
--
-- ANÔNIMO:
-- INSERT contrato        ✅
-- SELECT                 ❌
-- UPDATE                 ❌
-- DELETE                 ❌
--
-- DAIANA:
-- INSERT contrato        ✅
-- INSERT cliente         ✅
-- SELECT                 ✅
-- UPDATE                 ✅
-- DELETE                 ✅
--
-- QUALQUER OUTRO LOGIN:
-- INSERT                 ❌
-- SELECT                 ❌
-- UPDATE                 ❌
-- DELETE                 ❌
-- ============================================================
