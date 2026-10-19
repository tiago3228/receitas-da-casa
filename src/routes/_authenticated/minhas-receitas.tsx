import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookPlus, Clock, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { apagarMinhaReceita, minhasReceitasQueryOptions } from "@/lib/receitas-autorais.functions";

export const Route = createFileRoute("/_authenticated/minhas-receitas")({
  head: () => ({
    meta: [
      { title: "Minhas receitas — Saborê" },
      { name: "description", content: "As receitas que você guardou no Saborê." },
      { property: "og:title", content: "Minhas receitas — Saborê" },
      { property: "og:description", content: "Sua lista de receitas guardadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MinhasReceitas,
});

function MinhasReceitas() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(minhasReceitasQueryOptions);
  const apagar = useServerFn(apagarMinhaReceita);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const remover = async (id: string) => {
    setErro("");
    setConfirmar(null);
    setRemovendoId(id);
    try {
      await apagar({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["minhas-receitas"] });
    } catch {
      setErro("Não consegui remover agora. Tente de novo.");
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Minhas receitas</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {data?.length
                ? `${data.length} ${data.length === 1 ? "receita guardada" : "receitas guardadas"}`
                : "As receitas que você adicionar ficam aqui."}
            </p>
          </div>
          <Link to="/nova-receita" className="btn-primary">
            <BookPlus className="h-6 w-6" aria-hidden />
            Adicionar receita
          </Link>
        </div>

        {erro && (
          <p
            className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
            role="alert"
          >
            {erro}
          </p>
        )}

        {isLoading && (
          <p className="mt-10 flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> Carregando as suas receitas...
          </p>
        )}
        {isError && (
          <p
            className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
            role="alert"
          >
            Não foi possível carregar suas receitas. Verifique a conexão e tente novamente.
          </p>
        )}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-semibold">Sua lista está vazia</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Escreva uma receita do jeito que você tem no caderno — a gente organiza os
              ingredientes e as etapas.
            </p>
            <Link to="/nova-receita" className="btn-primary mt-6">
              <BookPlus className="h-6 w-6" aria-hidden />
              Adicionar a primeira receita
            </Link>
          </div>
        )}

        <ul className="mt-8 space-y-4">
          {(data ?? []).map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setAberta((a) => (a === r.id ? null : r.id))}
                  aria-expanded={aberta === r.id}
                >
                  <p className="text-base text-muted-foreground">{r.categoria}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{r.titulo}</h2>
                  {r.tempo && (
                    <p className="mt-2 inline-flex items-center gap-2 text-lg text-muted-foreground">
                      <Clock className="h-5 w-5" aria-hidden /> {r.tempo}
                    </p>
                  )}
                  <p className="mt-2 text-lg font-semibold text-primary">
                    {aberta === r.id ? "Ocultar" : "Ver receita"}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <Link
                    to="/nova-receita"
                    search={{ id: r.id }}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-border px-4 py-2 text-lg font-semibold hover:border-primary"
                  >
                    <Pencil className="h-5 w-5" aria-hidden /> Editar
                  </Link>
                  {confirmar === r.id ? (
                    <>
                      <button
                        type="button"
                        className="rounded-xl border-2 border-destructive px-4 py-2 text-lg font-semibold text-destructive"
                        onClick={() => remover(r.id)}
                        disabled={removendoId === r.id}
                      >
                        {removendoId === r.id ? "Removendo..." : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border-2 border-border px-4 py-2 text-lg font-semibold"
                        onClick={() => setConfirmar(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 text-lg font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
                      onClick={() => setConfirmar(r.id)}
                      disabled={removendoId === r.id}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {aberta === r.id && (
                <div className="border-t border-border p-5">
                  {r.rendimento && (
                    <p className="text-lg text-muted-foreground">Rende: {r.rendimento}</p>
                  )}
                  {r.ingredientes && (
                    <>
                      <h3 className="mt-4 font-display text-xl font-semibold">Ingredientes</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-6 text-lg">
                        {r.ingredientes
                          .split("\n")
                          .filter(Boolean)
                          .map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                      </ul>
                    </>
                  )}
                  {r.modo_de_preparo && (
                    <>
                      <h3 className="mt-6 font-display text-xl font-semibold">Modo de preparo</h3>
                      <ol className="mt-2 list-decimal space-y-2 pl-6 text-lg">
                        {r.modo_de_preparo
                          .split("\n")
                          .filter(Boolean)
                          .map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                      </ol>
                    </>
                  )}
                  {r.observacoes && (
                    <p className="mt-6 rounded-xl bg-secondary p-4 text-lg">
                      <strong>Observações:</strong> {r.observacoes}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
