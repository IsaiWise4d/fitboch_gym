// Convierte la tabla Markdown de un día de la rutina (generada por la IA) en
// una lista compacta para el dashboard: nombre + "4 × 6-8 · RIR 2 · 3 min".
// Pura y testeable (imports relativos para vitest).

import { parseMarkdownTable } from "../pdf/markdown-table";

export interface EjercicioDelDia {
  nombre: string;
  series: string | null;
  reps: string | null;
  intensidad: string | null;
  descanso: string | null;
}

export function ejerciciosDelDia(tablaMd: string | null): EjercicioDelDia[] {
  if (!tablaMd) return [];
  const lineas = tablaMd.split(/\r?\n/).filter((linea) => linea.trim().startsWith("|"));
  const tabla = parseMarkdownTable(lineas, { maxColumns: 10 });
  if (!tabla) return [];

  // La primera columna es el ejercicio; las demás se ubican por su encabezado.
  const columna = (patron: RegExp) =>
    tabla.headers.findIndex((encabezado, i) => i > 0 && patron.test(encabezado));
  const iSeries = columna(/serie/i);
  const iReps = columna(/rep/i);
  const iIntensidad = columna(/rir|rpe|intensidad/i);
  const iDescanso = columna(/descanso/i);
  const descansoEnMinutos = iDescanso >= 0 && /min/i.test(tabla.headers[iDescanso]);

  return tabla.rows
    .map((fila) => {
      const valor = (i: number) => (i >= 0 && fila[i]?.trim() ? fila[i].trim() : null);
      let descanso = valor(iDescanso);
      if (descanso && descansoEnMinutos && /^\d+([.,]\d+)?$/.test(descanso)) {
        descanso = `${descanso} min`;
      }
      return {
        nombre: fila[0]?.trim() ?? "",
        series: valor(iSeries),
        reps: valor(iReps),
        intensidad: valor(iIntensidad),
        descanso,
      };
    })
    .filter((ejercicio) => ejercicio.nombre.length > 0);
}

/** "4 × 6-8", "4 series" o "6-8 reps" según lo que traiga la tabla. */
export function resumenSeriesReps(ejercicio: EjercicioDelDia): string | null {
  if (ejercicio.series && ejercicio.reps) return `${ejercicio.series} × ${ejercicio.reps}`;
  if (ejercicio.series) return `${ejercicio.series} series`;
  if (ejercicio.reps) return `${ejercicio.reps} reps`;
  return null;
}
