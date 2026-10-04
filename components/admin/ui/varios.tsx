import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import { enlaceWhatsApp } from "@/lib/admin/contacto";
import { iniciales } from "@/lib/admin/tipos";
import { cn } from "@/lib/utils";

/** Círculo con las iniciales del usuario. */
export function AvatarIniciales({
  nombre,
  className,
}: {
  nombre: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold tracking-wide text-foreground/80",
        className
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}

/**
 * Medidor de 0 a 1 (asistencia). La pista es un paso más claro del mismo
 * tono; la cifra va en texto aparte, nunca solo el color.
 */
export function MiniBarra({
  valor,
  className,
}: {
  valor: number | null;
  className?: string;
}) {
  if (valor === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }
  const porcentaje = Math.round(valor * 100);
  const tono = valor >= 0.8 ? "bg-estado-activa" : valor >= 0.5 ? "bg-primary" : "bg-estado-vencida";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
        <span className={cn("absolute inset-y-0 left-0 rounded-full", tono)} style={{ width: `${porcentaje}%` }} />
      </span>
      <span className="w-9 text-right text-xs tabular-nums text-foreground/90">{porcentaje}%</span>
    </span>
  );
}

/** Mensaje de vacío que explica qué aparecerá y por qué. */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: ReactNode;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}>
      {icono && <div className="text-muted-foreground [&_svg]:size-5">{icono}</div>}
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {descripcion && <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{descripcion}</p>}
      {accion && <div className="pt-2">{accion}</div>}
    </div>
  );
}

/** Botón de icono que abre WhatsApp; no se renderiza sin teléfono válido. */
export function BotonWhatsApp({
  telefono,
  mensaje,
  nombre,
  className,
}: {
  telefono: string | null;
  mensaje?: string;
  nombre: string;
  className?: string;
}) {
  const enlace = enlaceWhatsApp(telefono, mensaje);
  if (!enlace) return null;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      title={`Escribir a ${nombre} por WhatsApp`}
      aria-label={`Escribir a ${nombre} por WhatsApp`}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#25D366]",
        className
      )}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
    </a>
  );
}
