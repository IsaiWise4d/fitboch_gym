import type { EstadoUsuarioClave } from "@/lib/membresias/estado";

/**
 * Clases por estado de membresía. `marca` pinta datos (barras, puntos,
 * celdas) con los tokens --estado-*; `texto` usa los tokens de texto de
 * estado para que la etiqueta cumpla contraste.
 */
export const ESTILO_ESTADO: Record<EstadoUsuarioClave, { marca: string; texto: string; fondo: string }> = {
  activa: { marca: "bg-estado-activa", texto: "text-success", fondo: "bg-estado-activa/10" },
  por_vencer: { marca: "bg-estado-por-vencer", texto: "text-warning", fondo: "bg-estado-por-vencer/10" },
  vencida: { marca: "bg-estado-vencida", texto: "text-error", fondo: "bg-estado-vencida/10" },
  sin_membresia: { marca: "bg-estado-sin", texto: "text-muted-foreground", fondo: "bg-white/5" },
  desactivado: { marca: "bg-estado-desactivado", texto: "text-muted-foreground", fondo: "bg-white/5" },
};

/** Orden de lectura de los estados (de vigente a inactivo). */
export const ORDEN_ESTADOS: EstadoUsuarioClave[] = [
  "activa",
  "por_vencer",
  "vencida",
  "sin_membresia",
  "desactivado",
];
