"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DiaMarkdown, SeccionMarkdown } from "@/lib/utils/markdown-secciones";

/** Lleva suavemente a un encabezado (su scroll-margin deja ver el índice fijo). */
function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Distancia desde arriba a partir de la cual una sección cuenta como "actual". */
const LINEA_ACTIVA = 140;

/**
 * Índice de secciones fijo bajo la cabecera: chips deslizables que llevan a
 * cada sección y resaltan en cuál va el usuario mientras hace scroll.
 */
export function IndiceSecciones({ secciones }: { secciones: SeccionMarkdown[] }) {
  const [activa, setActiva] = useState<string | null>(null);
  const barraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pendiente = 0;
    const calcular = () => {
      pendiente = 0;
      let actual: string | null = null;
      for (const { id } of secciones) {
        const elemento = document.getElementById(id);
        if (elemento && elemento.getBoundingClientRect().top <= LINEA_ACTIVA) actual = id;
      }
      setActiva(actual);
    };
    const alHacerScroll = () => {
      if (!pendiente) pendiente = window.requestAnimationFrame(calcular);
    };
    pendiente = window.requestAnimationFrame(calcular);
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      if (pendiente) window.cancelAnimationFrame(pendiente);
    };
  }, [secciones]);

  // Mantener visible el chip de la sección actual dentro de la barra.
  useEffect(() => {
    const barra = barraRef.current;
    const chip = barra?.querySelector<HTMLElement>(`[data-seccion="${activa}"]`);
    if (!barra || !chip) return;
    barra.scrollTo({
      left: chip.offsetLeft - barra.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activa]);

  if (secciones.length < 3) return null;

  return (
    <nav
      aria-label="Secciones del plan"
      className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-30 -mx-4 border-b border-border/60 bg-background/90 backdrop-blur-md"
    >
      <div ref={barraRef} className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-2.5">
        {secciones.map((seccion) => {
          const esActiva = seccion.id === activa;
          return (
            <button
              key={seccion.id}
              type="button"
              data-seccion={seccion.id}
              onClick={() => irA(seccion.id)}
              aria-current={esActiva ? "location" : undefined}
              className={cn(
                "max-w-[13rem] shrink-0 truncate rounded-full px-3.5 py-2 text-xs font-medium transition-all active:scale-95",
                esActiva
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {seccion.titulo}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Fila L M X J V S D: salta directo al día de la rutina. */
export function AccesosDias({ dias }: { dias: DiaMarkdown[] }) {
  if (dias.length < 2) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Ir a un día</p>
      <div className="grid grid-cols-7 gap-1.5">
        {dias.slice(0, 7).map((dia) => (
          <button
            key={dia.id}
            type="button"
            onClick={() => irA(dia.id)}
            aria-label={`${dia.diaSemana ?? `Día ${dia.numero}`}${dia.descanso ? " (descanso)" : ""}`}
            className={cn(
              "flex h-11 flex-col items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-90",
              dia.descanso
                ? "bg-white/5 text-muted-foreground"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            )}
          >
            {dia.letra}
            <span
              aria-hidden="true"
              className={cn("mt-0.5 h-1 w-1 rounded-full", dia.descanso ? "bg-transparent" : "bg-primary")}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Botón flotante para volver al inicio en textos largos. */
export function BotonVolverArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alHacerScroll = () => setVisible(window.scrollY > 900);
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => window.removeEventListener("scroll", alHacerScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-lg shadow-black/40 backdrop-blur-md transition-transform animate-in fade-in zoom-in-75 active:scale-90"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
