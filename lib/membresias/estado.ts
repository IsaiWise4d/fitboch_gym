// Estado de membresía: ÚNICA fuente de verdad para panel admin, reportes y
// vista del usuario. Funciones PURAS (sin Supabase ni reloj del sistema):
// `hoy` siempre llega como "YYYY-MM-DD" en America/Bogota (getHoyColombia
// en el servidor). Imports relativos para que vitest las resuelva.

export type EstadoMembresiaClave = "activa" | "por_vencer" | "vencida" | "sin_membresia";
export type EstadoUsuarioClave = EstadoMembresiaClave | "desactivado";

/** Días de anticipación para marcar una membresía "por vencer" (inclusive). */
export const DIAS_AVISO_VENCIMIENTO = 7;

export interface MembresiaBase {
  estado: string;
  fecha_fin: string;
}

export const ETIQUETA_ESTADO: Record<EstadoUsuarioClave, string> = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  sin_membresia: "Sin membresía",
  desactivado: "Desactivado",
};

const ETIQUETA_PLAN: Record<string, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export function etiquetaPlan(plan: string): string {
  return ETIQUETA_PLAN[plan] ?? plan;
}

function diaUtc(fecha: string): number {
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días calendario de `desde` a `hasta` ("YYYY-MM-DD"); negativo si `hasta` es anterior. */
export function diasEntreFechas(desde: string, hasta: string): number {
  return Math.round((diaUtc(hasta) - diaUtc(desde)) / 86_400_000);
}

/** Suma (o resta) días calendario a una fecha "YYYY-MM-DD". */
export function sumarDiasFecha(fecha: string, dias: number): string {
  return new Date(diaUtc(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Membresía "actual" del usuario: la fila con estado `activa` y la
 * `fecha_fin` más lejana. Puede estar vencida (fecha_fin < hoy) si nadie
 * la renovó: usar `esVigente` para saber si sigue en curso.
 */
export function membresiaActual<T extends MembresiaBase>(membresias: readonly T[]): T | null {
  let actual: T | null = null;
  for (const m of membresias) {
    if (m.estado !== "activa") continue;
    if (!actual || m.fecha_fin > actual.fecha_fin) actual = m;
  }
  return actual;
}

/** true si la membresía existe y su último día (fecha_fin) aún no pasó. */
export function esVigente(membresia: MembresiaBase | null, hoy: string): boolean {
  return membresia !== null && membresia.fecha_fin >= hoy;
}

/** Estado según la fecha fin: <0 días vencida, ≤7 por vencer, resto activa. */
export function estadoMembresia(
  fechaFin: string | null,
  hoy: string
): { clave: EstadoMembresiaClave; diasRestantes: number | null } {
  if (!fechaFin) return { clave: "sin_membresia", diasRestantes: null };
  const diasRestantes = diasEntreFechas(hoy, fechaFin);
  if (diasRestantes < 0) return { clave: "vencida", diasRestantes };
  if (diasRestantes <= DIAS_AVISO_VENCIMIENTO) return { clave: "por_vencer", diasRestantes };
  return { clave: "activa", diasRestantes };
}

/**
 * Estado de un usuario para el panel admin: `desactivado` tiene prioridad
 * sobre el estado de su membresía (que igualmente se devuelve).
 */
export function estadoUsuario<T extends MembresiaBase>(
  usuario: { activo: boolean; membresias: readonly T[] },
  hoy: string
): { clave: EstadoUsuarioClave; membresia: T | null; diasRestantes: number | null } {
  const membresia = membresiaActual(usuario.membresias);
  const { clave, diasRestantes } = estadoMembresia(membresia?.fecha_fin ?? null, hoy);
  return {
    clave: usuario.activo ? clave : "desactivado",
    membresia,
    diasRestantes,
  };
}

/** "Vence hoy", "Vence mañana", "Vence en 5 días", "Venció ayer", "Venció hace 3 días". */
export function textoVencimiento(diasRestantes: number): string {
  if (diasRestantes === 0) return "Vence hoy";
  if (diasRestantes === 1) return "Vence mañana";
  if (diasRestantes > 1) return `Vence en ${diasRestantes} días`;
  if (diasRestantes === -1) return "Venció ayer";
  return `Venció hace ${-diasRestantes} días`;
}
