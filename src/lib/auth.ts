import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Estado de login da equipe (Supabase Auth).
 * Usado para liberar/travar o histórico de contratos e a aba de clientes.
 * A geração de contratos em si NÃO depende de login.
 *
 * IMPORTANTE (segurança): não existe mais autocadastro público. Isso é
 * proposital — a leitura/edição de `registros` no banco é restrita à
 * tabela `equipe_autorizada` (ver migração
 * 20260916120000_restringe_acesso_lista_autorizados.sql), então uma
 * conta criada por sign-up não conseguiria enxergar nada mesmo assim.
 * Para dar acesso a alguém novo da equipe:
 *   1. Painel do Supabase → Authentication → Users → Add user
 *   2. SQL Editor → INSERT INTO public.equipe_autorizada (email)
 *      VALUES ('email.da.pessoa@grupovillela.com');
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  async function entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzErro(error.message));
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return { user, loading, entrar, sair };
}

function traduzErro(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "E-mail ainda não confirmado.";
  if (/already registered|already exists/i.test(msg))
    return "Já existe um acesso com esse e-mail. Use a opção Entrar.";
  if (/password/i.test(msg) && /6|short|weak|leak|pwned/i.test(msg))
    return "Escolha uma senha mais forte (mínimo 6 caracteres e não vazada).";
  return "Não foi possível continuar. Tente novamente.";
}
