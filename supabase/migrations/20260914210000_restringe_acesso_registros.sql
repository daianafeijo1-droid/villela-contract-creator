-- Antes: qualquer visitante (chave anônima pública) podia ler, criar,
-- editar e apagar TODOS os registros (histórico de contratos + dados de
-- clientes, incluindo CNPJ/telefone/e-mail). Agora:
--   * Gerar um contrato continua funcionando sem login (grava um registro
--     tipo "contrato", sem poder lê-lo, editá-lo ou apagá-lo depois).
--   * Ver o histórico e tudo relacionado a "Clientes em Atendimento"
--     (ler, criar, editar, apagar) exige estar autenticado (login da equipe).

DROP POLICY IF EXISTS "Registros são públicos para leitura" ON public.registros;
DROP POLICY IF EXISTS "Qualquer um pode criar registros" ON public.registros;
DROP POLICY IF EXISTS "Qualquer um pode editar registros" ON public.registros;
DROP POLICY IF EXISTS "Qualquer um pode remover registros" ON public.registros;

REVOKE ALL ON public.registros FROM anon;
GRANT INSERT ON public.registros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;

-- Leitura, edição e remoção: só para quem está logado.
CREATE POLICY "Equipe autenticada pode ler registros"
  ON public.registros FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipe autenticada pode editar registros"
  ON public.registros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Equipe autenticada pode remover registros"
  ON public.registros FOR DELETE TO authenticated USING (true);

-- Criação: a equipe logada pode criar qualquer tipo de registro (contrato
-- ou cliente); um visitante sem login só pode criar registros do tipo
-- "contrato" (mantém a geração de contratos ativa sem exigir login) e
-- nunca do tipo "cliente".
CREATE POLICY "Equipe autenticada pode criar registros"
  ON public.registros FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Visitantes podem registrar contratos gerados"
  ON public.registros FOR INSERT TO anon WITH CHECK (tipo = 'contrato');
