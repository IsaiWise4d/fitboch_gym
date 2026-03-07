import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verificar que el que llama es admin
    const supabaseServer = await createServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: adminProfile } = await supabaseServer
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (adminProfile?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { nombre, email, password } = await request.json();

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Usar el service role key para crear usuario (Admin API)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Service role key no configurada" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Crear usuario en auth
    const { data: newUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: { nombre },
      });

    if (authError) {
      // Manejar email duplicado
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese email" },
          { status: 409 }
        );
      }
      console.error("Error creando usuario:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // El trigger de Supabase crea automáticamente el perfil,
    // pero actualizamos para asegurar que el nombre quede bien
    // y marcamos perfil_completo = false
    await supabaseAdmin
      .from("profiles")
      .update({ nombre, perfil_completo: false })
      .eq("id", newUser.user.id);

    return NextResponse.json({
      success: true,
      usuario_id: newUser.user.id,
    });
  } catch (error) {
    console.error("Error en crear-usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
