"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el panel admin:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <AlertTriangle className="size-6 text-warning" aria-hidden="true" />
      <h1 className="text-lg font-semibold">No pudimos cargar esta sección</h1>
      <p className="text-sm text-muted-foreground">
        Puede ser un problema de conexión con la base de datos. Intenta de nuevo; si sigue
        fallando, revisa la configuración del servidor.
      </p>
      <Button onClick={reset} className="mt-2">
        <RotateCcw aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}
