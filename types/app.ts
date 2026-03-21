import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Membresia = Database["public"]["Tables"]["membresias"]["Row"];
export type Rutina = Database["public"]["Tables"]["rutinas"]["Row"];
export type Ejercicio = Database["public"]["Tables"]["ejercicios"]["Row"];
export type PlanNutricional = Database["public"]["Tables"]["planes_nutricionales"]["Row"];

export type UserRole = "usuario" | "admin";

export type EstadoMembresia = "activa" | "por_vencer" | "vencida" | "sin_membresia";
