"use client";

import {
  ArrowLeftRightIcon,
  HomeIcon,
  PackageIcon,
  ScanLineIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const NAV_ITENS = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/itens", label: "Itens", icon: PackageIcon },
  { href: "/escanear", label: "Escanear", icon: ScanLineIcon },
  { href: "/emprestimos", label: "Empréstimos", icon: ArrowLeftRightIcon },
  { href: "/pessoas", label: "Pessoas", icon: UsersIcon },
] as const;

function estaAtivo(pathname: string | undefined, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type Variante = "inferior" | "topo";

export function NavLinks({
  variante,
  pathname,
}: {
  variante: Variante;
  pathname?: string;
}) {
  if (variante === "topo") {
    return (
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_ITENS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              estaAtivo(pathname, href) && "bg-muted font-medium text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITENS.map(({ href, label, icon: Icon }) => {
          const ativo = estaAtivo(pathname, href);
          const destaque = href === "/escanear";
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground",
                  ativo && "font-medium text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full",
                    destaque
                      ? "size-10 -mt-1 bg-primary text-primary-foreground"
                      : "size-6",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Versão com destaque da rota atual (fica dentro de um Suspense). */
export function NavLinksAtivos({ variante }: { variante: Variante }) {
  const pathname = usePathname();
  return <NavLinks variante={variante} pathname={pathname} />;
}
