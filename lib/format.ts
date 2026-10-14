export const FUSO_HORARIO = "America/Sao_Paulo";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: FUSO_HORARIO,
});

const data = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: FUSO_HORARIO,
});

export function formatarDataHora(valor: Date | string) {
  return dataHora.format(new Date(valor));
}

export function formatarData(valor: Date | string) {
  return data.format(new Date(valor));
}
