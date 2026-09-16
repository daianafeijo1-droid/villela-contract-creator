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
  centsToCurrency,
  currencyToCents,
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
import {
  downloadPdf,
  fileNameFor,
  fillContract,
  type FormValues,
} from "@/lib/fill-contract";
import { useHistory, type HistoryItem } from "@/lib/history";
import { consultarCnpj } from "@/lib/cnpj";
import { useAuth } from "@/lib/auth";
import { ClientsSection } from "@/components/clients-section";
import type { Client } from "@/lib/clients";
import { PdfThumbnail } from "@/components/pdf-thumbnail";
import { LoginGate } from "@/components/login-gate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estúdio de Contratos | Daiana Feijó" },
      {
        name: "description",
        content:
          "Gere contratos do Daiana Feijó em PDF a partir de um formulário: Regularize Aqui, Renegocie Bancário, Recupere Aqui e Renegocie Empresarial.",
      },
      {
        property: "og:title",
        content: "Estúdio de Contratos | Daiana Feijó",
      },
      {
        property: "og:description",
        content:
          "Preencha o formulário e baixe o contrato em PDF pronto para assinatura.",
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

type Aba = "contratos" | "clientes";

const CNPJ_AUTO_FIELDS = [
  "razaoSocial",
  "responsavel",
  "endereco",
  "bairro",
  "municipio",
  "uf",
  "cep",
  "telefone",
  "email",
] as const;

function Index() {
  const [aba, setAba] = useState<Aba>("contratos");
  const [modelId, setModelId] = useState(MODELS[0]!.id);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{
    kind: "idle" | "erro" | "ok";
    msg: string;
  }>({
    kind: "idle",
    msg: "",
  });
  const [mostrarModelo, setMostrarModelo] = useState(false);
  const [gerando, setGerando] = useState(false);

  // Autenticação vem antes do histórico.
  // O histórico só é habilitado quando existe um usuário autenticado
  // e o carregamento da autenticação terminou.
  const {
    user,
    loading: authLoading,
    entrar,
    criarAcesso,
    sair,
  } = useAuth();

  const {
    history,
    carregando: historicoCarregando,
    registrar,
    remover: removerDoHistorico,
  } = useHistory(!!user && !authLoading);

  // Histórico dividido: contratos gerados pela equipe logada e
  // contratos gerados por terceiros (visitantes sem login), que só
  // aparecem para quem está autenticado.
  const [historicoAba, setHistoricoAba] = useState<"equipe" | "visitante">(
    "equipe",
  );

  const meusContratos = useMemo(
    () => history.filter((h) => h.origem !== "visitante"),
    [history],
  );

  const contratosDeTerceiros = useMemo(
    () => history.filter((h) => h.origem === "visitante"),
    [history],
  );

  const listaHistoricoAtual =
    historicoAba === "equipe" ? meusContratos : contratosDeTerceiros;

  async function removerDoHistoricoComConfirmacao(item: HistoryItem) {
    const ok = window.confirm(
      `Remover "${item.contratante || "este contrato"}" do histórico? Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    await removerDoHistorico(item.id);
  }

  // Leva os dados já salvos do cliente (aba Clientes em Atendimento) para o
  // formulário de contrato, evitando redigitar tudo de novo. Data de
  // assinatura e campos financeiros ficam em branco: são específicos de
  // cada contrato e precisam ser conferidos na hora.
  function gerarContratoDoCliente(cliente: Client) {
    setValues((v) => {
      const next: FormValues = { ...v };

      const put = (key: string, val: string, mask?: MaskKind) => {
        next[key] = val ? applyMask(mask, val) : "";
      };

      put("razaoSocial", cliente.razaoSocial);
      put("cpfCnpj", cliente.cnpj, "cpfCnpj");
      put("responsavel", cliente.responsavel);
      put("cpfResponsavel", cliente.cpfResponsavel, "cpf");
      put("endereco", cliente.endereco);
      put("bairro", cliente.bairro);
      put("municipio", cliente.municipio);
      put("uf", cliente.uf, "uf");
      put("cep", cliente.cep, "cep");
      put("telefone", cliente.telefone, "phone");
      put("email", cliente.email);

      return next;
    });

    setErrors({});
    setAba("contratos");
    setStatus({
      kind: "ok",
      msg: `Dados de ${cliente.nomeFantasia || cliente.razaoSocial} preenchidos. Escolha o modelo e confira os campos antes de gerar.`,
    });

    requestAnimationFrame(() => {
      document.getElementById("passo-1")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  const [cnpjStatus, setCnpjStatus] = useState<{
    kind: "idle" | "loading" | "ok" | "erro";
    msg: string;
  }>({
    kind: "idle",
    msg: "",
  });

  const model = useMemo(() => getModel(modelId), [modelId]);

  const allFields = useMemo(
    () => [...CONTRATANTE_FIELDS, ...model.financeFields],
    [model],
  );

  const totalAutomatico = useMemo(() => {
    const keys = new Set(model.financeFields.map((f) => f.key));

    return (
      keys.has("valorTotal") &&
      keys.has("valorEntrada") &&
      keys.has("valorParcelas") &&
      keys.has("qtdParcelas")
    );
  }, [model]);

  // Prova social: mostra o ritmo da equipe.
  // Só aparece para quem está logado, já que o histórico exige login para ser lido.
  const geradosSemana = useMemo(() => {
    const seteDiasAtras = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return history.filter(
      (h) => new Date(h.createdAt).getTime() >= seteDiasAtras,
    ).length;
  }, [history]);

  // Ancoragem: destaca o modelo que a equipe mais gera.
  const modeloMaisGerado = useMemo(() => {
    if (history.length < 3) return null;

    const contagem = new Map<string, number>();

    for (const h of history) {
      contagem.set(
        h.modelId,
        (contagem.get(h.modelId) ?? 0) + 1,
      );
    }

    let melhor: string | null = null;
    let max = 0;

    for (const [id, n] of contagem) {
      if (n > max) {
        max = n;
        melhor = id;
      }
    }

    return melhor;
  }, [history]);

  // Efeito Zeigarnik: barra de progresso das etapas.
  const progressoPercentual = useMemo(() => {
    if (allFields.length === 0) return 0;

    const preenchidos = allFields.filter(
      (f) => (values[f.key] ?? "").trim().length > 0,
    ).length;

    return Math.round(
      (preenchidos / allFields.length) * 100,
    );
  }, [allFields, values]);

  useEffect(() => {
    if (!totalAutomatico) return;

    const entradaCents = currencyToCents(
      values["valorEntrada"] ?? "",
    );

    const parcelaCents = currencyToCents(
      values["valorParcelas"] ?? "",
    );

    const qtd =
      Number(values["qtdParcelas"] ?? "0") || 0;

    const totalCents =
      entradaCents + parcelaCents * qtd;

    const totalFormatado =
      totalCents > 0
        ? centsToCurrency(totalCents)
        : "";

    setValues((v) =>
      v["valorTotal"] === totalFormatado
        ? v
        : {
            ...v,
            valorTotal: totalFormatado,
          },
    );
  }, [
    totalAutomatico,
    values["valorEntrada"],
    values["valorParcelas"],
    values["qtdParcelas"],
  ]);

  const setField = (
    field: FieldDef,
    raw: string,
  ) => {
    const masked = applyMask(field.mask, raw);

    setValues((v) => ({
      ...v,
      [field.key]: masked,
    }));

    setErrors((e) => ({
      ...e,
      [field.key]: false,
    }));

    if (field.key === "cpfCnpj") {
      const digits = masked.replace(/\D/g, "");

      if (digits.length === 14) {
        void buscarCnpj(masked);
      } else {
        limparDadosCnpj();
      }
    }
  };

  function limparDadosCnpj() {
    setValues((v) => {
      const next = { ...v };

      for (const key of CNPJ_AUTO_FIELDS) {
        delete next[key];
      }

      return next;
    });

    setCnpjStatus({
      kind: "idle",
      msg: "",
    });
  }

  async function buscarCnpj(cnpj: string) {
    setCnpjStatus({
      kind: "loading",
      msg: "Consultando CNPJ...",
    });

    try {
      const d = await consultarCnpj(cnpj);

      if (!d) {
        setCnpjStatus({
          kind: "erro",
          msg: "CNPJ não encontrado na consulta pública.",
        });

        return;
      }

      setValues((v) => {
        const next = { ...v };

        const put = (
          key: string,
          val: string,
          mask?: MaskKind,
        ) => {
          if (val) {
            next[key] = applyMask(mask, val);
          }
        };

        put("razaoSocial", d.razaoSocial);
        put("responsavel", d.responsavel);
        put("endereco", d.endereco);
        put("bairro", d.bairro);
        put("municipio", d.municipio);
        put("uf", d.uf, "uf");
        put("cep", d.cep, "cep");
        put("telefone", d.telefone, "phone");
        put("email", d.email);

        return next;
      });

      setErrors({});

      setCnpjStatus({
        kind: "ok",
        msg: `Dados preenchidos: ${d.razaoSocial}`,
      });
    } catch {
      setCnpjStatus({
        kind: "erro",
        msg: "Não foi possível consultar o CNPJ agora.",
      });
    }
  }

  async function gerar() {
    const faltando: Record<string, boolean> = {};

    for (const f of allFields) {
      if (
        f.required &&
        !(values[f.key] ?? "").trim()
      ) {
        faltando[f.key] = true;
      }
    }

    if (Object.keys(faltando).length) {
      setErrors(faltando);

      setStatus({
        kind: "erro",
        msg: `Preencha os ${
          Object.keys(faltando).length
        } campo(s) destacado(s) antes de gerar.`,
      });

      return;
    }

    setGerando(true);
    setStatus({
      kind: "idle",
      msg: "",
    });

    try {
      const bytes = await fillContract(
        model,
        values,
      );

      downloadPdf(
        bytes,
        fileNameFor(model, values),
      );

      // O download já aconteceu: um problema para salvar
      // o histórico não deve ser reportado como falha
      // na geração do contrato.
      try {
        await registrar({
          modelId: model.id,
          contratante:
            values["razaoSocial"] ?? "",
          values,
          origem: user ? "equipe" : "visitante",
        });

        setStatus({
          kind: "ok",
          msg: "Contrato gerado, baixado e salvo no histórico.",
        });
      } catch {
        setStatus({
          kind: "ok",
          msg: "Contrato gerado e baixado. Não foi possível salvar no histórico agora.",
        });
      }
    } catch (err) {
      setStatus({
        kind: "erro",
        msg:
          err instanceof Error
            ? err.message
            : "Não foi possível gerar o contrato.",
      });
    } finally {
      setGerando(false);
    }
  }

  async function baixarNovamente(
    item: HistoryItem,
  ) {
    const m = getModel(item.modelId);

    try {
      const bytes = await fillContract(
        m,
        item.values,
      );

      downloadPdf(
        bytes,
        fileNameFor(m, item.values),
      );
    } catch {
      setStatus({
        kind: "erro",
        msg: "Não foi possível baixar esse contrato novamente.",
      });
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="topbar-glass mb-8 flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="topbar-glow">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet/70 to-transparent" />
            <div className="absolute -top-10 left-10 h-20 w-56 rounded-full bg-violet/20 blur-2xl" />
          </div>

          <div className="relative flex items-center gap-3">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-ink shadow-sm ring-1 ring-violet/40">
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-transparent to-violet/45" />
              <span className="font-display relative text-xl font-extrabold text-brand">
                V
              </span>
            </span>

            <div className="hidden leading-tight sm:block">
              <p className="font-display text-lg font-extrabold text-ink">
                Daiana Feijó
              </p>

              <p className="text-[11px] font-semibold tracking-wide text-ink/50">
                Estúdio de Contratos
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => void sair()}
                title={user.email ?? ""}
                className="rounded-full px-3 py-2 text-xs font-bold text-ink/60 transition hover:bg-coral/10 hover:text-coral"
              >
                Sair
              </button>
            )}

            {aba === "contratos" && (
              <a
                href="#historico"
                className="btn-pop px-5 py-2.5 text-sm"
              >
                Histórico ({history.length})
              </a>
            )}
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["contratos", "Contratos"],
              [
                "clientes",
                "Clientes em Atendimento",
              ],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAba(value)}
              className={
                aba === value
                  ? "badge-glass rounded-2xl bg-ink/85! px-5 py-2.5 text-sm font-extrabold text-cream backdrop-blur-md"
                  : "badge-glass rounded-2xl px-5 py-2.5 text-sm font-extrabold text-ink/60 transition hover:text-ink"
              }
            >
              {label}
            </button>
          ))}
        </div>

        {aba === "clientes" && (
          <LoginGate
            user={user}
            authLoading={authLoading}
            entrar={entrar}
            criarAcesso={criarAcesso}
            title="Clientes em Atendimento"
            description="Faça login com sua conta da equipe para ver e gerenciar os clientes."
          >
            <ClientsSection onGerarContrato={gerarContratoDoCliente} />
          </LoginGate>
        )}

        {aba === "contratos" && (
          <>
            <section id="passo-1" className="block-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-extrabold tracking-[0.2em] text-pop uppercase">
                  Passo 1 de 3
                </p>

                {geradosSemana > 0 && (
                  <span className="badge-glass px-3 py-1.5 text-xs font-extrabold text-ink/70">
                    🔥 {geradosSemana} contrato(s)
                    gerado(s) pela equipe nos
                    últimos 7 dias
                  </span>
                )}
              </div>

              <h1 className="mt-1 mb-3 text-4xl leading-[1.05] font-extrabold text-ink md:text-5xl">
                Escolha o seu{" "}
                <span className="text-violet">
                  modelo
                </span>
              </h1>

              <div className="progress-track mb-5">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressoPercentual}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {MODELS.map((m) => {
                  const ativo =
                    m.id === modelId;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setModelId(m.id);
                        setErrors({});
                        setStatus({
                          kind: "idle",
                          msg: "",
                        });

                        // Evita que campos financeiros
                        // de outro modelo fiquem preenchidos.
                        const manter =
                          new Set(
                            CONTRATANTE_FIELDS.map(
                              (f) => f.key,
                            ),
                          );

                        setValues((v) => {
                          const next: FormValues =
                            {};

                          for (const [
                            key,
                            val,
                          ] of Object.entries(v)) {
                            if (
                              manter.has(key)
                            ) {
                              next[key] = val;
                            }
                          }

                          return next;
                        });
                      }}
                      className={
                        ativo
                          ? "badge-glass relative rounded-2xl p-4 text-left ring-2 ring-violet/60"
                          : "badge-glass rounded-2xl p-4 text-left opacity-80 transition hover:-translate-y-1 hover:opacity-100"
                      }
                    >
                      {ativo && (
                        <span className="badge-glass absolute -top-3 right-3 bg-pop/90! px-2 py-0.5 text-[10px] font-extrabold text-cream">
                          Ativo
                        </span>
                      )}

                      {!ativo &&
                        m.id ===
                          modeloMaisGerado && (
                          <span className="badge-glass absolute -top-3 left-3 px-2 py-0.5 text-[10px] font-extrabold text-violet">
                            Mais usado
                          </span>
                        )}

                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className={`grid size-9 shrink-0 place-items-center rounded-xl ${accentBg[m.accent]}`}
                        >
                          <span
                            className={`font-extrabold ${accentText[m.accent]}`}
                          >
                            {m.initial}
                          </span>
                        </div>

                        <PdfThumbnail
                          url={m.pdfUrl}
                          width={90}
                          className="h-11 w-9 rounded-md border border-ink/10"
                        />
                      </div>

                      <p className="text-sm leading-tight font-bold text-ink">
                        {m.name}
                      </p>

                      <p className="mt-0.5 text-[11px] font-semibold text-ink/45">
                        {m.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center gap-4 border-t border-ink/10 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarModelo(true)
                  }
                  className="group badge-glass relative shrink-0 overflow-hidden p-0"
                  title="Clique para ampliar e ler o contrato"
                >
                  <PdfThumbnail
                    url={model.pdfUrl}
                    width={280}
                    className="h-[196px] w-[144px]"
                  />

                  <span className="absolute inset-0 grid place-items-center bg-ink/0 text-[10px] font-extrabold text-transparent transition group-hover:bg-ink/40 group-hover:text-cream">
                    Ampliar e ler
                  </span>
                </button>

                <div>
                  <p className="text-sm font-extrabold text-ink">
                    Prévia do modelo selecionado
                  </p>

                  <p className="text-[11px] font-semibold text-ink/50">
                    {model.name} ·{" "}
                    {model.subtitle} — a
                    miniatura é só para
                    reconhecimento visual;
                    clique nela para abrir em
                    tamanho de leitura.
                  </p>
                </div>
              </div>
            </section>

            {mostrarModelo && (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
                onClick={() =>
                  setMostrarModelo(false)
                }
              >
                <div
                  className="block-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-4 md:max-w-3xl"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-extrabold text-ink">
                      {model.name} ·{" "}
                      {model.subtitle}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarModelo(false)
                      }
                      className="rounded-full border-2 border-ink/10 px-2.5 py-1 text-xs font-extrabold text-ink/60 hover:border-ink"
                    >
                      Fechar ✕
                    </button>
                  </div>

                  <PdfThumbnail
                    url={model.pdfUrl}
                    width={900}
                    className="w-full rounded-xl border border-ink/10"
                  />

                  <a
                    href={model.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-center text-xs font-extrabold text-violet underline underline-offset-2"
                  >
                    Abrir PDF completo em nova aba
                  </a>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="block-card p-6 md:col-span-2 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.2em] text-violet uppercase">
                      Passo 2 de 3
                    </p>

                    <h2 className="text-3xl font-extrabold text-ink">
                      Dados do Contratante
                    </h2>
                  </div>

                  <span className="rounded-full bg-mint/15 px-3 py-1.5 text-xs font-extrabold text-mint">
                    Obrigatórios *
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {CONTRATANTE_FIELDS.map(
                    (f) => (
                      <label
                        key={f.key}
                        className={
                          f.span === 2
                            ? "col-span-2"
                            : undefined
                        }
                      >
                        <span className="text-sm font-bold text-ink">
                          {f.label}
                        </span>

                        <input
                          type={
                            f.mask === "date"
                              ? "date"
                              : f.mask ===
                                  "email"
                                ? "email"
                                : "text"
                          }
                          inputMode={
                            f.mask ===
                              "cpfCnpj" ||
                            f.mask === "cpf" ||
                            f.mask === "cep" ||
                            f.mask === "phone"
                              ? "numeric"
                              : undefined
                          }
                          value={
                            values[f.key] ?? ""
                          }
                          onChange={(e) =>
                            setField(
                              f,
                              e.target.value,
                            )
                          }
                          className={`field-input mt-1.5 ${
                            errors[f.key]
                              ? "border-destructive!"
                              : ""
                          }`}
                        />

                        {f.key ===
                          "cpfCnpj" && (
                          <p
                            className={`mt-1 text-[11px] font-bold ${
                              cnpjStatus.kind ===
                              "erro"
                                ? "text-destructive"
                                : cnpjStatus.kind ===
                                    "ok"
                                  ? "text-mint"
                                  : "text-ink/45"
                            }`}
                          >
                            {cnpjStatus.kind ===
                            "idle"
                              ? "Digite o CNPJ completo para preencher os dados automaticamente."
                              : cnpjStatus.msg}
                          </p>
                        )}
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="block-card-dark p-6 md:p-7">
                <div className="flex items-center gap-2">
                  <div
                    className={`grid size-9 place-items-center rounded-xl ${accentSolid[model.accent]}`}
                  >
                    <span className="font-extrabold text-ink">
                      {model.initial}
                    </span>
                  </div>

                  <p className="font-display text-lg font-extrabold">
                    {model.subtitle}
                  </p>
                </div>

                <p className="mt-1 text-sm font-semibold text-cream/55">
                  Campos financeiros
                  específicos
                </p>

                <div className="mt-5 space-y-4">
                  {model.financeFields.map(
                    (f) =>
                      f.options ? (
                        <div key={f.key}>
                          <span className="text-xs font-bold tracking-wide text-cream/60 uppercase">
                            {f.label}
                          </span>

                          <div className="mt-1.5 grid grid-cols-2 gap-2">
                            {f.options.map(
                              (opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setField(
                                      f,
                                      opt,
                                    )
                                  }
                                  className={
                                    values[
                                      f.key
                                    ] === opt
                                      ? "rounded-2xl border-2 border-brand bg-brand px-3 py-2.5 text-sm font-bold text-ink"
                                      : "rounded-2xl border-2 border-white/15 px-3 py-2.5 text-sm font-bold text-cream/70"
                                  }
                                >
                                  {opt}
                                </button>
                              ),
                            )}
                          </div>

                          {errors[f.key] && (
                            <p className="mt-1 text-[11px] font-bold text-destructive">
                              Selecione uma opção
                            </p>
                          )}
                        </div>
                      ) : (
                        <label
                          key={f.key}
                          className="block"
                        >
                          <span className="text-xs font-bold tracking-wide text-cream/60 uppercase">
                            {f.label}

                            {totalAutomatico &&
                              f.key ===
                                "valorTotal" && (
                                <span className="ml-1.5 normal-case text-cream/40">
                                  (calculado
                                  automaticamente)
                                </span>
                              )}
                          </span>

                          <input
                            type={
                              f.mask === "date"
                                ? "date"
                                : "text"
                            }
                            value={
                              values[f.key] ??
                              ""
                            }
                            readOnly={
                              totalAutomatico &&
                              f.key ===
                                "valorTotal"
                            }
                            onChange={(e) =>
                              setField(
                                f,
                                e.target.value,
                              )
                            }
                            className={`field-input-dark mt-1.5 ${
                              errors[f.key]
                                ? "border-destructive!"
                                : ""
                            } ${
                              totalAutomatico &&
                              f.key ===
                                "valorTotal"
                                ? "cursor-not-allowed opacity-80"
                                : ""
                            }`}
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
                  {gerando
                    ? "Gerando..."
                    : "Gerar Contrato"}
                </button>

                {status.msg && (
                  <p
                    className={`mt-3 text-center text-[12px] font-bold ${
                      status.kind === "erro"
                        ? "text-destructive"
                        : "text-mint"
                    }`}
                  >
                    {status.msg}
                  </p>
                )}
              </div>
            </div>

            <LoginGate
              user={user}
              authLoading={authLoading}
              entrar={entrar}
            criarAcesso={criarAcesso}
              title="Histórico de Contratos"
              description="Faça login para ver e baixar novamente os contratos já gerados."
            >
              <section
                id="historico"
                className="block-card mt-6 p-6 md:p-8"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.2em] text-coral uppercase">
                      Passo 3 de 3
                    </p>

                    <h2 className="text-3xl font-extrabold text-ink">
                      Histórico
                    </h2>
                  </div>

                  <span className="badge-glass px-3 py-1.5 text-xs font-bold text-ink">
                    {history.length} contratos
                  </span>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {(
                    [
                      [
                        "equipe",
                        `Meus Contratos (${meusContratos.length})`,
                      ],
                      [
                        "visitante",
                        `Gerados por Terceiros (${contratosDeTerceiros.length})`,
                      ],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setHistoricoAba(value)
                      }
                      className={
                        historicoAba === value
                          ? "badge-glass rounded-2xl bg-ink/85! px-4 py-2 text-sm font-bold text-cream backdrop-blur-md"
                          : "badge-glass rounded-2xl px-4 py-2 text-sm font-bold text-ink/60 transition hover:text-ink"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {historicoAba === "visitante" && (
                  <p className="mb-4 text-xs font-semibold text-ink/40">
                    Contratos gerados sem login (por quem recebeu o link do
                    Estúdio de Contratos). Visível somente para a equipe
                    autenticada.
                  </p>
                )}

                {historicoCarregando ? (
                  <div className="space-y-3 py-2">
                    <div className="h-14 animate-pulse rounded-xl bg-ink/5" />
                    <div className="h-14 animate-pulse rounded-xl bg-ink/5" />
                  </div>
                ) : listaHistoricoAtual.length === 0 ? (
                  <p className="py-4 text-sm font-semibold text-ink/50">
                    {historicoAba === "equipe"
                      ? "Nenhum contrato gerado pela equipe ainda."
                      : "Nenhum contrato gerado por terceiros ainda."}
                  </p>
                ) : (
                  <div className="divide-y divide-ink/10">
                    {listaHistoricoAtual.map((item) => {
                      const m = getModel(
                        item.modelId,
                      );

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 py-4"
                        >
                          <div
                            className={`grid size-11 shrink-0 place-items-center rounded-xl ${accentBg[m.accent]}`}
                          >
                            <span
                              className={`font-extrabold ${accentText[m.accent]}`}
                            >
                              {m.initial}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-extrabold text-ink">
                              {item.contratante}
                            </p>

                            <p className="text-sm font-semibold text-ink/50">
                              {m.name} ·{" "}
                              {m.subtitle}{" "}
                              <span className="text-ink/30">
                                ·
                              </span>{" "}
                              {new Date(
                                item.createdAt,
                              ).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                baixarNovamente(
                                  item,
                                )
                              }
                              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-cream transition hover:bg-violet"
                            >
                              Baixar de novo
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removerDoHistoricoComConfirmacao(
                                  item,
                                )
                              }
                              title="Remover do histórico"
                              className="rounded-xl border-2 border-ink/10 px-3 py-2.5 text-xs font-bold text-ink/50 transition hover:border-destructive hover:text-destructive"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </LoginGate>
          </>
        )}
      </div>
    </div>
  );
}
