"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Vuelve a pedir los datos del servidor sin recargar la página. */
export function BotonActualizar({ etiqueta = "Actualizar" }: { etiqueta?: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() => iniciar(() => router.refresh())}
      disabled={pendiente}
      aria-busy={pendiente}
    >
      <RefreshCw className={cn("size-4", pendiente && "animate-spin")} aria-hidden="true" />
      {pendiente ? "Actualizando…" : etiqueta}
    </Button>
  );
}
