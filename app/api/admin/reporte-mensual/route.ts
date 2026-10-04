import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getHoyColombia } from "@/lib/utils/fecha";
import { esMesValido } from "@/lib/reportes/mensual";
import { obtenerReporteMensual } from "@/lib/reportes/server";
import { generarExcelReporteMensual } from "@/lib/reportes/excel";
import type { Database } from "@/types/database";

// Un mes con mucha actividad implica varias páginas de historial + armado del xlsx.
export const maxDuration = 60;

/**
 * GET /api/admin/reporte-mensual?mes=YYYY-MM[&desactivados=1]
 * Devuelve el reporte mensual de todos los usuarios como archivo .xlsx.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (adminProfile?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

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

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Service role key no configurada" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const reporte = await obtenerReporteMensual(supabaseAdmin, mes, {
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
