"use client";

import { LogOutIcon, ShieldIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { limparCacheDoUsuario } from "@/components/pwa/service-worker";
import { sair } from "@/lib/actions/auth";
import type { Perfil } from "@/lib/db/schema";

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: "Administrador",
  operador: "Operador",
};

export function UserMenuClient({
  nome,
  email,
  perfil,
}: {
  nome: string;
  email: string;
  perfil: Perfil;
}) {
  const [saindo, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="max-w-44 gap-2">
            <UserIcon />
            <span className="truncate">{nome.split(" ")[0]}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-0.5">
            <span className="block truncate text-sm text-foreground">{nome}</span>
            <span className="block truncate">{email}</span>
            <span className="block">{PERFIL_LABEL[perfil]}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {perfil === "admin" && (
          <DropdownMenuItem render={<Link href="/usuarios" />}>
            <ShieldIcon />
            Usuários
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          disabled={saindo}
          onClick={() =>
            startTransition(async () => {
              await limparCacheDoUsuario();
              await sair();
            })
          }
        >
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
