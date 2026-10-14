"use client";

import { useEffect, useState } from "react";

/**
 * Executa `buscar(termo)` com debounce sempre que o termo muda.
 * Ignora respostas antigas que chegarem fora de ordem.
 */
export function useBusca<T>(
  buscar: (termo: string) => Promise<T[]>,
  termo: string,
  { ativo = true, atraso = 300 }: { ativo?: boolean; atraso?: number } = {},
) {
  const [resultados, setResultados] = useState<T[]>([]);
  const [buscando, setBuscando] = useState(false);
  // true depois que a primeira busca terminou (evita "nada encontrado" piscando)
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await buscar(termo);
        if (!cancelado) {
          setResultados(r);
          setCarregado(true);
        }
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, atraso);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [buscar, termo, ativo, atraso]);

  return { resultados, buscando, carregado };
}
