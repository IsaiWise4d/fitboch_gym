// Actividad de entrenamiento por usuario y día (Bogotá). PURO: recibe las
// filas ya leídas y `hoy` ("YYYY-MM-DD" Bogotá). Reutiliza las reglas de
// racha de lib/racha/reglas.ts para que panel, lista y ficha coincidan
// con lo que ve el usuario.

import {
  calcularMejorRacha,
  calcularRacha,
  esDiaExigible,
  FECHA_INICIO_RACHA,
} from "../racha/reglas";
import { fechaAString, stringAFecha, sumarDias } from "../racha/bogota";
import type { EstadoRacha } from "../racha/types";
import { diasEntreFechas, sumarDiasFecha } from "../membresias/estado";
import type { DiaEntreno, RegistroEntreno } from "./tipos";

/**
 * Colombia no tiene horario de verano: Bogotá es siempre UTC−5. Restar el
 * offset fijo es equivalente a Intl con TZ America/Bogota y mucho más
 * rápido para decenas de miles de filas.
 */
const OFFSET_BOGOTA_MS = 5 * 60 * 60 * 1000;

/** Día ("YYYY-MM-DD") y hora (0-23) Bogotá de un timestamp UTC. */
export function diaYHoraBogota(isoUtc: string): { dia: string; hora: number } {
  const local = new Date(Date.parse(isoUtc) - OFFSET_BOGOTA_MS);
  return { dia: local.toISOString().slice(0, 10), hora: local.getUTCHours() };
}

/** Día Bogotá de un timestamp ISO; una fecha "YYYY-MM-DD" se devuelve igual. */
export function diaBogota(fechaOIso: string): string {
  return fechaOIso.length <= 10 ? fechaOIso : diaYHoraBogota(fechaOIso).dia;
}

/** "HH:mm" Bogotá de un timestamp UTC. */
export function horaMinutoBogota(isoUtc: string): string {
  return new Date(Date.parse(isoUtc) - OFFSET_BOGOTA_MS).toISOString().slice(11, 16);
}

/** Agrupa registros de historial en un DiaEntreno por usuario y día Bogotá. */
export function agruparDiasEntreno(registros: readonly RegistroEntreno[]): DiaEntreno[] {
  const porClave = new Map<string, DiaEntreno>();
  for (const r of registros) {
    if (!r.user_id || !r.fecha_completado) continue;
    const { dia, hora } = diaYHoraBogota(r.fecha_completado);
    const clave = `${r.user_id}|${dia}`;
    const existente = porClave.get(clave);
    if (!existente) {
      porClave.set(clave, {
        userId: r.user_id,
        dia,
        primeraIso: r.fecha_completado,
        horaLlegada: hora,
        ejercicios: 1,
      });
      continue;
    }
    existente.ejercicios += 1;
    if (Date.parse(r.fecha_completado) < Date.parse(existente.primeraIso)) {
      existente.primeraIso = r.fecha_completado;
      existente.horaLlegada = hora;
    }
  }
  return [...porClave.values()].sort(
    (a, b) => a.dia.localeCompare(b.dia) || a.userId.localeCompare(b.userId)
  );
}

/** Índice userId → días de entreno (ordenados asc). */
export function agruparPorUsuario(dias: readonly DiaEntreno[]): Map<string, DiaEntreno[]> {
  const mapa = new Map<string, DiaEntreno[]>();
  for (const d of dias) {
    const lista = mapa.get(d.userId);
    if (lista) lista.push(d);
    else mapa.set(d.userId, [d]);
  }
  return mapa;
}

export const DIAS_VENTANA_ASISTENCIA = 30;

export interface MetricasUsuario {
  racha: EstadoRacha;
  mejorRacha: number;
  /** Último día ("YYYY-MM-DD") con ejercicio dentro de la ventana leída. */
  ultimoEntreno: string | null;
  diasSinEntrenar: number | null;
  entrenoHoy: boolean;
  /** Días con ejercicio en los últimos 30 días (incluye domingos). */
  dias30: number;
  /** Días exigibles (lun-vie) ya transcurridos en la ventana de 30 días. */
  exigibles30: number;
  /** Exigibles cumplidos / exigibles transcurridos (0..1); null si no hay. */
  asistencia30: number | null;
  /** Días exigibles con ejercicio en el mes en curso. */
  diasActivosMes: number;
}

/**
 * Métricas de un usuario a partir de SUS días de entreno.
 * - La racha solo considera días ≥ FECHA_INICIO_RACHA (igual que /racha).
 * - La asistencia ignora días previos al registro del usuario y no cuenta
 *   hoy como fallo mientras no haya entrenado (el día no terminó).
 */
