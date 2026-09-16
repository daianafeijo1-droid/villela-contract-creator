import { useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
  authLoading: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarAcesso: (email: string, senha: string) => Promise<void>;
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Mostra `children` apenas para quem está logado. Sem login, mostra um
 * formulário de acesso no lugar do conteúdo (usado no Histórico e em
 * Clientes em Atendimento — a geração de contratos continua liberada).
 */
export function LoginGate({
  user,
  authLoading,
  entrar,
  criarAcesso,
  title,
  description,
  children,
}: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");

  if (authLoading) {
    return <div className="block-card mt-6 h-40 animate-pulse p-6 md:p-8" />;
  }

  if (user) return <>{children}</>;

  async function handleEnviar() {
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    if (modo === "criar" && senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setEntrando(true);
    try {
      if (modo === "criar") await criarAcesso(email.trim(), senha);
      else await entrar(email.trim(), senha);
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
            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
            className="field-input mt-1.5"
          />
        </label>
        <label>
          <span className="text-sm font-bold text-ink">Senha</span>
          <input
            type="password"
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
            className="field-input mt-1.5"
          />
        </label>
        <button
          type="button"
          onClick={handleEnviar}
          disabled={entrando}
          className="btn-brand px-6 py-3 text-sm"
        >
          {entrando
            ? modo === "criar"
              ? "Criando acesso..."
              : "Entrando..."
            : modo === "criar"
              ? "Criar acesso e entrar"
              : "Entrar"}
        </button>
        {erro && <p className="text-[11px] font-bold text-destructive">{erro}</p>}
        <button
          type="button"
          onClick={() => {
            setModo((m) => (m === "entrar" ? "criar" : "entrar"));
            setErro("");
          }}
          className="text-left text-[11px] font-bold text-ink/50 underline transition hover:text-ink"
        >
          {modo === "entrar"
            ? "Primeiro acesso? Criar minha conta da equipe"
            : "Já tenho acesso — voltar para entrar"}
        </button>
      </div>
    </section>
  );
}
