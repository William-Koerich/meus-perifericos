import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BuscaForm } from "@/components/busca-form";
import { EmprestimoCard } from "@/components/emprestimos/emprestimo-card";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth";
import {
  ABAS,
  contarEmprestimosPorAba,
  filtrosEmprestimosSchema,
  listarEmprestimos,
  type Aba,
} from "@/lib/queries/emprestimos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Empréstimos" };

const ROTULO_ABA: Record<Aba, string> = {
  abertos: "Em aberto",
  atrasados: "Atrasados",
  devolvidos: "Devolvidos",
};

const VAZIO: Record<Aba, string> = {
  abertos: "Nenhum empréstimo em aberto",
  atrasados: "Nenhum empréstimo atrasado",
  devolvidos: "Nenhum empréstimo devolvido",
};

export default async function EmprestimosPage(props: PageProps<"/emprestimos">) {
  await exigirUsuario();
  const searchParams = await props.searchParams;
  const filtros = filtrosEmprestimosSchema.parse({
    aba: searchParams.aba,
    q: searchParams.q,
  });

  const [lista, contagem] = await Promise.all([
    listarEmprestimos(filtros),
    contarEmprestimosPorAba(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Empréstimos"
        descricao="Saídas e devoluções de equipamentos"
        acoes={
          <Link href="/emprestimos/novo" className={buttonVariants()}>
            <PlusIcon />
            Novo empréstimo
          </Link>
        }
      />

      <div className="space-y-4">
        <nav className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" aria-label="Situação">
          {ABAS.map((aba) => (
            <Link
              key={aba}
              href={`/emprestimos?aba=${aba}${filtros.q ? `&q=${encodeURIComponent(filtros.q)}` : ""}`}
              replace
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm text-muted-foreground",
                filtros.aba === aba && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              {ROTULO_ABA[aba]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  aba === "atrasados" && contagem.atrasados > 0
                    ? "bg-red-600 text-white"
                    : "bg-muted-foreground/15",
                )}
              >
                {contagem[aba]}
              </span>
            </Link>
          ))}
        </nav>

        <BuscaForm
          q={filtros.q}
          placeholder="Buscar por pessoa, ministério, código ou item"
          extras={{ aba: filtros.aba }}
        />

        {lista.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {lista.map((e) => (
              <li key={e.id}>
                <EmprestimoCard e={e} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {VAZIO[filtros.aba]}
            {filtros.q && " para essa busca"}.
          </p>
        )}
      </div>
    </>
  );
}
