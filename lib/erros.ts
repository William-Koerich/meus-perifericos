/** Erro de regra de negócio: a mensagem pode ser mostrada ao usuário. */
export class ErroNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroNegocio";
  }
}

export function mensagemDeErro(error: unknown, padrao = "Ocorreu um erro inesperado.") {
  if (error instanceof ErroNegocio) return error.message;
  console.error(error);
  return padrao;
}
