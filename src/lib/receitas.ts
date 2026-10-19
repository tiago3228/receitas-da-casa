import { queryOptions } from "@tanstack/react-query";
import { validarCatalogo, type ReceitaCatalogo } from "@/lib/catalogo";

export type Receita = ReceitaCatalogo;
export {
  encontrarReceitaPorId,
  filtrarReceitas,
  gruposDeTitulosDuplicados,
  normalizar,
} from "@/lib/catalogo";

// Fonte local do caderno; valida os dados antes de disponibilizá-los às páginas.
export const receitasQuery = queryOptions({
  queryKey: ["receitas"],
  queryFn: async (): Promise<Receita[]> => {
    const res = await fetch("/receitas.json");
    if (!res.ok) throw new Error("Falha ao carregar receitas");
    const dados: unknown = await res.json();
    try {
      return validarCatalogo(dados);
    } catch {
      throw new Error("O catálogo de receitas contém dados inválidos.");
    }
  },
  staleTime: Infinity,
});

const TITULOS =
  /^(ingredientes|modo de preparo|preparo|massa|recheio|cobertura|calda|dicas?.*|montagem)\s*:?$/i;
export const ehTitulo = (linha: string) =>
  TITULOS.test(linha.trim()) || (linha.length < 40 && linha.trim().endsWith(":"));
