import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

import { DistribucionMembresias } from "@/components/admin/panel/DistribucionMembresias";
import { GraficoAsistencia } from "@/components/admin/panel/GraficoAsistencia";
import { GraficoHorasPico } from "@/components/admin/panel/GraficoHorasPico";
import { ListaAtencion } from "@/components/admin/panel/ListaAtencion";
import {
  ActividadHoy,
  Cumpleanos,
  TopRachas,
  UltimosRegistros,
} from "@/components/admin/panel/ListasPanel";
import { DialogoNuevoUsuario } from "@/components/admin/usuarios/DialogoNuevoUsuario";
import { BotonActualizar } from "@/components/admin/ui/BotonActualizar";
import { FranjaKpi, type Kpi } from "@/components/admin/ui/FranjaKpi";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Button } from "@/components/ui/button";
import type { DatosPanel } from "@/lib/admin/panel";
import { fechaLarga, formatoNumero } from "@/lib/utils/formato";

/** Contenido del dashboard ("centro de control de hoy"). */
export function PanelInicio({ panel, nombre }: { panel: DatosPanel; nombre: string }) {
  const { kpis, hoy } = panel;

  const variacionPromedio =
    kpis.promedioDiario7 !== null && kpis.promedioDiario7Anterior
      ? (kpis.promedioDiario7 - kpis.promedioDiario7Anterior) / kpis.promedioDiario7Anterior
      : null;
  const porcentajeHoy =
    kpis.miembrosVigentes > 0 ? Math.round((kpis.entrenaronHoy / kpis.miembrosVigentes) * 100) : null;

  const indicadores: Kpi[] = [
    {
      etiqueta: "Miembros vigentes",
      valor: kpis.miembrosVigentes,
      contexto: `de ${kpis.usuariosActivos} cuentas activas`,
      href: "/admin/usuarios",
    },
    {
      etiqueta: "Entrenaron hoy",
      valor: kpis.entrenaronHoy,
      contexto: panel.esDomingo
        ? "Fin de semana · día libre"
        : porcentajeHoy !== null
          ? `${porcentajeHoy}% de los vigentes`
          : "Sin miembros vigentes",
      href: "#actividad-hoy",
    },
    {
      etiqueta: "Promedio diario",
      valor: kpis.promedioDiario7 === null ? "—" : formatoNumero(kpis.promedioDiario7, 1),
      delta: variacionPromedio,
      etiquetaDelta: "vs semana previa",
      contexto: variacionPromedio === null ? "usuarios por día hábil, 7 días" : undefined,
    },
    {
      etiqueta: "Por vencer",
      valor: kpis.porVencer,
      contexto: "en los próximos 7 días",
      tono: kpis.porVencer > 0 ? "advertencia" : "neutro",
      href: "/admin/usuarios?estado=por_vencer",
    },
    {
      etiqueta: "Vencidas",
      valor: kpis.vencidas,
      contexto: `${kpis.vencidasRecientes} en los últimos 30 días`,
      tono: kpis.vencidas > 0 ? "peligro" : "neutro",
      href: "/admin/usuarios?estado=vencida",
    },
    {
      etiqueta: "Sin membresía",
      valor: kpis.sinMembresia,
      contexto: "cuentas activas sin plan",
      href: "/admin/usuarios?estado=sin_membresia",
    },
  ];

  const fechaHoy = fechaLarga(hoy);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Hola, ${nombre.split(" ")[0]}`}
        descripcion={`${fechaHoy.charAt(0).toUpperCase()}${fechaHoy.slice(1)} · así va el gimnasio hoy`}
        acciones={
          <>
            <BotonActualizar />
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/reportes" />}>
              <FileSpreadsheet aria-hidden="true" />
              <span className="sm:hidden">Reporte</span>
              <span className="hidden sm:inline">Reporte del mes</span>
            </Button>
            <DialogoNuevoUsuario />
          </>
        }
      />

      <FranjaKpi kpis={indicadores} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        <div className="md:col-span-2 xl:col-span-8">
          <GraficoAsistencia datos={panel.asistenciaDiaria} hoy={hoy} />
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <DistribucionMembresias distribucion={panel.distribucion} />
        </div>

        <div className="md:col-span-2 xl:col-span-7">
          <ListaAtencion atencion={panel.atencion} />
        </div>
        <div className="md:col-span-2 xl:col-span-5">
          <ActividadHoy filas={panel.actividadHoy} esDomingo={panel.esDomingo} />
        </div>

        <div className="xl:col-span-6">
          <GraficoHorasPico horas={panel.horasPico} />
        </div>
        <div className="xl:col-span-6">
          <TopRachas filas={panel.topRachas} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2 xl:col-span-12">
          <Cumpleanos filas={panel.cumpleanos} />
          <UltimosRegistros filas={panel.ultimosRegistros} hoy={hoy} />
        </div>
      </div>
    </div>
  );
}
