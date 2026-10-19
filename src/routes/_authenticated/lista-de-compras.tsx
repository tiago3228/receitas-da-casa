import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Circle, Loader2, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { useListaCompras } from "@/lib/dados-pessoais";

export const Route = createFileRoute("/_authenticated/lista-de-compras")({
  head: () => ({
    meta: [
      { title: "Lista de compras — Saborê" },
      {
        name: "description",
        content: "Organize ingredientes das receitas e marque o que já tem em casa.",
      },
      { property: "og:title", content: "Lista de compras — Saborê" },
      { property: "og:description", content: "Veja o que falta e marque o que você já tem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListaDeCompras,
});

function ListaDeCompras() {
  const { itens, carregando, erro, adicionar, marcando, removendo, salvando } = useListaCompras();
  const [novoIngrediente, setNovoIngrediente] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "faltam" | "tenho">("todos");
  const [erroFormulario, setErroFormulario] = useState("");
  const faltam = itens.filter((item) => !item.ja_tem);
  const jaTenho = itens.filter((item) => item.ja_tem);
  const visiveis = itens.filter(
    (item) => filtro === "todos" || (filtro === "tenho" ? item.ja_tem : !item.ja_tem),
  );

  const incluir = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const ingrediente = novoIngrediente.trim();
    if (!ingrediente) return;
    setErroFormulario("");
    try {
      await adicionar([{ receita_id: null, receita_nome: "", ingrediente }]);
      setNovoIngrediente("");
    } catch {
      setErroFormulario("Não consegui adicionar esse item. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Lista de compras</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {faltam.length} {faltam.length === 1 ? "item faltando" : "itens faltando"} ·{" "}
              {jaTenho.length} já tem em casa
            </p>
          </div>
          <Link to="/receitas" className="btn-secondary h-14">
            <ArrowLeft className="h-5 w-5" aria-hidden /> Voltar para receitas
          </Link>
        </div>

        <p className="mt-5 rounded-xl bg-secondary p-4 text-lg">
          Marque o que você já tem em casa (ou já comprou). O que ficar desmarcado continua na lista
          do que falta.
        </p>
        <form onSubmit={incluir} className="mt-6 flex flex-wrap gap-3">
          <label htmlFor="novo-ingrediente" className="sr-only">
            Adicionar item à lista
          </label>
          <input
            id="novo-ingrediente"
            value={novoIngrediente}
            onChange={(evento) => setNovoIngrediente(evento.target.value)}
            maxLength={180}
            placeholder="Ex.: 1 dúzia de ovos"
            className="h-14 min-w-0 flex-1 rounded-xl border-2 border-input bg-card px-4 text-lg outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="btn-primary h-14"
            disabled={!novoIngrediente.trim() || salvando}
          >
            <Plus className="h-5 w-5" aria-hidden /> Adicionar item
          </button>
        </form>
        {erroFormulario && (
          <p className="mt-3 text-destructive" role="alert">
            {erroFormulario}
          </p>
        )}

        {erro && (
          <p
            className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
            role="alert"
          >
            Não foi possível acessar a lista. Confirme que aplicou a migration SQL no Lovable e
            tente novamente.
          </p>
        )}
        {carregando && (
          <p className="mt-8 flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> Carregando sua lista...
          </p>
        )}
        {!carregando && !erro && (
          <>
            <div
              className="mt-7 flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar itens da lista"
            >
              {(
                [
                  ["todos", `Tudo (${itens.length})`],
                  ["faltam", `Faltam (${faltam.length})`],
                  ["tenho", `Já tenho (${jaTenho.length})`],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={filtro === valor}
                  onClick={() => setFiltro(valor)}
                  className={`min-h-12 rounded-full border-2 px-4 font-semibold ${
                    filtro === valor
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
            {visiveis.length === 0 ? (
              <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
                <ShoppingBasket className="mx-auto h-12 w-12 text-primary" aria-hidden />
                <h2 className="mt-4 font-display text-2xl font-semibold">
                  {itens.length === 0
                    ? "Sua lista está vazia"
                    : filtro === "faltam"
                      ? "Está tudo em casa"
                      : "Nenhum item marcado ainda"}
                </h2>
                <p className="mt-2 text-lg text-muted-foreground">
                  {itens.length === 0
                    ? "Abra uma receita e adicione os ingredientes que estão faltando, ou escreva um item acima."
                    : "Escolha outro filtro para ver os ingredientes."}
                </p>
                {itens.length === 0 && (
                  <Link to="/receitas" className="btn-primary mt-6">
                    Explorar receitas
                  </Link>
                )}
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {visiveis.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.ja_tem}
                        onChange={(evento) =>
                          marcando({ id: item.id, ja_tem: evento.target.checked })
                        }
                        aria-label={`Marcar ${item.ingrediente} como ${item.ja_tem ? "faltando" : "já tenho ou comprei"}`}
                        className="mt-1 h-6 w-6 accent-primary"
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-lg font-semibold ${item.ja_tem ? "text-muted-foreground line-through" : ""}`}
                        >
                          {item.ingrediente}
                        </span>
                        {item.receita_nome ? (
                          item.receita_id ? (
                            <Link
                              to="/receitas/$id"
                              params={{ id: item.receita_id }}
                              className="mt-1 inline-block text-base text-primary underline underline-offset-2"
                            >
                              Receita: {item.receita_nome}
                            </Link>
                          ) : (
                            <span className="mt-1 block text-base text-muted-foreground">
                              {item.receita_nome}
                            </span>
                          )
                        ) : (
                          <span className="mt-1 block text-base text-muted-foreground">
                            Item avulso
                          </span>
                        )}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                        {item.ja_tem ? (
                          <Check className="h-4 w-4" aria-hidden />
                        ) : (
                          <Circle className="h-4 w-4" aria-hidden />
                        )}
                        {item.ja_tem ? "Já tenho" : "Falta"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removendo(item.id)}
                        aria-label={`Remover ${item.ingrediente} da lista`}
                        title="Remover da lista"
                        className="rounded-xl p-3 text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
