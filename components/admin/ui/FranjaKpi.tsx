import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Kpi {
  etiqueta: string;
  valor: ReactNode;
  contexto?: ReactNode;
  /** Variación relativa (0.12 = +12 %) frente al periodo anterior. */
  delta?: number | null;
  etiquetaDelta?: string;
  /** Marca el valor con un tono de estado (por vencer, vencidas…). */
  tono?: "neutro" | "advertencia" | "peligro" | "exito";
  href?: string;
}

const COLOR_TONO: Record<NonNullable<Kpi["tono"]>, string> = {
  neutro: "bg-transparent",
  advertencia: "bg-estado-por-vencer",
  peligro: "bg-estado-vencida",
  exito: "bg-estado-activa",
};

function Delta({ delta, etiqueta }: { delta: number; etiqueta?: string }) {
  const redondeado = Math.round(delta * 100);
  const Icono = redondeado > 0 ? ArrowUpRight : redondeado < 0 ? ArrowDownRight : Minus;
  const color = redondeado > 0 ? "text-success" : redondeado < 0 ? "text-error" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color)}>
      <Icono className="size-3.5" aria-hidden="true" />
      {redondeado > 0 ? "+" : ""}
      {redondeado}%{etiqueta && <span className="ml-1 font-normal text-muted-foreground">{etiqueta}</span>}
    </span>
  );
}

function ContenidoKpi({ kpi }: { kpi: Kpi }) {
  const tono = kpi.tono ?? "neutro";
  return (
    <>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {tono !== "neutro" && <span aria-hidden="true" className={cn("size-1.5 rounded-full", COLOR_TONO[tono])} />}
        {kpi.etiqueta}
      </div>
      <div className="text-[1.75rem] leading-none font-semibold tracking-tight text-foreground">{kpi.valor}</div>
      <div className="flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {kpi.delta !== undefined && kpi.delta !== null && <Delta delta={kpi.delta} etiqueta={kpi.etiquetaDelta} />}
        {kpi.contexto}
      </div>
    </>
  );
}

/**
 * Fila de indicadores en una sola franja dividida por líneas finas (no
 * tarjetas sueltas). Cada indicador con `href` es un atajo a la vista
 * filtrada correspondiente.
 */
export function FranjaKpi({ kpis, className }: { kpis: Kpi[]; className?: string }) {
  return (
    <div
      className={cn(
        // gap-px sobre fondo de borde = divisores de 1px sin bordes dobles.
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {kpis.map((kpi) => {
        const clases =
          "group relative flex min-w-0 flex-col gap-2.5 bg-panel px-5 py-4 transition-colors duration-150";
        return kpi.href ? (
          <Link
            key={kpi.etiqueta}
            href={kpi.href}
            className={cn(clases, "hover:bg-surface focus-visible:bg-surface")}
          >
            <ContenidoKpi kpi={kpi} />
            <span className="pointer-events-none absolute top-4 right-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        ) : (
          <div key={kpi.etiqueta} className={clases}>
            <ContenidoKpi kpi={kpi} />
          </div>
        );
      })}
    </div>
  );
}
