import { useMemo, useState } from "react";
import { consultarCnpj } from "@/lib/cnpj";
import { useClients, type Client } from "@/lib/clients";
import { maskCep, maskCnpj, maskCpf, maskPhone, maskUf } from "@/lib/format";

type Filtro = "todos" | "atendidos" | "naoAtendidos";

/** Campos editáveis manualmente na ficha do cliente. */
type EditForm = Pick<
  Client,
  | "razaoSocial"
  | "nomeFantasia"
  | "responsavel"
  | "cpfResponsavel"
  | "endereco"
  | "bairro"
  | "municipio"
  | "uf"
  | "cep"
  | "telefone"
  | "email"
  | "observacoes"
>;

function toEditForm(c: Client): EditForm {
  return {
    razaoSocial: c.razaoSocial,
    nomeFantasia: c.nomeFantasia,
    responsavel: c.responsavel,
    cpfResponsavel: c.cpfResponsavel,
    endereco: c.endereco,
    bairro: c.bairro,
    municipio: c.municipio,
    uf: c.uf,
    cep: c.cep,
    telefone: c.telefone,
    email: c.email,
    observacoes: c.observacoes,
  };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function enderecoResumo(c: Client) {
  return [
    c.endereco,
    c.bairro,
    [c.municipio, c.uf].filter(Boolean).join(" - "),
    c.cep ? `CEP ${c.cep}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export function ClientsSection({
  onGerarContrato,
}: {
  /** Leva os dados do cliente para o formulário de contrato, na aba Contratos. */
  onGerarContrato?: (cliente: Client) => void;
}) {
  const { clients, carregando, salvarCliente, remover } = useClients();
  const [adding, setAdding] = useState(false);
  const [cnpjInput, setCnpjInput] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

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
      const item: Client = {
        id: crypto.randomUUID(),
        cnpj: digits,
        razaoSocial: d.razaoSocial,
        nomeFantasia: d.nomeFantasia,
        situacaoCadastral: d.situacaoCadastral,
        responsavel: d.responsavel,
        cpfResponsavel: "",
        endereco: d.endereco,
        bairro: d.bairro,
        municipio: d.municipio,
        uf: d.uf,
        cep: d.cep,
        telefone: d.telefone,
        email: d.email,
        observacoes: "",
        atendido: false,
        addedAt: now,
        statusChangedAt: now,
      };
      await salvarCliente(item);
      setCnpjInput("");
      setAdding(false);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível consultar o CNPJ agora.",
      );
    } finally {
      setBuscando(false);
    }
  }

  async function removerComConfirmacao(c: Client) {
    const ok = window.confirm(
      `Remover ${c.nomeFantasia || c.razaoSocial || maskCnpj(c.cnpj)} da lista de clientes em atendimento? Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    await remover(c.id);
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

  function iniciarEdicao(c: Client) {
    setEditandoId(c.id);
    setEditForm(toEditForm(c));
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm(null);
  }

  function atualizarCampo(campo: keyof EditForm, valor: string) {
    setEditForm((f) => (f ? { ...f, [campo]: valor } : f));
  }

  async function salvarEdicao() {
    const alvo = clients.find((c) => c.id === editandoId);
    if (!alvo || !editForm) return;
    setSalvandoEdicao(true);
    try {
      await salvarCliente({ ...alvo, ...editForm });
      cancelarEdicao();
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const lista = clients.filter((c) => {
      if (filtro === "atendidos" && !c.atendido) return false;
      if (filtro === "naoAtendidos" && c.atendido) return false;
      if (!q) return true;
      const nome = `${c.razaoSocial} ${c.nomeFantasia}`.toLowerCase();
      return nome.includes(q) || (qDigits.length > 0 && c.cnpj.includes(qDigits));
    });
    if (filtro !== "todos") return lista;
    // Aversão à perda: quem ainda não foi atendido aparece primeiro, para
    // não passar despercebido no meio da lista.
    return [...lista].sort((a, b) => Number(a.atendido) - Number(b.atendido));
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
            <span className="badge-glass px-3 py-1.5 text-xs font-extrabold text-coral">
              ⚠️ {naoAtendidos} cliente(s) esperando retorno — não deixe esfriar
            </span>
          )}
          <button type="button" onClick={() => setAdding((a) => !a)} className="btn-pop px-5 py-3 text-sm">
            {adding ? "Cancelar" : "Adicionar Cliente"}
          </button>
        </div>
      </div>

      {adding && (
        <div className="block-card mt-6 p-5">
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
          <p className={`mt-2 text-[11px] font-bold ${erro ? "text-destructive" : "text-ink/45"}`}>
            {erro || "Os dados públicos do CNPJ preenchem a ficha automaticamente. Depois você pode completar o que faltar."}
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
                  ? "badge-glass rounded-2xl bg-ink/85! px-4 py-2 text-sm font-bold text-cream backdrop-blur-md"
                  : "badge-glass rounded-2xl px-4 py-2 text-sm font-bold text-ink/60 transition hover:text-ink"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {carregando ? (
          <div className="space-y-3 py-2">
            <div className="h-16 animate-pulse rounded-xl bg-ink/5" />
            <div className="h-16 animate-pulse rounded-xl bg-ink/5" />
            <div className="h-16 animate-pulse rounded-xl bg-ink/5" />
          </div>
        ) : filtrados.length === 0 ? (
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
                className={`py-4 ${
                  c.atendido ? "" : "-mx-3 rounded-2xl bg-coral/10 px-3"
                }`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-extrabold text-ink">
                        {c.nomeFantasia || c.razaoSocial}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          c.atendido ? "bg-mint/20 text-mint" : "bg-coral px-3 py-1 text-cream"
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
                    {c.responsavel && (
                      <p className="text-sm font-semibold text-ink/50">
                        Responsável: {c.responsavel}
                        {c.cpfResponsavel ? ` · CPF ${c.cpfResponsavel}` : ""}
                      </p>
                    )}
                    {enderecoResumo(c) && (
                      <p className="text-sm font-semibold text-ink/50">{enderecoResumo(c)}</p>
                    )}
                    <p className="text-sm font-semibold text-ink/50">
                      {[c.telefone, c.email].filter(Boolean).join(" · ")}
                    </p>
                    {c.observacoes && (
                      <p className="mt-1 rounded-lg bg-ink/5 px-2 py-1 text-sm font-semibold text-ink/70">
                        📝 {c.observacoes}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] font-semibold text-ink/40">
                      Adicionado em {formatDateTime(c.addedAt)} · Status alterado em{" "}
                      {formatDateTime(c.statusChangedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAtendido(c.id)}
                      aria-pressed={c.atendido}
                      className={`relative h-7 w-14 rounded-full border-2 transition ${
                        c.atendido ? "border-mint bg-mint/30" : "border-coral bg-coral/20"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full transition-all ${
                          c.atendido ? "left-7 bg-mint" : "left-0.5 bg-coral"
                        }`}
                      />
                    </button>
                    {onGerarContrato && (
                      <button
                        type="button"
                        onClick={() => onGerarContrato(c)}
                        className="rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-cream transition hover:bg-violet"
                      >
                        Gerar Contrato
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        editandoId === c.id
                          ? cancelarEdicao()
                          : iniciarEdicao(c)
                      }
                      className="rounded-xl border-2 border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/50 transition hover:border-ink/30 hover:text-ink"
                    >
                      {editandoId === c.id ? "Cancelar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removerComConfirmacao(c)}
                      className="rounded-xl border-2 border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/50 transition hover:border-destructive hover:text-destructive"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                {editandoId === c.id && editForm && (
                  <div className="mt-4 rounded-2xl border-2 border-ink/10 p-4">
                    <p className="mb-3 text-xs font-extrabold tracking-[0.15em] text-ink/50 uppercase">
                      Completar / editar ficha
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-ink/60">
                        Razão Social
                        <input
                          type="text"
                          value={editForm.razaoSocial}
                          onChange={(e) => atualizarCampo("razaoSocial", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        Nome Fantasia
                        <input
                          type="text"
                          value={editForm.nomeFantasia}
                          onChange={(e) => atualizarCampo("nomeFantasia", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        Nome do responsável legal
                        <input
                          type="text"
                          value={editForm.responsavel}
                          onChange={(e) => atualizarCampo("responsavel", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        CPF do responsável
                        <input
                          type="text"
                          value={editForm.cpfResponsavel}
                          onChange={(e) => atualizarCampo("cpfResponsavel", maskCpf(e.target.value))}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60 sm:col-span-2">
                        Endereço (rua e número)
                        <input
                          type="text"
                          value={editForm.endereco}
                          onChange={(e) => atualizarCampo("endereco", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        Bairro
                        <input
                          type="text"
                          value={editForm.bairro}
                          onChange={(e) => atualizarCampo("bairro", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        Município
                        <input
                          type="text"
                          value={editForm.municipio}
                          onChange={(e) => atualizarCampo("municipio", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        UF
                        <input
                          type="text"
                          value={editForm.uf}
                          onChange={(e) => atualizarCampo("uf", maskUf(e.target.value))}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        CEP
                        <input
                          type="text"
                          value={editForm.cep}
                          onChange={(e) => atualizarCampo("cep", maskCep(e.target.value))}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        Telefone
                        <input
                          type="text"
                          value={editForm.telefone}
                          onChange={(e) => atualizarCampo("telefone", maskPhone(e.target.value))}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60">
                        E-mail
                        <input
                          type="text"
                          value={editForm.email}
                          onChange={(e) => atualizarCampo("email", e.target.value)}
                          className="field-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-bold text-ink/60 sm:col-span-2">
                        Observações
                        <textarea
                          value={editForm.observacoes}
                          onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                          rows={3}
                          placeholder="Anotações internas sobre este cliente/atendimento..."
                          className="field-input mt-1 resize-y"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void salvarEdicao()}
                        disabled={salvandoEdicao}
                        className="btn-brand px-5 py-2.5 text-sm"
                      >
                        {salvandoEdicao ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="rounded-xl border-2 border-ink/10 px-5 py-2.5 text-sm font-bold text-ink/60 transition hover:border-ink/30 hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
