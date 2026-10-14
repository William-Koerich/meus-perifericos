import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  emprestimoItens,
  emprestimos,
  itemFotos,
  itens,
  pessoas,
  profiles,
} from "@/lib/db/schema";
import { contem, ehUuid } from "@/lib/sql";

export type Situacao = "aberto" | "atrasado" | "devolvido";

export function situacaoDoEmprestimo(e: {
  encerradoEm: Date | null;
  previsaoDevolucao: Date;
}): Situacao {
  if (e.encerradoEm) return "devolvido";
  return e.previsaoDevolucao.getTime() < Date.now() ? "atrasado" : "aberto";
}

export const ABAS = ["abertos", "atrasados", "devolvidos"] as const;
export type Aba = (typeof ABAS)[number];

export const filtrosEmprestimosSchema = z.object({
  aba: z.enum(ABAS).catch("abertos"),
  q: z.string().trim().max(100).optional().catch(undefined),
});

const fotoPrincipal = sql<string | null>`(
  select ${itemFotos.storagePath} from ${itemFotos}
  where ${itemFotos.itemId} = ${itens.id}
  order by ${itemFotos.ordem} asc, ${itemFotos.createdAt} asc
  limit 1
)`;

const totalItens = sql<number>`(
  select count(*)::int from ${emprestimoItens}
  where ${emprestimoItens.emprestimoId} = ${emprestimos.id}
)`;

const itensPendentes = sql<number>`(
  select count(*)::int from ${emprestimoItens}
  where ${emprestimoItens.emprestimoId} = ${emprestimos.id}
    and ${emprestimoItens.devolvidoEm} is null
)`;

// Nomes/tags dos itens do empréstimo, para exibir na lista e buscar
const resumoItens = sql<string>`(
  select string_agg(${itens.tag} || ' ' || ${itens.nome}, ', ' order by ${itens.tag})
  from ${emprestimoItens}
  join ${itens} on ${itens.id} = ${emprestimoItens.itemId}
  where ${emprestimoItens.emprestimoId} = ${emprestimos.id}
)`;

export async function listarEmprestimos({ aba, q }: z.infer<typeof filtrosEmprestimosSchema>) {
  const agora = new Date();
  const condicoes: SQL[] = [];

  if (aba === "abertos") condicoes.push(isNull(emprestimos.encerradoEm));
  if (aba === "atrasados") {
    condicoes.push(isNull(emprestimos.encerradoEm), lt(emprestimos.previsaoDevolucao, agora));
  }
  if (aba === "devolvidos") condicoes.push(isNotNull(emprestimos.encerradoEm));

  if (q) {
    const termo = contem(q);
    condicoes.push(
      or(
        ilike(emprestimos.codigo, termo),
        ilike(pessoas.nome, termo),
        ilike(pessoas.ministerio, termo),
        sql`${resumoItens} ilike ${termo}`,
      )!,
    );
  }

  const linhas = await db
    .select({
      id: emprestimos.id,
      codigo: emprestimos.codigo,
      saidaEm: emprestimos.saidaEm,
      previsaoDevolucao: emprestimos.previsaoDevolucao,
      encerradoEm: emprestimos.encerradoEm,
      pessoa: pessoas.nome,
      ministerio: pessoas.ministerio,
      totalItens,
      itensPendentes,
      resumoItens,
    })
    .from(emprestimos)
    .innerJoin(pessoas, eq(pessoas.id, emprestimos.pessoaId))
    .where(and(...condicoes))
    .orderBy(
      aba === "devolvidos"
        ? desc(emprestimos.encerradoEm)
        : asc(emprestimos.previsaoDevolucao),
    )
    .limit(100);

  return linhas.map((l) => ({ ...l, situacao: situacaoDoEmprestimo(l) }));
}

export type EmprestimoListado = Awaited<ReturnType<typeof listarEmprestimos>>[number];

export async function contarEmprestimosPorAba() {
  const [r] = await db
    .select({
      abertos: sql<number>`count(*) filter (where ${emprestimos.encerradoEm} is null)::int`,
      atrasados: sql<number>`count(*) filter (where ${emprestimos.encerradoEm} is null and ${emprestimos.previsaoDevolucao} < now())::int`,
      devolvidos: sql<number>`count(*) filter (where ${emprestimos.encerradoEm} is not null)::int`,
    })
    .from(emprestimos);
  return r;
}

const liberador = alias(profiles, "liberador");
const recebedor = alias(profiles, "recebedor");

