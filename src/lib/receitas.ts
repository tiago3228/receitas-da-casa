import { queryOptions } from "@tanstack/react-query";

export type Receita = {
  id: string;
  nome: string;
  categoria: string;
  imagem: string | null;
  texto: string;
};

// Fonte local do caderno; trocar por chamada a backend no futuro.
export const receitasQuery = queryOptions({
  queryKey: ["receitas"],
  queryFn: async (): Promise<Receita[]> => {
    const res = await fetch("/receitas.json");
    if (!res.ok) throw new Error("Falha ao carregar receitas");
    return res.json();
  },
  staleTime: Infinity,
});

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TITULOS = /^(ingredientes|modo de preparo|preparo|massa|recheio|cobertura|calda|dicas?.*|montagem)\s*:?$/i;
export const ehTitulo = (linha: string) => TITULOS.test(linha.trim()) || (linha.length < 40 && linha.trim().endsWith(":"));
