"use client";

import { useState } from "react";

import { BarrasHorizontales } from "@/components/admin/reportes/BarrasHorizontales";
import { FranjaKpi } from "@/components/admin/ui/FranjaKpi";
import { Panel } from "@/components/admin/ui/Panel";
import { SelectorSegmentado } from "@/components/admin/ui/SelectorSegmentado";
import { EstadoVacio } from "@/components/admin/ui/varios";
import type { VistaReporte } from "@/lib/reportes/analisis";
import { cn } from "@/lib/utils";
import { fechaMedia, formatoPesos } from "@/lib/utils/formato";

type FiltroMovimiento = "todos" | "nuevas" | "vencen";

export function TabMembresias({ vista }: { vista: VistaReporte }) {
  const { resumen, membresias } = vista;
  const [filtro, setFiltro] = useState<FiltroMovimiento>("todos");

  // Movimientos de lib/reportes/mensual.ts: "Nueva / renovación",
  // "Vence en el mes" o "Nueva y vence en el mes".
  const nuevas = membresias.filter((m) => m.movimiento.startsWith("Nueva"));
  const vencen = membresias.filter((m) => m.movimiento !== "Nueva / renovación");
  const visibles = filtro === "nuevas" ? nuevas : filtro === "vencen" ? vencen : membresias;

  const porPlan = new Map<string, { cantidad: number; ingresos: number }>();
  for (const m of nuevas) {
    const acumulado = porPlan.get(m.plan) ?? { cantidad: 0, ingresos: 0 };
    acumulado.cantidad += 1;
    acumulado.ingresos += m.monto ?? 0;
    porPlan.set(m.plan, acumulado);
  }

  return (
    <div className="space-y-6">
      <FranjaKpi
        kpis={[
          { etiqueta: "Nuevas o renovadas", valor: resumen.membresiasNuevasMes, contexto: "creadas en el mes" },
          { etiqueta: "Vencen en el mes", valor: resumen.membresiasVencenMes, contexto: "fecha fin dentro del mes" },
          { etiqueta: "Ingresos del mes", valor: formatoPesos(resumen.ingresosMes), contexto: "monto de las nuevas" },
          { etiqueta: "Activas hoy", valor: resumen.membresiasActivas, tono: "exito" },
          { etiqueta: "Por vencer hoy", valor: resumen.membresiasPorVencer, tono: "advertencia" },
          { etiqueta: "Vencidas hoy", valor: resumen.membresiasVencidas, tono: "peligro", contexto: `${resumen.usuariosSinMembresia} sin membresía` },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel titulo="Nuevas por plan" descripcion="Cantidad e ingresos de las creadas en el mes" className="xl:col-span-4">
          {porPlan.size === 0 ? (
            <EstadoVacio titulo="Sin membresías nuevas" />
          ) : (
            <BarrasHorizontales
              filas={[...porPlan.entries()]
                .sort((a, b) => b[1].cantidad - a[1].cantidad)
                .map(([plan, v]) => ({
                  clave: plan,
                  etiqueta: plan,
                  valor: v.cantidad,
                  detalle: formatoPesos(v.ingresos),
                }))}
              className="space-y-0"
            />
          )}
        </Panel>

        <Panel
          titulo="Movimientos del mes"
          acciones={
            <SelectorSegmentado
              etiqueta="Tipo de movimiento"
              opciones={[
                { valor: "todos" as FiltroMovimiento, etiqueta: "Todos", cantidad: membresias.length },
                { valor: "nuevas" as FiltroMovimiento, etiqueta: "Nuevas", cantidad: nuevas.length },
                { valor: "vencen" as FiltroMovimiento, etiqueta: "Vencen", cantidad: vencen.length },
              ]}
              valor={filtro}
              onCambio={setFiltro}
            />
          }
          sinPadding
          className="xl:col-span-8"
        >
          {visibles.length === 0 ? (
            <EstadoVacio titulo="Sin movimientos" />
          ) : (
            <div className="max-h-[520px] overflow-auto border-t border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-panel">
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="h-9 pr-4 pl-5 font-medium">Usuario</th>
                    <th scope="col" className="px-4 font-medium">Plan</th>
                    <th scope="col" className="px-4 font-medium">Periodo</th>
                    <th scope="col" className="px-4 font-medium">Movimiento</th>
                    <th scope="col" className="px-4 pr-5 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibles.map((m, i) => (
                    <tr key={`${m.email}-${m.fechaFin}-${i}`} className="hover:bg-white/[0.025]">
                      <td className="py-2.5 pr-4 pl-5">
                        <span className="block text-foreground">{m.usuario}</span>
                        <span className="block text-xs text-muted-foreground">{m.email}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {m.plan}
                        <span className="block text-xs text-muted-foreground">{m.estado}</span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                        {fechaMedia(m.fechaInicio)} → {fechaMedia(m.fechaFin)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            m.movimiento.startsWith("Nueva") ? "bg-estado-activa/15 text-success" : "bg-estado-por-vencer/15 text-warning"
                          )}
                        >
                          {m.movimiento}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 pr-5 text-right tabular-nums">
                        {m.monto === null ? <span className="text-muted-foreground">—</span> : formatoPesos(m.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
