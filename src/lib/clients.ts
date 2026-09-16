import { useMemo } from "react";
import { useCloudRecords } from "./cloud";

export type Client = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  /** Nome do responsável legal (vem do CNPJ quando disponível, mas pode ser completado/editado). */
  responsavel: string;
  /** CPF do responsável legal — a consulta pública de CNPJ não traz isso, é sempre preenchido manualmente. */
  cpfResponsavel: string;
  /** Rua e número (logradouro). Bairro/Município/UF/CEP ficam em campos próprios. */
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  /** Anotações livres da equipe sobre o cliente/atendimento. */
  observacoes: string;
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
        responsavel: r.dados?.responsavel ?? "",
        cpfResponsavel: r.dados?.cpfResponsavel ?? "",
        endereco: r.dados?.endereco ?? "",
        bairro: r.dados?.bairro ?? "",
        municipio: r.dados?.municipio ?? "",
        uf: r.dados?.uf ?? "",
        cep: r.dados?.cep ?? "",
        telefone: r.dados?.telefone ?? "",
        email: r.dados?.email ?? "",
        observacoes: r.dados?.observacoes ?? "",
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
