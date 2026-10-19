import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function lerProjeto(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), "utf8").replace(/\s+/g, " ").toLowerCase();
}

const pessoais = lerProjeto("drizzle/migrations/0000_create_profiles_and_receitas_autorais.sql");
const favoritosECompras = lerProjeto(
  "supabase/migrations/20261019000000_favoritos_lista_compras.sql",
);
const funcoesPessoais = lerProjeto("src/lib/receitas-autorais.functions.ts");
const middleware = lerProjeto("src/integrations/supabase/auth-middleware.ts");

describe("contrato estático de autorização e RLS", () => {
  it("mantém RLS e políticas de proprietário em receitas pessoais", () => {
    expect(pessoais).toContain("alter table public.receitas_autorais enable row level security;");
    expect(pessoais).toContain("for select to authenticated using (auth.uid() = user_id)");
    expect(pessoais).toContain("for insert to authenticated with check (auth.uid() = user_id)");
    expect(pessoais).toContain(
      "for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)",
    );
    expect(pessoais).toContain("for delete to authenticated using (auth.uid() = user_id)");
  });

  it("mantém RLS e políticas por usuário nos favoritos e na lista", () => {
    expect(favoritosECompras).toContain(
      "alter table public.favoritos_receitas enable row level security;",
    );
    expect(favoritosECompras).toContain(
      "alter table public.lista_compras_itens enable row level security;",
    );
    expect(favoritosECompras.match(/auth\.uid\(\) = user_id/g)).toHaveLength(8);
    expect(favoritosECompras).not.toContain("disable row level security");
  });

  it("valida sessão no middleware e limita escritas pessoais pelo user_id autenticado", () => {
    expect(middleware).toContain("supabase.auth.getclaims(token)");
    expect(middleware).toContain("context: { supabase, userid: data.claims.sub");
    expect(funcoesPessoais).toContain(".middleware([requiresupabaseauth])");
    expect(funcoesPessoais).toContain('.eq("user_id", context.userid)');
  });
});
