"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth";
import { STATUS_ITEM } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  emprestimoItens,
  emprestimos,
  itens,
  pessoas,
} from "@/lib/db/schema";
import { ErroNegocio, mensagemDeErro } from "@/lib/erros";
import {
  buscarItensDisponiveis as buscarItensDisponiveisQuery,
  emprestimoAbertoDoItem,
  obterItensResumo,
} from "@/lib/queries/emprestimos";
import {
  criarEmprestimoSchema,
  registrarDevolucaoSchema,
} from "@/lib/validations/emprestimos";

import { errosDeValidacao, type ActionState } from "./types";

// Violação do índice único "um item só pode estar em um empréstimo aberto"
function ehConflitoDeItem(error: unknown) {
  const causa = (error as { cause?: { code?: string } })?.cause ?? error;
  return (causa as { code?: string })?.code === "23505";
}

function revalidarTudo(emprestimoId?: string) {
  revalidatePath("/");
  revalidatePath("/itens");
  revalidatePath("/emprestimos");
  revalidatePath("/pessoas");
  if (emprestimoId) revalidatePath(`/emprestimos/${emprestimoId}`);
}

export async function criarEmprestimo(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const usuario = await exigirUsuario();

  const parsed = criarEmprestimoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const dados = parsed.data;

  let id: string;
  try {
    id = await db.transaction(async (tx) => {
      // 1. Trava os itens e confere que todos estão disponíveis
      const selecionados = await tx
        .select({
          id: itens.id,
          tag: itens.tag,
          nome: itens.nome,
          status: itens.status,
          estadoConservacao: itens.estadoConservacao,
        })
        .from(itens)
        .where(inArray(itens.id, dados.itens))
        .for("update");

      if (selecionados.length !== dados.itens.length) {
        throw new ErroNegocio("Um ou mais itens não foram encontrados.");
      }
      const indisponiveis = selecionados.filter((i) => i.status !== "disponivel");
      if (indisponiveis.length) {
        throw new ErroNegocio(
          `Não é possível emprestar: ${indisponiveis
            .map((i) => `${i.tag} (${STATUS_ITEM[i.status].label.toLowerCase()})`)
            .join(", ")}.`,
        );
      }

      // 2. Pessoa: existente ou cadastrada agora
      let pessoaId: string;
      if (dados.pessoa.tipo === "existente") {
        const [existe] = await tx
          .select({ id: pessoas.id })
          .from(pessoas)
          .where(eq(pessoas.id, dados.pessoa.id))
          .limit(1);
        if (!existe) throw new ErroNegocio("Pessoa não encontrada.");
        pessoaId = existe.id;
      } else {
        const [nova] = await tx
          .insert(pessoas)
          .values(dados.pessoa.dados)
          .returning({ id: pessoas.id });
        pessoaId = nova.id;
      }

      // 3. Empréstimo + itens
      const [emprestimo] = await tx
        .insert(emprestimos)
        .values({
          pessoaId,
          liberadoPor: usuario.id,
          previsaoDevolucao: dados.previsaoDevolucao,
          observacoes: dados.observacoes,
        })
        .returning({ id: emprestimos.id });

      await tx.insert(emprestimoItens).values(
        selecionados.map((item) => ({
          emprestimoId: emprestimo.id,
          itemId: item.id,
          estadoSaida: item.estadoConservacao,
        })),
      );

      // 4. Itens passam a "emprestado"
      await tx
        .update(itens)
        .set({ status: "emprestado" })
        .where(inArray(itens.id, dados.itens));

      return emprestimo.id;
    });
  } catch (error) {
    if (ehConflitoDeItem(error)) {
      return { erro: "Um dos itens acabou de ser emprestado por outra pessoa. Atualize e tente novamente." };
    }
    return { erro: mensagemDeErro(error, "Não foi possível registrar o empréstimo.") };
  }

  revalidarTudo(id);
  redirect(`/emprestimos/${id}`);
}

