import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ChefHat,
  BookOpen,
  BookPlus,
  Heart,
  LogIn,
  LogOut,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
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

const item =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-base font-semibold text-foreground hover:bg-secondary sm:px-4 sm:py-3";

export function Cabecalho() {
  const queryClient = useQueryClient();
  const irPara = useNavigate();
  const { entrou } = useSessao();

  // Os dados já vêm carregados na tela de receitas; aqui só lemos o mesmo cache.
  const { data } = useQuery({ ...receitasQuery, enabled: typeof window !== "undefined" });
  const total = data?.length;
  const mostrado = useContagem(total);
  const palavra = total === 1 ? "receita" : "receitas";

  const sair = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    irPara({ to: "/auth", replace: true });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <ChefHat className="h-7 w-7 text-primary sm:h-9 sm:w-9" aria-hidden />
            <span className="font-display text-2xl font-bold text-primary sm:text-3xl">Saborê</span>
          </Link>
          <span
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground sm:px-4 sm:py-2 sm:text-lg"
            aria-label={
              total == null ? "Carregando quantidade de receitas" : `${total} ${palavra} no app`
            }
          >
            <UtensilsCrossed className="h-5 w-5 text-primary" aria-hidden />
            {total == null ? (
              <span className="tabular-nums text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <span aria-hidden>
                <span className="tabular-nums">{mostrado.toLocaleString("pt-BR")}</span> {palavra}
              </span>
            )}
          </span>
        </div>

        <nav className="ml-auto flex flex-wrap items-center gap-2" aria-label="Navegação principal">
          <Link
            to="/receitas"
            className={item}
            activeProps={{ className: "bg-secondary text-primary" }}
          >
            <BookOpen className="h-5 w-5" aria-hidden /> Receitas
          </Link>
          <Link
            to="/favoritos"
            className={item}
            activeProps={{ className: "bg-secondary text-primary" }}
          >
            <Heart className="h-5 w-5" aria-hidden /> Favoritos
          </Link>
          <Link
            to="/lista-de-compras"
            className={item}
            activeProps={{ className: "bg-secondary text-primary" }}
          >
            <ShoppingBasket className="h-5 w-5" aria-hidden /> Lista de compras
          </Link>
          <Link
            to="/minhas-receitas"
            className={item}
            activeProps={{ className: "bg-secondary text-primary" }}
          >
            <Sparkles className="h-5 w-5" aria-hidden /> Minhas receitas
          </Link>
          <Link
            to="/nova-receita"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-base font-semibold text-primary-foreground hover:brightness-110 sm:px-4 sm:py-3"
          >
            <BookPlus className="h-5 w-5" aria-hidden /> Adicionar receita
          </Link>
          {entrou ? (
            <button
              type="button"
              onClick={sair}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border-2 border-border px-3 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive sm:px-4 sm:py-3"
            >
              <LogOut className="h-5 w-5" aria-hidden /> Sair
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border-2 border-border px-3 py-2 text-base font-semibold text-primary hover:bg-secondary sm:px-4 sm:py-3"
            >
              <LogIn className="h-5 w-5" aria-hidden /> Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
