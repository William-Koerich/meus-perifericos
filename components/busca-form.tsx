import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

/** Campo de busca via GET (?q=). Campos extras são preservados como hidden. */
export function BuscaForm({
  q,
  placeholder,
  extras,
}: {
  q?: string;
  placeholder: string;
  extras?: Record<string, string | undefined>;
}) {
  return (
    <form method="get" role="search" className="relative">
      {Object.entries(extras ?? {}).map(
        ([nome, valor]) =>
          valor && <input key={nome} type="hidden" name={nome} value={valor} />,
      )}
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 pl-9"
      />
    </form>
  );
}
