import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Cabecalho } from "@/components/Cabecalho";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar senha nova — Saborê" },
      { name: "description", content: "Escolha uma senha nova para a sua conta do Saborê." },
      { property: "og:title", content: "Criar senha nova — Saborê" },
      { property: "og:description", content: "Escolha uma senha nova para a sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SenhaNova,
});

const CAMPO = "h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg outline-none focus:border-primary";

function SenhaNova() {
  const irPara = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // O link do e-mail chega com type=recovery no endereço; sem isso não podemos trocar a senha.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hash.get("type") === "recovery") {
      setPronto(true);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") setPronto(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha nova precisa ter pelo menos 6 letras.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) {
      setErro("Não foi possível trocar a senha. Abra de novo o link que enviamos para o seu e-mail.");
      return;
    }
    irPara({ to: "/minhas-receitas", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cabecalho />
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h1 className="font-display text-3xl font-bold">Senha nova</h1>
          {pronto ? (
            <>
              <p className="mt-2 text-lg text-muted-foreground">Escolha uma senha nova para entrar.</p>
              {erro && (
                <p className="mt-5 rounded-xl border-2 border-destructive p-4 text-lg text-destructive" role="alert">
                  {erro}
                </p>
              )}
              <form onSubmit={enviar} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="senha" className="block text-lg font-semibold">
                    Senha nova
                  </label>
                  <input
                    id="senha"
                    type="password"
                    required
                    className={`${CAMPO} mt-2`}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={carregando}>
                  {carregando && <Loader2 className="h-6 w-6 animate-spin" aria-hidden />}
                  Salvar senha nova
                </button>
              </form>
            </>
          ) : (
            <p className="mt-3 text-lg text-muted-foreground">
              Este link não está valendo. Peça um novo em <strong>Entrar → Esqueci minha senha</strong> e abra o
              e-mail que Enviarmos.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
