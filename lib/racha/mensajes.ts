// Textos de estado de la racha compartidos entre el widget del dashboard y la
// sección /racha. Puro: sin Supabase ni APIs del navegador.

import type { EstadoRacha } from "./types";

/** Frase corta que acompaña al contador de racha. */
export function mensajeRacha(estado: EstadoRacha): string {
  if (estado.esDomingo) return "Hoy es descanso (fin de semana); tu racha descansa";
  if (estado.currentCount === 0) return "Registra hoy para empezar tu racha";
  if (estado.hoyActivado) return "¡Racha activa hoy! Vuelve mañana";
  return "Entrena hoy para sumar un día más";
}
