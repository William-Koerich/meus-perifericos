"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BotaoImprimir({ disabled }: { disabled?: boolean }) {
  return (
    <Button onClick={() => window.print()} disabled={disabled}>
      <PrinterIcon />
      Imprimir
    </Button>
  );
}
