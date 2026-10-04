// Verificación de rol admin para páginas (redirect) y route handlers
// (401/403). Es la ÚNICA puerta para obtener el cliente service role:
// así no se puede leer con privilegios sin haber comprobado el rol.

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { crearClienteAdmin, type ClienteAdmin } from "@/lib/supabase/admin";

export interface SesionAdmin {
  userId: string;
  nombre: string;
  cliente: ClienteAdmin;
}

/**
 * Para Server Components del panel. Cacheada por request: layout y página
 * comparten una sola consulta. Sin sesión → /login; sin rol admin →
 * /dashboard. Cada página la llama (el layout no se re-renderiza al
 * navegar, así que no basta como barrera).
 */
export const requireAdmin = cache(async (): Promise<SesionAdmin> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();
  if (perfil?.rol !== "admin") redirect("/dashboard");

  return { userId: user.id, nombre: perfil.nombre, cliente: crearClienteAdmin() };
});

type ResultadoVerificacion =
  | { ok: true; userId: string; cliente: ClienteAdmin }
  | { ok: false; respuesta: NextResponse };

/** Para route handlers de /api/admin/*: el middleware no protege /api. */
export async function verificarAdminApi(): Promise<ResultadoVerificacion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, respuesta: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const { data: perfil } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") {
    return { ok: false, respuesta: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  try {
    return { ok: true, userId: user.id, cliente: crearClienteAdmin() };
  } catch (error: unknown) {
    console.error("Cliente admin no disponible:", error);
    return {
      ok: false,
      respuesta: NextResponse.json({ error: "Service role key no configurada" }, { status: 500 }),
    };
  }
}
