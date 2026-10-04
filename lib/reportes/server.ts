// Lectura (server-only) de los datos del reporte mensual. Recibe un cliente
// Supabase con service role: el llamador DEBE verificar antes que el usuario
// es admin (ver app/api/admin/reporte-mensual/route.ts). Se usa service role
// porque el reporte cruza tablas de todos los usuarios (series_ejercicios
// incluida) y no debe depender de que cada política RLS de admin exista.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getHoyColombia } from "@/lib/utils/fecha";
import { construirReporteMensual, rangoMes } from "@/lib/reportes/mensual";
import type {
  RegistroPrevioReporte,
  RegistroReporte,
  ReporteMensual,
  UsuarioReporte,
} from "@/lib/reportes/mensual";

/** PostgREST de Supabase devuelve como máximo 1000 filas por petición. */
const TAMANO_PAGINA = 1000;

interface RespuestaPagina<T> {
  data: T[] | null;
  error: { message: string } | null;
}

async function leerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<RespuestaPagina<T>>
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await pagina(desde, desde + TAMANO_PAGINA - 1);
    if (error) throw new Error(error.message);
    filas.push(...(data ?? []));
    if (!data || data.length < TAMANO_PAGINA) return filas;
  }
}

/** Supabase puede tipar una relación many-to-one como objeto o arreglo. */
function primero<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

interface FilaRegistroMes {
  id: string;
  user_id: string;
  ejercicio_id: string;
  fecha_completado: string;
  tiempo_descanso_minutos: number;
  ejercicios:
    | { nombre: string; grupo_muscular: string }
    | { nombre: string; grupo_muscular: string }[]
    | null;
  series_ejercicios: { serie_numero: number; peso_kg: number; repeticiones: number }[] | null;
}

interface FilaRegistroPrevio {
  user_id: string;
  ejercicio_id: string;
  fecha_completado: string;
  series_ejercicios: { peso_kg: number }[] | null;
}

export interface OpcionesReporte {
  incluirDesactivados: boolean;
}

/**
 * Lee profiles + membresías + historial (del mes y anterior) y construye
 * el reporte mensual completo.
 */
export async function obtenerReporteMensual(
  supabaseAdmin: SupabaseClient<Database>,
  mes: string,
  opciones: OpcionesReporte
): Promise<ReporteMensual> {
  const rango = rangoMes(mes);

  const [usuarios, registrosMes, registrosPrevios] = await Promise.all([
    leerTodo<UsuarioReporte>((desde, hasta) => {
      let consulta = supabaseAdmin
        .from("profiles")
        .select(
          "id, nombre, apellido, email, telefono, genero, fecha_nacimiento, activo, created_at, membresias(id, created_at, tipo_plan, fecha_inicio, fecha_fin, estado, monto_pagado)"
        )
        .eq("rol", "usuario");
      if (!opciones.incluirDesactivados) consulta = consulta.eq("activo", true);
      return consulta
        .order("created_at")
        .order("id")
        .range(desde, hasta)
        .overrideTypes<UsuarioReporte[], { merge: false }>();
    }),
    leerTodo<FilaRegistroMes>((desde, hasta) =>
      supabaseAdmin
        .from("historial_ejercicios")
        .select(
          "id, user_id, ejercicio_id, fecha_completado, tiempo_descanso_minutos, ejercicios(nombre, grupo_muscular), series_ejercicios(serie_numero, peso_kg, repeticiones)"
        )
        .gte("fecha_completado", rango.inicioUtcIso)
        .lt("fecha_completado", rango.finUtcIso)
        .order("fecha_completado")
        .order("id")
        .range(desde, hasta)
        .overrideTypes<FilaRegistroMes[], { merge: false }>()
    ),
    leerTodo<FilaRegistroPrevio>((desde, hasta) =>
      supabaseAdmin
        .from("historial_ejercicios")
        .select("user_id, ejercicio_id, fecha_completado, series_ejercicios(peso_kg)")
        .lt("fecha_completado", rango.inicioUtcIso)
        .order("fecha_completado")
        .order("id")
        .range(desde, hasta)
        .overrideTypes<FilaRegistroPrevio[], { merge: false }>()
    ),
  ]);

  const registrosMesNormalizados: RegistroReporte[] = registrosMes.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    ejercicio_id: r.ejercicio_id,
    fecha_completado: r.fecha_completado,
    tiempo_descanso_minutos: Number(r.tiempo_descanso_minutos) || 0,
    ejercicio: primero(r.ejercicios),
    series: (r.series_ejercicios ?? []).map((s) => ({
      serie_numero: s.serie_numero,
      peso_kg: Number(s.peso_kg) || 0,
      repeticiones: Number(s.repeticiones) || 0,
    })),
  }));

  const registrosPreviosNormalizados: RegistroPrevioReporte[] = registrosPrevios.map((r) => ({
    user_id: r.user_id,
    ejercicio_id: r.ejercicio_id,
    fecha_completado: r.fecha_completado,
    peso_max: (r.series_ejercicios ?? []).reduce(
      (max, s) => Math.max(max, Number(s.peso_kg) || 0),
      0
    ),
  }));

  return construirReporteMensual({
    mes,
    hoy: getHoyColombia(),
    usuarios: usuarios.map((u) => ({ ...u, membresias: u.membresias ?? [] })),
    registrosMes: registrosMesNormalizados,
    registrosPrevios: registrosPreviosNormalizados,
  });
}