export function metricasUsuario(
  dias: readonly DiaEntreno[],
  hoy: string,
  opciones: { registro?: string } = {}
): MetricasUsuario {
  const entrenados = new Set<string>();
  const paraRacha = new Set<string>();
  let ultimoEntreno: string | null = null;
  for (const d of dias) {
    if (d.dia > hoy) continue;
    entrenados.add(d.dia);
    if (d.dia >= FECHA_INICIO_RACHA) paraRacha.add(d.dia);
    if (!ultimoEntreno || d.dia > ultimoEntreno) ultimoEntreno = d.dia;
  }

  const desdeVentana = sumarDiasFecha(hoy, -(DIAS_VENTANA_ASISTENCIA - 1));
  const registro = opciones.registro ? diaBogota(opciones.registro) : undefined;
  const mesActual = hoy.slice(0, 7);
  let dias30 = 0;
  let exigibles30 = 0;
  let cumplidos30 = 0;
  let diasActivosMes = 0;

  let cursor = stringAFecha(desdeVentana);
  const fin = stringAFecha(hoy).getTime();
  while (cursor.getTime() <= fin) {
    const fecha = fechaAString(cursor);
    const entreno = entrenados.has(fecha);
    const exigible = esDiaExigible(cursor);
    if (entreno) dias30 += 1;
    const antesDeRegistro = registro !== undefined && fecha < registro;
    const pendienteHoy = fecha === hoy && !entreno;
    if (exigible && !antesDeRegistro && !pendienteHoy) {
      exigibles30 += 1;
      if (entreno) cumplidos30 += 1;
    }
    cursor = sumarDias(cursor, 1);
  }

  for (const fecha of entrenados) {
    if (fecha.startsWith(mesActual) && esDiaExigible(stringAFecha(fecha))) diasActivosMes += 1;
  }

  return {
    racha: calcularRacha(paraRacha, hoy),
    mejorRacha: calcularMejorRacha(paraRacha),
    ultimoEntreno,
    diasSinEntrenar: ultimoEntreno ? diasEntreFechas(ultimoEntreno, hoy) : null,
    entrenoHoy: entrenados.has(hoy),
    dias30,
    exigibles30,
    asistencia30: exigibles30 > 0 ? cumplidos30 / exigibles30 : null,
    diasActivosMes,
  };
}

export interface CeldaActividad {
  fecha: string;
  ejercicios: number;
  /** Intensidad 0-4 para el color del calendario. */
  nivel: 0 | 1 | 2 | 3 | 4;
  exigible: boolean;
  futuro: boolean;
  antesDeRegistro: boolean;
}

function nivelActividad(ejercicios: number): CeldaActividad["nivel"] {
  if (ejercicios <= 0) return 0;
  if (ejercicios <= 2) return 1;
  if (ejercicios <= 4) return 2;
  if (ejercicios <= 6) return 3;
  return 4;
}

/**
 * Calendario tipo GitHub: `semanas` columnas (lunes → domingo), la última
 * contiene `hoy`. Devuelve un arreglo de semanas, cada una con 7 celdas.
 */
export function construirCalendarioActividad(
  dias: readonly DiaEntreno[],
  hoy: string,
  semanas: number,
  registro?: string
): CeldaActividad[][] {
  const ejerciciosPorDia = new Map<string, number>();
  for (const d of dias) ejerciciosPorDia.set(d.dia, (ejerciciosPorDia.get(d.dia) ?? 0) + d.ejercicios);

  const hoyFecha = stringAFecha(hoy);
  const dow = hoyFecha.getUTCDay();
  const lunesActual = sumarDias(hoyFecha, -(dow === 0 ? 6 : dow - 1));
  const inicio = sumarDias(lunesActual, -7 * (semanas - 1));
  const registroDia = registro ? diaBogota(registro) : undefined;

  const resultado: CeldaActividad[][] = [];
  let cursor = inicio;
  for (let s = 0; s < semanas; s++) {
    const semana: CeldaActividad[] = [];
    for (let d = 0; d < 7; d++) {
      const fecha = fechaAString(cursor);
      const ejercicios = ejerciciosPorDia.get(fecha) ?? 0;
      semana.push({
        fecha,
        ejercicios,
        nivel: nivelActividad(ejercicios),
        exigible: esDiaExigible(cursor),
        futuro: fecha > hoy,
        antesDeRegistro: registroDia !== undefined && fecha < registroDia,
      });
      cursor = sumarDias(cursor, 1);
    }
    resultado.push(semana);
  }
  return resultado;
}
