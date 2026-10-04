// Tendencia de los últimos meses para el reporte (PURO). Los conteos de
// registros y usuarios nuevos llegan ya calculados por mes desde
// server.ts; las membresías se agrupan aquí por mes Bogotá.

import { diaBogota } from "../admin/actividad";
import { sumarMeses } from "./mensual";

export interface PuntoTendencia {
  /** "YYYY-MM" */
  mes: string;
  registros: number;
  usuariosNuevos: number;
  membresiasNuevas: number;
  ingresos: number;
  enCurso: boolean;
}

/** Los `cantidad` meses que terminan en `mesFinal`, en orden ascendente. */
export function mesesHasta(mesFinal: string, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => sumarMeses(mesFinal, i - (cantidad - 1)));
}

/** Variación relativa; null si no hay base de comparación. */
export function variacion(actual: number, anterior: number | null | undefined): number | null {
  if (anterior === null || anterior === undefined || anterior === 0) return null;
  return (actual - anterior) / anterior;
}

export function construirTendencia(entrada: {
  meses: string[];
  mesActual: string;
  registrosPorMes: Record<string, number>;
  usuariosNuevosPorMes: Record<string, number>;
  membresias: readonly { created_at: string; monto_pagado: number | null }[];
}): PuntoTendencia[] {
  const membresiasPorMes = new Map<string, { cantidad: number; ingresos: number }>();
  for (const m of entrada.membresias) {
    const mes = diaBogota(m.created_at).slice(0, 7);
    const acumulado = membresiasPorMes.get(mes) ?? { cantidad: 0, ingresos: 0 };
    acumulado.cantidad += 1;
    acumulado.ingresos += Number(m.monto_pagado) || 0;
    membresiasPorMes.set(mes, acumulado);
  }

  return entrada.meses.map((mes) => ({
    mes,
    registros: entrada.registrosPorMes[mes] ?? 0,
    usuariosNuevos: entrada.usuariosNuevosPorMes[mes] ?? 0,
    membresiasNuevas: membresiasPorMes.get(mes)?.cantidad ?? 0,
    ingresos: membresiasPorMes.get(mes)?.ingresos ?? 0,
    enCurso: mes === entrada.mesActual,
  }));
}
