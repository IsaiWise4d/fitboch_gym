"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight, Download, Flame, Users } from "lucide-react";

import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { ESTILO_ESTADO } from "@/components/admin/ui/estado";
import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { actualizarUrl } from "@/components/admin/ui/url";
import { AvatarIniciales, BotonWhatsApp, EstadoVacio, MiniBarra } from "@/components/admin/ui/varios";
import { CampoBusqueda } from "@/components/shared/Filtros";
import { Button } from "@/components/ui/button";
import {
  contarPorEstado,
  filasACsv,
  filtrarUsuarios,
  FILTROS_ESTADO,
  ordenarUsuarios,
  parsearFiltroEstado,
  parsearOrden,
  type CampoOrden,
  type FilaUsuarioAdmin,
  type FiltroEstado,
  type Orden,
} from "@/lib/admin/usuarios";
import { textoVencimiento } from "@/lib/membresias/estado";
import { cn } from "@/lib/utils";
import { fechaCorta, formatoPesos, textoHace } from "@/lib/utils/formato";

const ETIQUETA_FILTRO: Record<FiltroEstado, string> = {
  todos: "Todos",
  activa: "Activas",
  por_vencer: "Por vencer",
  vencida: "Vencidas",
  sin_membresia: "Sin membresía",
  desactivado: "Desactivados",
};

const COLUMNAS: { campo: CampoOrden | null; etiqueta: string; clase?: string }[] = [
  { campo: "nombre", etiqueta: "Usuario" },
  { campo: "estado", etiqueta: "Membresía" },
  { campo: "vence", etiqueta: "Vence" },
  { campo: "racha", etiqueta: "Racha", clase: "text-right" },
  { campo: "ultimo", etiqueta: "Último entreno" },
  { campo: "asistencia", etiqueta: "Asistencia 30 d" },
  { campo: "monto", etiqueta: "Monto", clase: "text-right" },
  { campo: null, etiqueta: "" },
];

function Racha({ fila }: { fila: FilaUsuarioAdmin }) {
  if (fila.racha === 0) {
    return <span className="text-xs text-muted-foreground">{fila.estadoRacha === "rota" ? "Rota" : "—"}</span>;
  }
  const color =
    fila.estadoRacha === "en_riesgo" ? "text-warning" : "text-orange-400";
  const titulo =
    fila.estadoRacha === "hoy"
      ? "Entrenó hoy"
      : fila.estadoRacha === "en_riesgo"
        ? "Racha en riesgo hoy"
        : "Pendiente hoy";
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", color)} title={titulo}>
      <Flame className={cn("size-3.5", fila.estadoRacha === "hoy" && "flame-pulse")} aria-hidden="true" />
      {fila.racha}
      <span className="sr-only"> días, {titulo.toLowerCase()}</span>
    </span>
  );
}

