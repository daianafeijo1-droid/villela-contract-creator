import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Tipo = "contrato" | "cliente";

export type Registro<T> = {
  id: string;
  tipo: Tipo;
  chave: string;
  dados: T;
  created_at: string;
  updated_at: string;
};

/**
 * Lista compartilhada na nuvem, com atualização em tempo real.
 * Histórico de contratos e clientes usam a mesma tabela (campo `tipo`),
 * e a coluna `chave` garante que não haja registros duplicados.
 *
 * `podeLer` controla apenas a LEITURA (consulta + tempo real), porque as
 * políticas de segurança só liberam consulta para quem está logado.
 * A gravação é sempre tentada: visitantes sem login podem registrar o
 * contrato que acabaram de gerar.
 *
 * `modoSalvar` = "insert" para registros com chave nova (histórico) e
 * "upsert" quando a mesma chave é atualizada (clientes).
 */
export function useCloudRecords<T>(
  tipo: Tipo,
  podeLer = true,
  modoSalvar: "insert" | "upsert" = "upsert",
) {
  const [rows, setRows] = useState<Registro<T>[]>([]);
  const [carregando, setCarregando] = useState(podeLer);
  const ativo = useRef(true);

  const carregar = useCallback(async () => {
    // Sem permissão de leitura (visitante sem login), não consulta.
    if (!podeLer) {
      setRows([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .eq("tipo", tipo)
      .order("created_at", { ascending: false });

    if (!ativo.current) return;

    if (error) {
      console.error(
        `[CloudRecords] Erro ao carregar registros (${tipo}):`,
        error,
      );
      setRows([]);
    } else if (data) {
      setRows(data as unknown as Registro<T>[]);
    }

    setCarregando(false);
  }, [tipo, podeLer]);

  useEffect(() => {
    ativo.current = true;

    if (!podeLer) {
      setRows([]);
      setCarregando(false);

      return () => {
        ativo.current = false;
      };
    }

    void carregar();

    const channel = supabase
      .channel(`registros-${tipo}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registros",
          filter: `tipo=eq.${tipo}`,
        },
        () => {
          void carregar();
        },
      )
      .subscribe();

    return () => {
      ativo.current = false;
      void supabase.removeChannel(channel);
    };
  }, [tipo, podeLer, carregar]);

  const salvar = useCallback(
    async (chave: string, dados: T) => {
      const registro = {
        tipo,
        chave,
        dados: dados as never,
        updated_at: new Date().toISOString(),
      };

      const { error } =
        modoSalvar === "insert"
          ? await supabase.from("registros").insert(registro)
          : await supabase
              .from("registros")
              .upsert(registro, { onConflict: "tipo,chave" });

      if (error) {
        console.error(
          `[CloudRecords] Erro ao salvar registro (${tipo}):`,
          error,
        );
        throw new Error(error.message);
      }

      if (podeLer) await carregar();
    },
    [tipo, modoSalvar, podeLer, carregar],
  );

  const remover = useCallback(
    async (chave: string) => {
      const { error } = await supabase
        .from("registros")
        .delete()
        .eq("tipo", tipo)
        .eq("chave", chave);

      if (error) {
        console.error(
          `[CloudRecords] Erro ao remover registro (${tipo}):`,
          error,
        );
        throw new Error(error.message);
      }

      if (podeLer) await carregar();
    },
    [tipo, podeLer, carregar],
  );

  return {
    rows,
    carregando,
    salvar,
    remover,
  };
}
