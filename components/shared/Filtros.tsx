"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { normalizarTexto } from "@/lib/utils/texto";

export { normalizarTexto };

interface CampoBusquedaProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
}

/** Buscador con botón para limpiar y teclado de búsqueda en móvil. */
export function CampoBusqueda({ valor, onCambio, placeholder }: CampoBusquedaProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        className="pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambio("")}
          className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground animate-in fade-in zoom-in-75"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface FiltrosChipsProps<T extends string> {
  opciones: { value: T; label: string; cantidad?: number }[];
  activo: T;
  onCambio: (valor: T) => void;
  etiqueta: string;
}

/**
 * Fila de chips de filtro. En móvil se desliza horizontalmente en una sola
 * línea (en vez de ocupar varias filas); desde `sm` se envuelve centrada.
 */
export function FiltrosChips<T extends string>({
  opciones,
  activo,
  onCambio,
  etiqueta,
}: FiltrosChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
    >
      {opciones.map((opcion) => (
        <button
          key={opcion.value}
          type="button"
          onClick={() => onCambio(opcion.value)}
          aria-pressed={activo === opcion.value}
          className={`shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-medium transition-all active:scale-95 ${
            activo === opcion.value
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {opcion.label}
          {opcion.cantidad !== undefined && (
            <span
              className={`ml-1.5 tabular-nums ${
                activo === opcion.value ? "text-primary-foreground/70" : "text-muted-foreground/70"
              }`}
            >
              {opcion.cantidad}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
