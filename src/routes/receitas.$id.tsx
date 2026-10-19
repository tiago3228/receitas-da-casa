import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pause, Play, ShoppingBasket, Square, Volume2 } from "lucide-react";
import { BotaoFavorito } from "@/components/BotaoFavorito";
import { Cabecalho } from "@/components/Cabecalho";
import { useFavoritos, useListaCompras } from "@/lib/dados-pessoais";
import { extrairIngredientes, extrairModoDePreparo, quebrarEmFrases } from "@/lib/receita-texto";
import { receitasQuery, ehTitulo, normalizar } from "@/lib/receitas";

export const Route = createFileRoute("/receitas/$id")({
  head: () => ({
    meta: [
      { title: "Receita — Saborê" },
      {
        name: "description",
        content: "Ingredientes e modo de preparo explicados de forma simples.",
      },
      { property: "og:title", content: "Receita — Saborê" },
      {
        property: "og:description",
        content: "Ingredientes e modo de preparo explicados de forma simples.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detalhe,
});

function LeitorDeVoz({ texto }: { texto: string }) {
  const frases = useMemo(() => quebrarEmFrases(texto), [texto]);
  const [velocidade, setVelocidade] = useState(1);
  const [volume, setVolume] = useState(80);
  const [tocando, setTocando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [erro, setErro] = useState("");
  const valores = useRef({ velocidade, volume });
  const lerProxima = useRef<(indice: number) => void>(() => undefined);
  valores.current = { velocidade, volume };

  lerProxima.current = (indice) => {
    const frase = frases[indice];
    if (!frase) {
      setTocando(false);
      setPausado(false);
      return;
    }
    const fala = new SpeechSynthesisUtterance(frase);
    fala.lang = "pt-BR";
    fala.rate = valores.current.velocidade;
    fala.volume = valores.current.volume / 100;
    fala.onend = () => lerProxima.current(indice + 1);
    fala.onerror = () => {
      setTocando(false);
      setPausado(false);
      setErro("A leitura em voz não pôde continuar neste navegador.");
    };
    window.speechSynthesis.speak(fala);
  };

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    },
    [],
  );

  const reproduzir = () => {
    setErro("");
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setErro("A leitura em voz não está disponível neste navegador.");
      return;
    }
    if (pausado) {
      window.speechSynthesis.resume();
      setPausado(false);
      return;
    }
    if (tocando) {
      window.speechSynthesis.pause();
      setPausado(true);
      return;
    }
    window.speechSynthesis.cancel();
    setTocando(true);
    setPausado(false);
    lerProxima.current(0);
  };

  const parar = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    setTocando(false);
    setPausado(false);
  };

  return (
    <section
      className="mt-6 rounded-2xl border border-border bg-secondary p-5 md:p-6"
      aria-label="Leitura em voz do preparo"
    >
      <div className="flex items-start gap-3">
        <Volume2 className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="font-display text-2xl font-semibold">Ouvir o modo de preparo</h2>
          <p className="mt-1 text-muted-foreground">
            Ajuste a velocidade e o volume antes ou durante a leitura.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reproduzir} className="btn-primary min-h-12 px-5 py-2">
          {pausado ? (
            <Play className="h-5 w-5" aria-hidden />
          ) : tocando ? (
            <Pause className="h-5 w-5" aria-hidden />
          ) : (
            <Play className="h-5 w-5" aria-hidden />
          )}
          {pausado ? "Retomar" : tocando ? "Pausar" : "Ouvir preparo"}
        </button>
        {tocando && (
          <button type="button" onClick={parar} className="btn-secondary min-h-12 px-5 py-2">
            <Square className="h-4 w-4" aria-hidden /> Parar
          </button>
        )}
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="velocidade-voz" className="flex justify-between gap-3 font-semibold">
            <span>Velocidade</span>
            <span>{velocidade.toFixed(1).replace(".", ",")}×</span>
          </label>
          <input
            id="velocidade-voz"
            type="range"
            min="0.6"
            max="1.5"
            step="0.1"
            value={velocidade}
            onChange={(e) => setVelocidade(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Mais devagar</span>
            <span>Mais rápido</span>
          </div>
        </div>
        <div>
          <label htmlFor="volume-voz" className="flex justify-between gap-3 font-semibold">
            <span>Volume</span>
            <span>{volume}%</span>
          </label>
          <input
            id="volume-voz"
            type="range"
            min="0"
            max="100"
            step="5"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Mudo</span>
            <span>Alto</span>
          </div>
        </div>
      </div>
      {erro && (
        <p className="mt-4 text-destructive" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}

function Detalhe() {
  const { id } = Route.useParams();
  const irPara = useNavigate();
  const { data, isLoading } = useQuery(receitasQuery);
  const compras = useListaCompras();
  const favoritos = useFavoritos();
  const [mensagemLista, setMensagemLista] = useState("");
  const r = data?.find((x) => x.id === id);
  const ingredientes = useMemo(() => (r ? extrairIngredientes(r.texto) : []), [r]);
  const preparo = useMemo(() => (r ? extrairModoDePreparo(r.texto) : ""), [r]);
  const etapas = useMemo(() => quebrarEmFrases(preparo), [preparo]);
  const itemPara = (ingrediente: string) =>
    compras.itens.find(
      (item) =>
        item.receita_id === r?.id && normalizar(item.ingrediente) === normalizar(ingrediente),
    );

  const entrarParaLista = () => irPara({ to: "/auth", search: { redirect: "/lista-de-compras" } });
  const marcarIngrediente = (ingrediente: string, jaTem: boolean) => {
    if (!compras.idUsuario) {
      entrarParaLista();
      return;
    }
    const existente = itemPara(ingrediente);
    if (existente) {
      compras.marcando({ id: existente.id, ja_tem: jaTem });
    } else if (r) {
      void compras
        .adicionar([{ receita_id: r.id, receita_nome: r.nome, ingrediente, ja_tem: jaTem }])
        .catch(() => setMensagemLista("Não consegui atualizar o ingrediente. Tente novamente."));
    }
  };
  const adicionarFaltantes = async () => {
    if (!r) return;
    if (!compras.idUsuario) {
      entrarParaLista();
      return;
    }
    setMensagemLista("");
    try {
      const novos = await compras.adicionar(
        ingredientes.map((ingrediente) => ({
          receita_id: r.id,
          receita_nome: r.nome,
          ingrediente,
          ja_tem: false,
        })),
      );
      setMensagemLista(
        novos
          ? `${novos} ${novos === 1 ? "ingrediente adicionado" : "ingredientes adicionados"} à lista.`
          : "Os ingredientes desta receita já estão na sua lista.",
      );
    } catch {
      setMensagemLista(
        "Não consegui adicionar os ingredientes. Confirme que aplicou a migration SQL e tente novamente.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/receitas" className="btn-secondary h-14">
          <ArrowLeft className="h-6 w-6" aria-hidden /> Voltar para receitas
        </Link>
        {isLoading && (
          <p className="mt-10 flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> Carregando...
          </p>
        )}
        {data && !r && <p className="mt-10 text-xl">Receita não encontrada.</p>}
        {r && (
          <article className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg text-muted-foreground">{r.categoria}</p>
                <h1 className="font-display text-3xl font-bold md:text-4xl">{r.nome}</h1>
              </div>
              <BotaoFavorito
                idUsuario={favoritos.idUsuario}
                ativo={favoritos.ids.includes(r.id)}
                aoAlternar={() => favoritos.alternar(r.id)}
                disabled={favoritos.carregando || favoritos.removendo}
              />
            </div>
            {favoritos.erro && (
              <p
                className="mt-4 rounded-xl border-2 border-destructive p-4 text-destructive"
                role="alert"
              >
                Não foi possível carregar seus favoritos. Confirme que aplicou a migration SQL no
                Lovable.
              </p>
            )}
            {r.imagem && (
              <img
                src={r.imagem}
                alt={r.nome}
                className="mt-6 max-h-[28rem] w-full rounded-2xl object-cover shadow-soft"
              />
            )}

            {ingredientes.length > 0 && (
              <section
                className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-7"
                aria-labelledby="titulo-ingredientes"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="titulo-ingredientes" className="font-display text-2xl font-semibold">
                      Ingredientes
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      Marque o que já tem em casa; adicione à lista o que está faltando.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={adicionarFaltantes}
                    disabled={compras.carregando || compras.salvando}
                    className="btn-primary min-h-12 px-4 py-2 text-base"
                  >
                    <ShoppingBasket className="h-5 w-5" aria-hidden /> Adicionar faltantes
                  </button>
                </div>
                {compras.erro && (
                  <p className="mt-4 text-destructive" role="alert">
                    Não foi possível carregar sua lista. Confirme que aplicou a migration SQL no
                    Lovable.
                  </p>
                )}
                {mensagemLista && (
                  <p className="mt-4 text-base text-primary" role="status">
                    {mensagemLista}
                  </p>
                )}
                <ul className="mt-5 space-y-3">
                  {ingredientes.map((ingrediente, indice) => {
                    const item = itemPara(ingrediente);
                    return (
                      <li key={`${indice}-${ingrediente}`}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-secondary">
                          <input
                            type="checkbox"
                            checked={item?.ja_tem ?? false}
                            disabled={compras.carregando || compras.salvando}
                            onChange={(evento) =>
                              marcarIngrediente(ingrediente, evento.target.checked)
                            }
                            className="mt-1 h-6 w-6 accent-primary"
                          />
                          <span
                            className={`text-lg leading-relaxed ${item?.ja_tem ? "text-muted-foreground line-through" : ""}`}
                          >
                            {ingrediente}
                          </span>
                          <span className="ml-auto shrink-0 text-sm text-muted-foreground">
                            {item?.ja_tem ? "Já tenho" : item ? "Na lista" : "Falta"}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/lista-de-compras"
                  className="mt-5 inline-flex font-semibold text-primary underline underline-offset-4"
                >
                  Abrir lista de compras
                </Link>
              </section>
            )}

            {preparo && <LeitorDeVoz texto={preparo} />}
            {preparo ? (
              <section
                className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8"
                aria-labelledby="titulo-preparo"
              >
                <h2
                  id="titulo-preparo"
                  className="font-display text-2xl font-semibold text-primary"
                >
                  Modo de preparo
                </h2>
                <div className="mt-4 space-y-3">
                  {etapas.map((linha, indice) =>
                    ehTitulo(linha) ? (
                      <h3
                        key={indice}
                        className="pt-3 font-display text-xl font-semibold first:pt-0"
                      >
                        {linha.replace(/:$/, "")}
                      </h3>
                    ) : (
                      <p key={indice} className="text-xl leading-relaxed">
                        {linha}
                      </p>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <details
              className="mt-6 rounded-2xl border border-border bg-card p-5"
              open={!ingredientes.length && !preparo}
            >
              <summary className="cursor-pointer font-display text-xl font-semibold">
                Ver texto completo da receita e observações
              </summary>
              <div className="mt-4 space-y-3">
                {r.texto.split("\n").map((p, i) =>
                  ehTitulo(p) ? (
                    <h2
                      key={i}
                      className="pt-4 font-display text-xl font-semibold text-primary first:pt-0"
                    >
                      {p.replace(/:$/, "")}
                    </h2>
                  ) : (
                    <p key={i} className="text-lg leading-relaxed">
                      {p}
                    </p>
                  ),
                )}
              </div>
            </details>
          </article>
        )}
      </main>
    </div>
  );
}
