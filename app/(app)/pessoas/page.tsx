import { ChevronRightIcon, PlusIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BuscaForm } from "@/components/busca-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth";
import { listarPessoas } from "@/lib/queries/pessoas";

export const metadata: Metadata = { title: "Pessoas" };

export default async function PessoasPage(props: PageProps<"/pessoas">) {
  await exigirUsuario();
  const { q } = await props.searchParams;
  const busca = typeof q === "string" ? q.trim().slice(0, 100) : undefined;
  const lista = await listarPessoas(busca);

  return (
    <>
      <PageHeader
        titulo="Pessoas"
        descricao="Quem pega equipamentos emprestados"
        acoes={
          <Link href="/pessoas/novo" className={buttonVariants()}>
            <PlusIcon />
            Nova pessoa
          </Link>
        }
      />

      <div className="space-y-4">
        <BuscaForm q={busca} placeholder="Buscar por nome, telefone ou ministério" />

        {lista.length ? (
          <ul className="divide-y rounded-xl border bg-card">
            {lista.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pessoas/${p.id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="size-5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.ministerio, p.telefone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  {p.abertos > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {p.abertos} em aberto
                    </Badge>
                  )}
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {busca ? "Ninguém encontrado." : "Nenhuma pessoa cadastrada ainda."}
          </p>
        )}
      </div>
    </>
  );
}
