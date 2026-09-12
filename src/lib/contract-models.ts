import assetRecupere from "@/assets/modelo-1782849141734.pdf.asset.json";
import assetEmpresarial from "@/assets/modelo-1784309431871.pdf.asset.json";
import assetBancarioAdesao from "@/assets/modelo-1784635752402.pdf.asset.json";
import assetPrf from "@/assets/modelo-1786630521523.pdf.asset.json";
import assetParcelado from "@/assets/modelo-1788263253659.pdf.asset.json";

export type MaskKind =
  | "text"
  | "cpfCnpj"
  | "cpf"
  | "cep"
  | "phone"
  | "currency"
  | "percent"
  | "uf"
  | "day"
  | "integer"
  | "date"
  | "email";

export type FieldDef = {
  key: string;
  label: string;
  mask?: MaskKind;
  required?: boolean;
  span?: 1 | 2;
  options?: string[];
};

/** Posição do texto no PDF. `y` é medido a partir do TOPO da página (pt). */
export type Placement = {
  x: number;
  y: number;
  size?: number;
  /** telefone: x do DDD, desenhado dentro dos parênteses impressos */
  ddd?: number;
  /** opções sobre círculos impressos: sublinha o rótulo para ficar visível */
  label?: { x: number; w: number };
};

export type ModelDef = {
  id: string;
  name: string;
  subtitle: string;
  initial: string;
  accent: "coral" | "mint" | "violet" | "brand" | "pop";
  pdfUrl: string;
  page: number;
  financeFields: FieldDef[];
  /** coordenadas por campo (contratante + financeiro + assinatura) */
  coords: Record<string, Placement>;
  /** coordenadas de marcação "X" para campos de opção */
  optionCoords?: Record<string, Record<string, Placement>>;
};

export const CONTRATANTE_FIELDS: FieldDef[] = [
  { key: "razaoSocial", label: "Razão Social / Nome", required: true, span: 2 },
  { key: "cpfCnpj", label: "CPF ou CNPJ", mask: "cpfCnpj", required: true },
  { key: "responsavel", label: "Nome do responsável legal", required: true },
  { key: "cpfResponsavel", label: "CPF do responsável", mask: "cpf", required: true },
  { key: "endereco", label: "Endereço", required: true },
  { key: "bairro", label: "Bairro", required: true },
  { key: "municipio", label: "Município", required: true },
  { key: "uf", label: "UF", mask: "uf", required: true },
  { key: "cep", label: "CEP", mask: "cep", required: true },
  { key: "telefone", label: "Telefone", mask: "phone", required: true },
  { key: "email", label: "E-mail", mask: "email", required: true, span: 2 },
  { key: "dataAssinatura", label: "Data da assinatura", mask: "date", required: true, span: 2 },
];

/* Blocos de contratante compartilhados (mesmo layout em vários modelos) */
const contratanteA = {
  razaoSocial: { x: 92, y: 49 },
  cpfCnpj: { x: 448, y: 50 },
  responsavel: { x: 110, y: 64 },
  cpfResponsavel: { x: 426, y: 64 },
  endereco: { x: 60, y: 78 },
  cep: { x: 426, y: 80 },
  bairro: { x: 50, y: 93 },
  municipio: { x: 250, y: 94 },
  uf: { x: 422, y: 94 },
  telefone: { x: 71, y: 108, ddd: 58.5 },
  email: { x: 242, y: 108 },
};

const contratanteB = {
  razaoSocial: { x: 92, y: 48 },
  cpfCnpj: { x: 447, y: 48 },
  responsavel: { x: 110, y: 62 },
  cpfResponsavel: { x: 426, y: 62 },
  endereco: { x: 60, y: 76 },
  cep: { x: 426, y: 78 },
  bairro: { x: 50, y: 91 },
  municipio: { x: 251, y: 92 },
  uf: { x: 422, y: 92 },
  telefone: { x: 58, y: 106 },
  email: { x: 242, y: 106 },
};

const contratantePrf = {
  razaoSocial: { x: 92, y: 43 },
  cpfCnpj: { x: 447, y: 43 },
  responsavel: { x: 110, y: 58 },
  cpfResponsavel: { x: 426, y: 58 },
  endereco: { x: 60, y: 72 },
  cep: { x: 426, y: 73 },
  bairro: { x: 50, y: 86 },
  municipio: { x: 250, y: 87 },
  uf: { x: 422, y: 87 },
  telefone: { x: 58, y: 101 },
  email: { x: 242, y: 101 },
};

