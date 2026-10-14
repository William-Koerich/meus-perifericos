import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotaoImprimir } from "@/components/itens/botao-imprimir";
import { PageHeader } from "@/components/layout/page-header";
import { exigirUsuario } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { obterItensParaEtiquetas } from "@/lib/queries/itens";

export const metadata: Metadata = { title: "Etiquetas" };

// O código é lido pela câmera (OCR): fonte simples, em negrito e grande
const TAMANHOS = {
  pequena: { label: "Pequena (4 cm)", etiqueta: "w-[40mm]", tag: "text-[5.5mm]", texto: "text-[8px]" },
  media: { label: "Média (5,5 cm)", etiqueta: "w-[55mm]", tag: "text-[8mm]", texto: "text-[10px]" },
  grande: { label: "Grande (7,5 cm)", etiqueta: "w-[75mm]", tag: "text-[11mm]", texto: "text-xs" },
} as const;

// Arial/Helvetica: zero sem barra e letras bem separadas, melhor para o OCR
const FONTE_CODIGO = { fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "0.04em" };

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
          Se for imprimir em outra impressora de etiquetas, use o código em
          negrito, fonte simples (Arial) e com pelo menos 5 mm de altura.
        </p>
      </div>

      {itens.length ? (
        <div className="flex flex-wrap gap-[3mm] bg-white text-black print:gap-[2mm]">
          {itens.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex break-inside-avoid flex-col items-center gap-[1.5mm] border border-dashed border-zinc-400 px-[3mm] py-[2.5mm]",
                estilo.etiqueta,
              )}
            >
              <p
                className={cn("font-bold leading-none whitespace-nowrap", estilo.tag)}
                style={FONTE_CODIGO}
              >
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
