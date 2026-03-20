"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Dumbbell } from "lucide-react";
import { EjercicioCard } from "./EjercicioCard";

export function RecentExercisesList() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadHistorial = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

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
      .order("fecha_completado", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error cargando historial", error);
    } else {
      setHistorial(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistorial();

    const handleCustomEvent = () => {
      loadHistorial();
    };

    window.addEventListener('exercise-saved', handleCustomEvent);
    return () => window.removeEventListener('exercise-saved', handleCustomEvent);
  }, []);

  if (loading) {
    return <div className="animate-pulse h-32 bg-primary/10 rounded-xl" />;
  }

  if (historial.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <History className="h-8 w-8 text-muted-foreground/50" />
          No hay ejercicios recientes completados aún.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <History className="h-4 w-4" />
        Ejercicios Completados Recientemente
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
                    {new Date(h.fecha_completado).toLocaleDateString()} • {h.tiempo_descanso_minutos} min descanso
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-border mt-2 space-y-1">
                {h.series_ejercicios?.sort((a: any, b: any) => a.serie_numero - b.serie_numero).map((s: any) => (
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
