import type { EstadoConservacao, StatusItem } from "@/lib/db/schema";

export const STATUS_ITEM: Record<
  StatusItem,
  { label: string; className: string; ponto: string }
> = {
  disponivel: {
    label: "Disponível",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    ponto: "bg-emerald-500",
  },
  emprestado: {
    label: "Emprestado",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ponto: "bg-amber-500",
  },
  manutencao: {
    label: "Manutenção",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    ponto: "bg-sky-500",
  },
  baixado: {
    label: "Baixado",
    className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    ponto: "bg-zinc-400",
  },
};

export const ESTADO_CONSERVACAO: Record<EstadoConservacao, string> = {
  novo: "Novo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  danificado: "Danificado",
};

export const BUCKET_FOTOS =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET_FOTOS ?? "periferico-fotos";

export const MAX_FOTOS_POR_ITEM = 8;

// Caminhos gerados pelo upload no cliente: itens/<uuid>.jpg
export const REGEX_CAMINHO_FOTO =
  /^itens\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/;

export function urlFoto(caminho: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_FOTOS}/${caminho}`;
}
