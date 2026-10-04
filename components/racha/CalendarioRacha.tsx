// Calendario mensual de racha (puramente presentacional, sin estado).
// Recibe los días pre-calculados en el server (lib/racha/server.ts) y los
// pinta con el mismo lenguaje que la tira "Tu semana" del dashboard:
//   - Entrenaste           → círculo naranja lleno.
//   - Hoy pendiente        → borde naranja pulsante.
//   - Exigible sin entrenar→ círculo gris tenue.
//   - Próximo              → borde punteado.
//   - Domingo / antes del inicio de la racha → solo el número, apagado.
//   - Fuera de mes         → celda vacía.

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FECHA_INICIO_RACHA } from "@/lib/racha/reglas";
import type { CalendarioRachaDia } from "@/lib/racha/types";

interface CalendarioRachaProps {
  dias: CalendarioRachaDia[];
  nombreMes: string;
  diasEntrenados: number;
  hrefPrev: string;
  hrefNext: string;
  nextDisabled: boolean;
  hoyStr: string;
}

type EstadoCelda = "entrenaste" | "hoy" | "sin_entrenar" | "proximo" | "descanso" | "antes_inicio";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const CLASES_CELDA: Record<EstadoCelda, string> = {
  entrenaste: "bg-orange-500 text-black",
  hoy: "border-2 border-orange-500/70 text-orange-300 streak-today-pulse",
  sin_entrenar: "bg-white/5 text-muted-foreground",
  proximo: "border border-dashed border-white/15 text-muted-foreground/60",
  descanso: "text-muted-foreground/40",
  antes_inicio: "text-muted-foreground/40",
};

const TEXTO_ESTADO: Record<EstadoCelda, string> = {
  entrenaste: "entrenaste",
  hoy: "hoy, pendiente",
  sin_entrenar: "sin entrenar",
  proximo: "próximo",
  descanso: "descanso",
  antes_inicio: "antes del inicio de la racha",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "lunes, 1 de septiembre" para lectores de pantalla. */
function fechaLegible(fecha: string): string {
  return FORMATO_FECHA.format(new Date(`${fecha}T12:00:00Z`));
}

function estadoCelda(d: CalendarioRachaDia, hoyStr: string): EstadoCelda {
  if (d.activado) return "entrenaste";
  if (!d.exigible) return "descanso";
  if (d.fecha < FECHA_INICIO_RACHA) return "antes_inicio";
  if (d.esHoy) return "hoy";
  if (d.fecha > hoyStr) return "proximo";
  return "sin_entrenar";
}

/** Quita las semanas que caen completas fuera del mes (la grilla trae 6). */
function semanasDelMes(dias: CalendarioRachaDia[]): CalendarioRachaDia[] {
  const visibles: CalendarioRachaDia[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const semana = dias.slice(i, i + 7);
    if (semana.some((d) => !d.fueraDeMes)) visibles.push(...semana);
  }
  return visibles;
}

const botonMesClassName =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-white active:scale-95";

export function CalendarioRacha({
  dias,
  nombreMes,
  diasEntrenados,
  hrefPrev,
  hrefNext,
  nextDisabled,
  hoyStr,
}: CalendarioRachaProps) {
  return (
    <section aria-label="Calendario de racha" className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Cabecera: mes + flechas, igual que la rutina del día */}
      <div className="flex items-center gap-1 px-2 pt-3">
        <Link href={hrefPrev} scroll={false} className={botonMesClassName} aria-label="Mes anterior">
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <div key={nombreMes} className="animate-in fade-in duration-300">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">Calendario</p>
            <h2 className="mt-0.5 text-lg font-bold capitalize leading-snug">{nombreMes}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {diasEntrenados} {diasEntrenados === 1 ? "día entrenado" : "días entrenados"}
            </p>
          </div>
        </div>

        {nextDisabled ? (
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground opacity-30"
            aria-disabled="true"
            aria-label="Mes siguiente (no disponible)"
          >
            <ChevronRight className="h-5 w-5" />
          </span>
        ) : (
          <Link href={hrefNext} scroll={false} className={botonMesClassName} aria-label="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}
      </div>

      <div className="px-3 pb-4 pt-3">
        <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
          {DIAS_SEMANA.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>

        <ol key={nombreMes} className="mt-1 grid grid-cols-7 gap-x-1 gap-y-1.5 animate-in fade-in duration-300">
          {semanasDelMes(dias).map((d) => {
            if (d.fueraDeMes) {
              return <li key={d.fecha} aria-hidden="true" />;
            }

            const estado = estadoCelda(d, hoyStr);
            return (
              <li key={d.fecha} aria-current={d.esHoy ? "date" : undefined}>
                <span
                  aria-hidden="true"
                  className={`mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    CLASES_CELDA[estado]
                  } ${d.esHoy && estado === "descanso" ? "text-orange-300" : ""}`}
                >
                  {d.dia}
                </span>
                <span className="sr-only">
                  {fechaLegible(d.fecha)}: {TEXTO_ESTADO[estado]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Leyenda: mismas formas que las celdas */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 px-4 py-3 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-orange-500" />
          Entrenaste
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-orange-500/70" />
          Hoy
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-white/15" />
          Sin entrenar
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-dashed border-white/30" />
          Próximo
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 text-center text-[10px] font-semibold text-muted-foreground/60">
            D
          </span>
          Descanso
        </li>
      </ul>
    </section>
  );
}
