"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Dumbbell } from "lucide-react";
import { calcularEdad } from "@/lib/utils/fecha";
import type { Profile } from "@/types/app";

const rutinaSchema = z.object({
  objetivo: z.enum([
    "perdida_de_grasa",
    "hipertrofia",
    "recomposicion",
    "fuerza_estetica",
    "salud_general",
  ]),
  nivel: z.enum(["principiante", "intermedio", "avanzado"]),
  dias_semana: z.enum(["2", "3", "4", "5", "6"]),
  duracion_sesion: z.enum(["45_min", "60_min", "75_min", "90_min", "120_min"]),
  equipamiento: z.enum([
    "gym_completo",
    "pesas_libres",
    "maquinas",
    "peso_corporal",
  ]),
  biotipo: z.enum(["ectomorfo", "mesomorfo", "endomorfo", "mixto"]),
  tiempo_entrenando: z.enum(["menos_3_meses", "3_12_meses", "1_3_anos", "mas_3_anos"]),
  zonas_prioritarias: z.enum(["tren_superior", "tren_inferior", "core", "todo_cuerpo"]),
  porcentaje_grasa: z.string().optional(),
  lesiones: z.string().optional(),
  notas_adicionales: z.string().optional(),
});

type RutinaFormData = z.infer<typeof rutinaSchema>;

const OBJETIVOS = [
  { value: "perdida_de_grasa", label: "Pérdida de grasa" },
  { value: "hipertrofia", label: "Hipertrofia (volumen limpio)" },
  { value: "recomposicion", label: "Recomposición corporal" },
  { value: "fuerza_estetica", label: "Fuerza + Estética" },
  { value: "salud_general", label: "Salud general" },
];

const NIVELES = [
  { value: "principiante", label: "Principiante (0-6 meses)" },
  { value: "intermedio", label: "Intermedio (6 meses - 2 años)" },
  { value: "avanzado", label: "Avanzado (2+ años)" },
];

const EQUIPAMIENTO = [
  { value: "gym_completo", label: "Gimnasio completo FitBoch" },
  { value: "pesas_libres", label: "Solo pesas libres" },
  { value: "maquinas", label: "Solo máquinas y poleas" },
  { value: "peso_corporal", label: "Peso corporal" },
];

const DURACION_SESION = [
  { value: "45_min", label: "45 min" },
  { value: "60_min", label: "60 min" },
  { value: "75_min", label: "75 min" },
  { value: "90_min", label: "90 min" },
  { value: "120_min", label: "120 min" },
];

const BIOTIPOS = [
  { value: "ectomorfo", label: "Ectomorfo (delgado)" },
  { value: "mesomorfo", label: "Mesomorfo (atlético)" },
  { value: "endomorfo", label: "Endomorfo (robusto)" },
  { value: "mixto", label: "No estoy seguro" },
];

const TIEMPO_ENTRENANDO = [
  { value: "menos_3_meses", label: "Menos de 3 meses" },
  { value: "3_12_meses", label: "3 a 12 meses" },
  { value: "1_3_anos", label: "1 a 3 años" },
  { value: "mas_3_anos", label: "Más de 3 años" },
];

const ZONAS = [
  { value: "todo_cuerpo", label: "Todo el cuerpo" },
  { value: "tren_superior", label: "Tren superior" },
  { value: "tren_inferior", label: "Tren inferior" },
  { value: "core", label: "Core / zona media" },
];

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const FRASES_LOADING = [
  "Analizando tu perfil y objetivos...",
  "Diseñando la periodización perfecta para ti...",
  "Seleccionando los mejores ejercicios para tu nivel...",
  "Calculando volumen óptimo por grupo muscular...",
  "Creando tu plan de entrenamiento personalizado...",
  "Ajustando la progresión semanal de cargas...",
  "Optimizando la frecuencia de entrenamiento...",
  "Preparando recomendaciones técnicas...",
  "Diseñando tu protocolo de cardio estratégico...",
  "Finalizando los últimos detalles de tu rutina...",
  "Tu rutina está casi lista, un momento más...",
];

