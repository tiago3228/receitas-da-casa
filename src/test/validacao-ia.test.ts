import { describe, expect, it } from "vitest";
import { excedeuLimite } from "@/lib/limite-requisicoes";
import {
  OrganizarEntradaSchema,
  ReceitaOrganizadaSchema,
  SugestoesEntradaSchema,
  extrairTextoRespostaModelo,
  validarRespostaReceitaOrganizada,
  validarRespostaSugestoes,
} from "@/lib/validacao-ia";

describe("validação de entradas e saídas da IA", () => {
  it("deduplica ingredientes equivalentes e limita o tamanho de cada entrada", () => {
    expect(SugestoesEntradaSchema.parse({ ingredientes: [" OVO ", "ovo", "Tomate"] })).toEqual({
      ingredientes: ["OVO", "Tomate"],
    });
    expect(() => SugestoesEntradaSchema.parse({ ingredientes: ["x".repeat(61)] })).toThrow();
    expect(() => SugestoesEntradaSchema.parse({ ingredientes: Array(31).fill("ovo") })).toThrow();
    expect(() => SugestoesEntradaSchema.parse({ ingredientes: ["ovo"], extra: true })).toThrow();
  });

  it("limita texto de organização a 20–12.000 caracteres", () => {
    expect(OrganizarEntradaSchema.safeParse({ texto: "x".repeat(20) }).success).toBe(true);
    expect(OrganizarEntradaSchema.safeParse({ texto: "x".repeat(19) }).success).toBe(false);
    expect(OrganizarEntradaSchema.safeParse({ texto: "x".repeat(12_001) }).success).toBe(false);
  });

  it("extrai somente blocos output_text do envelope conhecido", () => {
    expect(
      extrairTextoRespostaModelo({
        output: [
          { type: "reasoning", content: [{ type: "output_text", text: "ignorar" }] },
          { type: "message", content: [{ type: "output_text", text: '{"ok":' }] },
          { type: "message", content: [{ type: "output_text", text: "true}" }] },
        ],
      }),
    ).toBe('{"ok":true}');
    expect(extrairTextoRespostaModelo({ output: "não é lista" })).toBe("");
  });

  it("aceita JSON fenced válido e rejeita conteúdo extra, categorias inválidas e campos extras", () => {
    const resposta = {
      sugestoes: [
        {
          nome: "Omelete simples",
          descricao: "Uma omelete rápida.",
          tempo: "10 minutos",
          usa: ["ovo"],
          faltam: [],
          substituicoes: [],
          passos: ["Bata os ovos e cozinhe em frigideira."],
        },
      ],
    };
    expect(validarRespostaSugestoes(`\`\`\`json\n${JSON.stringify(resposta)}\n\`\`\``)).toEqual(
      resposta.sugestoes,
    );
    expect(() =>
      validarRespostaSugestoes(`${JSON.stringify(resposta)} texto fora do JSON`),
    ).toThrow();
    expect(() =>
      validarRespostaSugestoes(JSON.stringify({ ...resposta, unexpected: "campo" })),
    ).toThrow();
    expect(() =>
      validarRespostaSugestoes(
        JSON.stringify({ sugestoes: [{ ...resposta.sugestoes[0], passos: [] }] }),
      ),
    ).toThrow();
  });

  it("valida categoria e tamanho da receita organizada antes de mostrar para salvar", () => {
    const receita = {
      titulo: "Pão caseiro",
      categoria: "Pães, massas e panificação",
      tempo: "1 hora",
      rendimento: "1 pão",
      ingredientes: ["500 g de farinha"],
      modo_de_preparo: ["Misture e asse."],
      observacoes: "",
    };
    expect(validarRespostaReceitaOrganizada(JSON.stringify(receita))).toEqual(receita);
    expect(
      ReceitaOrganizadaSchema.safeParse({ ...receita, categoria: "Categoria inventada" }).success,
    ).toBe(false);
    expect(() => validarRespostaReceitaOrganizada("{} explicação")).toThrow();
  });
});

describe("limite em memória", () => {
  it("permite dez requisições e bloqueia a seguinte para a mesma origem", () => {
    const chave = `teste-limite-${Date.now()}`;
    for (let indice = 0; indice < 10; indice += 1) {
      expect(excedeuLimite(chave, 5_000)).toBe(false);
    }
    expect(excedeuLimite(chave, 5_000)).toBe(true);
    expect(excedeuLimite(`${chave}-outra`, 5_000)).toBe(false);
  });

  it("reinicia a janela após um minuto", () => {
    const chave = `teste-janela-${Date.now()}`;
    for (let indice = 0; indice < 10; indice += 1) excedeuLimite(chave, 10_000);
    expect(excedeuLimite(chave, 70_000)).toBe(false);
  });
});
