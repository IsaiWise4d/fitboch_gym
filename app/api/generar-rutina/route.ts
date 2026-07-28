import { createClient } from "@/lib/supabase/server";
import { construirPromptRutina, type DatosRutina } from "@/lib/ai/prompts";
import { generateText, OpenRouterError } from "@/lib/ai/generateText";
import { NextResponse } from "next/server";
import type { Json } from "@/types/database";
import { getHoyColombia } from "@/lib/utils/fecha";

export const maxDuration = 300;

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
      .gte("fecha_fin", getHoyColombia())
      .eq("renovacion_habilitada", true)
      .maybeSingle();

    if (!membresia) {
      return NextResponse.json(
        { error: "No tienes una generación de rutina pendiente" },
        { status: 403 }
      );
    }

    // 3. Verificar que no tenga ya una rutina activa
    //    (usamos limit(1) + maybeSingle para que nunca lance aunque haya duplicados)
    const { data: rutinaExistente, error: rutinaQueryError } = await supabase
      .from("rutinas")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rutinaQueryError) {
      console.error("Error consultando rutina existente:", rutinaQueryError);
      return NextResponse.json(
        { error: "Error al verificar rutinas previas" },
        { status: 500 }
      );
    }

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

    // 6. Llamar a la IA via OpenRouter
    let textoRutina: string;
    let tokensUsados: number | null;
    let modelo: string;
    try {
      const aiResult = await generateText({
        prompt,
        system:
          "Eres un entrenador personal experto en fitness, hipertrofia y fuerza. " +
          "Respondes en español, con formato Markdown estructurado.",
      });
      textoRutina = aiResult.text;
      tokensUsados = aiResult.tokensUsados;
      modelo = aiResult.modelo;
    } catch (err) {
      if (err instanceof OpenRouterError) {
        const isConfigError = err.message.includes("no configurada");
        return NextResponse.json(
          {
            error: isConfigError
              ? "Servicio de IA no configurado"
              : "Error al conectar con el servicio de IA",
          },
          { status: isConfigError ? 500 : 502 }
        );
      }
      throw err;
    }

    if (!textoRutina) {
      return NextResponse.json(
        { error: "La IA no generó contenido. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // 7. Guardar en Supabase (estado explícito por seguridad)
    const { error: insertError } = await supabase.from("rutinas").insert({
      usuario_id: user.id,
      membresia_id: membresia.id,
      datos_input: datosUsuario as unknown as Json,
      texto_rutina: textoRutina,
      duracion_plan: "3_meses",
      estado: "activa",
      modelo_ia: modelo,
      tokens_usados: tokensUsados,
    });

    if (insertError) {
      console.error("Error guardando rutina:", insertError);
      return NextResponse.json(
        { error: "Error al guardar la rutina" },
        { status: 500 }
      );
    }

    // 8. Deshabilitar la renovación (verificamos el resultado)
    const { error: updateRenovError } = await supabase
      .from("membresias")
      .update({ renovacion_habilitada: false })
      .eq("id", membresia.id);

    if (updateRenovError) {
      console.error("Error deshabilitando renovación:", updateRenovError);
    }

    return NextResponse.json({ success: true, rutina: textoRutina });
  } catch (error) {
    console.error("Error generando rutina:", error);
    return NextResponse.json(
      { error: "Error interno al generar la rutina. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
