import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Ejercicio } from "@/types/app";

const grupoEmoji: Record<string, string> = {
  pecho: "🏋️",
  espalda: "🔙",
  piernas: "🦵",
  hombros: "💪",
  brazos: "💪",
  core: "🎯",
  cardio: "🏃",
};

interface EjercicioCardProps {
  ejercicio: Ejercicio;
}

export function EjercicioCard({ ejercicio }: EjercicioCardProps) {
  const emoji = grupoEmoji[ejercicio.grupo_muscular.toLowerCase()] || "💪";

  return (
    <Link
      href={`/ejercicios/${ejercicio.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-lg">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{ejercicio.nombre}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {ejercicio.grupo_muscular} · {ejercicio.categoria}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
