CREATE OR REPLACE FUNCTION public.e_equipe_villela()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@grupovillela.com'
$$;

DROP POLICY IF EXISTS "Equipe autenticada pode criar registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode editar registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode ler registros" ON public.registros;
DROP POLICY IF EXISTS "Equipe autenticada pode remover registros" ON public.registros;

CREATE POLICY "Equipe Villela pode ler registros" ON public.registros FOR SELECT TO authenticated USING (public.e_equipe_villela());
CREATE POLICY "Equipe Villela pode criar registros" ON public.registros FOR INSERT TO authenticated WITH CHECK (public.e_equipe_villela() OR tipo = 'contrato');
CREATE POLICY "Equipe Villela pode editar registros" ON public.registros FOR UPDATE TO authenticated USING (public.e_equipe_villela()) WITH CHECK (public.e_equipe_villela());
CREATE POLICY "Equipe Villela pode remover registros" ON public.registros FOR DELETE TO authenticated USING (public.e_equipe_villela());

CREATE OR REPLACE FUNCTION public.bloqueia_cadastro_fora_villela()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) NOT LIKE '%@grupovillela.com' THEN
    RAISE EXCEPTION 'Somente e-mails @grupovillela.com podem criar conta.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bloqueia_cadastro_fora_villela ON auth.users;
CREATE TRIGGER bloqueia_cadastro_fora_villela BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bloqueia_cadastro_fora_villela();