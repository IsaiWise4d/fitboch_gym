import { NextResponse } from "next/server";

import { validarCalentamiento } from "@/lib/admin/biblioteca";
import { verificarAdminApi } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type InsertCalentamiento = Database["public"]["Tables"]["calentamientos"]["Insert"];
type UpdateCalentamiento = Database["public"]["Tables"]["calentamientos"]["Update"];

const CATEGORIAS = ["tren_superior", "tren_inferior"] as const;

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
    const verificacion = await verificarAdminApi();
    if (!verificacion.ok) return verificacion.respuesta;

    const validacion = validarCalentamiento(await request.json().catch(() => null), false);
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }

    const { data, error } = await verificacion.cliente
      .from("calentamientos")
      .insert(validacion.datos as InsertCalentamiento)
      .select("id")
      .single();

    if (error) {
      console.error("Error creando calentamiento:", error);
      return NextResponse.json({ error: "Error al crear el calentamiento" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error en calentamientos POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const verificacion = await verificarAdminApi();
    if (!verificacion.ok) return verificacion.respuesta;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const validacion = validarCalentamiento(body, true);
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }
    if (Object.keys(validacion.datos).length === 0) {
      return NextResponse.json({ error: "No hay cambios para guardar" }, { status: 400 });
    }

    const { error } = await verificacion.cliente
      .from("calentamientos")
      .update({ ...validacion.datos, updated_at: new Date().toISOString() } as UpdateCalentamiento)
      .eq("id", id);
    if (error) {
      console.error("Error actualizando calentamiento:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en calentamientos PUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
