import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extrairIngredientes, extrairModoDePreparo, quebrarEmFrases } from "@/lib/receita-texto";

const catalogo = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/receitas.json"), "utf8"),
) as {
  id: string;
  texto: string;
}[];

describe("leitura estruturada de receitas", () => {
  it("extrai uma linha para cada ingrediente e ignora títulos de seção", () => {
    const texto = `Bolo simples
Ingredientes:
2 ovos
1 xícara de farinha
Massa
1 pitada de sal
Modo de preparo:
Misture os ingredientes e asse.`;

    expect(extrairIngredientes(texto)).toEqual([
      "2 ovos",
      "1 xícara de farinha",
      "1 pitada de sal",
    ]);
  });

  it("separa quantidades coladas quando o texto original perdeu as quebras de linha", () => {
    const texto =
      "Ingredientes200 gramas de chocolate picado1 lata de creme de leite½ xícara de leite\nModo de preparo: Misture tudo.";

    expect(extrairIngredientes(texto)).toEqual([
      "200 gramas de chocolate picado",
      "1 lata de creme de leite",
      "½ xícara de leite",
    ]);
  });

  it("lê ingredientes e preparo de uma receita real do catálogo importado", () => {
    const receita = catalogo.find((item) => item.id === "6-recheios-para-bolo");
    expect(receita).toBeDefined();
    expect(extrairIngredientes(receita!.texto).length).toBeGreaterThan(10);
    expect(extrairModoDePreparo(receita!.texto).length).toBeGreaterThan(40);
  });

  it("mantém as etapas que mencionam ingredientes e não inclui a lista de compras", () => {
    const texto = `Ingredientes:
2 ovos
1 xícara de farinha
Modo de preparo:
Misture os ingredientes até formar uma massa homogênea.
Asse por 30 minutos.
Dicas:
Sirva frio.`;

    expect(extrairModoDePreparo(texto)).toBe(
      "Misture os ingredientes até formar uma massa homogênea.\nAsse por 30 minutos.",
    );
  });

  it("junta etapas com linhas e frases separadas para a leitura em voz", () => {
    expect(quebrarEmFrases("Misture bem.\nLeve ao forno por 30 minutos.")).toEqual([
      "Misture bem.",
      "Leve ao forno por 30 minutos.",
    ]);
  });
});
