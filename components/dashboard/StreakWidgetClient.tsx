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
import { useRouter } from "next/navigation";
import { Flame, AlertTriangle } from "lucide-react";
import type { EstadoRacha } from "@/lib/racha/types";

interface Props {
  initialState: EstadoRacha;
}

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

export function StreakWidgetClient({ initialState }: Props) {
  const router = useRouter();
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

  const mensaje = (() => {
    if (estado.esDomingo) return "Hoy es descanso; tu racha descansa";
    if (currentCount === 0) return "Registra hoy para empezar tu racha";
    if (hoyActivado) return "¡Racha activa hoy! Vuelve mañana";
    return `${currentCount} día${currentCount === 1 ? "" : "s"} seguido${currentCount === 1 ? "" : "s"}`;
  })();

  return (
    <button
      onClick={() => router.push("/racha")}
      className="w-full text-left rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-3 transition-colors hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`relative inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/15 ${
              animando ? "streak-pop" : currentCount > 0 ? "flame-pulse" : ""
            }`}
          >
            <Flame
              className={`h-6 w-6 ${
                currentCount > 0 ? "text-orange-400" : "text-muted-foreground"
              }`}
            />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Racha
            </p>
            <p className="text-2xl font-bold leading-none">{currentCount}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{mensaje}</p>
        </div>
      </div>

      {enRiesgo && !hoyActivado && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Racha en riesgo: registra un ejercicio hoy para no perderla mañana.
          </span>
        </div>
      )}
    </button>
  );
}
