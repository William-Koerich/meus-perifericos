import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NovoEmprestimoForm } from "@/components/emprestimos/novo-emprestimo-form";
import { PageHeader } from "@/components/layout/page-header";
import { exigirUsuario } from "@/lib/auth";
import { obterItensResumo } from "@/lib/queries/emprestimos";
import { obterPessoa } from "@/lib/queries/pessoas";

export const metadata: Metadata = { title: "Novo empréstimo" };

export default async function NovoEmprestimoPage(
  props: PageProps<"/emprestimos/novo">,
) {
  await exigirUsuario();
  const searchParams = await props.searchParams;

  const idsItens =
    typeof searchParams.itens === "string"
      ? searchParams.itens.split(",").filter(Boolean)
      : [];
  const pessoaId = typeof searchParams.pessoa === "string" ? searchParams.pessoa : "";

  const [pessoa, itens] = await Promise.all([
    pessoaId ? obterPessoa(pessoaId) : null,
    obterItensResumo({ ids: idsItens }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/emprestimos"
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Empréstimos
      </Link>
      <PageHeader
        titulo="Novo empréstimo"
        descricao="A saída é registrada agora, em seu nome."
      />
      <NovoEmprestimoForm
        pessoaInicial={
          pessoa
            ? {
                id: pessoa.id,
                nome: pessoa.nome,
                telefone: pessoa.telefone,
                ministerio: pessoa.ministerio,
              }
            : null
        }
        itensIniciais={itens.filter((i) => i.status === "disponivel")}
        itensIndisponiveis={itens.filter((i) => i.status !== "disponivel")}
      />
    </div>
  );
}
