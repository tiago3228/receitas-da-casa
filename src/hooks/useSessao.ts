import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Só para o topo mostrar "Entrar" ou "Sair" — a proteção das páginas fica no portão _authenticated.
export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nova) => {
      if (!vivo) return;
      setSessao(nova);
      setCarregando(false);
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { sessao, carregando, entrou: Boolean(sessao), idUsuario: sessao?.user.id };
}
