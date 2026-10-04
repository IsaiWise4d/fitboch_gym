"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import type { IconoRespaldo } from "@/components/shared/iconos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MediaResuelta } from "@/lib/utils/media";
import { separarPasos } from "@/lib/utils/instrucciones";

// ---------------------------------------------------------------------------
// Campos
// ---------------------------------------------------------------------------

export function Campo({
  etiqueta,
  htmlFor,
  obligatorio,
  ayuda,
  aviso,
  children,
}: {
  etiqueta: string;
  htmlFor?: string;
  obligatorio?: boolean;
  ayuda?: ReactNode;
  aviso?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-sm font-medium text-foreground">
        {etiqueta}
        {obligatorio && (
          <span className="text-primary" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {aviso && <p className="text-xs text-warning">{aviso}</p>}
      {ayuda && !aviso && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

/** Opciones como chips (radio): todo visible de un vistazo, un clic para elegir. */
export function SelectorChips<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string;
  opciones: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onCambio: (valor: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambio(o.valor)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors duration-150",
              activo
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export const CLASE_ENTRADA =
  "w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none";

/** Textarea de instrucciones con el conteo de pasos que verá el usuario. */
export function AreaInstrucciones({
  id,
  valor,
  onCambio,
  placeholder,
}: {
  id: string;
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
}) {
  const pasos = separarPasos(valor).length;
  return (
    <Campo
      etiqueta="Instrucciones"
      htmlFor={id}
      obligatorio
      ayuda={
        <span className="flex justify-between gap-2">
          <span>Escribe un paso por línea; se mostrarán numerados.</span>
          <span className="shrink-0 tabular-nums">
            {pasos} {pasos === 1 ? "paso" : "pasos"}
          </span>
        </span>
      }
    >
      <textarea
        id={id}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        rows={7}
        className={cn(CLASE_ENTRADA, "min-h-36 resize-y py-2 leading-relaxed")}
      />
    </Campo>
  );
}

// ---------------------------------------------------------------------------
// Vista previa
// ---------------------------------------------------------------------------

/** Cómo verá el usuario la tarjeta y los pasos mientras el admin escribe. */
export function VistaPrevia({
  nombre,
  subtitulo,
  insignia,
  media,
  conVideo,
  icono,
  instrucciones,
  descripcion,
}: {
  nombre: string;
  subtitulo: string;
  insignia?: string;
  media: MediaResuelta | null;
  conVideo: boolean;
  icono: IconoRespaldo;
  instrucciones: string;
  descripcion: string;
}) {
  const pasos = separarPasos(instrucciones);
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">Así lo verá el usuario</p>
      <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative">
          <MiniaturaMedia
            key={media?.url ?? "sin-media"}
            media={media}
            alt=""
            icono={icono}
            conVideo={conVideo}
            className="aspect-square w-full"
          />
          {insignia && (
            <span className="absolute top-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {insignia}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm leading-snug font-semibold">{nombre.trim() || "Nombre"}</p>
          <p className="pt-1 text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>
      {descripcion.trim() && <p className="text-sm leading-relaxed text-muted-foreground">{descripcion}</p>}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Cómo hacerlo</p>
        {pasos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Los pasos aparecerán aquí al escribir las instrucciones.</p>
        ) : (
          <ol className="space-y-2">
            {pasos.map((paso, i) => (
              <li key={i} className="flex gap-3 text-sm leading-snug">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground/90">{paso}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diálogo
// ---------------------------------------------------------------------------

interface EditorBibliotecaProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  /** Hay cambios sin guardar: cerrar pide confirmación. */
  sucio: boolean;
  guardando: boolean;
  error: string | null;
  exito: string | null;
  textoGuardar: string;
  /** Muestra "Guardar y crear otro" (solo al crear). */
  conCrearOtro: boolean;
  onGuardar: (crearOtro: boolean) => void;
  onCerrar: () => void;
  formulario: ReactNode;
  vistaPrevia: ReactNode;
}

/**
 * Editor de la biblioteca: formulario a la izquierda, vista previa en vivo
 * a la derecha. Ctrl/⌘ + Enter guarda; cerrar con cambios pide confirmar.
 */
export function EditorBiblioteca({
  abierto,
  titulo,
  descripcion,
  sucio,
  guardando,
  error,
  exito,
  textoGuardar,
  conCrearOtro,
  onGuardar,
  onCerrar,
  formulario,
  vistaPrevia,
}: EditorBibliotecaProps) {
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);

  function intentarCerrar() {
    if (guardando) return;
    if (sucio) setConfirmarDescarte(true);
    else onCerrar();
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (!v) intentarCerrar();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden bg-surface p-0 sm:max-w-5xl"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !guardando) {
            e.preventDefault();
            onGuardar(false);
          }
        }}
      >
        <div className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle>
          <DialogDescription className="mt-1">{descripcion}</DialogDescription>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 px-6 py-5">{formulario}</div>
          <aside className="border-t border-border bg-panel/60 px-6 py-5 lg:border-t-0 lg:border-l">
            <div className="lg:sticky lg:top-0">{vistaPrevia}</div>
          </aside>
        </div>

        <div className="space-y-3 border-t border-border px-6 py-4">
          {error && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
          {exito && !error && (
            <p role="status" className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {exito}
            </p>
          )}
          {confirmarDescarte ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-warning">Tienes cambios sin guardar. ¿Descartarlos?</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirmarDescarte(false)}>
                  Seguir editando
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmarDescarte(false);
                    onCerrar();
                  }}
                >
                  Descartar cambios
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs text-muted-foreground sm:block">
                <kbd className="rounded border border-border px-1 font-sans">Ctrl</kbd> +{" "}
                <kbd className="rounded border border-border px-1 font-sans">Enter</kbd> para guardar
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={intentarCerrar} disabled={guardando}>
                  {sucio ? "Cancelar" : "Cerrar"}
                </Button>
                {conCrearOtro && (
                  <Button variant="secondary" onClick={() => onGuardar(true)} disabled={guardando}>
                    Guardar y crear otro
                  </Button>
                )}
                <Button onClick={() => onGuardar(false)} disabled={guardando}>
                  {guardando && <Loader2 className="animate-spin" />}
                  {textoGuardar}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
