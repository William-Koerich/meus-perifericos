export const PREFIXO_TAG = "IGR";

// Trocas comuns do OCR na parte numérica do código
const CORRECOES_DIGITOS: Record<string, string> = {
  O: "0",
  D: "0",
  Q: "0",
  I: "1",
  L: "1",
  "|": "1",
  Z: "2",
  S: "5",
  G: "6",
  B: "8",
};

/**
 * Extrai a tag (ex.: "IGR-0001") de um texto digitado ou lido pela câmera (OCR).
 * Aceita "IGR-0001", "igr-1", "IGR 0001", "IGR0001" e corrige trocas comuns do
 * OCR nos números (O→0, I→1, S→5…).
 */
export function extrairTag(texto: string): string | null {
  const normalizado = texto.toUpperCase().replace(/[–—_.:]/g, "-");

  // Prefixo IGR (o "I" às vezes é lido como 1/L/|) seguido dos números
  const encontrado = normalizado.match(/[I1L|]?\s*G\s*R\s*-?\s*([0-9OQDILZSGB|]{1,10})/);
  if (!encontrado) return null;

  const numero = encontrado[1]
    .split("")
    .map((c) => CORRECOES_DIGITOS[c] ?? c)
    .join("");
  if (!/^\d+$/.test(numero) || Number(numero) === 0) return null;

  return `${PREFIXO_TAG}-${numero.padStart(4, "0")}`;
}
