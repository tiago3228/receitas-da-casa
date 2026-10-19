import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReceitaPropria = {
  id: string;
  titulo: string;
  categoria: string;
  ingredientes: string;
  modo_de_preparo: string;
  observacoes: string;
  tempo: string;
  rendimento: string;
  texto_original: string;
  criado_em: string;
};

const COLUNAS =
  "id, titulo, categoria, ingredientes, modo_de_preparo, observacoes, tempo, rendimento, texto_original, criado_em";

const LIMITE_TEXTO = 12000;

function limpar(v: unknown, max: number) {
  return String(v ?? "").trim().slice(0, max);
}

export const minhasReceitasQueryOptions = queryOptions({
  queryKey: ["minhas-receitas"],
  queryFn: () => listarMinhasReceitas(),
});

export const listarMinhasReceitas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReceitaPropria[]> => {
    const { data, error } = await context.supabase
      .from("receitas_autorais")
      .select(COLUNAS)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ReceitaPropria[];
  });

export const salvarMinhaReceita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    titulo: string;
    categoria: string;
    ingredientes: string;
    modo_de_preparo: string;
    observacoes?: string;
    tempo?: string;
    rendimento?: string;
    texto_original?: string;
  }) => {
    const titulo = limpar(input?.titulo, 160);
    if (!titulo) throw new Error("Dê um nome para a receita.");
    const ingredientes = limpar(input?.ingredientes, LIMITE_TEXTO);
    const modo = limpar(input?.modo_de_preparo, LIMITE_TEXTO);
    if (!ingredientes && !modo) throw new Error("Escreva pelo menos os ingredientes ou o modo de preparo.");
    return {
      titulo,
      categoria: limpar(input?.categoria, 80) || "Minhas receitas",
      ingredientes,
      modo_de_preparo: modo,
      observacoes: limpar(input?.observacoes, 2000),
      tempo: limpar(input?.tempo, 60),
      rendimento: limpar(input?.rendimento, 60),
      texto_original: limpar(input?.texto_original, LIMITE_TEXTO),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: criada, error } = await context.supabase
      .from("receitas_autorais")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: criada.id };
  });

export const apagarMinhaReceita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = limpar(input?.id, 60);
    if (!id) throw new Error("Receita não informada.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("receitas_autorais").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ReceitaOrganizada = {
  titulo: string;
  categoria: string;
  tempo: string;
  rendimento: string;
  ingredientes: string;
  modo_de_preparo: string;
  observacoes: string;
};

export const organizarReceita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { texto: string }) => {
    const texto = limpar(input?.texto, LIMITE_TEXTO);
    if (texto.length < 20) throw new Error("Cole a receita inteira para eu conseguir organizar.");
    return { texto };
  })
  .handler(async ({ data }): Promise<{ receita: ReceitaOrganizada | null; erro?: string }> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const prompt = `Você organiza receitas caseiras brasileiras escritas à mão.
A pessoa colou o texto abaixo, do jeito que escreveu. Separe as partes sem inventar nada.
Se algo não estiver no texto, deixe o campo vazio.
Escolha "categoria" entre estas, ou use "Outras receitas":
Bolos, tortas e cupcakes | Doces, sobremesas e doces de festa | Biscoitos e bolachas | Pães, massas e panificação | Salgados, petiscos e lanches | Carnes, aves e peixes | Arroz, feijão e acompanhamentos | Molhos, temperos e conservas | Bebidas | Outras receitas
Responda APENAS com JSON válido, sem texto extra, no formato:
{"titulo":"","categoria":"","tempo":"","rendimento":"","ingredientes":[""],"modo_de_preparo":[""],"observacoes":""}
Em "ingredientes" cada linha é um ingrediente com a quantidade. Em "modo_de_preparo" cada linha é uma etapa curta e clara.
Texto da pessoa:
"""
${data.texto}
"""`;
    try {
      const res = await generateResponse({ model: "openai/gpt-6-astra", input: prompt });
      let texto = "";
      for (const item of (res as any).output ?? []) {
        if (item.type === "message") {
          for (const c of item.content ?? []) if (c.type === "output_text") texto += c.text;
        }
      }
      const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
      const p = JSON.parse(json) as Record<string, unknown>;
      const linhas = (v: unknown) =>
        Array.isArray(v)
          ? v.map((x) => String(x).trim()).filter(Boolean).join("\n")
          : String(v ?? "").trim();
      return {
        receita: {
          titulo: limpar(p["titulo"], 160),
          categoria: limpar(p["categoria"], 80) || "Minhas receitas",
          tempo: limpar(p["tempo"], 60),
          rendimento: limpar(p["rendimento"], 60),
          ingredientes: limpar(linhas(p["ingredientes"]), LIMITE_TEXTO),
          modo_de_preparo: limpar(linhas(p["modo_de_preparo"]), LIMITE_TEXTO),
          observacoes: limpar(p["observacoes"], 2000),
        },
      };
    } catch (e) {
      console.error(e);
      if (e instanceof GatewayError && e.code === "rate_limited")
        return { receita: null, erro: "Muitos pedidos agora. Espere um minuto e tente de novo." };
      return { receita: null, erro: "Não consegui organizar a receita agora. Você pode preencher os campos abaixo." };
    }
  });
