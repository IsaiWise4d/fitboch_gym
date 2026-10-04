import { Suspense } from "react";

import { ControlesReporte } from "@/components/admin/reportes/ControlesReporte";
import { ReporteInteractivo } from "@/components/admin/reportes/ReporteInteractivo";
import { SkeletonReporte } from "@/components/admin/reportes/SkeletonReporte";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireAdmin } from "@/lib/admin/guard";
import { construirVistaReporte } from "@/lib/reportes/analisis";
import { esMesValido } from "@/lib/reportes/mensual";
import { obtenerReporteMensual, obtenerTendencia } from "@/lib/reportes/server";
import { getHoyColombia } from "@/lib/utils/fecha";

// Un mes con mucha actividad implica varias páginas de historial.
export const maxDuration = 60;

interface Props {
  searchParams: Promise<{ mes?: string; desactivados?: string }>;
}

async function ContenidoReporte({ mes, incluirDesactivados }: { mes: string; incluirDesactivados: boolean }) {
  const { cliente } = await requireAdmin();
  const [reporte, tendencia] = await Promise.all([
    obtenerReporteMensual(cliente, mes, { incluirDesactivados }),
    obtenerTendencia(cliente, mes, 6),
  ]);
  const vista = construirVistaReporte(reporte, getHoyColombia());
  return <ReporteInteractivo vista={vista} tendencia={tendencia} />;
}

export default async function ReportesPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const mesActual = getHoyColombia().slice(0, 7);
  // Mes inválido o futuro → mes en curso.
  const mes = params.mes && esMesValido(params.mes) && params.mes <= mesActual ? params.mes : mesActual;
  const incluirDesactivados = params.desactivados === "1";

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Reportes"
        descripcion="Análisis mensual de asistencia, rachas, ejercicios y membresías. El Excel trae el detalle completo."
      />
      <ControlesReporte mes={mes} mesActual={mesActual} incluirDesactivados={incluirDesactivados} />
      <Suspense key={`${mes}-${incluirDesactivados}`} fallback={<SkeletonReporte />}>
        <ContenidoReporte mes={mes} incluirDesactivados={incluirDesactivados} />
      </Suspense>
    </div>
  );
}
