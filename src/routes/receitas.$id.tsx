import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  ShoppingBasket,
  Square,
  Volume2,
} from "lucide-react";
import { BotaoFavorito } from "@/components/BotaoFavorito";
import { Cabecalho } from "@/components/Cabecalho";
import { ImagemReceita } from "@/components/ImagemReceita";
import { useFavoritos, useListaCompras } from "@/lib/dados-pessoais";
import {
  detectarDuracaoSegundos,
  extrairEtapas,
  extrairIngredientes,
  extrairModoDePreparo,
  quebrarEmFrases,
} from "@/lib/receita-texto";
import { receitasQuery, ehTitulo, encontrarReceitaPorId, normalizar } from "@/lib/receitas";
import { ajustarIngredientes, detectarRendimento } from "@/lib/porcoes";

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
    const vozes = window.speechSynthesis.getVoices();
    fala.voice =
      vozes.find((voz) => voz.lang.toLowerCase().replaceAll("_", "-") === "pt-br") ??
      vozes.find((voz) => voz.lang.toLowerCase().startsWith("pt")) ??
      null;
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

function AjustePorcoes({
  rendimento,
  porcoesOriginais,
  porcoesSelecionadas,
  aoAlterar,
}: {
  rendimento: string;
  porcoesOriginais: number | undefined;
  porcoesSelecionadas: number | undefined;
  aoAlterar: (valor: number) => void;
}) {
  return (
    <section
      className="mt-6 rounded-xl border border-border bg-secondary p-4"
      aria-label="Ajuste de porções"
    >
      <h3 className="font-display text-xl font-semibold">Ajustar porções</h3>
      <p className="mt-2">Rendimento original: {rendimento}</p>
      {porcoesOriginais === undefined ? (
        <p className="mt-2 text-muted-foreground">
          O rendimento é um intervalo ou não está claro; não alteramos quantidades automaticamente.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="porcoes-desejadas" className="block font-semibold">
                Porções desejadas
              </label>
              <input
                id="porcoes-desejadas"
                type="number"
                min={1}
                max={100}
                step={1}
                value={porcoesSelecionadas ?? porcoesOriginais}
                onChange={(evento) => {
                  const valor = evento.currentTarget.valueAsNumber;
                  if (Number.isInteger(valor) && valor >= 1 && valor <= 100) aoAlterar(valor);
                }}
                className="mt-1 h-12 w-32 rounded-lg border-2 border-input bg-card px-3 text-lg"
              />
            </div>
            <button
              type="button"
              className="btn-secondary min-h-12"
              onClick={() => aoAlterar(porcoesOriginais)}
              disabled={porcoesSelecionadas === porcoesOriginais}
            >
              Usar rendimento original
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            O ajuste só muda a exibição. Intervalos e quantidades como “a gosto” ficam sem
            alteração; a lista de compras usa as quantidades originais.
          </p>
        </>
      )}
    </section>
  );
}

