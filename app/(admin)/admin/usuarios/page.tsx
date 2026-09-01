import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TablaUsuarios } from "@/components/admin/TablaUsuarios";
import { UsuariosHeader } from "@/components/admin/UsuariosHeader";
import { getEstadosRachaUsuarios } from "@/lib/racha/server";
import type { EstadoRacha } from "@/lib/racha/types";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*, membresias(*)")
    .eq("rol", "usuario")
    .order("created_at", { ascending: false });

  // Rachas de todos los usuarios en una sola consulta (para el badge 🔥).
  const ids = (usuarios ?? []).map((u: { id: string }) => u.id);
  let rachas: Record<string, EstadoRacha> = {};
  try {
    rachas = await getEstadosRachaUsuarios(ids);
  } catch (e) {
    console.error("Error cargando rachas de usuarios:", e);
  }

  return (
    <div className="space-y-6">
      <UsuariosHeader />
      <TablaUsuarios usuarios={usuarios ?? []} rachas={rachas} />
    </div>
  );
}
