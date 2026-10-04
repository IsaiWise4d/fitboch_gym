import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getHoyColombia } from "@/lib/utils/fecha";
import { calcularEstadoMembresia } from "@/lib/utils/membresia";
import { stringAFecha } from "@/lib/racha/bogota";
import { pickPhrase } from "@/lib/server/motivation";
import { EncabezadoInicio } from "@/components/dashboard/EncabezadoInicio";
import { AvisosInicio } from "@/components/dashboard/AvisosInicio";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { RutinaDiaria } from "@/components/dashboard/RutinaDiaria";
import { HoySinRutina } from "@/components/dashboard/HoySinRutina";
import { ResumenPlan } from "@/components/dashboard/ResumenPlan";
import { ActiveExerciseTracker } from "@/components/ejercicios/ActiveExerciseTracker";
import { RecentExercisesList } from "@/components/ejercicios/RecentExercisesList";
import { Skeleton } from "@/components/shared/Skeleton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoy = getHoyColombia();
  const [profileResult, membresiaResult, rutinaResult, planResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("membresias")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .gte("fecha_fin", hoy)
      .order("fecha_fin", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rutinas")
      .select("id, estado, texto_rutina, duracion_plan")
      .eq("usuario_id", user.id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("planes_nutricionales")
      .select("objetivo")
      .eq("user_id", user.id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const membresia = membresiaResult.data;
  const rutina = rutinaResult.data;
  const planNutricional = planResult.data;
  const tieneRenovacion = membresia?.renovacion_habilitada === true;
  const nutricionHabilitada = membresia?.plan_nutricional_habilitado === true;

  const { estado: estadoMembresia, diasRestantes } = membresia
    ? calcularEstadoMembresia(membresia.fecha_fin)
    : { estado: "sin_membresia" as const, diasRestantes: null };

  // Día de hoy en Bogotá (lunes = 0 … domingo = 6) para la rutina del día.
  const diaSemana = stringAFecha(hoy).getUTCDay();
  const hoyIndice = diaSemana === 0 ? 6 : diaSemana - 1;

  // Nombre: del perfil, del metadata de auth, o del email
  const nombre =
    profile?.nombre ||
    user.user_metadata?.nombre ||
    user.email?.split("@")[0] ||
    "Usuario";

  return (
    <div className="space-y-6 p-4">
      <EncabezadoInicio
        nombre={nombre}
        apellido={profile?.apellido ?? null}
        fraseInicial={pickPhrase(undefined)}
        semilla={profile?.id}
      />

      <AvisosInicio
        estadoMembresia={estadoMembresia}
        diasRestantes={diasRestantes}
        planNutricionalPendiente={nutricionHabilitada && !planNutricional}
      />

      {/* Racha + tu semana: se transmite aparte para no bloquear el resto */}
      <Suspense fallback={<Skeleton className="h-[172px] rounded-2xl" />}>
        <StreakWidget userId={user.id} />
      </Suspense>

      {/* Entrenamiento de hoy */}
      {rutina?.texto_rutina && membresia ? (
        <RutinaDiaria textoRutina={rutina.texto_rutina} hoyIndice={hoyIndice} userId={user.id} />
      ) : (
        <HoySinRutina tieneMembresia={Boolean(membresia)} rutinaDisponible={tieneRenovacion && !rutina} />
      )}

      {/* Registrar ejercicio + lo registrado hoy */}
      <div className="space-y-4">
        <ActiveExerciseTracker />
        <RecentExercisesList />
      </div>

      {/* Membresía, rutina, alimentación y calentamiento de un vistazo */}
      <ResumenPlan
        membresia={membresia}
        estadoMembresia={estadoMembresia}
        diasRestantes={diasRestantes}
        rutina={rutina}
        rutinaDisponible={tieneRenovacion && !rutina}
        planNutricional={planNutricional}
        nutricionHabilitada={nutricionHabilitada}
      />
    </div>
  );
}
