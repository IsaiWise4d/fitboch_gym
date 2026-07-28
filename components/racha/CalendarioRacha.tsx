"use client";

// Calendario mensual de racha (client component, puramente presentacional).
// Recibe los días pre-calculados en el server (lib/racha/server.ts).
//
// Días:
//   - Activado (exigible con ejercicio) → círculo naranja lleno.
//   - Hoy exigible no activado → borde naranja pulsante (invite).
//   - Exigible pasado no activado → punto gris.
//   - Domingo → fondo gris claro, label "Descanso".
//   - Fuera de mes → opaco.

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarioRachaDia } from "@/lib/racha/types";

interface Props {
  dias: CalendarioRachaDia[];
  nombreMes: string;
  hrefPrev: string;
  hrefNext: string;
  nextDisabled: boolean;
  hoyStr: string;
}

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export function CalendarioRacha({
  dias,
  nombreMes,
  hrefPrev,
  hrefNext,
  nextDisabled,
  hoyStr,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={hrefPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-hover transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-sm font-semibold capitalize">{nombreMes}</h2>
        {nextDisabled ? (
          <span className="inline-flex h-8 w-8 items-center justify-center opacity-40">
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={hrefNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-hover transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted-foreground">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((d) => {
          if (d.fueraDeMes) {
            return (
              <div
                key={d.fecha}
                className="h-12 rounded-md opacity-30"
                aria-hidden
              />
            );
          }

          // Domingo = descanso.
          if (!d.exigible) {
            return (
              <div
                key={d.fecha}
                className="h-12 rounded-md bg-muted/30 flex flex-col items-center justify-center text-[10px] text-muted-foreground/70"
                title="Domingo: día de descanso"
              >
                <span className="font-medium">{d.dia}</span>
                <span>Descanso</span>
              </div>
            );
          }

          // Hoy exigible pendiente.
          const esHoyPendiente = d.esHoy && !d.activado && d.fecha === hoyStr;

          let clases =
            "h-12 rounded-md flex flex-col items-center justify-center text-xs relative transition-colors ";
          if (d.activado) {
            clases +=
              "bg-orange-500/80 text-black font-medium border border-orange-400";
          } else if (esHoyPendiente) {
            clases +=
              "border-2 border-orange-500/70 text-orange-300 bg-orange-500/5 streak-today-pulse";
          } else {
            clases += "bg-muted/30 text-muted-foreground";
          }

          return (
            <div key={d.fecha} className={clases} title={d.fecha}>
              <span>{d.dia}</span>
              {d.activado && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-black/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}