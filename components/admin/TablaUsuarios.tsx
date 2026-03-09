"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import type { Profile, Membresia } from "@/types/app";
import { isBefore, addDays, parseISO, startOfDay } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type UsuarioConMembresia = Profile & {
  membresias: Membresia[];
};

type Filtro = "todos" | "activos" | "por_vencer" | "vencidos" | "sin_membresia";

function getMembresiaActiva(membresias: Membresia[]): Membresia | null {
  return (
    membresias
      .filter((m) => m.estado === "activa")
      .sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin))[0] ?? null
  );
}

function getEstado(membresia: Membresia | null): {
  label: string;
  color: string;
} {
  if (!membresia) return { label: "Sin membresía", color: "text-muted-foreground" };
  const hoy = startOfDay(new Date());
  const fin = startOfDay(parseISO(membresia.fecha_fin));
  if (isBefore(fin, hoy)) return { label: "Vencida", color: "text-error" };
  if (isBefore(fin, addDays(hoy, 7))) return { label: "Por vencer", color: "text-warning" };
  return { label: "Activa", color: "text-success" };
}

export function TablaUsuarios({
  usuarios,
}: {
  usuarios: UsuarioConMembresia[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = useMemo(() => {
    let resultado = usuarios;

    // Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (u) =>
          u.nombre.toLowerCase().includes(q) ||
          (u.apellido?.toLowerCase().includes(q) ?? false) ||
          u.email.toLowerCase().includes(q)
      );
    }

    // Filtro por estado
    if (filtro !== "todos") {
      resultado = resultado.filter((u) => {
        const mem = getMembresiaActiva(u.membresias);
        const estado = getEstado(mem);
        switch (filtro) {
          case "activos":
            return estado.label === "Activa";
          case "por_vencer":
            return estado.label === "Por vencer";
          case "vencidos":
            return estado.label === "Vencida";
          case "sin_membresia":
            return estado.label === "Sin membresía";
          default:
            return true;
        }
      });
    }

    return resultado;
  }, [usuarios, busqueda, filtro]);

  const filtros: { value: Filtro; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activos", label: "Activos" },
    { value: "por_vencer", label: "Por vencer" },
    { value: "vencidos", label: "Vencidos" },
    { value: "sin_membresia", label: "Sin membresía" },
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
          filtrados.map((u) => {
            const mem = getMembresiaActiva(u.membresias);
            const estado = getEstado(mem);
            return (
              <Link
                key={u.id}
                href={`/admin/usuarios/${u.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {u.nombre} {u.apellido || ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className={`text-xs font-medium ${estado.color}`}>
                      {estado.label}
                    </p>
                    {mem && (
                      <p className="text-xs text-muted-foreground">
                        {mem.tipo_plan} · {format(parseISO(mem.fecha_fin), "d MMM", { locale: es })}
                      </p>
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
