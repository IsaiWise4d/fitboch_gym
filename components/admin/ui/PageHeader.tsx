import type { ReactNode } from "react";

interface PageHeaderProps {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Elemento previo al título (p. ej. enlace "volver"). */
  antes?: ReactNode;
}

export function PageHeader({ titulo, descripcion, acciones, antes }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-1">
        {antes}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}
