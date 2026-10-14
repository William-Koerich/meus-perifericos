"use client";

import { ScanLineIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { extrairTag } from "@/lib/tag";

import { LeitorQr } from "./leitor-qr";

/** Botão que abre a câmera num diálogo; cada QR lido chama onTag (vários seguidos). */
export function EscanearDialog({ onTag }: { onTag: (tag: string) => Promise<void> | void }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button type="button" className="h-11" />}>
        <ScanLineIcon />
        QR
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear itens</DialogTitle>
          <DialogDescription>
            Aponte para as etiquetas. Cada item lido é adicionado à lista.
          </DialogDescription>
        </DialogHeader>
        {/* O leitor só existe enquanto o diálogo está aberto: a câmera desliga ao fechar */}
        {aberto && (
          <LeitorQr
            onLeitura={(texto) => {
              const tag = extrairTag(texto);
              if (tag) onTag(tag);
              else toast.error("QR Code não reconhecido como etiqueta.");
            }}
          />
        )}
        <DialogFooter>
          <Button type="button" onClick={() => setAberto(false)}>
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
