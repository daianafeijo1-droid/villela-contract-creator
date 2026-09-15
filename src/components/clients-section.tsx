import { useMemo, useState } from "react";
import { consultarCnpj } from "@/lib/cnpj";
import { useClients, type Client } from "@/lib/clients";
import { maskCnpj } from "@/lib/format";

type Filtro = "todos" | "atendidos" | "naoAtendidos";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClientsSection() {
  const { clients, salvarCliente, remover } = useClients();
  const [adding, setAdding] = useState(false);
  const [cnpjInput, setCnpjInput] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  async function adicionar() {
    const digits = cnpjInput.replace(/\D/g, "");
    if (digits.length !== 14) {
      setErro("Digite um CNPJ válido com 14 dígitos.");
      return;
    }
    if (clients.some((c) => c.cnpj === digits)) {
      setErro("Esse CNPJ já está na lista.");
      return;
    }
    setBuscando(true);
    setErro("");
    try {
      const d = await consultarCnpj(digits);
      if (!d) {
        setErro("CNPJ não encontrado na consulta pública.");
        return;
      }
      const now = new Date().toISOString();
      const enderecoCompleto = [
        d.endereco,
        d.bairro,
        [d.municipio, d.uf].filter(Boolean).join(" - "),
        d.cep ? `CEP ${d.cep}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const item: Client = {
        id: crypto.randomUUID(),
        cnpj: digits,
        razaoSocial: d.razaoSocial,
        nomeFantasia: d.nomeFantasia,
        situacaoCadastral: d.situacaoCadastral,
        endereco: enderecoCompleto,
        telefone: d.telefone,
        email: d.email,
        atendido: false,
        addedAt: now,
        statusChangedAt: now,
      };
      await salvarCliente(item);
      setCnpjInput("");
      setAdding(false);
    } catch {
      setErro("Não foi possível consultar o CNPJ agora.");
    } finally {
      setBuscando(false);
    }
  }

  async function toggleAtendido(id: string) {
    const alvo = clients.find((c) => c.id === id);
    if (!alvo) return;
    await salvarCliente({
      ...alvo,
      atendido: !alvo.atendido,
      statusChangedAt: new Date().toISOString(),
    });
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      if (filtro === "atendidos" && !c.atendido) return false;
      if (filtro === "naoAtendidos" && c.atendido) return false;
      if (!q) return true;
      const nome = `${c.razaoSocial} ${c.nomeFantasia}`.toLowerCase();
      return nome.includes(q) || (qDigits.length > 0 && c.cnpj.includes(qDigits));
    });
  }, [clients, filtro, busca]);

  const naoAtendidos = clients.filter((c) => !c.atendido).length;

  return (
    <section className="block-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.2em] text-mint uppercase">
            Acompanhamento
          </p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">Clientes em Atendimento</h1>
        </div>
        <div className="flex items-center gap-3">
          {naoAtendidos > 0 && (
            <span className="rounded-full bg-pop/15 px-3 py-1.5 text-xs font-extrabold text-pop">
              {naoAtendidos} não atendido(s)
            </span>
          )}
          <button type="button" onClick={() => setAdding((a) => !a)} className="btn-pop px-5 py-3 text-sm">
            {adding ? "Cancelar" : "Adicionar Cliente"}
          </button>
        </div>
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl border-2 border-ink/10 bg-cream/60 p-5">
          <p className="text-sm font-bold text-ink">CNPJ do cliente</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={cnpjInput}
              onChange={(e) => setCnpjInput(maskCnpj(e.target.value))}
              className="field-input max-w-xs flex-1"
            />
            <button
              type="button"
              onClick={adicionar}
              disabled={buscando}
              className="btn-brand px-6 py-3 text-sm"
            >
              {buscando ? "Consultando..." : "Consultar e Adicionar"}
            </button>
          </div>
          <p className={`mt-2 text-[11px] font-bold ${erro ? "text-pop" : "text-ink/45"}`}>
            {erro || "Os dados públicos do CNPJ preenchem a ficha automaticamente."}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="field-input max-w-sm flex-1"
        />
        <div className="flex gap-2">
          {(
            [
              ["todos", "Todos"],
              ["atendidos", "Atendidos"],
              ["naoAtendidos", "Não atendidos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFiltro(value)}
              className={
                filtro === value
                  ? "rounded-2xl border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-cream"
                  : "rounded-2xl border-2 border-ink/10 bg-cream/50 px-4 py-2 text-sm font-bold text-ink/60 transition hover:border-ink"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {filtrados.length === 0 ? (
          <p className="py-4 text-sm font-semibold text-ink/50">
            {clients.length === 0
              ? "Nenhum cliente adicionado ainda. Use o botão Adicionar Cliente."
              : "Nenhum cliente encontrado com esse filtro."}
          </p>
        ) : (
          <div className="divide-y divide-ink/10">
            {filtrados.map((c) => (
              <div
                key={c.id}
                className={`flex flex-wrap items-center gap-4 py-4 ${
                  c.atendido ? "" : "-mx-3 rounded-2xl bg-coral/10 px-3"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-extrabold text-ink">
                      {c.nomeFantasia || c.razaoSocial}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        c.atendido ? "bg-mint/20 text-mint" : "bg-pop px-3 py-1 text-cream"
                      }`}
                    >
                      {c.atendido ? "Atendido" : "Não atendido"}
                    </span>
                    {c.situacaoCadastral && (
                      <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] font-bold text-ink/50">
                        Situação: {c.situacaoCadastral}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink/50">
                    {maskCnpj(c.cnpj)}
                    {c.nomeFantasia && c.razaoSocial ? ` · ${c.razaoSocial}` : ""}
                  </p>
                  {c.endereco && <p className="text-sm font-semibold text-ink/50">{c.endereco}</p>}
                  <p className="text-sm font-semibold text-ink/50">
                    {[c.telefone, c.email].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-ink/40">
                    Adicionado em {formatDateTime(c.addedAt)} · Status alterado em{" "}
                    {formatDateTime(c.statusChangedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAtendido(c.id)}
                    aria-pressed={c.atendido}
                    className={`relative h-7 w-14 rounded-full border-2 transition ${
                      c.atendido ? "border-mint bg-mint/30" : "border-pop bg-pop/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full transition-all ${
                        c.atendido ? "left-7 bg-mint" : "left-0.5 bg-pop"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(c.id)}
                    className="rounded-xl border-2 border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/50 transition hover:border-pop hover:text-pop"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
