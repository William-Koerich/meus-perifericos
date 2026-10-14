"use client";

import { useSyncExternalStore } from "react";

const assinar = () => () => {};

/** false no HTML do servidor e até o React assumir a página no navegador. */
export function useHidratado() {
  return useSyncExternalStore(
    assinar,
    () => true,
    () => false,
  );
}
