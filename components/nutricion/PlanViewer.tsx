import type { PlanNutricional } from "@/types/app";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Apple } from "lucide-react";
import { DescargaPDFNutricion } from "./DescargaPDFNutricion";
import { RutinaMarkdown } from "@/components/rutina/RutinaMarkdown";

interface PlanViewerProps {
  plan: PlanNutricional;
}

export function PlanViewer({ plan }: PlanViewerProps) {
  const fechaGenerada = format(parseISO(plan.created_at), "d 'de' MMMM, yyyy", {
    locale: es,
  });

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Apple className="h-3.5 w-3.5" />
            Plan {plan.objetivo.replace(/_/g, " ")}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Generado {fechaGenerada}
          </span>
        </div>
      </div>

      <DescargaPDFNutricion plan={plan} />

      {/* Contenido del Plan Nutricional */}
      <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <RutinaMarkdown texto={plan.texto_plan} />
      </div>
    </div>
  );
}
