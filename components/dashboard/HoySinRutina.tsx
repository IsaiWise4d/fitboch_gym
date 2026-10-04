import Link from "next/link";
import { ArrowRight, Dumbbell, Lock, Sparkles } from "lucide-react";

interface HoySinRutinaProps {
  tieneMembresia: boolean;
  /** El gimnasio habilitó la generación de la rutina. */
  rutinaDisponible: boolean;
}

/**
 * Lugar de "Entrenamiento de hoy" cuando aún no hay rutina visible: explica
 * por qué y qué hacer, para que la pantalla de inicio nunca quede vacía.
 */
export function HoySinRutina({ tieneMembresia, rutinaDisponible }: HoySinRutinaProps) {
  if (tieneMembresia && rutinaDisponible) {
    return (
      <section aria-label="Entrenamiento de hoy" className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Entrenamiento de hoy
        </h2>
        <Link
          href="/rutina"
          className="group block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-surface p-5 transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-bold leading-snug">Crea tu rutina personalizada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Responde unas preguntas y la IA arma tu plan de entrenamiento en un minuto.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Empezar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      </section>
    );
  }

  const Icono = tieneMembresia ? Dumbbell : Lock;
  return (
    <section aria-label="Entrenamiento de hoy" className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Entrenamiento de hoy
      </h2>
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
          <Icono className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {tieneMembresia ? "Tu rutina aún no está habilitada" : "Tu rutina aparecerá aquí"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {tieneMembresia
              ? "El gimnasio debe habilitarla. Mientras tanto, puedes registrar tus ejercicios abajo."
              : "Necesitas una membresía activa para ver tu entrenamiento del día."}
          </p>
        </div>
      </div>
    </section>
  );
}
