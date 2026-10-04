"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Panel } from "@/components/admin/ui/Panel";
import { EstadoVacio } from "@/components/admin/ui/varios";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";

interface PuntoHora {
  hora: number;
  llegadas: number;
}

const config = {
  llegadas: { label: "Llegadas", color: "var(--primary)" },
} satisfies ChartConfig;

/** 6 → "6 a. m.", 18 → "6 p. m." */
function etiquetaHora(hora: number): string {
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${h12} ${hora < 12 ? "a. m." : "p. m."}`;
}

function TooltipHora({ active, payload }: { active?: boolean; payload?: { payload: PuntoHora }[] }) {
  const punto = active ? payload?.[0]?.payload : undefined;
  if (!punto) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
      <p className="font-medium text-foreground">
        {etiquetaHora(punto.hora)} – {etiquetaHora((punto.hora + 1) % 24)}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{punto.llegadas}</span> llegada
        {punto.llegadas === 1 ? "" : "s"} en 30 días
      </p>
    </div>
  );
}

/**
 * Hora de llegada (primer ejercicio del día) en los últimos 30 días. La
 * hora pico va en el color de marca y el resto atenuado (énfasis).
 */
export function GraficoHorasPico({ horas }: { horas: PuntoHora[] }) {
  const conDatos = horas.filter((h) => h.llegadas > 0);
  const desde = Math.min(5, ...conDatos.map((h) => h.hora));
  const hasta = Math.max(21, ...conDatos.map((h) => h.hora));
  const visibles = horas.slice(desde, hasta + 1);
  const pico = conDatos.reduce<PuntoHora | null>((max, h) => (!max || h.llegadas > max.llegadas ? h : max), null);

  return (
    <Panel
      titulo="Horas pico"
      descripcion={
        pico
          ? `Más llegadas entre ${etiquetaHora(pico.hora)} y ${etiquetaHora((pico.hora + 1) % 24)} · últimos 30 días`
          : "Hora del primer ejercicio del día · últimos 30 días"
      }
      className="h-full"
    >
      {!pico ? (
        <EstadoVacio titulo="Sin llegadas registradas" descripcion="Aparecerán cuando los usuarios registren ejercicios." />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
          <BarChart data={visibles} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="hora"
              tickFormatter={(h: number) => etiquetaHora(h).replace(" a. m.", "a").replace(" p. m.", "p")}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={1}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<TooltipHora />} />
            <Bar dataKey="llegadas" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
              {visibles.map((h) => (
                <Cell
                  key={h.hora}
                  fill="var(--color-llegadas)"
                  fillOpacity={h.hora === pico.hora ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}
