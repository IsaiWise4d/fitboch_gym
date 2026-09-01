import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { UsuarioDetalle } from "@/components/admin/UsuarioDetalle";
import { getResumenAdminRacha } from "@/lib/racha/server";
import type { ResumenAdminRacha } from "@/lib/racha/types";

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

  const [{ data: profile }, { data: membresias }, { data: rutinas }, { data: planes }, resumenRacha] =
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
      getResumenAdminRacha(id).catch((e: unknown) => {
        console.error("Error cargando racha del usuario:", e);
        return null as ResumenAdminRacha | null;
      }),
    ]);

  if (!profile) notFound();

  return (
    <UsuarioDetalle
      profile={profile}
      membresias={membresias ?? []}
      rutinas={rutinas ?? []}
      planesNutricionales={planes ?? []}
      racha={resumenRacha}
    />
  );
}
