import "server-only";

import { createClient } from "@supabase/supabase-js";

// Cliente com a secret key: ignora RLS. Usar SOMENTE no servidor (ex.: admin criando usuários).
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY não configurada no .env.local — necessária para gerenciar usuários.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
