"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { BarrasHorizontales } from "@/components/admin/reportes/BarrasHorizontales";
import { FranjaKpi, type Kpi } from "@/components/admin/ui/FranjaKpi";
import { Panel } from "@/components/admin/ui/Panel";
import { EstadoVacio } from "@/components/admin/ui/varios";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { PuntoDiaReporte, VistaReporte } from "@/lib/reportes/analisis";
import type { ClasificacionActividad } from "@/lib/reportes/mensual";
import { variacion, type PuntoTendencia } from "@/lib/reportes/tendencia";
import {
  fechaConDia,
  formatoCompacto,
  formatoNumero,
  formatoPesos,
  formatoPorcentaje,
  mesCorto,
  mesLargo,
} from "@/lib/utils/formato";

export const CLASIFICACIONES: { clave: ClasificacionActividad; detalle: string; intensidad: number }[] = [
  { clave: "Muy activo", detalle: "80 % o más de asistencia", intensidad: 1 },
  { clave: "Activo", detalle: "Entre 50 % y 79 %", intensidad: 0.7 },
  { clave: "Irregular", detalle: "Menos de 50 %", intensidad: 0.45 },
  { clave: "Inactivo", detalle: "Ningún día hábil entrenado", intensidad: 0.25 },
  { clave: "Sin datos", detalle: "Sin días hábiles evaluables en el mes", intensidad: 0.12 },
];

const configDias = { usuarios: { label: "Usuarios", color: "var(--primary)" } } satisfies ChartConfig;
const configTendencia = { registros: { label: "Ejercicios", color: "var(--primary)" } } satisfies ChartConfig;

function TooltipDia({ active, payload }: { active?: boolean; payload?: { payload: PuntoDiaReporte }[] }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
      <p className="font-medium text-foreground capitalize">{fechaConDia(p.fecha)}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{p.usuarios}</span> usuarios ·{" "}
        <span className="tabular-nums">{p.registros}</span> ejercicios
      </p>
    </div>
  );
}

function TooltipTendencia({ active, payload }: { active?: boolean; payload?: { payload: PuntoTendencia }[] }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
      <p className="font-medium text-foreground">
        {mesLargo(p.mes)}
        {p.enCurso && <span className="font-normal text-warning"> · en curso</span>}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{formatoNumero(p.registros)}</span> ejercicios ·{" "}
        {p.membresiasNuevas} membresías · {p.usuariosNuevos} usuarios nuevos
      </p>
      <p className="mt-1 text-muted-foreground/80">Clic para abrir este mes</p>
    </div>
  );
}

