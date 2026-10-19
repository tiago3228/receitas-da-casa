import { z } from "zod";
import { CATEGORIAS_RECEITAS } from "@/lib/catalogo";

const CATEGORIAS_USUARIO = [...CATEGORIAS_RECEITAS, "Minhas receitas"] as const;

const CamposReceitaAutoralSchema = z
  .object({
    titulo: z.string().trim().min(1).max(160),
    categoria: z.enum(CATEGORIAS_USUARIO).default("Minhas receitas"),
    ingredientes: z.string().trim().max(12_000).default(""),
    modo_de_preparo: z.string().trim().max(12_000).default(""),
    observacoes: z.string().trim().max(2_000).default(""),
    tempo: z.string().trim().max(60).default(""),
    rendimento: z.string().trim().max(60).default(""),
    texto_original: z.string().trim().max(12_000).default(""),
  })
  .strict();

function temConteudo(receita: { ingredientes: string; modo_de_preparo: string }): boolean {
  return receita.ingredientes.length > 0 || receita.modo_de_preparo.length > 0;
}

export const ReceitaAutoralEntradaSchema = CamposReceitaAutoralSchema.refine(temConteudo, {
  message: "Escreva pelo menos os ingredientes ou o modo de preparo.",
});

export const AtualizarReceitaAutoralEntradaSchema = CamposReceitaAutoralSchema.extend({
  id: z.string().trim().min(1).max(60),
})
  .strict()
  .refine(temConteudo, {
    message: "Escreva pelo menos os ingredientes ou o modo de preparo.",
  });

export const RemoverReceitaAutoralEntradaSchema = z
  .object({ id: z.string().trim().min(1).max(60) })
  .strict();
