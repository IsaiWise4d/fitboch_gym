// Iconos de respaldo (cuando un ejercicio o calentamiento no tiene media).
// Se identifican con una clave de texto porque un componente de icono (una
// función) no se puede pasar de un Server Component a un Client Component.

import { BicepsFlexed, Dumbbell, Flame, Footprints, HeartPulse, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconoRespaldo = "pesa" | "brazo" | "piernas" | "core" | "cardio" | "calentamiento";

export const ICONOS_RESPALDO: Record<IconoRespaldo, LucideIcon> = {
  pesa: Dumbbell,
  brazo: BicepsFlexed,
  piernas: Footprints,
  core: Target,
  cardio: HeartPulse,
  calentamiento: Flame,
};

const POR_GRUPO: Record<string, IconoRespaldo> = {
  bíceps: "brazo",
  tríceps: "brazo",
  piernas: "piernas",
  core: "core",
  cardio: "cardio",
};

export function iconoDeGrupo(grupoMuscular: string): IconoRespaldo {
  return POR_GRUPO[grupoMuscular.toLowerCase()] ?? "pesa";
}

export function iconoDeCategoriaCalentamiento(categoria: string): IconoRespaldo {
  if (categoria === "tren_superior") return "brazo";
  if (categoria === "tren_inferior") return "piernas";
  return "calentamiento";
}
