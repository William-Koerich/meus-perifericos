import { PackageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { urlFoto } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Linha compacta de item: miniatura, nome e tag. */
export function ItemMini({
  item,
  children,
  className,
}: {
  item: { tag: string; nome: string; foto: string | null };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.foto ? (
          <Image src={urlFoto(item.foto)} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          <PackageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.nome}</p>
        <p className="font-mono text-xs text-muted-foreground">{item.tag}</p>
      </div>
      {children}
    </div>
  );
}
