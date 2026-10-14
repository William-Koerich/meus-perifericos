"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { STATUS_ITEM } from "@/lib/constants";

type Filtros = { q?: string; status?: string; categoria?: string };

export function FiltrosItens({
  filtros,
  categorias,
}: {
  filtros: Filtros;
  categorias: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendente, startTransition] = useTransition();
  const [q, setQ] = useState(filtros.q ?? "");
  const primeiraRenderizacao = useRef(true);

  function aplicar(novos: Filtros) {
    const params = new URLSearchParams();
    const final = { ...filtros, ...novos };
    for (const [chave, valor] of Object.entries(final)) {
      if (valor) params.set(chave, valor);
    }
    // qualquer mudança de filtro volta para a página 1
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  // Busca com debounce enquanto digita
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const t = setTimeout(() => aplicar({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const temFiltro = !!(filtros.q || filtros.status || filtros.categoria);

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, tag, nº de série ou local"
          className="h-11 pr-9 pl-9"
          aria-label="Buscar itens"
        />
        {pendente && (
          <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect
          value={filtros.status ?? ""}
          onChange={(e) => aplicar({ status: e.target.value || undefined })}
          className="h-10"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_ITEM).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={filtros.categoria ?? ""}
          onChange={(e) => aplicar({ categoria: e.target.value || undefined })}
          className="h-10"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </NativeSelect>
      </div>
      {temFiltro && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            primeiraRenderizacao.current = true;
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
        >
          <XIcon />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
