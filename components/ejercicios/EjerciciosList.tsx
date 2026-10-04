"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import type { Ejercicio } from "@/types/app";
import { CampoBusqueda, FiltrosChips, normalizarTexto } from "@/components/shared/Filtros";
import { etiquetaGrupo, ordenGrupo } from "@/lib/utils/grupos-musculares";
import { EjercicioCard } from "./EjercicioCard";

const TODOS = "todos";

interface EjerciciosListProps {
  ejercicios: Ejercicio[];
  /** Grupo preseleccionado (p. ej. desde "Ver todos" en el detalle). */
  grupoInicial?: string;
}

export function EjerciciosList({ ejercicios, grupoInicial }: EjerciciosListProps) {
  const [busqueda, setBusqueda] = useState("");
  const [grupoActivo, setGrupoActivo] = useState(() =>
    grupoInicial ? normalizarTexto(grupoInicial) : TODOS
  );

  // Grupos presentes en los datos, con su cantidad, en el orden del gimnasio.
  const grupos = useMemo(() => {
    const conteo = new Map<string, { etiqueta: string; cantidad: number }>();
    for (const ej of ejercicios) {
      const clave = normalizarTexto(ej.grupo_muscular);
      const actual = conteo.get(clave);
      if (actual) actual.cantidad += 1;
      else conteo.set(clave, { etiqueta: etiquetaGrupo(ej.grupo_muscular), cantidad: 1 });
    }
    return [...conteo.entries()]
      .sort(([a], [b]) => ordenGrupo(a) - ordenGrupo(b) || a.localeCompare(b, "es"))
      .map(([clave, info]) => ({ clave, ...info }));
  }, [ejercicios]);

  const consulta = normalizarTexto(busqueda.trim());
  const filtrados = ejercicios.filter((ej) => {
    const matchBusqueda = normalizarTexto(ej.nombre).includes(consulta);
    const matchGrupo = grupoActivo === TODOS || normalizarTexto(ej.grupo_muscular) === grupoActivo;
    return matchBusqueda && matchGrupo;
  });

  const hayFiltros = consulta !== "" || grupoActivo !== TODOS;
  // Sin filtros: secciones por grupo muscular. Con filtros: cuadrícula plana.
  const secciones = hayFiltros
    ? null
    : grupos.map((grupo) => ({
        ...grupo,
        items: filtrados.filter((ej) => normalizarTexto(ej.grupo_muscular) === grupo.clave),
      }));

  return (
    <div className="space-y-5">
      {/* Buscador y filtros fijos al hacer scroll */}
      <div className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-30 -mx-4 space-y-3 border-b border-transparent bg-background/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <CampoBusqueda valor={busqueda} onCambio={setBusqueda} placeholder="Buscar ejercicio..." />
        <FiltrosChips
          etiqueta="Filtrar por grupo muscular"
          opciones={[
            { value: TODOS, label: "Todos", cantidad: ejercicios.length },
            ...grupos.map((g) => ({ value: g.clave, label: g.etiqueta, cantidad: g.cantidad })),
          ]}
          activo={grupoActivo}
          onCambio={setGrupoActivo}
        />
      </div>

      {hayFiltros && filtrados.length > 0 && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {filtrados.length} ejercicio{filtrados.length !== 1 ? "s" : ""}
        </p>
      )}

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {ejercicios.length === 0
              ? "Aún no hay ejercicios registrados."
              : "No se encontraron ejercicios con esos filtros."}
          </p>
          {hayFiltros && ejercicios.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setGrupoActivo(TODOS);
              }}
              className="rounded-full bg-surface px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-surface-hover active:scale-95"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : secciones ? (
        <div className="space-y-8">
          {secciones.map((seccion) =>
            seccion.items.length === 0 ? null : (
              <section key={seccion.clave} aria-labelledby={`grupo-${seccion.clave}`} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 id={`grupo-${seccion.clave}`} className="text-base font-semibold">
                    {seccion.etiqueta}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setGrupoActivo(seccion.clave)}
                    className="rounded-md px-1 py-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                  >
                    Ver {seccion.items.length}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {seccion.items.map((ej) => (
                    <EjercicioCard key={ej.id} ejercicio={ej} />
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300 sm:grid-cols-3">
          {filtrados.map((ej) => (
            <EjercicioCard key={ej.id} ejercicio={ej} />
          ))}
        </div>
      )}
    </div>
  );
}
