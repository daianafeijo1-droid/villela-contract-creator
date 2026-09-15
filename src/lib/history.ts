import { useMemo } from "react";
import type { FormValues } from "./fill-contract";
import { useCloudRecords } from "./cloud";

export type HistoryItem = {
  id: string;
  modelId: string;
  contratante: string;
  createdAt: string;
  values: FormValues;
};

type Dados = Omit<HistoryItem, "id" | "createdAt">;

export function useHistory() {
  const { rows, carregando, salvar, remover } = useCloudRecords<Dados>("contrato");

  const history = useMemo<HistoryItem[]>(
    () =>
      rows.map((r) => ({
        id: r.chave,
        createdAt: r.created_at,
        modelId: r.dados?.modelId ?? "",
        contratante: r.dados?.contratante ?? "",
        values: r.dados?.values ?? {},
      })),
    [rows],
  );

  async function registrar(item: { modelId: string; contratante: string; values: FormValues }) {
    await salvar(crypto.randomUUID(), {
      modelId: item.modelId,
      contratante: item.contratante,
      values: { ...item.values },
    });
  }

  return { history, carregando, registrar, remover };
}
