// Tipos compartidos del panel admin (lectura en server.ts, cálculo puro en
// panel.ts / usuarios.ts / actividad.ts). Solo JSON plano: viajan como
// props de Server → Client Components.

export interface MembresiaAdmin {
  id: string;
  created_at: string;
  tipo_plan: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  monto_pagado: number | null;
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
  perfil_completo: boolean;
  created_at: string;
  membresias: MembresiaAdmin[];
}

/** Fila mínima de historial_ejercicios que necesita el panel. */
export interface RegistroEntreno {
  user_id: string;
  fecha_completado: string;
}

/** Un día (Bogotá) en que un usuario registró al menos un ejercicio. */
export interface DiaEntreno {
  userId: string;
  /** "YYYY-MM-DD" en Bogotá. */
  dia: string;
  /** Timestamp UTC del primer ejercicio del día (≈ hora de llegada). */
  primeraIso: string;
  /** Hora Bogotá (0-23) del primer ejercicio. */
  horaLlegada: number;
  ejercicios: number;
}

/** Registro de ejercicio para la ficha del usuario. */
export interface RegistroReciente {
  id: string;
  /** Timestamp UTC de fecha_completado. */
  fecha: string;
  ejercicio: string;
  grupo: string | null;
  series: number;
  repeticiones: number;
  pesoMaxKg: number | null;
  volumenKg: number;
}

export function nombreCompleto(usuario: { nombre: string; apellido: string | null }): string {
  return `${usuario.nombre} ${usuario.apellido ?? ""}`.trim();
}

/** "Ana María Pérez" → "AP". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] ?? "" : "";
  return (primera + ultima).toUpperCase();
}
