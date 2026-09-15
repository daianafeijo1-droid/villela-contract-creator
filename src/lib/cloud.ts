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
 */
export function useCloudRecords<T>(tipo: Tipo) {
  const [rows, setRows] = useState<Registro<T>[]>([]);
  const [carregando, setCarregando] = useState(true);
  const ativo = useRef(true);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .eq("tipo", tipo)
      .order("created_at", { ascending: false });
    if (!ativo.current) return;
    if (!error && data) setRows(data as unknown as Registro<T>[]);
    setCarregando(false);
  }, [tipo]);

  useEffect(() => {
    ativo.current = true;
    void carregar();
    const channel = supabase
      .channel(`registros-${tipo}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registros", filter: `tipo=eq.${tipo}` },
        () => {
          void carregar();
        },
      )
      .subscribe();
    return () => {
      ativo.current = false;
      void supabase.removeChannel(channel);
    };
  }, [tipo, carregar]);

  const salvar = useCallback(
    async (chave: string, dados: T) => {
      const { error } = await supabase
        .from("registros")
        .upsert(
          { tipo, chave, dados: dados as never, updated_at: new Date().toISOString() },
          { onConflict: "tipo,chave" },
        );
      if (error) throw new Error(error.message);
      await carregar();
    },
    [tipo, carregar],
  );

  const remover = useCallback(
    async (chave: string) => {
      const { error } = await supabase
        .from("registros")
        .delete()
        .eq("tipo", tipo)
        .eq("chave", chave);
      if (error) throw new Error(error.message);
      await carregar();
    },
    [tipo, carregar],
  );

  return { rows, carregando, salvar, remover };
}
