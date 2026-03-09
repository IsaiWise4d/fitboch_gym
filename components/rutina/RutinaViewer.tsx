import type { Rutina } from "@/types/app";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FileText } from "lucide-react";
import { DescargaPDF } from "./DescargaPDF";
import { RutinaMarkdown } from "./RutinaMarkdown";

interface RutinaViewerProps {
  rutina: Rutina;
}

export function RutinaViewer({ rutina }: RutinaViewerProps) {
  const fechaGenerada = format(parseISO(rutina.created_at), "d 'de' MMMM, yyyy", {
    locale: es,
  });

  const duracionLabel: Record<string, string> = {
    "3_meses": "3 Meses",
    "6_meses": "6 Meses",
    "12_meses": "12 Meses",
  };

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Plan {duracionLabel[rutina.duracion_plan] || rutina.duracion_plan}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Generada {fechaGenerada}
        </span>
      </div>

      {/* Botón PDF */}
      <DescargaPDF rutina={rutina} />

      {/* Contenido de la rutina */}
      <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <RutinaMarkdown texto={rutina.texto_rutina} />
      </div>
    </div>
  );
}
