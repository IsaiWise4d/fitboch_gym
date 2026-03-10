"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/app";
import { LogOut } from "lucide-react";
import { calcularEdad } from "@/lib/utils/fecha";

interface PerfilFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  fecha_nacimiento: string;
  peso_kg: string;
  altura_cm: string;
  genero: string;
}

export function PerfilForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PerfilFormData>({
    defaultValues: {
      nombre: profile.nombre,
      apellido: profile.apellido || "",
      telefono: profile.telefono || "",
      fecha_nacimiento: profile.fecha_nacimiento || "",
      peso_kg: profile.peso_kg?.toString() || "",
      altura_cm: profile.altura_cm?.toString() || "",
      genero: profile.genero || "",
    },
  });

  const fechaNacimiento = watch("fecha_nacimiento");
  const edadCalculada = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;

  async function onSubmit(data: PerfilFormData) {
    if (!data.nombre.trim()) return;

    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    // Marcar perfil como completo si tiene los datos esenciales
    const tieneDataEsencial =
      data.nombre.trim() &&
      data.fecha_nacimiento &&
      data.peso_kg &&
      data.altura_cm &&
      data.genero;

    const { error } = await supabase
      .from("profiles")
      .update({
        nombre: data.nombre,
        apellido: data.apellido || null,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        peso_kg: data.peso_kg ? Number(data.peso_kg) : null,
        altura_cm: data.altura_cm ? Number(data.altura_cm) : null,
        genero: (data.genero as "masculino" | "femenino") || null,
        perfil_completo: !!tieneDataEsencial,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage({
        type: "error",
        text: "Error al guardar. Intenta de nuevo.",
      });
    } else {
      setMessage({
        type: "success",
        text: "Perfil actualizado correctamente.",
      });
      router.refresh();
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            {...register("nombre", { required: "El nombre es requerido" })}
          />
          {errors.nombre && (
            <p className="text-sm text-error">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" {...register("apellido")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            type="tel"
            placeholder="+57 300 123 4567"
            {...register("telefono")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              {...register("fecha_nacimiento")}
            />
            {edadCalculada !== null && (
              <p className="text-xs text-muted-foreground">
                {edadCalculada} años
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="genero">Género</Label>
            <select
              id="genero"
              {...register("genero")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar</option>
              <option value="masculino">Hombre</option>
              <option value="femenino">Mujer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peso_kg">Peso (kg)</Label>
            <Input
              id="peso_kg"
              type="number"
              step="0.1"
              placeholder="75.0"
              {...register("peso_kg")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altura_cm">Altura (cm)</Label>
            <Input
              id="altura_cm"
              type="number"
              placeholder="175"
              {...register("altura_cm")}
            />
          </div>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === "success"
                ? "bg-success/10 text-success"
                : "bg-error/10 text-error"
            }`}
          >
            {message.text}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-2">
          Email: {profile.email}
        </p>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
