"use client";

import { startTransition, useOptimistic, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Dumbbell, Loader2, Monitor, RefreshCw, Salad, Sparkles } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { fechaMedia } from "@/lib/utils/formato";
import type { Membresia, PlanNutricional } from "@/types/app";

import type { AccionesUsuario } from "./useAccionesUsuario";

const RutinaEditor = dynamic(() => import("@/components/admin/RutinaEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-32 items-center justify-center rounded-lg border border-border bg-white/[0.03]">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  ),
});

export interface RutinaResumen {
  id: string;
  created_at: string;
  duracion_plan: string;
  estado: "activa" | "archivada";
  modelo_ia: string;
  texto_rutina: string;
}

/** Edición en curso de un texto (rutina o plan), atada al id del documento. */
export interface Edicion {
  id: string;
  texto: string;
}

/** Hash corto del texto para remontar el editor (MDXEditor no es controlado). */
function hashTexto(texto: string): string {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

function EditorDocumento({
  titulo,
  documentoId,
  textoGuardado,
  edicion,
  onEdicion,
  onGuardar,
  guardando,
  error,
  avisoMovil,
}: {
  titulo: string;
  documentoId: string;
  textoGuardado: string;
  edicion: Edicion | null;
  onEdicion: (e: Edicion | null) => void;
  onGuardar: (texto: string) => void;
  guardando: boolean;
  error: string | null;
  avisoMovil: string;
}) {
  const editando = edicion !== null && edicion.id === documentoId;
  const texto = editando ? edicion.texto : textoGuardado;

  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-border bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{titulo}</p>
        {!editando ? (
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => onEdicion({ id: documentoId, texto: textoGuardado })}
          >
            Editar texto
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdicion(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => onGuardar(texto)} disabled={guardando || !texto.trim()}>
              {guardando && <Loader2 className="animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
      {/* El editor solo en escritorio: en móvil rompe el formato de tablas. */}
      <div className="hidden md:block">
        <RutinaEditor
          key={`${documentoId}-${editando ? "edicion" : "lectura"}-${editando ? "" : hashTexto(textoGuardado)}`}
          markdown={texto}
          onChange={(valor) => onEdicion({ id: documentoId, texto: valor })}
          readOnly={!editando}
        />
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-warning/60 bg-warning/10 p-3 text-sm text-warning md:hidden">
        <Monitor className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {avisoMovil}
      </div>
    </div>
  );
}

/** Interruptor del plan nutricional que guarda al instante (optimista). */
function ToggleNutricional({
  membresia,
  acciones,
}: {
  membresia: Membresia;
  acciones: AccionesUsuario;
}) {
  const [valor, setValor] = useOptimistic(membresia.plan_nutricional_habilitado);
  const cargando = acciones.cargando === "nutricional";

  function cambiar(habilitado: boolean) {
    startTransition(async () => {
      setValor(habilitado);
      await acciones.ejecutar(
        "nutricional",
        "/api/admin/toggle-nutricional",
        { membresia_id: membresia.id, habilitado },
        "Error al actualizar plan nutricional"
      );
    });
  }

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white/[0.02] p-3 transition-colors duration-150 hover:bg-white/[0.04]">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => cambiar(e.target.checked)}
        disabled={cargando}
        className="size-4 accent-[var(--primary)]"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">Plan nutricional</span>
        <span className="block text-xs text-muted-foreground">Servicio adicional con costo aparte</span>
      </span>
      {cargando && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
    </label>
  );
}

export function PanelRutina({
  usuarioId,
  rutina,
  membresia,
  acciones,
  edicion,
  onEdicion,
}: {
  usuarioId: string;
  rutina: RutinaResumen | null;
  membresia: Membresia | null;
  acciones: AccionesUsuario;
  edicion: Edicion | null;
  onEdicion: (e: Edicion | null) => void;
}) {
  const [confirmarNueva, setConfirmarNueva] = useState(false);
  // Solo local: se envía al habilitar la primera rutina.
  const [incluirNutricional, setIncluirNutricional] = useState(membresia?.plan_nutricional_habilitado ?? false);

  function habilitar(planNutricional: boolean, onExito?: () => void) {
    void acciones.ejecutar(
      "rutina",
      "/api/admin/habilitar-rutina",
      { usuario_id: usuarioId, plan_nutricional: planNutricional },
      "Error al habilitar rutina",
      onExito
    );
  }

  return (
    <div className="space-y-4">
      <Panel
        titulo={
          <span className="inline-flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" aria-hidden="true" />
            Rutina
          </span>
        }
        acciones={
          rutina ? (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Activa</span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {rutina ? (
            <div className="text-sm">
              <p>
                Plan {rutina.duracion_plan.replace("_", " ")} · Generada {fechaMedia(rutina.created_at.slice(0, 10))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Modelo: {rutina.modelo_ia}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {membresia?.renovacion_habilitada ? "Esperando que el usuario genere su rutina" : "Sin rutina generada"}
            </p>
          )}

          {acciones.errorDe("rutina") && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {acciones.errorDe("rutina")}
            </p>
          )}
          {acciones.errorDe("nutricional") && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {acciones.errorDe("nutricional")}
            </p>
          )}

          {membresia && rutina && <ToggleNutricional membresia={membresia} acciones={acciones} />}

          {membresia?.renovacion_habilitada && (
            <div className="space-y-3 rounded-lg bg-warning/10 p-3">
              <p className="text-xs text-warning">Renovación habilitada — el usuario puede generar su rutina</p>
              {!rutina && <ToggleNutricional membresia={membresia} acciones={acciones} />}
            </div>
          )}

          {membresia && rutina && (
            <Button variant="outline" className="w-full" onClick={() => setConfirmarNueva(true)}>
              <RefreshCw aria-hidden="true" />
              Gestionar nueva rutina
            </Button>
          )}

          {membresia && !rutina && !membresia.renovacion_habilitada && (
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white/[0.02] p-3 transition-colors duration-150 hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={incluirNutricional}
                  onChange={(e) => setIncluirNutricional(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">Incluir plan nutricional</span>
                  <span className="block text-xs text-muted-foreground">Servicio adicional con costo aparte</span>
                </span>
              </label>
              <Button className="w-full" onClick={() => habilitar(incluirNutricional)} disabled={acciones.cargando === "rutina"}>
                {acciones.cargando === "rutina" ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Habilitar nueva rutina
              </Button>
            </div>
          )}
        </div>
      </Panel>

      {rutina && (
        <EditorDocumento
          titulo="Texto de la rutina activa"
          documentoId={rutina.id}
          textoGuardado={rutina.texto_rutina}
          edicion={edicion}
          onEdicion={onEdicion}
          guardando={acciones.cargando === "editar-rutina"}
          error={acciones.errorDe("editar-rutina")}
          avisoMovil="La edición de la rutina solo está disponible desde una computadora. Para evitar errores de formato, por favor edita este texto desde un PC."
          onGuardar={(texto) =>
            void acciones.ejecutar(
              "editar-rutina",
              "/api/admin/editar-rutina",
              { rutina_id: rutina.id, texto_rutina: texto },
              "Error al guardar la rutina",
              () => onEdicion(null)
            )
          }
        />
      )}

      {membresia && rutina && (
        <ConfirmDialog
          abierto={confirmarNueva}
          icono={<AlertTriangle className="size-5" />}
          titulo="¿Estás seguro?"
          descripcion="Esta acción archivará la rutina actual del usuario y le permitirá generar una nueva. La rutina actual ya no será visible para el usuario."
          textoConfirmar="Sí, archivar y habilitar"
          cargando={acciones.cargando === "rutina"}
          error={acciones.errorDe("rutina")}
          onCancelar={() => setConfirmarNueva(false)}
          onConfirmar={() => habilitar(membresia.plan_nutricional_habilitado, () => setConfirmarNueva(false))}
        />
      )}
    </div>
  );
}

export function PanelNutricion({
  usuarioId,
  plan,
  membresia,
  acciones,
  edicion,
  onEdicion,
}: {
  usuarioId: string;
  plan: PlanNutricional | null;
  membresia: Membresia | null;
  acciones: AccionesUsuario;
  edicion: Edicion | null;
  onEdicion: (e: Edicion | null) => void;
}) {
  const [confirmarNuevo, setConfirmarNuevo] = useState(false);

  return (
    <div className="space-y-4">
      <Panel
        titulo={
          <span className="inline-flex items-center gap-2">
            <Salad className="size-4 text-primary" aria-hidden="true" />
            Plan nutricional
          </span>
        }
        acciones={
          plan ? (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Generado</span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {plan ? (
            <p className="text-sm">
              Objetivo: {plan.objetivo} · Generado {fechaMedia(plan.created_at.slice(0, 10))}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {membresia?.plan_nutricional_habilitado
                ? "Esperando que el usuario genere su plan nutricional"
                : "Plan nutricional no habilitado para este usuario"}
            </p>
          )}

          {membresia && plan && membresia.plan_nutricional_habilitado && (
            <Button variant="outline" className="w-full" onClick={() => setConfirmarNuevo(true)}>
              <RefreshCw aria-hidden="true" />
              Gestionar nuevo plan nutricional
            </Button>
          )}
        </div>
      </Panel>

      {plan && (
        <EditorDocumento
          titulo="Texto del plan nutricional activo"
          documentoId={plan.id}
          textoGuardado={plan.texto_plan}
          edicion={edicion}
          onEdicion={onEdicion}
          guardando={acciones.cargando === "editar-plan"}
          error={acciones.errorDe("editar-plan")}
          avisoMovil="La edición manual solo está disponible desde una computadora."
          onGuardar={(texto) =>
            void acciones.ejecutar(
              "editar-plan",
              "/api/admin/editar-plan-nutricional",
              { plan_id: plan.id, texto_plan: texto },
              "Error al guardar el plan nutricional",
              () => onEdicion(null)
            )
          }
        />
      )}

      <ConfirmDialog
        abierto={confirmarNuevo}
        icono={<AlertTriangle className="size-5" />}
        titulo="¿Estás seguro?"
        descripcion="Esta acción archivará el plan nutricional activo del usuario y le permitirá generar uno nuevo. El plan actual ya no será visible para el usuario."
        textoConfirmar="Sí, archivar y habilitar"
        cargando={acciones.cargando === "plan-nutri"}
        error={acciones.errorDe("plan-nutri")}
        onCancelar={() => setConfirmarNuevo(false)}
        onConfirmar={() =>
          void acciones.ejecutar(
            "plan-nutri",
            "/api/admin/habilitar-plan-nutricional",
            { usuario_id: usuarioId },
            "Error al habilitar nuevo plan nutricional",
            () => setConfirmarNuevo(false)
          )
        }
      />
    </div>
  );
}

