-- Perfis: nome de exibição escolhido por cada pessoa
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Cria o perfil automaticamente quando alguém se cadastra
CREATE OR REPLACE FUNCTION public.criar_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nome'), ''), ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_perfil();

-- Receitas que a própria pessoa adiciona
CREATE TABLE public.receitas_autorais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Minhas receitas',
  ingredientes text NOT NULL DEFAULT '',
  modo_de_preparo text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  tempo text NOT NULL DEFAULT '',
  rendimento text NOT NULL DEFAULT '',
  texto_original text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas_autorais TO authenticated;
GRANT ALL ON public.receitas_autorais TO service_role;

ALTER TABLE public.receitas_autorais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receitas_autorais_select_own" ON public.receitas_autorais
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "receitas_autorais_insert_own" ON public.receitas_autorais
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receitas_autorais_update_own" ON public.receitas_autorais
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receitas_autorais_delete_own" ON public.receitas_autorais
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX receitas_autorais_user_idx ON public.receitas_autorais (user_id, criado_em DESC);