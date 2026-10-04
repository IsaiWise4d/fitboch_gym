"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame, RefreshCw, UserX, CalendarClock, CalendarX2 } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { AvatarIniciales, BotonWhatsApp, EstadoVacio } from "@/components/admin/ui/varios";
import { Button } from "@/components/ui/button";
import type { DatosPanel, FilaAtencion } from "@/lib/admin/panel";
import { cn } from "@/lib/utils";

type Pestana = "porVencer" | "vencidasRecientes" | "rachaEnRiesgo" | "inactivos";

const PESTANAS: {
  valor: Pestana;
  etiqueta: string;
  icono: typeof Flame;
  tono: string;
  vacio: string;
  renovar: boolean;
  mensaje: (nombre: string, fila: FilaAtencion) => string;
}[] = [
  {
    valor: "porVencer",
    etiqueta: "Por vencer",
    icono: CalendarClock,
    tono: "text-warning",
    vacio: "Ninguna membresía vence en los próximos 7 días.",
    renovar: true,
    mensaje: (nombre, fila) =>
      `Hola ${nombre}, te escribimos de FitBoch: tu membresía ${fila.detalle.toLowerCase()}. ¿Quieres que la renovemos?`,
  },
  {
    valor: "vencidasRecientes",
    etiqueta: "Vencidas",
    icono: CalendarX2,
    tono: "text-error",
    vacio: "No hay membresías vencidas en los últimos 30 días.",
    renovar: true,
    mensaje: (nombre) =>
      `Hola ${nombre}, tu membresía de FitBoch venció. ¡Te esperamos de vuelta! ¿Te ayudamos a renovarla?`,
  },
  {
    valor: "rachaEnRiesgo",
    etiqueta: "Racha en riesgo",
    icono: Flame,
    tono: "text-orange-400",
    vacio: "Nadie está a punto de perder su racha hoy.",
    renovar: false,
    mensaje: (nombre) =>
      `Hola ${nombre}, ¡vas muy bien con tu racha en FitBoch! Hoy es clave para no perderla, te esperamos.`,
  },
  {
    valor: "inactivos",
    etiqueta: "Sin entrenar",
    icono: UserX,
    tono: "text-muted-foreground",
    vacio: "Todos los miembros vigentes entrenaron en la última semana.",
    renovar: false,
    mensaje: (nombre) =>
      `Hola ${nombre}, te extrañamos en FitBoch. ¿Todo bien? Cuando quieras retomamos tu rutina.`,
  },
];

/** Bandeja de seguimiento: quién necesita una llamada, un mensaje o una renovación. */
export function ListaAtencion({ atencion }: { atencion: DatosPanel["atencion"] }) {
  // Abre en la primera pestaña con pendientes.
  const [pestana, setPestana] = useState<Pestana>(
    () => PESTANAS.find((p) => atencion[p.valor].length > 0)?.valor ?? "porVencer"
  );
  const actual = PESTANAS.find((p) => p.valor === pestana)!;
  const filas = atencion[pestana];
  const Icono = actual.icono;

  return (
    <Panel
      titulo="Requieren atención"
      descripcion="Contacta o renueva sin salir del panel"
      acciones={
        <SelectorSegmentado
          etiqueta="Tipo de seguimiento"
          opciones={PESTANAS.map((p) => ({
            valor: p.valor,
            etiqueta: p.etiqueta,
            cantidad: atencion[p.valor].length,
          }))}
          valor={pestana}
          onCambio={setPestana}
          className="max-w-full overflow-x-auto scrollbar-none"
        />
      }
      sinPadding
      className="h-full"
    >
      {filas.length === 0 ? (
        <EstadoVacio icono={<Icono />} titulo="Todo en orden" descripcion={actual.vacio} />
      ) : (
        <ul className="max-h-[380px] divide-y divide-border overflow-y-auto border-t border-border">
          {filas.map((fila) => {
            const primerNombre = fila.nombre.split(" ")[0];
            return (
              <li key={fila.usuarioId} className="group flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-white/[0.02]">
                <AvatarIniciales nombre={fila.nombre} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/usuarios/${fila.usuarioId}`}
                    className="block truncate text-sm font-medium text-foreground hover:underline hover:underline-offset-4"
                  >
                    {fila.nombre}
                  </Link>
                  <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Icono className={cn("size-3.5 shrink-0", actual.tono)} aria-hidden="true" />
                    <span className="truncate">
                      {fila.detalle}
                      {fila.extra && <span className="text-muted-foreground/70"> · {fila.extra}</span>}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <BotonWhatsApp
                    telefono={fila.telefono}
                    nombre={fila.nombre}
                    mensaje={actual.mensaje(primerNombre, fila)}
                  />
                  {actual.renovar ? (
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/usuarios/${fila.usuarioId}?renovar=1`} />}
                    >
                      <RefreshCw aria-hidden="true" />
                      Renovar
                    </Button>
                  ) : (
                    <Link
                      href={`/admin/usuarios/${fila.usuarioId}`}
                      aria-label={`Ver ficha de ${fila.nombre}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