function Vence({ fila }: { fila: FilaUsuarioAdmin }) {
  if (!fila.fechaFin || fila.diasRestantes === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const urgente = fila.estado === "por_vencer" || fila.estado === "vencida";
  return (
    <span className="block leading-tight">
      <span className="block text-sm text-foreground">{fechaCorta(fila.fechaFin)}</span>
      <span className={cn("block text-xs", urgente ? ESTILO_ESTADO[fila.estado].texto : "text-muted-foreground")}>
        {urgente ? textoVencimiento(fila.diasRestantes) : `en ${fila.diasRestantes} días`}
      </span>
    </span>
  );
}

function UltimoEntreno({ fila, hoy }: { fila: FilaUsuarioAdmin; hoy: string }) {
  if (!fila.ultimoEntreno) return <span className="text-xs text-muted-foreground">Sin registros recientes</span>;
  const alerta = fila.diasSinEntrenar !== null && fila.diasSinEntrenar > 7 && fila.estado !== "desactivado";
  return (
    <span className={cn("text-sm", alerta ? "text-warning" : "text-foreground")}>
      {textoHace(fila.ultimoEntreno, hoy)}
    </span>
  );
}

export function ListaUsuarios({ filas, hoy }: { filas: FilaUsuarioAdmin[]; hoy: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estado = parsearFiltroEstado(searchParams.get("estado"));
  const orden = parsearOrden(searchParams.get("orden"), searchParams.get("dir"));
  // La búsqueda vive en estado local (tipeo fluido) y se refleja en la URL.
  const [busqueda, setBusqueda] = useState(() => searchParams.get("q") ?? "");

  const conteo = useMemo(() => contarPorEstado(filas), [filas]);
  const visibles = useMemo(
    () => ordenarUsuarios(filtrarUsuarios(filas, { estado, q: busqueda }), orden),
    [filas, estado, busqueda, orden]
  );

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    actualizarUrl({ q: valor.trim() || null });
  }

  function cambiarOrden(campo: CampoOrden) {
    const nuevo: Orden =
      orden.campo === campo
        ? { campo, dir: orden.dir === "asc" ? "desc" : "asc" }
        : { campo, dir: campo === "racha" || campo === "asistencia" || campo === "monto" || campo === "registro" ? "desc" : "asc" };
    const porDefecto = nuevo.campo === "estado" && nuevo.dir === "asc";
    actualizarUrl({ orden: porDefecto ? null : nuevo.campo, dir: porDefecto ? null : nuevo.dir });
  }

  function exportarCsv() {
    const blob = new Blob([filasACsv(visibles)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `usuarios-fitboch-${hoy}${estado !== "todos" ? `-${estado}` : ""}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  function abrirFila(e: React.MouseEvent, id: string) {
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(`/admin/usuarios/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SelectorSegmentado
          etiqueta="Filtrar por estado de membresía"
          opciones={FILTROS_ESTADO.map((f) => ({ valor: f, etiqueta: ETIQUETA_FILTRO[f], cantidad: conteo[f] }))}
          valor={estado}
          onCambio={(f) => actualizarUrl({ estado: f === "todos" ? null : f })}
          className="max-w-full self-start overflow-x-auto scrollbar-none"
        />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 xl:w-80">
            <CampoBusqueda
              valor={busqueda}
              onCambio={cambiarBusqueda}
              placeholder="Buscar por nombre, email o teléfono…"
            />
          </div>
          <Button variant="outline" onClick={exportarCsv} disabled={visibles.length === 0} title="Exportar la lista filtrada a CSV">
            <Download aria-hidden="true" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {visibles.length === filas.length
          ? `${filas.length} usuario${filas.length === 1 ? "" : "s"}`
          : `Mostrando ${visibles.length} de ${filas.length} usuarios`}
      </p>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel">
          <EstadoVacio
            icono={<Users />}
            titulo="Ningún usuario coincide"
            descripcion={
              busqueda
                ? "Prueba con otro nombre, email o teléfono, o cambia el filtro de estado."
                : `No hay usuarios con estado "${ETIQUETA_FILTRO[estado].toLowerCase()}".`
            }
          />
        </div>
      ) : (
        <>
          {/* Escritorio: tabla ordenable */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-panel md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {COLUMNAS.map((col, i) => {
                      const activa = col.campo !== null && orden.campo === col.campo;
                      return (
                        <th
                          key={i}
                          scope="col"
                          aria-sort={activa ? (orden.dir === "asc" ? "ascending" : "descending") : undefined}
                          className={cn("h-10 px-4 text-xs font-medium text-muted-foreground first:pl-5", col.clase)}
                        >
                          {col.campo ? (
                            <button
                              type="button"
                              onClick={() => cambiarOrden(col.campo!)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded transition-colors duration-150 hover:text-foreground",
                                activa && "text-foreground"
                              )}
                            >
                              {col.etiqueta}
                              {activa &&
                                (orden.dir === "asc" ? (
                                  <ArrowUp className="size-3" aria-hidden="true" />
                                ) : (
                                  <ArrowDown className="size-3" aria-hidden="true" />
                                ))}
                            </button>
                          ) : (
                            <span className="sr-only">Acciones</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibles.map((f) => (
                    <tr
                      key={f.id}
                      onClick={(e) => abrirFila(e, f.id)}
                      className={cn(
                        "group cursor-pointer transition-colors duration-150 hover:bg-white/[0.025]",
                        f.estado === "desactivado" && "opacity-60"
                      )}
                    >
                      <td className="py-3 pr-4 pl-5">
                        <div className="flex items-center gap-3">
                          <AvatarIniciales nombre={f.nombre} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/usuarios/${f.id}`}
                              className="block max-w-[240px] truncate font-medium text-foreground hover:underline hover:underline-offset-4"
                            >
                              {f.nombre}
                            </Link>
                            <span className="block max-w-[240px] truncate text-xs text-muted-foreground">
                              {f.perfilCompleto ? f.email : `${f.email} · perfil incompleto`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <EstadoBadge estado={f.estado} />
                          {f.plan && <span className="text-xs text-muted-foreground">{f.plan}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Vence fila={f} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Racha fila={f} />
                      </td>
                      <td className="px-4 py-3">
                        <UltimoEntreno fila={f} hoy={hoy} />
                      </td>
                      <td className="px-4 py-3">
                        <MiniBarra valor={f.asistencia30} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground/90">
                        {f.monto === null ? <span className="text-muted-foreground">—</span> : formatoPesos(f.monto)}
                      </td>
                      <td className="py-3 pr-4 pl-2">
                        <div className="flex items-center justify-end gap-1">
                          <BotonWhatsApp
                            telefono={f.telefono}
                            nombre={f.nombre}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          />
                          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Móvil: tarjetas */}
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-panel md:hidden">
            {visibles.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/usuarios/${f.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/[0.04]"
                >
                  <AvatarIniciales nombre={f.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{f.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.fechaFin && f.diasRestantes !== null
                        ? `${f.plan ?? "Plan"} · ${textoVencimiento(f.diasRestantes).toLowerCase()}`
                        : f.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <EstadoBadge estado={f.estado} className="h-5 px-2 text-[11px]" />
                    <Racha fila={f} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
