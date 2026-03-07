import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EjerciciosList } from "@/components/ejercicios/EjerciciosList";

export default async function EjerciciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ejercicios } = await supabase
    .from("ejercicios")
    .select("*")
    .eq("activo", true)
    .order("grupo_muscular")
    .order("nombre");

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Ejercicios</h1>
      <EjerciciosList ejercicios={ejercicios || []} />
    </div>
  );
}
