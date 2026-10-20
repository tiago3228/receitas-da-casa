import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChefHat, Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImagemReceita } from "@/components/ImagemReceita";
import type { ItemListaCompras } from "@/lib/dados-pessoais";
import { receitasQuery } from "@/lib/receitas";
import { recomendarReceitas } from "@/lib/recomendacoes";

type Props = {
  itens: ItemListaCompras[];
};

export function ReceitasRecomendadas({ itens }: Props) {
  const temItensMarcados = itens.some((item) => item.ja_tem && item.ingrediente.trim());
  const catalogo = useQuery({ ...receitasQuery, enabled: temItensMarcados });
  const recomendacoes = useMemo(
    () => (catalogo.data ? recomendarReceitas(catalogo.data, itens, 6) : []),
    [catalogo.data, itens],
  );

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
      ) : recomendacoes.length === 0 ? (
        <p
          className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5"
          role="status"
        >
          Ainda não encontramos receitas para os ingredientes marcados. Experimente marcar outros
          itens como “Já tenho”.
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted-foreground">
            Ordenadas pela proporção de ingredientes disponíveis. Confira o que falta no detalhe da
            receita.
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
                        receita.imagemIlustrativa ? `Ilustração de ${receita.nome}` : receita.nome
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
                      <h3 className="mt-3 font-display text-xl font-semibold">{receita.nome}</h3>
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
    </section>
  );
}
