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

/** Mantém limites de sentença/lista existentes; texto sem marcadores vira uma única etapa. */
export function extrairEtapas(texto: string): string[] {
  const linhas = texto
    .split(/\r?\n+/)
    .map((linha) => linha.trim())
    .filter((linha) => linha && !ehTitulo(linha) && !TITULOS_COMPONENTES.test(linha));
  if (!linhas.length) return [];

  const numeradas = linhas.some((linha) => /^(?:\d{1,3}[.)]|passo\s+\d+\b|[-*•●])\s*/i.test(linha));
  if (numeradas) {
    const etapas: string[] = [];
    let atual = "";
    for (const linha of linhas) {
      const marcador = linha.match(/^(?:(?:\d{1,3}[.)]|passo\s+\d+\s*[:.)-]?|[-*•●])\s*)/i);
      if (marcador) {
        if (atual) etapas.push(atual.trim());
        atual = linha.slice(marcador[0].length).trim();
      } else {
        atual = `${atual} ${linha}`.trim();
      }
    }
    if (atual) etapas.push(atual);
    return etapas;
  }

  return quebrarEmFrases(linhas.join("\n"));
}

/** Retorna segundos somente quando o passo declara uma única duração simples e explícita. */
export function detectarDuracaoSegundos(texto: string): number | undefined {
  if (/\d+\s*(?:a|até|[-–])\s*\d+/i.test(texto)) return undefined;
  const ocorrencias = [
    ...texto.matchAll(/(?<!\d)(\d{1,3})\s*(segundos?|secs?|s|minutos?|mins?|m|horas?|hrs?|h)\b/gi),
  ];
  if (ocorrencias.length !== 1) return undefined;

  const [, valorTexto, unidadeTexto] = ocorrencias[0] ?? [];
  const valor = Number(valorTexto);
  if (!Number.isInteger(valor) || valor <= 0) return undefined;
  const unidade = (unidadeTexto ?? "").toLocaleLowerCase("pt-BR");
  const multiplicador = /^(?:s|sec|secs|segundo|segundos)$/.test(unidade)
    ? 1
    : /^(?:h|hr|hrs|hora|horas)$/.test(unidade)
      ? 3_600
      : 60;
  const segundos = valor * multiplicador;
  return segundos <= 7_200 ? segundos : undefined;
}
