import { CalendarDays, CreditCard } from "lucide-react";

import type { Membresia, Profile } from "@/types/app";
import { formatFechaColombia } from "@/lib/utils/fecha";
import { calcularEstadoMembresia, formatTipoPlan, getEstadoConfig } from "@/lib/utils/membresia";

interface PerfilEncabezadoProps {
  profile: Profile;
  membresia: Membresia | null;
}

/** Tarjeta superior del perfil: avatar, nombre, membresía y completitud. */
export function PerfilEncabezado({ profile, membresia }: PerfilEncabezadoProps) {
  const nombreCompleto = `${profile.nombre} ${profile.apellido ?? ""}`.trim();
  const iniciales = `${profile.nombre.charAt(0)}${profile.apellido?.charAt(0) ?? ""}`.toUpperCase();
  const estado = membresia ? calcularEstadoMembresia(membresia.fecha_fin) : null;
  const config = getEstadoConfig(estado?.estado ?? "sin_membresia");

  // Los mismos datos esenciales que marcan perfil_completo en PerfilForm.
  const esenciales = [
    profile.nombre?.trim(),
    profile.fecha_nacimiento,
    profile.peso_kg,
    profile.altura_cm,
    profile.genero,
  ];
  const completos = esenciales.filter(Boolean).length;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-surface to-surface p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinámica del avatar
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-background"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground ring-4 ring-background"
          >
            {iniciales || "?"}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mi perfil
          </p>
          <h1 className="truncate text-xl font-bold leading-tight">{nombreCompleto}</h1>
          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-xs font-medium">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {membresia ? `Plan ${formatTipoPlan(membresia.tipo_plan).toLowerCase()}` : "Membresía"}
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
          <span className="text-muted-foreground">{config.label}</span>
        </span>
        {membresia && estado && estado.estado !== "vencida" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Vence el {formatFechaColombia(membresia.fecha_fin, "d MMM")}
          </span>
        )}
      </div>

      {!profile.perfil_completo && (
        <div className="relative mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Completa tu perfil</span>
            <span className="text-muted-foreground">
              {completos} de {esenciales.length} datos
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={esenciales.length}
            aria-valuenow={completos}
            aria-label="Datos del perfil completados"
            className="h-2 overflow-hidden rounded-full bg-primary/15"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completos / esenciales.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Lo necesitamos para crear tu rutina y tu plan de alimentación.
          </p>
        </div>
      )}
    </section>
  );
}
