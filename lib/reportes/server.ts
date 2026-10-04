// Lectura (server-only) de los datos del reporte mensual. Recibe un cliente
// Supabase con service role: el llamador DEBE verificar antes que el usuario
// es admin (ver app/api/admin/reporte-mensual/route.ts). Se usa service role
// porque el reporte cruza tablas de todos los usuarios (series_ejercicios
// incluida) y no debe depender de que cada política RLS de admin exista.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getHoyColombia } from "@/lib/utils/fecha";
import { leerTodo, primero } from "@/lib/supabase/paginacion";
import { construirReporteMensual, rangoMes } from "@/lib/reportes/mensual";
import { construirTendencia, mesesHasta, type PuntoTendencia } from "@/lib/reportes/tendencia";
import type {
  RegistroPrevioReporte,
  RegistroReporte,
  ReporteMensual,
  UsuarioReporte,
} from "@/lib/reportes/mensual";

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

/**
 * Tendencia de los `cantidad` meses que terminan en `mes`: registros y
 * usuarios nuevos por conteo (head) en paralelo, membresías leídas una vez.
 */
export async function obtenerTendencia(
  supabaseAdmin: SupabaseClient<Database>,
  mes: string,
  cantidad = 6
): Promise<PuntoTendencia[]> {
  const meses = mesesHasta(mes, cantidad);
  const desde = rangoMes(meses[0]).inicioUtcIso;
  const hasta = rangoMes(meses[meses.length - 1]).finUtcIso;

  const contar = async (
    consulta: PromiseLike<{ count: number | null; error: { message: string } | null }>
  ) => {
    const { count, error } = await consulta;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };

  const [conteos, membresias] = await Promise.all([
    Promise.all(
      meses.map(async (m) => {
        const rango = rangoMes(m);
        const [registros, usuariosNuevos] = await Promise.all([
          contar(
            supabaseAdmin
              .from("historial_ejercicios")
              .select("id", { count: "exact", head: true })
              .gte("fecha_completado", rango.inicioUtcIso)
              .lt("fecha_completado", rango.finUtcIso)
          ),
          contar(
            supabaseAdmin
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("rol", "usuario")
              .gte("created_at", rango.inicioUtcIso)
              .lt("created_at", rango.finUtcIso)
          ),
        ]);
        return { mes: m, registros, usuariosNuevos };
      })
    ),
    leerTodo<{ created_at: string; monto_pagado: number | null }>((desdeFila, hastaFila) =>
      supabaseAdmin
        .from("membresias")
        .select("created_at, monto_pagado")
        .gte("created_at", desde)
        .lt("created_at", hasta)
        .order("created_at")
        .order("id")
        .range(desdeFila, hastaFila)
    ),
  ]);

  return construirTendencia({
    meses,
    mesActual: getHoyColombia().slice(0, 7),
    registrosPorMes: Object.fromEntries(conteos.map((c) => [c.mes, c.registros])),
    usuariosNuevosPorMes: Object.fromEntries(conteos.map((c) => [c.mes, c.usuariosNuevos])),
    membresias,
  });
}
