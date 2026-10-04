"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CampoBusqueda } from "@/components/shared/Filtros";
import type { EstadoDiaAsistencia, FilaUsuarioReporte } from "@/lib/reportes/mensual";
import { cn } from "@/lib/utils";
import { fechaConDia, formatoPorcentaje } from "@/lib/utils/formato";
import { normalizarTexto } from "@/lib/utils/texto";

const ESTILO_DIA: Record<EstadoDiaAsistencia, { clase: string; etiqueta: string }> = {
  entreno: { clase: "bg-primary", etiqueta: "Entrenó" },
  domingo_entreno: { clase: "bg-primary/45", etiqueta: "Entrenó (domingo)" },
  fallo: { clase: "bg-estado-vencida/70", etiqueta: "Faltó (día hábil)" },
  descanso: { clase: "bg-white/[0.06]", etiqueta: "Domingo de descanso" },
  pendiente: { clase: "ring-1 ring-inset ring-white/15", etiqueta: "Pendiente / futuro" },
  fuera: { clase: "bg-transparent", etiqueta: "Antes de registrarse" },
};

const LEYENDA: EstadoDiaAsistencia[] = ["entreno", "domingo_entreno", "fallo", "descanso", "pendiente"];

/** Mapa de calor usuario × día con la columna de nombres fija. */
export function TabAsistencia({ usuarios, dias }: { usuarios: FilaUsuarioReporte[]; dias: string[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filas = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    return usuarios
      .filter((u) => !q || normalizarTexto(u.nombreCompleto).includes(q))
      .sort(
        (a, b) =>
          (b.asistencia ?? -1) - (a.asistencia ?? -1) ||
          b.diasEntrenados - a.diasEntrenados ||
          a.nombreCompleto.localeCompare(b.nombreCompleto, "es")
      );
  }, [usuarios, busqueda]);

  const domingos = dias.map((d) => {
    const [y, m, dd] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, dd)).getUTCDay() === 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {LEYENDA.map((e) => (
            <li key={e} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-3 rounded-[3px]", ESTILO_DIA[e].clase)} />
              {ESTILO_DIA[e].etiqueta}
            </li>
          ))}
        </ul>
        <div className="lg:w-72">
          <CampoBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Buscar usuario…" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-panel">
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-[200px] border-b border-border bg-panel px-4 py-2 text-left font-medium text-muted-foreground"
                >
                  Usuario
                </th>
                {dias.map((d, i) => (
                  <th
                    key={d}
                    scope="col"
                    title={fechaConDia(d)}
                    className={cn(
                      "w-[18px] border-b border-border px-[1px] py-2 text-center font-normal tabular-nums",
                      domingos[i] ? "text-muted-foreground/50" : "text-muted-foreground"
                    )}
                  >
                    {Number(d.slice(8))}
                  </th>
                ))}
                <th scope="col" className="border-b border-border px-4 py-2 text-right font-medium text-muted-foreground">
                  Asistencia
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((u) => (
                <tr key={u.usuarioId} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[200px] bg-panel px-4 py-[3px] text-left font-normal group-hover:bg-surface"
                  >
                    <Link
                      href={`/admin/usuarios/${u.usuarioId}`}
                      className="block truncate text-foreground hover:underline hover:underline-offset-4"
                    >
                      {u.nombreCompleto}
                    </Link>
                  </th>
                  {u.asistenciaDias.map((estado, i) => (
                    <td key={dias[i]} className="px-[1px] py-[3px] group-hover:bg-white/[0.02]">
                      <span
                        className={cn("block size-4 rounded-[3px]", ESTILO_DIA[estado].clase)}
                        title={`${u.nombreCompleto} · ${fechaConDia(dias[i])} · ${ESTILO_DIA[estado].etiqueta}`}
                        aria-label={`${fechaConDia(dias[i])}: ${ESTILO_DIA[estado].etiqueta}`}
                        role="img"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-[3px] text-right tabular-nums text-foreground/90 group-hover:bg-white/[0.02]">
                    {formatoPorcentaje(u.asistencia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Asistencia = días hábiles (lun–sáb) entrenados sobre los transcurridos desde el registro. Los domingos
        nunca cuentan como falta.
      </p>
    </div>
  );
}
