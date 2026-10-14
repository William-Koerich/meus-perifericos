"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

import { errosDeValidacao, type ActionState } from "./types";

export async function entrar(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    redirecionar: formData.get("redirecionar") ?? undefined,
  });
  if (!parsed.success) return errosDeValidacao(parsed.error);

  const { email, senha, redirecionar } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    const desativado = error?.code === "user_banned";
    return {
      erro: desativado
        ? "Este usuário está desativado. Fale com um administrador."
        : "E-mail ou senha incorretos.",
    };
  }

  const [profile] = await db
    .select({ ativo: profiles.ativo })
    .from(profiles)
    .where(eq(profiles.id, data.user.id))
    .limit(1);

  if (!profile?.ativo) {
    await supabase.auth.signOut();
    return {
      erro: "Este usuário está desativado. Fale com um administrador.",
    };
  }

  redirect(redirecionar);
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
