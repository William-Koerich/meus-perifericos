import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { PessoaForm } from "@/components/pessoas/pessoa-form";
import { exigirUsuario } from "@/lib/auth";
import { listarMinisterios, obterPessoa } from "@/lib/queries/pessoas";

export const metadata: Metadata = { title: "Editar pessoa" };

export default async function EditarPessoaPage(
  props: PageProps<"/pessoas/[id]/editar">,
) {
  await exigirUsuario();
  const { id } = await props.params;
  const [pessoa, ministerios] = await Promise.all([
    obterPessoa(id),
    listarMinisterios(),
  ]);
  if (!pessoa) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/pessoas/${pessoa.id}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar
      </Link>
      <PageHeader titulo="Editar pessoa" descricao={pessoa.nome} />
      <PessoaForm pessoa={pessoa} ministerios={ministerios} />
    </div>
  );
}
