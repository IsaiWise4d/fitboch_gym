import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Calentamiento } from "@/types/app";

const categoriaEmoji: Record<string, string> = {
  tren_superior: "💪",
  tren_inferior: "🦵",
};

export function CalentamientoCard({ calentamiento }: { calentamiento: Calentamiento }) {
  const emoji = categoriaEmoji[calentamiento.categoria] || "🔥";

  return (
    <Link
      href={`/calentamientos/${calentamiento.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-lg">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{calentamiento.nombre}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {calentamiento.categoria.replace("_", " ")}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
