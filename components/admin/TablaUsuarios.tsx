"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import type { Profile, Membresia } from "@/types/app";
import { isBefore, addDays, parseISO, startOfDay } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { calcularEdad } from "@/lib/utils/fecha";

type UsuarioConMembresia = Profile & {
  membresias: Membresia[];
};

type EstadoClave = "activa" | "por_vencer" | "vencida" | "sin_membresia" | "desactivado";

type UsuarioConMeta = {
  usuario: UsuarioConMembresia;
  membresia: Membresia | null;
  estadoClave: EstadoClave;
  estado: {
    label: string;
    color: string;
  };
  fechaFinMs: number | null;
};

type Filtro = "todos" | "activos" | "por_vencer" | "vencidos" | "sin_membresia" | "desactivados";

const ESTADO_META: Record<EstadoClave, { label: string; color: string }> = {
  activa: { label: "Activa", color: "text-success" },
  por_vencer: { label: "Por vencer", color: "text-warning" },
  vencida: { label: "Vencida", color: "text-error" },
  sin_membresia: { label: "Sin membresía", color: "text-muted-foreground" },
  desactivado: { label: "Desactivado", color: "text-error" },
};

const ORDEN_ESTADO_TODOS: Record<EstadoClave, number> = {
  por_vencer: 0,
  activa: 1,
  vencida: 2,
  sin_membresia: 3,
  desactivado: 4,
};

function getMembresiaActiva(membresias: Membresia[]): Membresia | null {
  return (
    membresias
      .filter((m) => m.estado === "activa")
      .sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin))[0] ?? null
  );
}

function getEstadoMembresia(membresia: Membresia | null): EstadoClave {
  if (!membresia) return "sin_membresia";
  const hoy = startOfDay(new Date());
  const fin = startOfDay(parseISO(membresia.fecha_fin));
  if (isBefore(fin, hoy)) return "vencida";
  if (isBefore(fin, addDays(hoy, 7))) return "por_vencer";
  return "activa";
}

function getEstadoUsuario(usuario: UsuarioConMembresia, membresia: Membresia | null): EstadoClave {
  if (!usuario.activo) return "desactivado";
  return getEstadoMembresia(membresia);
}

function getFechaFinMs(membresia: Membresia | null): number | null {
  if (!membresia) return null;
  const fechaFin = parseISO(membresia.fecha_fin);
  if (Number.isNaN(fechaFin.getTime())) return null;
  return startOfDay(fechaFin).getTime();
}

function compararPorNombre(a: UsuarioConMeta, b: UsuarioConMeta): number {
  const nombreA = `${a.usuario.nombre} ${a.usuario.apellido || ""}`.trim();
  const nombreB = `${b.usuario.nombre} ${b.usuario.apellido || ""}`.trim();
  return nombreA.localeCompare(nombreB, "es", { sensitivity: "base" });
}

function compararFechaFinAsc(a: UsuarioConMeta, b: UsuarioConMeta): number {
  if (a.fechaFinMs === null && b.fechaFinMs === null) return 0;
  if (a.fechaFinMs === null) return 1;
  if (b.fechaFinMs === null) return -1;
  return a.fechaFinMs - b.fechaFinMs;
}

function compararFechaFinDesc(a: UsuarioConMeta, b: UsuarioConMeta): number {
  if (a.fechaFinMs === null && b.fechaFinMs === null) return 0;
  if (a.fechaFinMs === null) return 1;
  if (b.fechaFinMs === null) return -1;
  return b.fechaFinMs - a.fechaFinMs;
}

function compararUsuarios(a: UsuarioConMeta, b: UsuarioConMeta, filtro: Filtro): number {
  if (filtro === "por_vencer" || filtro === "activos") {
    return compararFechaFinAsc(a, b) || compararPorNombre(a, b);
  }

  if (filtro === "vencidos") {
    return compararFechaFinDesc(a, b) || compararPorNombre(a, b);
  }

  if (filtro === "sin_membresia" || filtro === "desactivados") {
    return compararPorNombre(a, b);
  }

  const prioridadA = ORDEN_ESTADO_TODOS[a.estadoClave];
  const prioridadB = ORDEN_ESTADO_TODOS[b.estadoClave];

  if (prioridadA !== prioridadB) {
    return prioridadA - prioridadB;
  }

  if (a.estadoClave === "por_vencer" || a.estadoClave === "activa") {
    return compararFechaFinAsc(a, b) || compararPorNombre(a, b);
  }

  if (a.estadoClave === "vencida") {
    return compararFechaFinDesc(a, b) || compararPorNombre(a, b);
  }

  return compararPorNombre(a, b);
}

function formatearMonto(monto: number | null): string {
  if (monto === null) return "No registrado";
  return `$${monto.toLocaleString("es-CO")}`;
}

export function TablaUsuarios({
  usuarios,
}: {
  usuarios: UsuarioConMembresia[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = useMemo(() => {
    let resultado: UsuarioConMeta[] = usuarios.map((usuario) => {
      const membresia = getMembresiaActiva(usuario.membresias);
      const estadoClave = getEstadoUsuario(usuario, membresia);
      return {
        usuario,
        membresia,
        estadoClave,
        estado: ESTADO_META[estadoClave],
        fechaFinMs: getFechaFinMs(membresia),
      };
    });

    // Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        ({ usuario }) =>
          usuario.nombre.toLowerCase().includes(q) ||
          (usuario.apellido?.toLowerCase().includes(q) ?? false) ||
          usuario.email.toLowerCase().includes(q)
      );
    }

    // Filtro por estado
    if (filtro !== "todos") {
      resultado = resultado.filter((item) => {
        switch (filtro) {
          case "activos":
            return item.estadoClave === "activa";
          case "por_vencer":
            return item.estadoClave === "por_vencer";
          case "vencidos":
            return item.estadoClave === "vencida";
          case "sin_membresia":
            return item.estadoClave === "sin_membresia";
          case "desactivados":
            return item.estadoClave === "desactivado";
          default:
            return true;
        }
      });
    }

    resultado.sort((a, b) => compararUsuarios(a, b, filtro));

    return resultado;
  }, [usuarios, busqueda, filtro]);

  const filtros: { value: Filtro; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activos", label: "Activos" },
    { value: "por_vencer", label: "Por vencer" },
    { value: "vencidos", label: "Vencidos" },
    { value: "sin_membresia", label: "Sin membresía" },
    { value: "desactivados", label: "Desactivados" },
  ];

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === f.value
                ? "bg-primary text-white"
                : "bg-surface text-muted-foreground hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <p className="text-xs text-muted-foreground">
        {filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}
      </p>

      {/* Lista */}
      <div className="rounded-lg border border-border bg-surface divide-y divide-border">
        {filtrados.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No se encontraron usuarios
          </p>
        ) : (
          filtrados.map(({ usuario, membresia, estado }) => {
            return (
              <Link
                key={usuario.id}
                href={`/admin/usuarios/${usuario.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {usuario.nombre} {usuario.apellido || ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {usuario.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Edad: {usuario.fecha_nacimiento ? `${calcularEdad(usuario.fecha_nacimiento)} años` : "No definida"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className={`text-xs font-medium ${estado.color}`}>
                      {estado.label}
                    </p>
                    {usuario.activo && membresia && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {membresia.tipo_plan} · {format(parseISO(membresia.fecha_fin), "d MMM", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Monto: {formatearMonto(membresia.monto_pagado)}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
