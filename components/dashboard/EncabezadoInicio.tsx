import Link from "next/link";

import { InicioFrase } from "./InicioFrase";

interface EncabezadoInicioProps {
  nombre: string;
  apellido: string | null;
  fraseInicial: string;
  semilla?: string | null;
}

const TZ = "America/Bogota";

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora en Bogotá. */
function saludoSegunHora(): string {
  const hora = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(
      new Date()
    )
  );
  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fechaDeHoy(): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

/** Saludo personal, fecha de hoy y acceso al perfil (avatar con iniciales). */
export function EncabezadoInicio({ nombre, apellido, fraseInicial, semilla }: EncabezadoInicioProps) {
  const primerNombre = nombre.split(" ")[0];
  const iniciales = `${nombre.charAt(0)}${apellido?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground first-letter:uppercase">
          {fechaDeHoy()}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">
          {saludoSegunHora()}, <span className="text-primary">{primerNombre}</span>
        </h1>
        <InicioFrase initialFrase={fraseInicial} seed={semilla} />
      </div>
      <Link
        href="/perfil"
        aria-label="Ir a mi perfil"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-primary/15 transition-transform active:scale-90"
      >
        {iniciales || "?"}
      </Link>
    </header>
  );
}