export async function obterEmprestimo(id: string) {
  if (!ehUuid(id)) return null;

  const [emprestimo] = await db
    .select({
      id: emprestimos.id,
      codigo: emprestimos.codigo,
      saidaEm: emprestimos.saidaEm,
      previsaoDevolucao: emprestimos.previsaoDevolucao,
      encerradoEm: emprestimos.encerradoEm,
      observacoes: emprestimos.observacoes,
      liberadoPor: liberador.nome,
      pessoa: {
        id: pessoas.id,
        nome: pessoas.nome,
        telefone: pessoas.telefone,
        ministerio: pessoas.ministerio,
      },
    })
    .from(emprestimos)
    .innerJoin(pessoas, eq(pessoas.id, emprestimos.pessoaId))
    .innerJoin(liberador, eq(liberador.id, emprestimos.liberadoPor))
    .where(eq(emprestimos.id, id))
    .limit(1);

  if (!emprestimo) return null;

  const linhas = await db
    .select({
      id: emprestimoItens.id,
      estadoSaida: emprestimoItens.estadoSaida,
      devolvidoEm: emprestimoItens.devolvidoEm,
      estadoDevolucao: emprestimoItens.estadoDevolucao,
      observacaoDevolucao: emprestimoItens.observacaoDevolucao,
      recebidoPor: recebedor.nome,
      item: {
        id: itens.id,
        tag: itens.tag,
        nome: itens.nome,
        status: itens.status,
        foto: fotoPrincipal,
      },
    })
    .from(emprestimoItens)
    .innerJoin(itens, eq(itens.id, emprestimoItens.itemId))
    .leftJoin(recebedor, eq(recebedor.id, emprestimoItens.recebidoPor))
    .where(eq(emprestimoItens.emprestimoId, id))
    .orderBy(asc(itens.tag));

  return {
    ...emprestimo,
    situacao: situacaoDoEmprestimo(emprestimo),
    itens: linhas,
  };
}

export type EmprestimoDetalhado = NonNullable<Awaited<ReturnType<typeof obterEmprestimo>>>;

/** Itens disponíveis para emprestar (busca por nome ou tag). */
export async function buscarItensDisponiveis(q: string) {
  const termo = q.trim();
  return db
    .select({
      id: itens.id,
      tag: itens.tag,
      nome: itens.nome,
      status: itens.status,
      foto: fotoPrincipal,
    })
    .from(itens)
    .where(
      and(
        eq(itens.status, "disponivel"),
        termo
          ? or(ilike(itens.nome, contem(termo)), ilike(itens.tag, contem(termo)))
          : undefined,
      ),
    )
    .orderBy(asc(itens.nome))
    .limit(10);
}

/** Resumo de itens por id ou tag (para pré-seleção e leitura pela câmera). */
export async function obterItensResumo(filtro: { ids?: string[]; tags?: string[] }) {
  const ids = (filtro.ids ?? []).filter(ehUuid).slice(0, 50);
  const tags = (filtro.tags ?? []).map((t) => t.trim().toUpperCase()).slice(0, 50);
  if (!ids.length && !tags.length) return [];

  return db
    .select({
      id: itens.id,
      tag: itens.tag,
      nome: itens.nome,
      status: itens.status,
      foto: fotoPrincipal,
    })
    .from(itens)
    .where(
      or(
        ids.length ? inArray(itens.id, ids) : undefined,
        tags.length ? inArray(itens.tag, tags) : undefined,
      ),
    );
}

/** Empréstimo em aberto que contém o item (para a ação rápida "Devolver"). */
export async function emprestimoAbertoDoItem(itemId: string) {
  if (!ehUuid(itemId)) return null;
  const [linha] = await db
    .select({ emprestimoId: emprestimoItens.emprestimoId })
    .from(emprestimoItens)
    .where(and(eq(emprestimoItens.itemId, itemId), isNull(emprestimoItens.devolvidoEm)))
    .limit(1);
  return linha?.emprestimoId ?? null;
}

/** Histórico completo de empréstimos de um item. */
export async function historicoDoItem(itemId: string) {
  const linhas = await db
    .select({
      emprestimoId: emprestimos.id,
      codigo: emprestimos.codigo,
      saidaEm: emprestimos.saidaEm,
      previsaoDevolucao: emprestimos.previsaoDevolucao,
      pessoa: pessoas.nome,
      ministerio: pessoas.ministerio,
      liberadoPor: liberador.nome,
      devolvidoEm: emprestimoItens.devolvidoEm,
      recebidoPor: recebedor.nome,
      estadoSaida: emprestimoItens.estadoSaida,
      estadoDevolucao: emprestimoItens.estadoDevolucao,
      observacaoDevolucao: emprestimoItens.observacaoDevolucao,
    })
    .from(emprestimoItens)
    .innerJoin(emprestimos, eq(emprestimos.id, emprestimoItens.emprestimoId))
    .innerJoin(pessoas, eq(pessoas.id, emprestimos.pessoaId))
    .innerJoin(liberador, eq(liberador.id, emprestimos.liberadoPor))
    .leftJoin(recebedor, eq(recebedor.id, emprestimoItens.recebidoPor))
    .where(eq(emprestimoItens.itemId, itemId))
    .orderBy(desc(emprestimos.saidaEm));

  return linhas.map((l) => ({
    ...l,
    atrasado: !l.devolvidoEm && l.previsaoDevolucao.getTime() < Date.now(),
  }));
}
