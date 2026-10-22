import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChefHat, Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImagemReceita } from "@/components/ImagemReceita";
import type { ItemListaCompras } from "@/lib/dados-pessoais";
import { CATEGORIAS_RECEITAS } from "@/lib/catalogo";
import { receitasQuery } from "@/lib/receitas";
import {
  filtrarRecomendacoes,
  recomendarReceitas,
  type CategoriaFiltroRecomendacao,
  type TempoFiltroRecomendacao,
} from "@/lib/recomendacoes";
import { formatarTempoPreparo } from "@/lib/tempo-preparo";

type Props = {
  itens: Pick<ItemListaCompras, "ingrediente" | "ja_tem">[];
};

const OPÇÕES_TEMPO = [
  { valor: 30, texto: "Até 30 min" },
  { valor: 60, texto: "Até 1 h" },
  { valor: 90, texto: "Até 1 h 30 min" },
  { valor: 120, texto: "Até 2 h" },
] as const;

export function ReceitasRecomendadas({ itens }: Props) {
  const [categoria, setCategoria] = useState<CategoriaFiltroRecomendacao>("todas");
  const [tempoMaximo, setTempoMaximo] = useState<TempoFiltroRecomendacao>("qualquer");
  const temItensMarcados = itens.some((item) => item.ja_tem && item.ingrediente.trim());
  const catalogo = useQuery({ ...receitasQuery, enabled: temItensMarcados });
  const candidatas = useMemo(
    () => (catalogo.data ? recomendarReceitas(catalogo.data, itens, catalogo.data.length) : []),
    [catalogo.data, itens],
  );
  const recomendacoes = useMemo(
    () => filtrarRecomendacoes(candidatas, categoria, tempoMaximo).slice(0, 6),
    [candidatas, categoria, tempoMaximo],
  );
  const filtrosAlterados = categoria !== "todas" || tempoMaximo !== "qualquer";

  const limparFiltros = () => {
    setCategoria("todas");
    setTempoMaximo("qualquer");
  };

  return (
    <section className="mt-12 border-t border-border pt-9" aria-labelledby="titulo-recomendacoes">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary/10 p-3 text-primary" aria-hidden>
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h2 id="titulo-recomendacoes" className="font-display text-2xl font-bold md:text-3xl">
            Receitas para aproveitar o que você tem
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sugestões calculadas a partir dos itens marcados como “Já tenho” ou “já comprei”.
          </p>
        </div>
      </div>

      {!temItensMarcados ? (
        <p
          className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5"
          role="status"
        >
          Marque pelo menos um ingrediente como “Já tenho” para encontrar receitas que o utilizam.
        </p>
      ) : catalogo.isLoading ? (
        <p
          className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-5"
          role="status"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          Procurando receitas para seus ingredientes...
        </p>
      ) : catalogo.isError ? (
        <p className="mt-5 rounded-2xl border border-destructive p-5 text-destructive" role="alert">
          Não foi possível carregar as receitas para montar recomendações. Tente novamente mais
          tarde.
        </p>
      ) : candidatas.length === 0 ? (
        <p
          className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5"
          role="status"
        >
          Ainda não encontramos receitas para os ingredientes marcados. Experimente marcar outros
          itens como “Já tenho”.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold" htmlFor="filtro-categoria-recomendacoes">
              Tipo ou categoria
              <select
                id="filtro-categoria-recomendacoes"
                value={categoria}
                onChange={(evento) =>
                  setCategoria(evento.target.value as CategoriaFiltroRecomendacao)
                }
                className="mt-2 h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base font-normal focus:border-primary focus:outline-none"
              >
                <option value="todas">Todos os tipos</option>
                <option value="vegetariana">Vegetarianas</option>
                <option value="sobremesa">Sobremesas</option>
                {CATEGORIAS_RECEITAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold" htmlFor="filtro-tempo-recomendacoes">
              Tempo máximo de preparo
              <select
                id="filtro-tempo-recomendacoes"
                value={tempoMaximo === "qualquer" ? "qualquer" : String(tempoMaximo)}
                onChange={(evento) =>
                  setTempoMaximo(
                    evento.target.value === "qualquer" ? "qualquer" : Number(evento.target.value),
                  )
                }
                className="mt-2 h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-base font-normal focus:border-primary focus:outline-none"
              >
                <option value="qualquer">Qualquer duração</option>
                {OPÇÕES_TEMPO.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.texto}
                  </option>
                ))}
              </select>
            </label>
            {filtrosAlterados && (
              <button
                type="button"
                className="min-h-11 justify-self-start text-sm font-semibold text-primary underline underline-offset-2 sm:col-span-2"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
            <p className="text-xs text-muted-foreground sm:col-span-2">
              “Vegetariana” é uma estimativa automática pelo nome e ingredientes identificados;
              confira sempre a receita e os rótulos. Um limite de tempo só inclui receitas com
              duração máxima explícita e compatível.
            </p>
          </div>

          {recomendacoes.length === 0 ? (
            <div
              className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5"
              role="status"
            >
              <p>Nenhuma sugestão corresponde a esses filtros.</p>
              {tempoMaximo !== "qualquer" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Receitas sem limite de preparo verificável ficam de fora dos filtros de tempo.
                </p>
              )}
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-primary underline underline-offset-2"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm text-muted-foreground">
                Mostrando até seis opções, ordenadas pela proporção de ingredientes disponíveis.
                Confira os demais itens no detalhe da receita.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {recomendacoes.map((recomendacao) => {
                  const receita = recomendacao.receita;
                  return (
                    <li key={receita.id}>
                      <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                        <ImagemReceita
                          src={receita.imagem}
                          alt={
                            receita.imagemIlustrativa
                              ? `Ilustração de ${receita.nome}`
                              : receita.nome
                          }
                          className="aspect-[16/9]"
                        />
                        {receita.imagemIlustrativa && (
                          <p className="px-4 pt-2 text-xs text-muted-foreground">
                            Imagem ilustrativa gerada por IA
                          </p>
                        )}
                        <div className="p-4">
                          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                            <ChefHat className="h-4 w-4 text-primary" aria-hidden />
                            {recomendacao.percentualDisponivel}% disponível ·{" "}
                            {recomendacao.ingredientesDisponiveis}/{recomendacao.totalIngredientes}{" "}
                            ingredientes
                          </p>
                          <h3 className="mt-3 font-display text-xl font-semibold">
                            {receita.nome}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {receita.categoria} · {formatarTempoPreparo(recomendacao.tempoPreparo)}
                            {recomendacao.vegetariana ? " · Sem carne identificada" : ""}
                          </p>
                          {recomendacao.nomesDisponiveis.length > 0 && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              Você marcou: {recomendacao.nomesDisponiveis.slice(0, 3).join(", ")}
                              {recomendacao.nomesDisponiveis.length > 3 ? "…" : ""}
                            </p>
                          )}
                          <Link
                            to="/receitas/$id"
                            params={{ id: receita.id }}
                            className="btn-secondary mt-4 min-h-12 w-full justify-center"
                            aria-label={`Ver receita ${receita.nome}`}
                          >
                            Ver receita <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
