"use client";

import { BotaoSalvar, Campo, ErroGeral, useFormAction } from "@/components/forms";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { atualizarPessoa, criarPessoa } from "@/lib/actions/pessoas";
import type { Pessoa } from "@/lib/db/schema";

export function PessoaForm({
  pessoa,
  ministerios,
}: {
  pessoa?: Pick<Pessoa, "id" | "nome" | "telefone" | "ministerio" | "observacoes">;
  ministerios: string[];
}) {
  const { state, pendente, onSubmit } = useFormAction(
    pessoa ? atualizarPessoa : criarPessoa,
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {pessoa && <input type="hidden" name="id" value={pessoa.id} />}
      <ErroGeral state={state} />

      <FieldGroup>
        <Campo nome="nome" label="Nome" state={state}>
          <Input
            id="nome"
            name="nome"
            defaultValue={pessoa?.nome}
            required
            autoComplete="name"
            className="h-11"
          />
        </Campo>
        <Campo nome="telefone" label="Telefone" state={state}>
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            defaultValue={pessoa?.telefone ?? ""}
            placeholder="(00) 00000-0000"
            autoComplete="tel"
            className="h-11"
          />
        </Campo>
        <Campo nome="ministerio" label="Ministério / departamento" state={state}>
          <Input
            id="ministerio"
            name="ministerio"
            defaultValue={pessoa?.ministerio ?? ""}
            placeholder="Ex.: Louvor, Jovens, Infantil"
            list="ministerios-sugeridos"
            className="h-11"
          />
          <datalist id="ministerios-sugeridos">
            {ministerios.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Campo>
        <Campo nome="observacoes" label="Observações (opcional)" state={state}>
          <Textarea
            id="observacoes"
            name="observacoes"
            defaultValue={pessoa?.observacoes ?? ""}
            rows={3}
          />
        </Campo>
      </FieldGroup>

      <BotaoSalvar pendente={pendente}>
        {pessoa ? "Salvar alterações" : "Cadastrar pessoa"}
      </BotaoSalvar>
    </form>
  );
}
