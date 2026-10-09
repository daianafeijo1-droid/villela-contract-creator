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
type Obj = Record<string, unknown>;
const str = (o: unknown, k: string) => {
  const v = o && typeof o === "object" ? (o as Obj)[k] : undefined;
  return typeof v === "string" ? v.trim() : "";
};
const montarEndereco = (rua: string, numero: string, comp: string) =>
  [rua, numero].filter(Boolean).join(", ") + (comp ? ` - ${comp}` : "");

/** Resultado de uma fonte: dados, "naoEncontrado" (404) ou null (falha → próxima fonte). */
type Fonte = (digits: string) => Promise<CnpjData | "naoEncontrado" | null>;

async function getJson(url: string): Promise<Obj | "naoEncontrado" | null> {
  const controller = new AbortController();
  const limite = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (res.status === 404) return "naoEncontrado";
    if (!res.ok) return null;
    return (await res.json()) as Obj;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}

const brasilApi: Fonte = async (digits) => {
  const d = await getJson(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (!d || d === "naoEncontrado") return d;
  const socios = Array.isArray(d["qsa"]) ? (d["qsa"] as Obj[]) : [];
  return {
    razaoSocial: str(d, "razao_social") || str(d, "nome_fantasia"),
    nomeFantasia: str(d, "nome_fantasia"),
    situacaoCadastral: str(d, "descricao_situacao_cadastral"),
    responsavel: str(socios[0], "nome_socio"),
    endereco: montarEndereco(str(d, "logradouro"), str(d, "numero"), str(d, "complemento")),
    bairro: str(d, "bairro"),
    municipio: str(d, "municipio"),
    uf: str(d, "uf"),
    cep: onlyDigits(str(d, "cep")),
    telefone: onlyDigits(str(d, "ddd_telefone_1")),
    email: str(d, "email"),
  };
};

const cnpja: Fonte = async (digits) => {
  const d = await getJson(`https://open.cnpja.com/office/${digits}`);
  if (!d || d === "naoEncontrado") return d;
  const company = (d["company"] ?? {}) as Obj;
  const address = (d["address"] ?? {}) as Obj;
  const members = Array.isArray(company["members"]) ? (company["members"] as Obj[]) : [];
  const phones = Array.isArray(d["phones"]) ? (d["phones"] as Obj[]) : [];
  const emails = Array.isArray(d["emails"]) ? (d["emails"] as Obj[]) : [];
  const tel = phones[0] ? onlyDigits(str(phones[0], "area") + str(phones[0], "number")) : "";
  return {
    razaoSocial: str(company, "name") || str(d, "alias"),
    nomeFantasia: str(d, "alias"),
    situacaoCadastral: str(d["status"], "text").toUpperCase(),
    responsavel: str(members[0]?.["person"], "name").toUpperCase(),
    endereco: montarEndereco(str(address, "street"), str(address, "number"), str(address, "details")),
    bairro: str(address, "district"),
    municipio: str(address, "city"),
    uf: str(address, "state"),
    cep: onlyDigits(str(address, "zip")),
    telefone: tel,
    email: str(emails[0], "address"),
  };
};

const minhaReceita: Fonte = async (digits) => {
  const d = await getJson(`https://minhareceita.org/${digits}`);
  if (!d || d === "naoEncontrado") return d;
  const socios = Array.isArray(d["qsa"]) ? (d["qsa"] as Obj[]) : [];
  return {
    razaoSocial: str(d, "razao_social") || str(d, "nome_fantasia"),
    nomeFantasia: str(d, "nome_fantasia"),
    situacaoCadastral: str(d, "descricao_situacao_cadastral"),
    responsavel: str(socios[0], "nome_socio"),
    endereco: montarEndereco(str(d, "logradouro"), str(d, "numero"), str(d, "complemento")),
    bairro: str(d, "bairro"),
    municipio: str(d, "municipio"),
    uf: str(d, "uf"),
    cep: onlyDigits(str(d, "cep")),
    telefone: onlyDigits(str(d, "ddd_telefone_1")),
    email: str(d, "email"),
  };
};

/**
 * Consulta pública de CNPJ com fontes de reserva: se uma estiver fora do ar,
 * tenta a próxima. Retorna null quando o CNPJ não existe.
 */
export async function consultarCnpj(cnpj: string): Promise<CnpjData | null> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return null;

  let naoEncontrado = 0;
  // CNPJá primeiro: responde em milissegundos; BrasilAPI costuma travar quando instável.
  for (const fonte of [cnpja, brasilApi, minhaReceita]) {
    const r = await fonte(digits);
    if (r === "naoEncontrado") {
      naoEncontrado++;
      continue;
    }
    if (r && r.razaoSocial) return r;
  }
  if (naoEncontrado > 0) return null;
  throw new Error("Consulta de CNPJ indisponível no momento.");
}
