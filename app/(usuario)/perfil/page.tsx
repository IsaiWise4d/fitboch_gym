import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PerfilForm } from "@/components/perfil/PerfilForm";
import { LogOut } from "lucide-react";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Mi Perfil</h1>
      <PerfilForm profile={profile} />
    </div>
  );
}
