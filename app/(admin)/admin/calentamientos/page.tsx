import { GestionCalentamientos } from "@/components/admin/GestionCalentamientos";
import { requireAdmin } from "@/lib/admin/guard";

export default async function CalentamientosAdminPage() {
  const { cliente } = await requireAdmin();

  const { data: calentamientos } = await cliente
    .from("calentamientos")
    .select("*")
    .order("categoria")
    .order("nombre");

  return <GestionCalentamientos calentamientos={calentamientos ?? []} />;
}
