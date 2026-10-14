"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  redefinirSenhaSchema,
} from "@/lib/validations/usuarios";

import { errosDeValidacao, type ActionState } from "./types";

// "Banimento" longo = usuário desativado não consegue logar nem renovar a sessão
const BAN_DESATIVADO = "876000h"; // ~100 anos

function mensagemDeErro(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function criarUsuario(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirAdmin();

  const parsed = criarUsuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const { nome, email, senha, perfil } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // sem e-mail de confirmação
      user_metadata: { nome },
      app_metadata: { perfil },
    });

    if (error) {
      if (
        error.code === "email_exists" ||
        /already (been )?registered/i.test(error.message)
      ) {
        return {
          erro: "Já existe um usuário com este e-mail.",
          campos: { email: ["Já existe um usuário com este e-mail."] },
        };
      }
      return { erro: `Não foi possível criar o usuário: ${error.message}` };
    }

    // O trigger cria o profile; aqui garantimos nome e perfil escolhidos.
    await db
      .update(profiles)
      .set({ nome, perfil })
      .where(eq(profiles.id, data.user.id));
  } catch (error) {
    return { erro: mensagemDeErro(error) };
  }

  revalidatePath("/usuarios");
  return { ok: true, mensagem: `Usuário ${nome} criado.` };
}

export async function atualizarUsuario(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const atual = await exigirAdmin();

  const parsed = atualizarUsuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const { id, nome, perfil, ativo } = parsed.data;

  // Impede o admin de se trancar fora (garante sempre ao menos um admin ativo)
  if (id === atual.id && (perfil !== "admin" || !ativo)) {
    return {
      erro: "Você não pode remover seu próprio perfil de administrador nem desativar a si mesmo.",
    };
  }

  try {
    const [alvo] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    if (!alvo) return { erro: "Usuário não encontrado." };

    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({ nome, perfil, ativo })
        .where(eq(profiles.id, id));

      // Mantém o Auth em sincronia; se falhar, a transação é desfeita.
      const { error } = await createAdminClient().auth.admin.updateUserById(id, {
        user_metadata: { nome },
        app_metadata: { perfil },
        ban_duration: ativo ? "none" : BAN_DESATIVADO,
      });
      if (error) throw error;
    });
  } catch (error) {
    return { erro: `Não foi possível salvar: ${mensagemDeErro(error)}` };
  }

  revalidatePath("/usuarios");
  return { ok: true, mensagem: "Usuário atualizado." };
}

export async function redefinirSenha(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirAdmin();

  const parsed = redefinirSenhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const { id, senha } = parsed.data;

  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(id, {
      password: senha,
    });
    if (error) return { erro: `Não foi possível alterar a senha: ${error.message}` };
  } catch (error) {
    return { erro: mensagemDeErro(error) };
  }

  return { ok: true, mensagem: "Senha alterada." };
}
