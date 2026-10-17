"use client";

import { ExcluirButton } from "@/components/excluir-button";
import { excluirItem } from "@/lib/actions/itens";

export function ExcluirItemButton({
  id,
  nome,
  emprestimos,
}: {
  id: string;
  nome: string;
  /** Quantas vezes o item já foi emprestado (histórico que será apagado). */
  emprestimos: number;
}) {
  const aviso =
    emprestimos > 0
      ? ` Atenção: o histórico de ${emprestimos} ${emprestimos === 1 ? "empréstimo" : "empréstimos"} deste item também será apagado (empréstimos que tinham só este item somem da lista).`
      : "";

  return (
    <ExcluirButton
      id={id}
      acao={excluirItem}
      titulo="Excluir item?"
      descricao={`“${nome}” e suas fotos serão apagados definitivamente.${aviso} Esta ação não pode ser desfeita.`}
    />
  );
}
