import {
  AlertTriangleIcon,
  ArrowLeftRightIcon,
  ChevronRightIcon,
  ScanLineIcon,
} from "lucide-react";
import Link from "next/link";

import { EmprestimoCard } from "@/components/emprestimos/emprestimo-card";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exigirUsuario } from "@/lib/auth";
import { STATUS_ITEM } from "@/lib/constants";
import { statusItemEnum } from "@/lib/db/schema";
import { totaisPorStatus } from "@/lib/queries/dashboard";
import {
  contarEmprestimosPorAba,
  listarEmprestimos,
} from "@/lib/queries/emprestimos";
import { cn } from "@/lib/utils";

const LIMITE = 5;

export default async function InicioPage() {
  const usuario = await exigirUsuario();

  const [totais, contagem, atrasados, abertos] = await Promise.all([
    totaisPorStatus(),
    contarEmprestimosPorAba(),
    listarEmprestimos({ aba: "atrasados" }),
    listarEmprestimos({ aba: "abertos" }),
  ]);

  // Em aberto e ainda no prazo, por previsão mais próxima
  const noPrazo = abertos.filter((e) => e.situacao === "aberto");

  return (
    <div className="space-y-4">
      <PageHeader
        titulo={`Olá, ${usuario.nome.split(" ")[0]}!`}
        descricao="Resumo dos equipamentos e empréstimos"
      />

      <div className="grid grid-cols-2 gap-2">
        <Link href="/escanear" className={cn(buttonVariants({ size: "lg" }), "h-12")}>
          <ScanLineIcon />
          Escanear
        </Link>
        <Link
          href="/emprestimos/novo"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12")}
        >
          <ArrowLeftRightIcon />
          Emprestar
        </Link>
      </div>

      {atrasados.length > 0 && (
        <Card className="border-red-300 bg-red-50/60 ring-red-300 dark:border-red-900 dark:bg-red-950/30 dark:ring-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangleIcon className="size-5" />
              {contagem.atrasados} empréstimo{contagem.atrasados === 1 ? "" : "s"} atrasado
              {contagem.atrasados === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="divide-y overflow-hidden rounded-lg border bg-background">
              {atrasados.slice(0, LIMITE).map((e) => (
                <li key={e.id}>
                  <EmprestimoCard e={e} />
                </li>
              ))}
            </ul>
            {contagem.atrasados > LIMITE && (
              <VerTodos href="/emprestimos?aba=atrasados">Ver todos os atrasados</VerTodos>
            )}
          </CardContent>
        </Card>
      )}

      <section aria-label="Itens por status" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statusItemEnum.enumValues.map((status) => (
          <Link
            key={status}
            href={`/itens?status=${status}`}
            className="rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <p className="text-2xl font-semibold tabular-nums">{totais.porStatus[status]}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className={cn("size-2 rounded-full", STATUS_ITEM[status].ponto)} />
              {STATUS_ITEM[status].label}
            </p>
          </Link>
        ))}
      </section>
      <p className="-mt-2 text-xs text-muted-foreground">
        {totais.total} {totais.total === 1 ? "item cadastrado" : "itens cadastrados"}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>
            Empréstimos em aberto ({contagem.abertos})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {noPrazo.length ? (
            <ul className="-mx-4 divide-y border-y">
              {noPrazo.slice(0, LIMITE).map((e) => (
                <li key={e.id}>
                  <EmprestimoCard e={e} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {contagem.abertos
                ? "Todos os empréstimos em aberto estão atrasados."
                : "Nenhum equipamento emprestado no momento."}
            </p>
          )}
          {contagem.abertos > 0 && (
            <VerTodos href="/emprestimos?aba=abertos">Ver todos os empréstimos</VerTodos>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VerTodos({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-end gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      {children}
      <ChevronRightIcon className="size-4" />
    </Link>
  );
}
