import Link from "next/link";
import { ChevronRight, ClipboardList, CreditCard, Salad, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFechaColombia } from "@/lib/utils/fecha";
import { formatTipoPlan, getEstadoConfig } from "@/lib/utils/membresia";
import { etiquetaDuracionPlan, etiquetaObjetivoNutricional } from "@/lib/utils/etiquetas";
import type { EstadoMembresia, Membresia } from "@/types/app";

interface TileProps {
  href: string;
  icono: LucideIcon;
  colorIcono: string;
  titulo: string;
  valor: string;
  detalle: string;
  /** Punto de estado junto al detalle (membresía). */
  punto?: string;
  apagado?: boolean;
}

function Tile({ href, icono: Icono, colorIcono, titulo, valor, detalle, punto, apagado }: TileProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-3.5 transition-all hover:border-primary/30 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colorIcono)}>
          <Icono className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-[11px] font-medium text-muted-foreground">{titulo}</p>
      <p className={cn("line-clamp-2 text-sm font-semibold leading-snug", apagado && "text-muted-foreground")}>
        {valor}
      </p>
      <p className="mt-auto flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
        {punto && <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", punto)} />}
        <span className="line-clamp-1">{detalle}</span>
      </p>
    </Link>
  );
}

interface ResumenPlanProps {
  membresia: Membresia | null;
  estadoMembresia: EstadoMembresia;
  diasRestantes: number | null;
  rutina: { duracion_plan: string } | null;
  rutinaDisponible: boolean;
  planNutricional: { objetivo: string } | null;
  nutricionHabilitada: boolean;
}

/** "Tu plan": membresía, rutina, alimentación y calentamiento de un vistazo. */
export function ResumenPlan({
  membresia,
  estadoMembresia,
  diasRestantes,
  rutina,
  rutinaDisponible,
  planNutricional,
  nutricionHabilitada,
}: ResumenPlanProps) {
  const config = getEstadoConfig(estadoMembresia);

  const detalleMembresia = !membresia
    ? "Habla con el gimnasio"
    : diasRestantes !== null && diasRestantes <= 7
      ? `${config.label} · ${diasRestantes <= 0 ? "vence hoy" : `${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`}`
      : `${config.label} · vence ${formatFechaColombia(membresia.fecha_fin, "d MMM")}`;

  return (
    <section aria-labelledby="titulo-tu-plan" className="space-y-3">
      <h2
        id="titulo-tu-plan"
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Tu plan
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          href="/perfil"
          icono={CreditCard}
          colorIcono="bg-white/10 text-foreground"
          titulo="Membresía"
          valor={membresia ? `Plan ${formatTipoPlan(membresia.tipo_plan).toLowerCase()}` : "Sin membresía"}
          detalle={detalleMembresia}
          punto={config.dotColor}
          apagado={!membresia}
        />
        <Tile
          href="/rutina"
          icono={ClipboardList}
          colorIcono="bg-primary/15 text-primary"
          titulo="Rutina"
          valor={
            rutina
              ? `Plan de ${etiquetaDuracionPlan(rutina.duracion_plan)}`
              : rutinaDisponible
                ? "Lista para crear"
                : "Sin rutina"
          }
          detalle={rutina ? "Ver completa y PDF" : rutinaDisponible ? "Genérala con IA" : "Pendiente del gimnasio"}
          apagado={!rutina && !rutinaDisponible}
        />
        <Tile
          href="/plan-nutricional"
          icono={Salad}
          colorIcono="bg-success/15 text-success"
          titulo="Alimentación"
          valor={
            planNutricional
              ? etiquetaObjetivoNutricional(planNutricional.objetivo)
              : nutricionHabilitada
                ? "Lista para crear"
                : "No incluida"
          }
          detalle={
            planNutricional ? "Ver tu plan" : nutricionHabilitada ? "Genérala con IA" : "Pregunta en el gimnasio"
          }
          apagado={!planNutricional && !nutricionHabilitada}
        />
        <Tile
          href="/calentamientos"
          icono={Zap}
          colorIcono="bg-orange-500/15 text-orange-400"
          titulo="Calentamiento"
          valor="Antes de entrenar"
          detalle="Guiado, paso a paso"
        />
      </div>
    </section>
  );
}
