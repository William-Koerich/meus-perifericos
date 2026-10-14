"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { emprestimos, pessoas } from "@/lib/db/schema";
import { ErroNegocio, mensagemDeErro } from "@/lib/erros";
import { buscarPessoas as buscarPessoasQuery } from "@/lib/queries/pessoas";
import { pessoaSchema } from "@/lib/validations/pessoas";

import { errosDeValidacao, type ActionState } from "./types";

export async function criarPessoa(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirUsuario();

  const parsed = pessoaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);

  let id: string;
  try {
    const [nova] = await db
      .insert(pessoas)
      .values(parsed.data)
      .returning({ id: pessoas.id });
    id = nova.id;
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível cadastrar a pessoa.") };
  }

  revalidatePath("/pessoas");
  redirect(`/pessoas/${id}`);
}

export async function atualizarPessoa(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirUsuario();

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erro: "Pessoa inválida." };

  const parsed = pessoaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);

  try {
    const atualizadas = await db
      .update(pessoas)
      .set(parsed.data)
      .where(eq(pessoas.id, id.data))
      .returning({ id: pessoas.id });
    if (!atualizadas.length) throw new ErroNegocio("Pessoa não encontrada.");
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível salvar.") };
  }

  revalidatePath("/pessoas");
  revalidatePath(`/pessoas/${id.data}`);
  redirect(`/pessoas/${id.data}`);
}

export async function excluirPessoa(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirUsuario();

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erro: "Pessoa inválida." };

  try {
    await db.transaction(async (tx) => {
      const [comEmprestimo] = await tx
        .select({ id: emprestimos.id })
        .from(emprestimos)
        .where(eq(emprestimos.pessoaId, id.data))
        .limit(1);
      if (comEmprestimo) {
        throw new ErroNegocio(
          "Esta pessoa tem empréstimos registrados e não pode ser excluída.",
        );
      }
      await tx.delete(pessoas).where(eq(pessoas.id, id.data));
    });
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível excluir.") };
  }

  revalidatePath("/pessoas");
  redirect("/pessoas");
}

/** Busca usada pelo formulário de empréstimo (autocomplete). */
export async function buscarPessoas(q: string) {
  await exigirUsuario();
  return buscarPessoasQuery(String(q ?? "").slice(0, 100));
}