export function TabResumen({
  vista,
  tendencia,
  onVerClasificacion,
}: {
  vista: VistaReporte;
  tendencia: PuntoTendencia[];
  onVerClasificacion: (clasificacion: ClasificacionActividad) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resumen, analisis } = vista;
  const indice = tendencia.findIndex((t) => t.mes === vista.mes);
  const actual = tendencia[indice];
  const anterior = indice > 0 ? tendencia[indice - 1] : undefined;
  const etiquetaDelta = vista.enCurso ? "vs mes anterior completo" : "vs mes anterior";

  const kpis: Kpi[] = [
    {
      etiqueta: "Usuarios activos",
      valor: resumen.usuariosConActividad,
      contexto: `de ${resumen.usuariosIncluidos} · ${resumen.usuariosSinActividad} sin entrenar`,
    },
    {
      etiqueta: "Asistencia promedio",
      valor: formatoPorcentaje(resumen.asistenciaPromedio),
      contexto: "días hábiles cumplidos",
    },
    {
      etiqueta: "Ejercicios registrados",
      valor: formatoNumero(resumen.ejercicios),
      delta: actual ? variacion(actual.registros, anterior?.registros) : null,
      etiquetaDelta,
    },
    {
      etiqueta: "Volumen levantado",
      valor: `${formatoCompacto(resumen.volumenKg)} kg`,
      contexto: `${formatoNumero(resumen.series)} series · ${formatoNumero(resumen.repeticiones)} reps`,
    },
    {
      etiqueta: "Membresías nuevas",
      valor: resumen.membresiasNuevasMes,
      delta: actual ? variacion(actual.membresiasNuevas, anterior?.membresiasNuevas) : null,
      etiquetaDelta,
    },
    {
      etiqueta: "Ingresos del mes",
      valor: formatoPesos(resumen.ingresosMes),
      delta: actual ? variacion(actual.ingresos, anterior?.ingresos) : null,
      etiquetaDelta,
    },
  ];

  const maxSemana = Math.max(...analisis.porDiaSemana.map((d) => d.asistencias));

  function irAMes(mes: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", mes);
    router.push(`/admin/reportes?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <FranjaKpi kpis={kpis} />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel
          titulo="Usuarios por día"
          descripcion={
            resumen.diaMasConcurrido
              ? `Día más concurrido: ${fechaConDia(resumen.diaMasConcurrido)} con ${resumen.usuariosDiaMasConcurrido} usuarios`
              : "Usuarios distintos que entrenaron cada día del mes"
          }
          className="xl:col-span-8"
        >
          <ChartContainer config={configDias} className="aspect-auto h-[260px] w-full">
            <BarChart data={analisis.porDia} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(f: string) => String(Number(f.slice(8)))}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={8}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
              <ChartTooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<TooltipDia />} />
              <Bar dataKey="usuarios" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {analisis.porDia.map((p) => (
                  <Cell
                    key={p.fecha}
                    fill={p.domingo ? "var(--estado-desactivado)" : "var(--color-usuarios)"}
                    fillOpacity={p.futuro ? 0 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel
          titulo="Clasificación de actividad"
          descripcion="Según asistencia en días hábiles · clic para ver los usuarios"
          className="xl:col-span-4"
        >
          <BarrasHorizontales
            filas={CLASIFICACIONES.map((c) => ({
              clave: c.clave,
              etiqueta: c.clave,
              valor: resumen.clasificacion[c.clave],
              detalle: c.detalle,
              intensidad: c.intensidad,
              onClick: () => onVerClasificacion(c.clave),
              titulo: `Ver usuarios: ${c.clave}`,
            }))}
          />
        </Panel>

        <Panel
          titulo="Tendencia de 6 meses"
          descripcion="Ejercicios registrados por mes · clic en una barra para abrir ese mes"
          className="xl:col-span-6"
        >
          <ChartContainer config={configTendencia} className="aspect-auto h-[220px] w-full">
            <BarChart data={tendencia} margin={{ top: 8, right: 4, left: -4, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" tickFormatter={mesCorto} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => formatoCompacto(v)}
              />
              <ChartTooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<TooltipTendencia />} />
              <Bar
                dataKey="registros"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
                className="cursor-pointer"
                onClick={(dato: { payload?: PuntoTendencia }) => {
                  if (dato.payload) irAMes(dato.payload.mes);
                }}
              >
                {tendencia.map((t) => (
                  <Cell
                    key={t.mes}
                    fill="var(--color-registros)"
                    fillOpacity={t.mes === vista.mes ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel titulo="Por día de la semana" descripcion="Días-usuario entrenados en el mes" className="xl:col-span-3">
          <BarrasHorizontales
            filas={analisis.porDiaSemana.map((d) => ({
              clave: d.dia,
              etiqueta: d.dia,
              valor: d.asistencias,
              intensidad: d.asistencias === maxSemana && maxSemana > 0 ? 1 : 0.4,
              titulo: `${d.registros} ejercicios`,
            }))}
            className="space-y-0"
          />
        </Panel>

        <Panel titulo="Destacados" className="xl:col-span-3">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Racha más alta del mes</dt>
              <dd className="mt-0.5 text-foreground">
                {resumen.rachaMasAlta > 0
                  ? `${resumen.rachaMasAlta} días · ${resumen.usuarioRachaMasAlta}`
                  : "Sin rachas"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Día de la semana más activo</dt>
              <dd className="mt-0.5 text-foreground">{resumen.diaSemanaMasActivo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Días promedio por usuario activo</dt>
              <dd className="mt-0.5 text-foreground">{formatoNumero(resumen.promedioDiasPorUsuarioActivo, 1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Con racha al cierre</dt>
              <dd className="mt-0.5 text-foreground">
                {resumen.usuariosConRachaAlCierre} usuario{resumen.usuariosConRachaAlCierre === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel titulo="Usuarios más constantes" descripcion="Por días entrenados" sinPadding className="xl:col-span-6">
          {resumen.topUsuarios.length === 0 ? (
            <EstadoVacio titulo="Nadie entrenó este mes" />
          ) : (
            <ol className="border-t border-border py-1">
              {resumen.topUsuarios.map((u, i) => (
                <li key={u.usuarioId}>
                  <Link
                    href={`/admin/usuarios/${u.usuarioId}`}
                    className="flex items-center gap-3 px-5 py-2 transition-colors duration-150 hover:bg-white/[0.03]"
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{u.nombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatoPorcentaje(u.asistencia)} asistencia</span>
                    <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                      {u.dias} días
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel titulo="Ejercicios más registrados" className="xl:col-span-6">
          {resumen.topEjercicios.length === 0 ? (
            <EstadoVacio titulo="Sin ejercicios registrados" />
          ) : (
            <BarrasHorizontales
              filas={resumen.topEjercicios.map((e) => ({
                clave: e.ejercicio,
                etiqueta: e.ejercicio,
                valor: e.registros,
              }))}
              className="space-y-0"
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
