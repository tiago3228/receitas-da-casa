import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CatalogoReceitasSchema,
  encontrarReceitaPorId,
  filtrarReceitas,
  gruposDeTitulosDuplicados,
  validarCatalogo,
} from "@/lib/catalogo";

const json: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/receitas.json"), "utf8"),
);
const catalogo = validarCatalogo(json);

describe("integridade do catálogo", () => {
  it("valida todos os registros reais, categorias e ids únicos", () => {
    expect(catalogo).toHaveLength(530);
    expect(new Set(catalogo.map((receita) => receita.id)).size).toBe(catalogo.length);
    expect(CatalogoReceitasSchema.safeParse(json).success).toBe(true);
  });

  it("identifica grupos de mesmo título sem considerar variante como duplicata automática", () => {
    const grupos = gruposDeTitulosDuplicados(catalogo);
    expect(grupos).toHaveLength(5);
    expect(grupos.map((grupo) => grupo[0]?.nome).sort()).toEqual(
      [
        "Batata recheada",
        "Bolo de cenoura",
        "Mingau de Milho Verde",
        "Molho Branco",
        "Torta de frango",
      ].sort(),
    );
  });

  it("resolve ids antigos para a receita consolidada e mantém termos alternativos na busca", () => {
    expect(encontrarReceitaPorId(catalogo, "mousse-royal-de-chocolate")?.id).toBe(
      "musse-royal-de-chocolate",
    );
    expect(
      filtrarReceitas(catalogo, "mousse royal", "Todas").map((receita) => receita.id),
    ).toContain("musse-royal-de-chocolate");
    expect(encontrarReceitaPorId(catalogo, "pudim-de-pao-da-vo-luiza")?.id).toBe(
      "pudim-de-pao-da-vo-luisa",
    );
  });

  it("busca por ingredientes sem depender de acentuação ou maiúsculas", () => {
    const resultados = filtrarReceitas(catalogo, "MACARRAO CAMARAO", "Pães, massas e panificação");
    expect(resultados.map((receita) => receita.id)).toContain("macarrao-ao-camarao-com-laranja");
  });

  it("mantém o filtro com busca vazia e retorna lista vazia quando não há correspondência", () => {
    expect(filtrarReceitas(catalogo, "  ", "Bebidas").length).toBeGreaterThan(0);
    expect(filtrarReceitas(catalogo, "termo-sem-correspondencia-xyz", "Todas")).toEqual([]);
  });

  it("rejeita categoria inválida, identificador repetido e esquema de imagem inseguro", () => {
    const base = {
      id: "receita-teste",
      nome: "Receita de teste",
      categoria: "Bebidas",
      imagem: null,
      texto: "Ingredientes: água. Modo de preparo: misture.",
    };
    expect(CatalogoReceitasSchema.safeParse([{ ...base, categoria: "Desconhecida" }]).success).toBe(
      false,
    );
    expect(CatalogoReceitasSchema.safeParse([base, base]).success).toBe(false);
    expect(
      CatalogoReceitasSchema.safeParse([
        base,
        { ...base, id: "receita-outro", aliases: ["receita-teste"] },
      ]).success,
    ).toBe(false);
    expect(
      CatalogoReceitasSchema.safeParse([{ ...base, imagem: "javascript:alert(1)" }]).success,
    ).toBe(false);
    expect(
      CatalogoReceitasSchema.safeParse([{ ...base, imagem: "//exemplo.test/imagem.png" }]).success,
    ).toBe(false);
  });
});
