import type { PlanNutricional } from "@/types/app";
import { Apple, CalendarDays } from "lucide-react";
import { formatFechaColombia } from "@/lib/utils/fecha";
import { extraerSecciones } from "@/lib/utils/markdown-secciones";
import { etiquetaObjetivoNutricional } from "@/lib/utils/etiquetas";
import { DescargaPDFNutricion } from "./DescargaPDFNutricion";
import { RutinaMarkdown } from "@/components/rutina/RutinaMarkdown";
import { BotonVolverArriba, IndiceSecciones } from "@/components/rutina/NavegacionPlan";

interface PlanViewerProps {
  plan: PlanNutricional;
  /** Vista bloqueada (plan inactivo): sin índice ni controles. */
  vistaPrevia?: boolean;
}

export function PlanViewer({ plan, vistaPrevia = false }: PlanViewerProps) {
  const fechaGenerada = formatFechaColombia(plan.created_at, "d 'de' MMMM, yyyy");
  const objetivo = etiquetaObjetivoNutricional(plan.objetivo);
  const secciones = vistaPrevia ? [] : extraerSecciones(plan.texto_plan);

  return (
    <div className="space-y-4">
      {/* Resumen del plan */}
      <section className="space-y-4 rounded-2xl border border-success/25 bg-gradient-to-br from-success/15 via-success/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success text-black shadow-lg shadow-success/20">
            <Apple className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
              Tu plan de alimentación
            </p>
            <p className="text-lg font-bold leading-tight first-letter:uppercase">{objetivo}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Generado el {fechaGenerada}
            </p>
          </div>
        </div>
        {!vistaPrevia && <DescargaPDFNutricion plan={plan} />}
      </section>

      <IndiceSecciones secciones={secciones} />

      {/* Contenido: sin marco en el teléfono para aprovechar el ancho */}
      <article className="pt-2 sm:rounded-2xl sm:border sm:border-border sm:bg-surface/40 sm:p-6">
        <RutinaMarkdown texto={plan.texto_plan} />
      </article>

      {!vistaPrevia && <BotonVolverArriba />}
    </div>
  );
}
