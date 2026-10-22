import type { ItemListaCompras } from "@/lib/dados-pessoais";
import { normalizar, type CategoriaReceita, type ReceitaCatalogo } from "@/lib/catalogo";
import { extrairIngredientes } from "@/lib/receita-texto";
import { extrairTempoPreparo, type FaixaTempoPreparo } from "@/lib/tempo-preparo";

const PALAVRAS_IGNORADAS = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "no",
  "nos",
  "na",
  "nas",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "sem",
  "um",
  "uma",
  "uns",
  "umas",
  "meio",
  "meia",
  "dois",
  "duas",
  "tres",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
]);

const MEDIDAS = new Set([
  "kg",
  "g",
  "mg",
  "ml",
  "l",
  "quilo",
  "quilos",
  "grama",
  "gramas",
  "miligrama",
  "miligramas",
  "litro",
  "litros",
  "xicara",
  "xicaras",
  "colher",
  "colheres",
  "sopa",
  "cha",
  "sobremesa",
  "cafe",
  "copo",
  "copos",
  "lata",
  "latas",
  "caixa",
  "caixas",
  "caixinha",
  "caixinhas",
  "dente",
  "dentes",
  "unidade",
  "unidades",
  "pacote",
  "pacotes",
  "tablete",
  "tabletes",
  "envelope",
  "envelopes",
  "sache",
  "saches",
  "bandeja",
  "bandejas",
  "fatia",
  "fatias",
  "pitada",
  "pitadas",
  "ramo",
  "ramos",
  "maco",
  "macos",
  "punhado",
  "punhados",
  "vidro",
  "vidros",
  "frasco",
  "frascos",
]);

const PREPAROS_IGNORADOS = new Set([
  "picado",
  "picada",
  "picados",
  "picadas",
  "cortado",
  "cortada",
  "cortados",
  "cortadas",
  "fatiado",
  "fatiada",
  "fatiados",
  "fatiadas",
  "ralado",
  "ralada",
  "ralados",
  "raladas",
  "moido",
  "moida",
  "triturado",
  "triturada",
  "amassado",
  "amassada",
  "cozido",
  "cozida",
  "cozidos",
  "cozidas",
  "descascado",
  "descascada",
  "derretido",
  "derretida",
  "batido",
  "batida",
  "fresco",
  "fresca",
  "frescos",
  "frescas",
  "maduro",
  "madura",
  "maduros",
  "maduras",
  "gelado",
  "gelada",
  "opcional",
  "opcionais",
  "inteiro",
  "inteira",
  "inteiros",
  "inteiras",
  "cubos",
  "rodelas",
  "julienne",
  "gosto",
  "baste",
]);

const ALIASES_INGREDIENTES: Record<string, string> = {
  salsinha: "salsa",
};

const CATEGORIAS_SOBREMESA = new Set<CategoriaReceita>([
  "Bolos, tortas doces e cupcakes",
  "Doces, sobremesas e doces de festa",
  "Biscoitos e bolachas",
]);

const SINAIS_RECEITA_SALGADA =
  /\b(?:salgad[oa]s?|frango|galinha|carne|queijo|bacon|presunto|linguica|calabresa|atum|sardinha|bacalhau|peixe|camarao|legumes|quiche|pizza|empada|esfiha|polvilho)\b/;
const SINAIS_NOME_SOBREMESA =
  /\b(?:bolo|torta|pudim|mousse|brigadeiro|doce|sobremesa|biscoito|bolacha|brownie|chocolate|pave|rocambole|cupcake|cookie|cheesecake|sorvete|panqueca doce)\b/;

const INGREDIENTE_ANIMAL =
  /\b(?:carne|frango|galinha|pato|peru|bacon|presunto|linguica|calabresa|salame|mortadela|salsicha|costela|picanha|alcatra|patinho|maminha|cupim|figado|peixe|atum|sardinha|salmao|bacalhau|tilapia|camarao|siri|caranguejo|lagosta|marisco|ostra|mexilhao|polvo|lula|anchova|gelatina)\b/;

export type CategoriaFiltroRecomendacao = "todas" | "vegetariana" | "sobremesa" | CategoriaReceita;

export type TempoFiltroRecomendacao = "qualquer" | number;

export type RecomendacaoReceita = {
  receita: ReceitaCatalogo;
  ingredientesDisponiveis: number;
  totalIngredientes: number;
  percentualDisponivel: number;
  nomesDisponiveis: string[];
  nomesFaltando: string[];
  vegetariana: boolean;
  tempoPreparo: FaixaTempoPreparo | undefined;
};

function ehVegetariana(receita: ReceitaCatalogo, ingredientes: string[]): boolean {
  const texto = normalizar(`${receita.nome} ${ingredientes.join(" ")}`)
    .replace(
      /\b(?:carne\s+(?:de\s+)?(?:soja|jaca|vegetal)|proteina(?:\s+texturizada)?\s+de\s+soja)\b/g,
      " ",
    )
    .replace(/\bgelatina\s+vegetal\b/g, " ");
  return !INGREDIENTE_ANIMAL.test(texto);
}

function ehSobremesa(receita: ReceitaCatalogo, ingredientes: string[]): boolean {
  const contexto = normalizar(`${receita.nome} ${ingredientes.join(" ")}`);
  if (SINAIS_RECEITA_SALGADA.test(contexto)) return false;
  if (CATEGORIAS_SOBREMESA.has(receita.categoria)) return true;
  return SINAIS_NOME_SOBREMESA.test(normalizar(receita.nome));
}

