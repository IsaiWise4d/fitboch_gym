import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (adminProfile?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { usuario_id, tipo_plan, fecha_inicio, fecha_fin, monto_pagado } = body;

    if (!usuario_id || !tipo_plan || !fecha_inicio || !fecha_fin) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Marcar membresías anteriores como vencidas
    await supabase
      .from("membresias")
      .update({ estado: "vencida" })
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa");

    // Crear nueva membresía
    const { error: insertError } = await supabase.from("membresias").insert({
      usuario_id,
      tipo_plan,
      fecha_inicio,
      fecha_fin,
      estado: "activa",
      renovacion_habilitada: false,
      monto_pagado: monto_pagado || null,
    });

    if (insertError) {
      console.error("Error creando membresía:", insertError);
      return NextResponse.json({ error: "Error al crear la membresía" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en renovar-membresia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
