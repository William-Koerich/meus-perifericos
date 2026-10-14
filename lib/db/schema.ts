import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const perfilEnum = pgEnum("periferico_perfil", ["admin", "operador"]);

export const statusItemEnum = pgEnum("periferico_status_item", [
  "disponivel",
  "emprestado",
  "manutencao",
  "baixado",
]);

export const estadoConservacaoEnum = pgEnum("periferico_estado_conservacao", [
  "novo",
  "bom",
  "regular",
  "ruim",
  "danificado",
]);

// ---------------------------------------------------------------------------
// Sequences (geram as tags IGR-0001 e os códigos EMP-0001)
// ---------------------------------------------------------------------------

export const itensTagSeq = pgSequence("periferico_itens_tag_seq", {
  startWith: 1,
});

export const emprestimosCodigoSeq = pgSequence(
  "periferico_emprestimos_codigo_seq",
  { startWith: 1 },
);

// 'FM9999990000' => no mínimo 4 dígitos com zeros à esquerda, sem truncar acima de 9999
const tagDefault = sql`('IGR-' || to_char(nextval('periferico_itens_tag_seq'), 'FM9999990000'))`;
const codigoEmprestimoDefault = sql`('EMP-' || to_char(nextval('periferico_emprestimos_codigo_seq'), 'FM9999990000'))`;

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// ---------------------------------------------------------------------------
// Usuários do sistema
// ---------------------------------------------------------------------------

export const profiles = pgTable("periferico_profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  perfil: perfilEnum("perfil").notNull().default("operador"),
  ativo: boolean("ativo").notNull().default(true),
  ...timestamps,
}).enableRLS();

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

export const categorias = pgTable("periferico_categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  ...timestamps,
}).enableRLS();

export const itens = pgTable(
  "periferico_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tag: text("tag").notNull().unique().default(tagDefault),
    nome: text("nome").notNull(),
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categorias.id, { onDelete: "restrict" }),
    descricao: text("descricao"),
    numeroSerie: text("numero_serie"),
    localArmazenamento: text("local_armazenamento"),
    estadoConservacao: estadoConservacaoEnum("estado_conservacao")
      .notNull()
      .default("bom"),
    status: statusItemEnum("status").notNull().default("disponivel"),
    criadoPor: uuid("criado_por").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("periferico_itens_status_idx").on(t.status),
    index("periferico_itens_categoria_idx").on(t.categoriaId),
    index("periferico_itens_nome_idx").on(t.nome),
  ],
).enableRLS();

export const itemFotos = pgTable(
  "periferico_item_fotos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => itens.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    ordem: integer("ordem").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("periferico_item_fotos_item_idx").on(t.itemId, t.ordem)],
).enableRLS();

// ---------------------------------------------------------------------------
// Pessoas (quem pega emprestado — sem login)
// ---------------------------------------------------------------------------

export const pessoas = pgTable(
  "periferico_pessoas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    telefone: text("telefone"),
    ministerio: text("ministerio"),
    observacoes: text("observacoes"),
    ...timestamps,
  },
  (t) => [index("periferico_pessoas_nome_idx").on(t.nome)],
).enableRLS();

// ---------------------------------------------------------------------------
// Empréstimos
// ---------------------------------------------------------------------------

export const emprestimos = pgTable(
  "periferico_emprestimos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull().unique().default(codigoEmprestimoDefault),
    pessoaId: uuid("pessoa_id")
      .notNull()
      .references(() => pessoas.id, { onDelete: "restrict" }),
    liberadoPor: uuid("liberado_por")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    saidaEm: timestamp("saida_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    previsaoDevolucao: timestamp("previsao_devolucao", {
      withTimezone: true,
    }).notNull(),
    observacoes: text("observacoes"),
    // preenchido quando o último item do empréstimo é devolvido
    encerradoEm: timestamp("encerrado_em", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("periferico_emprestimos_pessoa_idx").on(t.pessoaId),
    index("periferico_emprestimos_abertos_idx")
      .on(t.previsaoDevolucao)
      .where(sql`${t.encerradoEm} is null`),
  ],
).enableRLS();

export const emprestimoItens = pgTable(
  "periferico_emprestimo_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emprestimoId: uuid("emprestimo_id")
      .notNull()
      .references(() => emprestimos.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => itens.id, { onDelete: "restrict" }),
    estadoSaida: estadoConservacaoEnum("estado_saida").notNull(),
    devolvidoEm: timestamp("devolvido_em", { withTimezone: true }),
    recebidoPor: uuid("recebido_por").references(() => profiles.id, {
      onDelete: "restrict",
    }),
    estadoDevolucao: estadoConservacaoEnum("estado_devolucao"),
    observacaoDevolucao: text("observacao_devolucao"),
  },
  (t) => [
    index("periferico_emprestimo_itens_emprestimo_idx").on(t.emprestimoId),
    index("periferico_emprestimo_itens_item_idx").on(t.itemId),
    // um item só pode estar em UM empréstimo em aberto por vez
    uniqueIndex("periferico_emprestimo_itens_item_aberto_uidx")
      .on(t.itemId)
      .where(sql`${t.devolvidoEm} is null`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Relations (para db.query.*)
// ---------------------------------------------------------------------------

export const categoriasRelations = relations(categorias, ({ many }) => ({
  itens: many(itens),
}));

export const itensRelations = relations(itens, ({ one, many }) => ({
  categoria: one(categorias, {
    fields: [itens.categoriaId],
    references: [categorias.id],
  }),
  criador: one(profiles, {
    fields: [itens.criadoPor],
    references: [profiles.id],
  }),
  fotos: many(itemFotos),
  emprestimos: many(emprestimoItens),
}));

export const itemFotosRelations = relations(itemFotos, ({ one }) => ({
  item: one(itens, { fields: [itemFotos.itemId], references: [itens.id] }),
}));

export const pessoasRelations = relations(pessoas, ({ many }) => ({
  emprestimos: many(emprestimos),
}));

export const emprestimosRelations = relations(emprestimos, ({ one, many }) => ({
  pessoa: one(pessoas, {
    fields: [emprestimos.pessoaId],
    references: [pessoas.id],
  }),
  liberador: one(profiles, {
    fields: [emprestimos.liberadoPor],
    references: [profiles.id],
  }),
  itens: many(emprestimoItens),
}));

export const emprestimoItensRelations = relations(
  emprestimoItens,
  ({ one }) => ({
    emprestimo: one(emprestimos, {
      fields: [emprestimoItens.emprestimoId],
      references: [emprestimos.id],
    }),
    item: one(itens, {
      fields: [emprestimoItens.itemId],
      references: [itens.id],
    }),
    recebedor: one(profiles, {
      fields: [emprestimoItens.recebidoPor],
      references: [profiles.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Perfil = (typeof perfilEnum.enumValues)[number];
export type StatusItem = (typeof statusItemEnum.enumValues)[number];
export type EstadoConservacao = (typeof estadoConservacaoEnum.enumValues)[number];

export type Profile = typeof profiles.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Item = typeof itens.$inferSelect;
export type ItemFoto = typeof itemFotos.$inferSelect;
export type Pessoa = typeof pessoas.$inferSelect;
export type Emprestimo = typeof emprestimos.$inferSelect;
export type EmprestimoItem = typeof emprestimoItens.$inferSelect;
