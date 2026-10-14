// @ts-check
// Gera public/sw.js depois do `next build` (modo configurador do @serwist/next,
// compatível com Turbopack e cacheComponents). Ver script "build" no package.json.
import crypto from "node:crypto";

import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // As páginas dependem do usuário logado: o HTML pré-renderizado é só o "shell"
  // (esqueleto) e não deve ser servido do cache. Elas usam cache de runtime.
  precachePrerendered: false,
  additionalPrecacheEntries: [
    { url: "/~offline", revision: crypto.randomUUID() },
  ],
});
