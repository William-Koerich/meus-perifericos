import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ESTADO_CONSERVACAO } from "@/lib/constants";
import type { EstadoConservacao } from "@/lib/db/schema";
import { formatarDataHora } from "@/lib/format";

type Registro = {
  emprestimoId: string;
  codigo: string;
  saidaEm: Date;
  previsaoDevolucao: Date;
  pessoa: string;
  ministerio: string | null;
  liberadoPor: string;
  devolvidoEm: Date | null;
  recebidoPor: string | null;
  estadoSaida: EstadoConservacao;
  estadoDevolucao: EstadoConservacao | null;
  observacaoDevolucao: string | null;
  atrasado: boolean;
};

export function HistoricoItem({ registros }: { registros: Registro[] }) {
  if (!registros.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Este item ainda não foi emprestado.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l pl-4">
      {registros.map((r) => (
        <li key={`${r.emprestimoId}`} className="relative">
          <span
            className={
              "absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background " +
              (r.devolvidoEm ? "bg-emerald-500" : r.atrasado ? "bg-red-600" : "bg-amber-500")
            }
          />
          <Link href={`/emprestimos/${r.emprestimoId}`} className="block space-y-0.5 hover:opacity-80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{r.pessoa}</span>
              {r.ministerio && (
                <span className="text-xs text-muted-foreground">{r.ministerio}</span>
              )}
              {!r.devolvidoEm && (
                <Badge variant={r.atrasado ? "destructive" : "secondary"}>
                  {r.atrasado ? "Atrasado" : "Com a pessoa"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{r.codigo}</span> · saiu{" "}
              {formatarDataHora(r.saidaEm)} (liberado por {r.liberadoPor})
            </p>
            <p className="text-xs text-muted-foreground">
              {r.devolvidoEm ? (
                <>
                  Voltou {formatarDataHora(r.devolvidoEm)}
                  {r.recebidoPor && ` (recebido por ${r.recebidoPor})`}
                  {r.estadoDevolucao &&
                    ` · ${ESTADO_CONSERVACAO[r.estadoDevolucao].toLowerCase()}`}
                </>
              ) : (
                <>Previsão {formatarDataHora(r.previsaoDevolucao)}</>
              )}
            </p>
            {r.observacaoDevolucao && (
              <p className="text-xs">“{r.observacaoDevolucao}”</p>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
