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
 * `habilitado` controla se o hook pode consultar o Supabase.
 * Isso evita consultas ao histórico antes da autenticação do usuário.
 */
export function useCloudRecords<T>(
  tipo: Tipo,
  habilitado = true,
) {
  const [rows, setRows] = useState<Registro<T>[]>([]);
  const [carregando, setCarregando] = useState(habilitado);
  const ativo = useRef(true);

  const carregar = useCallback(async () => {
    // Não consulta o Supabase quando o recurso está desabilitado.
    if (!habilitado) {
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
  }, [tipo, habilitado]);

  useEffect(() => {
    ativo.current = true;

    // Se não estiver habilitado, não cria consulta nem realtime.
    if (!habilitado) {
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
  }, [tipo, habilitado, carregar]);

  const salvar = useCallback(
    async (chave: string, dados: T) => {
      if (!habilitado) {
        throw new Error(
          "Não é possível salvar registros enquanto o recurso está desabilitado.",
        );
      }

      const { error } = await supabase
        .from("registros")
        .upsert(
          {
            tipo,
            chave,
            dados: dados as never,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "tipo,chave",
          },
        );

      if (error) {
        console.error(
          `[CloudRecords] Erro ao salvar registro (${tipo}):`,
          error,
        );
        throw new Error(error.message);
      }

      await carregar();
    },
    [tipo, habilitado, carregar],
  );

  const remover = useCallback(
    async (chave: string) => {
      if (!habilitado) {
        throw new Error(
          "Não é possível remover registros enquanto o recurso está desabilitado.",
        );
      }

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

      await carregar();
    },
    [tipo, habilitado, carregar],
  );

  return {
    rows,
    carregando,
    salvar,
    remover,
  };
}
