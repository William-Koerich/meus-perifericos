import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Encerra a sessão e volta ao login (usado quando o usuário foi desativado).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  const motivo = request.nextUrl.searchParams.get("motivo");
  if (motivo) url.searchParams.set("motivo", motivo);

  return NextResponse.redirect(url);
}
