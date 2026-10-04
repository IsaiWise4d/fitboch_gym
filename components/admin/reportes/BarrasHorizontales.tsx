import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FilaBarra {
  clave: string;
  etiqueta: ReactNode;
  valor: number;
  /** Texto a la derecha (por defecto el valor). */
  texto?: ReactNode;
  detalle?: ReactNode;
  /** Opacidad del relleno 0..1 (énfasis / rampa ordinal). */
  intensidad?: number;
  claseRelleno?: string;
  onClick?: () => void;
  titulo?: string;
}

/**
 * Barras horizontales en HTML: etiqueta, barra fina con extremo redondeado
 * y cifra en texto (nunca solo color). Sirve para rankings y categorías.
 */
export function BarrasHorizontales({ filas, className }: { filas: FilaBarra[]; className?: string }) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className={cn("space-y-1", className)}>
      {filas.map((f) => {
        const contenido = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{f.etiqueta}</span>
              <span className="shrink-0 tabular-nums text-foreground/90">{f.texto ?? f.valor}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.05]">
              <div
                className={cn("h-full rounded-full", f.claseRelleno ?? "bg-primary")}
                style={{
                  width: `${f.valor > 0 ? Math.max(2, (f.valor / maximo) * 100) : 0}%`,
                  opacity: f.intensidad ?? 1,
                }}
              />
            </div>
            {f.detalle && <p className="mt-1 text-xs text-muted-foreground">{f.detalle}</p>}
          </>
        );
        return (
          <li key={f.clave}>
            {f.onClick ? (
              <button
                type="button"
                onClick={f.onClick}
                title={f.titulo}
                className="w-full rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04]"
              >
                {contenido}
              </button>
            ) : (
              <div className="px-2 py-2" title={f.titulo}>
                {contenido}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
