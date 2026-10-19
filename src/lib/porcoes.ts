const FRACOES: Record<string, number> = {
  "½": 1 / 2,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const FRACOES_TEXTO: Record<string, string> = {
  "1/2": "½",
  "1/4": "¼",
  "3/4": "¾",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

const UNIDADES_FRACIONAVEIS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32];

export type RendimentoDetectado = {
  texto: string;
  porcoesExatas: number | undefined;
};

export type IngredienteEscalado = {
  original: string;
  texto: string;
  estado: "ajustado" | "aproximado" | "inalterado";
};

export function detectarRendimento(texto: string): RendimentoDetectado | undefined {
  const encontrados = [
    ...texto.matchAll(/\b(?:rendimento|rende|serve|porções?|porcoes)\s*:?\s*([^|\r\n.;]+)/gi),
  ];
  if (encontrados.length !== 1) return undefined;

  const rendimento = (encontrados[0]?.[1] ?? "").trim();
  if (!/^\d/.test(rendimento)) return undefined;
  const quantidade = rendimento.match(
    /^(\d{1,3})(?:\s*(?:porções?|porcoes|pessoas?|unidades?|fatias?|bolos?|copos?|taças?|tacas?))?$/i,
  );
  const porcoes = Number(quantidade?.[1]);
  return {
    texto: rendimento,
    porcoesExatas:
      Number.isInteger(porcoes) && porcoes >= 1 && porcoes <= 100 ? porcoes : undefined,
  };
}

function valorNumerico(texto: string): number | undefined {
  if (FRACOES[texto] !== undefined) return FRACOES[texto];
  const fracaoMistaUnicode = texto.match(/^(\d+)\s+([½¼¾⅓⅔⅛⅜⅝⅞])$/u);
  if (fracaoMistaUnicode) {
    return Number(fracaoMistaUnicode[1]) + (FRACOES[fracaoMistaUnicode[2] ?? ""] ?? 0);
  }
  const mista = texto.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mista) {
    const denominador = Number(mista[3]);
    if (!denominador) return undefined;
    return Number(mista[1]) + Number(mista[2]) / denominador;
  }
  const fracao = texto.match(/^(\d+)\/(\d+)$/);
  if (fracao) {
    const denominador = Number(fracao[2]);
    if (!denominador) return undefined;
    return Number(fracao[1]) / denominador;
  }
  if (/^\d+(?:[.,]\d+)?$/.test(texto)) return Number(texto.replace(",", "."));
  return undefined;
}

function formatarQuantidade(valor: number): { texto: string; aproximado: boolean } | undefined {
  if (!Number.isFinite(valor) || valor <= 0 || valor > 100_000) return undefined;
  const inteiro = Math.floor(valor + 1e-9);
  const fracao = valor - inteiro;
  if (fracao < 0.005) return { texto: String(inteiro), aproximado: false };

  let melhor: { numerador: number; denominador: number; distancia: number } | undefined;
  for (const denominador of UNIDADES_FRACIONAVEIS) {
    const numerador = Math.round(fracao * denominador);
    if (numerador === 0 || numerador >= denominador) continue;
    const distancia = Math.abs(fracao - numerador / denominador);
    if (!melhor || distancia < melhor.distancia) melhor = { numerador, denominador, distancia };
  }

  if (melhor && melhor.distancia <= 0.005) {
    const simplificador = (a: number, b: number): number => (b === 0 ? a : simplificador(b, a % b));
    const divisor = simplificador(melhor.numerador, melhor.denominador);
    const num = melhor.numerador / divisor;
    const den = melhor.denominador / divisor;
    const fracaoTexto = FRACOES_TEXTO[`${num}/${den}`] ?? `${num}/${den}`;
    return {
      texto: inteiro ? `${inteiro} ${fracaoTexto}` : fracaoTexto,
      aproximado: false,
    };
  }

  const arredondado = Math.round(valor * 100) / 100;
  return {
    texto: `~${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(arredondado)}`,
    aproximado: true,
  };
}

export function ajustarIngredientes(
  ingredientes: string[],
  porcoesOriginais: number | undefined,
  porcoesDesejadas: number | undefined,
): IngredienteEscalado[] {
  return ingredientes.map((original) => {
    const manter = (): IngredienteEscalado => ({ original, texto: original, estado: "inalterado" });
    if (
      !porcoesOriginais ||
      !porcoesDesejadas ||
      porcoesOriginais < 1 ||
      porcoesDesejadas < 1 ||
      porcoesOriginais === porcoesDesejadas ||
      /^(?:~|≈|cerca de\b|aproximadamente\b)/i.test(original.trim())
    ) {
      return manter();
    }

    const quantidade = original.match(
      /^(\s*)(\d+\s+(?:\d+\/\d+|[½¼¾⅓⅔⅛⅜⅝⅞])|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/u,
    );
    if (!quantidade) return manter();

    const resto = quantidade[3] ?? "";
    if (/^(?:[-–]|a\b|até\b|ou\b)\s*\d/i.test(resto)) return manter();
    const valor = valorNumerico(quantidade[2] ?? "");
    if (valor === undefined || valor <= 0 || valor > 10_000) return manter();

    const novo = formatarQuantidade((valor * porcoesDesejadas) / porcoesOriginais);
    if (!novo) return manter();
    return {
      original,
      texto: `${quantidade[1] ?? ""}${novo.texto} ${resto}`,
      estado: novo.aproximado ? "aproximado" : "ajustado",
    };
  });
}
