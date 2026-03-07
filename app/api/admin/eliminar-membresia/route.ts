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

    const { membresia_id } = await request.json();

    if (!membresia_id) {
      return NextResponse.json(
        { error: "membresia_id requerido" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("membresias")
      .delete()
      .eq("id", membresia_id);

    if (deleteError) {
      console.error("Error eliminando membresía:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la membresía" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en eliminar-membresia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
