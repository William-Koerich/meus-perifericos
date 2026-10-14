import { z } from "zod";

/** Escapa curingas do LIKE/ILIKE (% e _) para buscar o texto literal. */
export function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Termo para ILIKE "contém". */
export function contem(texto: string) {
  return `%${escaparLike(texto)}%`;
}

export const ehUuid = (v: unknown): v is string => z.uuid().safeParse(v).success;
