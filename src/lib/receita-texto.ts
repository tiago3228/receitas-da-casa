import { ehTitulo, normalizar } from "@/lib/receitas";

const INICIO_TITULO = /(?:^|(?<=[\r\n.!?]))\s*/;
const CABECALHO_INGREDIENTES = new RegExp(
  `${INICIO_TITULO.source}ingredientes(?=\\b|[0-9½¼¾⅓⅔⅛⅜⅝⅞A-ZÀ-Ý])\\s*:?\\s*`,
  "gi",
);
const CABECALHO_PREPARO = new RegExp(
  `${INICIO_TITULO.source}modo\\s+de\\s+preparo(?=\\b|[A-ZÀ-Ý])\\s*:?\\s*`,
  "gi",
);
const FIM_SECAO = new RegExp(
  `${INICIO_TITULO.source}(?:ingredientes|modo\\s+de\\s+preparo|dicas?|observa[cç][oõ]es|fonte|rendimento|tempo\\s+de\\s+preparo)(?=\\b|[0-9½¼¾⅓⅔⅛⅜⅝⅞A-ZÀ-Ý])\\s*:?\\s*`,
  "gi",
);
const TITULOS_COMPONENTES =
  /^(?:massa|recheio|cobertura|calda|ponche|montagem|fondant|dicas?(?:\s+e\s+op[cç][oõ]es)?|observa[cç][oõ]es|fonte)\s*:?$/i;

function capturarSecoes(texto: string, marcadores: RegExp, tipo: "ingrediente" | "preparo") {
  const ocorrencias = [...texto.matchAll(marcadores)];
  const trechos: string[] = [];

  for (const ocorrencia of ocorrencias) {
    const inicio = (ocorrencia.index ?? 0) + ocorrencia[0].length;
    FIM_SECAO.lastIndex = inicio;
    const proximo = FIM_SECAO.exec(texto);
    const fim = proximo?.index ?? texto.length;
    const trecho = texto.slice(inicio, fim).trim();
    if (trecho) trechos.push(trecho);
  }

  if (tipo === "preparo" && trechos.length === 0) {
    const linhas = texto
      .split(/\r?\n/)
      .filter(
        (linha) => !/^\s*ingredientes\b/i.test(linha) && !TITULOS_COMPONENTES.test(linha.trim()),
      );
    return linhas.join("\n").trim();
  }
  return trechos.join("\n");
}

export function extrairIngredientes(texto: string): string[] {
  const secao = capturarSecoes(texto, CABECALHO_INGREDIENTES, "ingrediente");
  const vistos = new Set<string>();
  return secao
    .split(/[\r\n;]+/)
    .flatMap((linha) =>
      linha
        .replace(/^\s*[-*•●]+\s*/, "")
        .replace(/\s+/g, " ")
        .split(
          /(?<=[\p{L})])(?=(?:\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*(?:kg|g|mg|ml|l|litros?|gramas?|quilos?|xícaras?|colheres?|latas?|caixinhas?|caixas?|unidades?|dentes?|fatias?|ovos?|pacotes?|tabletes?|copos?|pitadas?|ramos?|maços?|polpas?|bandejas?|envelopes?|sachês?|sache)\b)/giu,
        )
        .map((parte) => parte.trim()),
    )
    .filter((linha) => {
      if (!linha || ehTitulo(linha) || TITULOS_COMPONENTES.test(linha)) return false;
      const chave = normalizar(linha);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

export function extrairModoDePreparo(texto: string): string {
  const modo = capturarSecoes(texto, CABECALHO_PREPARO, "preparo");
  return modo
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha && !/^\s*(?:modo\s+de\s+preparo|dicas?|fonte)\b/i.test(linha))
    .join("\n")
    .trim();
}

export function quebrarEmFrases(texto: string): string[] {
  return texto
    .split(/\r?\n+|(?<=[.!?])\s+/)
    .map((frase) => frase.trim())
    .filter(Boolean);
}
