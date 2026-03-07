import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Crear ejercicio
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (admin?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel, imagen_url, video_url } = body;

    if (!nombre || !instrucciones || !grupo_muscular || !categoria) {
      return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
    }

    const { error } = await supabase.from("ejercicios").insert({
      nombre,
      descripcion: descripcion || null,
      instrucciones,
      grupo_muscular,
      categoria,
      nivel: nivel || "todos",
      imagen_url: imagen_url || null,
      video_url: video_url || null,
    });

    if (error) {
      console.error("Error creando ejercicio:", error);
      return NextResponse.json({ error: "Error al crear el ejercicio" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en ejercicios POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Actualizar ejercicio
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (admin?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ejercicios")
      .update(fields)
      .eq("id", id);

    if (error) {
      console.error("Error actualizando ejercicio:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en ejercicios PUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