export async function registrarDevolucao(
  _anterior: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const usuario = await exigirUsuario();

  const parsed = registrarDevolucaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errosDeValidacao(parsed.error);
  const { emprestimoId, devolucoes } = parsed.data;

  let encerrado = false;
  try {
    encerrado = await db.transaction(async (tx) => {
      const [emprestimo] = await tx
        .select({ id: emprestimos.id, encerradoEm: emprestimos.encerradoEm })
        .from(emprestimos)
        .where(eq(emprestimos.id, emprestimoId))
        .for("update");
      if (!emprestimo) throw new ErroNegocio("Empréstimo não encontrado.");
      if (emprestimo.encerradoEm) {
        throw new ErroNegocio("Este empréstimo já foi totalmente devolvido.");
      }

      const ids = devolucoes.map((d) => d.id);
      const pendentes = await tx
        .select({ id: emprestimoItens.id, itemId: emprestimoItens.itemId })
        .from(emprestimoItens)
        .where(
          and(
            eq(emprestimoItens.emprestimoId, emprestimoId),
            inArray(emprestimoItens.id, ids),
            isNull(emprestimoItens.devolvidoEm),
          ),
        )
        .for("update");
      if (pendentes.length !== ids.length) {
        throw new ErroNegocio(
          "Algum item selecionado já foi devolvido. Atualize a página e tente novamente.",
        );
      }

      const agora = new Date();
      const itemDe = new Map(pendentes.map((p) => [p.id, p.itemId]));

      for (const d of devolucoes) {
        await tx
          .update(emprestimoItens)
          .set({
            devolvidoEm: agora,
            recebidoPor: usuario.id,
            estadoDevolucao: d.estado,
            observacaoDevolucao: d.observacao,
          })
          .where(eq(emprestimoItens.id, d.id));

        // Item volta disponível (ou vai para manutenção) com o estado da volta
        await tx
          .update(itens)
          .set({
            status: d.manutencao ? "manutencao" : "disponivel",
            estadoConservacao: d.estado,
          })
          .where(eq(itens.id, itemDe.get(d.id)!));
      }

      const [restante] = await tx
        .select({ id: emprestimoItens.id })
        .from(emprestimoItens)
        .where(
          and(
            eq(emprestimoItens.emprestimoId, emprestimoId),
            isNull(emprestimoItens.devolvidoEm),
          ),
        )
        .limit(1);

      if (!restante) {
        await tx
          .update(emprestimos)
          .set({ encerradoEm: agora })
          .where(eq(emprestimos.id, emprestimoId));
        return true;
      }
      return false;
    });
  } catch (error) {
    return { erro: mensagemDeErro(error, "Não foi possível registrar a devolução.") };
  }

  revalidarTudo(emprestimoId);
  return {
    ok: true,
    mensagem: encerrado
      ? "Devolução registrada. Empréstimo encerrado."
      : `Devolução parcial registrada (${devolucoes.length} ${devolucoes.length === 1 ? "item" : "itens"}).`,
  };
}

/** Busca de itens disponíveis para o formulário de empréstimo. */
export async function buscarItensDisponiveis(q: string) {
  await exigirUsuario();
  return buscarItensDisponiveisQuery(String(q ?? "").slice(0, 100));
}

/** Resolve uma tag lida pela câmera (ou digitada) em um item. */
export async function obterItemPorTag(tag: string) {
  await exigirUsuario();
  const [item] = await obterItensResumo({ tags: [String(tag ?? "").slice(0, 30)] });
  return item ?? null;
}

/** Consulta do scanner: item pela tag + empréstimo em aberto (para "Devolver"). */
export async function consultarTag(tag: string) {
  await exigirUsuario();
  const [item] = await obterItensResumo({ tags: [String(tag ?? "").slice(0, 30)] });
  if (!item) return null;

  const [detalhes] = await db
    .select({ localArmazenamento: itens.localArmazenamento })
    .from(itens)
    .where(eq(itens.id, item.id));

  return {
    item: { ...item, localArmazenamento: detalhes?.localArmazenamento ?? null },
    emprestimoAbertoId:
      item.status === "emprestado" ? await emprestimoAbertoDoItem(item.id) : null,
  };
}
