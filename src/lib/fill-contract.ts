import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ModelDef } from "./contract-models";
import { formatDateBr, splitSignatureDate } from "./format";

export type FormValues = Record<string, string>;

const CURRENCY_KEYS = new Set([
  "valorTotal",
  "valorEntrada",
  "valorParcelas",
  "valorAdesao",
  "valorContrato",
  "valorMensalidade",
  "valorSetup",
  "valorDiagnostico",
  "taxaAdesao",
]);

const DATE_KEYS = new Set([
  "dataEntrada",
  "dataPagamento",
  "dataExito",
  "dataVencimento",
  "dataPrimeiraMensalidade",
]);

/** Prepara o texto que vai para o PDF (contratos já trazem "R$" impresso). */
function textFor(key: string, raw: string) {
  if (!raw) return "";
  if (CURRENCY_KEYS.has(key)) return raw.replace(/^R\$\s*/, "");
  if (DATE_KEYS.has(key)) return formatDateBr(raw);
  return raw;
}

/** Datas divididas pelas barras impressas no contrato: chave "campo#d|#m|#y". */
function datePart(values: FormValues, key: string) {
  const [base = "", part = ""] = key.split("#");
  const iso = values[base] ?? "";
  if (!iso) return "";
  const [y = "", m = "", d = ""] = iso.split("-");
  return part === "d" ? d : part === "m" ? m : y;
}


export async function fillContract(model: ModelDef, values: FormValues) {
  const bytes = await fetch(model.pdfUrl).then((r) => {
    if (!r.ok) throw new Error("Não foi possível carregar o modelo do contrato.");
    return r.arrayBuffer();
  });

  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const page = pages[model.page] ?? pages[0]!;
  const { height } = page.getSize();
  const ink = rgb(0.09, 0.086, 0.106);

  const draw = (text: string, x: number, yTop: number, size = 8) => {
    if (!text) return;
    page.drawText(text, { x, y: height - yTop, size, font, color: ink });
  };

  // Campos de texto
  for (const [key, place] of Object.entries(model.coords)) {
    if (key.startsWith("assinatura")) continue;
    const value = textFor(key, values[key] ?? "");
    if (!value) continue;
    if (place.ddd !== undefined) {
      // telefone: DDD dentro dos parênteses impressos, número depois
      const digits = value.replace(/\D/g, "");
      const ddd = digits.slice(0, 2);
      const rest = digits.slice(2);
      const num = rest.length > 8 ? `${rest.slice(0, 5)}-${rest.slice(5)}` : `${rest.slice(0, 4)}-${rest.slice(4)}`;
      draw(ddd, place.ddd, place.y, 7);
      draw(num, place.x, place.y, place.size);
      continue;
    }
    draw(value, place.x, place.y, place.size);
  }

  // Campos de opção
  for (const [key, options] of Object.entries(model.optionCoords ?? {})) {
    const chosen = values[key];
    const place = chosen ? options[chosen] : undefined;
    if (!place) continue;
    if (place.label) {
      // O círculo impresso é desenhado por cima: marca com "X" grande e
      // sublinha o rótulo escolhido para não ficar dúvida.
      const size = 15;
      const w = bold.widthOfTextAtSize("X", size);
      page.drawText("X", {
        x: place.x - w / 2,
        y: height - place.y + 3 - size * 0.36,
        size,
        font: bold,
        color: ink,
      });
      page.drawLine({
        start: { x: place.label.x, y: height - place.y - 1.5 },
        end: { x: place.label.x + place.label.w, y: height - place.y - 1.5 },
        thickness: 1.2,
        color: ink,
      });
      continue;
    }
    draw("X", place.x, place.y, place.size ?? 8);
  }

  // Data da assinatura
  const { dia, mes, ano } = splitSignatureDate(values["dataAssinatura"] ?? "");
  const sDia = model.coords["assinaturaDia"];
  if (sDia) draw(dia, sDia.x, sDia.y);
  const sMes = model.coords["assinaturaMes"];
  if (sMes) draw(mes, sMes.x, sMes.y);
  const sAno = model.coords["assinaturaAno"];
  if (sAno) draw(ano, sAno.x, sAno.y);

  return pdf.save();
}

export function fileNameFor(model: ModelDef, values: FormValues) {
  const nome = (values["razaoSocial"] || "contratante")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `contrato-${model.id}-${nome}.pdf`;
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
