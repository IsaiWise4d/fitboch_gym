import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { construirPromptNutricional } from "@/lib/ai/prompts-nutricion";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // El body incluye la configuración que el usuario u admin escogió en el formulario
    const body = await req.json();
    const { objetivo, nivelActividad, horarioEntrenamiento, restricciones } = body;

    // Obtener perfil y membresía activa
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const { data: membresiaActiva } = await supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .single();

    if (!membresiaActiva || !membresiaActiva.plan_nutricional_habilitado) {
      return NextResponse.json(
        { error: "No tienes el plan nutricional habilitado en tu membresía" },
        { status: 403 }
      );
    }

    const { data: planActivo } = await supabase
      .from("planes_nutricionales")
      .select("id")
      .eq("user_id", user.id)
      .eq("estado", "activa")
      .maybeSingle();

    if (planActivo) {
      return NextResponse.json(
        { error: "Ya tienes un plan nutricional activo" },
        { status: 409 }
      );
    }

    // Verificar que no haya abusado de intentos recientes (opcional, como en rutina)
    // Para simplificar, generamos el texto.
    
    // 1. Construir Prompt
    const promptText = construirPromptNutricional({
      profile,
      objetivo,
      nivelActividad,
      horarioEntrenamiento,
      restricciones,
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key de Gemini no configurada" },
        { status: 500 }
      );
    }

    // 2. Llamar a la IA
    const ai = new GoogleGenAI({ apiKey });
    const modelo = "gemini-3-flash-preview";
    const msg = "Eres el mejor nutricionista deportivo. Formatea estricto usando MARKDOWN.\n\n" + promptText + "\n\nGenera mi plan nutricional basado en los datos proporcionados.";

    const response = await ai.models.generateContent({
      model: modelo,
      contents: [{ role: "user", parts: [{ text: msg }] }],
    });

    const fullText = response.text ?? "";

    if (!fullText) {
      return NextResponse.json(
        { error: "La IA no generó contenido. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // 3. Guardar en Base de Datos
    const { error: insertError } = await supabase.from("planes_nutricionales").insert({
      user_id: user.id,
      texto_plan: fullText,
      objetivo,
      nivel_actividad: nivelActividad,
      horario_entrenamiento: horarioEntrenamiento,
      restricciones,
      estado: "activa",
    });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Error al guardar el plan nutricional" }, { status: 500 });
    }

    return NextResponse.json({ success: true, texto_plan: fullText });
  } catch (error) {
    console.error("Error generating nutrition plan:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error inesperado al conectar con el servidor de la IA" },
      { status: 500 }
    );
  }
}
