import { useMemo } from "react";
import { useCloudRecords } from "./cloud";

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

type Dados = Omit<Client, "id" | "addedAt">;

export function useClients() {
  const { rows, carregando, salvar, remover } = useCloudRecords<Dados>("cliente");

  const clients = useMemo<Client[]>(
    () =>
      rows.map((r) => ({
        id: r.chave,
        addedAt: r.created_at,
        cnpj: r.dados?.cnpj ?? r.chave,
        razaoSocial: r.dados?.razaoSocial ?? "",
        nomeFantasia: r.dados?.nomeFantasia ?? "",
        situacaoCadastral: r.dados?.situacaoCadastral ?? "",
        endereco: r.dados?.endereco ?? "",
        telefone: r.dados?.telefone ?? "",
        email: r.dados?.email ?? "",
        atendido: Boolean(r.dados?.atendido),
        statusChangedAt: r.dados?.statusChangedAt ?? r.updated_at,
      })),
    [rows],
  );

  async function salvarCliente(c: Client) {
    const { id: _id, addedAt: _addedAt, ...dados } = c;
    await salvar(c.cnpj, dados);
  }

  return { clients, carregando, salvarCliente, remover };
}
