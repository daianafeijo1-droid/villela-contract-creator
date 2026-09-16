import { useMemo } from "react";
import type { FormValues } from "./fill-contract";
import { useCloudRecords } from "./cloud";

/** Quem gerou o contrato: a equipe logada ou um visitante sem login. */
export type OrigemContrato = "equipe" | "visitante";

export type HistoryItem = {
  id: string;
  modelId: string;
  contratante: string;
  createdAt: string;
  values: FormValues;
  origem: OrigemContrato;
};

type Dados = Omit<HistoryItem, "id" | "createdAt">;

export function useHistory(habilitado = true) {
  // A leitura do histórico exige login; o registro do contrato gerado
  // funciona também para quem não está logado (sempre chave nova).
  const { rows, carregando, salvar, remover } = useCloudRecords<Dados>(
    "contrato",
    habilitado,
    "insert",
  );

  const history = useMemo<HistoryItem[]>(
    () =>
      rows.map((r) => ({
        id: r.chave,
        createdAt: r.created_at,
        modelId: r.dados?.modelId ?? "",
        contratante: r.dados?.contratante ?? "",
        values: r.dados?.values ?? {},
        // Registros antigos (antes de existir essa distinção) não têm
        // origem gravada: tratamos como "equipe" para não sumirem da
        // aba principal do histórico.
        origem: r.dados?.origem ?? "equipe",
      })),
    [rows],
  );

  async function registrar(item: {
    modelId: string;
    contratante: string;
    values: FormValues;
    origem: OrigemContrato;
  }) {
    await salvar(crypto.randomUUID(), {
      modelId: item.modelId,
      contratante: item.contratante,
      values: { ...item.values },
      origem: item.origem,
    });
  }

  return {
    history,
    carregando,
    registrar,
    remover,
  };
}
