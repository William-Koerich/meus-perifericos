import { z } from "zod";

const nome = z
  .string()
  .trim()
  .min(2, { error: "Informe o nome." })
  .max(100, { error: "Nome muito longo." });

const perfil = z.enum(["admin", "operador"], {
  error: "Selecione um perfil.",
});

const senha = z
  .string()
  .min(6, { error: "A senha deve ter pelo menos 6 caracteres." })
  .max(72, { error: "A senha deve ter no máximo 72 caracteres." });

export const criarUsuarioSchema = z.object({
  nome,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Informe um e-mail válido." })),
  senha,
  perfil,
});

export const atualizarUsuarioSchema = z.object({
  id: z.uuid(),
  nome,
  perfil,
  ativo: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const redefinirSenhaSchema = z
  .object({
    id: z.uuid(),
    senha,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    error: "As senhas não conferem.",
  });
