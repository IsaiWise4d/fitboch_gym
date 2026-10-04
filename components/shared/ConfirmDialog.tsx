"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: ReactNode;
  icono?: ReactNode;
  tono?: "peligro" | "primario";
  textoConfirmar: string;
  textoCancelar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmación mobile-first: hoja inferior en móvil (al alcance
 * del pulgar) y modal centrado desde `sm`. Cierra con Escape o tocando el
 * fondo, bloquea el scroll de la página y enfoca "Cancelar" al abrir para
 * que una acción destructiva nunca quede a un toque accidental.
 */
export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  icono,
  tono = "primario",
  textoConfirmar,
  textoCancelar = "Cancelar",
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const tituloId = useId();
  const descripcionId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const onCancelarRef = useRef(onCancelar);
  const cargandoRef = useRef(cargando);

  useEffect(() => {
    onCancelarRef.current = onCancelar;
    cargandoRef.current = cargando;
  });

  useEffect(() => {
    if (!abierto) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelarRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cargandoRef.current) onCancelarRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  if (!abierto) return null;

  const colorTitulo = tono === "peligro" ? "text-destructive" : "text-primary";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => {
          if (!cargando) onCancelar();
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
        className="relative w-full space-y-4 rounded-t-2xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out sm:max-w-sm sm:rounded-2xl sm:pb-5 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <h3 id={tituloId} className={`flex items-center gap-2 text-lg font-bold ${colorTitulo}`}>
          {icono}
          {titulo}
        </h3>
        <div id={descripcionId} className="text-sm leading-relaxed text-muted-foreground">
          {descripcion}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            ref={cancelarRef}
            variant="outline"
            className="h-11"
            onClick={onCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </Button>
          <Button
            variant={tono === "peligro" ? "destructive" : "default"}
            className={`h-11 ${tono === "peligro" ? "bg-destructive text-white hover:bg-destructive/90" : ""}`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
