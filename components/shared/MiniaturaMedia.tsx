"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaResuelta } from "@/lib/utils/media";
import { ICONOS_RESPALDO } from "@/components/shared/iconos";
import type { IconoRespaldo } from "@/components/shared/iconos";

interface MiniaturaMediaProps {
  media: MediaResuelta | null;
  alt: string;
  /** Icono del respaldo cuando no hay media o falla la carga. */
  icono: IconoRespaldo;
  /** Muestra el distintivo ▶ (la tarjeta tiene un video para ver). */
  conVideo?: boolean;
  /** false oculta el distintivo ▶ (miniaturas muy pequeñas). */
  distintivo?: boolean;
  /** "contener" muestra la imagen completa (demostraciones). */
  ajuste?: "cubrir" | "contener";
  className?: string;
}

/**
 * Vista previa para tarjetas de ejercicios y calentamientos. Carga diferida,
 * aparece con fundido al terminar de cargar y nunca reproduce video en la
 * lista (solo muestra el primer cuadro) para no gastar datos móviles.
 */
export function MiniaturaMedia({
  media,
  alt,
  icono,
  conVideo = false,
  distintivo = true,
  ajuste = "cubrir",
  className,
}: MiniaturaMediaProps) {
  const ajusteClase = ajuste === "contener" ? "object-contain" : "object-cover";
  const Icono = ICONOS_RESPALDO[icono];
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);

  const src =
    media?.tipo === "imagen" ? media.url : media?.tipo === "youtube" ? media.miniatura : null;
  const esVideo = media?.tipo === "video";
  const mostrarRespaldo = !media || fallo || (!src && !esVideo);

  // La media puede terminar de cargar (o fallar) antes de que React hidrate y
  // registre onLoad/onError: se revisa su estado al montar el elemento.
  const revisarImagen = (img: HTMLImageElement | null) => {
    if (!img?.complete) return;
    if (img.naturalWidth > 0) setCargada(true);
    else if (img.currentSrc) setFallo(true);
  };
  const revisarVideo = (video: HTMLVideoElement | null) => {
    if (video && video.readyState >= 2) setCargada(true);
  };

  return (
    <div className={cn("relative overflow-hidden bg-surface-hover", className)}>
      {mostrarRespaldo ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
          <Icono className="h-1/3 w-1/3 max-h-10 max-w-10 text-primary/80" aria-hidden="true" />
        </div>
      ) : (
        <>
          {!cargada && <div aria-hidden="true" className="skeleton absolute inset-0" />}
          {esVideo ? (
            <video
              ref={revisarVideo}
              // "#t=0.1" hace que Safari iOS pinte el primer cuadro sin reproducir.
              src={`${media.url}#t=0.1`}
              preload="metadata"
              muted
              playsInline
              disablePictureInPicture
              tabIndex={-1}
              aria-label={alt}
              onLoadedData={() => setCargada(true)}
              onError={() => setFallo(true)}
              className={cn(
                "h-full w-full transition-opacity duration-500",
                ajusteClase,
                cargada ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- URLs dinámicas (Vercel Blob / externas / YouTube)
            <img
              ref={revisarImagen}
              src={src!}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={() => setCargada(true)}
              onError={() => setFallo(true)}
              className={cn(
                "h-full w-full transition-opacity duration-500",
                ajusteClase,
                cargada ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </>
      )}

      {distintivo && (conVideo || esVideo || media?.tipo === "youtube") && !mostrarRespaldo && (
        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden="true" />
          <span className="sr-only">Incluye video</span>
        </span>
      )}
    </div>
  );
}
