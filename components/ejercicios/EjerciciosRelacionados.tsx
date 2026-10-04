import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { EjercicioCard } from "@/components/ejercicios/EjercicioCard";

interface EjerciciosRelacionadosProps {
  ejercicioId: string;
  grupoMuscular: string;
}

/** Carrusel "Más de {grupo}" al final del detalle de un ejercicio. */
export async function EjerciciosRelacionados({
  ejercicioId,
  grupoMuscular,
}: EjerciciosRelacionadosProps) {
  const supabase = await createClient();
  const { data: relacionados, error } = await supabase
    .from("ejercicios")
    .select("id, nombre, grupo_muscular, nivel, imagen_url, video_url")
    .eq("activo", true)
    .eq("grupo_muscular", grupoMuscular)
    .neq("id", ejercicioId)
    .order("nombre")
    .limit(10);

  if (error) {
    console.error("Error cargando ejercicios relacionados:", error);
    return null;
  }
  if (!relacionados || relacionados.length === 0) return null;

  return (
    <section aria-labelledby="titulo-relacionados" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="titulo-relacionados" className="text-base font-semibold">
          Más de <span className="capitalize">{grupoMuscular}</span>
        </h2>
        <Link
          href={`/ejercicios?grupo=${encodeURIComponent(grupoMuscular)}`}
          className="inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-xs font-medium text-primary"
        >
          Ver todos
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {relacionados.map((ejercicio) => (
          <EjercicioCard
            key={ejercicio.id}
            ejercicio={ejercicio}
            className="w-36 shrink-0 snap-start"
          />
        ))}
      </div>
    </section>
  );
}
