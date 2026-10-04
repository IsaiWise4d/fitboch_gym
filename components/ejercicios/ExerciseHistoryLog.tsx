"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarClock, ChevronDown, Repeat, TrendingUp, Trophy } from "lucide-react";
import { Skeleton } from "@/components/shared/Skeleton";
import { textoHaceCuanto } from "@/lib/utils/fecha";

interface ExerciseHistoryLogProps {
  ejercicioId: string;
}

interface SerieHistorial {
  serie_numero: number;
  peso_kg: number;
  repeticiones: number;
}

interface RegistroHistorial {
  id: string;
  fecha_completado: string;
  tiempo_descanso_minutos: number;
  series_ejercicios: SerieHistorial[] | null;
}

const SESIONES_VISIBLES = 3;

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatearPeso(peso: number): string {
  return Number.isInteger(peso) ? String(peso) : peso.toFixed(1);
}

export function ExerciseHistoryLog({ ejercicioId }: ExerciseHistoryLogProps) {
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [mejorMarca, setMejorMarca] = useState<number | null>(null);
  const [totalSesiones, setTotalSesiones] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verTodo, setVerTodo] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Solo la primera carga muestra skeleton; los refrescos posteriores
  // (evento exercise-saved) actualizan sin parpadeo.
  const loadHistorial = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    const userId = userData.user.id;

    const [lista, marca, conteo] = await Promise.all([
      supabase
        .from("historial_ejercicios")
        .select(`
          id,
          fecha_completado,
          tiempo_descanso_minutos,
          series_ejercicios(serie_numero, peso_kg, repeticiones)
        `)
        .eq("user_id", userId)
        .eq("ejercicio_id", ejercicioId)
        .order("fecha_completado", { ascending: false })
        .limit(10), // Últimas 10 veces que se hizo este ejercicio
      // Mejor marca histórica (misma consulta que el PR del registrador).
      supabase
        .from("series_ejercicios")
        .select("peso_kg, historial_ejercicios!inner(user_id, ejercicio_id)")
        .eq("historial_ejercicios.user_id", userId)
        .eq("historial_ejercicios.ejercicio_id", ejercicioId)
        .order("peso_kg", { ascending: false })
        .limit(1),
      supabase
        .from("historial_ejercicios")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ejercicio_id", ejercicioId),
    ]);

    if (lista.error) {
      console.error("Error cargando historial de ejercicio", lista.error);
    } else {
      setHistorial((lista.data as RegistroHistorial[]) || []);
    }
    if (marca.error) console.error("Error cargando mejor marca", marca.error);
    setMejorMarca(marca.data?.[0]?.peso_kg ?? null);
    setTotalSesiones(conteo.count ?? lista.data?.length ?? 0);
    setLoading(false);
  }, [supabase, ejercicioId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistorial();
    }, 0);

    const handleCustomEvent = () => {
      void loadHistorial();
    };
    window.addEventListener("exercise-saved", handleCustomEvent);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("exercise-saved", handleCustomEvent);
    };
  }, [loadHistorial]);

  const titulo = (
    <h2 className="flex items-center gap-2 text-base font-semibold">
      <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
      Tu progreso
    </h2>
  );

  if (loading) {
    return (
      <section role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Cargando tu progreso…</span>
        {titulo}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-xl" />
      </section>
    );
  }

  if (historial.length === 0) {
    return (
      <section className="space-y-3">
        {titulo}
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Aún no has registrado este ejercicio. Cuando lo hagas, aquí verás tu mejor marca y
            cómo vas mejorando.
          </p>
        </div>
      </section>
    );
  }

  const sesiones = verTodo ? historial : historial.slice(0, SESIONES_VISIBLES);
  const estadisticas = [
    {
      icono: Trophy,
      valor: mejorMarca !== null && mejorMarca > 0 ? `${formatearPeso(mejorMarca)} kg` : "—",
      etiqueta: "Mejor marca",
    },
    {
      icono: CalendarClock,
      valor: textoHaceCuanto(historial[0].fecha_completado),
      etiqueta: "Última vez",
    },
    {
      icono: Repeat,
      valor: String(totalSesiones),
      etiqueta: totalSesiones === 1 ? "Vez" : "Veces",
    },
  ];

  return (
    <section className="space-y-3">
      {titulo}

      <div className="grid grid-cols-3 gap-2">
        {estadisticas.map(({ icono: Icono, valor, etiqueta }) => (
          <div key={etiqueta} className="rounded-xl border border-border bg-surface p-3">
            <Icono className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="mt-2 truncate text-base font-bold leading-tight tabular-nums">{valor}</p>
            <p className="text-[11px] text-muted-foreground">{etiqueta}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-2">
        {sesiones.map((h) => {
          const series = (h.series_ejercicios ?? [])
            .slice()
            .sort((a, b) => a.serie_numero - b.serie_numero);
          return (
            <li key={h.id} className="rounded-xl border border-border bg-surface p-3 animate-in fade-in duration-300">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium capitalize">
                  {FORMATO_FECHA.format(new Date(h.fecha_completado))}
                </span>
                <span className="text-muted-foreground">
                  {series.length} {series.length === 1 ? "serie" : "series"} · {h.tiempo_descanso_minutos} min descanso
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {series.map((s) => {
                  const esMejor = mejorMarca !== null && mejorMarca > 0 && Number(s.peso_kg) === mejorMarca;
                  return (
                    <span
                      key={s.serie_numero}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums ${
                        esMejor
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground/90"
                      }`}
                    >
                      {esMejor && <Trophy className="h-3 w-3" aria-label="Tu mejor marca" />}
                      {formatearPeso(Number(s.peso_kg))} kg
                      <span className="text-muted-foreground">×</span>
                      {s.repeticiones}
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {historial.length > SESIONES_VISIBLES && (
        <button
          type="button"
          onClick={() => setVerTodo(!verTodo)}
          aria-expanded={verTodo}
          className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface"
        >
          {verTodo ? "Ver menos" : `Ver las últimas ${historial.length} sesiones`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${verTodo ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </section>
  );
}
