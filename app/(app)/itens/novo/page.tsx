import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ItemForm } from "@/components/itens/item-form";
import { PageHeader } from "@/components/layout/page-header";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias, listarLocais } from "@/lib/queries/itens";

export const metadata: Metadata = { title: "Novo item" };

export default async function NovoItemPage() {
  await exigirUsuario();
  const [categorias, locais] = await Promise.all([
    listarCategorias(),
    listarLocais(),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/itens"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Itens
      </Link>
      <PageHeader
        titulo="Novo item"
        descricao="A tag (ex.: IGR-0001) é gerada automaticamente."
      />
      <ItemForm categorias={categorias} locais={locais} />
    </div>
  );
}
