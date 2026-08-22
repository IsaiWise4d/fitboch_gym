import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalentamientosList } from "@/components/calentamientos/CalentamientosList";

export default async function CalentamientosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: calentamientos } = await supabase
    .from("calentamientos")
    .select("*")
    .eq("activo", true)
    .order("categoria")
    .order("nombre");

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Calentamientos</h1>
        <p className="text-sm text-muted-foreground">Prepara tu cuerpo antes de entrenar</p>
      </div>
      <CalentamientosList calentamientos={calentamientos ?? []} />
    </div>
  );
}
