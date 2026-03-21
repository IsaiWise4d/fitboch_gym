import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profile?.rol !== "admin") {
      return NextResponse.json(
        { error: "Privilegios insuficientes" },
        { status: 403 }
      );
    }

    const { plan_id, texto_plan } = await req.json();

    if (!plan_id || !texto_plan) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("planes_nutricionales")
      .update({ texto_plan })
      .eq("id", plan_id);

    if (error) {
      return NextResponse.json(
        { error: "Error de base de datos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error de servidor interno" },
      { status: 500 }
    );
  }
}
