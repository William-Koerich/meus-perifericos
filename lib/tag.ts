/**
 * Extrai a tag de um texto lido do QR Code ou digitado.
 * Aceita "IGR-0001", "igr-1", "IGR 0001" ou um texto/URL que contenha a tag.
 */
export function extrairTag(texto: string): string | null {
  const encontrado = texto.trim().match(/([A-Za-z]{2,5})[-\s]?(\d{1,10})/);
  if (!encontrado) return null;
  const [, prefixo, numero] = encontrado;
  return `${prefixo.toUpperCase()}-${numero.padStart(4, "0")}`;
}
