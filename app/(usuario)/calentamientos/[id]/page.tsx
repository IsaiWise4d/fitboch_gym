import Link from "next/link";
import { ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VisorMedia } from "@/components/shared/VisorMedia";
import { PasosInstrucciones } from "@/components/shared/PasosInstrucciones";
import { IndicadorNivel } from "@/components/shared/IndicadorNivel";
import { ICONOS_RESPALDO, iconoDeCategoriaCalentamiento } from "@/components/shared/iconos";
import { etiquetaCategoriaCalentamiento } from "@/components/calentamientos/CalentamientoCard";
import { mediasCalentamiento } from "@/lib/utils/media";

export default async function CalentamientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Mismo orden que la lista (categoría, nombre) para que la posición
  // "2 de 6" coincida con el número de la tarjeta.
  const [{ data: calentamiento }, { data: todos }] = await Promise.all([
    supabase
      .from("calentamientos")
      .select("*")
      .eq("id", id)
      .eq("activo", true)
      .single(),
    supabase
      .from("calentamientos")
      .select("id, nombre, categoria")
      .eq("activo", true)
      .order("categoria")
      .order("nombre"),
  ]);
  if (!calentamiento) notFound();

  const zona = (todos ?? []).filter((c) => c.categoria === calentamiento.categoria);
  const indice = zona.findIndex((c) => c.id === calentamiento.id);
  const anterior = indice > 0 ? zona[indice - 1] : null;
  const siguiente = indice >= 0 && indice < zona.length - 1 ? zona[indice + 1] : null;
  const posicion = indice + 1;
  const esUltimo = indice >= 0 && !siguiente;

  const icono = iconoDeCategoriaCalentamiento(calentamiento.categoria);
  const IconoZona = ICONOS_RESPALDO[icono];
  const nombreZona = etiquetaCategoriaCalentamiento(calentamiento.categoria);

  return (
    <div className="space-y-6 p-4">
      <VisorMedia
        medias={mediasCalentamiento(calentamiento)}
        alt={`Demostración de ${calentamiento.nombre}`}
        hrefVolver="/calentamientos"
        etiquetaVolver="Volver a calentamientos"
        icono={icono}
      />

      <header className="space-y-4">
        {/* Progreso dentro de la zona */}
        {zona.length > 1 && indice >= 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">
                Calentamiento {posicion} de {zona.length}
              </span>
              <span className="text-muted-foreground">{nombreZona}</span>
            </div>
            <div
              className="flex gap-1"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={zona.length}
              aria-valuenow={posicion}
              aria-label={`Calentamiento ${posicion} de ${zona.length}`}
            >
              {zona.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < posicion ? "bg-primary" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <IconoZona className="h-3.5 w-3.5" aria-hidden="true" />
            {nombreZona}
          </span>
          <IndicadorNivel nivel={calentamiento.nivel} />
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{calentamiento.nombre}</h1>
        {calentamiento.descripcion && (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {calentamiento.descripcion}
          </p>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <PasosInstrucciones texto={calentamiento.instrucciones} />
      </div>

      {esUltimo && zona.length > 1 && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 animate-in fade-in">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-success">¡Último calentamiento!</p>
            <p className="text-xs text-muted-foreground">
              Al terminarlo, tu {nombreZona.toLowerCase()} estará listo para entrenar.
            </p>
          </div>
        </div>
      )}

      {/* Navegación guiada fija: anterior / siguiente */}
      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-2 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-1 pt-6">
        {anterior && (
          <Link
            href={`/calentamientos/${anterior.id}`}
            aria-label={`Anterior: ${anterior.nombre}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface transition-all hover:bg-surface-hover active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        {siguiente ? (
          <Link
            href={`/calentamientos/${siguiente.id}`}
            className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl bg-primary px-4 text-primary-foreground shadow-lg shadow-black/40 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-[11px] font-medium opacity-70">Siguiente</span>
              <span className="block truncate text-sm font-semibold">{siguiente.nombre}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground shadow-lg shadow-black/40 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Terminé, a entrenar
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
