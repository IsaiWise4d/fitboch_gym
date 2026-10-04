import { ListaUsuarios } from "@/components/admin/usuarios/ListaUsuarios";
import { DialogoNuevoUsuario } from "@/components/admin/usuarios/DialogoNuevoUsuario";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireAdmin } from "@/lib/admin/guard";
import { obtenerDatosBaseAdmin } from "@/lib/admin/server";
import { construirFilasUsuarios } from "@/lib/admin/usuarios";

export default async function UsuariosPage() {
  await requireAdmin();
  const { hoy, usuarios, dias } = await obtenerDatosBaseAdmin();
  const filas = construirFilasUsuarios(usuarios, dias, hoy);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Usuarios"
        descripcion="Membresías, rachas y asistencia de cada miembro. Haz clic en una fila para abrir su ficha."
        acciones={<DialogoNuevoUsuario />}
      />
      <ListaUsuarios filas={filas} hoy={hoy} />
    </div>
  );
}
