// Cálculo de fechas al crear/renovar una membresía desde el panel admin.
// PURO: `hoy` llega como "YYYY-MM-DD" Bogotá.

import { sumarDiasFecha } from "./estado";

export const MESES_POR_PLAN = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
} as const;

export type TipoPlan = keyof typeof MESES_POR_PLAN;

export const TIPOS_PLAN = Object.keys(MESES_POR_PLAN) as TipoPlan[];

export function esTipoPlan(valor: string): valor is TipoPlan {
  return valor in MESES_POR_PLAN;
}

/**
 * Suma meses a "YYYY-MM-DD" con la semántica de date-fns `addMonths`: si
 * el día no existe en el mes destino se recorta al último día
 * (31 ene + 1 mes = 28/29 feb).
 */
export function sumarMesesFecha(fecha: string, meses: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const indiceMes = m - 1 + meses;
  const anio = y + Math.floor(indiceMes / 12);
  const mes = ((indiceMes % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const dia = Math.min(d, ultimoDia);
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Fecha fin automática de una membresía nueva o renovada:
 *   - Sin membresía vigente: empieza hoy → hoy + N meses − 1 día.
 *   - Con membresía vigente (fin ≥ hoy): el nuevo periodo empieza el día
 *     siguiente al fin actual, para no perder ni solapar días
 *     (fin 2 nov + 1 mes → 2 dic).
 */
export function calcularFechaFinRenovacion({
  hoy,
  finVigente,
  tipoPlan,
}: {
  hoy: string;
  finVigente: string | null;
  tipoPlan: string;
}): string {
  const meses = esTipoPlan(tipoPlan) ? MESES_POR_PLAN[tipoPlan] : 1;
  const inicio = finVigente && finVigente >= hoy ? sumarDiasFecha(finVigente, 1) : hoy;
  return sumarDiasFecha(sumarMesesFecha(inicio, meses), -1);
}
