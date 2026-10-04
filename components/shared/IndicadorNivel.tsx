import { cn } from "@/lib/utils";

const NIVELES: Record<string, { barras: number; etiqueta: string }> = {
  principiante: { barras: 1, etiqueta: "Principiante" },
  intermedio: { barras: 2, etiqueta: "Intermedio" },
  avanzado: { barras: 3, etiqueta: "Avanzado" },
  todos: { barras: 0, etiqueta: "Todos los niveles" },
};

/** Chip de dificultad con barras (1-3), como la señal del teléfono. */
export function IndicadorNivel({
  nivel,
  className,
}: {
  nivel: string;
  className?: string;
}) {
  const info = NIVELES[nivel] ?? { barras: 0, etiqueta: nivel };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
        {[1, 2, 3].map((barra) => (
          <span
            key={barra}
            className={cn(
              "w-1 rounded-sm",
              barra === 1 ? "h-1.5" : barra === 2 ? "h-2.5" : "h-3",
              info.barras === 0 || barra <= info.barras ? "bg-primary" : "bg-white/15"
            )}
          />
        ))}
      </span>
      {info.etiqueta}
    </span>
  );
}
