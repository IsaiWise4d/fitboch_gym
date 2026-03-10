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

    const { membresia_id, habilitado } = await request.json();

    if (!membresia_id || typeof habilitado !== "boolean") {
      return NextResponse.json(
        { error: "membresia_id y habilitado (boolean) requeridos" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("membresias")
      .update({ plan_nutricional_habilitado: habilitado })
      .eq("id", membresia_id);

    if (updateError) {
      console.error("Error toggling nutricional:", updateError);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en toggle-nutricional:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
