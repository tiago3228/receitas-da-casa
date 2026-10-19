-- Saborê: favoritos de receitas e lista de compras por usuário.
-- Pode ser executado no SQL Editor do Lovable/Supabase.

CREATE TABLE IF NOT EXISTS public.favoritos_receitas (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favoritos_receitas_pkey PRIMARY KEY (user_id, receita_id)
);

CREATE INDEX IF NOT EXISTS favoritos_receitas_usuario_idx
  ON public.favoritos_receitas (user_id, criado_em DESC);

ALTER TABLE public.favoritos_receitas ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.favoritos_receitas TO authenticated;
GRANT ALL ON public.favoritos_receitas TO service_role;

DROP POLICY IF EXISTS favoritos_receitas_select_own ON public.favoritos_receitas;
CREATE POLICY favoritos_receitas_select_own
  ON public.favoritos_receitas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS favoritos_receitas_insert_own ON public.favoritos_receitas;
CREATE POLICY favoritos_receitas_insert_own
  ON public.favoritos_receitas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS favoritos_receitas_delete_own ON public.favoritos_receitas;
CREATE POLICY favoritos_receitas_delete_own
  ON public.favoritos_receitas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.lista_compras_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id text,
  receita_nome text NOT NULL DEFAULT '',
  ingrediente text NOT NULL,
  ja_tem boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lista_compras_ingrediente_nao_vazio CHECK (length(trim(ingrediente)) > 0)
);

CREATE INDEX IF NOT EXISTS lista_compras_usuario_data_idx
  ON public.lista_compras_itens (user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS lista_compras_usuario_receita_idx
  ON public.lista_compras_itens (user_id, receita_id);

ALTER TABLE public.lista_compras_itens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lista_compras_itens TO authenticated;
GRANT ALL ON public.lista_compras_itens TO service_role;

DROP POLICY IF EXISTS lista_compras_select_own ON public.lista_compras_itens;
CREATE POLICY lista_compras_select_own
  ON public.lista_compras_itens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS lista_compras_insert_own ON public.lista_compras_itens;
CREATE POLICY lista_compras_insert_own
  ON public.lista_compras_itens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS lista_compras_update_own ON public.lista_compras_itens;
CREATE POLICY lista_compras_update_own
  ON public.lista_compras_itens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS lista_compras_delete_own ON public.lista_compras_itens;
CREATE POLICY lista_compras_delete_own
  ON public.lista_compras_itens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
