"use client";

import { BarrasHorizontales } from "@/components/admin/reportes/BarrasHorizontales";
import { Panel } from "@/components/admin/ui/Panel";
import { EstadoVacio } from "@/components/admin/ui/varios";
import type { VistaReporte } from "@/lib/reportes/analisis";
import { fechaCorta, formatoCompacto, formatoNumero } from "@/lib/utils/formato";

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function TabEjercicios({ vista }: { vista: VistaReporte }) {
  const { ranking, analisis, detalleReciente, totalDetalle } = vista;
  const maxRegistros = Math.max(1, ...ranking.map((r) => r.registros));

  if (ranking.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel">
        <EstadoVacio titulo="Sin ejercicios registrados en el mes" descripcion="Cuando los usuarios registren entrenamientos aparecerán aquí." />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Panel
        titulo="Ranking de ejercicios"
        descripcion={`${ranking.length} ejercicios distintos registrados`}
        sinPadding
        className="xl:col-span-8"
      >
        <div className="max-h-[520px] overflow-auto border-t border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="h-9 pr-4 pl-5 font-medium">Ejercicio</th>
                <th scope="col" className="px-4 font-medium">Registros</th>
                <th scope="col" className="px-4 text-right font-medium">Usuarios</th>
                <th scope="col" className="px-4 text-right font-medium">Series</th>
                <th scope="col" className="px-4 text-right font-medium">Volumen</th>
                <th scope="col" className="px-4 pr-5 text-right font-medium">Peso máx.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranking.map((r) => (
                <tr key={`${r.ejercicio}-${r.grupoMuscular}`} className="hover:bg-white/[0.025]">
                  <td className="py-2.5 pr-4 pl-5">
                    <span className="block text-foreground">{r.ejercicio}</span>
                    <span className="block text-xs text-muted-foreground">{capitalizar(r.grupoMuscular || "Sin grupo")}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-24 rounded-full bg-white/[0.05]" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(3, (r.registros / maxRegistros) * 100)}%` }}
                        />
                      </span>
                      <span className="tabular-nums">{r.registros}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.usuarios}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.series}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatoCompacto(r.volumenKg)} kg</td>
                  <td className="px-4 py-2.5 pr-5 text-right tabular-nums">{formatoNumero(r.pesoMaximoKg, 1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel titulo="Grupos musculares" descripcion="Ejercicios registrados por grupo" className="xl:col-span-4">
        <BarrasHorizontales
          filas={analisis.porGrupo.map((g) => ({
            clave: g.grupo,
            etiqueta: capitalizar(g.grupo),
            valor: g.registros,
            detalle: `${formatoCompacto(g.volumenKg)} kg de volumen`,
          }))}
          className="space-y-0"
        />
      </Panel>

      <Panel
        titulo="Registros recientes del mes"
        descripcion={
          totalDetalle > detalleReciente.length
            ? `Mostrando los ${detalleReciente.length} más recientes de ${formatoNumero(totalDetalle)} · descarga el Excel para el detalle completo`
            : `${totalDetalle} registros`
        }
        sinPadding
        className="xl:col-span-12"
      >
        <div className="max-h-[480px] overflow-auto border-t border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="h-9 pr-4 pl-5 font-medium">Fecha</th>
                <th scope="col" className="px-4 font-medium">Usuario</th>
                <th scope="col" className="px-4 font-medium">Ejercicio</th>
                <th scope="col" className="px-4 font-medium">Series</th>
                <th scope="col" className="px-4 text-right font-medium">Peso máx.</th>
                <th scope="col" className="px-4 pr-5 text-right font-medium">Volumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {detalleReciente.map((d, i) => (
                <tr key={`${d.fecha}-${d.hora}-${d.email}-${i}`} className="hover:bg-white/[0.025]">
                  <td className="py-2 pr-4 pl-5 whitespace-nowrap text-muted-foreground">
                    {fechaCorta(d.fecha)} · <span className="tabular-nums">{d.hora}</span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-foreground">{d.usuario}</td>
                  <td className="px-4 py-2">
                    <span className="block text-foreground">{d.ejercicio}</span>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2 text-xs text-muted-foreground" title={d.detalleSeries}>
                    {d.series} × {d.detalleSeries || "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatoNumero(d.pesoMaximoKg, 1)} kg</td>
                  <td className="px-4 py-2 pr-5 text-right tabular-nums">{formatoCompacto(d.volumenKg)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
