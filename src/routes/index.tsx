import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X, Sparkles, Clock, Repeat, Loader2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { sugerirReceitas, type Sugestao } from "@/lib/sugestoes.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saborê — O que cozinhar com o que você tem" },
      { name: "description", content: "Diga os ingredientes que tem em casa e receba receitas simples e trocas práticas." },
      { property: "og:title", content: "Saborê — O que cozinhar com o que você tem" },
      { property: "og:description", content: "Receitas simples e trocas práticas a partir dos ingredientes da sua casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUGESTOES_RAPIDAS = ["Ovo", "Arroz", "Tomate", "Cebola", "Frango", "Batata", "Leite", "Farinha"];

function Index() {
  const sugerir = useServerFn(sugerirReceitas);
  const [texto, setTexto] = useState("");
  const [lista, setLista] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [receitas, setReceitas] = useState<Sugestao[]>([]);

  const adicionar = (v: string) => {
    const novos = v.split(",").map((s) => s.trim()).filter(Boolean);
    setLista((l) => [...l, ...novos.filter((n) => !l.some((x) => x.toLowerCase() === n.toLowerCase()))]);
    setTexto("");
  };

  const buscar = async () => {
    setCarregando(true);
    setErro("");
    setReceitas([]);
    try {
      const r = await sugerir({ data: { ingredientes: lista } });
      if (r.erro) setErro(r.erro);
      else if (r.sugestoes.length === 0) setErro("Nenhuma receita encontrada. Tente adicionar mais ingredientes.");
      setReceitas(r.sugestoes);
    } catch {
      setErro("Não conseguimos sugerir receitas agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">O que você tem em casa?</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Escreva os ingredientes e toque em <strong>Adicionar</strong>. Depois, peça receitas.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); if (texto.trim()) adicionar(texto); }}
        >
          <label htmlFor="ing" className="sr-only">Ingrediente</label>
          <input
            id="ing"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: ovo, tomate, queijo"
            className="h-16 flex-1 rounded-xl border-2 border-input bg-card px-5 text-xl outline-none focus:border-primary"
          />
          <button type="submit" className="btn-secondary h-16">
            <Plus className="h-6 w-6" aria-hidden /> Adicionar
          </button>
        </form>

        <div className="mt-5">
          <p className="text-base text-muted-foreground">Toque para adicionar rápido:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGESTOES_RAPIDAS.filter((s) => !lista.includes(s)).map((s) => (
              <button key={s} onClick={() => adicionar(s)} className="chip">+ {s}</button>
            ))}
          </div>
        </div>

        {lista.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl font-semibold">Seus ingredientes ({lista.length})</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {lista.map((i) => (
                <li key={i} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-lg">
                  {i}
                  <button onClick={() => setLista((l) => l.filter((x) => x !== i))} aria-label={`Remover ${i}`} className="rounded-full p-1 hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={buscar} disabled={carregando} className="btn-primary mt-6 w-full sm:w-auto">
              {carregando ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Sparkles className="h-6 w-6" aria-hidden />}
              {carregando ? "Pensando nas receitas..." : "Sugerir receitas"}
            </button>
          </section>
        )}

        <div aria-live="polite">
          {erro && <p className="mt-6 rounded-xl border-2 border-destructive bg-card p-4 text-lg text-destructive">{erro}</p>}
          {receitas.length > 0 && (
            <section className="mt-10 space-y-6">
              <h2 className="font-display text-2xl font-semibold">Receitas para você</h2>
              {receitas.map((r) => (
                <article key={r.nome} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="font-display text-2xl font-bold text-primary">{r.nome}</h3>
                  <p className="mt-2 text-lg">{r.descricao}</p>
                  <p className="mt-2 flex items-center gap-2 text-base text-muted-foreground"><Clock className="h-5 w-5" aria-hidden /> {r.tempo}</p>
                  {r.faltam?.length > 0 && <p className="mt-4 text-lg"><strong>Também precisa:</strong> {r.faltam.join(", ")}</p>}
                  {r.substituicoes?.length > 0 && (
                    <div className="mt-4 rounded-xl bg-accent p-4">
                      <p className="flex items-center gap-2 text-lg font-semibold"><Repeat className="h-5 w-5" aria-hidden /> Trocas práticas</p>
                      <ul className="mt-2 space-y-1 text-lg">
                        {r.substituicoes.map((s) => <li key={s.falta}>Sem <strong>{s.falta}</strong>? Use {s.troca.replace(/\.+$/, "").replace(/^./, (c) => c.toLowerCase())}.</li>)}
                      </ul>
                    </div>
                  )}
                  <h4 className="mt-5 text-xl font-semibold">Modo de preparo</h4>
                  <ol className="mt-2 space-y-3">
                    {r.passos.map((p, i) => (
                      <li key={i} className="flex gap-3 text-lg">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
              <p className="text-base text-muted-foreground">Sugestões criadas por inteligência artificial. Confira os ingredientes antes de cozinhar.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
