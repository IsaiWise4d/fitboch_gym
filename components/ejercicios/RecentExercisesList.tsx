"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Dumbbell, Trash2 } from "lucide-react";
import { getRangoDiaColombiaUTC } from "@/lib/utils/fecha";

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
    setLoading(true);
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

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    
    const { error } = await supabase
      .from("historial_ejercicios")
      .delete()
      .eq("id", exerciseToDelete);
      
    if (error) {
      console.error("Error al borrar", error);
      alert("Error al borrar: " + error.message);
    } else {
      loadHistorial();
    }
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
    return <div className="animate-pulse h-32 bg-primary/10 rounded-xl" />;
  }

  if (historial.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <History className="h-8 w-8 text-muted-foreground/50" />
          No hay ejercicios registrados hoy ({fechaColombiaActual}, hora Colombia).
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modal de Confirmación de Borrado */}
      {exerciseToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-5 max-w-sm w-full shadow-lg space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> ¿Borrar del historial?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setExerciseToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Sí, borrar</Button>
            </div>
          </div>
        </div>
      )}

      <h3 className="font-semibold flex items-center gap-2">
        <History className="h-4 w-4" />
        Ejercicios de Hoy (Colombia)
      </h3>
      <div className="space-y-3">
        {historial.map((h) => {
          const ejercicio = h.ejercicios;
          if (!ejercicio) return null; // Fallback in case the DB relation is broken
          
          return (
            <div key={h.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-primary flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {ejercicio.nombre}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFechaColombia(h.fecha_completado)} • {h.tiempo_descanso_minutos} min descanso
                  </div>
                </div>
                <button 
                  onClick={() => setExerciseToDelete(h.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Borrar ejercicio"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="pt-2 border-t border-border mt-2 space-y-1">
                {(h.series_ejercicios ?? [])
                  .slice()
                  .sort((a, b) => a.serie_numero - b.serie_numero)
                  .map((s) => (
                  <div key={s.serie_numero} className="flex justify-between text-xs items-center">
                    <span className="text-muted-foreground">Serie {s.serie_numero}</span>
                    <span className="font-medium">
                      {s.peso_kg} kg <span className="text-muted-foreground mx-1">×</span> {s.repeticiones} reps
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
