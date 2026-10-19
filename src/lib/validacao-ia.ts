import { z } from "zod";
import { CATEGORIAS_RECEITAS } from "@/lib/catalogo";

const linha = (maximo: number) => z.string().trim().min(1).max(maximo);

function normalizarChave(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export const SugestoesEntradaSchema = z
  .object({
    ingredientes: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  })
  .strict()
  .transform(({ ingredientes }) => {
    const vistos = new Set<string>();
    return {
      ingredientes: ingredientes.filter((ingrediente) => {
        const chave = normalizarChave(ingrediente);
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      }),
    };
  });

export const OrganizarEntradaSchema = z
  .object({ texto: z.string().trim().min(20).max(12_000) })
  .strict();

export const SugestaoSchema = z
  .object({
    nome: linha(120),
    descricao: linha(500),
    tempo: linha(80),
    usa: z.array(linha(120)).min(1).max(30),
    faltam: z.array(linha(120)).max(30),
    substituicoes: z.array(z.object({ falta: linha(120), troca: linha(300) }).strict()).max(30),
    passos: z.array(linha(700)).min(1).max(30),
  })
  .strict();

export const RespostaSugestoesSchema = z
  .object({ sugestoes: z.array(SugestaoSchema).min(1).max(3) })
  .strict()
  .superRefine(({ sugestoes }, contexto) => {
    const nomes = new Set<string>();
    for (const [indice, sugestao] of sugestoes.entries()) {
      const chave = normalizarChave(sugestao.nome);
      if (nomes.has(chave)) {
        contexto.addIssue({
          code: "custom",
          path: ["sugestoes", indice, "nome"],
          message: "A resposta contém sugestões repetidas.",
        });
      }
      nomes.add(chave);
    }
  });

export const ReceitaOrganizadaSchema = z
  .object({
    titulo: linha(160),
    categoria: z.enum(CATEGORIAS_RECEITAS),
    tempo: z.string().trim().max(60),
    rendimento: z.string().trim().max(60),
    ingredientes: z.array(linha(500)).max(100),
    modo_de_preparo: z.array(linha(1000)).max(100),
    observacoes: z.string().trim().max(2000),
  })
  .strict()
  .refine((receita) => receita.ingredientes.length > 0 || receita.modo_de_preparo.length > 0, {
    message: "A organização precisa conter ingredientes ou modo de preparo.",
  })
  .refine(
    (receita) =>
      receita.titulo.length +
        receita.tempo.length +
        receita.rendimento.length +
        receita.ingredientes.join("\n").length +
        receita.modo_de_preparo.join("\n").length +
        receita.observacoes.length <=
      12_000,
    { message: "A resposta organizada excede o tamanho permitido." },
  );

export type Sugestao = z.infer<typeof SugestaoSchema>;
export type ReceitaOrganizada = z.infer<typeof ReceitaOrganizadaSchema>;

function registro(valor: unknown): Record<string, unknown> | undefined {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : undefined;
}

export function extrairTextoRespostaModelo(resposta: unknown): string {
  const envelope = registro(resposta);
  const saida = envelope?.["output"];
  if (!Array.isArray(saida)) return "";

  const textos: string[] = [];
  for (const item of saida) {
    const mensagem = registro(item);
    if (mensagem?.["type"] !== "message" || !Array.isArray(mensagem["content"])) continue;
    for (const conteudo of mensagem["content"]) {
      const bloco = registro(conteudo);
      if (bloco?.["type"] === "output_text" && typeof bloco["text"] === "string") {
        textos.push(bloco["text"]);
      }
    }
  }
  return textos.join("").trim();
}

export function parseJsonRespostaModelo(texto: string): unknown {
  const limpo = texto.trim();
  const bloco = limpo.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(bloco?.[1] ?? limpo) as unknown;
}

export function validarRespostaSugestoes(texto: string): Sugestao[] {
  return RespostaSugestoesSchema.parse(parseJsonRespostaModelo(texto)).sugestoes;
}

export function validarRespostaReceitaOrganizada(texto: string): ReceitaOrganizada {
  return ReceitaOrganizadaSchema.parse(parseJsonRespostaModelo(texto));
}
