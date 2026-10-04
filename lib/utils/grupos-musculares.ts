// Nombres y orden de los grupos musculares (como se muestran en la app).

/** Orden habitual de los grupos en el gimnasio (los demás van al final). */
export const GRUPOS_MUSCULARES = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Glúteos",
  "Core",
  "Cardio",
];

/** Minúsculas y sin tildes, para comparar grupos guardados de forma distinta. */
export function claveGrupo(grupo: string): string {
  return grupo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** "biceps" / "Bíceps" → "Bíceps". */
export function etiquetaGrupo(grupo: string): string {
  const clave = claveGrupo(grupo);
  return (
    GRUPOS_MUSCULARES.find((g) => claveGrupo(g) === clave) ??
    grupo.charAt(0).toUpperCase() + grupo.slice(1)
  );
}

/** Posición del grupo en GRUPOS_MUSCULARES (desconocidos al final). */
export function ordenGrupo(grupo: string): number {
  const clave = claveGrupo(grupo);
  const indice = GRUPOS_MUSCULARES.findIndex((g) => claveGrupo(g) === clave);
  return indice === -1 ? GRUPOS_MUSCULARES.length : indice;
}
