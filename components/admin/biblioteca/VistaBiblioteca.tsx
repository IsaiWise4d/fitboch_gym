"use client";

import { startTransition, useMemo, useOptimistic, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Eye, EyeOff, LayoutGrid, List, Loader2, Pencil, Plus, SearchX, X } from "lucide-react";

import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { actualizarUrl } from "@/components/admin/ui/url";
import { EstadoVacio } from "@/components/admin/ui/varios";
import { CampoBusqueda } from "@/components/shared/Filtros";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import type { IconoRespaldo } from "@/components/shared/iconos";
import { Button } from "@/components/ui/button";
import {
  etiquetaCatalogo,
  filtrarBiblioteca,
  parsearFiltroEstadoBiblioteca,
  resumirBiblioteca,
  type FiltroEstadoBiblioteca,
  type ItemBiblioteca,
  type OrdenBiblioteca,
} from "@/lib/admin/biblioteca";
import { cn } from "@/lib/utils";
import { normalizarTexto } from "@/lib/utils/texto";

export interface TextosBiblioteca {
  /** "ejercicio" */
  singular: string;
  /** "ejercicios" */
  plural: string;
  /** "Nuevo ejercicio" */
  nuevo: string;
  /** Texto del filtro por categoría ("Grupo muscular"). */
  categoria: string;
}

interface VistaBibliotecaProps {
  items: ItemBiblioteca[];
  /** Opciones del filtro principal (sin "Todas"). */
  categorias: string[];
  textos: TextosBiblioteca;
  /** Ruta PUT que recibe { id, activo }. */
  endpoint: string;
  iconoDe: (item: ItemBiblioteca) => IconoRespaldo;
  conUso?: boolean;
  onNuevo: () => void;
  onEditar: (id: string) => void;
  onDuplicar: (id: string) => void;
}

const ETIQUETA_ESTADO: Record<FiltroEstadoBiblioteca, string> = {
  todos: "Todos",
  visibles: "Visibles",
  ocultos: "Ocultos",
  sin_media: "Sin imagen ni video",
};

const ETIQUETA_MEDIA: Record<string, string> = {
  imagen: "Imagen",
  video: "Video",
  youtube: "YouTube",
  embed: "Enlace",
};

