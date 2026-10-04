// Lecturas (server-only) del panel admin con service role, siempre detrás
// de requireAdmin(). Cacheadas por request con React cache(): el layout
// (badge + buscador) y la página comparten la misma consulta.

import "server-only";

import { cache } from "react";

import { FECHA_INICIO_RACHA } from "@/lib/racha/reglas";
import { sumarDiasFecha } from "@/lib/membresias/estado";
import { leerTodo, leerTodoEnParalelo, primero } from "@/lib/supabase/paginacion";
import type { ClienteAdmin } from "@/lib/supabase/admin";
import { getHoyColombia } from "@/lib/utils/fecha";
import { agruparDiasEntreno } from "./actividad";
import { requireAdmin } from "./guard";
import { DIAS_ASISTENCIA_PANEL } from "./panel";
import type { DiaEntreno, RegistroEntreno, RegistroReciente, UsuarioAdmin } from "./tipos";

const COLUMNAS_USUARIO =
  "id, nombre, apellido, email, telefono, fecha_nacimiento, activo, perfil_completo, created_at, membresias(id, created_at, tipo_plan, fecha_inicio, fecha_fin, estado, monto_pagado)";

/** Todos los perfiles con rol usuario y sus membresías. */
export const obtenerUsuariosAdmin = cache(async (): Promise<UsuarioAdmin[]> => {
  const { cliente } = await requireAdmin();
  const filas = await leerTodo<UsuarioAdmin>((desde, hasta) =>
    cliente
      .from("profiles")
      .select(COLUMNAS_USUARIO)
      .eq("rol", "usuario")
      .order("created_at")
      .order("id")
      .range(desde, hasta)
      .overrideTypes<UsuarioAdmin[], { merge: false }>()
  );
  return filas.map((u) => ({
    ...u,
    membresias: (u.membresias ?? []).map((m) => ({
      ...m,
      monto_pagado: m.monto_pagado === null ? null : Number(m.monto_pagado),
    })),
  }));
});

/**
 * Primer día (Bogotá) de historial a leer: lo que necesita la serie de 90
 * días y la racha (desde FECHA_INICIO_RACHA, máx. 400 días atrás).
 */
export function inicioVentanaHistorial(hoy: string): string {
  const desdeSerie = sumarDiasFecha(hoy, -(DIAS_ASISTENCIA_PANEL - 1));
  const limiteRacha = sumarDiasFecha(hoy, -400);
  const desdeRacha = FECHA_INICIO_RACHA > limiteRacha ? FECHA_INICIO_RACHA : limiteRacha;
  return desdeSerie < desdeRacha ? desdeSerie : desdeRacha;
}

/** Días de entreno desde `desdeDia` (Bogotá), solo user_id + fecha. */
async function leerDiasEntreno(
  cliente: ClienteAdmin,
  desdeDia: string,
  userId?: string
): Promise<DiaEntreno[]> {
  // Medianoche Bogotá = 05:00Z del mismo día calendario.
  const desdeIso = `${desdeDia}T05:00:00.000Z`;
  const registros = await leerTodoEnParalelo<RegistroEntreno>((desde, hasta, conConteo) => {
    let consulta = cliente
      .from("historial_ejercicios")
      .select("user_id, fecha_completado", conConteo ? { count: "exact" } : undefined)
      .gte("fecha_completado", desdeIso);
    if (userId) consulta = consulta.eq("user_id", userId);
    return consulta.order("fecha_completado").order("id").range(desde, hasta);
  });
  return agruparDiasEntreno(registros);
}

export interface DatosBaseAdmin {
  hoy: string;
  usuarios: UsuarioAdmin[];
  dias: DiaEntreno[];
}

/** Usuarios + días de entreno de todos: base del dashboard y la lista. */
export const obtenerDatosBaseAdmin = cache(async (): Promise<DatosBaseAdmin> => {
  const { cliente } = await requireAdmin();
  const hoy = getHoyColombia();
  const [usuarios, dias] = await Promise.all([
    obtenerUsuariosAdmin(),
    leerDiasEntreno(cliente, inicioVentanaHistorial(hoy)),
  ]);
  return { hoy, usuarios, dias };
});

interface FilaRegistroReciente {
  id: string;
  fecha_completado: string;
  ejercicios: { nombre: string; grupo_muscular: string } | { nombre: string; grupo_muscular: string }[] | null;
  series_ejercicios: { peso_kg: number; repeticiones: number }[] | null;
}

export const SEMANAS_CALENDARIO_USUARIO = 16;

/**
 * Actividad de un usuario para su ficha: días de entreno (calendario de
 * 16 semanas + racha desde el corte) y sus últimos 10 registros.
 */
export async function obtenerActividadUsuario(
  userId: string,
  hoy: string
): Promise<{ dias: DiaEntreno[]; recientes: RegistroReciente[] }> {
  const { cliente } = await requireAdmin();
  const desdeCalendario = sumarDiasFecha(hoy, -(SEMANAS_CALENDARIO_USUARIO * 7 + 6));
  const desde = desdeCalendario < FECHA_INICIO_RACHA ? desdeCalendario : FECHA_INICIO_RACHA;

  const [dias, { data, error }] = await Promise.all([
    leerDiasEntreno(cliente, desde, userId),
    cliente
      .from("historial_ejercicios")
      .select("id, fecha_completado, ejercicios(nombre, grupo_muscular), series_ejercicios(peso_kg, repeticiones)")
      .eq("user_id", userId)
      .order("fecha_completado", { ascending: false })
      .limit(10)
      .overrideTypes<FilaRegistroReciente[], { merge: false }>(),
  ]);
  if (error) throw new Error(error.message);

  const recientes = (data ?? []).map((r) => {
    const series = r.series_ejercicios ?? [];
    const ejercicio = primero(r.ejercicios);
    const pesos = series.map((s) => Number(s.peso_kg) || 0);
    return {
      id: r.id,
      fecha: r.fecha_completado,
      ejercicio: ejercicio?.nombre ?? "Ejercicio",
      grupo: ejercicio?.grupo_muscular ?? null,
      series: series.length,
      repeticiones: series.reduce((t, s) => t + (Number(s.repeticiones) || 0), 0),
      pesoMaxKg: pesos.length > 0 ? Math.max(...pesos) : null,
      volumenKg: series.reduce(
        (t, s) => t + (Number(s.peso_kg) || 0) * (Number(s.repeticiones) || 0),
        0
      ),
    };
  });

  return { dias, recientes };
}

/** Registros por ejercicio en los últimos `dias` días (para la biblioteca). */
export async function obtenerUsoEjercicios(dias = 30): Promise<Record<string, number>> {
  const { cliente } = await requireAdmin();
  const desdeIso = `${sumarDiasFecha(getHoyColombia(), -(dias - 1))}T05:00:00.000Z`;
  const filas = await leerTodoEnParalelo<{ ejercicio_id: string }>((desde, hasta, conConteo) =>
    cliente
      .from("historial_ejercicios")
      .select("ejercicio_id", conConteo ? { count: "exact" } : undefined)
      .gte("fecha_completado", desdeIso)
      .order("fecha_completado")
      .order("id")
      .range(desde, hasta)
  );
  const uso: Record<string, number> = {};
  for (const f of filas) uso[f.ejercicio_id] = (uso[f.ejercicio_id] ?? 0) + 1;
  return uso;
}
