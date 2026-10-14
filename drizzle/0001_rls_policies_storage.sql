-- =============================================================================
-- RLS, funções auxiliares, trigger de profile, bucket de fotos e seed
--
-- Observação: o app (Server Actions via Drizzle) conecta como "postgres" e não
-- passa pelo RLS — a autorização ali é feita no código. Estas policies protegem
-- o acesso direto pela API do Supabase com a publishable key (browser).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------

-- Perfil do usuário logado (null se não tiver profile ou estiver inativo)
CREATE OR REPLACE FUNCTION public.periferico_perfil_atual()
RETURNS public.periferico_perfil
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.perfil
  FROM public.periferico_profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.ativo
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.periferico_is_usuario_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.periferico_perfil_atual() IS NOT NULL
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.periferico_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(public.periferico_perfil_atual() = 'admin', false)
$$;
--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.periferico_perfil_atual() FROM anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.periferico_is_usuario_ativo() FROM anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.periferico_is_admin() FROM anon;
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- Cria o profile automaticamente quando um usuário é criado no Supabase Auth.
--  - nome: user_metadata.nome (ou o e-mail)
--  - perfil: app_metadata.perfil (só pode ser definido com a secret key);
--    o PRIMEIRO usuário do sistema vira admin automaticamente.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.periferico_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_perfil public.periferico_perfil;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.periferico_profiles) THEN
    v_perfil := 'admin';
  ELSIF NEW.raw_app_meta_data ->> 'perfil' IN ('admin', 'operador') THEN
    v_perfil := (NEW.raw_app_meta_data ->> 'perfil')::public.periferico_perfil;
  ELSE
    v_perfil := 'operador';
  END IF;

  INSERT INTO public.periferico_profiles (id, nome, email, perfil)
  VALUES (
    NEW.id,
    coalesce(nullif(NEW.raw_user_meta_data ->> 'nome', ''), NEW.email),
    NEW.email,
    v_perfil
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS periferico_on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER periferico_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.periferico_handle_new_user();
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- Policies das tabelas
-- -----------------------------------------------------------------------------

-- profiles: todo usuário ativo vê os demais (nome de quem liberou/recebeu);
-- cada um vê o próprio; só admin altera.
CREATE POLICY "periferico_profiles_select" ON public.periferico_profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint
CREATE POLICY "periferico_profiles_insert_admin" ON public.periferico_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.periferico_is_admin()));
--> statement-breakpoint
CREATE POLICY "periferico_profiles_update_admin" ON public.periferico_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT public.periferico_is_admin()))
  WITH CHECK ((SELECT public.periferico_is_admin()));
--> statement-breakpoint
CREATE POLICY "periferico_profiles_delete_admin" ON public.periferico_profiles
  FOR DELETE TO authenticated
  USING ((SELECT public.periferico_is_admin()));
--> statement-breakpoint

-- categorias: leitura para usuários ativos; escrita só admin
CREATE POLICY "periferico_categorias_select" ON public.periferico_categorias
  FOR SELECT TO authenticated
  USING ((SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint
CREATE POLICY "periferico_categorias_write_admin" ON public.periferico_categorias
  FOR ALL TO authenticated
  USING ((SELECT public.periferico_is_admin()))
  WITH CHECK ((SELECT public.periferico_is_admin()));
--> statement-breakpoint

-- itens, fotos, pessoas, empréstimos: leitura/criação/edição para usuários
-- ativos (admin e operador); exclusão só admin.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'periferico_itens',
    'periferico_item_fotos',
    'periferico_pessoas',
    'periferico_emprestimos',
    'periferico_emprestimo_itens'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
         USING ((SELECT public.periferico_is_usuario_ativo()))',
      t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
         WITH CHECK ((SELECT public.periferico_is_usuario_ativo()))',
      t || '_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
         USING ((SELECT public.periferico_is_usuario_ativo()))
         WITH CHECK ((SELECT public.periferico_is_usuario_ativo()))',
      t || '_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
         USING ((SELECT public.periferico_is_admin()))',
      t || '_delete_admin', t);
  END LOOP;
END
$$;
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- Storage: bucket de fotos dos itens
-- Público para leitura (URLs com UUID, impossíveis de adivinhar; facilita
-- miniaturas e cache do PWA). Upload/alteração/remoção só usuários ativos.
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'periferico-fotos',
  'periferico-fotos',
  true,
  5242880, -- 5 MB (as fotos são comprimidas no cliente antes do envio)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

CREATE POLICY "periferico_fotos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'periferico-fotos' AND (SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint
CREATE POLICY "periferico_fotos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'periferico-fotos' AND (SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint
CREATE POLICY "periferico_fotos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'periferico-fotos' AND (SELECT public.periferico_is_usuario_ativo()))
  WITH CHECK (bucket_id = 'periferico-fotos' AND (SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint
CREATE POLICY "periferico_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'periferico-fotos' AND (SELECT public.periferico_is_usuario_ativo()));
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- Categorias iniciais
-- -----------------------------------------------------------------------------

INSERT INTO public.periferico_categorias (nome) VALUES
  ('Áudio'),
  ('Microfones'),
  ('Caixas de som'),
  ('Cabos'),
  ('Vídeo e projeção'),
  ('Informática'),
  ('Iluminação'),
  ('Instrumentos'),
  ('Outros')
ON CONFLICT (nome) DO NOTHING;
