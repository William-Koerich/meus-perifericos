"use client";

import {
  BotaoSalvar,
  Campo,
  ErroGeral,
  useFormAction,
} from "@/components/forms";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  atualizarUsuario,
  criarUsuario,
  redefinirSenha,
} from "@/lib/actions/usuarios";
import type { Perfil } from "@/lib/db/schema";

function SelectPerfil({ defaultValue }: { defaultValue?: Perfil }) {
  return (
    <NativeSelect id="perfil" name="perfil" defaultValue={defaultValue ?? "operador"} className="h-10">
      <option value="operador">Operador — itens, pessoas e empréstimos</option>
      <option value="admin">Administrador — tudo, inclusive usuários</option>
    </NativeSelect>
  );
}

export function NovoUsuarioForm({ onSucesso }: { onSucesso: () => void }) {
  const { state, pendente, onSubmit } = useFormAction(criarUsuario, onSucesso);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErroGeral state={state} />
      <FieldGroup>
        <Campo nome="nome" label="Nome" state={state}>
          <Input id="nome" name="nome" required className="h-10" autoComplete="off" />
        </Campo>
        <Campo nome="email" label="E-mail" state={state}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            required
            className="h-10"
            autoComplete="off"
          />
        </Campo>
        <Campo nome="senha" label="Senha inicial" state={state}>
          <Input
            id="senha"
            name="senha"
            type="text"
            required
            minLength={6}
            className="h-10"
            autoComplete="new-password"
          />
        </Campo>
        <Campo nome="perfil" label="Perfil" state={state}>
          <SelectPerfil />
        </Campo>
      </FieldGroup>
      <BotaoSalvar pendente={pendente}>Criar usuário</BotaoSalvar>
    </form>
  );
}

export function EditarUsuarioForm({
  usuario,
  ehVoceMesmo,
  onSucesso,
}: {
  usuario: { id: string; nome: string; perfil: Perfil; ativo: boolean };
  ehVoceMesmo: boolean;
  onSucesso: () => void;
}) {
  const { state, pendente, onSubmit } = useFormAction(atualizarUsuario, onSucesso);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={usuario.id} />
      <ErroGeral state={state} />
      <FieldGroup>
        <Campo nome="nome" label="Nome" state={state}>
          <Input id="nome" name="nome" defaultValue={usuario.nome} required className="h-10" />
        </Campo>
        {ehVoceMesmo ? (
          <>
            {/* O próprio admin não altera o perfil nem se desativa */}
            <input type="hidden" name="perfil" value={usuario.perfil} />
            <input type="hidden" name="ativo" value="true" />
            <p className="text-xs text-muted-foreground">
              Você não pode alterar seu próprio perfil nem se desativar.
            </p>
          </>
        ) : (
          <>
            <Campo nome="perfil" label="Perfil" state={state}>
              <SelectPerfil defaultValue={usuario.perfil} />
            </Campo>
            <Campo nome="ativo" label="Situação" state={state}>
              <NativeSelect
                id="ativo"
                name="ativo"
                defaultValue={String(usuario.ativo)}
                className="h-10"
              >
                <option value="true">Ativo — pode entrar no sistema</option>
                <option value="false">Desativado — acesso bloqueado</option>
              </NativeSelect>
            </Campo>
          </>
        )}
      </FieldGroup>
      <BotaoSalvar pendente={pendente}>Salvar</BotaoSalvar>
    </form>
  );
}

export function RedefinirSenhaForm({
  id,
  onSucesso,
}: {
  id: string;
  onSucesso: () => void;
}) {
  const { state, pendente, onSubmit } = useFormAction(redefinirSenha, onSucesso);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <ErroGeral state={state} />
      <FieldGroup>
        <Campo nome="senha" label="Nova senha" state={state}>
          <Input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            className="h-10"
            autoComplete="new-password"
          />
        </Campo>
        <Campo nome="confirmacao" label="Confirme a nova senha" state={state}>
          <Input
            id="confirmacao"
            name="confirmacao"
            type="password"
            required
            className="h-10"
            autoComplete="new-password"
          />
        </Campo>
      </FieldGroup>
      <BotaoSalvar pendente={pendente}>Alterar senha</BotaoSalvar>
    </form>
  );
}
