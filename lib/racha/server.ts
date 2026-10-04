// Helpers de servidor (server-only) para obtener los datos de racha desde
// Supabase. No escriben nada: la racha se calcula al vuelo (lazy evaluation)
// a partir de historial_ejercicios.

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getHoyColombia, getRangoDiaColombiaUTC } from "@/lib/utils/fecha";
import {
  calcularRacha,
  calcularMejorRacha,
  construirCalendarioActivaciones,
  esDiaExigible,
  FECHA_INICIO_RACHA,
  semanaActual,
} from "./reglas";
import {
  diaSemanaBogota,
  fechaAString,
  stringAFecha,
  sumarDias,
  hoyBogotaString,
} from "./bogota";
import type {
  CalendarioRachaDia,
  EstadoRacha,
  InicioRacha,
  ResumenAdminRacha,
  ResumenRacha,
} from "./types";

const DIAS_HISTORIA_RACHA = 400; // Alineado con el máximo recorrido por la lógica.
const DIAS_HISTORIA_MEJOR = 800; // para la "mejor racha" histórica.

async function leerFechasEjercicio(
  userId: string,
  dias: number
): Promise<string[]> {
  const supabase = await createClient();
  // Filtro grueso: hace `dias` atrás (limite móvil original).
  const desdeLimiteMovil = new Date();
  desdeLimiteMovil.setUTCDate(desdeLimiteMovil.getUTCDate() - dias);
  // Fecha de corte de la racha (medianoche Bogotá = 05:00Z de esa fecha).
  // Ejercicios anteriores a esta fecha NO cuentan para la racha, aunque se
  // conservan en historial_ejercicios para PRs e historial.
  const desdeCorteRacha = new Date(`${FECHA_INICIO_RACHA}T05:00:00.000Z`);
  // Usar el más reciente de los dos: nunca consultar antes del corte.
  const desde =
    desdeCorteRacha.getTime() > desdeLimiteMovil.getTime()
      ? desdeCorteRacha
      : desdeLimiteMovil;
  const { data, error } = await supabase
    .from("historial_ejercicios")
    .select("fecha_completado")
    .eq("user_id", userId)
    .gte("fecha_completado", desde.toISOString())
    .order("fecha_completado", { ascending: false });
  if (error) {
    console.error("Error leyendo historial para racha:", error);
    return [];
  }
  return (data ?? [])
    .map((r: { fecha_completado?: string } | null) => r?.fecha_completado)
    .filter((s: string | undefined): s is string => Boolean(s));
}

/**
 * Estado de la racha del usuario para el widget del dashboard.
 * Idempotente: llamarla N veces no tiene efectos secundarios.
 */
export async function getEstadoRacha(userId: string): Promise<EstadoRacha> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_RACHA);
  const activados = construirCalendarioActivaciones(fechas);
  return calcularRacha(activados, getHoyColombia());
}

/**
 * Estado de la racha + semana actual para el dashboard, con una sola lectura
 * del historial.
 */
export async function getInicioRacha(userId: string): Promise<InicioRacha> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_RACHA);
  const activados = construirCalendarioActivaciones(fechas);
  const hoy = getHoyColombia();
  return {
    estado: calcularRacha(activados, hoy),
    semana: semanaActual(activados, hoy),
  };
}

/**
 * Estados de racha de VARIOS usuarios calculados en UNA sola consulta a
 * historial_ejercicios (mismo filtro de corte que leerFechasEjercicio).
 * Evita N consultas al renderizar la lista de usuarios del panel admin.
 *
 * Devuelve un mapa userId → EstadoRacha. Los usuarios sin historial obtienen
 * el estado por defecto (currentCount 0) en lugar de ausentarse del mapa,
 * para que el UI no tenga que tratar casos especiales.
 */
