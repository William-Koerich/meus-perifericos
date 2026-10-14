import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Rotas acessíveis sem login
const ROTAS_PUBLICAS = ["/login", "/auth", "/~offline"];

function ehPublica(pathname: string) {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

// Checagem otimista: renova a sessão e redireciona. A autorização de verdade
// (perfil, usuário ativo) é feita em lib/auth.ts nas páginas e Server Actions.
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const redirecionarPreservandoCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && !ehPublica(pathname)) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("redirecionar", pathname + search);
    return redirecionarPreservandoCookies(url);
  }

  if (user && pathname === "/login") {
    return redirecionarPreservandoCookies(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, imagens, ícones, manifest e service worker
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|icons/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
