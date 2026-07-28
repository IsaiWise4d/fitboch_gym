// Route Handler que evalúa si el ejercicio recién guardado "activó" la racha.
// No escribe nada: solo re-lee historial_ejercicios y compara el estado
// previo (si hoy ya tenía ejercicio antes de este) con el nuevo.
//
// El cliente (ActiveExerciseTracker) lo llama just después del insert OK,
// enviando el `historialId` recién creado en el body. Lo excluimos del
// recuento para no contar a sí mismo.
//
// Si `activada === true`, el widget (que escucha 'exercise-saved') dispara
// la animación 'streak-activated'.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluarActivacionRacha } from "@/lib/racha/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no-auth" }, { status: 401 });
  }

  let historialId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "historialId" in body) {
      const v = (body as { historialId?: unknown }).historialId;
      if (typeof v === "string" && v.length > 0) {
        historialId = v;
      }
    }
  } catch {
    // body vacío o no-JSON: se permite, se evaluará sin excluir nada.
  }

  try {
    const { activada, estado } = await evaluarActivacionRacha(
      user.id,
      historialId
    );
    return NextResponse.json({ activada, estado });
  } catch (e) {
    console.error("Error evaluando activación de racha:", e);
    return NextResponse.json(
      { error: "internal", activada: false },
      { status: 500 }
    );
  }
}