// Cliente Supabase con service role (salta RLS). SOLO servidor y SOLO
// después de verificar que quien llama es admin: usar a través de
// lib/admin/guard.ts (requireAdmin / verificarAdminApi), nunca directo
// desde una página o componente.

import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export class ServiceRoleNoConfigurada extends Error {
  constructor() {
    super("SUPABASE_SERVICE_ROLE_KEY no está configurada");
    this.name = "ServiceRoleNoConfigurada";
  }
}

export function crearClienteAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new ServiceRoleNoConfigurada();
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ClienteAdmin = ReturnType<typeof crearClienteAdmin>;
