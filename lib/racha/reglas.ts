// Núcleo de lógica de racha (streak). Funciones PURAS, sin dependencias
// de Supabase ni del entorno, para poder testearlas aisladas.
//
// REGLAS DE NEGOCIO (implementación):
// - Días exigibles: lun-vie (getDay 1..5). Sábado (6) y domingo (0) no
//   cuentan: son neutros (no suman, no restan y NO reinician los fallos).
// - Zona horaria: America/Bogota (UTC-5). Todas las fechas de entrada
//   son "YYYY-MM-DD" en Bogotá o timestamps UTC convertidos a día Bogotá
//   por el llamador (ver lib/racha/bogota.ts).
// - Activación: el primer ejercicio de un día exigible no previamente
//   activado incrementa currentCount en 1.
// - Protección de 2 días: faltar hasta 2 días exigibles seguidos no rompe
//   la racha (queda "congelada", sin incrementar).
// - Reset a 0: 3 días exigibles fallados de forma CONSECUTIVA (el fin de
//   semana en medio no interrumpe la cadena: jue+vie+lun fallados = 3).
// - Fecha de corte: la racha solo considera ejercicios con
//   fecha_completado >= FECHA_INICIO_RACHA (Bogotá). Los ejercicios
//   anteriores se ignoran para la racha pero se conservan en
//   historial_ejercicios para PRs e historial.

import type { DiaSemanaRacha, EstadoRacha } from "./types";
import {
  diaSemanaBogota,
  fechaAString,
  hoyBogotaString,
  stringAFecha,
  sumarDias,
} from "./bogota";

/** Domingo = 0 en getUTCDay. */
export const DOMINGO = 0;
/** Sábado = 6 en getUTCDay. */
export const SABADO = 6;
/** Días exigibles que se pueden fallar seguidos sin perder la racha. */
export const DIAS_PROTECCION = 2;

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
export const FECHA_INICIO_RACHA = "2026-08-23";

/** Máximo de días hacia atrás que recorre el cálculo (salvaguarda). */
const MAX_DIAS_BACK = 400;

/**
 * true si el día (medianoche Bogotá) es exigible: lun-vie.
 */
export function esDiaExigible(fecha: Date): boolean {
  const dow = diaSemanaBogota(fecha);
  return dow !== DOMINGO && dow !== SABADO;
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
 * Determina si la racha debe resetearse a 0 dado el número actual de días
 * exigibles (lun-vie) fallados de forma consecutiva. Se toleran
 * `DIAS_PROTECCION` (2); el tercero seguido reinicia. El fin de semana es
 * neutro: no reinicia el contador.
 */
export function shouldResetStreak(consecutiveMissed: number): boolean {
  return consecutiveMissed > DIAS_PROTECCION;
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
   * Fallos exigibles recientes: los vistos entre hoy y el último día
   * activado (mientras `count === 0`). Sirven para `enRiesgo` (ya se usaron
   * los 2 días de protección + hoy pendiente → si falla hoy se rompe).
   */
  fallosRecientes: number;
}

/**
 * Calcula el estado de la racha al vuelo (lazy evaluation) a partir de los
 * días activados y la fecha "hoy" de Bogotá.
 *
 * Camina desde hoy hacia atrás, día por día, en zona Bogotá:
 *   - sábado/domingo → neutros: se saltan sin tocar los contadores.
 *   - exigible activado  → count++, consecutiveMissed=0, registra último.
 *   - exigible no activado:
 *       * si es HOY y hoy no exigible-activado → todayPending (no fallo).
 *       * si es día pasado → consecutiveMissed++; si aún no hay días
 *         activados → fallosRecientes++; si shouldResetStreak()
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
    fallosRecientes: 0,
  };

  let todayPending = false;

  let cursor = hoy;
  for (let i = 0; i < MAX_DIAS_BACK; i++) {
    const dateStr = fechaAString(cursor);
    const esHoy = dateStr === hoyStr;

    if (!esDiaExigible(cursor)) {
      // Fin de semana: neutro, no toca ningún contador.
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
      if (state.count === 0) {
        state.fallosRecientes += 1;
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
  const esDescansoHoy = !esDiaExigible(stringAFecha(hoyStr));

  // "En riesgo": HOY es exigible y todavía no se registró ejercicio, ya se
  // gastaron los 2 días de protección (fallos recientes) y existe una racha
  // viva (count > 0). Si falla hoy sería el 3º seguido → reset a 0.
  const enRiesgo =
    todayPending &&
    state.fallosRecientes >= DIAS_PROTECCION &&
    state.count > 0;

  return {
    currentCount: state.count,
    lastActivatedDate: state.lastActivatedDate,
    diasFalladosConsecutivos: state.consecutiveMissed,
    hoyActivado,
    esDomingo: esDescansoHoy,
    enRiesgo,
    rota: state.rota,
  };
}

/**
 * Mejor racha (pico) histórica calculada a partir de la lista completa de
 * días activados (en Bogotá). Útil para la sección /racha.
 *
 * Recorre las fechas activadas ordenadas asc, contando con la misma regla
 * de tolerancia (2 fallos tolerados, 3 rompen) y devolviendo el máximo
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
    const dateStr = fechaAString(cursor);
    if (!esDiaExigible(cursor)) {
      // Fin de semana neutro.
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
 * Lista de días exigibles (lun-vie) entre dos fechas Bogotá inclusive.
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

const LETRAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Los 7 días (lunes a domingo, Bogotá) de la semana que contiene `hoyStr`,
 * marcando cuáles tuvieron ejercicio, cuál es hoy y cuáles faltan.
 */
export function semanaActual(activados: Set<string>, hoyStr: string): DiaSemanaRacha[] {
  const hoy = stringAFecha(hoyStr);
  const dow = diaSemanaBogota(hoy);
  const lunes = sumarDias(hoy, -(dow === DOMINGO ? 6 : dow - 1));
  return LETRAS_SEMANA.map((letra, i) => {
    const dia = sumarDias(lunes, i);
    const fecha = fechaAString(dia);
    return {
      fecha,
      dia: dia.getUTCDate(),
      letra,
      exigible: esDiaExigible(dia),
      activado: activados.has(fecha),
      esHoy: fecha === hoyStr,
      futuro: fecha > hoyStr,
    };
  });
}

export { fechaAString, stringAFecha, sumarDias };
