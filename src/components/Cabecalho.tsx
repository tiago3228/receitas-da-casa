import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChefHat, BookOpen, Sparkles, UtensilsCrossed } from "lucide-react";
import { receitasQuery } from "@/lib/receitas";

// Sobe de 0 até o total quando os dados chegam (não roda no servidor).
function useContagem(alvo: number | undefined) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (alvo == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(alvo);
      return;
    }
    let id = 0;
    const inicio = performance.now();
    const duracao = 700;
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      setValor(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [alvo]);
  return valor;
}

export function Cabecalho() {
  const item = "flex items-center gap-2 rounded-xl px-4 py-3 text-lg font-semibold text-foreground hover:bg-secondary";

  // Os dados já vêm carregados na tela de receitas; aqui só lemos o mesmo cache.
  const { data } = useQuery({ ...receitasQuery, enabled: typeof window !== "undefined" });
  const total = data?.length;
  const mostrado = useContagem(total);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <ChefHat className="h-9 w-9 text-primary" aria-hidden />
            <span className="font-display text-3xl font-bold text-primary">Saborê</span>
          </Link>
          <span
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-lg font-semibold text-secondary-foreground"
            aria-label={total == null ? "Carregando quantidade de receitas" : `${total} receitas no app`}
          >
            <UtensilsCrossed className="h-5 w-5 text-primary" aria-hidden />
            {total == null ? (
              <span className="tabular-nums text-muted-foreground" aria-hidden>&hellip;</span>
            ) : (
              <span aria-hidden>
                <span className="tabular-nums">{mostrado.toLocaleString("pt-BR")}</span>{" "}
                {total === 1 ? "receita" : "receitas"}
              </span>
            )}
          </span>
        </div>
        <nav className="flex gap-2" aria-label="Navegação principal">
          <Link to="/receitas" className={item} activeProps={{ className: "bg-secondary text-primary" }}>
            <BookOpen className="h-5 w-5" aria-hidden /> Receitas
          </Link>
          <Link to="/" className={item} activeProps={{ className: "bg-secondary text-primary" }} activeOptions={{ exact: true }}>
            <Sparkles className="h-5 w-5" aria-hidden /> O que tenho em casa
          </Link>
        </nav>
      </div>
    </header>
  );
}
