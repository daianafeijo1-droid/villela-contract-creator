const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function maskCpfCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCurrency(value: string) {
  const d = onlyDigits(value).slice(0, 13);
  if (!d) return "";
  const cents = (Number(d) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R$ ${cents}`;
}

export function maskPercent(value: string) {
  const d = value.replace(/[^\d,]/g, "").slice(0, 6);
  return d ? `${d}%` : "";
}

export function maskUf(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function maskDay(value: string) {
  const d = onlyDigits(value).slice(0, 2);
  return d;
}

export function maskInteger(value: string) {
  return onlyDigits(value).slice(0, 3);
}

/** Valor sem o prefixo R$, como aparece nos contratos (ex.: 12.500,00) */
export function stripCurrencyPrefix(value: string) {
  return value.replace(/^R\$\s*/, "");
}

export function formatDateBr(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function splitSignatureDate(iso: string) {
  if (!iso) return { dia: "", mes: "", ano: "" };
  const [y, m, d] = iso.split("-");
  return { dia: d ?? "", mes: MESES[Number(m) - 1] ?? "", ano: (y ?? "").slice(2) };
}
