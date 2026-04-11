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

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (adminProfile?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { usuario_id } = await request.json();

    if (!usuario_id) {
      return NextResponse.json({ error: "usuario_id requerido" }, { status: 400 });
    }

    const { data: membresiaActiva } = await supabase
      .from("membresias")
      .select("id, plan_nutricional_habilitado")
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa")
      .maybeSingle();

    if (!membresiaActiva) {
      return NextResponse.json(
        { error: "El usuario no tiene membresía activa" },
        { status: 400 }
      );
    }

    if (!membresiaActiva.plan_nutricional_habilitado) {
      return NextResponse.json(
        { error: "El plan nutricional no está habilitado para este usuario" },
        { status: 400 }
      );
    }

    const { error: archiveError } = await supabase
      .from("planes_nutricionales")
      .update({ estado: "archivada" })
      .eq("user_id", usuario_id)
      .eq("estado", "activa");

    if (archiveError) {
      console.error("Error archivando plan nutricional:", archiveError);
      return NextResponse.json(
        { error: "Error al archivar el plan nutricional actual" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en habilitar-plan-nutricional:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
