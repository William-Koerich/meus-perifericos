"use client";

import { useCallback, useState } from "react";

import { BotaoSalvar, Campo, ErroGeral, useFormAction } from "@/components/forms";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { atualizarItem, criarItem } from "@/lib/actions/itens";
import { ESTADO_CONSERVACAO, STATUS_ITEM } from "@/lib/constants";
import type { EstadoConservacao, StatusItem } from "@/lib/db/schema";
import { NOVA_CATEGORIA } from "@/lib/validations/itens";

import { FotosInput } from "./fotos-input";

type ItemInicial = {
  id: string;
  tag: string;
  nome: string;
  categoriaId: string;
  descricao: string | null;
  numeroSerie: string | null;
  localArmazenamento: string | null;
  estadoConservacao: EstadoConservacao;
  status: StatusItem;
  fotos: string[];
};

const STATUS_EDITAVEIS = ["disponivel", "manutencao", "baixado"] as const;

export function ItemForm({
  item,
  categorias,
  locais,
}: {
  item?: ItemInicial;
  categorias: { id: string; nome: string }[];
  locais: string[];
}) {
  const { state, pendente, onSubmit } = useFormAction(
    item ? atualizarItem : criarItem,
  );
  const [categoria, setCategoria] = useState(item?.categoriaId ?? "");
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const onEnviandoChange = useCallback((v: boolean) => setEnviandoFotos(v), []);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {item && <input type="hidden" name="id" value={item.id} />}
      <ErroGeral state={state} />

      <FieldSet>
        <FieldLabel>Fotos</FieldLabel>
        <FotosInput
          name="fotos"
          iniciais={item?.fotos ?? []}
          onEnviandoChange={onEnviandoChange}
        />
      </FieldSet>

      <FieldGroup>
        {item && (
          <Field>
            <FieldLabel>Tag</FieldLabel>
            <p className="font-mono text-sm">{item.tag}</p>
          </Field>
        )}

        <Campo nome="nome" label="Nome" state={state}>
          <Input
            id="nome"
            name="nome"
            defaultValue={item?.nome}
            placeholder="Ex.: Microfone sem fio Shure"
            required
            className="h-11"
          />
        </Campo>

        <Campo nome="categoriaId" label="Categoria" state={state}>
          <NativeSelect
            id="categoriaId"
            name="categoriaId"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="h-11"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value={NOVA_CATEGORIA}>+ Nova categoria…</option>
          </NativeSelect>
        </Campo>

        {categoria === NOVA_CATEGORIA && (
          <Campo nome="novaCategoria" label="Nome da nova categoria" state={state}>
            <Input id="novaCategoria" name="novaCategoria" required className="h-11" autoFocus />
          </Campo>
        )}

        <Campo
          nome="localArmazenamento"
          label="Local de armazenamento"
          state={state}
        >
          <Input
            id="localArmazenamento"
            name="localArmazenamento"
            defaultValue={item?.localArmazenamento ?? ""}
            placeholder="Ex.: Armário 2 – Sala de som"
            list="locais-sugeridos"
            className="h-11"
          />
          <datalist id="locais-sugeridos">
            {locais.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo nome="estadoConservacao" label="Estado de conservação" state={state}>
            <NativeSelect
              id="estadoConservacao"
              name="estadoConservacao"
              defaultValue={item?.estadoConservacao ?? "bom"}
              className="h-11"
            >
              {Object.entries(ESTADO_CONSERVACAO).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Campo>

          {item?.status === "emprestado" ? (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Emprestado — o status volta a “Disponível” ao registrar a devolução.
              </p>
            </Field>
          ) : (
            <Campo nome="status" label="Status" state={state}>
              <NativeSelect
                id="status"
                name="status"
                defaultValue={item?.status ?? "disponivel"}
                className="h-11"
              >
                {STATUS_EDITAVEIS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_ITEM[s].label}
                  </option>
                ))}
              </NativeSelect>
            </Campo>
          )}
        </div>

        <Campo nome="numeroSerie" label="Número de série (opcional)" state={state}>
          <Input
            id="numeroSerie"
            name="numeroSerie"
            defaultValue={item?.numeroSerie ?? ""}
            className="h-11"
            autoCapitalize="characters"
          />
        </Campo>

        <Campo nome="descricao" label="Descrição (opcional)" state={state}>
          <Textarea
            id="descricao"
            name="descricao"
            defaultValue={item?.descricao ?? ""}
            rows={3}
            placeholder="Marca, modelo, acessórios que acompanham…"
          />
        </Campo>
      </FieldGroup>

      <div className="space-y-2">
        <BotaoSalvar pendente={pendente} disabled={enviandoFotos}>
          {item ? "Salvar alterações" : "Cadastrar item"}
        </BotaoSalvar>
        {enviandoFotos && (
          <p className="text-center text-xs text-muted-foreground">
            Aguarde o envio das fotos…
          </p>
        )}
      </div>
    </form>
  );
}
