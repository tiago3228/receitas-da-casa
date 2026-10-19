import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Loader2, UtensilsCrossed } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { receitasQuery, normalizar } from "@/lib/receitas";

export const Route = createFileRoute("/receitas/")({
  head: () => ({
    meta: [
      { title: "Receitas — Saborê" },
      { name: "description", content: "Mais de 500 receitas caseiras: bolos, doces, pães, carnes, acompanhamentos e mais." },
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
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return (data ?? []).filter(
      (r) => (cat === "Todas" || r.categoria === cat) && (!q || normalizar(r.nome + " " + r.texto).includes(q)),
    ).sort((a, b) => Number(!!b.imagem) - Number(!!a.imagem));
  }, [data, busca, cat]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Receitas</h1>
        <label htmlFor="busca" className="mt-6 block text-lg font-semibold">Procurar receita ou ingrediente</label>
        <div className="relative mt-2">
          <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="busca" value={busca}
            onChange={(e) => { setBusca(e.target.value); setQtd(POR_PAGINA); }}
            placeholder="Ex.: bolo de cenoura, frango, coco"
            className="h-16 w-full rounded-xl border-2 border-input bg-card pl-14 pr-5 text-xl outline-none focus:border-primary"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Categorias">
          {categorias.map((c) => (
            <button key={c} onClick={() => { setCat(c); setQtd(POR_PAGINA); }} aria-pressed={cat === c}
              className={cat === c ? "chip border-primary bg-primary text-primary-foreground hover:bg-primary" : "chip"}>
              {c}
            </button>
          ))}
        </div>

        {isLoading && <p className="mt-10 flex items-center gap-3 text-lg"><Loader2 className="h-6 w-6 animate-spin" /> Carregando receitas...</p>}
        {isError && <p className="mt-10 text-lg text-destructive">Não foi possível carregar as receitas. Recarregue a página.</p>}
        {data && (
          <>
            <p className="mt-8 text-lg text-muted-foreground" aria-live="polite">{filtradas.length} receitas encontradas</p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.slice(0, qtd).map((r) => (
                <li key={r.id}>
                  <Link to="/receitas/$id" params={{ id: r.id }} className="block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:border-primary">
                    {r.imagem ? (
                      <img src={r.imagem} alt={r.nome} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-secondary"><UtensilsCrossed className="h-12 w-12 text-primary" aria-hidden /></div>
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
                <button className="btn-secondary h-16" onClick={() => setQtd((n) => n + POR_PAGINA)}>Mostrar mais receitas</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
