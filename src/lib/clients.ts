export type Client = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  endereco: string;
  telefone: string;
  email: string;
  atendido: boolean;
  addedAt: string;
  statusChangedAt: string;
};

const KEY = "villela-clientes-atendimento";

export function loadClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Client[]) : [];
  } catch {
    return [];
  }
}

export function saveClients(items: Client[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}
