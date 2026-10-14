CREATE TYPE "public"."periferico_estado_conservacao" AS ENUM('novo', 'bom', 'regular', 'ruim', 'danificado');--> statement-breakpoint
CREATE TYPE "public"."periferico_perfil" AS ENUM('admin', 'operador');--> statement-breakpoint
CREATE TYPE "public"."periferico_status_item" AS ENUM('disponivel', 'emprestado', 'manutencao', 'baixado');--> statement-breakpoint
CREATE SEQUENCE "public"."periferico_emprestimos_codigo_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."periferico_itens_tag_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "periferico_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periferico_categorias_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
ALTER TABLE "periferico_categorias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_emprestimo_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emprestimo_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"estado_saida" "periferico_estado_conservacao" NOT NULL,
	"devolvido_em" timestamp with time zone,
	"recebido_por" uuid,
	"estado_devolucao" "periferico_estado_conservacao",
	"observacao_devolucao" text
);
--> statement-breakpoint
ALTER TABLE "periferico_emprestimo_itens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_emprestimos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text DEFAULT ('EMP-' || to_char(nextval('periferico_emprestimos_codigo_seq'), 'FM9999990000')) NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"liberado_por" uuid NOT NULL,
	"saida_em" timestamp with time zone DEFAULT now() NOT NULL,
	"previsao_devolucao" timestamp with time zone,
	"observacoes" text,
	"encerrado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periferico_emprestimos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "periferico_emprestimos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_item_fotos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "periferico_item_fotos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" text DEFAULT ('IGR-' || to_char(nextval('periferico_itens_tag_seq'), 'FM9999990000')) NOT NULL,
	"nome" text NOT NULL,
	"categoria_id" uuid NOT NULL,
	"descricao" text,
	"numero_serie" text,
	"local_armazenamento" text,
	"estado_conservacao" "periferico_estado_conservacao" DEFAULT 'bom' NOT NULL,
	"status" "periferico_status_item" DEFAULT 'disponivel' NOT NULL,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periferico_itens_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
ALTER TABLE "periferico_itens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_pessoas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"ministerio" text,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "periferico_pessoas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "periferico_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"perfil" "periferico_perfil" DEFAULT 'operador' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "periferico_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "periferico_emprestimo_itens" ADD CONSTRAINT "periferico_emprestimo_itens_emprestimo_id_periferico_emprestimos_id_fk" FOREIGN KEY ("emprestimo_id") REFERENCES "public"."periferico_emprestimos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_emprestimo_itens" ADD CONSTRAINT "periferico_emprestimo_itens_item_id_periferico_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."periferico_itens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_emprestimo_itens" ADD CONSTRAINT "periferico_emprestimo_itens_recebido_por_periferico_profiles_id_fk" FOREIGN KEY ("recebido_por") REFERENCES "public"."periferico_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_emprestimos" ADD CONSTRAINT "periferico_emprestimos_pessoa_id_periferico_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."periferico_pessoas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_emprestimos" ADD CONSTRAINT "periferico_emprestimos_liberado_por_periferico_profiles_id_fk" FOREIGN KEY ("liberado_por") REFERENCES "public"."periferico_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_item_fotos" ADD CONSTRAINT "periferico_item_fotos_item_id_periferico_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."periferico_itens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_itens" ADD CONSTRAINT "periferico_itens_categoria_id_periferico_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."periferico_categorias"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_itens" ADD CONSTRAINT "periferico_itens_criado_por_periferico_profiles_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."periferico_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periferico_profiles" ADD CONSTRAINT "periferico_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "periferico_emprestimo_itens_emprestimo_idx" ON "periferico_emprestimo_itens" USING btree ("emprestimo_id");--> statement-breakpoint
CREATE INDEX "periferico_emprestimo_itens_item_idx" ON "periferico_emprestimo_itens" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "periferico_emprestimo_itens_item_aberto_uidx" ON "periferico_emprestimo_itens" USING btree ("item_id") WHERE "periferico_emprestimo_itens"."devolvido_em" is null;--> statement-breakpoint
CREATE INDEX "periferico_emprestimos_pessoa_idx" ON "periferico_emprestimos" USING btree ("pessoa_id");--> statement-breakpoint
CREATE INDEX "periferico_emprestimos_abertos_idx" ON "periferico_emprestimos" USING btree ("previsao_devolucao") WHERE "periferico_emprestimos"."encerrado_em" is null;--> statement-breakpoint
CREATE INDEX "periferico_item_fotos_item_idx" ON "periferico_item_fotos" USING btree ("item_id","ordem");--> statement-breakpoint
CREATE INDEX "periferico_itens_status_idx" ON "periferico_itens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "periferico_itens_categoria_idx" ON "periferico_itens" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "periferico_itens_nome_idx" ON "periferico_itens" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "periferico_pessoas_nome_idx" ON "periferico_pessoas" USING btree ("nome");