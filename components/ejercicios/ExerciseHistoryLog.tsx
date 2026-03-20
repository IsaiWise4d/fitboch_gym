"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

interface ExerciseHistoryLogProps {
  ejercicioId: string;
}

export function ExerciseHistoryLog({ ejercicioId }: ExerciseHistoryLogProps) {
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
        series_ejercicios(serie_numero, peso_kg, repeticiones)
      `)
      .eq("user_id", userData.user.id)
      .eq("ejercicio_id", ejercicioId)
      .order("fecha_completado", { ascending: false })
      .limit(10); // Últimas 10 veces que se hizo este ejercicio

    if (error) {
      console.error("Error cargando historial de ejercicio", error);
    } else {
      setHistorial(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistorial();

    const handleCustomEvent = () => loadHistorial();
    window.addEventListener('exercise-saved', handleCustomEvent);
    return () => window.removeEventListener('exercise-saved', handleCustomEvent);
  }, [ejercicioId]);

  if (loading) {
    return <div className="animate-pulse h-24 bg-primary/10 rounded-xl mt-6" />;
  }

  if (historial.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <History className="h-4 w-4" />
          Mi Historial con este Ejercicio
        </h2>
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Aún no tienes historial registrado para este ejercicio.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <History className="h-4 w-4" />
        Mi Historial con este Ejercicio
      </h2>
      <div className="space-y-3">
        {historial.map((h) => (
          <div key={h.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
              <span>{new Date(h.fecha_completado).toLocaleDateString()}</span>
              <span>{h.tiempo_descanso_minutos} min descanso</span>
            </div>
            <div className="pt-2 border-t border-border space-y-1">
              {h.series_ejercicios?.sort((a: any, b: any) => a.serie_numero - b.serie_numero).map((s: any) => (
                <div key={s.serie_numero} className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Serie {s.serie_numero}</span>
                  <span className="font-medium text-primary">
                    {s.peso_kg} kg <span className="text-muted-foreground mx-1">×</span> {s.repeticiones} reps
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
