import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GestionCalentamientos } from "@/components/admin/GestionCalentamientos";

export default async function CalentamientosAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: calentamientos } = await supabase
    .from("calentamientos")
    .select("*")
    .order("categoria")
    .order("nombre");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Calentamientos</h1>
      <GestionCalentamientos calentamientos={calentamientos ?? []} />
    </div>
  );
}
