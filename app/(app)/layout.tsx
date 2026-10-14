import { PackageIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { NavLinks, NavLinksAtivos } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

// O layout não lê a sessão no topo: só o menu do usuário (em Suspense) depende
// do request, o resto entra no shell estático. As páginas chamam exigirUsuario().
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 print:hidden border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageIcon className="size-4" />
            </span>
            <span>Meus Periféricos</span>
          </Link>

          <Suspense fallback={<NavLinks variante="topo" />}>
            <NavLinksAtivos variante="topo" />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-7 w-24" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:pb-8 print:max-w-none print:p-0">
        {children}
      </main>

      <Suspense fallback={<NavLinks variante="inferior" />}>
        <NavLinksAtivos variante="inferior" />
      </Suspense>
    </div>
  );
}
