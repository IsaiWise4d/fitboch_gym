"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Trophy } from "lucide-react";

import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { EstadoVacio, MiniBarra } from "@/components/admin/ui/varios";
import { CampoBusqueda } from "@/components/shared/Filtros";
import type { ClasificacionActividad, FilaUsuarioReporte } from "@/lib/reportes/mensual";
import { cn } from "@/lib/utils";
import { fechaCorta, formatoCompacto } from "@/lib/utils/formato";
import { normalizarTexto } from "@/lib/utils/texto";

import { CLASIFICACIONES } from "./TabResumen";

export type FiltroClasificacion = "todas" | ClasificacionActividad;

type Campo = "nombre" | "dias" | "asistencia" | "racha" | "ejercicios" | "volumen" | "records" | "ultimo";

const COLUMNAS: { campo: Campo; etiqueta: string; numerica?: boolean }[] = [
  { campo: "nombre", etiqueta: "Usuario" },
  { campo: "dias", etiqueta: "Días", numerica: true },
  { campo: "asistencia", etiqueta: "Asistencia" },
  { campo: "racha", etiqueta: "Racha cierre / mejor", numerica: true },
  { campo: "ejercicios", etiqueta: "Ejercicios", numerica: true },
  { campo: "volumen", etiqueta: "Volumen", numerica: true },
  { campo: "records", etiqueta: "Récords", numerica: true },
  { campo: "ultimo", etiqueta: "Último entreno" },
];

const COLOR_CLASIFICACION: Record<ClasificacionActividad, string> = {
  "Muy activo": "bg-estado-activa/15 text-success",
  Activo: "bg-primary/15 text-primary",
  Irregular: "bg-estado-por-vencer/15 text-warning",
  Inactivo: "bg-estado-vencida/15 text-error",
  "Sin datos": "bg-white/5 text-muted-foreground",
};

function valorOrden(f: FilaUsuarioReporte, campo: Campo): string | number | null {
  switch (campo) {
    case "nombre":
      return f.nombreCompleto;
    case "dias":
      return f.diasEntrenados;
    case "asistencia":
      return f.asistencia;
    case "racha":
      return f.rachaCierre * 1000 + f.mejorRachaMes;
    case "ejercicios":
      return f.ejercicios;
    case "volumen":
      return f.volumenKg;
    case "records":
      return f.recordsSuperados;
    case "ultimo":
      return f.ultimoEntreno;
  }
}

export function TabUsuarios({
  usuarios,
  clasificacion,
  onClasificacion,
}: {
  usuarios: FilaUsuarioReporte[];
  clasificacion: FiltroClasificacion;
  onClasificacion: (c: FiltroClasificacion) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ campo: Campo; dir: "asc" | "desc" }>({ campo: "dias", dir: "desc" });

  const conteo = useMemo(() => {
    const c: Record<string, number> = { todas: usuarios.length };
    for (const u of usuarios) c[u.clasificacion] = (c[u.clasificacion] ?? 0) + 1;
    return c;
  }, [usuarios]);

  const visibles = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    const signo = orden.dir === "asc" ? 1 : -1;
    return usuarios
      .filter((u) => clasificacion === "todas" || u.clasificacion === clasificacion)
      .filter((u) => !q || normalizarTexto(u.nombreCompleto).includes(q) || normalizarTexto(u.email).includes(q))
      .sort((a, b) => {
        const va = valorOrden(a, orden.campo);
        const vb = valorOrden(b, orden.campo);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        const comparacion =
          typeof va === "string" && typeof vb === "string"
            ? va.localeCompare(vb, "es")
            : Number(va) - Number(vb);
        return comparacion * signo || a.nombreCompleto.localeCompare(b.nombreCompleto, "es");
      });
  }, [usuarios, clasificacion, busqueda, orden]);

  function ordenarPor(campo: Campo) {
    setOrden((o) =>
      o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: campo === "nombre" ? "asc" : "desc" }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SelectorSegmentado
          etiqueta="Filtrar por clasificación"
          opciones={[
            { valor: "todas" as FiltroClasificacion, etiqueta: "Todas", cantidad: conteo.todas },
            ...CLASIFICACIONES.map((c) => ({
              valor: c.clave as FiltroClasificacion,
              etiqueta: c.clave,
              cantidad: conteo[c.clave] ?? 0,
            })),
          ]}
          valor={clasificacion}
          onCambio={onClasificacion}
          className="max-w-full self-start overflow-x-auto scrollbar-none"
        />
        <div className="xl:w-80">
          <CampoBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Buscar usuario…" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-panel">
        {visibles.length === 0 ? (
          <EstadoVacio titulo="Ningún usuario coincide" descripcion="Cambia la clasificación o la búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {COLUMNAS.map((col) => {
                    const activa = orden.campo === col.campo;
                    return (
                      <th
                        key={col.campo}
                        scope="col"
                        aria-sort={activa ? (orden.dir === "asc" ? "ascending" : "descending") : undefined}
                        className={cn("h-10 px-4 text-xs font-medium text-muted-foreground first:pl-5", col.numerica && "text-right")}
                      >
                        <button
                          type="button"
                          onClick={() => ordenarPor(col.campo)}
                          className={cn("inline-flex items-center gap-1 hover:text-foreground", activa && "text-foreground")}
                        >
                          {col.etiqueta}
                          {activa && (orden.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibles.map((u) => (
                  <tr key={u.usuarioId} className="transition-colors duration-150 hover:bg-white/[0.025]">
                    <td className="py-2.5 pr-4 pl-5">
                      <Link
                        href={`/admin/usuarios/${u.usuarioId}`}
                        className="block max-w-[260px] truncate font-medium text-foreground hover:underline hover:underline-offset-4"
                      >
                        {u.nombreCompleto}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn("rounded-full px-2 py-px text-[11px] font-medium", COLOR_CLASIFICACION[u.clasificacion])}>
                          {u.clasificacion}
                        </span>
                        {u.plan ? `${u.plan} · ${u.estadoMembresia}` : u.estadoMembresia}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{u.diasEntrenados}</td>
                    <td className="px-4 py-2.5">
                      <MiniBarra valor={u.asistencia} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {u.rachaCierre}
                      <span className="text-muted-foreground"> / {u.mejorRachaMes}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{u.ejercicios}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {u.volumenKg > 0 ? `${formatoCompacto(u.volumenKg)} kg` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {u.recordsSuperados > 0 ? (
                        <span className="inline-flex items-center gap-1 text-primary" title={u.detalleRecords}>
                          <Trophy className="size-3.5" aria-hidden="true" />
                          {u.recordsSuperados}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {u.ultimoEntreno ? fechaCorta(u.ultimoEntreno) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {visibles.length} de {usuarios.length} usuarios · Récords: ejercicios en los que superó su mejor peso
        previo (pasa el cursor para ver cuáles).
      </p>
    </div>
  );
}
