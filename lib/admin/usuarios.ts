// Filas de la lista de usuarios del panel admin: estado, racha, asistencia,
// filtros, orden y exportación CSV. PURO (ver usuarios.test.ts).

import {
  ETIQUETA_ESTADO,
  estadoUsuario,
  etiquetaPlan,
  type EstadoUsuarioClave,
} from "../membresias/estado";
import { normalizarTexto } from "../utils/texto";
import { agruparPorUsuario, diaBogota, metricasUsuario } from "./actividad";
import { nombreCompleto, type DiaEntreno, type UsuarioAdmin } from "./tipos";

export type FiltroEstado = "todos" | EstadoUsuarioClave;

export const FILTROS_ESTADO: FiltroEstado[] = [
  "todos",
  "activa",
  "por_vencer",
  "vencida",
  "sin_membresia",
  "desactivado",
];

export type EstadoRachaFila = "hoy" | "en_riesgo" | "rota" | "activa" | "sin";

export interface FilaUsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  fechaNacimiento: string | null;
  /** Día Bogotá de creación de la cuenta. */
  registro: string;
  perfilCompleto: boolean;
  estado: EstadoUsuarioClave;
  plan: string | null;
  fechaFin: string | null;
  diasRestantes: number | null;
  monto: number | null;
  racha: number;
  estadoRacha: EstadoRachaFila;
  ultimoEntreno: string | null;
  diasSinEntrenar: number | null;
  asistencia30: number | null;
  dias30: number;
}

export type CampoOrden =
  | "estado"
  | "nombre"
  | "vence"
  | "racha"
  | "ultimo"
  | "asistencia"
  | "monto"
  | "registro";

export interface Orden {
  campo: CampoOrden;
  dir: "asc" | "desc";
}

export const ORDEN_POR_DEFECTO: Orden = { campo: "estado", dir: "asc" };

/** Prioridad de la vista "Todos": primero lo que requiere acción. */
const PRIORIDAD_ESTADO: Record<EstadoUsuarioClave, number> = {
  por_vencer: 0,
  vencida: 1,
  activa: 2,
  sin_membresia: 3,
  desactivado: 4,
};

export function parsearFiltroEstado(valor: string | null | undefined): FiltroEstado {
  return FILTROS_ESTADO.includes(valor as FiltroEstado) ? (valor as FiltroEstado) : "todos";
}

const CAMPOS_ORDEN: CampoOrden[] = [
  "estado",
  "nombre",
  "vence",
  "racha",
  "ultimo",
  "asistencia",
  "monto",
  "registro",
];

export function parsearOrden(campo: string | null | undefined, dir: string | null | undefined): Orden {
  if (!CAMPOS_ORDEN.includes(campo as CampoOrden)) return ORDEN_POR_DEFECTO;
  return { campo: campo as CampoOrden, dir: dir === "desc" ? "desc" : "asc" };
}

export function construirFilasUsuarios(
  usuarios: readonly UsuarioAdmin[],
  dias: readonly DiaEntreno[],
  hoy: string
): FilaUsuarioAdmin[] {
  const diasPorUsuario = agruparPorUsuario(dias);
  return usuarios.map((u) => {
    const { clave, membresia, diasRestantes } = estadoUsuario(u, hoy);
    const m = metricasUsuario(diasPorUsuario.get(u.id) ?? [], hoy, { registro: u.created_at });
    const estadoRacha: EstadoRachaFila = m.racha.hoyActivado
      ? "hoy"
      : m.racha.enRiesgo
        ? "en_riesgo"
        : m.racha.rota
          ? "rota"
          : m.racha.currentCount > 0
            ? "activa"
            : "sin";
    return {
      id: u.id,
      nombre: nombreCompleto(u),
      email: u.email,
      telefono: u.telefono,
      fechaNacimiento: u.fecha_nacimiento,
      registro: diaBogota(u.created_at),
      perfilCompleto: u.perfil_completo,
      estado: clave,
      plan: membresia ? etiquetaPlan(membresia.tipo_plan) : null,
      fechaFin: membresia?.fecha_fin ?? null,
      diasRestantes,
      monto: membresia?.monto_pagado ?? null,
      racha: m.racha.currentCount,
      estadoRacha,
      ultimoEntreno: m.ultimoEntreno,
      diasSinEntrenar: m.diasSinEntrenar,
      asistencia30: m.asistencia30,
      dias30: m.dias30,
    };
  });
}

