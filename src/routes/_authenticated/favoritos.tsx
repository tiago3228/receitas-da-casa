import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Loader2, Trash2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { ImagemReceita } from "@/components/ImagemReceita";
import { useFavoritos } from "@/lib/dados-pessoais";
import { receitasQuery } from "@/lib/receitas";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Saborê" },
      { name: "description", content: "Receitas que você guardou nos seus favoritos." },
      { property: "og:title", content: "Favoritos — Saborê" },
      { property: "og:description", content: "As receitas que você marcou para guardar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { ids, carregando: carregandoFavoritos, erro, removerVarios, removendo } = useFavoritos();
  const {
    data: receitas,
    isLoading: carregandoReceitas,
    isError: erroReceitas,
  } = useQuery(receitasQuery);
  const salvas = (receitas ?? []).flatMap((receita) => {
    const idsFavoritos = ids.filter(
      (id) => id === receita.id || (receita.aliases ?? []).includes(id),
    );
    return idsFavoritos.length ? [{ receita, idsFavoritos }] : [];
  });
  const carregando = carregandoFavoritos || carregandoReceitas;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Meus favoritos</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {salvas.length} {salvas.length === 1 ? "receita guardada" : "receitas guardadas"}
            </p>
          </div>
          <Link to="/receitas" className="btn-secondary h-14">
            <ArrowLeft className="h-5 w-5" aria-hidden /> Voltar para receitas
          </Link>
        </div>

        {erro && (
          <p
            className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
            role="alert"
          >
            Não foi possível carregar os favoritos. Confirme que aplicou a migration SQL no Lovable
            e tente novamente.
          </p>
        )}
        {carregando && (
          <p className="mt-10 flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> Carregando seus favoritos...
          </p>
        )}
        {erroReceitas && (
          <p
            className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
            role="alert"
          >
            Não foi possível carregar o catálogo de receitas. Tente novamente.
          </p>
        )}
        {!carregando && !erro && !erroReceitas && salvas.length === 0 && (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
            <Heart className="mx-auto h-12 w-12 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-semibold">Sua lista ainda está vazia</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Toque em “Favoritar” em qualquer receita e ela ficará guardada aqui.
            </p>
            <Link to="/receitas" className="btn-primary mt-6">
              <ArrowLeft className="h-5 w-5" aria-hidden /> Explorar receitas
            </Link>
          </div>
        )}

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {salvas.map(({ receita, idsFavoritos }) => (
            <li
              key={receita.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <Link to="/receitas/$id" params={{ id: receita.id }} className="block">
                <ImagemReceita src={receita.imagem} alt={receita.nome} />
                <div className="p-5 pb-2">
                  <p className="text-base text-muted-foreground">{receita.categoria}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{receita.nome}</h2>
                </div>
              </Link>
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => removerVarios(idsFavoritos)}
                  disabled={removendo}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-border px-4 font-semibold text-destructive hover:border-destructive disabled:opacity-60"
                >
                  <Trash2 className="h-5 w-5" aria-hidden /> Remover dos favoritos
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
