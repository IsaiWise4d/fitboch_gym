"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { calcularEdad } from "@/lib/utils/fecha";
import type { Profile } from "@/types/app";

const rutinaSchema = z.object({
  objetivo: z.enum([
    "perdida_de_peso",
    "hipertrofia",
    "fuerza",
    "resistencia",
    "tonificacion",
    "salud_general",
  ]),
  nivel: z.enum(["principiante", "intermedio", "avanzado"]),
  dias_semana: z.enum(["2", "3", "4", "5", "6"]),
  duracion_plan: z.enum(["3_meses", "6_meses", "12_meses"]),
  equipamiento: z.enum([
    "gym_completo",
    "pesas_libres",
    "maquinas",
    "peso_corporal",
  ]),
  lesiones: z.string().optional(),
  notas_adicionales: z.string().optional(),
});

type RutinaFormData = z.infer<typeof rutinaSchema>;

const OBJETIVOS = [
  { value: "perdida_de_peso", label: "Pérdida de peso" },
  { value: "hipertrofia", label: "Hipertrofia (ganar músculo)" },
  { value: "fuerza", label: "Fuerza" },
  { value: "resistencia", label: "Resistencia" },
  { value: "tonificacion", label: "Tonificación" },
  { value: "salud_general", label: "Salud general" },
];

const NIVELES = [
  { value: "principiante", label: "Principiante (0-6 meses)" },
  { value: "intermedio", label: "Intermedio (6 meses - 2 años)" },
  { value: "avanzado", label: "Avanzado (2+ años)" },
];

const EQUIPAMIENTO = [
  { value: "gym_completo", label: "Gimnasio completo" },
  { value: "pesas_libres", label: "Solo pesas libres" },
  { value: "maquinas", label: "Solo máquinas" },
  { value: "peso_corporal", label: "Peso corporal" },
];

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
      duracion_plan: "3_meses",
      equipamiento: "gym_completo",
      lesiones: "",
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
          Datos de tu perfil
        </p>
        <p className="text-sm">
          {profile.nombre} · {profile.fecha_nacimiento ? `${calcularEdad(profile.fecha_nacimiento)} años` : "Edad no definida"} ·{" "}
          {profile.peso_kg ? `${profile.peso_kg}kg` : "Peso no definido"} ·{" "}
          {profile.altura_cm ? `${profile.altura_cm}cm` : "Altura no definida"}
        </p>
        <p className="text-xs text-muted-foreground">
          Puedes actualizar estos datos en tu perfil antes de generar la rutina.
        </p>
      </div>

      {/* Objetivo */}
      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo principal</Label>
        <select
          id="objetivo"
          {...register("objetivo")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {OBJETIVOS.map((obj) => (
            <option key={obj.value} value={obj.value}>
              {obj.label}
            </option>
          ))}
        </select>
        {errors.objetivo && (
          <p className="text-sm text-error">{errors.objetivo.message}</p>
        )}
      </div>

      {/* Nivel */}
      <div className="space-y-2">
        <Label htmlFor="nivel">Nivel de experiencia</Label>
        <select
          id="nivel"
          {...register("nivel")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {NIVELES.map((niv) => (
            <option key={niv.value} value={niv.value}>
              {niv.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Días por semana */}
        <div className="space-y-2">
          <Label htmlFor="dias_semana">Días por semana</Label>
          <select
            id="dias_semana"
            {...register("dias_semana")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {["2", "3", "4", "5", "6"].map((d) => (
              <option key={d} value={d}>
                {d} días
              </option>
            ))}
          </select>
        </div>

        {/* Duración del plan */}
        <div className="space-y-2">
          <Label htmlFor="duracion_plan">Duración del plan</Label>
          <select
            id="duracion_plan"
            {...register("duracion_plan")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="3_meses">3 meses</option>
            <option value="6_meses">6 meses</option>
            <option value="12_meses">12 meses</option>
          </select>
        </div>
      </div>

      {/* Equipamiento */}
      <div className="space-y-2">
        <Label htmlFor="equipamiento">Equipamiento disponible</Label>
        <select
          id="equipamiento"
          {...register("equipamiento")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {EQUIPAMIENTO.map((eq) => (
            <option key={eq.value} value={eq.value}>
              {eq.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lesiones */}
      <div className="space-y-2">
        <Label htmlFor="lesiones">Lesiones o limitaciones (opcional)</Label>
        <Input
          id="lesiones"
          placeholder="Ej: dolor en rodilla derecha, no puedo correr..."
          {...register("lesiones")}
        />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas_adicionales">Notas adicionales (opcional)</Label>
        <Input
          id="notas_adicionales"
          placeholder="Ej: prefiero entrenar por la mañana..."
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
            Generando rutina...
          </>
        ) : (
          "Generar Mi Rutina"
        )}
      </Button>

      {generating && (
        <p className="text-xs text-center text-muted-foreground">
          La IA está creando tu rutina personalizada. Esto puede tomar unos
          segundos...
        </p>
      )}
    </form>
  );
}
