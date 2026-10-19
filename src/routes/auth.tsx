import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChefHat, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Cabecalho } from "@/components/Cabecalho";
import { CampoSenha } from "@/components/CampoSenha";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Saborê" },
      {
        name: "description",
        content: "Entre ou crie sua conta para guardar as suas receitas no Saborê.",
      },
      { property: "og:title", content: "Entrar — Saborê" },
      { property: "og:description", content: "Guarde as suas receitas com conta e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r =
      typeof search["redirect"] === "string" && search["redirect"].startsWith("/")
        ? search["redirect"]
        : "";
    return r ? { redirect: r } : {};
  },
  component: Entrar,
});

const CAMPO =
  "h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg outline-none focus:border-primary";

function Entrar() {
  const { redirect } = Route.useSearch();
  const irPara = useNavigate();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const destino = () => {
    const idParaEditar = redirect?.startsWith("/nova-receita?")
      ? new URLSearchParams(redirect.split("?")[1] ?? "").get("id")
      : null;
    if (redirect === "/nova-receita" || idParaEditar) {
      irPara({
        to: "/nova-receita",
        search: idParaEditar ? { id: idParaEditar } : {},
        replace: true,
      });
      return;
    }
    const para =
      redirect === "/favoritos"
        ? "/favoritos"
        : redirect === "/lista-de-compras"
          ? "/lista-de-compras"
          : "/minhas-receitas";
    irPara({ to: para, replace: true });
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro("");
    setAviso("");
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 letras.");
      return;
    }
    setCarregando(true);
    try {
      if (criando) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          setAviso(
            "Prontinho! Abra o seu e-mail e clique no link para confirmar a conta. Depois é só entrar.",
          );
          setCriando(false);
        } else {
          destino();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw new Error(error.message);
        destino();
      }
    } catch (e) {
      setErro(
        e instanceof Error && e.message
          ? e.message
              .replace("Invalid login credentials", "E-mail ou senha não conferem.")
              .replace(
                "Password is known to be weak and easy to guess, please choose a different one.",
                "Essa senha é fácil de adivinhar. Escolha outra, com letras, números e um símbolo.",
              )
              .replace(
                "Email already registered",
                'Esse e-mail já tem conta. Entre com ele ou use "Esqueci minha senha".',
              )
          : "Algo deu errado. Tente de novo.",
      );
    } finally {
      setCarregando(false);
    }
  };

  const recuperar = async () => {
    setErro("");
    setAviso("");
    if (!email.trim()) {
      setErro("Escreva o seu e-mail aí em cima primeiro.");
      return;
    }
    setEsperando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setEsperando(false);
    setAviso(
      error
        ? "Não foi possível enviar agora. Tente outra vez daqui a pouco."
        : "Enviamos um link para o seu e-mail. Abra e clique para criar uma senha nova.",
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-3">
            <ChefHat className="h-9 w-9 text-primary" aria-hidden />
            <h1 className="font-display text-3xl font-bold">
              {criando ? "Criar conta" : "Entrar"}
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground">
            {criando
              ? "Sua conta guarda as receitas que você adicionar."
              : "Entre para ver e aumentar a sua lista de receitas."}
          </p>

          {aviso && (
            <p className="mt-5 flex items-start gap-3 rounded-xl bg-secondary p-4 text-lg">
              <MailCheck className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
              <span>{aviso}</span>
            </p>
          )}
          {erro && (
            <p
              className="mt-5 rounded-xl border-2 border-destructive p-4 text-lg text-destructive"
              role="alert"
            >
              {erro}
            </p>
          )}

          <form onSubmit={enviar} className="mt-6 space-y-5">
            {criando && (
              <div>
                <label htmlFor="nome" className="block text-lg font-semibold">
                  Seu nome
                </label>
                <input
                  id="nome"
                  className={`${CAMPO} mt-2`}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Tia Ana"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-lg font-semibold">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                className={`${CAMPO} mt-2`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-lg font-semibold">
                Senha
              </label>
              <CampoSenha
                id="senha"
                className="mt-2"
                value={senha}
                onChange={setSenha}
                placeholder="Pelo menos 6 letras"
                autoComplete={criando ? "new-password" : "current-password"}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={carregando}>
              {carregando && <Loader2 className="h-6 w-6 animate-spin" aria-hidden />}
              {criando ? "Criar minha conta" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-lg">
            <button
              type="button"
              className="font-semibold text-primary underline underline-offset-4"
              onClick={() => {
                setCriando((v) => !v);
                setErro("");
                setAviso("");
              }}
            >
              {criando ? "Já tenho conta, quero entrar" : "Ainda não tenho conta, criar uma"}
            </button>
            {!criando && (
              <button
                type="button"
                className="text-muted-foreground underline underline-offset-4"
                onClick={recuperar}
                disabled={esperando}
              >
                {esperando ? "Enviando..." : "Esqueci minha senha"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-lg text-muted-foreground">
          Só quer ver as receitas?{" "}
          <Link to="/receitas" className="font-semibold text-primary underline underline-offset-4">
            Ver todas as receitas
          </Link>
        </p>
      </main>
    </div>
  );
}
