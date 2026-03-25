import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getHoyColombia } from "@/lib/utils/fecha";

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

    const hoy = getHoyColombia();

    // Buscar membresías activas existentes (si existen varias, nos quedamos con la más reciente)
    const { data: membresiasActivas, error: activasError } = await supabase
      .from("membresias")
      .select("id, fecha_fin")
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa")
      .order("fecha_fin", { ascending: false });

    if (activasError) {
      console.error("Error consultando membresías activas:", activasError);
      return NextResponse.json(
        { error: "Error al consultar la membresía actual" },
        { status: 500 }
      );
    }

    const membresiaVigente = (membresiasActivas ?? []).find(
      (m) => m.fecha_fin >= hoy
    );

    // Si hay una vigente, se edita en lugar de crear una nueva
    if (membresiaVigente) {
      const { error: updateError } = await supabase
        .from("membresias")
        .update({
          tipo_plan,
          fecha_fin,
          monto_pagado: monto_pagado || null,
        })
        .eq("id", membresiaVigente.id);

      if (updateError) {
        console.error("Error editando membresía vigente:", updateError);
        return NextResponse.json(
          { error: "Error al editar la membresía vigente" },
          { status: 500 }
        );
      }

      // Cerrar cualquier otra activa residual para evitar duplicados
      const idsActivas = (membresiasActivas ?? []).map((m) => m.id);
      const idsResidual = idsActivas.filter((id) => id !== membresiaVigente.id);
      if (idsResidual.length > 0) {
        await supabase
          .from("membresias")
          .update({ estado: "vencida" })
          .in("id", idsResidual);
      }

      return NextResponse.json({ success: true, mode: "updated" });
    }

    // Si no hay vigente, se vencen activas antiguas residuales y se crea una nueva
    await supabase
      .from("membresias")
      .update({ estado: "vencida" })
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa");

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
