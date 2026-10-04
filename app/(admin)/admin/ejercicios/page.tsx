import { GestionEjercicios } from "@/components/admin/GestionEjercicios";
import { requireAdmin } from "@/lib/admin/guard";
import { obtenerUsoEjercicios } from "@/lib/admin/server";

export default async function EjerciciosAdminPage() {
  const { cliente } = await requireAdmin();

  const [{ data: ejercicios }, uso] = await Promise.all([
    cliente.from("ejercicios").select("*").order("grupo_muscular").order("nombre"),
    obtenerUsoEjercicios(30).catch((e: unknown) => {
      console.error("Error leyendo uso de ejercicios:", e);
      return {} as Record<string, number>;
    }),
  ]);

  return <GestionEjercicios ejercicios={ejercicios ?? []} uso={uso} />;
}
