import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Loader2, UtensilsCrossed, BookPlus, X } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { receitasQuery, normalizar } from "@/lib/receitas";

export const Route = createFileRoute("/receitas/")({
  head: () => ({
    meta: [
      { title: "Receitas — Saborê" },
      {
        name: "description",
        content: "Mais de 500 receitas caseiras: bolos, doces, pães, carnes, acompanhamentos e mais.",
      },
      { property: "og:title", content: "Receitas — Saborê" },
      { property: "og:description", content: "Mais de 500 receitas caseiras organizadas por categoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lista,
});

const POR_PAGINA = 24;

function Lista() {
  const { data, isLoading, isError } = useQuery(receitasQuery);
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("Todas");
  const [qtd, setQtd] = useState(POR_PAGINA);

  const categorias = useMemo(() => ["Todas", ...new Set((data ?? []).map((r) => r.categoria))], [data]);

  const contagem = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data ?? []) m.set(r.categoria, (m.get(r.categoria) ?? 0) + 1);
    return m;
  }, [data]);

  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return (data ?? [])
      .filter(
        (r) => (cat === "Todas" || r.categoria === cat) && (!q || normalizar(r.nome + " " + r.texto).includes(q)),
      )
      .sort((a, b) => Number(!!b.imagem) - Number(!!a.imagem));
  }, [data, busca, cat]);

  const trocar = (c: string) => {
    setCat(c);
    setQtd(POR_PAGINA);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Receitas</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Escolha uma categoria ou procure por um ingrediente.
            </p>
          </div>
          <Link to="/nova-receita" className="btn-secondary h-14">
            <BookPlus className="h-5 w-5" aria-hidden />
            Adicionar receita
          </Link>
        </div>

        <label htmlFor="busca" className="mt-8 block text-lg font-semibold">
          Procurar receita ou ingrediente
        </label>
        <div className="relative mt-2">
          <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="busca"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setQtd(POR_PAGINA);
            }}
            placeholder="Ex.: bolo de cenoura, frango, coco"
            className="h-16 w-full rounded-xl border-2 border-input bg-card pl-14 pr-14 text-xl outline-none focus:border-primary"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar a busca"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          )}
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5" aria-label="Filtro por categoria">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Categorias</h2>
            {cat !== "Todas" && (
              <button
                type="button"
                onClick={() => trocar("Todas")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-1.5 text-base font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                <X className="h-4 w-4" aria-hidden /> Ver todas
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5" role="group" aria-label="Escolher categoria">
            {categorias.map((c) => {
              const ativo = cat === c;
              const n = c === "Todas" ? (data?.length ?? 0) : (contagem.get(c) ?? 0);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => trocar(c)}
                  aria-pressed={ativo}
                  className={`inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-base font-semibold transition-colors ${
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary hover:bg-secondary"
                  }`}
                >
                  {c}
                  <span
                    className={`rounded-full px-2 py-0.5 text-sm tabular-nums ${
                      ativo ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {isLoading && (
          <p className="mt-10 flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> Carregando receitas...
          </p>
        )}
        {isError && <p className="mt-10 text-lg text-destructive">Não foi possível carregar as receitas. Recarregue a página.</p>}
        {data && (
          <>
            <p className="mt-8 text-lg text-muted-foreground" aria-live="polite">
              {filtradas.length} {filtradas.length === 1 ? "receita encontrada" : "receitas encontradas"}
            </p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.slice(0, qtd).map((r) => (
                <li key={r.id}>
                  <Link
                    to="/receitas/$id"
                    params={{ id: r.id }}
                    className="block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:border-primary"
                  >
                    {r.imagem ? (
                      <img src={r.imagem} alt={r.nome} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-secondary">
                        <UtensilsCrossed className="h-12 w-12 text-primary" aria-hidden />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-base text-muted-foreground">{r.categoria}</p>
                      <h2 className="mt-1 font-display text-xl font-semibold">{r.nome}</h2>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {qtd < filtradas.length && (
              <div className="mt-8 text-center">
                <button className="btn-secondary h-16" onClick={() => setQtd((n) => n + POR_PAGINA)}>
                  Mostrar mais receitas
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
