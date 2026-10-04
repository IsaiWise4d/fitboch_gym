// Etiquetas legibles (con tildes) de valores guardados en la base de datos.

const DURACION_PLAN: Record<string, string> = {
  "3_meses": "3 meses",
  "6_meses": "6 meses",
  "12_meses": "12 meses",
};

// Objetivos de FormularioNutricion.
const OBJETIVO_NUTRICIONAL: Record<string, string> = {
  perdida_de_grasa: "Pérdida de grasa",
  hipertrofia: "Hipertrofia",
  recomposicion: "Recomposición corporal",
  fuerza_estetica: "Fuerza y estética",
  salud_general: "Salud general",
};

/** "3_meses" → "3 meses". */
export function etiquetaDuracionPlan(duracion: string): string {
  return DURACION_PLAN[duracion] ?? duracion.replace(/_/g, " ");
}

/** "perdida_de_grasa" → "Pérdida de grasa". */
export function etiquetaObjetivoNutricional(objetivo: string): string {
  return OBJETIVO_NUTRICIONAL[objetivo] ?? objetivo.replace(/_/g, " ");
}
