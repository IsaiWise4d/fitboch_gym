// Núcleo de lógica de racha (streak). Funciones PURAS, sin dependencias
// de Supabase ni del entorno, para poder testearlas aisladas.
//
// REGLAS DE NEGOCIO (implementación):
// - Días exigibles: lun-sáb (getDay 1..6). Domingo (0) no cuenta: el
//   gimnasio no abre.
// - Zona horaria: America/Bogota (UTC-5). Todas las fechas de entrada
//   son "YYYY-MM-DD" en Bogotá o timestamps UTC convertidos a día Bogotá
//   por el llamador (ver lib/racha/bogota.ts).
// - Activación: el primer ejercicio de un día exigible no previamente
//   activado incrementa currentCount en 1.
// - Tolerancia 1 día: faltar 1 día exigible no rompe la racha (queda
//   "congelada", sin incrementar).
// - Reset a 0: 2 días exigibles fallados de forma CONSECUTIVA sin que un
//   domingo medie entre ambos → currentCount = 0.
// - Regla del domingo: el contador de fallados consecutivos se reinicia
//   cada domingo (el domingo "interrumpe" la cadena de fallos). Si el
//   usuario falla sábado y luego lunes (con domingo en medio), NO se
//   consideran 2 fallos consecutivos. Regla confirmada por Adriel.
// - Fecha de corte: la racha solo considera ejercicios con
//   fecha_completado >= FECHA_INICIO_RACHA (Bogotá). Los ejercicios
//   anteriores se ignoran para la racha pero se conservan en
//   historial_ejercicios para PRs e historial.

import type { EstadoRacha } from "./types";
import {
  diaSemanaBogota,
  fechaAString,
  hoyBogotaString,
  stringAFecha,
  sumarDias,
} from "./bogota";

/** Domingo = 0 en getUTCDay. */
export const DOMINGO = 0;

/**
 * Fecha de corte (Bogotá, "YYYY-MM-DD") desde cuando la racha empieza a
 * contar para TODOS los usuarios. Ejercicios con fecha_completado anterior
 * a esta fecha son ignorados por el cálculo de racha (no se borran: siguen
 * disponibles para PRs e historial de ejercicios).
 *
 * El filtrado real ocurre en lib/racha/server.ts (leerFechasEjercicio),
 * que acota la consulta a Supabase con gte(fecha_completado, corte).
 * La lógica pura de este archivo recibe el Set ya filtrado.
 */
export const FECHA_INICIO_RACHA = "2026-08-18";

/** Máximo de días hacia atrás que recorre el cálculo (salvaguarda). */
const MAX_DIAS_BACK = 400;

/**
 * true si el día (medianoche Bogotá) es exigible: lun-sáb.
 */
export function esDiaExigible(fecha: Date): boolean {
  return diaSemanaBogota(fecha) !== DOMINGO;
}

/**
 * Construye el set de días activados (en Bogotá) a partir de una lista de
 * timestamps UTC de `historial_ejercicios.fecha_completado`.
 *
 * Se agrupa por día calendario Bogotá: si hay ≥1 ejercicio ese día, el día
 * cuenta como activado. No filtra por exigibilidad aquí (lo decide el
 * cálculo de la racha); incluir domingos es inofensivo porque la racha los
 * ignora.
 */
export function construirCalendarioActivaciones(
  fechasCompletadoUtc: string[]
): Set<string> {
  const set = new Set<string>();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (const iso of fechasCompletadoUtc) {
    if (!iso) continue;
    set.add(fmt.format(new Date(iso)));
  }
  return set;
}

