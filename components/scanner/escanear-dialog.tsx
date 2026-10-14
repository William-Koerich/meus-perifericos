"use client";

import { ScanTextIcon } from "lucide-react";
import { useState } from "react";

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

import { LeitorCodigo } from "./leitor-codigo";

/** Botão que abre a câmera num diálogo; cada código lido chama onTag (vários seguidos). */
export function EscanearDialog({ onTag }: { onTag: (tag: string) => Promise<void> | void }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button type="button" className="h-11" />}>
        <ScanTextIcon />
        Câmera
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear itens</DialogTitle>
          <DialogDescription>
            Aponte para o código de cada etiqueta (ex.: IGR-0001). Cada item lido é
            adicionado à lista.
          </DialogDescription>
        </DialogHeader>
        {/* O leitor só existe enquanto o diálogo está aberto: a câmera desliga ao fechar */}
        {aberto && <LeitorCodigo onLeitura={onTag} />}
        <DialogFooter>
          <Button type="button" onClick={() => setAberto(false)}>
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
