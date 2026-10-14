"use client";

import { ExcluirButton } from "@/components/excluir-button";
import { excluirItem } from "@/lib/actions/itens";

export function ExcluirItemButton({ id, nome }: { id: string; nome: string }) {
  return (
    <ExcluirButton
      id={id}
      acao={excluirItem}
      titulo="Excluir item?"
      descricao={`“${nome}” e suas fotos serão apagados definitivamente. Itens com histórico de empréstimos não podem ser excluídos — use o status “Baixado”.`}
    />
  );
}
