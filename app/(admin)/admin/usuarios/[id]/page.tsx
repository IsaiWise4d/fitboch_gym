import { notFound } from "next/navigation";

import { UsuarioDetalle } from "@/components/admin/usuario/UsuarioDetalle";
import { construirCalendarioActividad, metricasUsuario } from "@/lib/admin/actividad";
import { requireAdmin } from "@/lib/admin/guard";
import { obtenerActividadUsuario, SEMANAS_CALENDARIO_USUARIO } from "@/lib/admin/server";
import type { DiaEntreno, RegistroReciente } from "@/lib/admin/tipos";
import { getHoyColombia } from "@/lib/utils/fecha";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ renovar?: string }>;
}

export default async function UsuarioDetallePage({ params, searchParams }: Props) {
  const [{ id }, { renovar }] = await Promise.all([params, searchParams]);
  const { cliente } = await requireAdmin();
  const hoy = getHoyColombia();

  const [{ data: profile }, { data: membresias }, { data: rutinas }, { data: planes }, actividad] =
    await Promise.all([
      cliente.from("profiles").select("*").eq("id", id).maybeSingle(),
      cliente.from("membresias").select("*").eq("usuario_id", id).order("fecha_fin", { ascending: false }),
      cliente
        .from("rutinas")
        .select("id, created_at, duracion_plan, estado, modelo_ia, texto_rutina")
        .eq("usuario_id", id)
        .order("created_at", { ascending: false }),
      cliente.from("planes_nutricionales").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      obtenerActividadUsuario(id, hoy).catch((e: unknown) => {
        console.error("Error cargando actividad del usuario:", e);
        return { dias: [] as DiaEntreno[], recientes: [] as RegistroReciente[] };
      }),
    ]);

  if (!profile) notFound();

  return (
    <UsuarioDetalle
      profile={profile}
      membresias={membresias ?? []}
      rutinas={rutinas ?? []}
      planesNutricionales={planes ?? []}
      hoy={hoy}
      actividad={{
        metricas: metricasUsuario(actividad.dias, hoy, { registro: profile.created_at }),
        calendario: construirCalendarioActividad(actividad.dias, hoy, SEMANAS_CALENDARIO_USUARIO, profile.created_at),
        recientes: actividad.recientes,
      }}
      abrirRenovar={renovar === "1"}
    />
  );
}
