import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizar } from "@/lib/receitas";
import { useSessao } from "@/hooks/useSessao";
import type { Tables } from "@/integrations/supabase/types";

export type ItemListaCompras = Tables<"lista_compras_itens">;
export type NovoItemLista = {
  receita_id: string | null;
  receita_nome: string;
  ingrediente: string;
  ja_tem?: boolean;
};

export function useFavoritos() {
  const { idUsuario, carregando: carregandoSessao } = useSessao();
  const cache = useQueryClient();
  const queryKey = ["favoritos", idUsuario ?? "anonimo"];
  const consulta = useQuery({
    queryKey,
    enabled: Boolean(idUsuario),
    queryFn: async () => {
      if (!idUsuario) return [] as string[];
      const { data, error } = await supabase
        .from("favoritos_receitas")
        .select("receita_id")
        .eq("user_id", idUsuario);
      if (error) throw error;
      return data.map((item) => item.receita_id);
    },
  });
  const alternar = useMutation({
    mutationFn: async (receitaId: string) => {
      if (!idUsuario) throw new Error("Entre na sua conta para salvar favoritos.");
      const atual = consulta.data ?? [];
      const jaSalvo = atual.includes(receitaId);
      const resposta = jaSalvo
        ? await supabase
            .from("favoritos_receitas")
            .delete()
            .eq("user_id", idUsuario)
            .eq("receita_id", receitaId)
        : await supabase
            .from("favoritos_receitas")
            .insert({ user_id: idUsuario, receita_id: receitaId });
      if (resposta.error) throw resposta.error;
      return receitaId;
    },
    onMutate: async (receitaId) => {
      await cache.cancelQueries({ queryKey });
      const anterior = cache.getQueryData<string[]>(queryKey) ?? [];
      cache.setQueryData<string[]>(
        queryKey,
        anterior.includes(receitaId)
          ? anterior.filter((id) => id !== receitaId)
          : [...anterior, receitaId],
      );
      return anterior;
    },
    onError: (_erro, _receitaId, anterior) => {
      if (anterior) cache.setQueryData(queryKey, anterior);
    },
    onSettled: () => cache.invalidateQueries({ queryKey }),
  });
  return {
    idUsuario,
    carregandoSessao,
    ids: consulta.data ?? [],
    carregando: consulta.isLoading,
    erro: consulta.error ?? alternar.error,
    alternar: alternar.mutate,
    removendo: alternar.isPending,
  };
}

export function useListaCompras() {
  const { idUsuario, carregando: carregandoSessao } = useSessao();
  const cache = useQueryClient();
  const queryKey = ["lista-compras", idUsuario ?? "anonimo"];
  const consulta = useQuery({
    queryKey,
    enabled: Boolean(idUsuario),
    queryFn: async (): Promise<ItemListaCompras[]> => {
      if (!idUsuario) return [];
      const { data, error } = await supabase
        .from("lista_compras_itens")
        .select("id, user_id, receita_id, receita_nome, ingrediente, ja_tem, criado_em")
        .eq("user_id", idUsuario)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const adicionar = useMutation({
    mutationFn: async (itens: NovoItemLista[]) => {
      if (!idUsuario) throw new Error("Entre na sua conta para usar a lista de compras.");
      if (!itens.length) return 0;
      const atuais = cache.getQueryData<ItemListaCompras[]>(queryKey) ?? consulta.data ?? [];
      const chavesAtuais = new Set(
        atuais.map((item) => `${item.receita_id ?? ""}|${normalizar(item.ingrediente)}`),
      );
      const novos = itens.filter((item) => {
        const chave = `${item.receita_id ?? ""}|${normalizar(item.ingrediente)}`;
        if (chavesAtuais.has(chave)) return false;
        chavesAtuais.add(chave);
        return true;
      });
      if (!novos.length) return 0;
      const { error } = await supabase.from("lista_compras_itens").insert(
        novos.map((item) => ({
          user_id: idUsuario,
          receita_id: item.receita_id,
          receita_nome: item.receita_nome,
          ingrediente: item.ingrediente,
          ja_tem: item.ja_tem ?? false,
        })),
      );
      if (error) throw error;
      return novos.length;
    },
    onSettled: () => cache.invalidateQueries({ queryKey }),
  });
  const marcar = useMutation({
    mutationFn: async ({ id, ja_tem }: { id: string; ja_tem: boolean }) => {
      if (!idUsuario) throw new Error("Entre na sua conta para usar a lista de compras.");
      const { error } = await supabase
        .from("lista_compras_itens")
        .update({ ja_tem })
        .eq("id", id)
        .eq("user_id", idUsuario);
      if (error) throw error;
    },
    onSettled: () => cache.invalidateQueries({ queryKey }),
  });
  const remover = useMutation({
    mutationFn: async (id: string) => {
      if (!idUsuario) throw new Error("Entre na sua conta para usar a lista de compras.");
      const { error } = await supabase
        .from("lista_compras_itens")
        .delete()
        .eq("id", id)
        .eq("user_id", idUsuario);
      if (error) throw error;
    },
    onSettled: () => cache.invalidateQueries({ queryKey }),
  });
  return {
    idUsuario,
    carregandoSessao,
    itens: consulta.data ?? [],
    carregando: consulta.isLoading,
    erro: consulta.error ?? adicionar.error ?? marcar.error ?? remover.error,
    adicionar: adicionar.mutateAsync,
    marcando: marcar.mutate,
    removendo: remover.mutate,
    salvando: adicionar.isPending || marcar.isPending || remover.isPending,
  };
}
