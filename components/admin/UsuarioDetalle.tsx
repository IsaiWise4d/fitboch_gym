"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Dumbbell,
  Flame,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { format, parseISO, addMonths, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Profile, Membresia, PlanNutricional } from "@/types/app";
import type { ResumenAdminRacha } from "@/lib/racha/types";

const RutinaEditor = dynamic(() => import("@/components/admin/RutinaEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-32 items-center justify-center rounded-md border border-border bg-white/5">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

type RutinaResumen = {
  id: string;
  created_at: string;
  duracion_plan: string;
  estado: "activa" | "archivada";
  modelo_ia: string;
  texto_rutina: string;
};

interface Props {
  profile: Profile;
  membresias: Membresia[];
  rutinas: RutinaResumen[];
  planesNutricionales: PlanNutricional[];
  racha?: ResumenAdminRacha | null;
}

const PLAN_MESES: Record<string, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

/** Etiqueta y color del estado de la racha para la tarjeta del detalle. */
function metaEstadoRacha(
  racha: ResumenAdminRacha
): { label: string; clase: string } {
  const { estado } = racha;
  if (estado.rota) return { label: "Rota", clase: "bg-error/20 text-error" };
  if (estado.enRiesgo)
    return { label: "En riesgo", clase: "bg-warning/20 text-warning" };
  if (estado.hoyActivado)
    return { label: "Hoy activada", clase: "bg-success/20 text-success" };
  if (estado.esDomingo)
    return { label: "Descanso (domingo)", clase: "bg-white/10 text-muted-foreground" };
  return { label: "Pendiente hoy", clase: "bg-white/10 text-muted-foreground" };
}

/** Color de la cifra de racha actual según su estado. */
function colorRachaActual(racha: ResumenAdminRacha): string {
  if (racha.estado.enRiesgo) return "text-warning";
  if (racha.estado.currentCount > 0) return "text-orange-400";
  return "text-muted-foreground";
}

export function UsuarioDetalle({ profile, membresias, rutinas, planesNutricionales, racha }: Props) {
  const router = useRouter();
  const [showRenovar, setShowRenovar] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const membresiaActiva = membresias.find((m) => m.estado === "activa") ?? null;
  const rutinaActiva = rutinas.find((r) => r.estado === "activa") ?? null;
  const planNutriActivo = planesNutricionales.find((p) => p.estado === "activa") ?? null;
  const hoy = startOfDay(new Date());
  const membresiaVigente = membresiaActiva
    ? !isBefore(startOfDay(parseISO(membresiaActiva.fecha_fin)), hoy)
    : false;
  const [confirmarNuevaRutina, setConfirmarNuevaRutina] = useState(false);
  const [confirmarNuevoPlanNutricional, setConfirmarNuevoPlanNutricional] = useState(false);
  const [confirmarEliminarMembresia, setConfirmarEliminarMembresia] = useState(false);
  const [confirmarEliminarUsuario, setConfirmarEliminarUsuario] = useState(false);
  const [confirmarToggleUsuario, setConfirmarToggleUsuario] = useState(false);
  const [editandoRutina, setEditandoRutina] = useState(false);
  const [textoRutinaEdit, setTextoRutinaEdit] = useState(
    rutinaActiva?.texto_rutina || ""
  );
  
  const [editandoPlan, setEditandoPlan] = useState(false);
  const [textoPlanEdit, setTextoPlanEdit] = useState(
    planNutriActivo?.texto_plan || ""
  );

  const [incluirNutricional, setIncluirNutricional] = useState(
    membresiaActiva?.plan_nutricional_habilitado ?? false
  );

  useEffect(() => {
    setTextoRutinaEdit(rutinaActiva?.texto_rutina || "");
    setEditandoRutina(false);
  }, [rutinaActiva?.id, rutinaActiva?.texto_rutina]);

  useEffect(() => {
    setTextoPlanEdit(planNutriActivo?.texto_plan || "");
    setEditandoPlan(false);
  }, [planNutriActivo?.id, planNutriActivo?.texto_plan]);

  // Renovar membresía
  const [tipoPlan, setTipoPlan] = useState<string>("mensual");
  const [monto, setMonto] = useState("");
  const [fechaFinManual, setFechaFinManual] = useState("");
  const [usarFechaManual, setUsarFechaManual] = useState(false);

  const fechaBaseRenovacion = membresiaVigente && membresiaActiva
    ? parseISO(membresiaActiva.fecha_fin)
    : new Date();

  const fechaFinAuto = format(
    addDays(addMonths(fechaBaseRenovacion, PLAN_MESES[tipoPlan] || 1), -1),
    "yyyy-MM-dd"
  );

  async function handleRenovar() {
    setLoading("renovar");
    setError(null);

    const hoy = new Date();
    const fechaInicio = format(hoy, "yyyy-MM-dd");
    const fechaFin = usarFechaManual && fechaFinManual
      ? fechaFinManual
      : fechaFinAuto;

    try {
      const res = await fetch("/api/admin/renovar-membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: profile.id,
          tipo_plan: tipoPlan,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          monto_pagado: monto ? Number(monto) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al renovar");
      } else {
        setShowRenovar(false);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleNutricional(habilitado: boolean) {
    if (!membresiaActiva) return;
    setLoading("nutricional");
    setError(null);
    try {
      const res = await fetch("/api/admin/toggle-nutricional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membresia_id: membresiaActiva.id,
          habilitado,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al actualizar plan nutricional");
      } else {
        setIncluirNutricional(habilitado);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handleHabilitarRutina() {
    setLoading("rutina");
    setError(null);

    try {
      const res = await fetch("/api/admin/habilitar-rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: profile.id,
          plan_nutricional: incluirNutricional,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al habilitar rutina");
      } else {
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handleHabilitarPlanNutricional() {
    setLoading("plan-nutri");
    setError(null);

    try {
      const res = await fetch("/api/admin/habilitar-plan-nutricional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: profile.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al habilitar nuevo plan nutricional");
      } else {
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handleGuardarTextoRutina() {
    if (!rutinaActiva) return;
    setLoading("editar-rutina");
    setError(null);

    try {
      const res = await fetch("/api/admin/editar-rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rutina_id: rutinaActiva.id,
          texto_rutina: textoRutinaEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar la rutina");
      } else {
        setEditandoRutina(false);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function handleGuardarTextoPlanNutricional() {
    if (!planNutriActivo) return;
    setLoading("editar-plan");
    setError(null);

    try {
      const res = await fetch("/api/admin/editar-plan-nutricional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planNutriActivo.id,
          texto_plan: textoPlanEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar el plan nutricional");
      } else {
        setEditandoPlan(false);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/usuarios"
          className="rounded-md p-1.5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          {profile.nombre} {profile.apellido || ""}
        </h1>
      </div>

      {error && (
        <div className="rounded-md bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Datos del perfil */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-primary" />
          Datos del perfil
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="truncate">{profile.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="truncate">{profile.telefono || "No definido"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Género</p>
            <p className="capitalize">{profile.genero || "No definido"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha nacimiento</p>
            <p>
              {profile.fecha_nacimiento
                ? format(parseISO(profile.fecha_nacimiento), "d MMM yyyy", {
                    locale: es,
                  })
                : "No definida"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peso / Altura</p>
            <p>
              {profile.peso_kg ? `${profile.peso_kg}kg` : "--"} /{" "}
              {profile.altura_cm ? `${profile.altura_cm}cm` : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">% Grasa corporal</p>
            <p>{profile.porcentaje_grasa || "No definido"}</p>
          </div>
          <div className="md:col-span-2 min-w-0">
            <p className="text-xs text-muted-foreground">Lesiones / limitaciones</p>
            <p className="truncate">{profile.lesiones || "No definido"}</p>
          </div>
        </div>
      </div>

      {/* Racha */}
      {racha && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flame
                className={`h-4 w-4 text-primary ${
                  racha.estado.hoyActivado ? "flame-pulse" : ""
                }`}
              />
              Racha de entrenamiento
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${metaEstadoRacha(racha).clase}`}
            >
              {metaEstadoRacha(racha).label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Racha actual</p>
              <p
                className={`flex items-center gap-1 font-semibold ${colorRachaActual(racha)}`}
              >
                <Flame className={`h-4 w-4 ${colorRachaActual(racha)}`} />
                {racha.estado.currentCount}{" "}
                {racha.estado.currentCount === 1 ? "día" : "días"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mejor racha</p>
              <p>
                {racha.mejorRacha} {racha.mejorRacha === 1 ? "día" : "días"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activos este mes</p>
              <p>
                {racha.diasActivosMes}{" "}
                {racha.diasActivosMes === 1 ? "día" : "días"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Membresía actual */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Membresía actual
          </div>
          {membresiaActiva && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                membresiaVigente
                  ? "bg-success/20 text-success"
                  : "bg-error/20 text-error"
              }`}
            >
              {membresiaVigente ? "Activa" : "Vencida"}
            </span>
          )}
        </div>

        {membresiaActiva ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="capitalize">{membresiaActiva.tipo_plan}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vence</p>
              <p>
                {format(parseISO(membresiaActiva.fecha_fin), "d MMM yyyy", {
                  locale: es,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renovación rutina</p>
              <p>
                {membresiaVigente && membresiaActiva.renovacion_habilitada
                  ? "Habilitada"
                  : "No habilitada"}
              </p>
            </div>
            {membresiaActiva.monto_pagado && (
              <div>
                <p className="text-xs text-muted-foreground">Monto</p>
                <p>${membresiaActiva.monto_pagado}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este usuario no tiene membresía activa
          </p>
        )}

        {/* Botón renovar / editar */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowRenovar(!showRenovar)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {membresiaVigente
            ? "Editar membresía vigente"
            : membresiaActiva
              ? "Crear nueva membresía"
              : "Crear membresía"}
        </Button>

        {/* Formulario renovar */}
        {showRenovar && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {membresiaVigente
                ? "La membresía actual está vigente: esta acción la editará y ajustará su fecha fin."
                : "No hay membresía vigente: esta acción creará una nueva membresía activa."}
            </p>
            <div className="space-y-2">
              <Label>Tipo de plan</Label>
              <select
                value={tipoPlan}
                onChange={(e) => setTipoPlan(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fecha fin</Label>
                <button
                  type="button"
                  onClick={() => {
                    setUsarFechaManual(!usarFechaManual);
                    if (!usarFechaManual) setFechaFinManual("");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {usarFechaManual ? "Usar automática" : "Personalizar fecha"}
                </button>
              </div>
              {usarFechaManual ? (
                <Input
                  type="date"
                  value={fechaFinManual}
                  onChange={(e) => setFechaFinManual(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  inputMode="none"
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              ) : (
                <p className="text-sm text-muted-foreground px-3 py-1.5 rounded-md border border-border bg-white/5">
                  {format(parseISO(fechaFinAuto), "d MMM yyyy", { locale: es })}
                  <span className="text-xs ml-2 opacity-60">(auto{membresiaVigente ? " desde fin actual" : ""})</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Monto pagado (opcional)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleRenovar}
              disabled={loading === "renovar" || (usarFechaManual && !fechaFinManual)}
            >
              {loading === "renovar" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {membresiaVigente ? "Guardar cambios de membresía" : "Confirmar creación"}
            </Button>
          </div>
        )}

        {/* Botón eliminar membresía */}
        {membresiaActiva && !confirmarEliminarMembresia && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-error border-error/30 hover:bg-error/10"
            onClick={() => setConfirmarEliminarMembresia(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar membresía
          </Button>
        )}

        {/* Confirmación eliminar membresía */}
        {confirmarEliminarMembresia && (
          <div className="rounded-lg border border-error/50 bg-error/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-error">
              <AlertTriangle className="h-4 w-4" />
              ¿Eliminar membresía?
            </div>
            <p className="text-xs text-muted-foreground">
              Se eliminará la membresía activa de este usuario. Ya no podrá ver su rutina hasta que se le asigne una nueva.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmarEliminarMembresia(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-error text-white hover:bg-error/80"
                onClick={async () => {
                  setLoading("eliminar-mem");
                  setError(null);
                  try {
                    const res = await fetch("/api/admin/eliminar-membresia", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ membresia_id: membresiaActiva!.id }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || "Error al eliminar");
                    } else {
                      setConfirmarEliminarMembresia(false);
                      router.refresh();
                    }
                  } catch {
                    setError("Error de conexión");
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={loading === "eliminar-mem"}
              >
                {loading === "eliminar-mem" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Sí, eliminar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rutina */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Dumbbell className="h-4 w-4 text-primary" />
            Rutina
          </div>
          {rutinaActiva && (
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
              Activa
            </span>
          )}
        </div>

        {rutinaActiva ? (
          <div className="text-sm">
            <p>
              Plan {rutinaActiva.duracion_plan.replace("_", " ")} · Generada{" "}
              {format(parseISO(rutinaActiva.created_at), "d MMM yyyy", {
                locale: es,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Modelo: {rutinaActiva.modelo_ia}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {membresiaActiva?.renovacion_habilitada
              ? "Esperando que el usuario genere su rutina"
              : "Sin rutina generada"}
          </p>
        )}

        {/* AVISO SOLO PC PARA EDITAR RUTINA */}
        {rutinaActiva && (
          <div className="min-w-0 space-y-2 rounded-lg border border-border bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Texto de la rutina activa</p>
              {!editandoRutina ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto md:block hidden"
                  onClick={() => setEditandoRutina(true)}
                >
                  Editar texto de la rutina
                </Button>
              ) : (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setTextoRutinaEdit(rutinaActiva.texto_rutina);
                      setEditandoRutina(false);
                    }}
                    disabled={loading === "editar-rutina"}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={handleGuardarTextoRutina}
                    disabled={loading === "editar-rutina" || !textoRutinaEdit.trim()}
                  >
                    {loading === "editar-rutina" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
            {/* Solo mostrar editor en PC */}
            <div className="mt-2 hidden md:block">
              <RutinaEditor
                markdown={textoRutinaEdit}
                onChange={(value) => setTextoRutinaEdit(value)}
                readOnly={!editandoRutina}
              />
            </div>
            {/* Aviso en móvil */}
            <div className="block md:hidden rounded-md border border-dashed border-warning bg-warning/10 p-3 text-warning text-center text-sm">
              <AlertTriangle className="inline-block mr-2 align-text-bottom" />
              La edición de la rutina solo está disponible desde una computadora. Para evitar errores de formato, por favor edita este texto desde un PC.
            </div>
          </div>
        )}

        {/* Toggle plan nutricional (cuando tiene rutina activa) */}
        {membresiaActiva && rutinaActiva && (
          <label className="flex items-center gap-3 rounded-lg border border-border bg-white/5 p-2 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={incluirNutricional}
              onChange={(e) => handleToggleNutricional(e.target.checked)}
              disabled={loading === "nutricional"}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Plan nutricional</p>
              <p className="text-xs text-muted-foreground">Servicio adicional con costo aparte</p>
            </div>
            {loading === "nutricional" && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
          </label>
        )}

        {/* Botón gestionar nueva rutina (cuando ya tiene una activa) */}
        {membresiaActiva && rutinaActiva && !confirmarNuevaRutina && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setConfirmarNuevaRutina(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gestionar nueva rutina
          </Button>
        )}

        {/* Confirmación */}
        {confirmarNuevaRutina && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              ¿Estás seguro?
            </div>
            <p className="text-xs text-muted-foreground">
              Esta acción archivará la rutina actual del usuario y le permitirá generar una nueva. La rutina actual ya no será visible para el usuario.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmarNuevaRutina(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-warning text-black hover:bg-warning/80"
                onClick={() => {
                  setConfirmarNuevaRutina(false);
                  handleHabilitarRutina();
                }}
                disabled={loading === "rutina"}
              >
                {loading === "rutina" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Sí, archivar y habilitar
              </Button>
            </div>
          </div>
        )}

        {/* Botón habilitar rutina (cuando no tiene rutina ni renovación habilitada) */}
        {membresiaActiva && !rutinaActiva && !membresiaActiva.renovacion_habilitada && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={incluirNutricional}
                onChange={(e) => setIncluirNutricional(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <p className="text-sm font-medium">Incluir plan nutricional</p>
                <p className="text-xs text-muted-foreground">Servicio adicional con costo aparte</p>
              </div>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleHabilitarRutina}
              disabled={loading === "rutina"}
            >
              {loading === "rutina" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Habilitar nueva rutina
            </Button>
          </div>
        )}

        {membresiaActiva?.renovacion_habilitada && (
          <div className="rounded-md bg-warning/10 p-2 text-xs text-warning space-y-2">
            <p>Renovación habilitada — el usuario puede generar su rutina</p>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-white/5 p-2 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={incluirNutricional}
                onChange={(e) => handleToggleNutricional(e.target.checked)}
                disabled={loading === "nutricional"}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Plan nutricional</p>
                <p className="text-xs text-muted-foreground">Servicio adicional con costo aparte</p>
              </div>
              {loading === "nutricional" && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
            </label>
          </div>
        )}
      </div>

      {/* Plan Nutricional */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Plan Nutricional
          </div>
          {planNutriActivo && (
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
              Generado
            </span>
          )}
        </div>

        {planNutriActivo ? (
          <div className="text-sm">
            <p>
              Objetivo: {planNutriActivo.objetivo} · Generado{" "}
              {format(parseISO(planNutriActivo.created_at), "d MMM yyyy", {
                locale: es,
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {membresiaActiva?.plan_nutricional_habilitado
              ? "Esperando que el usuario genere su plan nutricional"
              : "Plan nutricional no habilitado para este usuario"}
          </p>
        )}

        {membresiaActiva &&
          planNutriActivo &&
          membresiaActiva.plan_nutricional_habilitado &&
          !confirmarNuevoPlanNutricional && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setConfirmarNuevoPlanNutricional(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Gestionar nuevo plan nutricional
            </Button>
          )}

        {confirmarNuevoPlanNutricional && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              ¿Estás seguro?
            </div>
            <p className="text-xs text-muted-foreground">
              Esta acción archivará el plan nutricional activo del usuario y le permitirá
              generar uno nuevo. El plan actual ya no será visible para el usuario.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmarNuevoPlanNutricional(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-warning text-black hover:bg-warning/80"
                onClick={() => {
                  setConfirmarNuevoPlanNutricional(false);
                  handleHabilitarPlanNutricional();
                }}
                disabled={loading === "plan-nutri"}
              >
                {loading === "plan-nutri" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Sí, archivar y habilitar
              </Button>
            </div>
          </div>
        )}

        {/* AVISO SOLO PC PARA EDITAR PLAN */}
        {planNutriActivo && (
          <div className="min-w-0 space-y-2 rounded-lg border border-border bg-white/5 p-3 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Texto del plan nutricional activo</p>
              {!editandoPlan ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto md:block hidden"
                  onClick={() => setEditandoPlan(true)}
                >
                  Editar texto del plan
                </Button>
              ) : (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setTextoPlanEdit(planNutriActivo.texto_plan);
                      setEditandoPlan(false);
                    }}
                    disabled={loading === "editar-plan"}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={handleGuardarTextoPlanNutricional}
                    disabled={loading === "editar-plan" || !textoPlanEdit.trim()}
                  >
                    {loading === "editar-plan" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
            {/* Solo mostrar editor en PC */}
            <div className="mt-2 hidden md:block">
              <RutinaEditor
                markdown={textoPlanEdit}
                onChange={(value) => setTextoPlanEdit(value)}
                readOnly={!editandoPlan}
              />
            </div>
            {/* Aviso en móvil */}
            <div className="block md:hidden rounded-md border border-dashed border-warning bg-warning/10 p-3 text-warning text-center text-sm">
              <AlertTriangle className="inline-block mr-2 align-text-bottom" />
              La edición manual solo está disponible desde una computadora.
            </div>
          </div>
        )}
      </div>

      {/* Historial de membresías */}
      {membresias.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <p className="text-sm font-medium">Historial de membresías</p>
          <div className="divide-y divide-border">
            {membresias.map((m) => {
              const estaVigente = !isBefore(startOfDay(parseISO(m.fecha_fin)), hoy);
              const estadoLabel = estaVigente ? "activa" : "vencida";

              return (
                <div key={m.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="capitalize">
                      {m.tipo_plan}
                      {m.monto_pagado ? ` · $${m.monto_pagado}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(m.fecha_inicio), "d MMM yyyy", { locale: es })} →{" "}
                      {format(parseISO(m.fecha_fin), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      estaVigente
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {estadoLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de rutinas */}
      {rutinas.length > 1 && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <p className="text-sm font-medium">Historial de rutinas</p>
          <div className="divide-y divide-border">
            {rutinas
              .filter((r) => r.estado === "archivada")
              .map((r) => (
                <div key={r.id} className="py-2 text-sm">
                  <p>
                    Plan {r.duracion_plan.replace("_", " ")} ·{" "}
                    {format(parseISO(r.created_at), "d MMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">Archivada</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {planesNutricionales.filter((p) => p.estado === "archivada").length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <p className="text-sm font-medium">Historial de planes nutricionales</p>
          <div className="divide-y divide-border">
            {planesNutricionales
              .filter((p) => p.estado === "archivada")
              .map((p) => (
                <div key={p.id} className="py-2 text-sm">
                  <p>
                    Objetivo: {p.objetivo} · {format(parseISO(p.created_at), "d MMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">Archivado</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Desactivar / Reactivar usuario */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        {!profile.activo && (
          <div className="rounded-md bg-error/10 p-2 text-xs text-error text-center mb-2">
            Este usuario está desactivado
          </div>
        )}

        {!confirmarToggleUsuario ? (
          <Button
            variant="outline"
            size="sm"
            className={`w-full ${
              profile.activo
                ? "text-error border-error/30 hover:bg-error/10"
                : "text-success border-success/30 hover:bg-success/10"
            }`}
            onClick={() => setConfirmarToggleUsuario(true)}
          >
            {profile.activo ? (
              <><UserX className="h-4 w-4 mr-2" /> Desactivar usuario</>
            ) : (
              <><UserCheck className="h-4 w-4 mr-2" /> Reactivar usuario</>
            )}
          </Button>
        ) : (
          <div className={`rounded-lg border p-4 space-y-3 ${
            profile.activo
              ? "border-error/50 bg-error/10"
              : "border-success/50 bg-success/10"
          }`}>
            <div className={`flex items-center gap-2 text-sm font-medium ${
              profile.activo ? "text-error" : "text-success"
            }`}>
              <AlertTriangle className="h-4 w-4" />
              {profile.activo ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.activo
                ? "El usuario no podrá iniciar sesión ni usar el sistema mientras esté desactivado."
                : "El usuario volverá a poder acceder normalmente al sistema."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmarToggleUsuario(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className={`flex-1 ${
                  profile.activo
                    ? "bg-error text-white hover:bg-error/80"
                    : "bg-success text-white hover:bg-success/80"
                }`}
                onClick={async () => {
                  setLoading("toggle-user");
                  setError(null);
                  try {
                    const res = await fetch("/api/admin/toggle-usuario", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        usuario_id: profile.id,
                        activo: !profile.activo,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || "Error al actualizar");
                    } else {
                      setConfirmarToggleUsuario(false);
                      router.refresh();
                    }
                  } catch {
                    setError("Error de conexión");
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={loading === "toggle-user"}
              >
                {loading === "toggle-user" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : profile.activo ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                {profile.activo ? "Sí, desactivar" : "Sí, reactivar"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Eliminar usuario */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        {!confirmarEliminarUsuario ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-error border-error/30 hover:bg-error/10"
            onClick={() => setConfirmarEliminarUsuario(true)}
          >
            <>
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar usuario permanentemente
            </>
          </Button>
        ) : (
          <div className="rounded-lg border border-error/50 bg-error/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-error">
              <AlertTriangle className="h-4 w-4" />
              ¿Eliminar usuario permanentemente?
            </div>
            <p className="text-xs text-muted-foreground">
              Esta acción eliminará en cadena sus rutinas, membresías, logs de acceso,
              perfil y cuenta de autenticación. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmarEliminarUsuario(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-error text-white hover:bg-error/80"
                onClick={async () => {
                  setLoading("delete-user");
                  setError(null);
                  try {
                    const res = await fetch("/api/admin/eliminar-usuario", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        usuario_id: profile.id,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || "Error al eliminar");
                    } else {
                      setConfirmarEliminarUsuario(false);
                      router.push("/admin/usuarios");
                      router.refresh();
                    }
                  } catch {
                    setError("Error de conexión");
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={loading === "delete-user"}
              >
                {loading === "delete-user" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Sí, eliminar por completo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
