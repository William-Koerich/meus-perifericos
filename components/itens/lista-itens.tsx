"use client";

import { PackageIcon, PrinterIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { urlFoto } from "@/lib/constants";
import type { StatusItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

type Item = {
  id: string;
  tag: string;
  nome: string;
  status: StatusItem;
  localArmazenamento: string | null;
  categoria: string;
  foto: string | null;
};

export function ListaItens({ itens }: { itens: Item[] }) {
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function sairDaSelecao() {
    setSelecionando(false);
    setSelecionados(new Set());
  }

  const todosSelecionados =
    itens.length > 0 && itens.every((i) => selecionados.has(i.id));

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        {selecionando ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={todosSelecionados}
                onCheckedChange={(marcado) =>
                  setSelecionados(
                    marcado ? new Set(itens.map((i) => i.id)) : new Set(),
                  )
                }
              />
              Selecionar todos desta página
            </label>
            <Button variant="ghost" size="sm" onClick={sairDaSelecao}>
              <XIcon />
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelecionando(true)}
            disabled={!itens.length}
          >
            <PrinterIcon />
            Imprimir etiquetas
          </Button>
        )}
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {itens.map((item) => {
          const conteudo = (
            <>
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.foto ? (
                  <Image
                    src={urlFoto(item.foto)}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <PackageIcon className="absolute inset-0 m-auto size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">{item.tag}</span> · {item.categoria}
                  {item.localArmazenamento && ` · ${item.localArmazenamento}`}
                </p>
              </div>
              <StatusBadge status={item.status} className="shrink-0" />
            </>
          );

          return (
            <li key={item.id}>
              {selecionando ? (
                <label className="flex cursor-pointer items-center gap-3 p-3">
                  <Checkbox
                    checked={selecionados.has(item.id)}
                    onCheckedChange={() => alternar(item.id)}
                  />
                  {conteudo}
                </label>
              ) : (
                <Link
                  href={`/itens/${item.id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                >
                  {conteudo}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {selecionando && (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-[env(safe-area-inset-bottom)] md:bottom-4">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-lg">
            <span className="text-sm">
              {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
            </span>
            <Link
              href={`/itens/etiquetas?ids=${[...selecionados].join(",")}`}
              aria-disabled={!selecionados.size}
              className={cn(
                buttonVariants(),
                !selecionados.size && "pointer-events-none opacity-50",
              )}
            >
              <PrinterIcon />
              Imprimir
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
