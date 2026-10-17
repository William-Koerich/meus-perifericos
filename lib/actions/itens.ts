"use server";

import { and, eq, inArray, notExists, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirUsuario } from "@/lib/auth";
import { BUCKET_FOTOS } from "@/lib/constants";
import { db, type Tx } from "@/lib/db";
import {
  categorias,
  emprestimoItens,
  emprestimos,
  itemFotos,
  itens,
} from "@/lib/db/schema";
import { ErroNegocio, mensagemDeErro } from "@/lib/erros";
import { createClient } from "@/lib/supabase/server";
import {
  itemSchema,
  NOVA_CATEGORIA,
  type ItemInput,
} from "@/lib/validations/itens";

import { errosDeValidacao, type ActionState } from "./types";

async function resolverCategoria(tx: Tx, dados: ItemInput) {
  if (dados.categoriaId !== NOVA_CATEGORIA) {
    const [existe] = await tx
      .select({ id: categorias.id })
      .from(categorias)
      .where(eq(categorias.id, dados.categoriaId))
      .limit(1);
    if (!existe) throw new ErroNegocio("Categoria não encontrada.");
    return existe.id;
  }

  const nome = dados.novaCategoria!;
  // Reaproveita se já existir com outra caixa (ex.: "cabos" x "Cabos")
  const [existente] = await tx
    .select({ id: categorias.id })
    .from(categorias)
    .where(sql`lower(${categorias.nome}) = lower(${nome})`)
    .limit(1);
  if (existente) return existente.id;

  const [nova] = await tx
    .insert(categorias)
    .values({ nome })
    .returning({ id: categorias.id });
  return nova.id;
}

async function salvarFotos(tx: Tx, itemId: string, caminhos: string[]) {
  const existentes = await tx
    .select({ id: itemFotos.id, storagePath: itemFotos.storagePath })
    .from(itemFotos)
    .where(eq(itemFotos.itemId, itemId));

  const manter = new Set(caminhos);
  const removidas = existentes.filter((f) => !manter.has(f.storagePath));
  for (const foto of removidas) {
    await tx.delete(itemFotos).where(eq(itemFotos.id, foto.id));
  }

  const porCaminho = new Map(existentes.map((f) => [f.storagePath, f.id]));
  for (const [ordem, caminho] of caminhos.entries()) {
    const id = porCaminho.get(caminho);
    if (id) {
      await tx.update(itemFotos).set({ ordem }).where(eq(itemFotos.id, id));
    } else {
      await tx.insert(itemFotos).values({ itemId, storagePath: caminho, ordem });
    }
  }

  return removidas.map((f) => f.storagePath);
}

/** Remove arquivos do Storage (após o commit). Falha aqui não desfaz a operação. */
async function removerArquivos(caminhos: string[]) {
  if (!caminhos.length) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET_FOTOS).remove(caminhos);
  if (error) console.error("Falha ao remover fotos do Storage", error);
}

export async function criarItem(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const usuario = await exigirUsuario();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const dados = parsed.data;

  let id: string;
  try {
    id = await db.transaction(async (tx) => {
      const categoriaId = await resolverCategoria(tx, dados);
      const [novo] = await tx
        .insert(itens)
        .values({
          nome: dados.nome,
          categoriaId,
          descricao: dados.descricao,
          numeroSerie: dados.numeroSerie,
          localArmazenamento: dados.localArmazenamento,
          estadoConservacao: dados.estadoConservacao,
          status: dados.status ?? "disponivel",
          criadoPor: usuario.id,
        })
        .returning({ id: itens.id });

      await salvarFotos(tx, novo.id, dados.fotos);
      return novo.id;
    });
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível cadastrar o item.") };
  }

  revalidatePath("/itens");
  redirect(`/itens/${id}`);
}

export async function atualizarItem(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await exigirUsuario();

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erro: "Item inválido." };

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const dados = parsed.data;

  let removidas: string[] = [];
  try {
    removidas = await db.transaction(async (tx) => {
      const [atual] = await tx
        .select({ status: itens.status })
        .from(itens)
        .where(eq(itens.id, id.data))
        .for("update");
      if (!atual) throw new ErroNegocio("Item não encontrado.");

      // Item emprestado só muda de status pela devolução
      const status =
        atual.status === "emprestado"
          ? "emprestado"
          : (dados.status ?? atual.status);

      const categoriaId = await resolverCategoria(tx, dados);
      await tx
        .update(itens)
        .set({
          nome: dados.nome,
          categoriaId,
          descricao: dados.descricao,
          numeroSerie: dados.numeroSerie,
          localArmazenamento: dados.localArmazenamento,
          estadoConservacao: dados.estadoConservacao,
          status,
        })
        .where(eq(itens.id, id.data));

      return salvarFotos(tx, id.data, dados.fotos);
    });
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível salvar o item.") };
  }

  await removerArquivos(removidas);
  revalidatePath("/itens");
  revalidatePath(`/itens/${id.data}`);
  redirect(`/itens/${id.data}`);
}

export async function excluirItem(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const usuario = await exigirUsuario();

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erro: "Item inválido." };

  let fotos: string[] = [];
  try {
    fotos = await db.transaction(async (tx) => {
      const [item] = await tx
        .select({ status: itens.status })
        .from(itens)
        .where(eq(itens.id, id.data))
        .for("update");
      if (!item) throw new ErroNegocio("Item não encontrado.");
      if (item.status === "emprestado") {
        throw new ErroNegocio(
          "Este item está emprestado. Registre a devolução antes de excluí-lo.",
        );
      }

      // Empréstimos em que o item aparece (histórico)
      const historico = await tx
        .select({ emprestimoId: emprestimoItens.emprestimoId })
        .from(emprestimoItens)
        .where(eq(emprestimoItens.itemId, id.data));

      if (historico.length) {
        // Regra: só o admin apaga itens que já foram emprestados (e o histórico deles)
        if (usuario.perfil !== "admin") {
          throw new ErroNegocio(
            'Este item tem histórico de empréstimos. Só um administrador pode excluí-lo; você pode alterar o status para "Baixado".',
          );
        }
        await tx.delete(emprestimoItens).where(eq(emprestimoItens.itemId, id.data));

        // Empréstimos que ficaram sem nenhum item também são apagados
        const afetados = [...new Set(historico.map((h) => h.emprestimoId))];
        await tx.delete(emprestimos).where(
          and(
            inArray(emprestimos.id, afetados),
            notExists(
              tx
                .select({ id: emprestimoItens.id })
                .from(emprestimoItens)
                .where(eq(emprestimoItens.emprestimoId, emprestimos.id)),
            ),
          ),
        );
      }

      const caminhos = await tx
        .select({ storagePath: itemFotos.storagePath })
        .from(itemFotos)
        .where(eq(itemFotos.itemId, id.data));

      await tx.delete(itens).where(eq(itens.id, id.data));

      return caminhos.map((c) => c.storagePath);
    });
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível excluir o item.") };
  }

  await removerArquivos(fotos);
  revalidatePath("/");
  revalidatePath("/itens");
  revalidatePath("/emprestimos");
  revalidatePath("/pessoas");
  redirect("/itens");
}
