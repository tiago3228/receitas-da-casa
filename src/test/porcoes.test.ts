import { describe, expect, it } from "vitest";
import { ajustarIngredientes, detectarRendimento } from "@/lib/porcoes";

describe("ajuste conservador de porções", () => {
  it("usa apenas um rendimento inteiro explícito e mantém ranges como texto original", () => {
    expect(detectarRendimento("Bolo\nRendimento: 8 porções\nIngredientes")).toEqual({
      texto: "8 porções",
      porcoesExatas: 8,
    });
    expect(detectarRendimento("Rendimento 4-6 pessoas | Tempo 30 min")).toEqual({
      texto: "4-6 pessoas",
      porcoesExatas: undefined,
    });
    expect(detectarRendimento("Sem rendimento informado")).toBeUndefined();
  });

  it("recalcula números simples e frações sem tocar nas quantidades qualitativas", () => {
    const originais = ["1/2 xícara de açúcar", "2 ovos", "sal a gosto", "1 a 2 tomates"];
    const resultado = ajustarIngredientes(originais, 4, 8);

    expect(resultado.map((item) => item.texto)).toEqual([
      "1 xícara de açúcar",
      "4 ovos",
      "sal a gosto",
      "1 a 2 tomates",
    ]);
    expect(resultado.map((item) => item.estado)).toEqual([
      "ajustado",
      "ajustado",
      "inalterado",
      "inalterado",
    ]);
    expect(originais[0]).toBe("1/2 xícara de açúcar");
  });

  it("preserva fração Unicode mista e marca aproximações que não cabem em fração culinária comum", () => {
    expect(ajustarIngredientes(["1 ½ xícara de leite"], 2, 4)[0]?.texto).toBe("3 xícara de leite");
    const aproximado = ajustarIngredientes(["1 colher de canela"], 7, 3)[0];
    expect(aproximado?.estado).toBe("aproximado");
    expect(aproximado?.texto).toContain("~");
  });

  it("não ajusta ingredientes sem quantidade numérica explícita nem no rendimento original", () => {
    expect(ajustarIngredientes(["farinha até dar ponto", "a gosto"], undefined, 6)).toEqual([
      { original: "farinha até dar ponto", texto: "farinha até dar ponto", estado: "inalterado" },
      { original: "a gosto", texto: "a gosto", estado: "inalterado" },
    ]);
  });
});
