"use client";

import {
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BotaoSalvar, Campo, ErroGeral, useFormAction } from "@/components/forms";
import { ItemMini } from "@/components/itens/item-mini";
import { EscanearDialog } from "@/components/scanner/escanear-dialog";
import { StatusBadge } from "@/components/itens/status-badge";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buscarItensDisponiveis,
  criarEmprestimo,
  obterItemPorTag,
} from "@/lib/actions/emprestimos";
import { buscarPessoas } from "@/lib/actions/pessoas";
import {
  ATALHOS_PREVISAO,
  inputLocalParaIso,
  paraInputLocal,
} from "@/lib/datas-cliente";
import type { StatusItem } from "@/lib/db/schema";
import { extrairTag } from "@/lib/tag";
import { cn } from "@/lib/utils";
import { useBusca } from "@/hooks/use-busca";

export type PessoaResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  ministerio: string | null;
};

export type ItemResumo = {
  id: string;
  tag: string;
  nome: string;
  status: StatusItem;
  foto: string | null;
};

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="flex items-center gap-2 font-medium">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function CampoBusca({
  valor,
  onChange,
  placeholder,
  buscando,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  buscando: boolean;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 pr-9 pl-9"
        aria-label={placeholder}
      />
      {buscando && (
        <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

function SeletorPessoa({
  inicial,
  erros,
}: {
  inicial: PessoaResumo | null;
  erros: Record<string, string[] | undefined> | undefined;
}) {
  const [modo, setModo] = useState<"existente" | "nova">("existente");
  const [pessoa, setPessoa] = useState<PessoaResumo | null>(inicial);
  const [termo, setTermo] = useState("");
  const { resultados, buscando, carregado } = useBusca(buscarPessoas, termo, {
    ativo: modo === "existente" && !pessoa,
  });

  return (
    <>
      <input type="hidden" name="modoPessoa" value={modo} />
      {pessoa && <input type="hidden" name="pessoaId" value={pessoa.id} />}

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["existente", "Já cadastrada", UserIcon],
            ["nova", "Nova pessoa", UserPlusIcon],
          ] as const
        ).map(([valor, label, Icon]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setModo(valor)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm text-muted-foreground",
              modo === valor && "bg-background font-medium text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {modo === "existente" ? (
        pessoa ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{pessoa.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[pessoa.ministerio, pessoa.telefone].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setPessoa(null)}>
              Trocar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <CampoBusca
              valor={termo}
              onChange={setTermo}
              placeholder="Buscar por nome, telefone ou ministério"
              buscando={buscando}
            />
            <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
              {resultados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setPessoa(p)}
                    className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.nome}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[p.ministerio, p.telefone].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
              {carregado && !buscando && resultados.length === 0 && (
                <li className="p-3 text-center text-sm text-muted-foreground">
                  Ninguém encontrado.{" "}
                  <button type="button" className="underline" onClick={() => setModo("nova")}>
                    Cadastrar nova pessoa
                  </button>
                </li>
              )}
            </ul>
            <FieldError>{erros?.pessoaId?.[0]}</FieldError>
          </div>
        )
      ) : (
        <FieldGroup className="gap-4">
          <Campo nome="novaPessoaNome" label="Nome" state={{ campos: erros }}>
            <Input id="novaPessoaNome" name="novaPessoaNome" required autoComplete="off" className="h-11" />
          </Campo>
          <Campo nome="novaPessoaTelefone" label="Telefone" state={{ campos: erros }}>
            <Input
              id="novaPessoaTelefone"
              name="novaPessoaTelefone"
              type="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              className="h-11"
            />
          </Campo>
          <Campo nome="novaPessoaMinisterio" label="Ministério / departamento" state={{ campos: erros }}>
            <Input
              id="novaPessoaMinisterio"
              name="novaPessoaMinisterio"
              placeholder="Ex.: Louvor, Jovens, Infantil"
              className="h-11"
            />
          </Campo>
        </FieldGroup>
      )}
    </>
  );
}