/**
 * REGLA DEL DOMINGO — función aislada para facilidad de ajuste.
 *
 * Determina si la racha debe resetearse a 0 dado el número actual de días
 * exigibles fallados de forma consecutiva (sin ejercicio) DENTRO de la
 * misma semana laboral (lun-sáb).
 *
 * Interpretación confirmada por Adriel:
 *   La racha SOLO se resetea si se acumulan 2 fallos exigibles consecutivos
 *   dentro de la MISMA semana laboral (lun-sáb) sin que un domingo se
 *   interponga. Si un domingo se interpone, el llamador (`calcularRacha`)
 *   ya reinició el contador de fallos a 0 al cruzar el domingo, por lo que
 *   los fallos posteriores pertenecen a una nueva semana y solo se resetea
 *   si acumulan 2 nuevamente.
 *
 *   Por ejemplo: fallar sábado y luego el lunes siguiente NO rompe la
 *   racha, porque el domingo queda entre ambos.
 */
export function shouldResetStreak(consecutiveMissed: number): boolean {
  return consecutiveMissed >= 2;
}

/**
 * Estado de avance mientras se recorre la racha hacia atrás.
 */
interface WalkState {
  count: number;
  consecutiveMissed: number;
  lastActivatedDate: string | null;
  rota: boolean;
  /**
   * Fallos exigibles contados en el mismo " bloque semanal" que HOY
   * (desde el último domingo excluido hacia hoy excluido).
   * Solo se cuentan mientras no hayamos cruzado un domingo desde hoy.
   * Sirven para evaluar `enRiesgo` (1 fallo en la misma semana laboral que
   * hoy + hoy todavía pendiente → si falla hoy rompe la racha).
   */
  fallosBloqueHoy: number;
}

/**
 * Calcula el estado de la racha al vuelo (lazy evaluation) a partir de los
 * días activados y la fecha "hoy" de Bogotá.
 *
 * Camina desde hoy hacia atrás, día por día, en zona Bogotá:
 *   - domingo  → resetea consecutiveMissed a 0 (regla del domingo) y cierra
 *     el "bloque semanal de hoy" (a partir de aquí los fallos ya no cuentan
 *     para el riesgo de esta semana).
 *   - exigible activado  → count++, consecutiveMissed=0, registra último.
 *   - exigible no activado:
 *       * si es HOY y hoy no exigible-activado → todayPending (no fallo).
 *       * si es día pasado → consecutiveMissed++; si está en el bloque
 *         semanal de hoy → fallosBloqueHoy++; si shouldResetStreak()
 *         → se rompe la racha y se corta el cálculo.
 *
 * @param activados    set de "YYYY-MM-DD" Bogotá con ejercicio.
 * @param hoyStrOpt    "YYYY-MM-DD" Bogotá de hoy (por defecto hoy real).
 */
export function calcularRacha(
  activados: Set<string>,
  hoyStrOpt?: string
): EstadoRacha {
  const hoyStr = hoyStrOpt ?? hoyBogotaString();
  const hoy = stringAFecha(hoyStr);

  const state: WalkState = {
    count: 0,
    consecutiveMissed: 0,
    lastActivatedDate: null,
    rota: false,
    fallosBloqueHoy: 0,
  };

  let todayPending = false;
  let enTramoSemanaDeHoy = true; // mientras no crucemos un domingo desde hoy

  let cursor = hoy;
  for (let i = 0; i < MAX_DIAS_BACK; i++) {
    const dow = diaSemanaBogota(cursor);
    const dateStr = fechaAString(cursor);
    const esHoy = dateStr === hoyStr;

    if (dow === DOMINGO) {
      // Regla del domingo: el contador de fallos consecutivos se reinicia,
      // y a partir de aquí ya no estamos en el bloque semanal de hoy.
      state.consecutiveMissed = 0;
      enTramoSemanaDeHoy = false;
      cursor = sumarDias(cursor, -1);
      continue;
    }

    if (activados.has(dateStr)) {
      state.count += 1;
      state.consecutiveMissed = 0;
      if (state.lastActivatedDate === null) {
        state.lastActivatedDate = dateStr;
      }
    } else if (esHoy) {
      // Hoy aún no se registró ejercicio pero el día no terminó:
      // no es un fallo todavía.
      todayPending = true;
    } else {
      state.consecutiveMissed += 1;
      if (enTramoSemanaDeHoy) {
        state.fallosBloqueHoy += 1;
      }
      if (shouldResetStreak(state.consecutiveMissed)) {
        // La racha se rompe ANTES de este día fallado. Lo acumulado en
        // `count` corresponde a los días activados posteriores a la ruptura.
        // `rota` solo fica true si la ruptura alcanza hasta hoy sin que
        // haya una sub-racha vigente con días activados.
        state.rota = state.count === 0;
        return buildEstado(state, hoyStr, todayPending);
      }
    }

    cursor = sumarDias(cursor, -1);
  }

  // No se rompió en MAX_DIAS_BACK días (usuario muy constante o sin datos).
  state.rota = false;
  return buildEstado(state, hoyStr, todayPending);
}

