import { z } from "zod";

import { MAX_FOTOS_POR_ITEM, REGEX_CAMINHO_FOTO } from "@/lib/constants";
import { estadoConservacaoEnum } from "@/lib/db/schema";

export const NOVA_CATEGORIA = "__nova";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo de ${max} caracteres.` })
    .optional()
    .transform((v) => (v ? v : null));

const fotos = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return [];
    try {
      return JSON.parse(v) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", error: "Lista de fotos inválida." });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(z.string().regex(REGEX_CAMINHO_FOTO, { error: "Foto inválida." }))
      .max(MAX_FOTOS_POR_ITEM, {
        error: `No máximo ${MAX_FOTOS_POR_ITEM} fotos por item.`,
      }),
  );

export const itemSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, { error: "Informe o nome do item." })
      .max(120, { error: "Máximo de 120 caracteres." }),
    categoriaId: z.string({ error: "Selecione a categoria." }),
    novaCategoria: textoOpcional(60),
    descricao: textoOpcional(2000),
    numeroSerie: textoOpcional(100),
    localArmazenamento: textoOpcional(120),
    estadoConservacao: z.enum(estadoConservacaoEnum.enumValues, {
      error: "Selecione o estado de conservação.",
    }),
    // "emprestado" só é definido pelo fluxo de empréstimo
    status: z
      .enum(["disponivel", "manutencao", "baixado"], {
        error: "Status inválido.",
      })
      .optional(),
    fotos,
  })
  .superRefine((d, ctx) => {
    if (d.categoriaId === NOVA_CATEGORIA) {
      if (!d.novaCategoria || d.novaCategoria.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["novaCategoria"],
          error: "Informe o nome da nova categoria.",
        });
      }
    } else if (!z.uuid().safeParse(d.categoriaId).success) {
      ctx.addIssue({
        code: "custom",
        path: ["categoriaId"],
        error: "Selecione a categoria.",
      });
    }
  });

export type ItemInput = z.infer<typeof itemSchema>;
