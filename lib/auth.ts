import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/lib/db";
import { profiles, type Perfil } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type UsuarioAtual = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

type Sessao =
  | { status: "anonimo" }
  | { status: "inativo" }
  | { status: "ok"; usuario: UsuarioAtual };

// Lê a sessão (JWT validado pelo Supabase) e o profile. Deduplicado por request.
const getSessao = cache(async (): Promise<Sessao> => {
  // A sessão é sempre do request (o cliente do Supabase usa Date.now() ao
  // validar o token, o que não pode acontecer durante o prerender).
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { status: "anonimo" };

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile || !profile.ativo) return { status: "inativo" };

  return {
    status: "ok",
    usuario: {
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
      perfil: profile.perfil,
    },
  };
});

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const sessao = await getSessao();
  return sessao.status === "ok" ? sessao.usuario : null;
}

/** Exige usuário logado e ativo; caso contrário redireciona. */
export async function exigirUsuario(): Promise<UsuarioAtual> {
  const sessao = await getSessao();
  if (sessao.status === "anonimo") redirect("/login");
  // Sessão válida mas usuário desativado/sem profile: encerra a sessão
  if (sessao.status === "inativo") redirect("/auth/sair?motivo=inativo");
  return sessao.usuario;
}

/** Exige perfil admin; operador é mandado para o início. */
export async function exigirAdmin(): Promise<UsuarioAtual> {
  const usuario = await exigirUsuario();
  if (usuario.perfil !== "admin") redirect("/");
  return usuario;
}
