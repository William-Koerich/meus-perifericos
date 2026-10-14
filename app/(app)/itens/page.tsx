import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FiltrosItens } from "@/components/itens/filtros-itens";
import { ListaItens } from "@/components/itens/lista-itens";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  filtrosItensSchema,
  listarCategorias,
  listarItens,
} from "@/lib/queries/itens";

export const metadata: Metadata = { title: "Itens" };

export default async function ItensPage(props: PageProps<"/itens">) {
  await exigirUsuario();

  const searchParams = await props.searchParams;
  const filtros = filtrosItensSchema.parse({
    q: searchParams.q,
    status: searchParams.status,
    categoria: searchParams.categoria,
    pagina: searchParams.pagina,
  });

  const [resultado, categorias] = await Promise.all([
    listarItens(filtros),
    listarCategorias(),
  ]);

  function linkPagina(pagina: number) {
    const params = new URLSearchParams();
    if (filtros.q) params.set("q", filtros.q);
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (pagina > 1) params.set("pagina", String(pagina));
    const query = params.toString();
    return query ? `/itens?${query}` : "/itens";
  }

  return (
    <>
      <PageHeader
        titulo="Itens"
        descricao={`${resultado.total} ${resultado.total === 1 ? "item" : "itens"}`}
        acoes={
          <Link href="/itens/novo" className={buttonVariants()}>
            <PlusIcon />
            Novo item
          </Link>
        }
      />

      <div className="space-y-4">
        <FiltrosItens
          filtros={{
            q: filtros.q,
            status: filtros.status,
            categoria: filtros.categoria,
          }}
          categorias={categorias}
        />

        {resultado.itens.length ? (
          <ListaItens itens={resultado.itens} />
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum item encontrado.
          </p>
        )}

        {resultado.totalPaginas > 1 && (
          <nav className="flex items-center justify-between">
            <Link
              href={linkPagina(resultado.pagina - 1)}
              aria-disabled={resultado.pagina <= 1}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                resultado.pagina <= 1 && "pointer-events-none opacity-50",
              )}
            >
              <ChevronLeftIcon />
              Anterior
            </Link>
            <span className="text-sm text-muted-foreground">
              Página {resultado.pagina} de {resultado.totalPaginas}
            </span>
            <Link
              href={linkPagina(resultado.pagina + 1)}
              aria-disabled={resultado.pagina >= resultado.totalPaginas}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                resultado.pagina >= resultado.totalPaginas &&
                  "pointer-events-none opacity-50",
              )}
            >
              Próxima
              <ChevronRightIcon />
            </Link>
          </nav>
        )}
      </div>
    </>
  );
}
