"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { nombreDeMes, sumarMeses } from "@/lib/reportes/mensual";
import { cn } from "@/lib/utils";

type EstadoDescarga =
  | { tipo: "inactivo" }
  | { tipo: "generando" }
  | { tipo: "listo" }
  | { tipo: "error"; mensaje: string };

/** Descarga el .xlsx completo del mes (mismo endpoint de siempre). */
function BotonDescargarExcel({ mes, incluirDesactivados }: { mes: string; incluirDesactivados: boolean }) {
  const [estado, setEstado] = useState<EstadoDescarga>({ tipo: "inactivo" });

  async function descargar() {
    setEstado({ tipo: "generando" });
    try {
      const params = new URLSearchParams({ mes });
      if (incluirDesactivados) params.set("desactivados", "1");
      const res = await fetch(`/api/admin/reporte-mensual?${params.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setEstado({ tipo: "error", mensaje: json?.error ?? "No se pudo generar el reporte. Intenta de nuevo." });
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
      setEstado({ tipo: "listo" });
    } catch (error: unknown) {
      console.error("Error descargando reporte mensual:", error);
      setEstado({ tipo: "error", mensaje: "Error de conexión. Intenta de nuevo." });
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={descargar} disabled={estado.tipo === "generando"}>
        {estado.tipo === "generando" ? <Loader2 className="animate-spin" /> : <Download />}
        {estado.tipo === "generando" ? "Generando Excel…" : "Descargar Excel"}
      </Button>
      <p aria-live="polite" className="min-h-4 text-xs">
        {estado.tipo === "listo" && (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Descargado: 6 hojas con el detalle completo
          </span>
        )}
        {estado.tipo === "error" && <span className="text-error">{estado.mensaje}</span>}
      </p>
    </div>
  );
}

/**
 * Selector de mes + filtro de desactivados + descarga. Cambiar de mes va al
 * servidor (nuevo cálculo) conservando la pestaña abierta.
 */
export function ControlesReporte({
  mes,
  mesActual,
  incluirDesactivados,
}: {
  mes: string;
  mesActual: string;
  incluirDesactivados: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  function navegar(cambios: { mes?: string; desactivados?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    const nuevoMes = cambios.mes ?? mes;
    const desactivados = cambios.desactivados ?? incluirDesactivados;
    if (nuevoMes === mesActual) params.delete("mes");
    else params.set("mes", nuevoMes);
    if (desactivados) params.set("desactivados", "1");
    else params.delete("desactivados");
    const consulta = params.toString();
    iniciar(() => router.push(`/admin/reportes${consulta ? `?${consulta}` : ""}`, { scroll: false }));
  }

  const esMesActual = mes === mesActual;
  const mesAnterior = sumarMeses(mesActual, -1);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-background/60 p-0.5">
          <button
            type="button"
            onClick={() => navegar({ mes: sumarMeses(mes, -1) })}
            disabled={pendiente}
            aria-label="Mes anterior"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-44 px-2 text-center" aria-live="polite">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
              {pendiente && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />}
              {nombreDeMes(mes)}
            </p>
            <p className={cn("text-[11px]", esMesActual ? "text-warning" : "text-muted-foreground")}>
              {esMesActual ? "Mes en curso · datos hasta hoy" : "Mes cerrado"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navegar({ mes: sumarMeses(mes, 1) })}
            disabled={pendiente || esMesActual}
            aria-label="Mes siguiente"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navegar({ mes: mesAnterior })}
            disabled={pendiente || mes === mesAnterior}
          >
            Mes anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navegar({ mes: mesActual })}
            disabled={pendiente || esMesActual}
          >
            Mes actual
          </Button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={incluirDesactivados}
            onChange={(e) => navegar({ desactivados: e.target.checked })}
            disabled={pendiente}
            className="size-4 accent-[var(--primary)]"
          />
          Incluir usuarios desactivados
        </label>
      </div>

      {/* key: el aviso "Descargado" no debe sobrevivir a un cambio de mes. */}
      <BotonDescargarExcel
        key={`${mes}-${incluirDesactivados}`}
        mes={mes}
        incluirDesactivados={incluirDesactivados}
      />
    </div>
  );
}
