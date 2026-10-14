import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ItemForm } from "@/components/itens/item-form";
import { PageHeader } from "@/components/layout/page-header";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias, listarLocais, obterItem } from "@/lib/queries/itens";

export const metadata: Metadata = { title: "Editar item" };

export default async function EditarItemPage(
  props: PageProps<"/itens/[id]/editar">,
) {
  await exigirUsuario();
  const { id } = await props.params;

  const [item, categorias, locais] = await Promise.all([
    obterItem(id),
    listarCategorias(),
    listarLocais(),
  ]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/itens/${item.id}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar
      </Link>
      <PageHeader titulo="Editar item" descricao={`${item.tag} · ${item.nome}`} />
      <ItemForm
        item={{
          id: item.id,
          tag: item.tag,
          nome: item.nome,
          categoriaId: item.categoriaId,
          descricao: item.descricao,
          numeroSerie: item.numeroSerie,
          localArmazenamento: item.localArmazenamento,
          estadoConservacao: item.estadoConservacao,
          status: item.status,
          fotos: item.fotos.map((f) => f.storagePath),
        }}
        categorias={categorias}
        locais={locais}
      />
    </div>
  );
}
