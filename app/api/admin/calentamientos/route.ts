import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CATEGORIAS = ["tren_superior", "tren_inferior"] as const;

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "admin") {
    return { supabase, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { supabase, response: null };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const categoriaParam = searchParams.get("categoria");
    let query = supabase.from("calentamientos").select("*").order("categoria").order("nombre");

    if (id) query = query.eq("id", id);
    if (categoriaParam && CATEGORIAS.includes(categoriaParam as (typeof CATEGORIAS)[number])) {
      query = query.eq("categoria", categoriaParam as (typeof CATEGORIAS)[number]);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error obteniendo calentamientos:", error);
      return NextResponse.json({ error: "Error al obtener calentamientos" }, { status: 500 });
    }

    return NextResponse.json({ calentamientos: data ?? [] });
  } catch (error) {
    console.error("Error en calentamientos GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, response } = await getAdminClient();
    if (response) return response;

    const body = await request.json();
    const { nombre, descripcion, instrucciones, categoria, nivel, media_url, media_tipo } = body;

    if (!nombre?.trim() || !instrucciones?.trim() || !categoria || !CATEGORIAS.includes(categoria)) {
      return NextResponse.json({ error: "Nombre, instrucciones y categoría son obligatorios" }, { status: 400 });
    }

    const mediaUrl = typeof media_url === "string" && media_url.trim() ? media_url.trim() : null;
    const mediaTipo = mediaUrl ? (media_tipo === "video" ? "video" : "imagen") : null;

    const { error } = await supabase.from("calentamientos").insert({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      instrucciones: instrucciones.trim(),
      categoria,
      nivel: nivel || "todos",
      media_url: mediaUrl,
      media_tipo: mediaTipo,
    });

    if (error) {
      console.error("Error creando calentamiento:", error);
      return NextResponse.json({ error: "Error al crear el calentamiento" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en calentamientos POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, response } = await getAdminClient();
    if (response) return response;

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const allowedFields = ["nombre", "descripcion", "instrucciones", "categoria", "nivel", "media_url", "media_tipo", "activo"];
    const updates = Object.fromEntries(Object.entries(fields).filter(([key]) => allowedFields.includes(key)));

    if (typeof updates.media_url === "string") {
      const mediaUrl = updates.media_url.trim();
      updates.media_url = mediaUrl || null;
      if (!mediaUrl) updates.media_tipo = null;
    }
    if (updates.media_url && updates.media_tipo !== "video") {
      updates.media_tipo = "imagen";
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("calentamientos").update(updates).eq("id", id);
    if (error) {
      console.error("Error actualizando calentamiento:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en calentamientos PUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
