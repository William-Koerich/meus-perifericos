import { WifiOffIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão" };

// Página estática pré-cacheada pelo service worker
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <WifiOffIcon className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Você está sem conexão</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Os empréstimos e devoluções precisam de internet para serem registrados.
        Verifique o Wi-Fi ou os dados móveis e tente de novo.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga completa de propósito */}
      <a
        href="/"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tentar novamente
      </a>
    </main>
  );
}
