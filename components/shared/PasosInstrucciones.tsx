import { ListChecks } from "lucide-react";

import { separarPasos } from "@/lib/utils/instrucciones";

/**
 * Instrucciones como pasos numerados en línea de tiempo: una idea por paso,
 * fácil de seguir con el teléfono en la mano durante el entrenamiento.
 */
export function PasosInstrucciones({ texto }: { texto: string | null }) {
  const pasos = separarPasos(texto);
  if (pasos.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="titulo-pasos">
      <div className="flex items-center justify-between">
        <h2 id="titulo-pasos" className="flex items-center gap-2 text-base font-semibold">
          <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
          Cómo hacerlo
        </h2>
        <span className="text-xs text-muted-foreground">
          {pasos.length} {pasos.length === 1 ? "paso" : "pasos"}
        </span>
      </div>

      <ol className="space-y-0">
        {pasos.map((paso, i) => {
          const ultimo = i === pasos.length - 1;
          return (
            <li
              key={i}
              className="relative flex gap-4 pb-5 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            >
              {/* Línea que une los pasos */}
              {!ultimo && (
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-9 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-primary/40 to-border"
                />
              )}
              <span
                aria-hidden="true"
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/20"
              >
                {i + 1}
              </span>
              <p className="pt-1 text-[15px] leading-relaxed text-foreground/90">
                <span className="sr-only">Paso {i + 1}: </span>
                {paso}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