function TemporizadorEtapa({ texto }: { texto: string }) {
  const duracao = useMemo(() => detectarDuracaoSegundos(texto), [texto]);
  const [restante, setRestante] = useState(duracao ?? 0);
  const [fimEm, setFimEm] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (fimEm === null) return;
    const intervalo = window.setInterval(() => {
      const segundos = Math.max(0, Math.ceil((fimEm - Date.now()) / 1000));
      setRestante(segundos);
      if (segundos === 0) {
        setFimEm(null);
        setMensagem("Tempo concluído. Confira o preparo.");
      }
    }, 1000);
    return () => window.clearInterval(intervalo);
  }, [fimEm]);

  if (!duracao) return null;
  const minutos = Math.floor(restante / 60)
    .toString()
    .padStart(2, "0");
  const segundos = (restante % 60).toString().padStart(2, "0");
  const duracaoTexto =
    duracao >= 60
      ? `${Math.floor(duracao / 60)} min${duracao % 60 ? ` e ${duracao % 60} s` : ""}`
      : `${duracao} s`;
  const iniciar = () => {
    const proximo = restante > 0 && restante < duracao ? restante : duracao;
    setMensagem("");
    setRestante(proximo);
    setFimEm(Date.now() + proximo * 1000);
  };
  const reiniciar = () => {
    setFimEm(null);
    setRestante(duracao);
    setMensagem("Temporizador reiniciado.");
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4">
      <p className="font-semibold">Temporizador — duração informada: {duracaoTexto}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Mantenha esta etapa aberta. O navegador pode suspender a contagem quando o app fica em
        segundo plano.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {fimEm === null ? (
          <button type="button" className="btn-secondary min-h-12" onClick={iniciar}>
            {restante > 0 && restante < duracao ? "Retomar temporizador" : "Iniciar temporizador"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary min-h-12"
            onClick={() => {
              const segundosRestantes = Math.max(0, Math.ceil((fimEm - Date.now()) / 1000));
              setFimEm(null);
              setRestante(segundosRestantes);
              setMensagem("Temporizador pausado.");
            }}
          >
            Pausar temporizador
          </button>
        )}
        {(restante !== duracao || mensagem) && (
          <button type="button" className="btn-secondary min-h-12" onClick={reiniciar}>
            Reiniciar
          </button>
        )}
        <output className="text-2xl font-bold tabular-nums" aria-live="polite">
          {fimEm !== null || restante !== duracao || mensagem.includes("concluído")
            ? `${minutos}:${segundos}`
            : "--:--"}
        </output>
      </div>
      {mensagem && (
        <p className="mt-2 text-primary" role="status">
          {mensagem}
        </p>
      )}
    </div>
  );
}

