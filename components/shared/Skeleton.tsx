import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Bloque de carga con brillo (clase `.skeleton` en globals.css). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("skeleton rounded-md", className)} {...props} />;
}

interface PantallaCargandoProps {
  children: ReactNode;
  className?: string;
  etiqueta?: string;
}

/**
 * Contenedor de una pantalla en carga (loading.tsx). Anuncia el estado a
 * lectores de pantalla y conserva el mismo padding que las páginas reales
 * para que el cambio skeleton → contenido no salte.
 */
export function PantallaCargando({
  children,
  className,
  etiqueta = "Cargando…",
}: PantallaCargandoProps) {
  return (
    <div role="status" aria-busy="true" className={cn("space-y-6 p-4", className)}>
      <span className="sr-only">{etiqueta}</span>
      {children}
    </div>
  );
}

/** Lista de tarjetas (ejercicios, calentamientos, historial). */
export function SkeletonTarjetas({
  cantidad = 5,
  alto = "h-[74px]",
}: {
  cantidad?: number;
  alto?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", alto)} />
      ))}
    </div>
  );
}

/** Título de página + subtítulo opcional. */
export function SkeletonEncabezado({ subtitulo = true }: { subtitulo?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-44" />
      {subtitulo && <Skeleton className="h-4 w-64 max-w-full" />}
    </div>
  );
}
