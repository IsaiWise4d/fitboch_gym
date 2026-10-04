import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EjerciciosList } from "@/components/ejercicios/EjerciciosList";

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string | string[] }>;
}) {
  const { grupo } = await searchParams;
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
    <div className="p-4 space-y-2">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Ejercicios</h1>
        <p className="text-sm text-muted-foreground">
          Toca un ejercicio para ver cómo se hace, paso a paso.
        </p>
      </div>
      <EjerciciosList
        ejercicios={ejercicios || []}
        grupoInicial={typeof grupo === "string" ? grupo : undefined}
      />
    </div>
  );
}
