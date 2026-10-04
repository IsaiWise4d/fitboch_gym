"use client";

import { useState } from "react";
import { CalendarDays, RefreshCw, Trash2 } from "lucide-react";

import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { ESTILO_ESTADO } from "@/components/admin/ui/estado";
import { Panel } from "@/components/admin/ui/Panel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  diasEntreFechas,
  estadoMembresia,
  etiquetaPlan,
  textoVencimiento,
} from "@/lib/membresias/estado";
import { cn } from "@/lib/utils";
import { fechaMedia, formatoPesos } from "@/lib/utils/formato";
import type { Membresia } from "@/types/app";

import type { AccionesUsuario } from "./useAccionesUsuario";

export function TarjetaMembresia({
  membresia,
  vigente,
  hoy,
  acciones,
  onRenovar,
}: {
  membresia: Membresia | null;
  vigente: boolean;
  hoy: string;
  acciones: AccionesUsuario;
  onRenovar: () => void;
}) {
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const { clave, diasRestantes } = estadoMembresia(membresia?.fecha_fin ?? null, hoy);

  const duracion = membresia ? Math.max(1, diasEntreFechas(membresia.fecha_inicio, membresia.fecha_fin)) : 1;
  const transcurrido = membresia ? diasEntreFechas(membresia.fecha_inicio, hoy) : 0;
  const progreso = Math.min(100, Math.max(0, (transcurrido / duracion) * 100));

  return (
    <Panel
      titulo={
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          Membresía actual
        </span>
      }
      acciones={membresia ? <EstadoBadge estado={clave} /> : undefined}
    >
      {membresia ? (
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{etiquetaPlan(membresia.tipo_plan)}</p>
            <p className="text-sm text-muted-foreground">
              {fechaMedia(membresia.fecha_inicio)} → {fechaMedia(membresia.fecha_fin)}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-white/[0.06]" aria-hidden="true">
              <div
                className={cn("h-full rounded-full", ESTILO_ESTADO[clave].marca)}
                style={{ width: `${vigente ? progreso : 100}%` }}
              />
            </div>
            <p className={cn("text-xs", ESTILO_ESTADO[clave].texto)}>
              {diasRestantes !== null && textoVencimiento(diasRestantes)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Monto</dt>
              <dd>{membresia.monto_pagado ? formatoPesos(membresia.monto_pagado) : "No registrado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Renovación rutina</dt>
              <dd>{vigente && membresia.renovacion_habilitada ? "Habilitada" : "No habilitada"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Plan nutricional</dt>
              <dd>{membresia.plan_nutricional_habilitado ? "Incluido" : "No incluido"}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Este usuario no tiene membresía activa.</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={onRenovar} variant={vigente ? "outline" : "default"}>
          <RefreshCw aria-hidden="true" />
          {vigente ? "Editar membresía vigente" : membresia ? "Crear nueva membresía" : "Crear membresía"}
        </Button>
        {membresia && (
          <Button
            variant="ghost"
            className="text-error hover:bg-error/10 hover:text-error"
            onClick={() => {
              acciones.limpiarError();
              setConfirmarEliminar(true);
            }}
          >
            <Trash2 aria-hidden="true" />
            Eliminar membresía
          </Button>
        )}
      </div>

      {membresia && (
        <ConfirmDialog
          abierto={confirmarEliminar}
          tono="peligro"
          titulo="¿Eliminar membresía?"
          descripcion="Se eliminará la membresía activa de este usuario. Ya no podrá ver su rutina hasta que se le asigne una nueva."
          textoConfirmar="Sí, eliminar"
          cargando={acciones.cargando === "eliminar-mem"}
          error={acciones.errorDe("eliminar-mem")}
          onCancelar={() => setConfirmarEliminar(false)}
          onConfirmar={() =>
            void acciones.ejecutar(
              "eliminar-mem",
              "/api/admin/eliminar-membresia",
              { membresia_id: membresia.id },
              "Error al eliminar",
              () => setConfirmarEliminar(false)
            )
          }
        />
      )}
    </Panel>
  );
}
