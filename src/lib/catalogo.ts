import { z } from "zod";

export const CATEGORIAS_RECEITAS = [
  "Bolos, tortas doces e cupcakes",
  "Doces, sobremesas e doces de festa",
  "Biscoitos e bolachas",
  "Pães, massas e panificação",
  "Salgados, petiscos e lanches",
  "Carnes, aves e peixes",
  "Arroz, feijão e acompanhamentos",
  "Molhos, temperos e conservas",
  "Bebidas",
  "Outras receitas",
] as const;

export type CategoriaReceita = (typeof CATEGORIAS_RECEITAS)[number];

const imagemSchema = z.preprocess(
  (valor) => (valor === "" ? null : valor),
  z
    .string()
    .trim()
    .max(2048)
    .refine((valor) => {
      if (valor.startsWith("/")) return !valor.startsWith("//");
      try {
        const url = new URL(valor);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }, "A imagem precisa ser um caminho local ou uma URL HTTP(S).")
    .nullable(),
);

export const ReceitaCatalogoSchema = z.object({
  id: z.string().trim().min(1).max(200),
  nome: z.string().trim().min(1).max(300),
  categoria: z.enum(CATEGORIAS_RECEITAS),
  imagem: imagemSchema,
  texto: z.string().trim().min(1).max(100_000),
  aliases: z.array(z.string().trim().min(1).max(200)).optional(),
  nomesAlternativos: z.array(z.string().trim().min(1).max(300)).optional(),
  fonte: z
    .object({
      titulo: z.string().trim().min(1).max(300),
      url: z
        .string()
        .url()
        .max(2048)
        .refine((url) => url.startsWith("https://"), "A fonte precisa usar HTTPS."),
    })
    .optional(),
  imagemIlustrativa: z.boolean().optional(),
});

export type ReceitaCatalogo = z.infer<typeof ReceitaCatalogoSchema>;

export const CatalogoReceitasSchema = z
  .array(ReceitaCatalogoSchema)
  .superRefine((receitas, contexto) => {
    const ids = new Set(receitas.map((receita) => receita.id));
    const contagemIds = new Map<string, number>();
    const aliases = new Set<string>();
    for (const receita of receitas) {
      contagemIds.set(receita.id, (contagemIds.get(receita.id) ?? 0) + 1);
    }
    for (const [indice, receita] of receitas.entries()) {
      if ((contagemIds.get(receita.id) ?? 0) > 1) {
        contexto.addIssue({
          code: "custom",
          path: [indice, "id"],
          message: "Identificador duplicado.",
        });
      }
      for (const [aliasIndice, alias] of (receita.aliases ?? []).entries()) {
        if (ids.has(alias) || aliases.has(alias)) {
          contexto.addIssue({
            code: "custom",
            path: [indice, "aliases", aliasIndice],
            message: "Alias de receita ambíguo.",
          });
        }
        aliases.add(alias);
      }
    }
  });

export function validarCatalogo(valor: unknown): ReceitaCatalogo[] {
  return CatalogoReceitasSchema.parse(valor);
}

export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filtrarReceitas(
  receitas: ReceitaCatalogo[],
  busca: string,
  categoria: string,
): ReceitaCatalogo[] {
  const termos = normalizar(busca.trim()).split(/\s+/).filter(Boolean);
  return receitas.filter((receita) => {
    if (categoria !== "Todas" && receita.categoria !== categoria) return false;
    if (!termos.length) return true;
    const conteudo = normalizar(
      `${receita.nome} ${receita.nomesAlternativos?.join(" ") ?? ""} ${receita.texto}`,
    );
    return termos.every((termo) => conteudo.includes(termo));
  });
}

export function encontrarReceitaPorId(
  receitas: ReceitaCatalogo[],
  id: string,
): ReceitaCatalogo | undefined {
  return receitas.find((receita) => receita.id === id || receita.aliases?.includes(id));
}

export function gruposDeTitulosDuplicados(receitas: ReceitaCatalogo[]): ReceitaCatalogo[][] {
  const grupos = new Map<string, ReceitaCatalogo[]>();
  for (const receita of receitas) {
    const nome = normalizar(receita.nome).trim().replace(/\s+/g, " ");
    const grupo = grupos.get(nome) ?? [];
    grupo.push(receita);
    grupos.set(nome, grupo);
  }
  return [...grupos.values()].filter((grupo) => grupo.length > 1);
}
