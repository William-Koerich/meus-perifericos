"use client";

import { ExternalLinkIcon, KeyboardIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { AcaoRapida } from "@/components/itens/acao-rapida";
import { ItemMini } from "@/components/itens/item-mini";
import { StatusBadge } from "@/components/itens/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consultarTag } from "@/lib/actions/emprestimos";
import { extrairTag } from "@/lib/tag";
import { cn } from "@/lib/utils";

import { LeitorQr } from "./leitor-qr";

type Resultado =
  | { tipo: "item"; dados: NonNullable<Awaited<ReturnType<typeof consultarTag>>> }
  | { tipo: "nao-encontrado"; texto: string };

export function ScannerTela() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [consultando, startTransition] = useTransition();
  const [digitado, setDigitado] = useState("");
  // Última etiqueta lida pela câmera: enquanto ela continuar na frente da
  // câmera, não refaz a consulta (nem sobrescreve uma tag digitada).
  const ultimaDaCamera = useRef<string | null>(null);
  // Depois de uma busca digitada, a câmera espera um pouco antes de trocar o resultado
  const cameraPausadaAte = useRef(0);

  function lidoPelaCamera(texto: string) {
    if (Date.now() < cameraPausadaAte.current) return;
    const tag = extrairTag(texto) ?? texto;
    if (tag === ultimaDaCamera.current) return;
    ultimaDaCamera.current = tag;
    consultar(texto);
  }

  function consultar(texto: string) {
    const tag = extrairTag(texto);
    if (!tag) {
      setResultado({ tipo: "nao-encontrado", texto });
      return;
    }
    startTransition(async () => {
      const dados = await consultarTag(tag);
      setResultado(dados ? { tipo: "item", dados } : { tipo: "nao-encontrado", texto: tag });
    });
  }

  return (
    <div className="space-y-4">
      <LeitorQr onLeitura={lidoPelaCamera} className="mx-auto max-w-sm" />

      <form
        className="mx-auto flex max-w-sm gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!digitado.trim()) return;
          cameraPausadaAte.current = Date.now() + 8000;
          consultar(digitado);
        }}
      >
        <div className="relative flex-1">
          <KeyboardIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            placeholder="Ou digite a tag (IGR-0001)"
            aria-label="Digitar a tag"
            autoCapitalize="characters"
            className="h-11 pl-9 font-mono"
          />
        </div>
        <Button type="submit" variant="outline" className="h-11" disabled={!digitado.trim()}>
          Buscar
        </Button>
      </form>

      <div aria-live="polite" className="mx-auto max-w-sm">
        {consultando && (
          <div className="flex items-center justify-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Buscando item…
          </div>
        )}

        {!consultando && resultado?.tipo === "nao-encontrado" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            Nenhum item encontrado para <span className="font-mono">“{resultado.texto}”</span>.
          </div>
        )}

        {!consultando && resultado?.tipo === "item" && (
          <CartaoItem dados={resultado.dados} />
        )}

        {!resultado && !consultando && (
          <p className="text-center text-sm text-muted-foreground">
            Aponte a câmera para a etiqueta do equipamento.
          </p>
        )}
      </div>
    </div>
  );
}

function CartaoItem({
  dados: { item, emprestimoAbertoId },
}: {
  dados: NonNullable<Awaited<ReturnType<typeof consultarTag>>>;
}) {
  const temAcao = item.status === "disponivel" || (item.status === "emprestado" && emprestimoAbertoId);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <ItemMini item={item}>
        <StatusBadge status={item.status} className="shrink-0" />
      </ItemMini>
      {item.localArmazenamento && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          {item.localArmazenamento}
        </p>
      )}
      {!temAcao && (
        <p className="text-sm text-muted-foreground">
          Este item está em {item.status === "manutencao" ? "manutenção" : "baixa"} e não pode
          ser emprestado.
        </p>
      )}
      <div className={cn("grid gap-2", temAcao && "grid-cols-2")}>
        <AcaoRapida item={item} emprestimoAbertoId={emprestimoAbertoId} tamanho="lg" className="h-11" />
        <Link
          href={`/itens/${item.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
        >
          <ExternalLinkIcon />
          Ver item
        </Link>
      </div>
    </div>
  );
}
