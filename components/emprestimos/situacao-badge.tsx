import { Badge } from "@/components/ui/badge";
import type { Situacao } from "@/lib/queries/emprestimos";
import { cn } from "@/lib/utils";

const SITUACOES: Record<Situacao, { label: string; className: string }> = {
  aberto: {
    label: "Em aberto",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  atrasado: {
    label: "Atrasado",
    className: "bg-red-600 text-white dark:bg-red-700",
  },
  devolvido: {
    label: "Devolvido",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export function SituacaoBadge({
  situacao,
  className,
}: {
  situacao: Situacao;
  className?: string;
}) {
  const { label, className: cor } = SITUACOES[situacao];
  return (
    <Badge variant="outline" className={cn("border-transparent", cor, className)}>
      {label}
    </Badge>
  );
}
