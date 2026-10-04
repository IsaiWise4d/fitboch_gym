"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { History, Dumbbell, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/shared/Skeleton";
import { getRangoDiaColombiaUTC } from "@/lib/utils/fecha";
import type { EstadoRacha } from "@/lib/racha/types";

interface SerieEjercicio {
  serie_numero: number;
  peso_kg: number;
  repeticiones: number;
}

interface EjercicioResumen {
  id: string;
  nombre: string;
  grupo_muscular: string;
  categoria: string;
  nivel: string;
  activo: boolean;
}

interface HistorialRecienteItem {
  id: string;
  fecha_completado: string;
  tiempo_descanso_minutos: number;
  ejercicios: EjercicioResumen | null;
  series_ejercicios: SerieEjercicio[] | null;
}

export function RecentExercisesList() {
  const [historial, setHistorial] = useState<HistorialRecienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaColombiaActual, setFechaColombiaActual] = useState(
    () => getRangoDiaColombiaUTC().fechaColombia
  );
  const supabase = useMemo(() => createClient(), []);

  const loadHistorial = useCallback(async () => {
    const { inicioUtcIso, finUtcIso } = getRangoDiaColombiaUTC();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setHistorial([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("historial_ejercicios")
      .select(`
        id,
        fecha_completado,
        tiempo_descanso_minutos,
        ejercicios(id, nombre, grupo_muscular, categoria, nivel, activo),
        series_ejercicios(serie_numero, peso_kg, repeticiones)
      `)
      .eq("user_id", userData.user.id)
      .gte("fecha_completado", inicioUtcIso)
      .lt("fecha_completado", finUtcIso)
      .order("fecha_completado", { ascending: false });

    if (error) {
      console.error("Error cargando historial", error);
      setHistorial([]);
    } else {
      setHistorial((data as HistorialRecienteItem[]) || []);
    }
    setLoading(false);
  }, [supabase]);

  const formatFechaColombia = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const { error } = await supabase
      .from("historial_ejercicios")
      .delete()
      .eq("id", exerciseToDelete);

    if (error) {
      console.error("Error al borrar", error);
      setDeleteError("No se pudo borrar el ejercicio. Intenta de nuevo.");
    } else {
      await loadHistorial();
      try {
        const estadoResponse = await fetch("/api/racha/estado", { cache: "no-store" });
        if (estadoResponse.ok) {
          const json = (await estadoResponse.json()) as { estado?: EstadoRacha };
          if (json.estado) {
            window.dispatchEvent(
              new CustomEvent("exercise-saved", { detail: { estado: json.estado } })
            );
          }
        }
      } catch (error) {
        console.error("Error actualizando racha tras borrar ejercicio:", error);
      }
    }
    setIsDeleting(false);
    setExerciseToDelete(null);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistorial();
    }, 0);

    const handleCustomEvent = () => {
      void loadHistorial();
    };

    const dayWatcherId = window.setInterval(() => {
      const { fechaColombia } = getRangoDiaColombiaUTC();
      if (fechaColombia !== fechaColombiaActual) {
        setFechaColombiaActual(fechaColombia);
        void loadHistorial();
      }
    }, 60_000);

    window.addEventListener('exercise-saved', handleCustomEvent);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(dayWatcherId);
      window.removeEventListener('exercise-saved', handleCustomEvent);
    };
  }, [loadHistorial, fechaColombiaActual]);

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Cargando ejercicios de hoy…</span>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <History className="h-6 w-6 text-muted-foreground/70" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">Aún no registras ejercicios hoy</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Toca «Iniciar Nuevo Ejercicio» y guarda tus series para sumar a tu racha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        abierto={exerciseToDelete !== null}
        tono="peligro"
        icono={<Trash2 className="h-5 w-5" />}
        titulo="¿Borrar del historial?"
        descripcion="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
        textoConfirmar="Sí, borrar"
        cargando={isDeleting}
        onCancelar={() => setExerciseToDelete(null)}
        onConfirmar={handleDelete}
      />

      <h3 className="flex items-center gap-2 font-semibold">
        <History className="h-4 w-4" aria-hidden="true" />
        Ejercicios de hoy
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {historial.length}
        </span>
      </h3>

      {deleteError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {deleteError}
        </p>
      )}

      <div className="space-y-3">
        {historial.map((h) => {
          const ejercicio = h.ejercicios;
          if (!ejercicio) return null; // Fallback in case the DB relation is broken

          return (
            <div key={h.id} className="rounded-xl border border-border bg-surface p-4 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Dumbbell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{ejercicio.nombre}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFechaColombia(h.fecha_completado)} • {h.tiempo_descanso_minutos} min descanso
                  </div>
                </div>
                <button
                  onClick={() => setExerciseToDelete(h.id)}
                  className="-mr-2 -mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
                  aria-label={`Borrar ${ejercicio.nombre} del historial`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                {(h.series_ejercicios ?? [])
                  .slice()
                  .sort((a, b) => a.serie_numero - b.serie_numero)
                  .map((s) => (
                  <div key={s.serie_numero} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Serie {s.serie_numero}</span>
                    <span className="font-medium tabular-nums">
                      {s.peso_kg} kg <span className="mx-1 text-muted-foreground">×</span> {s.repeticiones} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
