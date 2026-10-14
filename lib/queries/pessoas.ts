import "server-only";

import { and, asc, count, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { emprestimoItens, emprestimos, pessoas } from "@/lib/db/schema";
import { contem, ehUuid } from "@/lib/sql";

function filtroBusca(q?: string) {
  if (!q) return undefined;
  const termo = contem(q);
  return or(
    ilike(pessoas.nome, termo),
    ilike(pessoas.telefone, termo),
    ilike(pessoas.ministerio, termo),
  );
}

// Quantidade de empréstimos em aberto da pessoa
const emprestimosAbertos = sql<number>`(
  select count(*)::int from ${emprestimos}
  where ${emprestimos.pessoaId} = ${pessoas.id} and ${emprestimos.encerradoEm} is null
)`;

export async function listarPessoas(q?: string) {
  return db
    .select({
      id: pessoas.id,
      nome: pessoas.nome,
      telefone: pessoas.telefone,
      ministerio: pessoas.ministerio,
      abertos: emprestimosAbertos,
    })
    .from(pessoas)
    .where(filtroBusca(q))
    .orderBy(asc(pessoas.nome))
    .limit(200);
}

/** Busca rápida para o formulário de empréstimo. */
export async function buscarPessoas(q: string) {
  return db
    .select({
      id: pessoas.id,
      nome: pessoas.nome,
      telefone: pessoas.telefone,
      ministerio: pessoas.ministerio,
    })
    .from(pessoas)
    .where(filtroBusca(q.trim() || undefined))
    .orderBy(asc(pessoas.nome))
    .limit(10);
}

export async function obterPessoa(id: string) {
  if (!ehUuid(id)) return null;
  const [pessoa] = await db.select().from(pessoas).where(eq(pessoas.id, id)).limit(1);
  return pessoa ?? null;
}

export async function historicoDaPessoa(pessoaId: string) {
  return db
    .select({
      id: emprestimos.id,
      codigo: emprestimos.codigo,
      saidaEm: emprestimos.saidaEm,
      previsaoDevolucao: emprestimos.previsaoDevolucao,
      encerradoEm: emprestimos.encerradoEm,
      totalItens: count(emprestimoItens.id),
      pendentes: sql<number>`count(*) filter (where ${emprestimoItens.devolvidoEm} is null)::int`,
    })
    .from(emprestimos)
    .innerJoin(emprestimoItens, eq(emprestimoItens.emprestimoId, emprestimos.id))
    .where(eq(emprestimos.pessoaId, pessoaId))
    .groupBy(emprestimos.id)
    .orderBy(desc(emprestimos.saidaEm));
}

export async function listarMinisterios() {
  const linhas = await db
    .selectDistinct({ ministerio: pessoas.ministerio })
    .from(pessoas)
    .where(and(isNotNull(pessoas.ministerio), sql`${pessoas.ministerio} <> ''`))
    .orderBy(asc(pessoas.ministerio));
  return linhas.map((l) => l.ministerio!);
}
