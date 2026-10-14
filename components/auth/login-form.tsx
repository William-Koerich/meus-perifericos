"use client";

import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { entrar } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/types";

const MOTIVOS: Record<string, string> = {
  inativo: "Seu usuário foi desativado. Fale com um administrador.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");
  const redirecionar = searchParams.get("redirecionar") ?? "/";

  const [state, formAction, pendente] = useActionState<ActionState, FormData>(
    entrar,
    {},
  );

  const aviso = state.erro ?? (motivo ? MOTIVOS[motivo] : undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirecionar" value={redirecionar} />

      {aviso && (
        <Alert variant="destructive">
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!state.campos?.email}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            className="h-11"
            aria-invalid={!!state.campos?.email}
          />
          <FieldError>{state.campos?.email?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!state.campos?.senha}>
          <FieldLabel htmlFor="senha">Senha</FieldLabel>
          <Input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="h-11"
            aria-invalid={!!state.campos?.senha}
          />
          <FieldError>{state.campos?.senha?.[0]}</FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" className="h-11 w-full" disabled={pendente}>
        {pendente && <Loader2Icon className="animate-spin" />}
        Entrar
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Esqueceu a senha? Peça a um administrador para redefini-la.
      </p>
    </form>
  );
}
