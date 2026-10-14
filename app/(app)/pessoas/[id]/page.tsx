import {
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExcluirButton } from "@/components/excluir-button";
import { SituacaoBadge } from "@/components/emprestimos/situacao-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { excluirPessoa } from "@/lib/actions/pessoas";
import { exigirUsuario } from "@/lib/auth";
import { formatarDataHora } from "@/lib/format";
import { situacaoDoEmprestimo } from "@/lib/queries/emprestimos";
import { historicoDaPessoa, obterPessoa } from "@/lib/queries/pessoas";

export async function generateMetadata(
  props: PageProps<"/pessoas/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const pessoa = await obterPessoa(id);
  return { title: pessoa?.nome ?? "Pessoa" };
}

export default async function PessoaPage(props: PageProps<"/pessoas/[id]">) {
  await exigirUsuario();
  const { id } = await props.params;
  const pessoa = await obterPessoa(id);
  if (!pessoa) notFound();
  const historico = await historicoDaPessoa(pessoa.id);

  const telefoneLink = pessoa.telefone?.replace(/[^\d+]/g, "");

  return (
    <div className="space-y-4">
      <Link
        href="/pessoas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Pessoas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{pessoa.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {pessoa.ministerio ?? "Sem ministério informado"}
          </p>
          {pessoa.telefone && (
            <a
              href={`tel:${telefoneLink}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              <PhoneIcon className="size-4" />
              {pessoa.telefone}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/emprestimos/novo?pessoa=${pessoa.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            <ArrowLeftRightIcon />
            Emprestar
          </Link>
          <Link
            href={`/pessoas/${pessoa.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PencilIcon />
            Editar
          </Link>
          {historico.length === 0 && (
            <ExcluirButton
              id={pessoa.id}
              acao={excluirPessoa}
              titulo="Excluir pessoa?"
              descricao={`O cadastro de “${pessoa.nome}” será apagado.`}
            />
          )}
        </div>
      </div>

      {pessoa.observacoes && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-line">
          {pessoa.observacoes}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de empréstimos</CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length ? (
            <ul className="-mx-4 divide-y">
              {historico.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/emprestimos/${e.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{e.codigo}</p>
                      <p className="text-xs text-muted-foreground">
                        Saída {formatarDataHora(e.saidaEm)} · {e.totalItens}{" "}
                        {e.totalItens === 1 ? "item" : "itens"}
                        {e.pendentes > 0 && !e.encerradoEm && ` · ${e.pendentes} pendente(s)`}
                      </p>
                    </div>
                    <SituacaoBadge situacao={situacaoDoEmprestimo(e)} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum empréstimo registrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
