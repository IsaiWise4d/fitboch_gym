// Tarjeta principal de la sección /racha: contador actual, mejor racha y
// estado de hoy. Mismo lenguaje visual que el widget del dashboard.

import { AlertTriangle, Check, Clock, Coffee, Flame, Trophy } from "lucide-react";
import { mensajeRacha } from "@/lib/racha/mensajes";
import type { EstadoRacha } from "@/lib/racha/types";

interface ResumenRachaCardProps {
  estado: EstadoRacha;
  mejorRacha: number;
}

function dias(n: number): string {
  return n === 1 ? "día" : "días";
}

export function ResumenRachaCard({ estado, mejorRacha }: ResumenRachaCardProps) {
  const { currentCount, hoyActivado, esDomingo, enRiesgo } = estado;
  const esMejorRacha = currentCount > 0 && currentCount >= mejorRacha;

  const hoy = esDomingo
    ? { icono: Coffee, texto: "Descanso", color: "text-muted-foreground" }
    : hoyActivado
      ? { icono: Check, texto: "Entrenaste", color: "text-orange-300" }
      : { icono: Clock, texto: "Pendiente", color: "text-foreground" };
  const IconoHoy = hoy.icono;

  return (
    <section
      aria-label="Resumen de tu racha"
      className="space-y-4 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-surface to-surface p-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      <div className="flex items-center gap-4">
        <span
          className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-500/15 ${
            currentCount > 0 ? "flame-pulse" : ""
          }`}
        >
          <Flame
            className={`h-8 w-8 ${currentCount > 0 ? "text-orange-400" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold leading-none tabular-nums">{currentCount}</span>
            <span className="text-sm font-medium text-muted-foreground">{dias(currentCount)} de racha</span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{mensajeRacha(estado)}</p>
          {esMejorRacha && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Trophy className="h-3 w-3" aria-hidden="true" />
              ¡Es tu mejor racha!
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border/60 rounded-xl border border-border/60 bg-background/40">
        <div className="px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Mejor racha
          </dt>
          <dd className="mt-1 text-lg font-bold leading-none tabular-nums">
            {mejorRacha} <span className="text-xs font-medium text-muted-foreground">{dias(mejorRacha)}</span>
          </dd>
        </div>
        <div className="px-3 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hoy</dt>
          <dd className={`mt-1 flex items-center gap-1.5 text-sm font-semibold leading-none ${hoy.color}`}>
            <IconoHoy className="h-4 w-4" aria-hidden="true" />
            {hoy.texto}
          </dd>
        </div>
      </dl>

      {enRiesgo && !hoyActivado && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Racha en riesgo: registra un ejercicio hoy para no perderla mañana.</span>
        </div>
      )}
    </section>
  );
}
