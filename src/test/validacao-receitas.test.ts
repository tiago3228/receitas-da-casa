import { describe, expect, it } from "vitest";
import {
  AtualizarReceitaAutoralEntradaSchema,
  ReceitaAutoralEntradaSchema,
  RemoverReceitaAutoralEntradaSchema,
} from "@/lib/validacao-receitas";

describe("validação de receitas pessoais", () => {
  it("aplica defaults e aceita a categoria pessoal sem texto original obrigatório", () => {
    expect(ReceitaAutoralEntradaSchema.parse({ titulo: "Bolo", ingredientes: "2 ovos" })).toEqual({
      titulo: "Bolo",
      categoria: "Minhas receitas",
      ingredientes: "2 ovos",
      modo_de_preparo: "",
      observacoes: "",
      tempo: "",
      rendimento: "",
      texto_original: "",
    });
  });

  it("rejeita categoria fora do catálogo e receita sem ingredientes nem preparo", () => {
    expect(
      ReceitaAutoralEntradaSchema.safeParse({
        titulo: "Bolo",
        categoria: "Doces inventados",
        ingredientes: "a",
      }).success,
    ).toBe(false);
    expect(ReceitaAutoralEntradaSchema.safeParse({ titulo: "Bolo" }).success).toBe(false);
  });

  it("aplica limites dos campos e rejeita propriedades inesperadas", () => {
    expect(
      ReceitaAutoralEntradaSchema.safeParse({ titulo: "x".repeat(161), ingredientes: "a" }).success,
    ).toBe(false);
    expect(
      ReceitaAutoralEntradaSchema.safeParse({
        titulo: "Bolo",
        ingredientes: "a",
        observacoes: "x".repeat(2_001),
      }).success,
    ).toBe(false);
    expect(
      ReceitaAutoralEntradaSchema.safeParse({ titulo: "Bolo", ingredientes: "a", admin: true })
        .success,
    ).toBe(false);
  });

  it("valida o identificador de remoção sem aceitar payloads extras", () => {
    expect(RemoverReceitaAutoralEntradaSchema.safeParse({ id: "123" }).success).toBe(true);
    expect(RemoverReceitaAutoralEntradaSchema.safeParse({ id: "", user_id: "outro" }).success).toBe(
      false,
    );
  });

  it("exige id ao atualizar e continua bloqueando alteração do proprietário", () => {
    const dados = {
      id: "receita-123",
      titulo: "Pão de casa",
      ingredientes: "500 g de farinha",
      user_id: "outra-pessoa",
    };
    expect(AtualizarReceitaAutoralEntradaSchema.safeParse(dados).success).toBe(false);
    expect(
      AtualizarReceitaAutoralEntradaSchema.safeParse({
        id: "receita-123",
        titulo: "Pão de casa",
        ingredientes: "500 g de farinha",
      }).success,
    ).toBe(true);
  });
});
