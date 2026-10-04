"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { nombreDeMes, sumarMeses } from "@/lib/reportes/mensual";

interface ReporteMensualFormProps {
  /** Mes en curso en Bogotá, "YYYY-MM". */
  mesActual: string;
}

type EstadoDescarga =
  | { tipo: "inactivo" }
  | { tipo: "generando" }
  | { tipo: "listo"; mes: string }
  | { tipo: "error"; mensaje: string };

const HOJAS = [
  {
    icono: LayoutDashboard,
    titulo: "Resumen",
    descripcion:
      "KPIs del mes: usuarios activos, ejercicios, volumen, asistencia promedio, racha más alta, membresías e ingresos, top 10 usuarios y ejercicios.",
  },
  {
    icono: Users,
    titulo: "Usuarios",
    descripcion:
      "Una fila por usuario: días entrenados, asistencia %, clasificación, racha al cierre y mejor racha del mes, series, volumen, peso máximo, ejercicio favorito, récords superados y membresía.",
  },
  {
    icono: CalendarCheck,
    titulo: "Asistencia",
    descripcion:
      "Calendario usuario × día con ✓ entrenó, ✗ faltó y D domingo de descanso, con totales por usuario.",
  },
  {
    icono: Dumbbell,
    titulo: "Ejercicios registrados",
    descripcion:
      "Cada ejercicio guardado en el mes con fecha, hora, series (peso × reps), volumen y descanso.",
  },
  {
    icono: Trophy,
    titulo: "Ranking de ejercicios",
    descripcion:
      "Los ejercicios más usados del gimnasio: veces registrado, usuarios distintos, volumen y peso máximo.",
  },
  {
    icono: CreditCard,
    titulo: "Membresías del mes",
    descripcion: "Membresías nuevas o renovadas y las que vencen en el mes, con el total de ingresos.",
  },
];

export function ReporteMensualForm({ mesActual }: ReporteMensualFormProps) {
  const mesAnterior = sumarMeses(mesActual, -1);
  const [mes, setMes] = useState(mesAnterior);
  const [incluirDesactivados, setIncluirDesactivados] = useState(false);
  const [estado, setEstado] = useState<EstadoDescarga>({ tipo: "inactivo" });

  const generando = estado.tipo === "generando";
  const esMesActual = mes === mesActual;

  function cambiarMes(nuevo: string) {
    setMes(nuevo);
    if (estado.tipo !== "generando") setEstado({ tipo: "inactivo" });
  }

  async function descargar() {
    setEstado({ tipo: "generando" });
    try {
      const params = new URLSearchParams({ mes });
      if (incluirDesactivados) params.set("desactivados", "1");
      const res = await fetch(`/api/admin/reporte-mensual?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setEstado({
          tipo: "error",
          mensaje: json?.error ?? "No se pudo generar el reporte. Intenta de nuevo.",
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `reporte-fitboch-${mes}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setEstado({ tipo: "listo", mes });
    } catch (error: unknown) {
      console.error("Error descargando reporte mensual:", error);
      setEstado({ tipo: "error", mensaje: "Error de conexión. Intenta de nuevo." });
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Mes del reporte</p>

          {/* Selector de mes */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-1.5">
            <button
              type="button"
              onClick={() => cambiarMes(sumarMeses(mes, -1))}
              disabled={generando}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95 disabled:opacity-40"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 text-center" aria-live="polite">
              <p className="text-lg font-bold">{nombreDeMes(mes)}</p>
              {esMesActual && (
                <p className="text-xs text-warning">Mes en curso · datos hasta hoy</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => cambiarMes(sumarMeses(mes, 1))}
              disabled={generando || esMesActual}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95 disabled:opacity-40"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Accesos rápidos */}
          <div className="flex flex-wrap gap-2">
            {[
              { valor: mesAnterior, etiqueta: "Mes anterior" },
              { valor: mesActual, etiqueta: "Mes actual" },
            ].map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => cambiarMes(opcion.valor)}
                disabled={generando}
                aria-pressed={mes === opcion.valor}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
                  mes === opcion.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
          <input
            type="checkbox"
            checked={incluirDesactivados}
            onChange={(e) => setIncluirDesactivados(e.target.checked)}
            disabled={generando}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">Incluir usuarios desactivados</span>
            <span className="block text-xs text-muted-foreground">
              Por defecto el reporte solo incluye cuentas activas.
            </span>
          </span>
        </label>

        <Button
          onClick={descargar}
          disabled={generando}
          className="h-12 w-full min-w-0 text-base font-semibold"
        >
          {generando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generando reporte…
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span className="truncate">Descargar Excel</span>
            </>
          )}
        </Button>

        <div aria-live="polite">
          {estado.tipo === "generando" && (
            <p className="text-center text-xs text-muted-foreground">
              Calculando rachas y asistencia de todos los usuarios. Puede tardar unos segundos.
            </p>
          )}
          {estado.tipo === "listo" && (
            <p className="flex items-center justify-center gap-2 text-sm text-success animate-in fade-in-0">
              <CheckCircle2 className="h-4 w-4" />
              Reporte de {nombreDeMes(estado.mes)} descargado
            </p>
          )}
          {estado.tipo === "error" && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error animate-in fade-in-0"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {estado.mensaje}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">¿Qué incluye el archivo?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {HOJAS.map((hoja) => {
            const Icono = hoja.icono;
            return (
              <li
                key={hoja.titulo}
                className="flex gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icono className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">{hoja.titulo}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {hoja.descripcion}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
