import { z } from "zod";

/** Estado retornado pelas Server Actions usadas com useActionState. */
export type ActionState = {
  ok?: boolean;
  mensagem?: string;
  erro?: string;
  campos?: Record<string, string[] | undefined>;
};

export function errosDeValidacao(error: z.ZodError): ActionState {
  const { fieldErrors } = z.flattenError(error);
  return {
    erro: "Verifique os campos destacados.",
    campos: fieldErrors as Record<string, string[] | undefined>,
  };
}
