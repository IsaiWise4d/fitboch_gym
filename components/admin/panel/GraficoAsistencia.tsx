"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Panel } from "@/components/admin/ui/Panel";
import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { PuntoAsistencia } from "@/lib/admin/panel";
import { fechaConDia, fechaCorta, formatoNumero } from "@/lib/utils/formato";

const RANGOS = [
  { valor: "7", etiqueta: "7 días" },
  { valor: "30", etiqueta: "30 días" },
  { valor: "90", etiqueta: "90 días" },
] as const;

type Rango = (typeof RANGOS)[number]["valor"];

const config = {
  usuarios: { label: "Usuarios", color: "var(--primary)" },
} satisfies ChartConfig;

function TooltipAsistencia({
  active,
  payload,
  hoy,
}: {
  active?: boolean;
  payload?: { payload: PuntoAsistencia }[];
  hoy: string;
}) {
  const punto = active ? payload?.[0]?.payload : undefined;
  if (!punto) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
      <p className="font-medium text-foreground capitalize">{fechaConDia(punto.fecha)}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{punto.usuarios}</span>{" "}
        usuario{punto.usuarios === 1 ? "" : "s"} entrenaron
        {punto.domingo ? " · domingo" : punto.fecha === hoy ? " · día en curso" : ""}
      </p>
    </div>
  );
}

/** Usuarios distintos que entrenaron cada día (7/30/90 días). */
export function GraficoAsistencia({ datos, hoy }: { datos: PuntoAsistencia[]; hoy: string }) {
  const [rango, setRango] = useState<Rango>("30");
  const visibles = datos.slice(-Number(rango));

  // El resumen ignora domingos y el día en curso (aún incompleto).
  const habiles = visibles.filter((p) => !p.domingo && p.fecha !== hoy);
  const promedio = habiles.length
    ? habiles.reduce((t, p) => t + p.usuarios, 0) / habiles.length
    : null;
  const pico = habiles.reduce<PuntoAsistencia | null>(
    (max, p) => (!max || p.usuarios > max.usuarios ? p : max),
    null
  );

  return (
    <Panel
      titulo="Asistencia diaria"
      descripcion={
        promedio === null
          ? "Usuarios distintos que registraron ejercicios cada día"
          : `Promedio ${formatoNumero(promedio, 1)} por día hábil${
              pico && pico.usuarios > 0 ? ` · pico ${pico.usuarios} el ${fechaConDia(pico.fecha)}` : ""
            }`
      }
      acciones={
        <SelectorSegmentado
          etiqueta="Rango de días"
          opciones={RANGOS}
          valor={rango}
          onCambio={setRango}
        />
      }
      className="h-full"
    >
      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <BarChart data={visibles} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="fecha"
            tickFormatter={fechaCorta}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<TooltipAsistencia hoy={hoy} />} />
          <Bar dataKey="usuarios" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
            {visibles.map((p) => (
              <Cell
                key={p.fecha}
                fill={p.domingo ? "var(--estado-desactivado)" : "var(--color-usuarios)"}
                fillOpacity={p.fecha === hoy ? 0.5 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-primary" />
          Día hábil
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-estado-desactivado" />
          Domingo (no cuenta para racha)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-[2px] bg-primary/50" />
          Hoy, en curso
        </span>
      </div>

      <table className="sr-only">
        <caption>Usuarios que entrenaron por día, últimos {rango} días</caption>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.fecha}>
              <th scope="row">{fechaConDia(p.fecha)}</th>
              <td>{p.usuarios}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
