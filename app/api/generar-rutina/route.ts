import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { construirPromptRutina, type DatosRutina } from "@/lib/ai/prompts";
import { NextResponse } from "next/server";
import type { Json } from "@/types/database";

export const maxDuration = 60;// Gemini puede tardar en responder

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1.5 Verificar que el perfil esté completo
    const { data: profile } = await supabase
      .from("profiles")
      .select("perfil_completo")
      .eq("id", user.id)
      .single();

    if (!profile?.perfil_completo) {
      return NextResponse.json(
        { error: "Debes completar tu perfil antes de generar una rutina" },
        { status: 403 }
      );
    }

    // 2. Verificar que tenga renovación habilitada
    const { data: membresia } = await supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .gte("fecha_fin", new Date().toISOString().split("T")[0])
      .eq("renovacion_habilitada", true)
      .maybeSingle();

    if (!membresia) {
      return NextResponse.json(
        { error: "No tienes una generación de rutina pendiente" },
        { status: 403 }
      );
    }

    // 3. Verificar que no tenga ya una rutina activa
    const { data: rutinaExistente } = await supabase
      .from("rutinas")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .maybeSingle();

    if (rutinaExistente) {
      return NextResponse.json(
        { error: "Ya tienes una rutina activa" },
        { status: 409 }
      );
    }

    // 4. Obtener datos del formulario
    const datosUsuario: DatosRutina = await request.json();

    // 5. Construir prompt (incluir nutricional si está habilitado)
    const incluirNutricional = membresia.plan_nutricional_habilitado === true;
    const prompt = construirPromptRutina(datosUsuario, incluirNutricional);

    // 6. Llamar a Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key de Gemini no configurada" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

      const modelo = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelo,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const textoRutina = response.text ?? "";

    if (!textoRutina) {
      return NextResponse.json(
        { error: "La IA no generó contenido. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // 7. Guardar en Supabase
    const { error: insertError } = await supabase.from("rutinas").insert({
      usuario_id: user.id,
      membresia_id: membresia.id,
      datos_input: datosUsuario as unknown as Json,
      texto_rutina: textoRutina,
      duracion_plan: "3_meses",
      modelo_ia: modelo,
      tokens_usados: response.usageMetadata?.totalTokenCount ?? null,
    });

    if (insertError) {
      console.error("Error guardando rutina:", insertError);
      return NextResponse.json(
        { error: "Error al guardar la rutina" },
        { status: 500 }
      );
    }

    // 8. Deshabilitar la renovación
    await supabase
      .from("membresias")
      .update({ renovacion_habilitada: false })
      .eq("id", membresia.id);

    return NextResponse.json({ success: true, rutina: textoRutina });
  } catch (error) {
    console.error("Error generando rutina:", error);
    return NextResponse.json(
      { error: "Error interno al generar la rutina. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
