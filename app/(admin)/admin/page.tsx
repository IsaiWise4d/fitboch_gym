import { PanelInicio } from "@/components/admin/panel/PanelInicio";
import { requireAdmin } from "@/lib/admin/guard";
import { construirPanel } from "@/lib/admin/panel";
import { obtenerDatosBaseAdmin } from "@/lib/admin/server";

export default async function AdminDashboardPage() {
  const { nombre } = await requireAdmin();
  const { hoy, usuarios, dias } = await obtenerDatosBaseAdmin();
  return <PanelInicio panel={construirPanel({ hoy, usuarios, dias })} nombre={nombre} />;
}