export const MODELS: ModelDef[] = [
  {
    id: "prf",
    name: "Regularize Aqui",
    subtitle: "PRF",
    initial: "R",
    accent: "coral",
    pdfUrl: assetPrf.url,
    page: 1,
    financeFields: [
      { key: "valorTotal", label: "Valor total do contrato", mask: "currency", required: true },
      { key: "valorEntrada", label: "Valor da entrada", mask: "currency", required: true },
      { key: "dataEntrada", label: "Data de pagamento da entrada", mask: "date", required: true },
      { key: "valorParcelas", label: "Valor das parcelas", mask: "currency", required: true },
      { key: "qtdParcelas", label: "Quantidade de parcelas", mask: "integer", required: true },
      { key: "vencimentoDia", label: "Vencimento (todo dia)", mask: "day", required: true },
      {
        key: "esfera",
        label: "Esfera de atuação",
        required: true,
        options: ["Estadual", "Federal"],
        span: 2,
      },
    ],
    coords: {
      ...contratantePrf,
      valorTotal: { x: 133, y: 179 },
      valorEntrada: { x: 321, y: 179 },
      dataEntrada: { x: 515, y: 179, size: 7 },
      valorParcelas: { x: 157, y: 198 },
      qtdParcelas: { x: 349, y: 198 },
      vencimentoDia: { x: 473, y: 198 },
      assinaturaDia: { x: 401, y: 717 },
      assinaturaMes: { x: 434, y: 717 },
      assinaturaAno: { x: 516, y: 717 },
    },
    optionCoords: {
      esfera: {
        Estadual: { x: 313, y: 216 },
        Federal: { x: 361, y: 216 },
      },
    },
  },
  {
    id: "bancario-adesao",
    name: "Renegocie Bancário",
    subtitle: "Adesão",
    initial: "A",
    accent: "mint",
    pdfUrl: assetBancarioAdesao.url,
    page: 1,
    financeFields: [
      { key: "valorAdesao", label: "Valor total da adesão", mask: "currency", required: true },
      { key: "diaPagamento", label: "Dia de pagamento", mask: "day", required: true },
    ],
    coords: {
      ...contratanteB,
      valorAdesao: { x: 176, y: 242 },
      diaPagamento: { x: 403, y: 242 },
      assinaturaDia: { x: 246, y: 725 },
      assinaturaMes: { x: 282, y: 725 },
      assinaturaAno: { x: 371, y: 725 },
    },
  },
  {
    id: "bancario-parcelado",
    name: "Renegocie Bancário",
    subtitle: "Parcelado",
    initial: "P",
    accent: "violet",
    pdfUrl: assetParcelado.url,
    page: 1,
    financeFields: [
      { key: "valorTotal", label: "Valor total do contrato", mask: "currency", required: true },
      { key: "valorEntrada", label: "Valor da entrada", mask: "currency", required: true },
      { key: "dataEntrada", label: "Data de pagamento da entrada", mask: "date", required: true },
      { key: "valorParcelas", label: "Valor das parcelas", mask: "currency", required: true },
      { key: "qtdParcelas", label: "Quantidade de parcelas", mask: "integer", required: true },
      { key: "vencimentoDia", label: "Vencimento (todo dia)", mask: "day", required: true },
    ],
    coords: {
      ...contratanteB,
      valorTotal: { x: 135, y: 234 },
      valorEntrada: { x: 323, y: 234 },
      dataEntrada: { x: 518, y: 234, size: 7 },
      valorParcelas: { x: 159, y: 254 },
      qtdParcelas: { x: 351, y: 254 },
      vencimentoDia: { x: 474, y: 254 },
      assinaturaDia: { x: 246, y: 725 },
      assinaturaMes: { x: 282, y: 725 },
      assinaturaAno: { x: 371, y: 725 },
    },
  },
  {
    id: "recupere",
    name: "Recupere Aqui",
    subtitle: "Créditos",
    initial: "C",
    accent: "brand",
    pdfUrl: assetRecupere.url,
    page: 1,
    financeFields: [
      { key: "contadorNome", label: "Nome do contador", required: true },
      { key: "contadorTelefone", label: "Telefone do contador", mask: "phone", required: true },
      { key: "contadorEmail", label: "E-mail do contador", mask: "email", required: true },
      { key: "valorAdesao", label: "Valor da adesão", mask: "currency", required: true },
      { key: "dataPagamento", label: "Data de pagamento", mask: "date", required: true },
      { key: "percentualExito", label: "% sobre o benefício (êxito)", mask: "percent", required: true },
      { key: "dataExito", label: "Data de pagamento do êxito", mask: "date", required: true },
      { key: "valorContrato", label: "Valor do contrato", mask: "currency", required: true },
      {
        key: "formaPagamento",
        label: "Forma de pagamento",
        required: true,
        options: ["Pix", "Débito", "Crédito", "Boleto"],
        span: 2,
      },
      { key: "dataVencimento", label: "Data de vencimento", mask: "date", required: true },
    ],
    coords: {
      ...contratanteA,
      contadorNome: { x: 46, y: 143 },
      contadorTelefone: { x: 56, y: 157 },
      contadorEmail: { x: 241, y: 158 },
      valorAdesao: { x: 190, y: 246 },
      dataPagamento: { x: 435, y: 246 },
      percentualExito: { x: 250, y: 275 },
      dataExito: { x: 417, y: 275 },
      valorContrato: { x: 330, y: 327 },
      dataVencimento: { x: 414, y: 352 },
      assinaturaDia: { x: 411, y: 700 },
      assinaturaMes: { x: 440, y: 700 },
      assinaturaAno: { x: 513, y: 700 },
    },
    optionCoords: {
      formaPagamento: {
        Pix: { x: 79, y: 356 },
        Débito: { x: 124, y: 356 },
        Crédito: { x: 181, y: 356 },
        Boleto: { x: 242, y: 356 },
      },
    },
  },
  {
    id: "empresarial",
    name: "Renegocie Empresarial",
    subtitle: "Adesão",
    initial: "E",
    accent: "pop",
    pdfUrl: assetEmpresarial.url,
    page: 1,
    financeFields: [
      { key: "valorAdesao", label: "Valor total da adesão", mask: "currency", required: true },
      { key: "diaPagamento", label: "Dia de pagamento", mask: "day", required: true },
    ],
    coords: {
      ...contratanteB,
      valorAdesao: { x: 176, y: 253 },
      diaPagamento: { x: 403, y: 253 },
      assinaturaDia: { x: 246, y: 717 },
      assinaturaMes: { x: 282, y: 717 },
      assinaturaAno: { x: 371, y: 717 },
    },
  },
];

export const getModel = (id: string): ModelDef => MODELS.find((m) => m.id === id) ?? MODELS[0]!;
