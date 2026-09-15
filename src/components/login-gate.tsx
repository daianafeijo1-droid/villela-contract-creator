import { useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
  authLoading: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Mostra `children` apenas para quem está logado. Sem login, mostra um
 * formulário de acesso no lugar do conteúdo (usado no Histórico e em
 * Clientes em Atendimento — a geração de contratos continua liberada).
 */
export function LoginGate({ user, authLoading, entrar, title, description, children }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  if (authLoading) {
    return <div className="block-card mt-6 h-40 animate-pulse p-6 md:p-8" />;
  }

  if (user) return <>{children}</>;

  async function handleEntrar() {
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setEntrando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <section className="block-card mt-6 p-6 md:p-8">
      <p className="text-xs font-extrabold tracking-[0.2em] text-violet uppercase">Acesso restrito à equipe</p>
      <h2 className="mt-1 text-2xl font-extrabold text-ink">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-ink/50">{description}</p>
      <div className="mt-5 grid max-w-sm gap-3">
        <label>
          <span className="text-sm font-bold text-ink">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
            className="field-input mt-1.5"
          />
        </label>
        <label>
          <span className="text-sm font-bold text-ink">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
            className="field-input mt-1.5"
          />
        </label>
        <button
          type="button"
          onClick={handleEntrar}
          disabled={entrando}
          className="btn-brand px-6 py-3 text-sm"
        >
          {entrando ? "Entrando..." : "Entrar"}
        </button>
        {erro && <p className="text-[11px] font-bold text-pop">{erro}</p>}
        <p className="text-[11px] font-semibold text-ink/40">
          Sem conta ainda? Peça para um administrador criar seu acesso no painel do Supabase
          (Authentication → Users).
        </p>
      </div>
    </section>
  );
}
