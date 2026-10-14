import Link from "next/link";

import { formatarDataHora } from "@/lib/format";
import type { EmprestimoListado } from "@/lib/queries/emprestimos";
import { cn } from "@/lib/utils";

import { SituacaoBadge } from "./situacao-badge";

export function EmprestimoCard({ e }: { e: EmprestimoListado }) {
  const parcial = !e.encerradoEm && e.itensPendentes < e.totalItens;

  return (
    <Link
      href={`/emprestimos/${e.id}`}
      className={cn(
        "block space-y-1.5 p-3 transition-colors hover:bg-muted/50",
        e.situacao === "atrasado" && "border-l-4 border-l-red-600",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{e.pessoa}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{e.codigo}</span>
            {e.ministerio && ` · ${e.ministerio}`}
          </p>
        </div>
        <SituacaoBadge situacao={e.situacao} className="shrink-0" />
      </div>
      <p className="line-clamp-2 text-sm">{e.resumoItens}</p>
      <p className="text-xs text-muted-foreground">
        Saída {formatarDataHora(e.saidaEm)} ·{" "}
        {e.encerradoEm ? (
          <>Devolvido {formatarDataHora(e.encerradoEm)}</>
        ) : (
          <span className={cn(e.situacao === "atrasado" && "font-medium text-red-600")}>
            Previsão {formatarDataHora(e.previsaoDevolucao)}
          </span>
        )}
        {parcial && ` · ${e.totalItens - e.itensPendentes}/${e.totalItens} devolvidos`}
      </p>
    </Link>
  );
}
