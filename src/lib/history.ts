import type { FormValues } from "./fill-contract";

export type HistoryItem = {
  id: string;
  modelId: string;
  contratante: string;
  createdAt: string;
  values: FormValues;
};

const KEY = "villela-contratos-historico";

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
}
