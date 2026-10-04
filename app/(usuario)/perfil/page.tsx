import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHoyColombia } from "@/lib/utils/fecha";
import { PerfilEncabezado } from "@/components/perfil/PerfilEncabezado";
import { PerfilForm } from "@/components/perfil/PerfilForm";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: membresia }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .gte("fecha_fin", getHoyColombia())
      .order("fecha_fin", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="space-y-5 p-4">
      <PerfilEncabezado profile={profile} membresia={membresia} />
      <PerfilForm profile={profile} />
    </div>
  );
}
