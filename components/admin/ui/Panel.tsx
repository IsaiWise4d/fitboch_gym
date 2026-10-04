import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps extends Omit<ComponentProps<"section">, "title"> {
  titulo?: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Quita el padding del cuerpo (tablas y listas a sangre). */
  sinPadding?: boolean;
  /** En móvil las acciones bajan a su propia fila a todo el ancho (pestañas, filtros). */
  accionesAnchas?: boolean;
}

/** Contenedor de sección del panel admin: un solo nivel, borde fino, sin sombra. */
export function Panel({
  titulo,
  descripcion,
  acciones,
  sinPadding = false,
  accionesAnchas = false,
  className,
  children,
  ...props
}: PanelProps) {
  const tieneEncabezado = titulo || descripcion || acciones;
  return (
    <section
      className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-panel", className)}
      {...props}
    >
      {tieneEncabezado && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 pb-3 sm:px-5">
          <div className="min-w-0 space-y-0.5">
            {titulo && <h2 className="text-sm font-semibold tracking-tight text-foreground">{titulo}</h2>}
            {descripcion && <p className="text-xs text-muted-foreground">{descripcion}</p>}
          </div>
          {acciones && (
            <div className={cn("flex max-w-full min-w-0 items-center gap-2", accionesAnchas && "w-full sm:w-auto")}>
              {acciones}
            </div>
          )}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", !sinPadding && "px-4 pb-4 sm:px-5 sm:pb-5", sinPadding && !tieneEncabezado && "pt-0")}>
        {children}
      </div>
    </section>
  );
}
