import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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

    const { usuario_id } = await request.json();

    if (!usuario_id) {
      return NextResponse.json(
        { error: "usuario_id es requerido" },
        { status: 400 }
      );
    }

    // No permitir eliminarse a sí mismo
    if (usuario_id === user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

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

    // 1) Limpiar datos relacionados explícitamente
    const { error: logsError } = await supabaseAdmin
      .from("logs_acceso")
      .delete()
      .eq("usuario_id", usuario_id);

    if (logsError) {
      console.error("Error eliminando logs:", logsError);
      return NextResponse.json(
        { error: "No se pudieron eliminar los logs del usuario" },
        { status: 500 }
      );
    }

    const { error: rutinasError } = await supabaseAdmin
      .from("rutinas")
      .delete()
      .eq("usuario_id", usuario_id);

    if (rutinasError) {
      console.error("Error eliminando rutinas:", rutinasError);
      return NextResponse.json(
        { error: "No se pudieron eliminar las rutinas del usuario" },
        { status: 500 }
      );
    }

    const { error: membresiasError } = await supabaseAdmin
      .from("membresias")
      .delete()
      .eq("usuario_id", usuario_id);

    if (membresiasError) {
      console.error("Error eliminando membresias:", membresiasError);
      return NextResponse.json(
        { error: "No se pudieron eliminar las membresias del usuario" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", usuario_id);

    if (profileError) {
      console.error("Error eliminando perfil:", profileError);
      return NextResponse.json(
        { error: "No se pudo eliminar el perfil del usuario" },
        { status: 500 }
      );
    }

    // 2) Eliminar usuario de auth para liberar el email
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      usuario_id,
      false
    );

    if (authDeleteError) {
      console.error("Error eliminando auth user:", authDeleteError);
      return NextResponse.json(
        {
          error:
            "Se eliminó el perfil pero no la cuenta de autenticación. El correo puede seguir ocupado.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en eliminar-usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
