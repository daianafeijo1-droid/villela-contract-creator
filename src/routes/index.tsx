import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CONTRATANTE_FIELDS,
  MODELS,
  getModel,
  type FieldDef,
  type MaskKind,
} from "@/lib/contract-models";
import {
  maskCep,
  maskCpf,
  maskCpfCnpj,
  maskCurrency,
  maskDay,
  maskInteger,
  maskPercent,
  maskPhone,
  maskUf,
} from "@/lib/format";
import { downloadPdf, fileNameFor, fillContract, type FormValues } from "@/lib/fill-contract";
import { loadHistory, saveHistory, type HistoryItem } from "@/lib/history";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estúdio de Contratos | Grupo Villela" },
      {
        name: "description",
        content:
          "Gere contratos do Grupo Villela em PDF a partir de um formulário: Regularize Aqui, Renegocie Bancário, Recupere Aqui e Renegocie Empresarial.",
      },
      { property: "og:title", content: "Estúdio de Contratos | Grupo Villela" },
      {
        property: "og:description",
        content: "Preencha o formulário e baixe o contrato em PDF pronto para assinatura.",
      },
    ],
  }),
  component: Index,
});

function applyMask(mask: MaskKind | undefined, value: string) {
  switch (mask) {
    case "cpfCnpj":
      return maskCpfCnpj(value);
    case "cpf":
      return maskCpf(value);
    case "cep":
      return maskCep(value);
    case "phone":
      return maskPhone(value);
    case "currency":
      return maskCurrency(value);
    case "percent":
      return maskPercent(value);
    case "uf":
      return maskUf(value);
    case "day":
      return maskDay(value);
    case "integer":
      return maskInteger(value);
    default:
      return value;
  }
}

const accentText: Record<string, string> = {
  coral: "text-coral",
  mint: "text-mint",
  violet: "text-violet",
  brand: "text-ink",
  pop: "text-pop",
};
const accentBg: Record<string, string> = {
  coral: "bg-coral/20",
  mint: "bg-mint/20",
  violet: "bg-violet/20",
  brand: "bg-brand",
  pop: "bg-pop/20",
};
const accentSolid: Record<string, string> = {
  coral: "bg-coral",
  mint: "bg-mint",
  violet: "bg-violet",
  brand: "bg-brand",
  pop: "bg-pop",
};

