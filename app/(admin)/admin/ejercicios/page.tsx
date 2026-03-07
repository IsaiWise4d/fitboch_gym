import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GestionEjercicios } from "@/components/admin/GestionEjercicios";

export default async function EjerciciosAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ejercicios } = await supabase
    .from("ejercicios")
    .select("*")
    .order("grupo_muscular")
    .order("nombre");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Ejercicios</h1>
      <GestionEjercicios ejercicios={ejercicios ?? []} />
    </div>
  );
}
