import { normalizar } from "@/lib/catalogo";

export type FaixaTempoPreparo = {
  minimoMinutos: number;
  maximoMinutos?: number;
};

const EXPRESSAO_UNIDADE = "(?:horas?|hrs?|h|minutos?|mins?|min|m)";
const EXPRESSAO_NUMERO = "(\\d+(?:[.,]\\d+)?)";
const DURACAO = new RegExp(`${EXPRESSAO_NUMERO}\\s*(${EXPRESSAO_UNIDADE})(?![a-z])`, "giu");
const INTERVALO = new RegExp(
  `(?:\\b(?:de|entre)\\s+)?${EXPRESSAO_NUMERO}\\s*(${EXPRESSAO_UNIDADE})?\\s*(?:a|ate|[-–])\\s*${EXPRESSAO_NUMERO}\\s*(${EXPRESSAO_UNIDADE})(?![a-z])`,
  "iu",
);

function paraMinutos(valor: string, unidade: string): number {
  const numero = Number(valor.replace(",", "."));
  const minutos = /^(?:h|hr|hrs|hora|horas)$/i.test(unidade) ? numero * 60 : numero;
  return Math.ceil(minutos);
}

function faixa(minimo: number, maximo?: number): FaixaTempoPreparo | undefined {
  if (!Number.isFinite(minimo) || minimo < 0) return undefined;
  if (maximo !== undefined && (!Number.isFinite(maximo) || maximo < minimo)) return undefined;
  return maximo === undefined
    ? { minimoMinutos: minimo }
    : { minimoMinutos: minimo, maximoMinutos: maximo };
}

export function extrairTempoPreparo(texto: string): FaixaTempoPreparo | undefined {
  const rotulo = /tempo\s+de\s+preparo\s*:?/i.exec(texto);
  if (!rotulo) return undefined;

  const inicio = (rotulo.index ?? 0) + rotulo[0].length;
  const restante = texto.slice(inicio);
  const fim = restante.search(/(?:\||\r|\n|\b(?:rendimento|serve|por[cç][oõ]es?)\b)/i);
  const trecho = normalizar((fim < 0 ? restante : restante.slice(0, fim)).trim());
  if (!trecho) return undefined;

  const intervalo = INTERVALO.exec(trecho);
  if (intervalo) {
    const primeiroNumero = intervalo[1];
    const primeiraUnidade = intervalo[2] || intervalo[4];
    const segundoNumero = intervalo[3];
    const segundaUnidade = intervalo[4];
    if (!primeiroNumero || !primeiraUnidade || !segundoNumero || !segundaUnidade) return undefined;
    const primeiro = paraMinutos(primeiroNumero, primeiraUnidade);
    const segundo = paraMinutos(segundoNumero, segundaUnidade);
    return faixa(Math.min(primeiro, segundo), Math.max(primeiro, segundo));
  }

  const compacto =
    /^\s*(\d+(?:[.,]\d+)?)\s*h(?:oras?)?\s*(\d{1,2})\s*(?:m|min|minutos?)?\s*$/i.exec(trecho);
  if (compacto?.[1] && compacto[2]) {
    const total = Math.ceil(Number(compacto[1].replace(",", ".")) * 60) + Number(compacto[2]);
    return faixa(total, total);
  }

  const duracoes = [...trecho.matchAll(DURACAO)];
  if (!duracoes.length || duracoes.length > 2) return undefined;

  const qualificadores = trecho.slice(0, duracoes[0]?.index ?? 0).trim();
  const primeiroValor = duracoes[0]?.[1];
  const primeiraUnidade = duracoes[0]?.[2];
  if (!primeiroValor || !primeiraUnidade) return undefined;
  const primeiraDuracao = paraMinutos(primeiroValor, primeiraUnidade);

  if (/\bmais\s+de\s*$/.test(qualificadores)) return faixa(primeiraDuracao);
  if (/\b(?:menos\s+de|ate)\s*$/.test(qualificadores)) return faixa(0, primeiraDuracao);

  if (duracoes.length === 1) {
    if (/\bde\s*$/.test(qualificadores)) return undefined;
    return faixa(primeiraDuracao, primeiraDuracao);
  }

  const segunda = duracoes[1];
  const segundoValor = segunda?.[1];
  const segundaUnidade = segunda?.[2];
  if (!segundoValor || !segundaUnidade) return undefined;

  const fimPrimeira = (duracoes[0]?.index ?? 0) + (duracoes[0]?.[0].length ?? 0);
  const intervaloEntre = trecho.slice(fimPrimeira, segunda.index ?? fimPrimeira).trim();
  const ehHoraEMinuto =
    /^(?:h|hr|hrs|hora|horas)$/.test(primeiraUnidade) &&
    /^(?:m|min|mins|minuto|minutos)$/.test(segundaUnidade);
  if (!ehHoraEMinuto || !/^(?:e)?$/.test(intervaloEntre)) return undefined;

  const total = primeiraDuracao + paraMinutos(segundoValor, segundaUnidade);
  return faixa(total, total);
}

function formatarMinutos(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export function formatarTempoPreparo(tempo?: FaixaTempoPreparo): string {
  if (!tempo) return "Tempo não informado";
  if (tempo.maximoMinutos === undefined) return `Mais de ${formatarMinutos(tempo.minimoMinutos)}`;
  if (tempo.minimoMinutos === 0) return `Até ${formatarMinutos(tempo.maximoMinutos)}`;
  if (tempo.minimoMinutos === tempo.maximoMinutos) return formatarMinutos(tempo.maximoMinutos);
  return `${formatarMinutos(tempo.minimoMinutos)}–${formatarMinutos(tempo.maximoMinutos)}`;
}