function BotonIcono({
  etiqueta,
  onClick,
  children,
  disabled,
  className,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-white/[0.07] hover:text-foreground disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Plantilla de biblioteca del admin (ejercicios y calentamientos): filtros
 * en la URL, cuadrícula o lista, y acciones rápidas por elemento.
 */
export function VistaBiblioteca({
  items,
  categorias,
  textos,
  endpoint,
  iconoDe,
  conUso = false,
  onNuevo,
  onEditar,
  onDuplicar,
}: VistaBibliotecaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria") ?? "todas";
  const estado = parsearFiltroEstadoBiblioteca(searchParams.get("estado"));
  const orden: OrdenBiblioteca = conUso && searchParams.get("orden") === "uso" ? "uso" : "nombre";
  const vista = searchParams.get("vista") === "lista" ? "lista" : "cuadricula";
  const [busqueda, setBusqueda] = useState(() => searchParams.get("q") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  // Visibilidad optimista: el cambio se ve al instante y se confirma con refresh.
  const [visibilidad, fijarVisibilidad] = useOptimistic(
    items,
    (actuales: ItemBiblioteca[], cambio: { id: string; activo: boolean }) =>
      actuales.map((i) => (i.id === cambio.id ? { ...i, activo: cambio.activo } : i))
  );

  const resumen = useMemo(() => resumirBiblioteca(visibilidad), [visibilidad]);
  const visibles = useMemo(
    () => filtrarBiblioteca(visibilidad, { q: busqueda, categoria, estado, orden }),
    [visibilidad, busqueda, categoria, estado, orden]
  );

  function alternar(item: ItemBiblioteca) {
    setError(null);
    setCambiando(item.id);
    startTransition(async () => {
      fijarVisibilidad({ id: item.id, activo: !item.activo });
      try {
        const res = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, activo: !item.activo }),
        });
        if (!res.ok) setError(`No se pudo cambiar la visibilidad de «${item.nombre}».`);
        else router.refresh();
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      } finally {
        setCambiando(null);
      }
    });
  }

  const hayFiltros = busqueda.trim() || categoria !== "todas" || estado !== "todos";

  function limpiarFiltros() {
    setBusqueda("");
    actualizarUrl({ q: null, categoria: null, estado: null });
  }

  const acciones = (item: ItemBiblioteca) => (
    <>
      <BotonIcono etiqueta={`Editar ${item.nombre}`} onClick={() => onEditar(item.id)}>
        <Pencil className="size-4" />
      </BotonIcono>
      <BotonIcono etiqueta={`Duplicar ${item.nombre}`} onClick={() => onDuplicar(item.id)}>
        <Copy className="size-4" />
      </BotonIcono>
      <BotonIcono
        etiqueta={item.activo ? "Ocultar a los usuarios" : "Mostrar a los usuarios"}
        onClick={() => alternar(item)}
        disabled={cambiando === item.id}
        className={item.activo ? undefined : "text-warning hover:text-warning"}
      >
        {cambiando === item.id ? (
          <Loader2 className="size-4 animate-spin" />
        ) : item.activo ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
      </BotonIcono>
    </>
  );

  return (
    <div className="space-y-4">
      <SelectorSegmentado
        etiqueta={`Filtrar por ${textos.categoria.toLowerCase()}`}
        opciones={[
          { valor: "todas", etiqueta: "Todas", cantidad: resumen.total },
          ...categorias.map((c) => ({
            valor: c,
            etiqueta: etiquetaCatalogo(c),
            cantidad: resumen.porCategoria[normalizarTexto(c)] ?? 0,
          })),
        ]}
        valor={categoria}
        onCambio={(c) => actualizarUrl({ categoria: c === "todas" ? null : c })}
        className="max-w-full overflow-x-auto scrollbar-none"
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <SelectorSegmentado
          etiqueta="Filtrar por estado"
          opciones={(["todos", "visibles", "ocultos", "sin_media"] as const).map((e) => ({
            valor: e,
            etiqueta: ETIQUETA_ESTADO[e],
            cantidad:
              e === "todos" ? resumen.total : e === "visibles" ? resumen.visibles : e === "ocultos" ? resumen.ocultos : resumen.sinMedia,
          }))}
          valor={estado}
          onCambio={(e) => actualizarUrl({ estado: e === "todos" ? null : e })}
          className="max-w-full self-start overflow-x-auto scrollbar-none"
        />
        <div className="flex flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <CampoBusqueda
              valor={busqueda}
              onCambio={(v) => {
                setBusqueda(v);
                actualizarUrl({ q: v.trim() || null });
              }}
              placeholder={`Buscar ${textos.singular} por nombre…`}
            />
          </div>
          {conUso && (
            <SelectorSegmentado
              etiqueta="Ordenar"
              opciones={[
                { valor: "nombre", etiqueta: "A–Z" },
                { valor: "uso", etiqueta: "Más usados" },
              ]}
              valor={orden}
              onCambio={(o) => actualizarUrl({ orden: o === "uso" ? "uso" : null })}
              className="hidden shrink-0 sm:inline-flex"
            />
          )}
          <div role="group" aria-label="Vista" className="hidden shrink-0 items-center rounded-lg border border-border bg-background/60 p-0.5 md:inline-flex">
            {(
              [
                ["cuadricula", "Cuadrícula", LayoutGrid],
                ["lista", "Lista", List],
              ] as const
            ).map(([valor, etiqueta, Icono]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={vista === valor}
                title={etiqueta}
                aria-label={etiqueta}
                onClick={() => actualizarUrl({ vista: valor === "lista" ? "lista" : null })}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150",
                  vista === valor ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icono className="size-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso">
            <X className="size-4" />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {visibles.length === resumen.total
          ? `${resumen.total} ${resumen.total === 1 ? textos.singular : textos.plural}`
          : `Mostrando ${visibles.length} de ${resumen.total} ${textos.plural}`}
      </p>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel">
          {resumen.total === 0 ? (
            <EstadoVacio
              titulo={`Aún no hay ${textos.plural}`}
              descripcion={`Crea el primero; los usuarios lo verán en su biblioteca apenas lo guardes.`}
              accion={
                <Button onClick={onNuevo}>
                  <Plus aria-hidden="true" />
                  {textos.nuevo}
                </Button>
              }
            />
          ) : (
            <EstadoVacio
              icono={<SearchX />}
              titulo="Nada coincide con los filtros"
              accion={
                hayFiltros ? (
                  <Button variant="outline" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      ) : vista === "cuadricula" ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visibles.map((item) => (
            <li
              key={item.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-panel transition-colors duration-150 hover:border-white/15",
                !item.activo && "border-dashed"
              )}
            >
              <button
                type="button"
                onClick={() => onEditar(item.id)}
                className="text-left"
                aria-label={`Editar ${item.nombre}`}
              >
                <MiniaturaMedia
                  key={item.media?.url ?? "sin-media"}
                  media={item.media}
                  alt=""
                  icono={iconoDe(item)}
                  conVideo={item.conVideo}
                  className={cn("aspect-[4/3] w-full", !item.activo && "opacity-40 grayscale")}
                />
              </button>
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {!item.activo && (
                  <span className="rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-medium text-warning backdrop-blur-sm">
                    Oculto
                  </span>
                )}
                {conUso && item.uso !== null && (
                  <span
                    className="rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm"
                    title="Registros de los usuarios en los últimos 30 días"
                  >
                    {item.uso} {item.uso === 1 ? "uso" : "usos"}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className={cn("line-clamp-2 text-sm leading-snug font-medium", !item.activo && "text-muted-foreground")}>
                  {item.nombre}
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.etiquetas.join(" · ")}</p>
              </div>
              <div className="flex items-center justify-end gap-0.5 border-t border-border px-1.5 py-1 opacity-100 transition-opacity duration-150 md:opacity-60 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                {acciones(item)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="h-10 pr-4 pl-5 font-medium">Nombre</th>
                  <th scope="col" className="px-4 font-medium">Nivel</th>
                  <th scope="col" className="px-4 font-medium">Media</th>
                  {conUso && <th scope="col" className="px-4 text-right font-medium">Usos 30 d</th>}
                  <th scope="col" className="px-4 font-medium">Estado</th>
                  <th scope="col" className="px-4 pr-3 text-right font-medium"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibles.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-white/[0.025]">
                    <td className="py-2 pr-4 pl-5">
                      <button type="button" onClick={() => onEditar(item.id)} className="flex items-center gap-3 text-left">
                        <MiniaturaMedia
                          key={item.media?.url ?? "sin-media"}
                          media={item.media}
                          alt=""
                          icono={iconoDe(item)}
                          distintivo={false}
                          className={cn("size-11 shrink-0 rounded-lg", !item.activo && "opacity-40 grayscale")}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground hover:underline hover:underline-offset-4">
                            {item.nombre}
                          </span>
                          <span className="block text-xs text-muted-foreground">{item.etiquetas.join(" · ")}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{etiquetaCatalogo(item.nivel)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {item.media ? ETIQUETA_MEDIA[item.media.tipo] : <span className="text-warning">Falta</span>}
                    </td>
                    {conUso && <td className="px-4 py-2 text-right tabular-nums">{item.uso ?? "—"}</td>}
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          item.activo ? "bg-estado-activa/15 text-success" : "bg-warning/15 text-warning"
                        )}
                      >
                        {item.activo ? "Visible" : "Oculto"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 pl-4">
                      <div className="flex items-center justify-end gap-0.5">{acciones(item)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

