import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Estado de login da equipe (Supabase Auth).
 * Usado para liberar/travar o histórico de contratos e a aba de clientes.
 * A geração de contratos em si NÃO depende de login.
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

  /** Cria o acesso da equipe e já entra (confirmação de e-mail dispensada). */
  async function criarAcesso(email: string, senha: string) {
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw new Error(traduzErro(error.message));
    const { error: erroEntrada } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (erroEntrada) throw new Error(traduzErro(erroEntrada.message));
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return { user, loading, entrar, criarAcesso, sair };
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
