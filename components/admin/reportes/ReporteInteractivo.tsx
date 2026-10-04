"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, CreditCard, Dumbbell, LayoutGrid, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VistaReporte } from "@/lib/reportes/analisis";
import type { ClasificacionActividad } from "@/lib/reportes/mensual";
import type { PuntoTendencia } from "@/lib/reportes/tendencia";

import { TabAsistencia } from "./TabAsistencia";
import { TabEjercicios } from "./TabEjercicios";
import { TabMembresias } from "./TabMembresias";
import { TabResumen } from "./TabResumen";
import { TabUsuarios, type FiltroClasificacion } from "./TabUsuarios";

const PESTANAS = [
  { valor: "resumen", etiqueta: "Resumen", icono: LayoutGrid },
  { valor: "usuarios", etiqueta: "Usuarios", icono: Users },
  { valor: "asistencia", etiqueta: "Asistencia", icono: CalendarCheck },
  { valor: "ejercicios", etiqueta: "Ejercicios", icono: Dumbbell },
  { valor: "membresias", etiqueta: "Membresías", icono: CreditCard },
] as const;

type Pestana = (typeof PESTANAS)[number]["valor"];

function parsearPestana(valor: string | null): Pestana {
  return PESTANAS.some((p) => p.valor === valor) ? (valor as Pestana) : "resumen";
}

/** Pestañas del reporte; la activa vive en la URL (?tab=) sin ir al servidor. */
export function ReporteInteractivo({
  vista,
  tendencia,
}: {
  vista: VistaReporte;
  tendencia: PuntoTendencia[];
}) {
  const searchParams = useSearchParams();
  const pestana = parsearPestana(searchParams.get("tab"));
  const [clasificacion, setClasificacion] = useState<FiltroClasificacion>("todas");

  function cambiarPestana(valor: Pestana) {
    const params = new URLSearchParams(window.location.search);
    if (valor === "resumen") params.delete("tab");
    else params.set("tab", valor);
    const consulta = params.toString();
    window.history.replaceState(null, "", consulta ? `?${consulta}` : window.location.pathname);
  }

  function verClasificacion(c: ClasificacionActividad) {
    setClasificacion(c);
    cambiarPestana("usuarios");
  }

  return (
    <Tabs value={pestana} onValueChange={(v) => cambiarPestana(v as Pestana)} className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-1 overflow-x-auto border-b border-border pb-px scrollbar-none">
        {PESTANAS.map((p) => {
          const Icono = p.icono;
          return (
            <TabsTrigger
              key={p.valor}
              value={p.valor}
              className="h-10 flex-none px-3 data-active:text-foreground after:bg-primary"
            >
              <Icono aria-hidden="true" />
              {p.etiqueta}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="resumen">
        <TabResumen vista={vista} tendencia={tendencia} onVerClasificacion={verClasificacion} />
      </TabsContent>
      <TabsContent value="usuarios">
        <TabUsuarios usuarios={vista.usuarios} clasificacion={clasificacion} onClasificacion={setClasificacion} />
      </TabsContent>
      <TabsContent value="asistencia">
        <TabAsistencia usuarios={vista.usuarios} dias={vista.dias} />
      </TabsContent>
      <TabsContent value="ejercicios">
        <TabEjercicios vista={vista} />
      </TabsContent>
      <TabsContent value="membresias">
        <TabMembresias vista={vista} />
      </TabsContent>
    </Tabs>
  );
}
