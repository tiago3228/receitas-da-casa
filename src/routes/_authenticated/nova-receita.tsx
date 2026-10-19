import { useState } from "react";
import { createFileRoute, Link, navigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { organizarReceita, salvarMinhaReceita } from "@/lib/receitas-autorais.functions";

export const Route = createFileRoute("/_authenticated/nova-receita")({
  head: () => ({
    meta: [
      { title: "Adicionar receita — Saborê" },
      { name: "description", content: "Cole uma receita e o Saborê organiza ingredientes e modo de preparo." },
      { property: "og:title", content: "Adicionar receita — Saborê" },
      { property: "og:description", content: "Cole uma receita e guarde na sua lista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovaReceita,
});

const CATEGORIAS = [
  "Bolos, tortas e cupcakes",
  "Doces, sobremesas e doces de festa",
  "Biscoitos e bolachas",
  "Pães, massas e panificação",
  "Salgados, petiscos e lanches",
  "Carnes, aves e peixes",
  "Arroz, feijão e acompanhamentos",
  "Molhos, temperos e conservas",
  "Bebidas",
  "Minhas receitas",
];

const CAMPO = "h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg outline-none focus:border-primary";
const AREA = "w-full rounded-xl border-2 border-input bg-card p-4 text-lg outline-none focus:border-primary";

const VAZIO = {
  titulo: "",
  categoria: "Minhas receitas",
  tempo: "",
  rendimento: "",
  ingredientes: "",
  modo_de_preparo: "",
  observacoes: "",
};

function NovaReceita() {
  const queryClient = useQueryClient();
  const organizar = useServerFn(organizarReceita);
  const salvar = useServerFn(salvarMinhaReceita);

  const [texto, setTexto] = useState("");
  const [campos, setCampos] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const mudar = (chave: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [chave]: e.target.value }));

  const organizarTudo = async () => {
    setErro("");
    setAviso("");
    setCarregando(true);
    try {
      const r = await organizar({ data: { texto } });
      if (r.receita) {
        setCampos((c) => ({
          ...c,
          ...r.receita,
          categoria: CATEGORIAS.includes(r.receita!.categoria) ? r.receita!.categoria : c.categoria,
        }));
        setAviso("Organizei aqui embaixo. Confira e ajuste o que quiser antes de salvar.");
      } else {
        setErro(r.erro ?? "Não consegui organizar agora. Preencha os campos abaixo.");
      }
    } catch {
      setErro("Não consegui organizar agora. Você pode preencher os campos abaixo.");
    } finally {
      setCarregando(false);
    }
  };

  const guardar = async () => {
    setErro("");
    setSalvando(true);
    try {
      await salvar({ data: { ...campos, texto_original: texto } });
      await queryClient.invalidateQueries({ queryKey: ["minhas-receitas"] });
      navigate({ to: "/minhas-receitas", replace: true });
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Adicionar receita</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Cole a receita escrita do seu jeito. A gente separa os ingredientes e as etapas para você.
        </p>

        {erro && (
          <p className="mt-6 rounded-xl border-2 border-destructive p-4 text-lg text-destructive" role="alert">
            {erro}
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <label htmlFor="texto" className="block text-lg font-semibold">
            A receita, do seu jeito
          </label>
          <textarea
            id="texto"
            className={`${AREA} mt-2 min-h-56`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: Bolo de cenoura da vó — 3 cenouras, 2 xícaras de açúcar, 1 xícara de óleo, 3 ovos, farinha até dar ponto. Bater tudo, jogar em forma untada, forno 180 até enfiar palito seco."
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={organizarTudo} disabled={carregando || !texto.trim()}>
              {carregando ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Sparkles className="h-6 w-6" aria-hidden />}
              {carregando ? "Organizando..." : "Organizar com um toque"}
            </button>
            <Link to="/minhas-receitas" className="btn-secondary h-16">
              Cancelar
            </Link>
          </div>
          {aviso && <p className="mt-4 rounded-xl bg-secondary p-4 text-lg">{aviso}</p>}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-2xl font-semibold">Confira antes de salvar</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="titulo" className="block text-lg font-semibold">
                Nome da receita
              </label>
              <input id="titulo" className={`${CAMPO} mt-2`} value={campos.titulo} onChange={mudar("titulo")} placeholder="Ex.: Bolo de cenoura" />
            </div>
            <div>
              <label htmlFor="categoria" className="block text-lg font-semibold">
                Categoria
              </label>
              <select id="categoria" className={`${CAMPO} mt-2`} value={campos.categoria} onChange={mudar("categoria")}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tempo" className="block text-lg font-semibold">
                Tempo (opcional)
              </label>
              <input id="tempo" className={`${CAMPO} mt-2`} value={campos.tempo} onChange={mudar("tempo")} placeholder="Ex.: 40 minutos" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rendimento" className="block text-lg font-semibold">
                Rende (opcional)
              </label>
              <input id="rendimento" className={`${CAMPO} mt-2`} value={campos.rendimento} onChange={mudar("rendimento")} placeholder="Ex.: 12 fatias" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ingredientes" className="block text-lg font-semibold">
                Ingredientes
              </label>
              <textarea
                id="ingredientes"
                className={`${AREA} mt-2 min-h-40`}
                value={campos.ingredientes}
                onChange={mudar("ingredientes")}
                placeholder="Um por linha"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="modo" className="block text-lg font-semibold">
                Modo de preparo
              </label>
              <textarea
                id="modo"
                className={`${AREA} mt-2 min-h-40`}
                value={campos.modo_de_preparo}
                onChange={mudar("modo_de_preparo")}
                placeholder="Uma etapa por linha"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="observacoes" className="block text-lg font-semibold">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                className={`${AREA} mt-2 min-h-24`}
                value={campos.observacoes}
                onChange={mudar("observacoes")}
                placeholder="Dicas de quem faz"
              />
            </div>
          </div>
          <button type="button" className="btn-primary mt-6" onClick={guardar} disabled={salvando || !campos.titulo.trim()}>
            {salvando ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Save className="h-6 w-6" aria-hidden />}
            {salvando ? "Salvando..." : "Salvar na minha lista"}
          </button>
        </section>
      </main>
    </div>
  );
}
