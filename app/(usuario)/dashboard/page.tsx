import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembresiaCard } from "@/components/dashboard/MembresiaCard";
import { RutinaDiaria } from "@/components/dashboard/RutinaDiaria";
import { Bell } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, membresiaResult, rutinaResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .gte("fecha_fin", new Date().toISOString().split("T")[0])
      .order("fecha_fin", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rutinas")
      .select("id, estado, texto_rutina")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const membresia = membresiaResult.data;
  const rutina = rutinaResult.data;
  const tieneRenovacion = membresia?.renovacion_habilitada === true;

  // Nombre: del perfil, del metadata de auth, o del email
  const nombre =
    profile?.nombre ||
    user.user_metadata?.nombre ||
    user.email?.split("@")[0] ||
    "Usuario";

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Hola, {nombre}</h1>
        <p className="text-sm text-muted-foreground">Bienvenido a FitBoch</p>
      </div>

      {/* Notificación de rutina pendiente */}
      {tieneRenovacion && !rutina && (
        <Link
          href="/rutina"
          className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/15"
        >
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">
              Nueva rutina disponible
            </p>
            <p className="text-xs text-muted-foreground">
              Toca aquí para generar tu rutina personalizada
            </p>
          </div>
        </Link>
      )}

      {/* Card de membresía */}
      <MembresiaCard membresia={membresia} />

      {/* Rutina del día */}
      {rutina?.texto_rutina && membresia && (
        <RutinaDiaria textoRutina={rutina.texto_rutina} />
      )}
    </div>
  );
}
