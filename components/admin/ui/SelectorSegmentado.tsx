"use client";

import { cn } from "@/lib/utils";

interface SelectorSegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: readonly { valor: T; etiqueta: string; cantidad?: number }[];
  valor: T;
  onCambio: (valor: T) => void;
  className?: string;
}

/** Control segmentado compacto (rango de días, vista, etc.). */
export function SelectorSegmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
  className,
}: SelectorSegmentadoProps<T>) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={cn("inline-flex items-center rounded-lg border border-border bg-background/60 p-0.5", className)}
    >
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambio(opcion.valor)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150",
              activo
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opcion.etiqueta}
            {opcion.cantidad !== undefined && (
              <span className={cn("tabular-nums", activo ? "text-foreground/60" : "text-muted-foreground/70")}>
                {opcion.cantidad}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
