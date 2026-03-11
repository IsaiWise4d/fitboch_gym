"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Coffee } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parsearDiasRutina, indiceHoy } from "@/lib/utils/parsear-rutina";

interface Props {
  textoRutina: string;
}

export function RutinaDiaria({ textoRutina }: Props) {
  const dias = parsearDiasRutina(textoRutina);
  const [indice, setIndice] = useState(() => indiceHoy(dias.length));

  const ir = useCallback(
    (dir: -1 | 1) => {
      setIndice((prev) => {
        const next = prev + dir;
        if (next < 0) return dias.length - 1;
        if (next >= dias.length) return 0;
        return next;
      });
    },
    [dias.length]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "ArrowRight") ir(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ir]);

  if (dias.length === 0) return null;

  const dia = dias[indice];
  const hoyIdx = indiceHoy(dias.length);
  const esHoy = indice === hoyIdx;
  // Mapear número de día del plan al nombre: 1=Lunes, 2=Martes... 7=Domingo
  const NOMBRE_DIA_PLAN = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const nombreDia = NOMBRE_DIA_PLAN[dia.numero] || `Día ${dia.numero}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">
            {esHoy ? "Rutina de hoy" : nombreDia}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {nombreDia} · Día {dia.numero}/7
        </span>
      </div>

      <div
        className="rounded-xl border border-border bg-surface overflow-hidden"
      >
        {/* Header del día */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-border">
          <button
            onClick={() => ir(-1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-center flex-1 min-w-0 px-2">
            <p className="text-sm font-semibold text-white">
              {dia.titulo}
            </p>
            {esHoy && (
              <span className="text-[10px] text-primary font-medium">HOY</span>
            )}
          </div>

          <button
            onClick={() => ir(1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido: tabla o descanso */}
        <div className="p-3">
          {dia.esDescanso ? (
            <DescansoCard grupo={dia.grupo} />
          ) : (
            <TablaEjercicios tablaMd={dia.tablaMd!} />
          )}
        </div>

        {/* Indicadores de puntos */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {dias.map((d, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === indice
                  ? "w-4 bg-primary"
                  : i === hoyIdx
                    ? "w-1.5 bg-primary/40"
                    : d.esDescanso
                      ? "w-1.5 bg-white/10"
                      : "w-1.5 bg-white/20"
              }`}
              aria-label={`Ir a día ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DescansoCard({ grupo }: { grupo: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
      <div className="rounded-full bg-white/5 p-4">
        <Coffee className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{grupo}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tu cuerpo necesita recuperarse para seguir creciendo 💪
        </p>
      </div>
    </div>
  );
}

function TablaEjercicios({ tablaMd }: { tablaMd: string }) {
  return (
    <div className="rutina-markdown text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border -mx-1">
              <table className="min-w-max w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 text-white">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-semibold text-[11px] uppercase tracking-wider border-b border-border whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-muted-foreground border-b border-border/50 whitespace-nowrap text-xs">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/5 transition-colors">{children}</tr>
          ),
          p: () => null,
          strong: ({ children }) => (
            <strong className="text-white font-semibold">{children}</strong>
          ),
        }}
      >
        {tablaMd}
      </ReactMarkdown>
    </div>
  );
}
