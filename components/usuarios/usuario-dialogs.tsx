"use client";

import { KeyRoundIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Perfil } from "@/lib/db/schema";

import {
  EditarUsuarioForm,
  NovoUsuarioForm,
  RedefinirSenhaForm,
} from "./usuario-forms";

export function NovoUsuarioDialog() {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Novo usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Informe a senha inicial e repasse para a pessoa. Para trocar a
            senha depois, ela deve pedir a um administrador.
          </DialogDescription>
        </DialogHeader>
        <NovoUsuarioForm onSucesso={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function UsuarioAcoes({
  usuario,
  ehVoceMesmo,
}: {
  usuario: { id: string; nome: string; perfil: Perfil; ativo: boolean };
  ehVoceMesmo: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  return (
    <div className="flex gap-2">
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <PencilIcon />
          Editar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>{usuario.nome}</DialogDescription>
          </DialogHeader>
          <EditarUsuarioForm
            usuario={usuario}
            ehVoceMesmo={ehVoceMesmo}
            onSucesso={() => setEditando(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={trocandoSenha} onOpenChange={setTrocandoSenha}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <KeyRoundIcon />
          Senha
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Nova senha para {usuario.nome}. Repasse a senha para a pessoa.
            </DialogDescription>
          </DialogHeader>
          <RedefinirSenhaForm
            id={usuario.id}
            onSucesso={() => setTrocandoSenha(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
