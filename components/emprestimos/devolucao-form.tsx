"use client";

import { WrenchIcon } from "lucide-react";
import { useState } from "react";

import { BotaoSalvar, ErroGeral, useFormAction } from "@/components/forms";
import { ItemMini } from "@/components/itens/item-mini";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { registrarDevolucao } from "@/lib/actions/emprestimos";
import { ESTADO_CONSERVACAO } from "@/lib/constants";
import type { EstadoConservacao } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Pendente = {
  id: string;
  estadoSaida: EstadoConservacao;
  item: { id: string; tag: string; nome: string; foto: string | null };
};

type Linha = {
  selecionado: boolean;
  estado: EstadoConservacao;
  manutencao: boolean;
  observacao: string;
};

export function DevolucaoForm({
  emprestimoId,
  pendentes,
  itemPreSelecionado,
}: {
  emprestimoId: string;
  pendentes: Pendente[];
  /** Vindo do scanner: marca só este item. */
  itemPreSelecionado?: string;
}) {
  const { state, pendente, onSubmit } = useFormAction(registrarDevolucao);
  const preSelecionado = pendentes.some((p) => p.item.id === itemPreSelecionado)
    ? itemPreSelecionado
    : undefined;

  const [linhas, setLinhas] = useState<Record<string, Linha>>(() =>
    Object.fromEntries(
      pendentes.map((p) => [
        p.id,
        {
          selecionado: preSelecionado ? p.item.id === preSelecionado : true,
          estado: p.estadoSaida,
          manutencao: false,
          observacao: "",
        },
      ]),
    ),
  );

  function alterar(id: string, mudanca: Partial<Linha>) {
    setLinhas((atual) => ({ ...atual, [id]: { ...atual[id], ...mudanca } }));
  }

  const selecionados = pendentes.filter((p) => linhas[p.id]?.selecionado);
  const todos = selecionados.length === pendentes.length;
  const devolucoes = selecionados.map((p) => ({
    id: p.id,
    estado: linhas[p.id].estado,
    manutencao: linhas[p.id].manutencao,
    observacao: linhas[p.id].observacao,
  }));

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="emprestimoId" value={emprestimoId} />
      <input type="hidden" name="devolucoes" value={JSON.stringify(devolucoes)} />
      <ErroGeral state={state} />

      {pendentes.length > 1 && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={todos}
            onCheckedChange={(marcado) =>
              setLinhas((atual) =>
                Object.fromEntries(
                  Object.entries(atual).map(([id, l]) => [id, { ...l, selecionado: !!marcado }]),
                ),
              )
            }
          />
          Selecionar todos
        </label>
      )}

      <ul className="space-y-2">
        {pendentes.map((p) => {
          const linha = linhas[p.id];
          return (
            <li
              key={p.id}
              className={cn(
                "space-y-3 rounded-lg border p-3 transition-colors",
                linha.selecionado ? "border-primary/50 bg-primary/5" : "opacity-70",
              )}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={linha.selecionado}
                  onCheckedChange={(marcado) => alterar(p.id, { selecionado: !!marcado })}
                  aria-label={`Devolver ${p.item.nome}`}
                />
                <ItemMini item={p.item} className="flex-1" />
              </label>

              {linha.selecionado && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Estado na volta
                    <NativeSelect
                      value={linha.estado}
                      onChange={(e) =>
                        alterar(p.id, { estado: e.target.value as EstadoConservacao })
                      }
                      className="h-10 text-foreground"
                    >
                      {Object.entries(ESTADO_CONSERVACAO).map(([valor, label]) => (
                        <option key={valor} value={valor}>
                          {label}
                          {valor === p.estadoSaida ? " (como saiu)" : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Observação
                    <Input
                      value={linha.observacao}
                      onChange={(e) => alterar(p.id, { observacao: e.target.value })}
                      placeholder="Opcional"
                      className="h-10"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <Checkbox
                      checked={linha.manutencao}
                      onCheckedChange={(marcado) => alterar(p.id, { manutencao: !!marcado })}
                    />
                    <WrenchIcon className="size-4 text-muted-foreground" />
                    Enviar para manutenção (em vez de “Disponível”)
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <BotaoSalvar pendente={pendente} disabled={!selecionados.length}>
        {todos
          ? "Registrar devolução de todos"
          : `Registrar devolução (${selecionados.length} de ${pendentes.length})`}
      </BotaoSalvar>
    </form>
  );
}
