import { Link } from "@tanstack/react-router";
import { ChefHat, BookOpen, Sparkles } from "lucide-react";

export function Cabecalho() {
  const item = "flex items-center gap-2 rounded-xl px-4 py-3 text-lg font-semibold text-foreground hover:bg-secondary";
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <ChefHat className="h-9 w-9 text-primary" aria-hidden />
          <span className="font-display text-3xl font-bold text-primary">Saborê</span>
        </Link>
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
