"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, History, ShieldAlert, Trash2, User, UserCheck, UserX } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { EstadoVacio } from "@/components/admin/ui/varios";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { estadoMembresia, etiquetaPlan } from "@/lib/membresias/estado";
import { cn } from "@/lib/utils";
import { fechaMedia, formatoPesos } from "@/lib/utils/formato";
import type { Membresia, PlanNutricional, Profile } from "@/types/app";

import type { RutinaResumen } from "./PanelesPlan";
import type { AccionesUsuario } from "./useAccionesUsuario";

function edadDe(fechaNacimiento: string, hoy: string): number {
  const [hY, hM, hD] = hoy.split("-").map(Number);
  const [nY, nM, nD] = fechaNacimiento.split("-").map(Number);
  return hY - nY - (hM < nM || (hM === nM && hD < nD) ? 1 : 0);
}

export function DatosPersonales({ profile, hoy }: { profile: Profile; hoy: string }) {
  const filas: { etiqueta: string; valor: string; ancho?: boolean }[] = [
    { etiqueta: "Email", valor: profile.email, ancho: true },
    { etiqueta: "Teléfono", valor: profile.telefono || "No definido" },
    {
      etiqueta: "Género",
      valor: profile.genero ? profile.genero.charAt(0).toUpperCase() + profile.genero.slice(1) : "No definido",
    },
    {
      etiqueta: "Nacimiento",
      valor: profile.fecha_nacimiento
        ? `${fechaMedia(profile.fecha_nacimiento)} · ${edadDe(profile.fecha_nacimiento, hoy)} años`
        : "No definida",
      ancho: true,
    },
    {
      etiqueta: "Peso / Altura",
      valor: `${profile.peso_kg ? `${profile.peso_kg} kg` : "--"} / ${profile.altura_cm ? `${profile.altura_cm} cm` : "--"}`,
    },
    { etiqueta: "% Grasa corporal", valor: profile.porcentaje_grasa || "No definido" },
    { etiqueta: "Lesiones / limitaciones", valor: profile.lesiones || "No definido", ancho: true },
  ];

  return (
    <Panel
      titulo={
        <span className="inline-flex items-center gap-2">
          <User className="size-4 text-primary" aria-hidden="true" />
          Datos personales
        </span>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {filas.map((f) => (
          <div key={f.etiqueta} className={cn("min-w-0", f.ancho && "col-span-2")}>
            <dt className="text-xs text-muted-foreground">{f.etiqueta}</dt>
            <dd className="break-words text-foreground">{f.valor}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function etiquetaEstadoHistorial(m: Membresia, hoy: string) {
  // Las filas `activa` se clasifican por fecha (vigente / por vencer /
  // vencida); el resto muestra su estado guardado.
  if (m.estado === "activa") return <EstadoBadge estado={estadoMembresia(m.fecha_fin, hoy).clave} />;
  return (
    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted-foreground capitalize">{m.estado}</span>
  );
}

export function HistorialUsuario({
  membresias,
  rutinas,
  planes,
  hoy,
}: {
  membresias: Membresia[];
  rutinas: RutinaResumen[];
  planes: PlanNutricional[];
  hoy: string;
}) {
  const rutinasArchivadas = rutinas.filter((r) => r.estado === "archivada");
  const planesArchivados = planes.filter((p) => p.estado === "archivada");

  return (
    <div className="space-y-4">
      <Panel
        titulo={
          <span className="inline-flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden="true" />
            Historial de membresías
          </span>
        }
        sinPadding
      >
        {membresias.length === 0 ? (
          <EstadoVacio titulo="Sin membresías registradas" />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {membresias.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {etiquetaPlan(m.tipo_plan)}
                    {m.monto_pagado ? <span className="text-muted-foreground"> · {formatoPesos(m.monto_pagado)}</span> : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fechaMedia(m.fecha_inicio)} → {fechaMedia(m.fecha_fin)}
                  </p>
                </div>
                {etiquetaEstadoHistorial(m, hoy)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {rutinasArchivadas.length > 0 && (
        <Panel titulo="Rutinas archivadas" sinPadding>
          <ul className="divide-y divide-border border-t border-border">
            {rutinasArchivadas.map((r) => (
              <li key={r.id} className="px-5 py-3 text-sm">
                <p className="text-foreground">
                  Plan {r.duracion_plan.replace("_", " ")} · {fechaMedia(r.created_at.slice(0, 10))}
                </p>
                <p className="text-xs text-muted-foreground">Archivada · {r.modelo_ia}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {planesArchivados.length > 0 && (
        <Panel titulo="Planes nutricionales archivados" sinPadding>
          <ul className="divide-y divide-border border-t border-border">
            {planesArchivados.map((p) => (
              <li key={p.id} className="px-5 py-3 text-sm">
                <p className="text-foreground">
                  Objetivo: {p.objetivo} · {fechaMedia(p.created_at.slice(0, 10))}
                </p>
                <p className="text-xs text-muted-foreground">Archivado</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

export function ZonaPeligro({ profile, acciones }: { profile: Profile; acciones: AccionesUsuario }) {
  const router = useRouter();
  const [confirmarToggle, setConfirmarToggle] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  return (
    <Panel
      titulo={
        <span className="inline-flex items-center gap-2">
          <ShieldAlert className="size-4 text-error" aria-hidden="true" />
          Zona de riesgo
        </span>
      }
    >
      <div className="space-y-2">
        {!profile.activo && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-xs text-error">Este usuario está desactivado</p>
        )}
        <Button
          variant="outline"
          className={cn(
            "w-full",
            profile.activo ? "text-error hover:bg-error/10 hover:text-error" : "text-success hover:bg-success/10 hover:text-success"
          )}
          onClick={() => {
            acciones.limpiarError();
            setConfirmarToggle(true);
          }}
        >
          {profile.activo ? <UserX aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
          {profile.activo ? "Desactivar usuario" : "Reactivar usuario"}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-error hover:bg-error/10 hover:text-error"
          onClick={() => {
            acciones.limpiarError();
            setConfirmarEliminar(true);
          }}
        >
          <Trash2 aria-hidden="true" />
          Eliminar usuario permanentemente
        </Button>
      </div>

      <ConfirmDialog
        abierto={confirmarToggle}
        tono={profile.activo ? "peligro" : "primario"}
        icono={<AlertTriangle className="size-5" />}
        titulo={profile.activo ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
        descripcion={
          profile.activo
            ? "El usuario no podrá iniciar sesión ni usar el sistema mientras esté desactivado."
            : "El usuario volverá a poder acceder normalmente al sistema."
        }
        textoConfirmar={profile.activo ? "Sí, desactivar" : "Sí, reactivar"}
        cargando={acciones.cargando === "toggle-user"}
        error={acciones.errorDe("toggle-user")}
        onCancelar={() => setConfirmarToggle(false)}
        onConfirmar={() =>
          void acciones.ejecutar(
            "toggle-user",
            "/api/admin/toggle-usuario",
            { usuario_id: profile.id, activo: !profile.activo },
            "Error al actualizar",
            () => setConfirmarToggle(false)
          )
        }
      />

      <ConfirmDialog
        abierto={confirmarEliminar}
        tono="peligro"
        icono={<AlertTriangle className="size-5" />}
        titulo="¿Eliminar usuario permanentemente?"
        descripcion="Esta acción eliminará en cadena sus rutinas, membresías, logs de acceso, perfil y cuenta de autenticación. No se puede deshacer."
        textoConfirmar="Sí, eliminar por completo"
        cargando={acciones.cargando === "delete-user"}
        error={acciones.errorDe("delete-user")}
        onCancelar={() => setConfirmarEliminar(false)}
        onConfirmar={() =>
          void acciones.ejecutar(
            "delete-user",
            "/api/admin/eliminar-usuario",
            { usuario_id: profile.id },
            "Error al eliminar",
            () => {
              setConfirmarEliminar(false);
              router.push("/admin/usuarios");
            }
          )
        }
      />
    </Panel>
  );
}
