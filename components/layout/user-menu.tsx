import { getUsuarioAtual } from "@/lib/auth";

import { UserMenuClient } from "./user-menu-client";

export async function UserMenu() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return null;

  return (
    <UserMenuClient
      nome={usuario.nome}
      email={usuario.email}
      perfil={usuario.perfil}
    />
  );
}