export async function getEstadosRachaUsuarios(
  userIds: string[]
): Promise<Record<string, EstadoRacha>> {
  if (userIds.length === 0) return {};

  const supabase = await createClient();
  const desdeLimiteMovil = new Date();
  desdeLimiteMovil.setUTCDate(desdeLimiteMovil.getUTCDate() - DIAS_HISTORIA_RACHA);
  const desdeCorteRacha = new Date(`${FECHA_INICIO_RACHA}T05:00:00.000Z`);
  const desde =
    desdeCorteRacha.getTime() > desdeLimiteMovil.getTime()
      ? desdeCorteRacha
      : desdeLimiteMovil;

  const { data, error } = await supabase
    .from("historial_ejercicios")
    .select("user_id, fecha_completado")
    .in("user_id", userIds)
    .gte("fecha_completado", desde.toISOString())
    .order("fecha_completado", { ascending: false });

  if (error) {
    console.error("Error leyendo historial multi-usuario para racha:", error);
    return {};
  }

  const fechasPorUsuario = new Map<string, string[]>();
  for (const r of data ?? []) {
    const fila = r as { user_id?: string; fecha_completado?: string };
    if (!fila.user_id || !fila.fecha_completado) continue;
    const lista = fechasPorUsuario.get(fila.user_id);
    if (lista) {
      lista.push(fila.fecha_completado);
    } else {
      fechasPorUsuario.set(fila.user_id, [fila.fecha_completado]);
    }
  }

  const hoy = getHoyColombia();
  const resultado: Record<string, EstadoRacha> = {};
  for (const uid of userIds) {
    const activados = construirCalendarioActivaciones(
      fechasPorUsuario.get(uid) ?? []
    );
    resultado[uid] = calcularRacha(activados, hoy);
  }
  return resultado;
}

/**
 * Resumen de racha para la vista de detalle del usuario en el panel admin:
 * estado actual + mejor racha histórica + días activos del mes en curso
 * (Bogotá), calculados en UNA sola consulta de historial.
 */
export async function getResumenAdminRacha(
  userId: string
): Promise<ResumenAdminRacha> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_MEJOR);
  const activados = construirCalendarioActivaciones(fechas);
  const hoyStr = getHoyColombia();
  const estado = calcularRacha(activados, hoyStr);
  const prefijo = hoyStr.slice(0, 7); // "YYYY-MM"
  const diasActivosMes = [...activados].filter(
    (fecha) => fecha.startsWith(prefijo) && esDiaExigible(stringAFecha(fecha))
  ).length;

  return {
    estado,
    mejorRacha: calcularMejorRacha(activados),
    diasActivosMes,
  };
}

/**
 * Resumen amplio para la sección /racha (racha actual + mejor racha +
 * días activos en el mes en curso).
 */
export async function getResumenRacha(
  userId: string,
  year: number,
  month: number // 1..12
): Promise<ResumenRacha> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_MEJOR);
  const activados = construirCalendarioActivaciones(fechas);
  const estado = calcularRacha(activados, getHoyColombia());
  const mejor = calcularMejorRacha(activados);

  const prefijo = `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}`;
  let diasActivosMes = 0;
  for (const f of activados) {
    if (f.startsWith(prefijo) && esDiaExigible(stringAFecha(f))) diasActivosMes += 1;
  }

  return {
    currentCount: estado.currentCount,
    mejorRacha: mejor,
    diasActivosMes,
  };
}

/**
 * Días del calendario mensual (con dato de activación) para pintar la
 * grilla de la sección /racha. Incluye días del mes adyacente para completar
 * la grilla (marcados `fueraDeMes`).
 *
 * La grilla empieza en lunes: domingo → columna 6, los demás getUTCDay-1.
 */
export async function getCalendarioMes(
  userId: string,
  year: number,
  month: number // 1..12
): Promise<CalendarioRachaDia[]> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_MEJOR);
  const activados = construirCalendarioActivaciones(fechas);
  const hoyStr = hoyBogotaString();

  const primero = new Date(Date.UTC(year, month - 1, 1, 5, 0, 0, 0));
  const d = diaSemanaBogota(primero);
  const columnaInicio = d === 0 ? 6 : d - 1;
  const inicioGrilla = sumarDias(primero, -columnaInicio);

  const dias: CalendarioRachaDia[] = [];
  let cursor = inicioGrilla;
  for (let i = 0; i < 42; i++) {
    const dateStr = fechaAString(cursor);
    const fueraDeMes =
      cursor.getUTCMonth() + 1 !== month || cursor.getUTCFullYear() !== year;
    const exigible = esDiaExigible(cursor);
    dias.push({
      fecha: dateStr,
      dia: cursor.getUTCDate(),
      exigible,
      activado: !fueraDeMes && exigible && activados.has(dateStr),
      esHoy: dateStr === hoyStr,
      fueraDeMes,
    });
    cursor = sumarDias(cursor, 1);
  }
  return dias;
}

