"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// Misma clave y forma que usa ActiveExerciseTracker para recordar el
// ejercicio en curso entre recargas.
const CLAVE_EJERCICIO_ACTIVO = "fitboch_active_workout";
const DESCANSO_POR_DEFECTO = 1.5;

interface EjercicioActivoGuardado {
  ejercicio_id: string;
  tiempo_descanso: number;
  series: { peso: number; reps: number }[];
}

function leerEjercicioActivo(): EjercicioActivoGuardado | null {
  try {
    const crudo = localStorage.getItem(CLAVE_EJERCICIO_ACTIVO);
    return crudo ? (JSON.parse(crudo) as EjercicioActivoGuardado) : null;
  } catch {
    // localStorage bloqueado o JSON corrupto: se trata como "sin ejercicio activo".
    return null;
  }
}

interface BotonEntrenarEjercicioProps {
  ejercicioId: string;
  nombre: string;
}

/**
 * Botón fijo al pie del detalle: abre el registrador del dashboard con este
 * ejercicio ya seleccionado, para registrar las series sin buscarlo de nuevo.
 */
export function BotonEntrenarEjercicio({ ejercicioId, nombre }: BotonEntrenarEjercicioProps) {
  const router = useRouter();
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);

  function irAlRegistro(reemplazar: boolean) {
    const activo = leerEjercicioActivo();
    if (reemplazar || activo?.ejercicio_id !== ejercicioId) {
      try {
        localStorage.setItem(
          CLAVE_EJERCICIO_ACTIVO,
          JSON.stringify({
            ejercicio_id: ejercicioId,
            tiempo_descanso: activo?.tiempo_descanso ?? DESCANSO_POR_DEFECTO,
            series: [{ peso: 0, reps: 0 }],
          } satisfies EjercicioActivoGuardado)
        );
      } catch (error: unknown) {
        console.error("No se pudo preparar el ejercicio activo:", error);
      }
    }
    router.push("/dashboard#ejercicio-activo");
  }

  function alPresionar() {
    const activo = leerEjercicioActivo();
    const otroConDatos =
      activo &&
      activo.ejercicio_id &&
      activo.ejercicio_id !== ejercicioId &&
      activo.series?.some((s) => s.reps > 0 || s.peso > 0);
    if (otroConDatos) {
      setConfirmarReemplazo(true);
      return;
    }
    irAlRegistro(false);
  }

  return (
    <>
      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 -mx-4 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-1 pt-6">
        <Button
          onClick={alPresionar}
          className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-black/40"
        >
          <Plus className="h-5 w-5" />
          Registrar este ejercicio
        </Button>
      </div>

      <ConfirmDialog
        abierto={confirmarReemplazo}
        tono="peligro"
        icono={<AlertTriangle className="h-5 w-5" />}
        titulo="Tienes otro ejercicio en curso"
        descripcion={`Hay series sin guardar de otro ejercicio. Si continúas, se reemplazarán por ${nombre}.`}
        textoConfirmar="Reemplazar"
        onCancelar={() => setConfirmarReemplazo(false)}
        onConfirmar={() => {
          setConfirmarReemplazo(false);
          irAlRegistro(true);
        }}
      />
    </>
  );
}
