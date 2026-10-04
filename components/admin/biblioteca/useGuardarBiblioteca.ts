"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Estado del editor: qué se abre y con qué datos de partida. */
export type ModoEditor = { tipo: "crear" } | { tipo: "editar"; id: string } | { tipo: "duplicar"; id: string };

/**
 * Guarda un elemento de biblioteca (POST al crear, PUT al editar) y
 * refresca los datos del servidor. Devuelve true si se guardó.
 */
export function useGuardarBiblioteca(endpoint: string) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(datos: Record<string, unknown>, id?: string): Promise<boolean> {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, ...datos } : datos),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "No se pudo guardar. Intenta de nuevo.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      return false;
    } finally {
      setGuardando(false);
    }
  }

  return { guardando, error, setError, guardar };
}
