DROP POLICY IF EXISTS "Daiana pode ler registros" ON public.registros;
DROP POLICY IF EXISTS "Daiana pode criar registros" ON public.registros;
DROP POLICY IF EXISTS "Daiana pode editar registros" ON public.registros;
DROP POLICY IF EXISTS "Daiana pode remover registros" ON public.registros;
DROP POLICY IF EXISTS "Visitantes podem registrar contratos gerados" ON public.registros;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;
REVOKE ALL ON public.registros FROM anon;
GRANT INSERT ON public.registros TO anon;

CREATE POLICY "Equipe autenticada pode ler registros" ON public.registros
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipe autenticada pode criar registros" ON public.registros
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Equipe autenticada pode editar registros" ON public.registros
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Equipe autenticada pode remover registros" ON public.registros
FOR DELETE TO authenticated USING (true);

CREATE POLICY "Visitantes podem registrar contratos gerados" ON public.registros
FOR INSERT TO anon WITH CHECK (tipo = 'contrato');