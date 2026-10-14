"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

/** Registra o service worker (só em produção: o sw.js é gerado no build). */
export function ServiceWorker({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV !== "production"}
      // Não recarrega sozinho ao voltar a conexão (perderia formulários em andamento)
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}

/**
 * Apaga as páginas guardadas no cache do navegador (dados do usuário) ao sair,
 * mantendo apenas os arquivos estáticos do app (precache).
 */
export async function limparCacheDoUsuario() {
  if (typeof caches === "undefined") return;
  const nomes = await caches.keys();
  await Promise.all(
    nomes.filter((n) => !n.includes("precache")).map((n) => caches.delete(n)),
  );
}
