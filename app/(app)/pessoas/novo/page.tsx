import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { PessoaForm } from "@/components/pessoas/pessoa-form";
import { exigirUsuario } from "@/lib/auth";
import { listarMinisterios } from "@/lib/queries/pessoas";

export const metadata: Metadata = { title: "Nova pessoa" };

export default async function NovaPessoaPage() {
  await exigirUsuario();
  const ministerios = await listarMinisterios();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/pessoas"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Pessoas
      </Link>
      <PageHeader titulo="Nova pessoa" />
      <PessoaForm ministerios={ministerios} />
    </div>
  );
}
