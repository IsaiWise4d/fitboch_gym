"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/app";
import {
  CheckCircle2,
  HeartPulse,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Ruler,
  UserRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { calcularEdad } from "@/lib/utils/fecha";
import { MedidorImc, calcularImc } from "./MedidorImc";

interface PerfilFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  fecha_nacimiento: string;
  peso_kg: string;
  altura_cm: string;
  genero: string;
  porcentaje_grasa: string;
  lesiones: string;
}

const GENEROS = [
  { valor: "masculino", etiqueta: "Hombre" },
  { valor: "femenino", etiqueta: "Mujer" },
];

function Seccion({
  titulo,
  icono: Icono,
  accion,
  children,
}: {
  titulo: string;
  icono: LucideIcon;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icono className="h-4 w-4 text-primary" aria-hidden="true" />
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Campo numérico con la unidad (kg, cm, %) dentro, a la derecha. */
function ConUnidad({ unidad, children }: { unidad: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {unidad}
      </span>
    </div>
  );
}

function Medida({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-[11px] text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 truncate text-lg font-semibold leading-tight">{valor ?? "—"}</p>
    </div>
  );
}

export function PerfilForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const bloqueado = profile.perfil_completo;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PerfilFormData>({
    defaultValues: {
      nombre: profile.nombre,
      apellido: profile.apellido || "",
      telefono: profile.telefono || "",
      fecha_nacimiento: profile.fecha_nacimiento || "",
      peso_kg: profile.peso_kg?.toString() || "",
      altura_cm: profile.altura_cm?.toString() || "",
      genero: profile.genero || "",
      porcentaje_grasa: profile.porcentaje_grasa || "",
      lesiones: profile.lesiones || "",
    },
  });

  // El mensaje de éxito se oculta solo; el de error queda hasta reintentar.
  useEffect(() => {
    if (message?.type !== "success") return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  // Medidas en vivo mientras el usuario escribe.
  const [pesoTexto, alturaTexto, fechaNacimiento] = watch(["peso_kg", "altura_cm", "fecha_nacimiento"]);
  const peso = pesoTexto ? Number(pesoTexto) : null;
  const altura = alturaTexto ? Number(alturaTexto) : null;
  const edadCalculada = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const imc = calcularImc(peso, altura);

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
        porcentaje_grasa: data.porcentaje_grasa || null,
        lesiones: data.lesiones || null,
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
      // Los valores guardados pasan a ser la base: el botón de guardar se oculta.
      reset(data);
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

  const mostrarGuardar = isDirty || !bloqueado;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tus medidas (se actualizan al escribir) */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Medida etiqueta="Peso" valor={peso ? `${peso} kg` : null} />
            <Medida etiqueta="Altura" valor={altura ? `${altura} cm` : null} />
            <Medida etiqueta="Edad" valor={edadCalculada !== null ? `${edadCalculada} años` : null} />
          </div>
          <MedidorImc imc={imc} />
        </div>

        <Seccion
          titulo="Datos personales"
          icono={UserRound}
          accion={
            bloqueado ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Bloqueados
              </span>
            ) : undefined
          }
        >
          {bloqueado && (
            <p className="-mt-1 text-xs leading-relaxed text-muted-foreground">
              Se bloquean al completar el perfil. Para cambiarlos, habla con el gimnasio.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                autoComplete="given-name"
                disabled={bloqueado}
                {...register("nombre", { required: "El nombre es requerido" })}
              />
              {errors.nombre && (
                <p className="text-sm text-error">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                autoComplete="family-name"
                disabled={bloqueado}
                {...register("apellido")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              disabled={bloqueado}
              placeholder="+57 300 123 4567"
              {...register("telefono")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              autoComplete="bday"
              disabled={bloqueado}
              {...register("fecha_nacimiento")}
            />
          </div>

          <div className="space-y-2">
            <p id="genero-etiqueta" className="text-sm font-medium leading-none">
              Género
            </p>
            <div
              role="radiogroup"
              aria-labelledby="genero-etiqueta"
              className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1"
            >
              {GENEROS.map(({ valor, etiqueta }) => (
                <label key={valor} className="relative">
                  <input
                    type="radio"
                    value={valor}
                    disabled={bloqueado}
                    className="peer sr-only"
                    {...register("genero")}
                  />
                  <span className="flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-muted-foreground transition-all peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-70 peer-active:scale-95">
                    {etiqueta}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Medidas corporales" icono={Ruler}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_kg">Peso</Label>
              <ConUnidad unidad="kg">
                <Input
                  id="peso_kg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="75.0"
                  className="pr-10"
                  {...register("peso_kg")}
                />
              </ConUnidad>
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura_cm">Altura</Label>
              <ConUnidad unidad="cm">
                <Input
                  id="altura_cm"
                  type="number"
                  inputMode="numeric"
                  placeholder="175"
                  className="pr-10"
                  {...register("altura_cm")}
                />
              </ConUnidad>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="porcentaje_grasa">Porcentaje de grasa</Label>
            <ConUnidad unidad="%">
              <Input
                id="porcentaje_grasa"
                inputMode="decimal"
                placeholder="Ej: 15"
                className="pr-10"
                {...register("porcentaje_grasa")}
              />
            </ConUnidad>
            <p className="text-xs text-muted-foreground">Opcional. Si no lo sabes, déjalo vacío.</p>
          </div>
        </Seccion>

        <Seccion titulo="Salud" icono={HeartPulse}>
          <div className="space-y-2">
            <Label htmlFor="lesiones">Lesiones o limitaciones</Label>
            <textarea
              id="lesiones"
              rows={3}
              placeholder="Ej: Molestia en rodilla derecha..."
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              {...register("lesiones")}
            />
            <p className="text-xs text-muted-foreground">
              Lo tenemos en cuenta al generar tu rutina para evitar ejercicios riesgosos.
            </p>
          </div>
        </Seccion>

        {/* Guardar: fijo al pie, solo cuando hay cambios (o falta completar) */}
        {mostrarGuardar && (
          <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 space-y-2 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-1 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {message?.type === "error" && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {message.text}
              </div>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-black/40"
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Guardando..." : bloqueado ? "Guardar cambios" : "Guardar y completar perfil"}
            </Button>
          </div>
        )}
      </form>

      <Seccion titulo="Cuenta" icono={Mail}>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Email</span>
          <span className="min-w-0 truncate text-sm">{profile.email}</span>
        </div>
        <Button
          variant="outline"
          className="h-11 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </Seccion>

      {/* Confirmación flotante (el botón de guardar ya no está visible) */}
      {message?.type === "success" && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-success/30 bg-surface/95 p-3 text-sm text-success shadow-lg shadow-black/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message.text}
        </div>
      )}
    </div>
  );
}
