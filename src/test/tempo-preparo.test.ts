import { describe, expect, it } from "vitest";
import { extrairTempoPreparo, formatarTempoPreparo } from "@/lib/tempo-preparo";

describe("extração conservadora do tempo de preparo", () => {
  it("lê horas e minutos combinados com ou sem espaços", () => {
    expect(extrairTempoPreparo("Tempo de preparo: 1 h 30 min | Rendimento: 8 porções")).toEqual({
      minimoMinutos: 90,
      maximoMinutos: 90,
    });
    expect(extrairTempoPreparo("Rendimento 4 porções | Tempo de preparo 1h30")).toEqual({
      minimoMinutos: 90,
      maximoMinutos: 90,
    });
    expect(extrairTempoPreparo("Tempo de preparo: 0,5 hora")).toEqual({
      minimoMinutos: 30,
      maximoMinutos: 30,
    });
  });

  it("usa os extremos declarados de faixas com unidades iguais ou diferentes", () => {
    expect(
      extrairTempoPreparo("Tempo de preparo: De 30 minutos a 1 hora Serve: 4 porções"),
    ).toEqual({
      minimoMinutos: 30,
      maximoMinutos: 60,
    });
    expect(extrairTempoPreparo("Tempo de preparo: 20–35 min")).toEqual({
      minimoMinutos: 20,
      maximoMinutos: 35,
    });
    expect(extrairTempoPreparo("Tempo de preparo: 30 a 40 minutos")).toEqual({
      minimoMinutos: 30,
      maximoMinutos: 40,
    });
  });

  it("não converte limites abertos em tempos exatos", () => {
    expect(extrairTempoPreparo("Tempo de preparo: Menos de 30 minutos")).toEqual({
      minimoMinutos: 0,
      maximoMinutos: 30,
    });
    expect(extrairTempoPreparo("Tempo de preparo: Mais de 1 hora")).toEqual({
      minimoMinutos: 60,
    });
    expect(formatarTempoPreparo(extrairTempoPreparo("Tempo de preparo: Mais de 1 hora"))).toBe(
      "Mais de 1 h",
    );
    expect(formatarTempoPreparo(undefined)).toBe("Tempo não informado");
  });

  it("ignora tempos fora do campo explícito e linhas com mais de uma duração ambígua", () => {
    expect(extrairTempoPreparo("Deixe descansar por 30 minutos.")).toBeUndefined();
    expect(
      extrairTempoPreparo("Tempo de preparo: 30 minutos, mais 20 minutos de descanso"),
    ).toBeUndefined();
    expect(extrairTempoPreparo("Tempo de preparo: preparo rápido")).toBeUndefined();
  });
});