function NavegadorEtapas({ etapas }: { etapas: string[] }) {
  const [indice, setIndice] = useState(0);
  const [concluidas, setConcluidas] = useState<Set<number>>(() => new Set());
  const [terminou, setTerminou] = useState(false);
  if (!etapas.length) return null;

  const etapa = etapas[indice] ?? etapas[0] ?? "";
  const marcarConcluida = (marcada: boolean) => {
    setConcluidas((atuais) => {
      const novas = new Set(atuais);
      if (marcada) novas.add(indice);
      else novas.delete(indice);
      return novas;
    });
    setTerminou(false);
  };
  const proxima = () => {
    marcarConcluida(true);
    if (indice === etapas.length - 1) {
      setTerminou(true);
      return;
    }
    setIndice((atual) => atual + 1);
  };

  return (
    <section
      className="mt-6 rounded-2xl border-2 border-primary/30 bg-card p-5 md:p-6"
      aria-label="Preparo passo a passo"
    >
      <h2 className="font-display text-2xl font-semibold">Fazer etapa por etapa</h2>
      <p className="mt-2 text-muted-foreground">
        Avance quando estiver pronto. As instruções não foram divididas além dos limites de
        frase/lista encontrados.
      </p>
      <p className="mt-4 font-semibold" aria-live="polite">
        Etapa {indice + 1} de {etapas.length}
      </p>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Progresso do preparo"
        aria-valuemin={1}
        aria-valuemax={etapas.length}
        aria-valuenow={indice + 1}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((indice + 1) / etapas.length) * 100}%` }}
        />
      </div>
      <p className="mt-5 text-xl leading-relaxed">{etapa}</p>
      <TemporizadorEtapa key={`${indice}-${etapa}`} texto={etapa} />
      <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 text-lg">
        <input
          type="checkbox"
          checked={concluidas.has(indice)}
          onChange={(evento) => marcarConcluida(evento.target.checked)}
          className="h-6 w-6 accent-primary"
        />
        Marcar esta etapa como concluída
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-secondary min-h-12"
          disabled={indice === 0}
          onClick={() => {
            setIndice((atual) => Math.max(0, atual - 1));
            setTerminou(false);
          }}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden /> Etapa anterior
        </button>
        <button type="button" className="btn-primary min-h-12" onClick={proxima}>
          {indice === etapas.length - 1 ? (
            <Check className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronRight className="h-5 w-5" aria-hidden />
          )}
          {indice === etapas.length - 1 ? "Concluir preparo" : "Próxima etapa"}
        </button>
      </div>
      {terminou && (
        <p className="mt-4 text-lg font-semibold text-primary" role="status">
          Preparo concluído. Bom apetite!
        </p>
      )}
    </section>
  );
}

function Detalhe() {
  const { id } = Route.useParams();
  const irPara = useNavigate();
  const { data, isLoading, isError } = useQuery(receitasQuery);
  const compras = useListaCompras();
  const favoritos = useFavoritos();
  const [mensagemLista, setMensagemLista] = useState("");
  const [porcoesEscolhidas, setPorcoesEscolhidas] = useState<{ id: string; valor: number } | null>(
    null,
  );
  const r = data ? encontrarReceitaPorId(data, id) : undefined;
  const idsDaReceita = r ? [r.id, ...(r.aliases ?? [])] : [id];
  const idFavorito = favoritos.ids.find((idSalvo) => idsDaReceita.includes(idSalvo));
  const ingredientes = useMemo(() => (r ? extrairIngredientes(r.texto) : []), [r]);
  const preparo = useMemo(() => (r ? extrairModoDePreparo(r.texto) : ""), [r]);
  const etapas = useMemo(() => quebrarEmFrases(preparo), [preparo]);
  const passos = useMemo(() => extrairEtapas(preparo), [preparo]);
  const rendimento = useMemo(() => (r ? detectarRendimento(r.texto) : undefined), [r]);
  const porcoesOriginais = rendimento?.porcoesExatas;
  const porcoesAtuais =
    r && porcoesEscolhidas?.id === r.id ? porcoesEscolhidas.valor : porcoesOriginais;
  const ingredientesAjustados = useMemo(
    () => ajustarIngredientes(ingredientes, porcoesOriginais, porcoesAtuais),
    [ingredientes, porcoesOriginais, porcoesAtuais],
  );
  const textoParaLer = useMemo(
    () =>
      [
        r?.nome,
        ingredientes.length ? `Ingredientes:\n${ingredientes.join("\n")}` : "",
        preparo ? `Modo de preparo:\n${preparo}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [r, ingredientes, preparo],
  );
  const itemPara = (ingrediente: string) =>
    compras.itens.find(
      (item) =>
        item.receita_id !== null &&
        idsDaReceita.includes(item.receita_id) &&
        normalizar(item.ingrediente) === normalizar(ingrediente),
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
      const ingredientesNovos = ingredientes.filter((ingrediente) => !itemPara(ingrediente));
      if (!ingredientesNovos.length) {
        setMensagemLista("Os ingredientes desta receita já estão na sua lista.");
        return;
      }
      const novos = await compras.adicionar(
        ingredientesNovos.map((ingrediente) => ({
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
        {isError && (
          <p className="mt-10 text-lg text-destructive" role="alert">
            Não foi possível carregar a receita. Verifique sua conexão e tente novamente.
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
                ativo={Boolean(idFavorito)}
                aoAlternar={() => favoritos.alternar(idFavorito ?? r.id)}
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
            <ImagemReceita
              src={r.imagem}
              alt={r.imagemIlustrativa ? `Ilustração de ${r.nome}` : r.nome}
              loading="eager"
              className="mt-6 aspect-[4/3] max-h-[28rem] rounded-2xl shadow-soft"
            />
            {r.imagemIlustrativa && (
              <p className="mt-2 text-sm text-muted-foreground">
                Imagem ilustrativa gerada por IA.
              </p>
            )}
            {r.fonte && (
              <p className="mt-2 text-sm text-muted-foreground">
                Fonte da receita:{" "}
                <a
                  href={r.fonte.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {r.fonte.titulo}
                </a>
              </p>
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
                {rendimento && (
                  <AjustePorcoes
                    key={r.id}
                    rendimento={rendimento.texto}
                    porcoesOriginais={porcoesOriginais}
                    porcoesSelecionadas={porcoesAtuais}
                    aoAlterar={(valor) => setPorcoesEscolhidas({ id: r.id, valor })}
                  />
                )}
                <ul className="mt-5 space-y-3">
                  {ingredientes.map((ingrediente, indice) => {
                    const item = itemPara(ingrediente);
                    const ingredienteAjustado = ingredientesAjustados[indice];
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
                            {ingredienteAjustado?.texto ?? ingrediente}
                            {ingredienteAjustado?.estado === "aproximado" && (
                              <span className="ml-1 text-sm text-muted-foreground">
                                (aproximado)
                              </span>
                            )}
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

            {preparo && <NavegadorEtapas key={r.id} etapas={passos} />}
            {textoParaLer && <LeitorDeVoz key={r.id} texto={textoParaLer} />}
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