function SeletorItens({
  itens,
  setItens,
  erro,
  acaoExtra,
}: {
  itens: ItemResumo[];
  setItens: (fn: (atual: ItemResumo[]) => ItemResumo[]) => void;
  erro?: string;
  acaoExtra?: ReactNode;
}) {
  const [termo, setTermo] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(itens.length === 0);
  const { resultados, buscando, carregado } = useBusca(buscarItensDisponiveis, termo, {
    ativo: buscaAberta,
  });
  const selecionados = new Set(itens.map((i) => i.id));
  const disponiveis = resultados.filter((r) => !selecionados.has(r.id));

  return (
    <>
      <input type="hidden" name="itens" value={JSON.stringify(itens.map((i) => i.id))} />

      {itens.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {itens.map((item) => (
            <li key={item.id} className="p-2">
              <ItemMini item={item}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${item.nome}`}
                  onClick={() => setItens((atual) => atual.filter((i) => i.id !== item.id))}
                >
                  <XIcon />
                </Button>
              </ItemMini>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2">
        {acaoExtra}
        {!buscaAberta && (
          <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setBuscaAberta(true)}>
            <PlusIcon />
            Buscar item
          </Button>
        )}
      </div>

      {buscaAberta && (
        <div className="space-y-2">
          <CampoBusca
            valor={termo}
            onChange={setTermo}
            placeholder="Buscar item disponível por nome ou tag"
            buscando={buscando}
          />
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
            {disponiveis.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setItens((atual) => [...atual, item]);
                    setTermo("");
                  }}
                  className="w-full p-2 text-left hover:bg-muted/50"
                >
                  <ItemMini item={item}>
                    <PlusIcon className="mr-2 size-4 text-muted-foreground" />
                  </ItemMini>
                </button>
              </li>
            ))}
            {carregado && !buscando && disponiveis.length === 0 && (
              <li className="p-3 text-center text-sm text-muted-foreground">
                Nenhum item disponível encontrado.
              </li>
            )}
          </ul>
        </div>
      )}
      <FieldError>{erro}</FieldError>
    </>
  );
}

function CampoPrevisao({ erro }: { erro?: string }) {
  const [valor, setValor] = useState("");

  function escolherAtalho(calcular: (agora: Date) => Date) {
    const agora = new Date();
    const data = calcular(agora);
    if (data <= agora) {
      toast.warning("Esse horário já passou. Escolha outro.");
      return;
    }
    setValor(paraInputLocal(data));
  }

  return (
    <Campo nome="previsaoDevolucao" label="Previsão de devolução" state={{ campos: { previsaoDevolucao: erro ? [erro] : undefined } }}>
      <input type="hidden" name="previsaoDevolucao" value={inputLocalParaIso(valor)} />
      <Input
        id="previsaoDevolucao"
        type="datetime-local"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        required
        className="h-11"
      />
      <div className="flex flex-wrap gap-2">
        {ATALHOS_PREVISAO.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => escolherAtalho(a.calcular)}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {a.label}
          </button>
        ))}
      </div>
    </Campo>
  );
}

/** Ler o QR Code com a câmera ou digitar a tag (ex.: etiqueta danificada). */
function AdicionarPorTag({ onTag }: { onTag: (tag: string) => Promise<void> }) {
  const [tag, setTag] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function adicionar() {
    const valor = extrairTag(tag);
    if (!valor) {
      toast.error("Tag inválida. Use o formato IGR-0001.");
      return;
    }
    setBuscando(true);
    try {
      await onTag(valor);
      setTag("");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="flex gap-2">
      <EscanearDialog onTag={onTag} />
      <Input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            adicionar();
          }
        }}
        placeholder="Tag (IGR-0001)"
        aria-label="Adicionar pela tag"
        autoCapitalize="characters"
        className="h-11 min-w-0 flex-1 font-mono"
      />
      <Button type="button" variant="outline" className="h-11" onClick={adicionar} disabled={buscando || !tag.trim()}>
        {buscando ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      </Button>
    </div>
  );
}

export function NovoEmprestimoForm({
  pessoaInicial,
  itensIniciais,
  itensIndisponiveis,
}: {
  pessoaInicial: PessoaResumo | null;
  itensIniciais: ItemResumo[];
  itensIndisponiveis: ItemResumo[];
}) {
  const { state, pendente, onSubmit } = useFormAction(criarEmprestimo);
  const [itens, setItens] = useState<ItemResumo[]>(itensIniciais);

  async function adicionarPorTag(tag: string) {
    const item = await obterItemPorTag(tag);
    if (!item) {
      toast.error(`Nenhum item com a tag ${tag}.`);
      return;
    }
    if (item.status !== "disponivel") {
      toast.error(`${item.tag} não está disponível.`);
      return;
    }
    if (itens.some((i) => i.id === item.id)) {
      toast.info(`${item.tag} já está na lista.`);
      return;
    }
    setItens((atual) =>
      atual.some((i) => i.id === item.id) ? atual : [...atual, item],
    );
    toast.success(`${item.tag} adicionado.`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErroGeral state={state} />

      {itensIndisponiveis.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <p className="font-medium">Não disponíveis para empréstimo:</p>
          {itensIndisponiveis.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2">
              <span className="truncate">
                <span className="font-mono">{i.tag}</span> {i.nome}
              </span>
              <StatusBadge status={i.status} />
            </div>
          ))}
        </div>
      )}

      <Secao numero={1} titulo="Quem está levando">
        <SeletorPessoa inicial={pessoaInicial} erros={state.campos} />
      </Secao>

      <Secao numero={2} titulo={`Itens${itens.length ? ` (${itens.length})` : ""}`}>
        <SeletorItens
          itens={itens}
          setItens={setItens}
          erro={state.campos?.itens?.[0]}
          acaoExtra={<AdicionarPorTag onTag={adicionarPorTag} />}
        />
      </Secao>

      <Secao numero={3} titulo="Devolução">
        <FieldGroup className="gap-4">
          <CampoPrevisao erro={state.campos?.previsaoDevolucao?.[0]} />
          <Campo nome="observacoes" label="Observações (opcional)" state={state}>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              placeholder="Ex.: para o culto de jovens no sábado"
            />
          </Campo>
        </FieldGroup>
      </Secao>

      <BotaoSalvar pendente={pendente} disabled={!itens.length}>
        Registrar empréstimo
      </BotaoSalvar>
    </form>
  );
}
