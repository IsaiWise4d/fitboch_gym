import Link from "next/link";
import { AlertCircle, AlertTriangle, Apple, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EstadoMembresia } from "@/types/app";

interface Aviso {
  id: string;
  icono: LucideIcon;
  tono: "critico" | "alerta" | "info";
  titulo: string;
  detalle: string;
  href?: string;
}

const TONOS = {
  critico: { caja: "border-error/30 bg-error/10", icono: "bg-error/15 text-error" },
  alerta: { caja: "border-warning/30 bg-warning/10", icono: "bg-warning/15 text-warning" },
  info: { caja: "border-primary/30 bg-primary/10", icono: "bg-primary/15 text-primary" },
};

interface AvisosInicioProps {
  estadoMembresia: EstadoMembresia;
  diasRestantes: number | null;
  /** El gimnasio habilitó el plan nutricional pero aún no se generó. */
  planNutricionalPendiente: boolean;
}

/**
 * Solo lo que requiere atención, de lo más urgente a lo menos. Si no hay
 * nada pendiente no se muestra nada (la pantalla queda limpia).
 */
export function AvisosInicio({
  estadoMembresia,
  diasRestantes,
  planNutricionalPendiente,
}: AvisosInicioProps) {
  const avisos: Aviso[] = [];

  if (estadoMembresia === "sin_membresia" || estadoMembresia === "vencida") {
    avisos.push({
      id: "membresia",
      icono: AlertCircle,
      tono: "critico",
      titulo: "No tienes una membresía activa",
      detalle: "Habla con el gimnasio para renovarla y seguir con tu plan.",
    });
  } else if (estadoMembresia === "por_vencer" && diasRestantes !== null) {
    avisos.push({
      id: "membresia",
      icono: AlertTriangle,
      tono: "alerta",
      titulo:
        diasRestantes <= 0
          ? "Tu membresía vence hoy"
          : diasRestantes === 1
            ? "Tu membresía vence mañana"
            : `Tu membresía vence en ${diasRestantes} días`,
      detalle: "Renuévala en el gimnasio para no perder tu rutina.",
    });
  }

  if (planNutricionalPendiente) {
    avisos.push({
      id: "nutricion",
      icono: Apple,
      tono: "info",
      titulo: "Tu plan de alimentación está disponible",
      detalle: "Genéralo en un minuto con tus preferencias.",
      href: "/plan-nutricional",
    });
  }

  if (avisos.length === 0) return null;

  return (
    <div className="space-y-2">
      {avisos.map((aviso) => {
        const Icono = aviso.icono;
        const tono = TONOS[aviso.tono];
        const contenido = (
          <>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tono.icono)}>
              <Icono className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{aviso.titulo}</span>
              <span className="block text-xs text-muted-foreground">{aviso.detalle}</span>
            </span>
            {aviso.href && (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
          </>
        );
        const clases = cn(
          "flex items-center gap-3 rounded-2xl border p-3 animate-in fade-in slide-in-from-top-1 duration-500",
          tono.caja
        );
        return aviso.href ? (
          <Link key={aviso.id} href={aviso.href} className={cn(clases, "transition-transform active:scale-[0.99]")}>
            {contenido}
          </Link>
        ) : (
          <div key={aviso.id} role="status" className={clases}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}
