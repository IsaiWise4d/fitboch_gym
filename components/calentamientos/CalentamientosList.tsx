"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import type { Calentamiento } from "@/types/app";
import { mediaParaMiniatura, mediasCalentamiento } from "@/lib/utils/media";
import { CampoBusqueda, FiltrosChips, normalizarTexto } from "@/components/shared/Filtros";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import { iconoDeCategoriaCalentamiento } from "@/components/shared/iconos";
import { CalentamientoCard, etiquetaCategoriaCalentamiento } from "./CalentamientoCard";

const TODOS = "Todos";
const ORDEN_CATEGORIAS = ["tren_superior", "tren_inferior"];

export function CalentamientosList({ calentamientos }: { calentamientos: Calentamiento[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(TODOS);

  // Calentamientos agrupados por zona, en el mismo orden de la página de
  // detalle (así "Calentamiento 2 de 6" coincide con el número de la tarjeta).
  const zonas = useMemo(() => {
    const porZona = new Map<string, Calentamiento[]>();
    for (const c of calentamientos) {
      const lista = porZona.get(c.categoria);
      if (lista) lista.push(c);
      else porZona.set(c.categoria, [c]);
    }
    return [...porZona.entries()]
      .sort(([a], [b]) => {
        const ia = ORDEN_CATEGORIAS.indexOf(a);
        const ib = ORDEN_CATEGORIAS.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
      })
      .map(([categoria, items]) => ({ categoria, items }));
  }, [calentamientos]);

  const consulta = normalizarTexto(busqueda.trim());
  const coincide = (c: Calentamiento) =>
    normalizarTexto(c.nombre).includes(consulta) &&
    (categoriaActiva === TODOS || c.categoria === categoriaActiva);
  const total = calentamientos.filter(coincide).length;
  const hayFiltros = consulta !== "" || categoriaActiva !== TODOS;

  if (calentamientos.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aún no hay calentamientos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rutina guiada: empezar por el primero y seguir en orden */}
      {!hayFiltros && (
        <section aria-labelledby="titulo-guiado" className="space-y-3">
          <h2 id="titulo-guiado" className="text-sm font-medium text-muted-foreground">
            Calentamiento guiado
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {zonas.map(({ categoria, items }) => {
              const primero = items[0];
              return (
                <Link
                  key={categoria}
                  href={`/calentamientos/${primero.id}`}
                  className="group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-2xl border border-primary/30 p-3 transition-all active:scale-[0.98]"
                >
                  <MiniaturaMedia
                    media={mediaParaMiniatura(mediasCalentamiento(primero))}
                    alt=""
                    icono={iconoDeCategoriaCalentamiento(categoria)}
                    className="absolute inset-0"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10"
                  />
                  <div className="relative space-y-1">
                    <p className="text-sm font-bold text-white">
                      {etiquetaCategoriaCalentamiento(categoria)}
                    </p>
                    <p className="text-xs text-white/75">
                      {items.length} {items.length === 1 ? "ejercicio" : "ejercicios"}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Empezar
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Empieza por el primero y avanza con «Siguiente» hasta completar la zona.
          </p>
        </section>
      )}

      <div className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-30 -mx-4 space-y-3 bg-background/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <CampoBusqueda
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar calentamiento..."
        />
        <FiltrosChips
          etiqueta="Filtrar por zona"
          opciones={[
            { value: TODOS, label: "Todos", cantidad: calentamientos.length },
            ...zonas.map((z) => ({
              value: z.categoria,
              label: etiquetaCategoriaCalentamiento(z.categoria),
              cantidad: z.items.length,
            })),
          ]}
          activo={categoriaActiva}
          onCambio={setCategoriaActiva}
        />
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No se encontraron calentamientos con esos filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {zonas.map(({ categoria, items }) => {
            const visibles = items
              .map((c, i) => ({ c, orden: i + 1 }))
              .filter(({ c }) => coincide(c));
            if (visibles.length === 0) return null;
            return (
              <section key={categoria} aria-labelledby={`zona-${categoria}`} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 id={`zona-${categoria}`} className="text-base font-semibold">
                    {etiquetaCategoriaCalentamiento(categoria)}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {visibles.length} {visibles.length === 1 ? "ejercicio" : "ejercicios"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibles.map(({ c, orden }) => (
                    <CalentamientoCard key={c.id} calentamiento={c} orden={orden} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
