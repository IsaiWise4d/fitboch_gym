"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularFechaFinRenovacion, esTipoPlan, TIPOS_PLAN, type TipoPlan } from "@/lib/membresias/renovacion";
import { etiquetaPlan } from "@/lib/membresias/estado";
import { fechaMedia } from "@/lib/utils/formato";
import type { Membresia } from "@/types/app";

import type { AccionesUsuario } from "./useAccionesUsuario";

interface FormularioProps {
  usuarioId: string;
  hoy: string;
  membresia: Membresia | null;
  vigente: boolean;
  acciones: AccionesUsuario;
  onCerrar: () => void;
}

function FormularioRenovacion({ usuarioId, hoy, membresia, vigente, acciones, onCerrar }: FormularioProps) {
  // Al editar una vigente se parte de su plan y monto (antes se reiniciaban
  // a "mensual" y vacío, y guardar los sobrescribía).
  const [tipoPlan, setTipoPlan] = useState<TipoPlan>(
    vigente && membresia && esTipoPlan(membresia.tipo_plan) ? membresia.tipo_plan : "mensual"
  );
  const [monto, setMonto] = useState(
    vigente && membresia?.monto_pagado ? String(membresia.monto_pagado) : ""
  );
  const [usarFechaManual, setUsarFechaManual] = useState(false);
  const [fechaFinManual, setFechaFinManual] = useState("");

  const fechaFinAuto = calcularFechaFinRenovacion({
    hoy,
    finVigente: vigente ? membresia?.fecha_fin ?? null : null,
    tipoPlan,
  });
  const cargando = acciones.cargando === "renovar";
  const error = acciones.errorDe("renovar");

  function guardar() {
    const fechaFin = usarFechaManual && fechaFinManual ? fechaFinManual : fechaFinAuto;
    void acciones.ejecutar(
      "renovar",
      "/api/admin/renovar-membresia",
      {
        usuario_id: usuarioId,
        tipo_plan: tipoPlan,
        fecha_inicio: hoy,
        fecha_fin: fechaFin,
        monto_pagado: monto ? Number(monto) : null,
      },
      "Error al renovar",
      onCerrar
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Tipo de plan</Label>
        <SelectorSegmentado
          etiqueta="Tipo de plan"
          opciones={TIPOS_PLAN.map((p) => ({ valor: p, etiqueta: etiquetaPlan(p) }))}
          valor={tipoPlan}
          onCambio={setTipoPlan}
          className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="renovar-fecha">Fecha fin</Label>
          <button
            type="button"
            onClick={() => {
              setUsarFechaManual(!usarFechaManual);
              if (!usarFechaManual) setFechaFinManual("");
            }}
            className="text-xs text-primary hover:underline hover:underline-offset-4"
          >
            {usarFechaManual ? "Usar automática" : "Personalizar fecha"}
          </button>
        </div>
        {usarFechaManual ? (
          <Input
            id="renovar-fecha"
            type="date"
            value={fechaFinManual}
            onChange={(e) => setFechaFinManual(e.target.value)}
            onKeyDown={(e) => e.preventDefault()}
            inputMode="none"
            min={hoy}
          />
        ) : (
          <p className="flex h-10 items-center rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-foreground">
            {fechaMedia(fechaFinAuto)}
            <span className="ml-2 text-xs text-muted-foreground">
              (auto{vigente ? " desde fin actual" : ""})
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="renovar-monto">Monto pagado (opcional)</Label>
        <Input
          id="renovar-monto"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={cargando || (usarFechaManual && !fechaFinManual)}>
          {cargando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {vigente ? "Guardar cambios de membresía" : "Confirmar creación"}
        </Button>
      </div>
    </div>
  );
}

/** Crear / renovar / editar la membresía del usuario. */
export function DialogoRenovarMembresia({
  abierto,
  onCambio,
  ...props
}: Omit<FormularioProps, "onCerrar"> & { abierto: boolean; onCambio: (abierto: boolean) => void }) {
  const { vigente, membresia } = props;
  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (props.acciones.cargando !== "renovar") onCambio(v);
      }}
    >
      <DialogContent className="bg-surface p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {vigente ? "Renovar o editar membresía" : membresia ? "Crear nueva membresía" : "Crear membresía"}
          </DialogTitle>
          <DialogDescription>
            {vigente
              ? "La membresía actual está vigente: esta acción la editará y ajustará su fecha fin."
              : "No hay membresía vigente: esta acción creará una nueva membresía activa."}
          </DialogDescription>
        </DialogHeader>
        {/* Montado solo abierto: el formulario empieza limpio en cada apertura. */}
        {abierto && <FormularioRenovacion {...props} onCerrar={() => onCambio(false)} />}
      </DialogContent>
    </Dialog>
  );
}
