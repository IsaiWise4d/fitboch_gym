"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, Coffee, Timer, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRangoDiaColombiaUTC } from "@/lib/utils/fecha";
import { parsearDiasRutina } from "@/lib/utils/parsear-rutina";
import { ejerciciosDelDia, resumenSeriesReps } from "@/lib/utils/ejercicios-dia";

interface Props {
  textoRutina: string;
  /** Índice del día de hoy (lunes = 0), calculado en Bogotá en el server. */
  hoyIndice: number;
  userId: string;
}

// Mapear número de día del plan al nombre: 1=Lunes, 2=Martes... 7=Domingo
const NOMBRE_DIA_PLAN = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Cantidad de ejercicios registrados hoy (Bogotá). Se actualiza con el
 * evento `exercise-saved` (guardar o borrar desde el dashboard).
 */
function useEjerciciosHoy(userId: string): number | null {
  const [cantidad, setCantidad] = useState<number | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      const { inicioUtcIso, finUtcIso } = getRangoDiaColombiaUTC();
      const { count, error } = await supabase
        .from("historial_ejercicios")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("fecha_completado", inicioUtcIso)
        .lt("fecha_completado", finUtcIso);
      if (error) {
        console.error("Error contando ejercicios de hoy:", error);
        return;
      }
      if (activo) setCantidad(count ?? 0);
    };
    void cargar();
    const alGuardar = () => void cargar();
    window.addEventListener("exercise-saved", alGuardar);
    return () => {
      activo = false;
      window.removeEventListener("exercise-saved", alGuardar);
    };
  }, [supabase, userId]);

  return cantidad;
}

