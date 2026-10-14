import "server-only";

import { count } from "drizzle-orm";

import { db } from "@/lib/db";
import { itens, statusItemEnum, type StatusItem } from "@/lib/db/schema";

/** Quantidade de itens em cada status (inclui status com zero). */
export async function totaisPorStatus() {
  const linhas = await db
    .select({ status: itens.status, total: count() })
    .from(itens)
    .groupBy(itens.status);

  const totais = Object.fromEntries(
    statusItemEnum.enumValues.map((s) => [s, 0]),
  ) as Record<StatusItem, number>;
  for (const l of linhas) totais[l.status] = l.total;

  return {
    porStatus: totais,
    total: linhas.reduce((soma, l) => soma + l.total, 0),
  };
}
