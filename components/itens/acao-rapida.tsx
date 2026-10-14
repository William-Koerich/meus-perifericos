import { ArrowDownToLineIcon, ArrowUpFromLineIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { StatusItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

/** Botão principal conforme o status: "Emprestar" (disponível) ou "Devolver" (emprestado). */
export function AcaoRapida({
  item,
  emprestimoAbertoId,
  className,
  tamanho = "default",
}: {
  item: { id: string; status: StatusItem };
  emprestimoAbertoId: string | null;
  className?: string;
  tamanho?: "default" | "lg" | "sm";
}) {
  if (item.status === "disponivel") {
    return (
      <Link
        href={`/emprestimos/novo?itens=${item.id}`}
        className={cn(buttonVariants({ size: tamanho }), className)}
      >
        <ArrowUpFromLineIcon />
        Emprestar
      </Link>
    );
  }

  if (item.status === "emprestado" && emprestimoAbertoId) {
    return (
      <Link
        href={`/emprestimos/${emprestimoAbertoId}?devolver=${item.id}`}
        className={cn(buttonVariants({ size: tamanho }), className)}
      >
        <ArrowDownToLineIcon />
        Devolver
      </Link>
    );
  }

  return null;
}
