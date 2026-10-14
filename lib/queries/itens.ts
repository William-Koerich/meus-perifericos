import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  categorias,
  itemFotos,
  itens,
  statusItemEnum,
  type StatusItem,
} from "@/lib/db/schema";
import { contem, ehUuid } from "@/lib/sql";

export const ITENS_POR_PAGINA = 30;

export const filtrosItensSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(statusItemEnum.enumValues).optional().catch(undefined),
  categoria: z.uuid().optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type FiltrosItens = z.infer<typeof filtrosItensSchema>;

// Caminho da foto principal (menor "ordem") do item
const fotoPrincipal = sql<string | null>`(
  select ${itemFotos.storagePath} from ${itemFotos}
  where ${itemFotos.itemId} = ${itens.id}
  order by ${itemFotos.ordem} asc, ${itemFotos.createdAt} asc
  limit 1
)`;

export async function listarItens(filtros: FiltrosItens) {
  const condicoes: SQL[] = [];

  if (filtros.q) {
    const termo = contem(filtros.q);
    condicoes.push(
      or(
        ilike(itens.nome, termo),
        ilike(itens.tag, termo),
        ilike(itens.numeroSerie, termo),
        ilike(itens.localArmazenamento, termo),
      )!,
    );
  }
  if (filtros.status) condicoes.push(eq(itens.status, filtros.status));
  if (filtros.categoria) condicoes.push(eq(itens.categoriaId, filtros.categoria));

  const where = condicoes.length ? and(...condicoes) : undefined;
  const pagina = filtros.pagina ?? 1;

  const [linhas, [{ total }]] = await Promise.all([
    db
      .select({
        id: itens.id,
        tag: itens.tag,
        nome: itens.nome,
        status: itens.status,
        localArmazenamento: itens.localArmazenamento,
        categoria: categorias.nome,
        foto: fotoPrincipal,
      })
      .from(itens)
      .innerJoin(categorias, eq(categorias.id, itens.categoriaId))
      .where(where)
      .orderBy(asc(itens.nome), asc(itens.tag))
      .limit(ITENS_POR_PAGINA)
      .offset((pagina - 1) * ITENS_POR_PAGINA),
    db.select({ total: count() }).from(itens).where(where),
  ]);

  return {
    itens: linhas,
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
  };
}

export type ItemListado = Awaited<ReturnType<typeof listarItens>>["itens"][number];

export async function obterItem(id: string) {
  if (!ehUuid(id)) return null;

  const item = await db.query.itens.findFirst({
    where: eq(itens.id, id),
    with: {
      categoria: true,
      fotos: { orderBy: [asc(itemFotos.ordem), asc(itemFotos.createdAt)] },
      criador: { columns: { nome: true } },
    },
  });

  return item ?? null;
}

export type ItemDetalhado = NonNullable<Awaited<ReturnType<typeof obterItem>>>;

export async function obterItemPorTag(tag: string) {
  const [item] = await db
    .select({ id: itens.id })
    .from(itens)
    .where(eq(itens.tag, tag.trim().toUpperCase()))
    .limit(1);
  return item ?? null;
}

export async function obterItensParaEtiquetas(ids: string[]) {
  const validos = ids.filter(ehUuid).slice(0, 300);
  if (!validos.length) return [];

  return db
    .select({ id: itens.id, tag: itens.tag, nome: itens.nome })
    .from(itens)
    .where(inArray(itens.id, validos))
    .orderBy(asc(itens.tag));
}

export async function listarCategorias() {
  return db
    .select({ id: categorias.id, nome: categorias.nome })
    .from(categorias)
    .orderBy(asc(categorias.nome));
}

/** Locais já usados, para sugerir no formulário. */
export async function listarLocais() {
  const linhas = await db
    .selectDistinct({ local: itens.localArmazenamento })
    .from(itens)
    .where(isNotNull(itens.localArmazenamento))
    .orderBy(asc(itens.localArmazenamento));
  return linhas.map((l) => l.local!).filter(Boolean);
}

export type { StatusItem };
