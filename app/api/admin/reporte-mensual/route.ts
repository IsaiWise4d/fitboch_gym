import { NextResponse } from "next/server";

import { verificarAdminApi } from "@/lib/admin/guard";
import { getHoyColombia } from "@/lib/utils/fecha";
import { esMesValido } from "@/lib/reportes/mensual";
import { obtenerReporteMensual } from "@/lib/reportes/server";
import { generarExcelReporteMensual } from "@/lib/reportes/excel";

// Un mes con mucha actividad implica varias páginas de historial + armado del xlsx.
export const maxDuration = 60;

/**
 * GET /api/admin/reporte-mensual?mes=YYYY-MM[&desactivados=1]
 * Devuelve el reporte mensual de todos los usuarios como archivo .xlsx.
 */
export async function GET(request: Request) {
  try {
    const verificacion = await verificarAdminApi();
    if (!verificacion.ok) return verificacion.respuesta;

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes") ?? "";
    const incluirDesactivados = searchParams.get("desactivados") === "1";

    if (!esMesValido(mes)) {
      return NextResponse.json(
        { error: "Mes inválido. Usa el formato AAAA-MM." },
        { status: 400 }
      );
    }

    if (mes > getHoyColombia().slice(0, 7)) {
      return NextResponse.json(
        { error: "No se puede generar el reporte de un mes futuro." },
        { status: 400 }
      );
    }

    const reporte = await obtenerReporteMensual(verificacion.cliente, mes, {
      incluirDesactivados,
    });
    const archivo = await generarExcelReporteMensual(reporte);

    return new Response(archivo, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reporte-fitboch-${mes}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Error generando reporte mensual:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
