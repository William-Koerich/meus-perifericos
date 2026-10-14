import { z } from "zod";

import { estadoConservacaoEnum } from "@/lib/db/schema";

import { pessoaCampos } from "./pessoas";

/** Campo enviado como JSON em um <input type="hidden">. */
function json<T extends z.ZodType>(schema: T, mensagem: string) {
  return z
    .string({ error: mensagem })
    .transform((v, ctx) => {
      try {
        return JSON.parse(v) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", error: mensagem });
        return z.NEVER;
      }
    })
    .pipe(schema);
}

type PessoaDoEmprestimo =
  | { tipo: "existente"; id: string }
  | {
      tipo: "nova";
      dados: { nome: string; telefone: string | null; ministerio: string | null };
    };

const observacoes = z
  .string()
  .trim()
  .max(1000, { error: "Máximo de 1000 caracteres." })
  .optional()
  .transform((v) => (v ? v : null));

export const criarEmprestimoSchema = z
  .object({
    modoPessoa: z.enum(["existente", "nova"]),
    pessoaId: z.string().optional(),
    novaPessoaNome: z.string().optional(),
    novaPessoaTelefone: z.string().optional(),
    novaPessoaMinisterio: z.string().optional(),
    itens: json(
      z
        .array(z.uuid())
        .min(1, { error: "Adicione pelo menos um item." })
        .max(50, { error: "Máximo de 50 itens por empréstimo." })
        .transform((ids) => [...new Set(ids)]),
      "Adicione pelo menos um item.",
    ),
    // ISO 8601 gerado no navegador a partir do campo data/hora local
    previsaoDevolucao: z.iso
      .datetime({ offset: true, error: "Informe a data e hora previstas para a devolução." })
      .transform((v) => new Date(v))
      .refine((d) => d.getTime() > Date.now() - 60_000, {
        error: "A previsão de devolução deve ser no futuro.",
      }),
    observacoes,
  })
  .transform((d, ctx) => {
    if (d.modoPessoa === "existente") {
      if (!z.uuid().safeParse(d.pessoaId).success) {
        ctx.addIssue({
          code: "custom",
          path: ["pessoaId"],
          error: "Selecione quem está levando os itens.",
        });
        return z.NEVER;
      }
      const pessoa: PessoaDoEmprestimo = { tipo: "existente", id: d.pessoaId! };
      return { ...d, pessoa };
    }

    const nova = z
      .object(pessoaCampos)
      .safeParse({
        nome: d.novaPessoaNome,
        telefone: d.novaPessoaTelefone,
        ministerio: d.novaPessoaMinisterio,
      });
    if (!nova.success) {
      for (const issue of nova.error.issues) {
        const campo = String(issue.path[0]);
        ctx.addIssue({
          code: "custom",
          path: [`novaPessoa${campo[0].toUpperCase()}${campo.slice(1)}`],
          error: issue.message,
        });
      }
      return z.NEVER;
    }
    const pessoa: PessoaDoEmprestimo = { tipo: "nova", dados: nova.data };
    return { ...d, pessoa };
  });

export const registrarDevolucaoSchema = z.object({
  emprestimoId: z.uuid(),
  devolucoes: json(
    z
      .array(
        z.object({
          id: z.uuid(),
          estado: z.enum(estadoConservacaoEnum.enumValues),
          observacao: z
            .string()
            .trim()
            .max(500)
            .optional()
            .transform((v) => (v ? v : null)),
          manutencao: z.boolean().default(false),
        }),
      )
      .min(1, { error: "Selecione pelo menos um item para devolver." }),
    "Selecione pelo menos um item para devolver.",
  ),
});
