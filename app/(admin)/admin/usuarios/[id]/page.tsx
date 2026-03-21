import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { UsuarioDetalle } from "@/components/admin/UsuarioDetalle";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UsuarioDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: membresias }, { data: rutinas }, { data: planes }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase
        .from("membresias")
        .select("*")
        .eq("usuario_id", id)
        .order("fecha_fin", { ascending: false }),
      supabase
        .from("rutinas")
        .select("id, created_at, duracion_plan, estado, modelo_ia, texto_rutina")
        .eq("usuario_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("planes_nutricionales")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) notFound();

  return (
    <UsuarioDetalle
      profile={profile}
      membresias={membresias ?? []}
      rutinas={rutinas ?? []}
      planesNutricionales={planes ?? []}
    />
  );
}
