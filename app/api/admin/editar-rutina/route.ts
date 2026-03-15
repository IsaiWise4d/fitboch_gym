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

    const { rutina_id, texto_rutina } = await request.json();

    if (!rutina_id || typeof texto_rutina !== "string") {
      return NextResponse.json(
        { error: "rutina_id y texto_rutina son requeridos" },
        { status: 400 }
      );
    }

    const textoNormalizado = texto_rutina.trim();
    if (!textoNormalizado) {
      return NextResponse.json(
        { error: "El texto de la rutina no puede estar vacío" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("rutinas")
      .update({ texto_rutina: textoNormalizado })
      .eq("id", rutina_id)
      .eq("estado", "activa");

    if (updateError) {
      console.error("Error actualizando rutina:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar la rutina" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en editar-rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
