import { ETIQUETA_ESTADO, type EstadoUsuarioClave } from "@/lib/membresias/estado";
import { cn } from "@/lib/utils";

import { ESTILO_ESTADO } from "./estado";

/** Punto de color + etiqueta: el estado nunca depende solo del color. */
export function EstadoBadge({
  estado,
  className,
}: {
  estado: EstadoUsuarioClave;
  className?: string;
}) {
  const estilo = ESTILO_ESTADO[estado];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        estilo.fondo,
        estilo.texto,
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", estilo.marca)} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
