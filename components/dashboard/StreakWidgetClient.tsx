"use client";

// Island client del widget de racha.
// - Muestra el contador con el ícono Flame (lucide).
// - Escucha 'exercise-saved' (CustomEvent con detail.estado) para refrescar
//   el estado cuando un ejercicio se guardó. El estado nuevo lo calcula el
//   Route Handler /api/racha/activar que ya llamó ActiveExerciseTracker.
// - Escucha 'streak-activated' (CustomEvent con detail.estado) para
//   reproducir la animación `.streak-pop` (keyframes CSS, sin dependencias).
// - Muestra un banner interno cuando la racha está "en riesgo".
//
// El widget NUNCA llama a /api/racha/activar por su cuenta, para evitar
// duplicar la evaluación y disparar animaciones espurias. La fuente única
// de la activación es el Route Handler, invocado por ActiveExerciseTracker
// justo tras el insert.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flame, AlertTriangle, Check, ChevronRight } from "lucide-react";
import { mensajeRacha } from "@/lib/racha/mensajes";
import type { DiaSemanaRacha, EstadoRacha } from "@/lib/racha/types";

interface Props {
  initialState: EstadoRacha;
  /** Lunes a domingo de la semana actual (Bogotá), calculado en el server. */
  semanaInicial: DiaSemanaRacha[];
}

const NOMBRE_DIA: Record<string, string> = {
  L: "Lunes",
  M: "Martes",
  X: "Miércoles",
  J: "Jueves",
  V: "Viernes",
  S: "Sábado",
  D: "Domingo",
};

type SavedEvent = CustomEvent<{ estado?: EstadoRacha }> | Event;

function leerEstadoDeEvento(e: SavedEvent): EstadoRacha | null {
  if ("detail" in e && e.detail && typeof e.detail === "object") {
    const d = (e.detail as { estado?: EstadoRacha }).estado;
    if (d && typeof d === "object" && "currentCount" in d) {
      return d;
    }
  }
  return null;
}

export function StreakWidgetClient({ initialState, semanaInicial }: Props) {
  const [estado, setEstado] = useState<EstadoRacha>(initialState);
  const [animando, setAnimando] = useState(false);
  const animTimer = useRef<number | null>(null);

  const dispararAnimacion = () => {
    setAnimando(true);
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnimando(false), 700);
  };

  useEffect(() => {
    const onSaved = (e: Event) => {
      const nuevo = leerEstadoDeEvento(e as SavedEvent);
      if (nuevo) setEstado(nuevo);
    };
    const onActivated = (e: Event) => {
      const nuevo = leerEstadoDeEvento(e as SavedEvent);
      if (nuevo) setEstado(nuevo);
      dispararAnimacion();
    };
    window.addEventListener("exercise-saved", onSaved);
    window.addEventListener("streak-activated", onActivated);
    return () => {
      window.removeEventListener("exercise-saved", onSaved);
      window.removeEventListener("streak-activated", onActivated);
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
  }, []);

  const { currentCount, enRiesgo, hoyActivado } = estado;

  // El día de hoy se pinta con el estado más reciente (llega por eventos al
  // guardar o borrar). El domingo no es exigible: conserva el dato del server.
  const semana = semanaInicial.map((dia) =>
    dia.esHoy && dia.exigible ? { ...dia, activado: hoyActivado } : dia
  );
  const entrenadosSemana = semana.filter((dia) => dia.activado).length;

  const mensaje = mensajeRacha(estado);

  return (
    <Link
      href="/racha"
      className="block w-full space-y-4 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-surface to-surface p-4 text-left transition-all hover:border-orange-500/35 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/15 ${
              animando ? "streak-pop" : currentCount > 0 ? "flame-pulse" : ""
            }`}
          >
            <Flame
              className={`h-6 w-6 ${
                currentCount > 0 ? "text-orange-400" : "text-muted-foreground"
              }`}
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5">
              <span
                key={currentCount}
                className="text-2xl font-bold leading-none animate-in fade-in zoom-in-50 duration-300"
              >
                {currentCount}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {currentCount === 1 ? "día de racha" : "días de racha"}
              </span>
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{mensaje}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Tu semana: lunes a domingo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Tu semana
          </span>
          <span className="text-muted-foreground">
            {entrenadosSemana} {entrenadosSemana === 1 ? "día entrenado" : "días entrenados"}
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5">
          {semana.map((dia) => {
            const estadoDia = dia.activado
              ? "entrenaste"
              : !dia.exigible
                ? "descanso"
                : dia.esHoy
                  ? "pendiente"
                  : dia.futuro
                    ? "próximo"
                    : "sin entrenar";
            return (
              <li
                key={dia.fecha}
                className="flex flex-col items-center gap-1"
                aria-label={`${NOMBRE_DIA[dia.letra]} ${dia.dia}: ${estadoDia}`}
              >
                <span
                  aria-hidden="true"
                  className={`text-[10px] font-semibold ${dia.esHoy ? "text-orange-300" : "text-muted-foreground"}`}
                >
                  {dia.letra}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    dia.activado
                      ? "bg-orange-500 text-black"
                      : dia.esHoy
                        ? "border-2 border-orange-500/70 text-orange-300 streak-today-pulse"
                        : !dia.exigible
                          ? "bg-white/5 text-muted-foreground/50"
                          : dia.futuro
                            ? "border border-dashed border-white/15 text-muted-foreground/60"
                            : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {dia.activado ? <Check className="h-4 w-4" strokeWidth={3} /> : dia.dia}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {enRiesgo && !hoyActivado && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Racha en riesgo: registra un ejercicio hoy para no perderla mañana.
          </span>
        </div>
      )}
    </Link>
  );
}
