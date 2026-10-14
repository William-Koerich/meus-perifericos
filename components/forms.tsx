"use client";

import { Loader2Icon } from "lucide-react";
import {
  startTransition,
  useActionState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useHidratado } from "@/hooks/use-hidratado";
import type { ActionState } from "@/lib/actions/types";

type Acao = (anterior: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Envia o formulário para uma Server Action sem o reset automático do React 19
 * (que apagaria o que foi digitado quando há erro de validação).
 * Mostra toast de sucesso e chama onSucesso quando a action retorna ok.
 */
export function useFormAction(acao: Acao, onSucesso?: () => void) {
  const [state, dispatch, pendente] = useActionState<ActionState, FormData>(
    async (anterior, formData) => {
      const resultado = await acao(anterior, formData);
      if (resultado.ok) {
        if (resultado.mensagem) toast.success(resultado.mensagem);
        onSucesso?.();
      }
      return resultado;
    },
    {},
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pendente, onSubmit };
}

export function ErroGeral({ state }: { state: ActionState }) {
  if (!state.erro) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{state.erro}</AlertDescription>
    </Alert>
  );
}

export function Campo({
  nome,
  label,
  state,
  descricao,
  children,
}: {
  nome: string;
  label: string;
  state: ActionState;
  descricao?: string;
  children: ReactNode;
}) {
  const erro = state.campos?.[nome]?.[0];
  return (
    <Field data-invalid={!!erro}>
      <FieldLabel htmlFor={nome}>{label}</FieldLabel>
      {children}
      {descricao && <FieldDescription>{descricao}</FieldDescription>}
      <FieldError>{erro}</FieldError>
    </Field>
  );
}

export function BotaoSalvar({
  pendente,
  disabled,
  children,
}: {
  pendente: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  // Antes da hidratação o envio seria nativo (sem a Server Action): mantém desabilitado
  const hidratado = useHidratado();
  return (
    <Button
      type="submit"
      className="h-11 w-full"
      disabled={!hidratado || pendente || disabled}
    >
      {pendente && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  );
}
