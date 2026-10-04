"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";

import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { AvatarIniciales } from "@/components/admin/ui/varios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CeldaActividad, MetricasUsuario } from "@/lib/admin/actividad";
import { enlaceWhatsApp } from "@/lib/admin/contacto";
import { nombreCompleto, type RegistroReciente } from "@/lib/admin/tipos";
import { estadoUsuario, esVigente, membresiaActual } from "@/lib/membresias/estado";
import { textoHace } from "@/lib/utils/formato";
import type { Membresia, PlanNutricional, Profile } from "@/types/app";

import { DialogoRenovarMembresia } from "./DialogoRenovarMembresia";
import { DatosPersonales, HistorialUsuario, ZonaPeligro } from "./Laterales";
import { PanelActividad } from "./PanelActividad";
import { PanelNutricion, PanelRutina, type Edicion, type RutinaResumen } from "./PanelesPlan";
import { TarjetaMembresia } from "./TarjetaMembresia";
import { useAccionesUsuario } from "./useAccionesUsuario";

interface UsuarioDetalleProps {
  profile: Profile;
  membresias: Membresia[];
  rutinas: RutinaResumen[];
  planesNutricionales: PlanNutricional[];
  hoy: string;
  actividad: {
    metricas: MetricasUsuario;
    calendario: CeldaActividad[][];
    recientes: RegistroReciente[];
  };
  /** Abre el diálogo de renovación al cargar (?renovar=1). */
  abrirRenovar: boolean;
}

export function UsuarioDetalle({
  profile,
  membresias,
  rutinas,
  planesNutricionales,
  hoy,
  actividad,
  abrirRenovar,
}: UsuarioDetalleProps) {
  const acciones = useAccionesUsuario();
  const [renovando, setRenovando] = useState(abrirRenovar);
  // Ediciones de texto en el padre: las pestañas desmontan su contenido y
  // no se debe perder lo escrito al cambiar de pestaña.
  const [edicionRutina, setEdicionRutina] = useState<Edicion | null>(null);
  const [edicionPlan, setEdicionPlan] = useState<Edicion | null>(null);

  const membresia = membresiaActual(membresias);
  const vigente = esVigente(membresia, hoy);
  const rutinaActiva = rutinas.find((r) => r.estado === "activa") ?? null;
  const planActivo = planesNutricionales.find((p) => p.estado === "activa") ?? null;
  const { clave } = estadoUsuario({ activo: profile.activo, membresias }, hoy);
  const nombre = nombreCompleto(profile);
  const whatsapp = enlaceWhatsApp(profile.telefono, `Hola ${profile.nombre}, te escribimos de FitBoch.`);
  const ultimo = actividad.metricas.ultimoEntreno;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Usuarios
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <AvatarIniciales nombre={nombre} className="size-14 text-base" />
            <div className="min-w-0 space-y-1.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{nombre}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <EstadoBadge estado={clave} />
                {!profile.perfil_completo && (
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs">Perfil incompleto</span>
                )}
                <span>{ultimo ? `Último entreno: ${textoHace(ultimo, hoy).toLowerCase()}` : "Sin entrenos recientes"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {whatsapp && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={whatsapp} target="_blank" rel="noopener noreferrer" />}
              >
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </Button>
            )}
            <Button
              onClick={() => {
                acciones.limpiarError();
                setRenovando(true);
              }}
            >
              <RefreshCw aria-hidden="true" />
              {vigente ? "Renovar membresía" : membresia ? "Crear nueva membresía" : "Crear membresía"}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Tabs defaultValue="resumen" className="gap-5">
            <TabsList variant="line" className="h-auto w-full justify-start gap-1 overflow-x-auto border-b border-border pb-px scrollbar-none">
              {[
                ["resumen", "Actividad"],
                ["rutina", "Rutina"],
                ["nutricion", "Nutrición"],
                ["historial", "Historial"],
              ].map(([valor, etiqueta]) => (
                <TabsTrigger key={valor} value={valor} className="h-10 flex-none px-3 after:bg-primary">
                  {etiqueta}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="resumen">
              <PanelActividad
                metricas={actividad.metricas}
                calendario={actividad.calendario}
                recientes={actividad.recientes}
                hoy={hoy}
              />
            </TabsContent>
            <TabsContent value="rutina">
              <PanelRutina
                usuarioId={profile.id}
                rutina={rutinaActiva}
                membresia={membresia}
                acciones={acciones}
                edicion={edicionRutina}
                onEdicion={setEdicionRutina}
              />
            </TabsContent>
            <TabsContent value="nutricion">
              <PanelNutricion
                usuarioId={profile.id}
                plan={planActivo}
                membresia={membresia}
                acciones={acciones}
                edicion={edicionPlan}
                onEdicion={setEdicionPlan}
              />
            </TabsContent>
            <TabsContent value="historial">
              <HistorialUsuario membresias={membresias} rutinas={rutinas} planes={planesNutricionales} hoy={hoy} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <TarjetaMembresia
            membresia={membresia}
            vigente={vigente}
            hoy={hoy}
            acciones={acciones}
            onRenovar={() => {
              acciones.limpiarError();
              setRenovando(true);
            }}
          />
          <DatosPersonales profile={profile} hoy={hoy} />
          <ZonaPeligro profile={profile} acciones={acciones} />
        </aside>
      </div>

      <DialogoRenovarMembresia
        abierto={renovando}
        onCambio={setRenovando}
        usuarioId={profile.id}
        hoy={hoy}
        membresia={membresia}
        vigente={vigente}
        acciones={acciones}
      />
    </div>
  );
}
