import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getHoyColombia } from "@/lib/utils/fecha";
import { FormularioNutricion } from "@/components/nutricion/FormularioNutricion";
import { PlanViewer } from "@/components/nutricion/PlanViewer";
import { Apple, Lock, ShieldAlert, UserCog } from "lucide-react";

export default async function PlanNutricionalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: planNutricional }, { data: membresia }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("planes_nutricionales")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("membresias")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("estado", "activa")
        .gte("fecha_fin", getHoyColombia())
        .order("fecha_fin", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const tienePlanHabilitado = membresia?.plan_nutricional_habilitado === true;

  // Estado 3: Plan activo + membresía activa — mostrar el plan
  if (planNutricional && membresia && tienePlanHabilitado) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Mi Plan Nutricional</h1>
        <PlanViewer plan={planNutricional} />
      </div>
    );
  }

  // Estado 3b: Plan activo pero membresía vencida o nutricion deshabilitada — blur + overlay
  if (planNutricional && (!membresia || !tienePlanHabilitado)) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Mi Plan Nutricional</h1>

        <div className="flex flex-col items-center text-center space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Plan inactivo o membresía vencida</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Renueva tu membresía con plan nutricional incluido para volver a acceder a tu dieta personalizada.
          </p>
          <p className="text-xs text-primary font-medium">
            Contacta al administrador del gimnasio
          </p>
        </div>

        {/* Plan con blur */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="blur-md pointer-events-none select-none opacity-40">
            <PlanViewer plan={planNutricional} />
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Renovación habilitada — mostrar formulario
  if (tienePlanHabilitado && profile) {
    if (!profile.perfil_completo) {
      return (
        <div className="p-4 space-y-4">
          <h1 className="text-xl font-bold">Generar Mi Plan Nutricional</h1>
          
          <div className="flex flex-col items-center text-center space-y-4 mt-8 bg-card border border-border p-6 rounded-xl">
            <div className="rounded-full bg-primary/10 p-4">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Perfil Incompleto</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Para calcular tus macros exactos necesitamos que completes tus medidas y datos físicos.
            </p>
            <Link 
              href="/perfil" 
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-md font-medium text-sm transition-colors"
            >
              Completar mi perfil
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Generar Mi Plan Nutricional</h1>
        <p className="text-sm text-muted-foreground">
          Completa tus preferencias para generar una dieta 100% personalizada por IA en segundos.
        </p>
        <FormularioNutricion profile={profile} />
      </div>
    );
  }

  // Estado 1: Sin plan y no está habilitado
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Mi Plan Nutricional</h1>
      <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
        <div className="rounded-full bg-surface p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Plan nutricional no habilitado
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Este servicio requiere activación por parte del gimnasio. Si agregaste asesoría nutricional a tu paquete, por favor contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
