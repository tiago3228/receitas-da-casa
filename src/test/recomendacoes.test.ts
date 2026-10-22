import { describe, expect, it } from "vitest";
import type { ReceitaCatalogo } from "@/lib/catalogo";
import {
  filtrarRecomendacoes,
  recomendarReceitas,
  type CategoriaFiltroRecomendacao,
} from "@/lib/recomendacoes";

function receita(
  id: string,
  nome: string,
  texto: string,
  categoria: CategoriaFiltroRecomendacao = "Arroz, feijão e acompanhamentos",
): ReceitaCatalogo {
  return {
    id,
    nome,
    categoria:
      categoria === "vegetariana" || categoria === "sobremesa" || categoria === "todas"
        ? "Outras receitas"
        : categoria,
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

  it("trata frações Unicode e ingredientes compostos sem contar duplicatas duas vezes", () => {
    const receitaComposta = receita(
      "acucar-canela",
      "Açúcar e canela",
      `Ingredientes:\n½ xícara de açúcar e canela a gosto\n1 colher de açúcar\nModo de preparo:\nMisture.`,
    );

    const recomendacoes = recomendarReceitas(
      [receitaComposta],
      [
        { ingrediente: "1/2 xícara açúcar", ja_tem: true },
        { ingrediente: "canela", ja_tem: true },
        { ingrediente: "1 colher de açúcar", ja_tem: true },
      ],
    );

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({
      ingredientesDisponiveis: 2,
      totalIngredientes: 2,
      percentualDisponivel: 100,
    });
  });

  it("não usa prefixos como igualdade nem pontuação/linhas sem ingredientes como correspondência", () => {
    const receitas = [
      receita(
        "molho",
        "Molho de salsa",
        "Ingredientes:\n1 maço de salsinha\nModo de preparo:\nMisture.",
      ),
      receita("sem-secao", "Sem seção", "Uma receita sem cabeçalho nem lista estruturada."),
    ];

    expect(recomendarReceitas(receitas, [{ ingrediente: "sal", ja_tem: true }])).toEqual([]);
    expect(recomendarReceitas(receitas, [{ ingrediente: "!!! ½ —", ja_tem: true }])).toEqual([]);
  });

  it("rejeita limites inválidos e mantém pontuação finita entre zero e cem", () => {
    expect(
      recomendarReceitas([receitaCurta], [{ ingrediente: "tomate", ja_tem: true }], Number.NaN),
    ).toEqual([]);
    expect(
      recomendarReceitas(
        [receitaCurta],
        [{ ingrediente: "tomate", ja_tem: true }],
        Number.POSITIVE_INFINITY,
      ),
    ).toEqual([]);

    const recomendacao = recomendarReceitas(
      [receitaCurta],
      [{ ingrediente: "tomate", ja_tem: true }],
    )[0];
    expect(recomendacao?.percentualDisponivel).toBeGreaterThanOrEqual(0);
    expect(recomendacao?.percentualDisponivel).toBeLessThanOrEqual(100);
  });

  it("filtra vegetarianas com ressalva heurística, sobremesas e categorias do catálogo", () => {
    const vegetariana = receita(
      "arroz-vegetariano",
      "Arroz de legumes",
      `Ingredientes:\n1 tomate\n1 xícara de arroz\nModo de preparo:\nCozinhe.`,
    );
    const comCarne = receita(
      "arroz-bacon",
      "Arroz com bacon",
      `Ingredientes:\n1 tomate\n1 porção de bacon\nModo de preparo:\nCozinhe.`,
    );
    const sobremesa = receita(
      "torta-tomate",
      "Torta doce",
      `Ingredientes:\n1 tomate\n1 xícara de açúcar\nModo de preparo:\nAsse.`,
      "Bolos, tortas doces e cupcakes",
    );
    const boloSalgado = receita(
      "bolo-salgado",
      "Bolo salgado",
      `Ingredientes:\n1 tomate\n1 xícara de farinha de trigo\nModo de preparo:\nAsse.`,
      "Bolos, tortas doces e cupcakes",
    );
    const tortaForaDaCategoria = receita(
      "torta-maca",
      "Torta de maçã americana",
      `Ingredientes:\n1 tomate\n1 maçã\nModo de preparo:\nAsse.`,
      "Pães, massas e panificação",
    );
    const candidatas = recomendarReceitas(
      [vegetariana, comCarne, sobremesa, boloSalgado, tortaForaDaCategoria],
      [{ ingrediente: "tomate", ja_tem: true }],
      10,
    );

    expect(
      filtrarRecomendacoes(candidatas, "vegetariana", "qualquer").map(
        ({ receita: item }) => item.id,
      ),
    ).toContain("arroz-vegetariano");
    expect(
      filtrarRecomendacoes(candidatas, "vegetariana", "qualquer").map(
        ({ receita: item }) => item.id,
      ),
    ).not.toContain("arroz-bacon");
    const somenteSobremesas = filtrarRecomendacoes(candidatas, "sobremesa", "qualquer").map(
      ({ receita: item }) => item.id,
    );
    expect(somenteSobremesas).toContain("torta-tomate");
    expect(somenteSobremesas).toContain("torta-maca");
    expect(somenteSobremesas).not.toContain("bolo-salgado");

    const bolos = filtrarRecomendacoes(
      candidatas,
      "Bolos, tortas doces e cupcakes",
      "qualquer",
    ).map(({ receita: item }) => item.id);
    expect(bolos).toContain("torta-tomate");
    expect(bolos).toContain("bolo-salgado");
  });

  it("combina o limite de preparo com a categoria e exclui duração ausente ou sem teto", () => {
    const pronta = receita(
      "rapida",
      "Arroz rápido",
      `Ingredientes:\n1 tomate\n1 xícara de arroz\nTempo de preparo: 30 min\nModo de preparo:\nCozinhe.`,
    );
    const longa = receita(
      "lenta",
      "Arroz lento",
      `Ingredientes:\n1 tomate\n1 xícara de arroz\nTempo de preparo: Mais de 1 hora\nModo de preparo:\nCozinhe.`,
    );
    const semTempo = receita(
      "sem-tempo",
      "Arroz sem tempo",
      `Ingredientes:\n1 tomate\n1 xícara de arroz\nModo de preparo:\nCozinhe.`,
    );
    const candidatas = recomendarReceitas(
      [pronta, longa, semTempo],
      [{ ingrediente: "tomate", ja_tem: true }],
      10,
    );

    expect(
      filtrarRecomendacoes(candidatas, "todas", 30).map(({ receita: item }) => item.id),
    ).toEqual(["rapida"]);
    expect(
      filtrarRecomendacoes(candidatas, "todas", 90).map(({ receita: item }) => item.id),
    ).toEqual(["rapida"]);
    expect(filtrarRecomendacoes(candidatas, "todas", Number.NaN)).toEqual([]);
    expect(filtrarRecomendacoes(candidatas, "todas", -1)).toEqual([]);
  });
});
