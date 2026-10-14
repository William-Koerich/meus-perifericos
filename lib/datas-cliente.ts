/** Date -> valor para <input type="datetime-local"> no fuso do navegador. */
export function paraInputLocal(data: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}`;
}

/** Valor do <input type="datetime-local"> (horário local) -> ISO 8601 com fuso. */
export function inputLocalParaIso(valor: string) {
  if (!valor) return "";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toISOString();
}

function com(data: Date, dias: number, hora: number) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

/**
 * Atalhos de previsão de devolução. A data é calculada no clique (no navegador),
 * para não depender do relógio/fuso do servidor na renderização.
 */
export const ATALHOS_PREVISAO: { label: string; calcular: (agora: Date) => Date }[] = [
  { label: "Hoje 22h", calcular: (agora) => com(agora, 0, 22) },
  { label: "Amanhã 12h", calcular: (agora) => com(agora, 1, 12) },
  {
    // Próximo domingo às 18h; se hoje é domingo, o da semana seguinte
    label: "Domingo 18h",
    calcular: (agora) => com(agora, (7 - agora.getDay()) % 7 || 7, 18),
  },
  { label: "Em 7 dias", calcular: (agora) => com(agora, 7, 18) },
];
