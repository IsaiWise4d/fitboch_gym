// Utilidades de zona horaria para la racha.
// Todos los cálculos de "día" se hacen en America/Bogota (UTC-5),
// NUNCA en UTC ni en la hora del navegador del usuario.

const TZ_BOGOTA = "America/Bogota";

/**
 * Devuelve un objeto Date cuya representación UTC corresponde a la
 * medianoche (00:00:00) del día calendario Bogotá de la fecha dada.
 * Útil para comparar "días Bogotá" sin lidiar con offsets manuales.
 */
export function medianocheBogotaDeUtc(isoUtc: string): Date {
  // Extrae componentes del día en tz Bogotá usando Intl.DateTimeFormat.
  const dt = new Date(isoUtc);
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);

  const get = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "0";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  // Bogotá es UTC-5: medianoche Bogotá = 05:00Z de ese mismo día calendario.
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}

/**
 * Devuelve el día calendario Bogotá de un timestamp UTC como string "YYYY-MM-DD".
 */
export function diaBogotaString(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoUtc));
}

/**
 * Devuelve la fecha actual como medianoche Bogotá del "hoy" (Date en UTC).
 */
export function hoyMedianocheBogota(): Date {
  // new Date() en el servidor Next.js (edge/node) es UTC; usamos Intl para el día Bogotá.
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "0";
  return new Date(
    Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      5,
      0,
      0,
      0
    )
  );
}

/**
 * Devuelve el "hoy" como string "YYYY-MM-DD" en Bogotá.
 * (Atajo equivalente a lib/utils/fecha.ts getHoyColombia pero aislado en este módulo.)
 */
export function hoyBogotaString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Suma/resta días calendario a una Date que representa medianoche Bogotá (UTC).
 * Como las medianoches Bogotá están a 05:00Z y sumamos exactamente 24h,
 * el resultado sigue siendo el mismo offset (05:00Z del día destino).
 */
export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
}

/**
 * Devuelve el día de la semana (0=domingo ... 6=sábado) de una fecha
 * que representa medianoche Bogotá.
 */
export function diaSemanaBogota(fecha: Date): number {
  // Las medianoches Bogotá están a 05:00Z, así que getUTCDate/getUTCDay
  // coinciden con el día calendario Bogotá (sin cambio de día por el offset).
  return fecha.getUTCDay();
}

/**
 * Formatea una medianoche Bogotá como "YYYY-MM-DD".
 */
export function fechaAString(fecha: Date): string {
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string "YYYY-MM-DD" (Bogotá) a su medianoche Bogotá (Date en UTC).
 */
export function stringAFecha(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
}

export { TZ_BOGOTA };