function buildEstado(
  state: WalkState,
  hoyStr: string,
  todayPending: boolean
): EstadoRacha {
  const hoyActivado = state.lastActivatedDate === hoyStr;
  const esDomingoHoy = diaSemanaBogota(stringAFecha(hoyStr)) === DOMINGO;

  // "En riesgo": HOY es exigible y todavía no se registró ejercicio, hay al
  // menos 1 día exigible fallado en el MISMO bloque semanal que hoy (sin
  // que un domingo se interponga), y existe una racha viva (count > 0).
  // Si el usuario faltara hoy, los 2 fallos estarían en la misma semana
  // laboral → reset a 0.
  const enRiesgo =
    todayPending && state.fallosBloqueHoy >= 1 && state.count > 0;

  return {
    currentCount: state.count,
    lastActivatedDate: state.lastActivatedDate,
    diasFalladosConsecutivos: state.consecutiveMissed,
    hoyActivado,
    esDomingo: esDomingoHoy,
    enRiesgo,
    rota: state.rota,
  };
}

/**
 * Mejor racha (pico) histórica calculada a partir de la lista completa de
 * días activados (en Bogotá). Útil para la sección /racha.
 *
 * Recorre las fechas activadas ordenadas asc, contando con la misma regla
 * de tolerancia (1 fallo tolerado, 2 rompen) y devolviendo el máximo
 * `currentCount` alcanzado en cualquier momento.
 */
export function calcularMejorRacha(activados: Set<string>): number {
  if (activados.size === 0) return 0;
  const fechas = Array.from(activados).sort();
  const primera = stringAFecha(fechas[0]);
  const ultima = stringAFecha(fechas[fechas.length - 1]);

  let mejor = 0;
  let count = 0;
  let consecutiveMissed = 0;

  let cursor = primera;
  const limite = sumarDias(ultima, 1);
  let guardias = 0;
  while (cursor.getTime() <= limite.getTime() && guardias < MAX_DIAS_BACK * 2) {
    guardias++;
    const dow = diaSemanaBogota(cursor);
    const dateStr = fechaAString(cursor);
    if (dow === DOMINGO) {
      consecutiveMissed = 0;
    } else if (activados.has(dateStr)) {
      count += 1;
      consecutiveMissed = 0;
      if (count > mejor) mejor = count;
    } else {
      consecutiveMissed += 1;
      if (shouldResetStreak(consecutiveMissed)) {
        count = 0;
        consecutiveMissed = 0;
      }
    }
    cursor = sumarDias(cursor, 1);
  }
  return mejor;
}

/**
 * Lista de días exigibles (lun-sáb) entre dos fechas Bogotá inclusive.
 */
export function diasExigiblesEntre(inicio: Date, fin: Date): Date[] {
  const out: Date[] = [];
  let c = inicio;
  let guardias = 0;
  while (c.getTime() <= fin.getTime() && guardias < 400) {
    guardias++;
    if (esDiaExigible(c)) out.push(c);
    c = sumarDias(c, 1);
  }
  return out;
}

export { fechaAString, stringAFecha, sumarDias };
