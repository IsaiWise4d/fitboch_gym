"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Apple } from "lucide-react";
import { calcularEdad } from "@/lib/utils/fecha";
import type { Profile } from "@/types/app";

const nutricionSchema = z.object({
  objetivo: z.enum([
    "perdida_de_grasa",
    "hipertrofia",
    "recomposicion",
    "fuerza_estetica",
    "salud_general",
  ]),
  nivelActividad: z.enum([
    "sedentario",
    "ligero",
    "moderado",
    "intenso",
    "muy_intenso",
  ]),
  horarioEntrenamiento: z.enum([
    "madrugada",
    "manana",
    "mediodia",
    "tarde",
    "noche",
  ]),
  restricciones: z.string().optional(),
});

type NutricionFormData = z.infer<typeof nutricionSchema>;

const OBJETIVOS = [
  { value: "perdida_de_grasa", label: "Pérdida de grasa extrema" },
  { value: "hipertrofia", label: "Hipertrofia (Ganancia de volumen limpio)" },
  { value: "recomposicion", label: "Recomposición corporal (Perder grasa y ganar músculo)" },
  { value: "fuerza_estetica", label: "Rendimiento, Fuerza + Estética" },
  { value: "salud_general", label: "Salud general y mantenimiento" },
];

const NIVELES_ACTIVIDAD = [
  { value: "sedentario", label: "Sedentario (Poco o ningún ejercicio extra)" },
  { value: "ligero", label: "Ligero (Ejercicio ligero 1-3 días/semana)" },
  { value: "moderado", label: "Moderado (Ejercicio moderado 3-5 días/semana)" },
  { value: "intenso", label: "Intenso (Ejercicio fuerte 6-7 días/semana)" },
  { value: "muy_intenso", label: "Muy intenso (Doble turno o trabajo físico pesado)" },
];

const HORARIOS_ENTRENAMIENTO = [
  { value: "madrugada", label: "Madrugada (5am - 8am)" },
  { value: "manana", label: "Mañana (8am - 12pm)" },
  { value: "mediodia", label: "Mediodía (12pm - 3pm)" },
  { value: "tarde", label: "Tarde (3pm - 7pm)" },
  { value: "noche", label: "Noche (7pm en adelante)" },
];

const selectClass = "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

const FRASES_LOADING = [
  "Analizando tu metabolismo y requerimientos...",
  "Calculando tus calorías y macros óptimos...",
  "Diseñando estrategias para mejorar tu digestión...",
  "Estructurando tus comidas alrededor de tu entrenamiento...",
  "Optimizando el balance hormonal con nutrición...",
  "Seleccionando micronutrientes clave para ti...",
  "Preparando sugerencias de suplementación natural...",
  "Ajustando el plan a tus niveles de actividad...",
  "Elaborando un protocolo de crononutrición moderno...",
  "Finalizando los detalles de tu dieta estratégica...",
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
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center space-y-6 animate-in zoom-in-95 fade-in duration-300">
        {/* Icono animado */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Apple className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-lg font-bold text-white">Generando tu plan nutricional</h2>
          <p className="text-xs text-muted-foreground mt-1">La IA nutricional está trabajando</p>
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
        </div>
      </div>
    </div>
  );
}

export function FormularioNutricion({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NutricionFormData>({
    resolver: zodResolver(nutricionSchema),
    defaultValues: {
      objetivo: "hipertrofia",
      nivelActividad: "moderado",
      horarioEntrenamiento: "tarde",
      restricciones: "",
    },
  });

  async function onSubmit(data: NutricionFormData) {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generar-plan-nutricional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objetivo: OBJETIVOS.find(o => o.value === data.objetivo)?.label || data.objetivo,
          nivelActividad: NIVELES_ACTIVIDAD.find(n => n.value === data.nivelActividad)?.label || data.nivelActividad,
          horarioEntrenamiento: HORARIOS_ENTRENAMIENTO.find(h => h.value === data.horarioEntrenamiento)?.label || data.horarioEntrenamiento,
          restricciones: data.restricciones,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al generar el plan. Intenta de nuevo.");
        setGenerating(false);
        return;
      }

      router.refresh();
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
          Tus datos biométricos
        </p>
        <p className="text-sm">
          {profile.fecha_nacimiento ? `${calcularEdad(profile.fecha_nacimiento)} años` : "Edad faltante"} ·{" "}
          {profile.peso_kg ? `${profile.peso_kg}kg` : "Peso faltante"} ·{" "}
          {profile.altura_cm ? `${profile.altura_cm}cm` : "Altura faltante"}
        </p>
        {(profile.porcentaje_grasa) && (
          <p className="text-sm text-muted-foreground mt-1">
            Grasa estimada: {profile.porcentaje_grasa}% 
          </p>
        )}
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

      {/* Nivel Actividad */}
      <div className="space-y-2">
        <Label htmlFor="nivelActividad">Nivel de Actividad Diaria</Label>
        <select id="nivelActividad" {...register("nivelActividad")} className={selectClass}>
          {NIVELES_ACTIVIDAD.map((niv) => (
            <option key={niv.value} value={niv.value}>{niv.label}</option>
          ))}
        </select>
      </div>

      {/* Horario Entrenamiento */}
      <div className="space-y-2">
        <Label htmlFor="horarioEntrenamiento">¿En qué horario entrenas?</Label>
        <select id="horarioEntrenamiento" {...register("horarioEntrenamiento")} className={selectClass}>
          {HORARIOS_ENTRENAMIENTO.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Restricciones */}
      <div className="space-y-2">
        <Label htmlFor="restricciones">Alergias o Restricciones (opcional)</Label>
        <Input
          id="restricciones"
          placeholder="Ej: intolerante a la lactosa, vegetariano, alérgico al maní..."
          {...register("restricciones")}
        />
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error animate-in fade-in">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={generating}>
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Construyendo macros...
          </>
        ) : (
          "Generar Mi Plan Nutricional"
        )}
      </Button>

      {generating && <GenerandoOverlay />}
    </form>
  );
}
