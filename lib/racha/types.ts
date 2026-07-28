// Tipos del módulo de racha (streak). No dependen de Supabase.

/**
 * Estado derivado de la racha de un usuario, calculado al vuelo
 * a partir de historial_ejercicios.
 */
export interface EstadoRacha {
  /** Número actual de días exigibles consecutivos con ejercicio. */
  currentCount: number;
  /** "YYYY-MM-DD" (Bogotá) del último día activado. */
  lastActivatedDate: string | null;
  /** Días exigibles fallados de forma consecutiva dentro de la misma semana laboral. */
  diasFalladosConsecutivos: number;
  /** true si el usuario ya registró ejercicio hoy (Bogotá). */
  hoyActivado: boolean;
  /** true si la racha está en riesgo (1 fallado + aún existe día exigible por venir). */
  enRiesgo: boolean;
  /** true si la racha está rota (currentCount === 0 por 2 fallados consecutivos). */
  rota: boolean;
}

/**
 * Un día del calendario mensual de la sección /racha.
 */
export interface CalendarioRachaDia {
  /** "YYYY-MM-DD" en zona horaria Bogotá. */
  fecha: string;
  /** Día del mes (1..31). */
  dia: number;
  /** true si es día exigible (lun-sáb). false si es domingo (descanso). */
  exigible: boolean;
  /** true si el usuario registró ejercicio ese día. */
  activado: boolean;
  /** true si es el día actual (Bogotá). */
  esHoy: boolean;
  /** true si es un día del mes adyacente (fuera del mes mostrado). */
  fueraDeMes: boolean;
}

export interface ResumenRacha {
  currentCount: number;
  mejorRacha: number;
  diasActivosMes: number;
}