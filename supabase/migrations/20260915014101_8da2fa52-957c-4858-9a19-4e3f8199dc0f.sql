CREATE TABLE public.registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('contrato','cliente')),
  chave TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, chave)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;

ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registros são públicos para leitura" ON public.registros FOR SELECT USING (true);
CREATE POLICY "Qualquer um pode criar registros" ON public.registros FOR INSERT WITH CHECK (true);
CREATE POLICY "Qualquer um pode editar registros" ON public.registros FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Qualquer um pode remover registros" ON public.registros FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_registros_updated_at BEFORE UPDATE ON public.registros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.registros REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros;

CREATE INDEX registros_tipo_created_at_idx ON public.registros (tipo, created_at DESC);
