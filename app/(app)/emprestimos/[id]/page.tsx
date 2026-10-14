import { ArrowLeftIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DevolucaoForm } from "@/components/emprestimos/devolucao-form";
import { SituacaoBadge } from "@/components/emprestimos/situacao-badge";
import { ItemMini } from "@/components/itens/item-mini";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exigirUsuario } from "@/lib/auth";
import { ESTADO_CONSERVACAO } from "@/lib/constants";
import { formatarDataHora } from "@/lib/format";
import { obterEmprestimo } from "@/lib/queries/emprestimos";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/emprestimos/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const emprestimo = await obterEmprestimo(id);
  return { title: emprestimo ? `Empréstimo ${emprestimo.codigo}` : "Empréstimo" };
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function EmprestimoPage(props: PageProps<"/emprestimos/[id]">) {
  await exigirUsuario();
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const emprestimo = await obterEmprestimo(id);
  if (!emprestimo) notFound();

  const pendentes = emprestimo.itens.filter((i) => !i.devolvidoEm);
  const devolvidos = emprestimo.itens.filter((i) => i.devolvidoEm);
  const atrasado = emprestimo.situacao === "atrasado";
  const { pessoa } = emprestimo;

  return (
    <div className="space-y-4">
      <Link
        href="/emprestimos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Empréstimos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{emprestimo.codigo}</p>
          <h1 className="text-xl font-semibold tracking-tight">{pessoa.nome}</h1>
          {pessoa.ministerio && (
            <p className="text-sm text-muted-foreground">{pessoa.ministerio}</p>
          )}
        </div>
        <SituacaoBadge situacao={emprestimo.situacao} />
      </div>

      {atrasado && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          Devolução atrasada — a previsão era {formatarDataHora(emprestimo.previsaoDevolucao)}.
          {pessoa.telefone && " Entre em contato com a pessoa."}
        </div>
      )}

      <Card>
        <CardContent>
          <dl className="divide-y">
            <Info label="Pessoa">
              <Link href={`/pessoas/${pessoa.id}`} className="underline-offset-4 hover:underline">
                {pessoa.nome}
              </Link>
              {pessoa.telefone && (
                <a
                  href={`tel:${pessoa.telefone.replace(/[^\d+]/g, "")}`}
                  className="mt-0.5 flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  <PhoneIcon className="size-3.5" />
                  {pessoa.telefone}
                </a>
              )}
            </Info>
            <Info label="Liberado por">{emprestimo.liberadoPor}</Info>
            <Info label="Saída">{formatarDataHora(emprestimo.saidaEm)}</Info>
            <Info label="Previsão">
              <span className={cn(atrasado && "font-medium text-red-600")}>
                {formatarDataHora(emprestimo.previsaoDevolucao)}
              </span>
            </Info>
            {emprestimo.encerradoEm && (
              <Info label="Encerrado">{formatarDataHora(emprestimo.encerradoEm)}</Info>
            )}
            {emprestimo.observacoes && (
              <Info label="Observações">
                <span className="whitespace-pre-line">{emprestimo.observacoes}</span>
              </Info>
            )}
          </dl>
        </CardContent>
      </Card>

      {pendentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Devolver itens ({pendentes.length} pendente{pendentes.length === 1 ? "" : "s"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DevolucaoForm
              key={pendentes.map((p) => p.id).join(",")}
              emprestimoId={emprestimo.id}
              pendentes={pendentes}
              itemPreSelecionado={
                typeof searchParams.devolver === "string" ? searchParams.devolver : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      {devolvidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Devolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="-mx-4 divide-y">
              {devolvidos.map((i) => (
                <li key={i.id} className="space-y-1 px-4 py-3">
                  <Link href={`/itens/${i.item.id}`}>
                    <ItemMini item={i.item} />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Devolvido {formatarDataHora(i.devolvidoEm!)}
                    {i.recebidoPor && ` · recebido por ${i.recebidoPor}`}
                    {i.estadoDevolucao && ` · ${ESTADO_CONSERVACAO[i.estadoDevolucao].toLowerCase()}`}
                    {i.estadoDevolucao && i.estadoDevolucao !== i.estadoSaida &&
                      ` (saiu ${ESTADO_CONSERVACAO[i.estadoSaida].toLowerCase()})`}
                  </p>
                  {i.observacaoDevolucao && (
                    <p className="text-xs">“{i.observacaoDevolucao}”</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
