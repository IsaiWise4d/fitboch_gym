import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExerciseHistoryLog } from "@/components/ejercicios/ExerciseHistoryLog";
import { EjerciciosRelacionados } from "@/components/ejercicios/EjerciciosRelacionados";
import { BotonEntrenarEjercicio } from "@/components/ejercicios/BotonEntrenarEjercicio";
import { VisorMedia } from "@/components/shared/VisorMedia";
import { PasosInstrucciones } from "@/components/shared/PasosInstrucciones";
import { IndicadorNivel } from "@/components/shared/IndicadorNivel";
import { Skeleton } from "@/components/shared/Skeleton";
import { ICONOS_RESPALDO, iconoDeGrupo } from "@/components/shared/iconos";
import { mediasEjercicio } from "@/lib/utils/media";

export default async function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ejercicio } = await supabase
    .from("ejercicios")
    .select("*")
    .eq("id", id)
    .single();

  if (!ejercicio) {
    notFound();
  }

  const icono = iconoDeGrupo(ejercicio.grupo_muscular);
  const IconoGrupo = ICONOS_RESPALDO[icono];

  return (
    <div className="space-y-6 p-4">
      <VisorMedia
        medias={mediasEjercicio(ejercicio)}
        alt={`Demostración de ${ejercicio.nombre}`}
        hrefVolver="/ejercicios"
        etiquetaVolver="Volver a ejercicios"
        icono={icono}
      />

      {/* Qué es */}
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">
            <IconoGrupo className="h-3.5 w-3.5" aria-hidden="true" />
            {ejercicio.grupo_muscular}
          </span>
          <IndicadorNivel nivel={ejercicio.nivel} />
          <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground">
            {ejercicio.categoria}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{ejercicio.nombre}</h1>
        {ejercicio.descripcion && (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {ejercicio.descripcion}
          </p>
        )}
      </header>

      {/* Cómo se hace, paso a paso */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <PasosInstrucciones texto={ejercicio.instrucciones} />
      </div>

      {/* Mejor marca, última vez e historial del usuario */}
      <ExerciseHistoryLog ejercicioId={id} />

      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-52 w-36 shrink-0 rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <EjerciciosRelacionados ejercicioId={id} grupoMuscular={ejercicio.grupo_muscular} />
      </Suspense>

      <BotonEntrenarEjercicio ejercicioId={id} nombre={ejercicio.nombre} />
    </div>
  );
}
