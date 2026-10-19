import { createServerFn } from "@tanstack/react-start";

export type Sugestao = {
  nome: string;
  descricao: string;
  tempo: string;
  usa: string[];
  faltam: string[];
  substituicoes: { falta: string; troca: string }[];
  passos: string[];
};

export const sugerirReceitas = createServerFn({ method: "POST" })
  .inputValidator((input: { ingredientes: string[] }) => {
    const lista = (input?.ingredientes ?? [])
      .map((i) => String(i).trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 30);
    if (lista.length === 0) throw new Error("Informe pelo menos um ingrediente.");
    return { ingredientes: lista };
  })
  .handler(async ({ data }): Promise<{ sugestoes: Sugestao[]; erro?: string }> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const prompt = `Você é um cozinheiro brasileiro gentil que ajuda pessoas idosas.
A pessoa tem em casa: ${data.ingredientes.join(", ")}.
Sugira 3 receitas caseiras simples que usem principalmente esses ingredientes.
Para cada ingrediente que faltar, dê uma substituição prática com algo comum em casa.
Use frases curtas e claras, em português do Brasil.
Responda APENAS com JSON válido, sem texto extra, no formato:
{"sugestoes":[{"nome":"","descricao":"","tempo":"30 minutos","usa":[""],"faltam":[""],"substituicoes":[{"falta":"","troca":""}],"passos":[""]}]}`;
    try {
      const res = await generateResponse({ model: "openai/gpt-6-astra", input: prompt });
      let texto = "";
      for (const item of (res as any).output ?? []) {
        if (item.type === "message") {
          for (const c of item.content ?? []) if (c.type === "output_text") texto += c.text;
        }
      }
      const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json) as { sugestoes: Sugestao[] };
      return { sugestoes: parsed.sugestoes ?? [] };
    } catch (e) {
      console.error(e);
      if (e instanceof GatewayError && e.code === "rate_limited")
        return { sugestoes: [], erro: "Muitos pedidos agora. Espere um minuto e tente de novo." };
      return { sugestoes: [], erro: "Não conseguimos sugerir receitas agora. Tente novamente." };
    }
  });
