import { sql } from "drizzle-orm";
import { connection, NextResponse } from "next/server";

import { db } from "@/lib/db";

// Diagnóstico da implantação: confere variáveis e conexão com o banco.
// Não expõe valores secretos — só se existem e a porta usada.
export async function GET() {
  await connection();

  const url = process.env.DATABASE_URL;
  let porta: string | null = null;
  try {
    porta = url ? new URL(url).port || "5432" : null;
  } catch {
    porta = "inválida";
  }

  const variaveis = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
    DATABASE_URL: !!url,
    DATABASE_URL_porta: porta,
  };

  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ banco: "ok", variaveis });
  } catch (error) {
    const e = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    return NextResponse.json(
      {
        banco: "erro",
        codigo: e.cause?.code ?? e.code ?? null,
        motivo: (e.cause?.message ?? e.message ?? String(error)).slice(0, 300),
        variaveis,
      },
      { status: 500 },
    );
  }
}
