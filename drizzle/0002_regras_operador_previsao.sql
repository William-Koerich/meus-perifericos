-- Previsão de devolução passa a ser obrigatória (data e hora)
ALTER TABLE "periferico_emprestimos" ALTER COLUMN "previsao_devolucao" SET NOT NULL;--> statement-breakpoint

-- Regra de negócio: operador pode tudo, exceto gerenciar usuários (profiles).
-- Categorias: escrita liberada para qualquer usuário ativo.
DROP POLICY IF EXISTS "periferico_categorias_write_admin" ON public.periferico_categorias;--> statement-breakpoint
CREATE POLICY "periferico_categorias_insert" ON public.periferico_categorias
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.periferico_is_usuario_ativo()));--> statement-breakpoint
CREATE POLICY "periferico_categorias_update" ON public.periferico_categorias
  FOR UPDATE TO authenticated
  USING ((SELECT public.periferico_is_usuario_ativo()))
  WITH CHECK ((SELECT public.periferico_is_usuario_ativo()));--> statement-breakpoint
CREATE POLICY "periferico_categorias_delete" ON public.periferico_categorias
  FOR DELETE TO authenticated
  USING ((SELECT public.periferico_is_usuario_ativo()));--> statement-breakpoint

-- Exclusão em itens, fotos, pessoas e empréstimos: liberada para usuário ativo
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
         USING ((SELECT public.periferico_is_usuario_ativo()))',
      t || '_delete', t);
  END LOOP;
END
$$;
