import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { receitasQuery, ehTitulo } from "@/lib/receitas";

export const Route = createFileRoute("/receitas/$id")({
  head: () => ({
    meta: [
      { title: "Receita — Saborê" },
      { name: "description", content: "Ingredientes e modo de preparo explicados de forma simples." },
      { property: "og:title", content: "Receita — Saborê" },
      { property: "og:description", content: "Ingredientes e modo de preparo explicados de forma simples." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detalhe,
});

function Detalhe() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(receitasQuery);
  const r = data?.find((x) => x.id === id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/receitas" className="btn-secondary h-14"><ArrowLeft className="h-6 w-6" aria-hidden /> Voltar para receitas</Link>
        {isLoading && <p className="mt-10 flex items-center gap-3 text-lg"><Loader2 className="h-6 w-6 animate-spin" /> Carregando...</p>}
        {data && !r && <p className="mt-10 text-xl">Receita não encontrada.</p>}
        {r && (
          <article className="mt-6">
            <p className="text-lg text-muted-foreground">{r.categoria}</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{r.nome}</h1>
            {r.imagem && <img src={r.imagem} alt={r.nome} className="mt-6 max-h-[28rem] w-full rounded-2xl object-cover shadow-soft" />}
            <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8">
              {r.texto.split("\n\n").map((p, i) =>
                ehTitulo(p) ? (
                  <h2 key={i} className="pt-4 font-display text-2xl font-semibold text-primary first:pt-0">{p.replace(/:$/, "")}</h2>
                ) : (
                  <p key={i} className="text-xl leading-relaxed">{p}</p>
                ),
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
