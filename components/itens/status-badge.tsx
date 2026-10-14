import { Badge } from "@/components/ui/badge";
import { STATUS_ITEM } from "@/lib/constants";
import type { StatusItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: StatusItem;
  className?: string;
}) {
  const { label, className: cor } = STATUS_ITEM[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", cor, className)}>
      {label}
    </Badge>
  );
}
