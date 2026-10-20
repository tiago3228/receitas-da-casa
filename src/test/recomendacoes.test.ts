import { describe, expect, it } from "vitest";
import type { ReceitaCatalogo } from "@/lib/catalogo";
import { recomendarReceitas } from "@/lib/recomendacoes";

function receita(id: string, nome: string, texto: string): ReceitaCatalogo {
  return {
    id,
    nome,
    categoria: "Arroz, feijão e acompanhamentos",
    imagem: null,
    texto,
  };
}

const receitaCompleta = receita(
  "arroz-colorido",
  "Arroz colorido",
  `Ingredientes:
1 xícara (chá) de arroz
2 tomates maduros
1 cebola picada
Modo de preparo:
Cozinhe o arroz com o tomate e a cebola.`,
);

const receitaCurta = receita(
  "tomate-com-cebola",
  "Tomate com cebola",
  `Ingredientes:
1 tomate
1 cebola em cubos
Modo de preparo:
Misture o tomate e a cebola.`,
);

describe("recomendações por ingredientes disponíveis", () => {
  it("compara nomes ignorando quantidade, medidas, acentos, caixa e preparo", () => {
    const recomendacoes = recomendarReceitas(
      [receitaCompleta],
      [
        { ingrediente: "3 TOMATES picados", ja_tem: true },
        { ingrediente: "1/2 xícara de cebolas em cubos", ja_tem: true },
        { ingrediente: "200 g de arroz", ja_tem: false },
      ],
    );

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({
      ingredientesDisponiveis: 2,
      totalIngredientes: 3,
      percentualDisponivel: 67,
    });
    expect(recomendacoes[0]?.nomesDisponiveis).toEqual(["2 tomates maduros", "1 cebola picada"]);
  });

  it("não recomenda usando itens ainda desmarcados como disponíveis", () => {
    expect(
      recomendarReceitas(
        [receitaCurta],
        [
          { ingrediente: "1 tomate", ja_tem: false },
          { ingrediente: "1 cebola", ja_tem: false },
        ],
      ),
    ).toEqual([]);
  });

  it("ordena pela proporção disponível, aplica o limite e ignora itens duplicados", () => {
    const recomendacoes = recomendarReceitas(
      [receitaCompleta, receitaCurta],
      [
        { ingrediente: "2 tomates", ja_tem: true },
        { ingrediente: "1 tomate", ja_tem: true },
        { ingrediente: "1 cebola", ja_tem: true },
      ],
      1,
    );

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]?.receita.id).toBe("tomate-com-cebola");
    expect(recomendacoes[0]).toMatchObject({
      ingredientesDisponiveis: 2,
      totalIngredientes: 2,
      percentualDisponivel: 100,
    });
  });

  it("não cria sugestões sem itens marcados ou com limite zero", () => {
    expect(recomendarReceitas([receitaCompleta], [], 6)).toEqual([]);
    expect(
      recomendarReceitas([receitaCompleta], [{ ingrediente: "tomate", ja_tem: true }], 0),
    ).toEqual([]);
  });
});
