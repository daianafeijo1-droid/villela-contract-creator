export type CnpjData = {
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  responsavel: string;
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Consulta pública de CNPJ (BrasilAPI). Retorna null quando não encontrado. */
export async function consultarCnpj(cnpj: string): Promise<CnpjData | null> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return null;

  // A consulta pública às vezes demora ou falha momentaneamente:
  // usamos tempo limite e uma segunda tentativa antes de desistir.
  async function buscar(): Promise<Response | null> {
    const controller = new AbortController();
    const limite = setTimeout(() => controller.abort(), 12000);
    try {
      return await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(limite);
    }
  }

  let res = await buscar();
  // 404 = CNPJ inexistente (não faz sentido tentar de novo).
  if (!res || (!res.ok && res.status !== 404)) {
    await new Promise((r) => setTimeout(r, 800));
    res = await buscar();
  }
  if (!res) throw new Error("Consulta de CNPJ indisponível no momento.");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Consulta de CNPJ indisponível no momento.");
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string).trim() : "");

  const numero = s("numero");
  const complemento = s("complemento");
  const endereco = [s("logradouro"), numero].filter(Boolean).join(", ") +
    (complemento ? ` - ${complemento}` : "");

  const socios = Array.isArray(d["qsa"]) ? (d["qsa"] as Record<string, unknown>[]) : [];
  const primeiro = socios[0];
  const responsavel =
    primeiro && typeof primeiro["nome_socio"] === "string" ? primeiro["nome_socio"] : "";

  return {
    razaoSocial: s("razao_social") || s("nome_fantasia"),
    nomeFantasia: s("nome_fantasia"),
    situacaoCadastral: s("descricao_situacao_cadastral"),
    responsavel,
    endereco,
    bairro: s("bairro"),
    municipio: s("municipio"),
    uf: s("uf"),
    cep: onlyDigits(s("cep")),
    telefone: onlyDigits(s("ddd_telefone_1")),
    email: s("email"),
  };
}
