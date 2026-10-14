"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";

import { ErroGeral, useFormAction } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionState } from "@/lib/actions/types";

type Acao = (anterior: ActionState, formData: FormData) => Promise<ActionState>;

function FormExcluir({ id, acao }: { id: string; acao: Acao }) {
  const { state, pendente, onSubmit } = useFormAction(acao);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <ErroGeral state={state} />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={pendente}>
          {pendente && <Loader2Icon className="animate-spin" />}
          Excluir
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Botão "Excluir" com diálogo de confirmação chamando uma Server Action. */
export function ExcluirButton({
  id,
  acao,
  titulo,
  descricao,
}: {
  id: string;
  acao: Acao;
  titulo: string;
  descricao: string;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2Icon />
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <FormExcluir id={id} acao={acao} />
      </DialogContent>
    </Dialog>
  );
}
