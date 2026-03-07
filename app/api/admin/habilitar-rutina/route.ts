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

    const { usuario_id } = await request.json();

    if (!usuario_id) {
      return NextResponse.json({ error: "usuario_id requerido" }, { status: 400 });
    }

    // Verificar que el usuario tiene membresía activa
    const { data: membresia } = await supabase
      .from("membresias")
      .select("id")
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa")
      .maybeSingle();

    if (!membresia) {
      return NextResponse.json(
        { error: "El usuario no tiene membresía activa" },
        { status: 400 }
      );
    }

    // Archivar rutina activa anterior
    await supabase
      .from("rutinas")
      .update({ estado: "archivada" })
      .eq("usuario_id", usuario_id)
      .eq("estado", "activa");

    // Habilitar renovación en la membresía activa
    const { error: updateError } = await supabase
      .from("membresias")
      .update({ renovacion_habilitada: true })
      .eq("id", membresia.id);

    if (updateError) {
      console.error("Error habilitando rutina:", updateError);
      return NextResponse.json({ error: "Error al habilitar la rutina" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en habilitar-rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
