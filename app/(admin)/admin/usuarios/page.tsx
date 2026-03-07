import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TablaUsuarios } from "@/components/admin/TablaUsuarios";
import { UsuariosHeader } from "@/components/admin/UsuariosHeader";

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

  return (
    <div className="space-y-6">
      <UsuariosHeader />
      <TablaUsuarios usuarios={usuarios ?? []} />
    </div>
  );
}
