import { z } from "zod";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo de ${max} caracteres.` })
    .optional()
    .transform((v) => (v ? v : null));

export const pessoaCampos = {
  nome: z
    .string()
    .trim()
    .min(2, { error: "Informe o nome." })
    .max(120, { error: "Máximo de 120 caracteres." }),
  telefone: z
    .string()
    .trim()
    .max(30, { error: "Telefone muito longo." })
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || v.replace(/\D/g, "").length >= 8, {
      error: "Telefone inválido.",
    }),
  ministerio: textoOpcional(80),
};

export const pessoaSchema = z.object({
  ...pessoaCampos,
  observacoes: textoOpcional(1000),
});