export function RutinaDiaria({ textoRutina, hoyIndice, userId }: Props) {
  const dias = useMemo(() => parsearDiasRutina(textoRutina), [textoRutina]);
  const hoyIdx = Math.min(hoyIndice, Math.max(dias.length - 1, 0));
  const [indice, setIndice] = useState(hoyIdx);
  // Dirección del último cambio de día, para animar la entrada desde ese lado.
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const toqueInicio = useRef<{ x: number; y: number } | null>(null);
  const registradosHoy = useEjerciciosHoy(userId);

  const ir = useCallback(
    (dir: -1 | 1) => {
      setDireccion(dir);
      setIndice((prev) => {
        const next = prev + dir;
        if (next < 0) return dias.length - 1;
        if (next >= dias.length) return 0;
        return next;
      });
    },
    [dias.length]
  );

  const irA = (destino: number) => {
    setDireccion(destino >= indice ? 1 : -1);
    setIndice(destino);
  };

  // Keyboard navigation (sin interferir cuando se escribe en un campo,
  // p. ej. las series del ejercicio activo en el mismo dashboard).
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const objetivo = e.target as HTMLElement | null;
      if (
        objetivo &&
        (objetivo.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(objetivo.tagName))
      ) {
        return;
      }
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "ArrowRight") ir(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ir]);

  // Swipe horizontal para cambiar de día.
  function onTouchStart(e: React.TouchEvent) {
    const toque = e.touches[0];
    toqueInicio.current = { x: toque.clientX, y: toque.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const inicio = toqueInicio.current;
    toqueInicio.current = null;
    if (!inicio) return;
    const toque = e.changedTouches[0];
    const dx = toque.clientX - inicio.x;
    const dy = toque.clientY - inicio.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    ir(dx < 0 ? 1 : -1);
  }

  if (dias.length === 0) return null;

  const dia = dias[indice];
  const esHoy = indice === hoyIdx;
  const nombreDia = NOMBRE_DIA_PLAN[dia.numero] || `Día ${dia.numero}`;
  const tituloDia = dia.grupo.replace(/\s*\([^)]*\)\s*$/, "") || dia.titulo;
  const ejercicios = ejerciciosDelDia(dia.tablaMd);
  const total = ejercicios.length;
  const mostrarProgreso = esHoy && !dia.esDescanso && total > 0 && registradosHoy !== null;
  const progreso = mostrarProgreso ? Math.min(registradosHoy / total, 1) : 0;

  return (
    <section aria-label="Entrenamiento del día" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {esHoy ? "Entrenamiento de hoy" : "Tu rutina"}
        </h2>
        {!esHoy && (
          <button
            onClick={() => irA(hoyIdx)}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 active:scale-95 animate-in fade-in"
          >
            Volver a hoy
          </button>
        )}
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 via-surface to-surface"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Cabecera: día + entrenamiento, con flechas para cambiar de día */}
        <div className="flex items-center gap-1 px-2 pt-3">
          <button
            onClick={() => ir(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            key={indice}
            className={`min-w-0 flex-1 px-1 text-center animate-in fade-in duration-300 ${
              direccion === 1 ? "slide-in-from-right-2" : "slide-in-from-left-2"
            }`}
            aria-live="polite"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {esHoy ? `Hoy · ${nombreDia}` : nombreDia}
            </p>
            <p className="mt-0.5 line-clamp-2 text-lg font-bold leading-snug text-white">
              {dia.esDescanso ? "Día de descanso" : tituloDia}
            </p>
            {!dia.esDescanso && total > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {total} {total === 1 ? "ejercicio" : "ejercicios"}
              </p>
            )}
          </div>

          <button
            onClick={() => ir(1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Progreso de hoy */}
        {mostrarProgreso && (
          <div className="mx-4 mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground/90">
                {registradosHoy >= total
                  ? "¡Completaste tu entrenamiento!"
                  : `${registradosHoy} de ${total} registrados`}
              </span>
              <span className="text-muted-foreground">{Math.round(progreso * 100)}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={Math.min(registradosHoy, total)}
              aria-label="Ejercicios registrados hoy"
              className="h-2 overflow-hidden rounded-full bg-primary/15"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${progreso * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Contenido: lista compacta de ejercicios o descanso */}
        <div
          key={`contenido-${indice}`}
          className={`px-4 pb-1 pt-3 animate-in fade-in duration-300 ease-out ${
            direccion === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
          }`}
        >
          {dia.esDescanso ? (
            <DescansoCard grupo={tituloDia} />
          ) : total === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Revisa los detalles de este día en tu rutina completa.
            </p>
          ) : (
            <ol className="divide-y divide-border/60">
              {ejercicios.map((ejercicio, i) => {
                const seriesReps = resumenSeriesReps(ejercicio);
                return (
                  <li key={`${ejercicio.nombre}-${i}`} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-white">{ejercicio.nombre}</p>
                      {(seriesReps || ejercicio.intensidad) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[seriesReps, ejercicio.intensidad].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {ejercicio.descanso && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                        <Timer className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">Descanso</span>
                        {ejercicio.descanso}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Indicadores de puntos */}
        <div className="flex items-center justify-center">
          {dias.map((d, i) => (
            <button
              key={i}
              onClick={() => irA(i)}
              className="flex h-7 items-center px-1"
              aria-label={`Ir a ${NOMBRE_DIA_PLAN[d.numero] || `día ${i + 1}`}`}
              aria-current={i === indice ? "true" : undefined}
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === indice
                    ? "w-4 bg-primary"
                    : i === hoyIdx
                      ? "w-1.5 bg-primary/40"
                      : d.esDescanso
                        ? "w-1.5 bg-white/10"
                        : "w-1.5 bg-white/20"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Accesos: calentar antes y ver la rutina completa */}
        <div className="grid grid-cols-2 border-t border-border/60">
          <Link
            href="/calentamientos"
            className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-white/5"
          >
            <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Calentar primero
          </Link>
          <Link
            href="/rutina"
            className="flex items-center justify-center gap-1.5 border-l border-border/60 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-white/5"
          >
            <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Rutina completa
          </Link>
        </div>
      </div>
    </section>
  );
}

function DescansoCard({ grupo }: { grupo: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
      <div className="rounded-full bg-white/5 p-4">
        <Coffee className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{grupo}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tu cuerpo necesita recuperarse para seguir creciendo.
        </p>
      </div>
    </div>
  );
}
