import assetRecupere from "@/assets/modelo-1782849141734.pdf.asset.json";
import assetEmpresarial from "@/assets/modelo-1784309431871.pdf.asset.json";
import assetBancarioAdesao from "@/assets/modelo-1784635752402.pdf.asset.json";
import assetPrf from "@/assets/modelo-1786630521523.pdf.asset.json";
import assetParcelado from "@/assets/modelo-1788263253659.pdf.asset.json";
import assetNovo1 from "@/assets/novo-modelo-1.pdf.asset.json";
import assetNovo2 from "@/assets/novo-modelo-2.pdf.asset.json";
import assetNovo3 from "@/assets/novo-modelo-3.pdf.asset.json";
import assetNovo4 from "@/assets/novo-modelo-4.pdf.asset.json";
import assetNovo5 from "@/assets/novo-modelo-5.pdf.asset.json";
import assetNovo6 from "@/assets/novo-modelo-6.pdf.asset.json";
import assetNovo7 from "@/assets/novo-modelo-7.pdf.asset.json";
import assetNovo8 from "@/assets/novo-modelo-8.pdf.asset.json";

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
  telefone: { x: 68, y: 106, ddd: 57 },
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
  telefone: { x: 72, y: 101, ddd: 59 },
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
        Estadual: { x: 313.5, y: 216, label: { x: 321, w: 29.5 } },
        Federal: { x: 361, y: 216, label: { x: 368, w: 25.5 } },
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
      contadorTelefone: { x: 67.5, y: 157, ddd: 56.5 },
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
        Pix: { x: 80.5, y: 356 },
        Débito: { x: 126, y: 356 },
        Crédito: { x: 182.5, y: 356 },
        Boleto: { x: 243, y: 356 },
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
  {
    id: "avisa",
    name: "AVISA.IA",
    subtitle: "Vigia Processual",
    initial: "A",
    accent: "coral",
    pdfUrl: assetNovo1.url,
    page: 1,
    financeFields: [
      { key: "valorAdesao", label: "Valor da adesão", mask: "currency", required: true },
      { key: "valorMensalidade", label: "Valor da mensalidade", mask: "currency", required: true },
      { key: "dataPrimeiraMensalidade", label: "Data da 1ª mensalidade", mask: "date", required: true },
      { key: "diaPagamento", label: "Dia de pagamento", mask: "day", required: true },
      { key: "qtdProcessos", label: "Quantidade de processos", mask: "integer", required: true },
    ],
    coords: {
      "razaoSocial": { x: 91.9, y: 55.9 },
      "cpfCnpj": { x: 448.9, y: 56.1 },
      "responsavel": { x: 110.6, y: 72.2 },
      "cpfResponsavel": { x: 426.9, y: 72.5 },
      "endereco": { x: 59.7, y: 88.2 },
      "cep": { x: 427.1, y: 89.6 },
      "bairro": { x: 50.0, y: 105.5 },
      "municipio": { x: 251.0, y: 106.5 },
      "uf": { x: 422.8, y: 106.4 },
      "email": { x: 243.1, y: 123.8 },
      "telefone": { x: 69.7, y: 123.0, ddd: 58.5 },
      "valorAdesao": { x: 121.3, y: 218.0 },
      "valorMensalidade": { x: 312.8, y: 218.0 },
      "diaPagamento": { x: 204.3, y: 244.2 },
      "qtdProcessos": { x: 440.1, y: 244.2 },
      "dataPrimeiraMensalidade#d": { x: 465.5, y: 218.1, size: 7 },
      "dataPrimeiraMensalidade#m": { x: 501.3, y: 218.0, size: 7 },
      "dataPrimeiraMensalidade#y": { x: 527.0, y: 218.0, size: 7 },
      "assinaturaDia": { x: 266, y: 729 },
      "assinaturaMes": { x: 297, y: 729 },
      "assinaturaAno": { x: 387, y: 729 },
    },
  },
  {
    id: "rating",
    name: "RATING",
    subtitle: "Consultoria de Crédito",
    initial: "R",
    accent: "mint",
    pdfUrl: assetNovo2.url,
    page: 1,
    financeFields: [
      { key: "valorDiagnostico", label: "Valor do diagnóstico", mask: "currency", required: true },
      { key: "dataPagamento", label: "Data de pagamento", mask: "date", required: true },
    ],
    coords: {
      "razaoSocial": { x: 107.3, y: 64.6 },
      "cpfCnpj": { x: 436.6, y: 64.6 },
      "responsavel": { x: 127.6, y: 81.0 },
      "cpfResponsavel": { x: 412.7, y: 81.0 },
      "endereco": { x: 72.3, y: 98.1 },
      "cep": { x: 412.9, y: 98.1 },
      "bairro": { x: 61.8, y: 115.0 },
      "municipio": { x: 248.5, y: 115.0 },
      "uf": { x: 408.2, y: 115.0 },
      "email": { x: 255.0, y: 133.1 },
      "telefone": { x: 83.4, y: 132.3, ddd: 71.4 },
      "valorDiagnostico": { x: 178.6, y: 224.8 },
      "dataPagamento": { x: 444.6, y: 224.6 },
      "assinaturaDia": { x: 228, y: 661 },
      "assinaturaMes": { x: 269, y: 661 },
      "assinaturaAno": { x: 404, y: 661 },
    },
  },
  {
    id: "fgts360",
    name: "FGTS 360",
    subtitle: "Análise e Parecer",
    initial: "F",
    accent: "violet",
    pdfUrl: assetNovo3.url,
    page: 1,
    financeFields: [
      { key: "taxaAdesao", label: "Taxa de adesão", mask: "currency", required: true },
      { key: "dataVencimento", label: "Data de vencimento", mask: "date", required: true },
    ],
    coords: {
      "razaoSocial": { x: 91.9, y: 46.9 },
      "cpfCnpj": { x: 448.2, y: 47.2 },
      "responsavel": { x: 110.6, y: 61.2 },
      "cpfResponsavel": { x: 427.2, y: 61.5 },
      "endereco": { x: 59.7, y: 75.2 },
      "cep": { x: 427.4, y: 76.6 },
      "bairro": { x: 50.0, y: 89.6 },
      "municipio": { x: 251.3, y: 90.5 },
      "uf": { x: 423.1, y: 90.5 },
      "email": { x: 243.2, y: 105.3 },
      "telefone": { x: 68.8, y: 104.6, ddd: 57.6 },
      "taxaAdesao": { x: 206.4, y: 147.2 },
      "dataVencimento": { x: 382.9, y: 148.5 },
      "assinaturaDia": { x: 237, y: 665 },
      "assinaturaMes": { x: 286, y: 665 },
      "assinaturaAno": { x: 385, y: 665 },
    },
  },
  {
    id: "agro",
    name: "Renegocie Agronegócio",
    subtitle: "Recuperação de Endividamento",
    initial: "G",
    accent: "brand",
    pdfUrl: assetNovo4.url,
    page: 1,
    financeFields: [
      { key: "valorAdesao", label: "Valor da adesão (total)", mask: "currency", required: true },
      { key: "valorEntrada", label: "Valor de entrada", mask: "currency", required: true },
      { key: "dataEntrada", label: "Data de entrada", mask: "date", required: true },
      { key: "valorParcelas", label: "Valor das parcelas", mask: "currency", required: true },
      { key: "qtdParcelas", label: "Número de parcelas", mask: "integer", required: true },
      { key: "vencimentoDia", label: "Dia de vencimento", mask: "day", required: true },
    ],
    coords: {
      "razaoSocial": { x: 92.0, y: 48.0 },
      "cpfCnpj": { x: 448.2, y: 48.3 },
      "responsavel": { x: 110.7, y: 62.6 },
      "cpfResponsavel": { x: 427.1, y: 62.9 },
      "endereco": { x: 59.8, y: 76.8 },
      "cep": { x: 427.4, y: 78.2 },
      "bairro": { x: 50.1, y: 91.4 },
      "municipio": { x: 251.5, y: 92.4 },
      "uf": { x: 423.1, y: 92.3 },
      "email": { x: 243.4, y: 106.9 },
      "telefone": { x: 69.7, y: 106.2, ddd: 58.8 },
      "valorAdesao": { x: 254.9, y: 226.0 },
      "valorEntrada": { x: 238.2, y: 245.3 },
      "dataEntrada": { x: 397.9, y: 244.8 },
      "valorParcelas": { x: 151.5, y: 278.3 },
      "qtdParcelas": { x: 310.2, y: 278.3 },
      "vencimentoDia": { x: 497.0, y: 277.8 },
      "assinaturaDia": { x: 246, y: 720 },
      "assinaturaMes": { x: 282, y: 720 },
      "assinaturaAno": { x: 371, y: 720 },
    },
  },
  {
    id: "contabilize",
    name: "Contabilize Aqui",
    subtitle: "Plano Contábil e Tributário",
    initial: "C",
    accent: "pop",
    pdfUrl: assetNovo5.url,
    page: 1,
    financeFields: [
      { key: "valorEntrada", label: "Valor de entrada", mask: "currency", required: true },
      { key: "valorMensalidade", label: "Valor da mensalidade", mask: "currency", required: true },
      { key: "dataPrimeiraMensalidade", label: "Data da 1ª mensalidade", mask: "date", required: true },
      { key: "diaPagamento", label: "Dia de pagamento recorrente", required: true, options: ["5", "10", "15"], span: 2 },
      { key: "numFuncionarios", label: "Número de funcionários", mask: "integer", required: true },
      { key: "regimeTributacao", label: "Regime de tributação", required: true, options: ["MEI", "Simples Nacional", "Lucro Presumido"], span: 2 },
    ],
    coords: {
      "razaoSocial": { x: 91.9, y: 53.8 },
      "cpfCnpj": { x: 448.2, y: 54.1 },
      "responsavel": { x: 110.6, y: 68.0 },
      "cpfResponsavel": { x: 427.2, y: 68.2 },
      "endereco": { x: 59.7, y: 81.7 },
      "cep": { x: 427.4, y: 83.1 },
      "bairro": { x: 50.0, y: 95.9 },
      "municipio": { x: 251.3, y: 96.9 },
      "uf": { x: 423.1, y: 96.8 },
      "email": { x: 243.2, y: 111.0 },
      "telefone": { x: 68.8, y: 110.2, ddd: 57.6 },
      "numFuncionarios": { x: 104.7, y: 125.0 },
      "valorEntrada": { x: 104.2, y: 190.0 },
      "valorMensalidade": { x: 307.0, y: 190.0 },
      "dataPrimeiraMensalidade": { x: 531.9, y: 190.0 },
      "diaPagamento": { x: 333.5, y: 206.6 },
      "assinaturaDia": { x: 412, y: 740 },
      "assinaturaMes": { x: 441, y: 740 },
      "assinaturaAno": { x: 511, y: 740 },
    },
    optionCoords: {
      regimeTributacao: {
        "Lucro Presumido": { x: 280, y: 124, label: { x: 288, w: 50 } },
        "Simples Nacional": { x: 356, y: 124, label: { x: 365, w: 49 } },
        "MEI": { x: 433, y: 124, label: { x: 441, w: 12 } },
      },
    },
  },
  {
    id: "gerencie",
    name: "Gerencie Aqui",
    subtitle: "Controle Financeiro",
    initial: "G",
    accent: "coral",
    pdfUrl: assetNovo6.url,
    page: 1,
    financeFields: [
      { key: "valorSetup", label: "Valor setup (entrada)", mask: "currency", required: true },
      { key: "valorMensalidade", label: "Valor da mensalidade", mask: "currency", required: true },
      { key: "dataPrimeiraMensalidade", label: "Data da 1ª mensalidade", mask: "date", required: true },
      { key: "diaPagamento", label: "Dia de pagamento recorrente", mask: "day", required: true },
    ],
    coords: {
      "razaoSocial": { x: 107.3, y: 56.3 },
      "cpfCnpj": { x: 436.6, y: 56.3 },
      "responsavel": { x: 127.6, y: 72.7 },
      "cpfResponsavel": { x: 412.7, y: 72.7 },
      "endereco": { x: 72.3, y: 89.8 },
      "cep": { x: 412.9, y: 89.8 },
      "bairro": { x: 61.8, y: 106.7 },
      "municipio": { x: 248.5, y: 106.7 },
      "uf": { x: 408.2, y: 106.7 },
      "email": { x: 255.0, y: 124.7 },
      "telefone": { x: 83.4, y: 124.0, ddd: 71.4 },
      "valorSetup": { x: 243.7, y: 240.4 },
      "valorMensalidade": { x: 382.6, y: 240.4 },
      "dataPrimeiraMensalidade": { x: 237.6, y: 258.4 },
      "diaPagamento": { x: 405.4, y: 258.4 },
      "assinaturaDia": { x: 230, y: 744 },
      "assinaturaMes": { x: 269, y: 744 },
      "assinaturaAno": { x: 404, y: 744 },
    },
  },
  {
    id: "reforma",
    name: "Compliance Tributário",
    subtitle: "Reforma Tributária",
    initial: "T",
    accent: "mint",
    pdfUrl: assetNovo7.url,
    page: 1,
    financeFields: [
      { key: "valorTotal", label: "Valor total do contrato", mask: "currency", required: true },
      { key: "valorParcelas", label: "Valor das parcelas", mask: "currency", required: true },
      { key: "qtdParcelas", label: "Quantidade de parcelas", mask: "integer", required: true },
      { key: "vencimentoDia", label: "Dia de vencimento", mask: "day", required: true },
    ],
    coords: {
      "razaoSocial": { x: 92.2, y: 57.9 },
      "cpfCnpj": { x: 449.2, y: 58.2 },
      "responsavel": { x: 110.9, y: 72.2 },
      "cpfResponsavel": { x: 427.2, y: 72.5 },
      "endereco": { x: 60.0, y: 86.2 },
      "cep": { x: 427.4, y: 87.6 },
      "bairro": { x: 50.3, y: 100.6 },
      "municipio": { x: 251.3, y: 101.5 },
      "uf": { x: 423.1, y: 101.5 },
      "email": { x: 243.4, y: 116.3 },
      "telefone": { x: 70.0, y: 115.6, ddd: 58.9 },
      "valorTotal": { x: 138.4, y: 241.9 },
      "valorParcelas": { x: 117.2, y: 270.8 },
      "qtdParcelas": { x: 388.3, y: 271.0 },
      "vencimentoDia": { x: 518.4, y: 271.0 },
      "assinaturaDia": { x: 251, y: 685 },
      "assinaturaMes": { x: 289, y: 685 },
      "assinaturaAno": { x: 382, y: 685 },
    },
  },
  {
    id: "audite",
    name: "Audite Aqui",
    subtitle: "Análise Fiscal",
    initial: "D",
    accent: "violet",
    pdfUrl: assetNovo8.url,
    page: 1,
    financeFields: [
      { key: "valorEntrada", label: "Valor da entrada", mask: "currency", required: true },
      { key: "qtdParcelas", label: "Quantidade de parcelas", mask: "integer", required: true },
      { key: "dataPagamento", label: "Data de pagamento", mask: "date", required: true },
      { key: "percentualExito", label: "% sobre o benefício (êxito)", mask: "percent", required: true },
      { key: "contadorNome", label: "Nome do contador", required: true },
      { key: "contadorTelefone", label: "Telefone do contador", mask: "phone", required: true },
      { key: "contadorEmail", label: "E-mail do contador", mask: "email", required: true },
    ],
    coords: {
      "razaoSocial": { x: 91.9, y: 50.0 },
      "cpfCnpj": { x: 448.2, y: 50.2 },
      "responsavel": { x: 110.7, y: 64.6 },
      "cpfResponsavel": { x: 427.2, y: 64.8 },
      "endereco": { x: 59.8, y: 78.8 },
      "cep": { x: 427.4, y: 80.2 },
      "bairro": { x: 50.0, y: 93.4 },
      "municipio": { x: 251.3, y: 94.3 },
      "uf": { x: 423.1, y: 94.3 },
      "email": { x: 243.2, y: 108.9 },
      "telefone": { x: 70.1, y: 108.1, ddd: 58.9 },
      "valorEntrada": { x: 154.4, y: 237.7 },
      "qtdParcelas": { x: 430.2, y: 237.1 },
      "dataPagamento": { x: 144.7, y: 263.5 },
      "percentualExito": { x: 439.1, y: 263.6 },
      "contadorNome": { x: 47.5, y: 138.3 },
      "contadorEmail": { x: 241.4, y: 153.1 },
      "contadorTelefone": { x: 68.3, y: 150.9, ddd: 57.1 },
      "assinaturaDia": { x: 246, y: 716 },
      "assinaturaMes": { x: 282, y: 716 },
      "assinaturaAno": { x: 371, y: 716 },
    },
  },

];

export const getModel = (id: string): ModelDef => MODELS.find((m) => m.id === id) ?? MODELS[0]!;
