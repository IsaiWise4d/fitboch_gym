import { NextResponse } from "next/server";

import { validarEjercicio } from "@/lib/admin/biblioteca";
import { verificarAdminApi } from "@/lib/admin/guard";
import type { Database } from "@/types/database";

type InsertEjercicio = Database["public"]["Tables"]["ejercicios"]["Insert"];
type UpdateEjercicio = Database["public"]["Tables"]["ejercicios"]["Update"];

// Crear ejercicio
export async function POST(request: Request) {
  try {
    const verificacion = await verificarAdminApi();
    if (!verificacion.ok) return verificacion.respuesta;

    const validacion = validarEjercicio(await request.json().catch(() => null), false);
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }

    const { data, error } = await verificacion.cliente
      .from("ejercicios")
      .insert(validacion.datos as InsertEjercicio)
      .select("id")
      .single();

    if (error) {
      console.error("Error creando ejercicio:", error);
      return NextResponse.json({ error: "Error al crear el ejercicio" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error en ejercicios POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Actualizar ejercicio (solo los campos enviados y permitidos)
export async function PUT(request: Request) {
  try {
    const verificacion = await verificarAdminApi();
    if (!verificacion.ok) return verificacion.respuesta;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const validacion = validarEjercicio(body, true);
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }
    if (Object.keys(validacion.datos).length === 0) {
      return NextResponse.json({ error: "No hay cambios para guardar" }, { status: 400 });
    }

    const { error } = await verificacion.cliente
      .from("ejercicios")
      .update(validacion.datos as UpdateEjercicio)
      .eq("id", id);

    if (error) {
      console.error("Error actualizando ejercicio:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en ejercicios PUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