/**
 * Carga en una sola consulta los datos de la página de racha. Evita que el
 * resumen y el calendario lean dos veces el mismo historial.
 */
export async function getDatosPaginaRacha(
  userId: string,
  year: number,
  month: number
): Promise<{ estado: EstadoRacha; resumen: ResumenRacha; dias: CalendarioRachaDia[] }> {
  const fechas = await leerFechasEjercicio(userId, DIAS_HISTORIA_MEJOR);
  const activados = construirCalendarioActivaciones(fechas);
  const estado = calcularRacha(activados, getHoyColombia());
  const prefijo = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  const diasActivosMes = [...activados].filter(
    (fecha) => fecha.startsWith(prefijo) && esDiaExigible(stringAFecha(fecha))
  ).length;

  const primero = new Date(Date.UTC(year, month - 1, 1, 5, 0, 0, 0));
  const diaInicio = diaSemanaBogota(primero);
  const columnaInicio = diaInicio === 0 ? 6 : diaInicio - 1;
  const inicioGrilla = sumarDias(primero, -columnaInicio);
  const hoyStr = hoyBogotaString();
  const dias: CalendarioRachaDia[] = [];
  let cursor = inicioGrilla;

  for (let i = 0; i < 42; i++) {
    const fecha = fechaAString(cursor);
    const fueraDeMes =
      cursor.getUTCMonth() + 1 !== month || cursor.getUTCFullYear() !== year;
    const exigible = esDiaExigible(cursor);
    dias.push({
      fecha,
      dia: cursor.getUTCDate(),
      exigible,
      activado: !fueraDeMes && exigible && activados.has(fecha),
      esHoy: fecha === hoyStr,
      fueraDeMes,
    });
    cursor = sumarDias(cursor, 1);
  }

  return {
    estado,
    resumen: {
      currentCount: estado.currentCount,
      mejorRacha: calcularMejorRacha(activados),
      diasActivosMes,
    },
    dias,
  };
}

/**
 * Cuenta cuántos ejercicios tiene el usuario registrados "hoy" (Bogotá),
 * opcionalmente excluyendo por id el registro recién insertado.
 *
 * Útil para saber si el registro nuevo es el primero del día (activador de
 * racha) o no. La exclusión por id es robusta y no depende de sincronía de
 * relojes entre cliente/servidor/BD.
 */
export async function contarEjerciciosHoy(
  userId: string,
  excluirId?: string
): Promise<number> {
  const supabase = await createClient();
  const { inicioUtcIso, finUtcIso } = getRangoDiaColombiaUTC();
  let query = supabase
    .from("historial_ejercicios")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("fecha_completado", inicioUtcIso)
    .lt("fecha_completado", finUtcIso);
  if (excluirId) {
    query = query.neq("id", excluirId);
  }
  const { count, error } = await query;
  if (error) {
    console.error("Error contando ejercicios de hoy:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * ¿El ejercicio recién guardado "activó" la racha hoy? Es decir:
 *   - es día exigible (lun-sáb), y
 *   - antes de este registro NO había ningún ejercicio hoy → éste es el 1º.
 *
 * `historialId` es el id (UUID) del registro recién insertado, para
 * excluirlo del recuento y no contar a sí mismo. Si no se pasa, se cuentan
 * todos los de hoy (útil en otros contextos).
 *
 * Devuelve `{ activada, estado }` para que el widget actualice y dispare
 * animación (la activación real de la racha no es destructiva: la sub-racha
 * subyacente ya se recalculó leyendo el historial completo).
 */
export async function evaluarActivacionRacha(
  userId: string,
  historialId?: string
): Promise<{ activada: boolean; estado: EstadoRacha }> {
  const hoyStr = getHoyColombia();
  const hoyDate = stringAFecha(hoyStr);
  const exigible = esDiaExigible(hoyDate);

  const anteriores = await contarEjerciciosHoy(userId, historialId);
  const activada = exigible && anteriores === 0;

  const estado = await getEstadoRacha(userId);
  return { activada, estado };
}