function GenerandoOverlay() {
  const [fraseIndex, setFraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFraseIndex((prev) => (prev + 1) % FRASES_LOADING.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center space-y-6">
        {/* Icono animado */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-lg font-bold text-white">Generando tu rutina</h2>
          <p className="text-xs text-muted-foreground mt-1">Esto puede tomar hasta 60 segundos</p>
        </div>

        {/* Frase rotativa */}
        <div className="h-10 flex items-center justify-center">
          <p
            key={fraseIndex}
            className="text-sm text-primary font-medium animate-fade-in"
          >
            {FRASES_LOADING[fraseIndex]}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">La IA está trabajando en tu plan personalizado</p>
        </div>
      </div>
    </div>
  );
}

export function FormularioRutina({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RutinaFormData>({
    resolver: zodResolver(rutinaSchema),
    defaultValues: {
      objetivo: "hipertrofia",
      nivel: "principiante",
      dias_semana: "4",
      duracion_sesion: "60_min",
      equipamiento: "gym_completo",
      biotipo: "mixto",
      tiempo_entrenando: "menos_3_meses",
      zonas_prioritarias: "todo_cuerpo",
      porcentaje_grasa: profile.porcentaje_grasa || "",
      lesiones: profile.lesiones || "",
      notas_adicionales: "",
    },
  });

  async function onSubmit(data: RutinaFormData) {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generar-rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: profile.nombre,
          edad: profile.fecha_nacimiento
            ? calcularEdad(profile.fecha_nacimiento)
            : null,
          peso_kg: profile.peso_kg,
          altura_cm: profile.altura_cm,
          genero: profile.genero,
          ...data,
          dias_semana: Number(data.dias_semana),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(
          result.error || "Error al generar la rutina. Intenta de nuevo."
        );
        setGenerating(false);
        return;
      }

      // Forzamos el refetch del Server Component y navegamos para que la
      // página re-lea la rutina y muestre el viewer en lugar del formulario.
      router.refresh();
      router.push("/rutina");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Datos pre-cargados del perfil */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          Datos de tu perfil
        </p>
        <p className="text-sm">
          {profile.nombre} · {profile.fecha_nacimiento ? `${calcularEdad(profile.fecha_nacimiento)} años` : "Edad no definida"} ·{" "}
          {profile.peso_kg ? `${profile.peso_kg}kg` : "Peso no definido"} ·{" "}
          {profile.altura_cm ? `${profile.altura_cm}cm` : "Altura no definida"}
        </p>
        {(profile.porcentaje_grasa || profile.lesiones) && (
          <p className="text-sm text-muted-foreground mt-1">
            {profile.porcentaje_grasa && `Grasa: ${profile.porcentaje_grasa}% `} 
            {profile.porcentaje_grasa && profile.lesiones && '· '}
            {profile.lesiones && `Lesiones: ${profile.lesiones}`}
          </p>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Puedes actualizar estos datos en tu perfil antes de generar la rutina.
        </p>
      </div>

      {/* Objetivo */}
      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo principal</Label>
        <select id="objetivo" {...register("objetivo")} className={selectClass}>
          {OBJETIVOS.map((obj) => (
            <option key={obj.value} value={obj.value}>{obj.label}</option>
          ))}
        </select>
        {errors.objetivo && (
          <p className="text-sm text-error">{errors.objetivo.message}</p>
        )}
      </div>

      {/* Zonas prioritarias */}
      <div className="space-y-2">
        <Label htmlFor="zonas_prioritarias">Zonas prioritarias</Label>
        <select id="zonas_prioritarias" {...register("zonas_prioritarias")} className={selectClass}>
          {ZONAS.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Nivel */}
        <div className="space-y-2">
          <Label htmlFor="nivel">Nivel de experiencia</Label>
          <select id="nivel" {...register("nivel")} className={selectClass}>
            {NIVELES.map((niv) => (
              <option key={niv.value} value={niv.value}>{niv.label}</option>
            ))}
          </select>
        </div>

        {/* Tiempo entrenando */}
        <div className="space-y-2">
          <Label htmlFor="tiempo_entrenando">Tiempo entrenando</Label>
          <select id="tiempo_entrenando" {...register("tiempo_entrenando")} className={selectClass}>
            {TIEMPO_ENTRENANDO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Días por semana */}
        <div className="space-y-2">
          <Label htmlFor="dias_semana">Días por semana</Label>
          <select id="dias_semana" {...register("dias_semana")} className={selectClass}>
            {["2", "3", "4", "5", "6"].map((d) => (
              <option key={d} value={d}>{d} días</option>
            ))}
          </select>
        </div>

        {/* Duración por sesión */}
        <div className="space-y-2">
          <Label htmlFor="duracion_sesion">Duración por sesión</Label>
          <select id="duracion_sesion" {...register("duracion_sesion")} className={selectClass}>
            {DURACION_SESION.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>



      {/* Equipamiento */}
      <div className="space-y-2">
        <Label htmlFor="equipamiento">Equipamiento disponible</Label>
        <select id="equipamiento" {...register("equipamiento")} className={selectClass}>
          {EQUIPAMIENTO.map((eq) => (
            <option key={eq.value} value={eq.value}>{eq.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Biotipo */}
        <div className="space-y-2">
          <Label htmlFor="biotipo">Biotipo corporal</Label>
          <select id="biotipo" {...register("biotipo")} className={selectClass}>
            {BIOTIPOS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* % Grasa corporal */}
        <div className="space-y-2">
          <Label htmlFor="porcentaje_grasa">% Grasa corporal</Label>
          <Input
            id="porcentaje_grasa"
            type="number"
            step="0.1"
            disabled
            placeholder="Desde el perfil"
            {...register("porcentaje_grasa")}
          />
        </div>
      </div>

      {/* Lesiones */}
      <div className="space-y-2">
        <Label htmlFor="lesiones">Lesiones o limitaciones</Label>
        <Input
          id="lesiones"
          disabled
          placeholder="Desde el perfil"
          {...register("lesiones")}
        />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas_adicionales">Notas adicionales (opcional)</Label>
        <Input
          id="notas_adicionales"
          placeholder="Ej: quiero priorizar glúteos, prefiero ejercicios con mancuernas..."
          {...register("notas_adicionales")}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={generating}>
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generando rutina con IA...
          </>
        ) : (
          "Generar Mi Rutina"
        )}
      </Button>

      {generating && <GenerandoOverlay />}
    </form>
  );
}