export function filtrarUsuarios(
  filas: readonly FilaUsuarioAdmin[],
  { estado, q }: { estado: FiltroEstado; q: string }
): FilaUsuarioAdmin[] {
  const consulta = normalizarTexto(q.trim());
  // Solo se busca por teléfono si la consulta trae al menos 3 dígitos.
  const digitos = consulta.replace(/\D/g, "");
  return filas.filter((f) => {
    if (estado !== "todos" && f.estado !== estado) return false;
    if (!consulta) return true;
    return (
      normalizarTexto(f.nombre).includes(consulta) ||
      normalizarTexto(f.email).includes(consulta) ||
      (digitos.length >= 3 && (f.telefono ?? "").replace(/\D/g, "").includes(digitos))
    );
  });
}

/** Compara con los nulos siempre al final, sin importar la dirección. */
function compararNulos<T>(
  a: T | null,
  b: T | null,
  comparar: (x: T, y: T) => number,
  dir: 1 | -1
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return comparar(a, b) * dir;
}

const porNumero = (x: number, y: number) => x - y;
const porTexto = (x: string, y: string) => x.localeCompare(y, "es", { sensitivity: "base" });

export function ordenarUsuarios(
  filas: readonly FilaUsuarioAdmin[],
  { campo, dir }: Orden
): FilaUsuarioAdmin[] {
  const signo = dir === "asc" ? 1 : -1;
  const porNombre = (a: FilaUsuarioAdmin, b: FilaUsuarioAdmin) => porTexto(a.nombre, b.nombre);

  const comparar = (a: FilaUsuarioAdmin, b: FilaUsuarioAdmin): number => {
    switch (campo) {
      case "nombre":
        return porTexto(a.nombre, b.nombre) * signo;
      case "vence":
        return compararNulos(a.fechaFin, b.fechaFin, porTexto, signo) || porNombre(a, b);
      case "racha":
        return (a.racha - b.racha) * signo || porNombre(a, b);
      case "ultimo":
        return compararNulos(a.ultimoEntreno, b.ultimoEntreno, porTexto, signo) || porNombre(a, b);
      case "asistencia":
        return compararNulos(a.asistencia30, b.asistencia30, porNumero, signo) || porNombre(a, b);
      case "monto":
        return compararNulos(a.monto, b.monto, porNumero, signo) || porNombre(a, b);
      case "registro":
        return porTexto(a.registro, b.registro) * signo || porNombre(a, b);
      case "estado":
      default: {
        const prioridad = (PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado]) * signo;
        if (prioridad !== 0) return prioridad;
        // Dentro del mismo estado: por vencer/activa → vence antes primero;
        // vencida → la más reciente primero.
        if (a.estado === "vencida") {
          return compararNulos(a.fechaFin, b.fechaFin, porTexto, -1) || porNombre(a, b);
        }
        if (a.estado === "por_vencer" || a.estado === "activa") {
          return compararNulos(a.fechaFin, b.fechaFin, porTexto, 1) || porNombre(a, b);
        }
        return porNombre(a, b);
      }
    }
  };

  return [...filas].sort(comparar);
}

export function contarPorEstado(filas: readonly FilaUsuarioAdmin[]): Record<FiltroEstado, number> {
  const conteo: Record<FiltroEstado, number> = {
    todos: filas.length,
    activa: 0,
    por_vencer: 0,
    vencida: 0,
    sin_membresia: 0,
    desactivado: 0,
  };
  for (const f of filas) conteo[f.estado] += 1;
  return conteo;
}

function celdaCsv(valor: string | number | null): string {
  if (valor === null) return "";
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * CSV con BOM y separador ";" para que Excel en español lo abra con
 * tildes y columnas correctas.
 */
export function filasACsv(filas: readonly FilaUsuarioAdmin[]): string {
  const encabezado = [
    "Nombre",
    "Email",
    "Teléfono",
    "Estado",
    "Plan",
    "Vence",
    "Monto",
    "Racha",
    "Último entreno",
    "Asistencia 30 días (%)",
    "Días entrenados (30)",
    "Registro",
  ];
  const lineas = filas.map((f) =>
    [
      f.nombre,
      f.email,
      f.telefono,
      ETIQUETA_ESTADO[f.estado],
      f.plan,
      f.fechaFin,
      f.monto,
      f.racha,
      f.ultimoEntreno,
      f.asistencia30 === null ? null : Math.round(f.asistencia30 * 100),
      f.dias30,
      f.registro,
    ]
      .map(celdaCsv)
      .join(";")
  );
  return `﻿${[encabezado.join(";"), ...lineas].join("\r\n")}`;
}
