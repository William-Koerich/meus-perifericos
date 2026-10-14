import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotaoImprimir } from "@/components/itens/botao-imprimir";
import { QrCode } from "@/components/itens/qr-code";
import { PageHeader } from "@/components/layout/page-header";
import { exigirUsuario } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { obterItensParaEtiquetas } from "@/lib/queries/itens";

export const metadata: Metadata = { title: "Etiquetas" };

const TAMANHOS = {
  pequena: { label: "Pequena (3,5 cm)", etiqueta: "w-[38mm]", qr: "size-[26mm]", texto: "text-[9px]", tag: "text-[11px]" },
  media: { label: "Média (5 cm)", etiqueta: "w-[52mm]", qr: "size-[38mm]", texto: "text-[10px]", tag: "text-sm" },
  grande: { label: "Grande (7 cm)", etiqueta: "w-[72mm]", qr: "size-[56mm]", texto: "text-xs", tag: "text-base" },
} as const;

type Tamanho = keyof typeof TAMANHOS;

export default async function EtiquetasPage(props: PageProps<"/itens/etiquetas">) {
  await exigirUsuario();

  const searchParams = await props.searchParams;
  const ids = String(searchParams.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const tamanho: Tamanho =
    typeof searchParams.tamanho === "string" && searchParams.tamanho in TAMANHOS
      ? (searchParams.tamanho as Tamanho)
      : "media";
  const estilo = TAMANHOS[tamanho];

  const itens = await obterItensParaEtiquetas(ids);

  return (
    <>
      <div className="print:hidden">
        <Link
          href="/itens"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Itens
        </Link>
        <PageHeader
          titulo="Etiquetas"
          descricao={`${itens.length} etiqueta${itens.length === 1 ? "" : "s"} para imprimir`}
          acoes={<BotaoImprimir disabled={!itens.length} />}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(TAMANHOS) as Tamanho[]).map((t) => (
            <Link
              key={t}
              href={`/itens/etiquetas?ids=${ids.join(",")}&tamanho=${t}`}
              replace
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                t === tamanho
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {TAMANHOS[t].label}
            </Link>
          ))}
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Dica: na janela de impressão, use escala 100% (“tamanho real”) e
          desative cabeçalhos e rodapés. A linha tracejada é a guia de corte.
        </p>
      </div>

      {itens.length ? (
        <div className="flex flex-wrap gap-[3mm] bg-white text-black print:gap-[2mm]">
          {itens.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex break-inside-avoid flex-col items-center gap-[1.5mm] border border-dashed border-zinc-400 p-[2.5mm]",
                estilo.etiqueta,
              )}
            >
              <QrCode valor={item.tag} className={estilo.qr} />
              <p className={cn("font-mono font-bold leading-none", estilo.tag)}>
                {item.tag}
              </p>
              <p
                className={cn(
                  "line-clamp-2 w-full text-center leading-tight",
                  estilo.texto,
                )}
              >
                {item.nome}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum item selecionado. Volte à lista, toque em “Imprimir etiquetas”
          e selecione os itens.
        </p>
      )}
    </>
  );
}
