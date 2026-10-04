import type { Rutina } from "@/types/app";
import { CalendarDays, Dumbbell } from "lucide-react";
import { formatFechaColombia } from "@/lib/utils/fecha";
import { extraerDias, extraerSecciones } from "@/lib/utils/markdown-secciones";
import { etiquetaDuracionPlan } from "@/lib/utils/etiquetas";
import { DescargaPDF } from "./DescargaPDF";
import { RutinaMarkdown } from "./RutinaMarkdown";
import { AccesosDias, BotonVolverArriba, IndiceSecciones } from "./NavegacionPlan";

interface RutinaViewerProps {
  rutina: Rutina;
  /** Vista bloqueada (membresía vencida): sin índice ni controles. */
  vistaPrevia?: boolean;
}

export function RutinaViewer({ rutina, vistaPrevia = false }: RutinaViewerProps) {
  const fechaGenerada = formatFechaColombia(rutina.created_at, "d 'de' MMMM, yyyy");
  const duracion = etiquetaDuracionPlan(rutina.duracion_plan);
  const secciones = vistaPrevia ? [] : extraerSecciones(rutina.texto_rutina);
  const dias = vistaPrevia ? [] : extraerDias(rutina.texto_rutina);

  return (
    <div className="space-y-4">
      {/* Resumen del plan */}
      <section className="space-y-4 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Dumbbell className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/90">
              Tu plan personalizado
            </p>
            <p className="text-lg font-bold leading-tight">Plan de {duracion}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Generada el {fechaGenerada}
            </p>
          </div>
        </div>
        <AccesosDias dias={dias} />
        {!vistaPrevia && <DescargaPDF rutina={rutina} />}
      </section>

      <IndiceSecciones secciones={secciones} />

      {/* Contenido: sin marco en el teléfono para aprovechar el ancho */}
      <article className="pt-2 sm:rounded-2xl sm:border sm:border-border sm:bg-surface/40 sm:p-6">
        <RutinaMarkdown texto={rutina.texto_rutina} />
      </article>

      {!vistaPrevia && <BotonVolverArriba />}
    </div>
  );
}
