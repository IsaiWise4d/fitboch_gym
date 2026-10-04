import { AdminSidebar } from "@/components/shared/AdminSidebar";
import type { UsuarioBusqueda } from "@/components/admin/shell/PaletaBusqueda";
import { requireAdmin } from "@/lib/admin/guard";
import { contarAlertasMembresia } from "@/lib/admin/panel";
import { obtenerUsuariosAdmin } from "@/lib/admin/server";
import { nombreCompleto } from "@/lib/admin/tipos";
import { estadoUsuario } from "@/lib/membresias/estado";
import { getHoyColombia } from "@/lib/utils/fecha";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { nombre } = await requireAdmin();
  const hoy = getHoyColombia();

  // El menú (badge + buscador) no debe tumbar todo el panel si la lectura
  // falla: la página mostrará su propio error.
  let alertas = 0;
  let usuarios: UsuarioBusqueda[] = [];
  try {
    const lista = await obtenerUsuariosAdmin();
    alertas = contarAlertasMembresia(lista, hoy);
    usuarios = lista
      .map((u) => ({
        id: u.id,
        nombre: nombreCompleto(u),
        email: u.email,
        estado: estadoUsuario(u, hoy).clave,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  } catch (error: unknown) {
    console.error("Error cargando usuarios para el menú admin:", error);
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar nombreAdmin={nombre} alertasMembresia={alertas} usuarios={usuarios} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-[4.5rem] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pt-20 lg:ml-64 lg:overflow-x-visible lg:p-8">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
