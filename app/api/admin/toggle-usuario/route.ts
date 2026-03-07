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

    const { usuario_id, activo } = await request.json();

    if (!usuario_id || typeof activo !== "boolean") {
      return NextResponse.json(
        { error: "usuario_id y activo son requeridos" },
        { status: 400 }
      );
    }

    // No permitir desactivarse a sí mismo
    if (usuario_id === user.id) {
      return NextResponse.json(
        { error: "No puedes desactivarte a ti mismo" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ activo })
      .eq("id", usuario_id);

    if (updateError) {
      console.error("Error actualizando usuario:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el usuario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en toggle-usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
