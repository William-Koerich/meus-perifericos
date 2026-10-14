import {
  ArrowLeftIcon,
  ImageOffIcon,
  PencilIcon,
  PrinterIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AcaoRapida } from "@/components/itens/acao-rapida";
import { ExcluirItemButton } from "@/components/itens/excluir-item-button";
import { HistoricoItem } from "@/components/itens/historico-item";
import { QrCode } from "@/components/itens/qr-code";
import { StatusBadge } from "@/components/itens/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exigirUsuario } from "@/lib/auth";
import { ESTADO_CONSERVACAO, urlFoto } from "@/lib/constants";
import { formatarDataHora } from "@/lib/format";
import {
  emprestimoAbertoDoItem,
  historicoDoItem,
} from "@/lib/queries/emprestimos";
import { obterItem } from "@/lib/queries/itens";

export async function generateMetadata(
  props: PageProps<"/itens/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const item = await obterItem(id);
  return { title: item ? `${item.tag} · ${item.nome}` : "Item" };
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function ItemPage(props: PageProps<"/itens/[id]">) {
  await exigirUsuario();
  const { id } = await props.params;
  const item = await obterItem(id);
  if (!item) notFound();

  const [historico, emprestimoAbertoId] = await Promise.all([
    historicoDoItem(item.id),
    item.status === "emprestado" ? emprestimoAbertoDoItem(item.id) : null,
  ]);
  const comHistorico = historico.length > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/itens"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Itens
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-muted-foreground">{item.tag}</p>
          <h1 className="text-xl font-semibold tracking-tight">{item.nome}</h1>
          <div className="mt-1">
            <StatusBadge status={item.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AcaoRapida item={item} emprestimoAbertoId={emprestimoAbertoId} tamanho="sm" />
          <Link
            href={`/itens/${item.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PencilIcon />
            Editar
          </Link>
          <Link
            href={`/itens/etiquetas?ids=${item.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PrinterIcon />
            Etiqueta
          </Link>
          {!comHistorico && <ExcluirItemButton id={item.id} nome={item.nome} />}
        </div>
      </div>

      {item.fotos.length > 0 ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
          {item.fotos.map((foto, i) => (
            <a
              key={foto.id}
              href={urlFoto(foto.storagePath)}
              target="_blank"
              rel="noreferrer"
              className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-xl border bg-muted sm:w-80"
            >
              <Image
                src={urlFoto(foto.storagePath)}
                alt={`${item.nome} — foto ${i + 1}`}
                fill
                sizes="(min-width: 640px) 320px, 85vw"
                className="object-cover"
                priority={i === 0}
              />
            </a>
          ))}
        </div>
      ) : (
        <div className="flex aspect-[4/3] max-h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
          <ImageOffIcon className="size-6" />
          Sem fotos
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Info label="Categoria">{item.categoria.nome}</Info>
              <Info label="Local">{item.localArmazenamento ?? "—"}</Info>
              <Info label="Conservação">
                {ESTADO_CONSERVACAO[item.estadoConservacao]}
              </Info>
              <Info label="Nº de série">
                {item.numeroSerie ? (
                  <span className="font-mono">{item.numeroSerie}</span>
                ) : (
                  "—"
                )}
              </Info>
              {item.descricao && (
                <Info label="Descrição">
                  <span className="whitespace-pre-line">{item.descricao}</span>
                </Info>
              )}
              <Info label="Cadastrado em">
                {formatarDataHora(item.createdAt)}
                {item.criador && ` por ${item.criador.nome}`}
              </Info>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:w-56">
          <CardContent className="flex flex-col items-center gap-2">
            <QrCode valor={item.tag} className="size-40" />
            <p className="font-mono text-lg font-semibold">{item.tag}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Histórico de empréstimos
            {comHistorico && ` (${historico.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HistoricoItem registros={historico} />
        </CardContent>
      </Card>
    </div>
  );
}