function Index() {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ kind: "idle" | "erro" | "ok"; msg: string }>({
    kind: "idle",
    msg: "",
  });
  const [gerando, setGerando] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => setHistory(loadHistory()), []);

  const model = useMemo(() => getModel(modelId), [modelId]);
  const allFields = useMemo(
    () => [...CONTRATANTE_FIELDS, ...model.financeFields],
    [model],
  );

  const setField = (field: FieldDef, raw: string) => {
    setValues((v) => ({ ...v, [field.key]: applyMask(field.mask, raw) }));
    setErrors((e) => ({ ...e, [field.key]: false }));
  };

  async function gerar() {
    const faltando: Record<string, boolean> = {};
    for (const f of allFields) {
      if (f.required && !(values[f.key] ?? "").trim()) faltando[f.key] = true;
    }
    if (Object.keys(faltando).length) {
      setErrors(faltando);
      setStatus({
        kind: "erro",
        msg: `Preencha os ${Object.keys(faltando).length} campo(s) destacado(s) antes de gerar.`,
      });
      return;
    }

    setGerando(true);
    setStatus({ kind: "idle", msg: "" });
    try {
      const bytes = await fillContract(model, values);
      downloadPdf(bytes, fileNameFor(model, values));
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        modelId: model.id,
        contratante: values.razaoSocial ?? "",
        createdAt: new Date().toISOString(),
        values: { ...values },
      };
      const next = [item, ...history];
      setHistory(next);
      saveHistory(next);
      setStatus({ kind: "ok", msg: "Contrato gerado e baixado." });
    } catch (err) {
      setStatus({
        kind: "erro",
        msg: err instanceof Error ? err.message : "Não foi possível gerar o contrato.",
      });
    } finally {
      setGerando(false);
    }
  }

  async function baixarNovamente(item: HistoryItem) {
    const m = getModel(item.modelId);
    try {
      const bytes = await fillContract(m, item.values);
      downloadPdf(bytes, fileNameFor(m, item.values));
    } catch {
      setStatus({ kind: "erro", msg: "Não foi possível baixar esse contrato novamente." });
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 -rotate-6 place-items-center rounded-2xl bg-ink">
              <span className="font-display text-2xl font-extrabold text-brand">V</span>
            </div>
            <div>
              <p className="font-display text-xl leading-none font-extrabold text-ink">
                Grupo Villela
              </p>
              <p className="text-xs font-semibold tracking-wide text-ink/50">
                Estúdio de Contratos
              </p>
            </div>
          </div>
          <a
            href="#historico"
            className="btn-pop px-5 py-3 text-sm"
          >
            Histórico ({history.length})
          </a>
        </header>

        <section className="block-card p-6 md:p-8">
          <p className="text-xs font-extrabold tracking-[0.2em] text-pop uppercase">Passo 1 de 3</p>
          <h1 className="mt-1 mb-5 text-4xl leading-[1.05] font-extrabold text-ink md:text-5xl">
            Escolha o seu <span className="text-violet">modelo</span>
          </h1>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {MODELS.map((m) => {
              const ativo = m.id === modelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setModelId(m.id);
                    setErrors({});
                    setStatus({ kind: "idle", msg: "" });
                  }}
                  className={
                    ativo
                      ? "relative rounded-2xl border-4 border-ink bg-card p-4 text-left shadow-[4px_4px_0_var(--brand)]"
                      : "rounded-2xl border-2 border-ink/10 bg-cream/50 p-4 text-left transition hover:-translate-y-1 hover:border-ink"
                  }
                >
                  {ativo && (
                    <span className="absolute -top-3 right-3 rounded-full bg-pop px-2 py-0.5 text-[10px] font-extrabold text-cream">
                      Ativo
                    </span>
                  )}
                  <div
                    className={`mb-3 grid size-9 place-items-center rounded-xl ${accentBg[m.accent]}`}
                  >
                    <span className={`font-extrabold ${accentText[m.accent]}`}>{m.initial}</span>
                  </div>
                  <p className="text-sm leading-tight font-bold text-ink">{m.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-ink/45">{m.subtitle}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="block-card p-6 md:col-span-2 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold tracking-[0.2em] text-violet uppercase">
                  Passo 2 de 3
                </p>
                <h2 className="text-3xl font-extrabold text-ink">Dados do Contratante</h2>
              </div>
              <span className="rounded-full bg-mint/15 px-3 py-1.5 text-xs font-extrabold text-mint">
                Obrigatórios *
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {CONTRATANTE_FIELDS.map((f) => (
                <label key={f.key} className={f.span === 2 ? "col-span-2" : undefined}>
                  <span className="text-sm font-bold text-ink">{f.label}</span>
                  <input
                    type={f.mask === "date" ? "date" : f.mask === "email" ? "email" : "text"}
                    inputMode={
                      f.mask === "cpfCnpj" || f.mask === "cpf" || f.mask === "cep" || f.mask === "phone"
                        ? "numeric"
                        : undefined
                    }
                    value={values[f.key] ?? ""}
                    onChange={(e) => setField(f, e.target.value)}
                    className={`field-input mt-1.5 ${errors[f.key] ? "border-pop!" : ""}`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="block-card-dark p-6 md:p-7">
            <div className="flex items-center gap-2">
              <div className={`grid size-9 place-items-center rounded-xl ${accentSolid[model.accent]}`}>
                <span className="font-extrabold text-ink">{model.initial}</span>
              </div>
              <p className="font-display text-lg font-extrabold">{model.subtitle}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-cream/55">Campos financeiros específicos</p>

            <div className="mt-5 space-y-4">
              {model.financeFields.map((f) =>
                f.options ? (
                  <div key={f.key}>
                    <span className="text-xs font-bold tracking-wide text-cream/60 uppercase">
                      {f.label}
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {f.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setField(f, opt)}
                          className={
                            values[f.key] === opt
                              ? "rounded-2xl border-2 border-brand bg-brand px-3 py-2.5 text-sm font-bold text-ink"
                              : "rounded-2xl border-2 border-white/15 px-3 py-2.5 text-sm font-bold text-cream/70"
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {errors[f.key] && (
                      <p className="mt-1 text-[11px] font-bold text-pop">Selecione uma opção</p>
                    )}
                  </div>
                ) : (
                  <label key={f.key} className="block">
                    <span className="text-xs font-bold tracking-wide text-cream/60 uppercase">
                      {f.label}
                    </span>
                    <input
                      type={f.mask === "date" ? "date" : "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setField(f, e.target.value)}
                      className={`field-input-dark mt-1.5 ${errors[f.key] ? "border-pop!" : ""}`}
                    />
                  </label>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={gerar}
              disabled={gerando}
              className="btn-brand mt-6 w-full px-6 py-4 text-lg"
            >
              {gerando ? "Gerando..." : "Gerar Contrato"}
            </button>
            {status.msg && (
              <p
                className={`mt-3 text-center text-[12px] font-bold ${
                  status.kind === "erro" ? "text-pop" : "text-mint"
                }`}
              >
                {status.msg}
              </p>
            )}
          </div>
        </div>

        <section id="historico" className="block-card mt-6 p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-coral uppercase">
                Passo 3 de 3
              </p>
              <h2 className="text-3xl font-extrabold text-ink">Histórico local</h2>
            </div>
            <span className="rounded-full border-2 border-ink/10 bg-cream px-3 py-1.5 text-xs font-bold text-ink">
              {history.length} contratos
            </span>
          </div>
          {history.length === 0 ? (
            <p className="py-4 text-sm font-semibold text-ink/50">
              Nenhum contrato gerado ainda. Os contratos gerados neste navegador aparecem aqui.
            </p>
          ) : (
            <div className="divide-y divide-ink/10">
              {history.map((item) => {
                const m = getModel(item.modelId);
                return (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div
                      className={`grid size-11 shrink-0 place-items-center rounded-xl ${accentBg[m.accent]}`}
                    >
                      <span className={`font-extrabold ${accentText[m.accent]}`}>{m.initial}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-ink">{item.contratante}</p>
                      <p className="text-sm font-semibold text-ink/50">
                        {m.name} · {m.subtitle} <span className="text-ink/30">·</span>{" "}
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => baixarNovamente(item)}
                      className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition hover:bg-violet"
                    >
                      Baixar de novo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
