import { asc } from "drizzle-orm";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  NovoUsuarioDialog,
  UsuarioAcoes,
} from "@/components/usuarios/usuario-dialogs";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  const atual = await exigirAdmin();

  const usuarios = await db
    .select()
    .from(profiles)
    .orderBy(asc(profiles.nome));

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao="Quem pode acessar o sistema"
        acoes={<NovoUsuarioDialog />}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {usuarios.map((u) => (
          <Card key={u.id} className={u.ativo ? undefined : "opacity-60"}>
            <CardContent className="flex flex-col gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{u.nome}</p>
                  {u.id === atual.id && <Badge variant="outline">Você</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {u.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <Badge variant={u.perfil === "admin" ? "default" : "secondary"}>
                    {u.perfil === "admin" ? "Administrador" : "Operador"}
                  </Badge>
                  {!u.ativo && <Badge variant="destructive">Desativado</Badge>}
                </div>
                <UsuarioAcoes
                  usuario={{
                    id: u.id,
                    nome: u.nome,
                    perfil: u.perfil,
                    ativo: u.ativo,
                  }}
                  ehVoceMesmo={u.id === atual.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