function normalizarNomeIngrediente(texto: string): string[] {
  const preparado = normalizar(texto)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g, " ")
    .replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, " ")
    .replace(/\b(?:a gosto|quanto baste|a vontade|para untar|para decorar)\b/g, " ")
    .replace(/\bsem\s+(?:caroco|casca|pele|sementes?|soro|sal|osso)\b/g, " ")
    .replace(/\bem\s+(?:cubos|rodelas|fatias|pedacos)\b/g, " ")
    .replace(/[^\p{L}\s,;/]+/gu, " ");

  const chaves = preparado
    .split(/\s+(?:e|ou)\s+|[,;/]/)
    .map((parte) =>
      parte
        .split(/\s+/)
        .map((palavra) => palavra.trim())
        .filter(
          (palavra) =>
            palavra.length > 1 &&
            !PALAVRAS_IGNORADAS.has(palavra) &&
            !MEDIDAS.has(palavra) &&
            !PREPAROS_IGNORADOS.has(palavra),
        )
        .map((palavra) => {
          let singular = palavra;
          if (singular.endsWith("oes") || singular.endsWith("aes")) {
            singular = `${singular.slice(0, -3)}ao`;
          } else if (singular.endsWith("is") && singular.length > 4) {
            singular = `${singular.slice(0, -2)}il`;
          } else if (singular.endsWith("s") && singular.length > 3) {
            singular = singular.slice(0, -1);
          }
          return ALIASES_INGREDIENTES[singular] ?? singular;
        })
        .join(" "),
    )
    .filter(Boolean);

  return [...new Set(chaves)];
}

export function recomendarReceitas(
  receitas: ReceitaCatalogo[],
  itens: Pick<ItemListaCompras, "ingrediente" | "ja_tem">[],
  limite = 6,
): RecomendacaoReceita[] {
  if (!Number.isFinite(limite) || limite <= 0) return [];
  const disponiveis = new Set(
    itens
      .filter((item) => item.ja_tem)
      .flatMap((item) => normalizarNomeIngrediente(item.ingrediente)),
  );
  if (disponiveis.size === 0) return [];

  return receitas
    .flatMap((receita) => {
      const linhas = extrairIngredientes(receita.texto).map((nome) => ({
        nome,
        chaves: normalizarNomeIngrediente(nome),
      }));
      const todasAsChaves = [...new Set(linhas.flatMap((linha) => linha.chaves))];
      if (todasAsChaves.length === 0) return [];

      const chavesDisponiveis = todasAsChaves.filter((chave) => disponiveis.has(chave));
      if (chavesDisponiveis.length === 0) return [];
      const nomesDisponiveis = [
        ...new Set(
          linhas
            .filter((linha) => linha.chaves.some((chave) => disponiveis.has(chave)))
            .map((linha) => linha.nome),
        ),
      ];
      const nomesFaltando = [
        ...new Set(
          linhas
            .filter(
              (linha) =>
                linha.chaves.length > 0 && linha.chaves.every((chave) => !disponiveis.has(chave)),
            )
            .map((linha) => linha.nome),
        ),
      ];
      const percentualDisponivel = Math.round(
        (chavesDisponiveis.length / todasAsChaves.length) * 100,
      );

      return [
        {
          receita,
          ingredientesDisponiveis: chavesDisponiveis.length,
          totalIngredientes: todasAsChaves.length,
          percentualDisponivel,
          nomesDisponiveis,
          nomesFaltando: nomesFaltando.slice(0, 4),
          vegetariana: ehVegetariana(
            receita,
            linhas.map((linha) => linha.nome),
          ),
          tempoPreparo: extrairTempoPreparo(receita.texto),
        },
      ];
    })
    .sort(
      (a, b) =>
        b.percentualDisponivel - a.percentualDisponivel ||
        b.ingredientesDisponiveis - a.ingredientesDisponiveis ||
        a.totalIngredientes - b.totalIngredientes ||
        a.receita.nome.localeCompare(b.receita.nome, "pt-BR"),
    )
    .slice(0, Math.floor(limite));
}

export function filtrarRecomendacoes(
  recomendacoes: RecomendacaoReceita[],
  categoria: CategoriaFiltroRecomendacao,
  tempoMaximoMinutos: TempoFiltroRecomendacao,
): RecomendacaoReceita[] {
  if (
    tempoMaximoMinutos !== "qualquer" &&
    (!Number.isFinite(tempoMaximoMinutos) || tempoMaximoMinutos < 0)
  ) {
    return [];
  }

  return recomendacoes.filter((recomendacao) => {
    const receita = recomendacao.receita;
    if (categoria === "vegetariana" && !recomendacao.vegetariana) return false;
    if (
      categoria === "sobremesa" &&
      !ehSobremesa(receita, recomendacao.nomesFaltando.concat(recomendacao.nomesDisponiveis))
    ) {
      return false;
    }
    if (
      categoria !== "todas" &&
      categoria !== "vegetariana" &&
      categoria !== "sobremesa" &&
      receita.categoria !== categoria
    ) {
      return false;
    }

    if (tempoMaximoMinutos !== "qualquer") {
      const maximo = recomendacao.tempoPreparo?.maximoMinutos;
      if (maximo === undefined || maximo > tempoMaximoMinutos) return false;
    }
    return true;
  });
}
