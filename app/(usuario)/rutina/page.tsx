import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RutinaViewer } from "@/components/rutina/RutinaViewer";
import { FormularioRutina } from "@/components/rutina/FormularioRutina";
import { Dumbbell, Lock, ShieldAlert } from "lucide-react";

export default async function RutinaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: rutina }, { data: membresia }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("rutinas")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("estado", "activa")
        .maybeSingle(),
      supabase
        .from("membresias")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("estado", "activa")
        .gte("fecha_fin", new Date().toISOString().split("T")[0])
        .order("fecha_fin", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const tieneRenovacion = membresia?.renovacion_habilitada === true;

  // Estado 3: Rutina activa + membresía activa — mostrar la rutina
  if (rutina && membresia) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Mi Rutina</h1>
        <RutinaViewer rutina={rutina} />
      </div>
    );
  }

  // Estado 3b: Rutina activa pero membresía vencida — blur + overlay
  if (rutina && !membresia) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Mi Rutina</h1>

        {/* Banner de aviso */}
        <div className="flex flex-col items-center text-center space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Membresía vencida</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Renueva tu membresía para volver a acceder a tu rutina personalizada.
          </p>
          <p className="text-xs text-primary font-medium">
            Contacta al administrador del gimnasio
          </p>
        </div>

        {/* Rutina con blur */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="blur-md pointer-events-none select-none opacity-40">
            <RutinaViewer rutina={rutina} />
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Renovación habilitada — mostrar formulario
  if (tieneRenovacion && profile) {
    const incluyeNutricional = membresia?.plan_nutricional_habilitado === true;
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Generar Mi Rutina</h1>
        <p className="text-sm text-muted-foreground">
          Completa tus datos para generar una rutina personalizada con IA.
        </p>
        {incluyeNutricional && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <span className="text-success text-sm">✓</span>
            <p className="text-xs text-success font-medium">Tu plan incluye asesoría nutricional personalizada</p>
          </div>
        )}
        <FormularioRutina profile={profile} />
      </div>
    );
  }

  // Estado 1: Sin rutina y sin renovación
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Mi Rutina</h1>
      <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
        <div className="rounded-full bg-surface p-4">
          {membresia ? (
            <Lock className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {membresia
              ? "Tu rutina aún no ha sido habilitada"
              : "No tienes una membresía activa"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {membresia
              ? "El administrador debe habilitar la generación de tu rutina. Contacta al gym para más información."
              : "Necesitas una membresía activa para generar tu rutina. Contacta al administrador del gimnasio."}
          </p>
        </div>
      </div>
    </div>
  );
}
