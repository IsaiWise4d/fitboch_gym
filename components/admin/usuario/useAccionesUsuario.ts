"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ClaveAccion =
  | "renovar"
  | "nutricional"
  | "rutina"
  | "plan-nutri"
  | "editar-rutina"
  | "editar-plan"
  | "eliminar-mem"
  | "toggle-user"
  | "delete-user";

/**
 * Ejecuta las acciones POST de la ficha (mismos endpoints y payloads de
 * siempre). Solo una acción a la vez; el error queda asociado a su clave
 * para mostrarlo junto al control (o dentro de su diálogo).
 */
export function useAccionesUsuario() {
  const router = useRouter();
  const [cargando, setCargando] = useState<ClaveAccion | null>(null);
  const [error, setError] = useState<{ clave: ClaveAccion; mensaje: string } | null>(null);

  async function ejecutar(
    clave: ClaveAccion,
    endpoint: string,
    body: Record<string, unknown>,
    mensajeError: string,
    onExito?: () => void
  ): Promise<boolean> {
    setCargando(clave);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError({ clave, mensaje: data.error || mensajeError });
        return false;
      }
      onExito?.();
      router.refresh();
      return true;
    } catch {
      setError({ clave, mensaje: "Error de conexión" });
      return false;
    } finally {
      setCargando(null);
    }
  }

  return {
    cargando,
    ejecutar,
    errorDe: (clave: ClaveAccion) => (error?.clave === clave ? error.mensaje : null),
    limpiarError: () => setError(null),
  };
}

export type AccionesUsuario = ReturnType<typeof useAccionesUsuario>;
