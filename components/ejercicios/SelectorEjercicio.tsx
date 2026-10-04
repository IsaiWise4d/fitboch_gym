"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, History, SearchX, X } from "lucide-react";

import type { Ejercicio } from "@/types/app";
import { cn } from "@/lib/utils";
import { mediaParaMiniatura, mediasEjercicio } from "@/lib/utils/media";
import { claveGrupo, etiquetaGrupo, ordenGrupo } from "@/lib/utils/grupos-musculares";
import { CampoBusqueda, FiltrosChips, normalizarTexto } from "@/components/shared/Filtros";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import { iconoDeGrupo } from "@/components/shared/iconos";

const TODOS = "todos";

interface SelectorEjercicioProps {
  abierto: boolean;
  ejercicios: Ejercicio[];
  /** Ejercicios usados últimamente (más reciente primero). */
  recientesIds: string[];
  seleccionadoId: string;
  onSeleccionar: (id: string) => void;
  onCerrar: () => void;
}

function FilaEjercicio({
  ejercicio,
  seleccionado,
  onElegir,
}: {
  ejercicio: Ejercicio;
  seleccionado: boolean;
  onElegir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={seleccionado}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5 active:bg-white/10",
        seleccionado && "bg-primary/10"
      )}
    >
      <MiniaturaMedia
        media={mediaParaMiniatura(mediasEjercicio(ejercicio))}
        alt=""
        icono={iconoDeGrupo(ejercicio.grupo_muscular)}
        distintivo={false}
        className="h-12 w-12 shrink-0 rounded-lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">{ejercicio.nombre}</span>
        <span className="block text-xs text-muted-foreground">
          {etiquetaGrupo(ejercicio.grupo_muscular)}
        </span>
      </span>
      {seleccionado && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
    </button>
  );
}

/**
 * Selector de ejercicio en hoja inferior: buscador, filtros por grupo,
 * "Recientes" y miniaturas para reconocer el ejercicio de un vistazo.
 * Reemplaza los dos <select> (grupo + ejercicio) del registrador.
 */
export function SelectorEjercicio({
  abierto,
  ejercicios,
  recientesIds,
  seleccionadoId,
  onSeleccionar,
  onCerrar,
}: SelectorEjercicioProps) {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState(TODOS);
  const onCerrarRef = useRef(onCerrar);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrarRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  const grupos = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const ej of ejercicios) {
      const clave = claveGrupo(ej.grupo_muscular);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
    return [...conteo.entries()]
      .sort(([a], [b]) => ordenGrupo(a) - ordenGrupo(b) || a.localeCompare(b, "es"))
      .map(([clave, cantidad]) => ({ clave, etiqueta: etiquetaGrupo(clave), cantidad }));
  }, [ejercicios]);

  const recientes = useMemo(
    () =>
      recientesIds
        .map((id) => ejercicios.find((ej) => ej.id === id))
        .filter((ej): ej is Ejercicio => Boolean(ej)),
    [recientesIds, ejercicios]
  );

  if (!abierto) return null;

  const consulta = normalizarTexto(busqueda.trim());
  const hayFiltros = consulta !== "" || grupo !== TODOS;
  const filtrados = ejercicios.filter(
    (ej) =>
      normalizarTexto(ej.nombre).includes(consulta) &&
      (grupo === TODOS || claveGrupo(ej.grupo_muscular) === grupo)
  );
  const secciones = grupos
    .map((g) => ({
      ...g,
      items: filtrados.filter((ej) => claveGrupo(ej.grupo_muscular) === g.clave),
    }))
    .filter((s) => s.items.length > 0);

  const elegir = (id: string) => {
    onSeleccionar(id);
    setBusqueda("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-selector-ejercicio"
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out sm:max-w-lg sm:rounded-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="space-y-3 border-b border-border px-4 pb-3 pt-3">
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-white/15 sm:hidden" />
          <div className="flex items-center justify-between">
            <h3 id="titulo-selector-ejercicio" className="text-lg font-bold">
              Elegir ejercicio
            </h3>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CampoBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Buscar ejercicio..." />
          <FiltrosChips
            etiqueta="Filtrar por grupo muscular"
            opciones={[
              { value: TODOS, label: "Todos", cantidad: ejercicios.length },
              ...grupos.map((g) => ({ value: g.clave, label: g.etiqueta, cantidad: g.cantidad })),
            ]}
            activo={grupo}
            onCambio={setGrupo}
          />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          {ejercicios.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Cargando ejercicios…</p>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <SearchX className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No hay ejercicios con esa búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {!hayFiltros && recientes.length > 0 && (
                <section aria-labelledby="titulo-recientes">
                  <h4
                    id="titulo-recientes"
                    className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-primary"
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    Recientes
                  </h4>
                  {recientes.map((ej) => (
                    <FilaEjercicio
                      key={`reciente-${ej.id}`}
                      ejercicio={ej}
                      seleccionado={ej.id === seleccionadoId}
                      onElegir={() => elegir(ej.id)}
                    />
                  ))}
                </section>
              )}
              {secciones.map((seccion) => (
                <section key={seccion.clave} aria-label={seccion.etiqueta}>
                  <h4 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {seccion.etiqueta}
                  </h4>
                  {seccion.items.map((ej) => (
                    <FilaEjercicio
                      key={ej.id}
                      ejercicio={ej}
                      seleccionado={ej.id === seleccionadoId}
                      onElegir={() => elegir(ej.id)}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
