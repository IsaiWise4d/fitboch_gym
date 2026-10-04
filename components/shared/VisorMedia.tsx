"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaResuelta } from "@/lib/utils/media";
import { ICONOS_RESPALDO } from "@/components/shared/iconos";
import type { IconoRespaldo } from "@/components/shared/iconos";

// --- Preferencia "reducir movimiento" del sistema ---------------------------

const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(cambio: () => void) {
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO);
  consulta.addEventListener("change", cambio);
  return () => consulta.removeEventListener("change", cambio);
}

function usePrefiereMenosMovimiento(): boolean {
  return useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia(CONSULTA_MOVIMIENTO).matches,
    () => false
  );
}

// --- Video en bucle (se comporta como un GIF) --------------------------------

function VideoEnBucle({ url, alt }: { url: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const menosMovimiento = usePrefiereMenosMovimiento();
  // null = decide el sistema (autoplay salvo "reducir movimiento").
  const [quiereReproducir, setQuiereReproducir] = useState<boolean | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const debeReproducir = quiereReproducir ?? !menosMovimiento;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (!debeReproducir) {
      video.pause();
      return;
    }
    // Solo se reproduce mientras está en pantalla (ahorra batería y datos).
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          video.play().catch(() => {
            // Autoplay bloqueado (ahorro de datos): queda el botón ▶.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observador.observe(video);
    return () => observador.disconnect();
  }, [debeReproducir]);

  return (
    <>
      <video
        ref={ref}
        src={`${url}#t=0.1`}
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={alt}
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        className="h-full w-full object-contain"
      />
      <button
        type="button"
        onClick={() => setQuiereReproducir(!reproduciendo)}
        aria-label={reproduciendo ? "Pausar video" : "Reproducir video"}
        className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform active:scale-90"
      >
        {reproduciendo ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        )}
      </button>
    </>
  );
}

// --- YouTube: se carga al tocar ▶ ---------------------------------------------

function VideoYouTube({ media, alt }: { media: MediaResuelta; alt: string }) {
  const [cargar, setCargar] = useState(false);

  if (cargar && media.youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`}
        title={alt}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setCargar(true)}
      className="group relative h-full w-full"
      aria-label={`Reproducir video de ${alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
      <img
        src={media.miniatura ?? ""}
        alt=""
        decoding="async"
        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-black/40 transition-transform group-active:scale-90">
          <Play className="ml-1 h-7 w-7 fill-current" />
        </span>
      </span>
    </button>
  );
}

// --- Visor -----------------------------------------------------------------------

interface VisorMediaProps {
  medias: MediaResuelta[];
  alt: string;
  hrefVolver: string;
  etiquetaVolver: string;
  /** Icono del respaldo cuando no hay ninguna media. */
  icono: IconoRespaldo;
}

/** "Demostración", "Video", "Video 2"… según el tipo y el orden. */
function etiquetaMedia(medias: MediaResuelta[], indice: number): string {
  const base = (m: MediaResuelta) => (m.tipo === "imagen" ? "Demostración" : "Video");
  const etiqueta = base(medias[indice]);
  const repetidas = medias.slice(0, indice + 1).filter((m) => base(m) === etiqueta).length;
  return repetidas > 1 ? `${etiqueta} ${repetidas}` : etiqueta;
}

/**
 * Cabecera visual del detalle de un ejercicio o calentamiento: ocupa todo el
 * ancho, con botón de volver flotante y selector Demostración / Video
 * cuando hay más de una media.
 */
export function VisorMedia({ medias, alt, hrefVolver, etiquetaVolver, icono }: VisorMediaProps) {
  const Icono = ICONOS_RESPALDO[icono];
  const [indice, setIndice] = useState(0);
  const actual = medias[indice] ?? null;
  const panoramico = actual?.tipo === "youtube" || actual?.tipo === "embed";

  return (
    <div
      className={cn(
        "relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl bg-[#111] sm:mx-0 sm:mt-0 sm:rounded-3xl",
        !actual ? "h-44" : panoramico ? "aspect-video" : "aspect-square max-h-[460px]"
      )}
    >
      {!actual ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/5 to-transparent">
          <Icono className="h-14 w-14 text-primary/80" aria-hidden="true" />
        </div>
      ) : (
        <div key={indice} className="h-full w-full animate-in fade-in duration-300">
          {actual.tipo === "imagen" && (
            // eslint-disable-next-line @next/next/no-img-element -- URLs dinámicas (Vercel Blob / externas)
            <img
              src={actual.url}
              alt={alt}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-contain"
            />
          )}
          {actual.tipo === "video" && <VideoEnBucle url={actual.url} alt={alt} />}
          {actual.tipo === "youtube" && <VideoYouTube media={actual} alt={alt} />}
          {actual.tipo === "embed" && (
            <iframe
              src={actual.url}
              title={alt}
              loading="lazy"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
      )}

      {/* Degradado superior para que el botón de volver siempre se lea */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent"
      />

      <Link
        href={hrefVolver}
        aria-label={etiquetaVolver}
        className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition-transform active:scale-90"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {medias.length > 1 && (
        <div
          role="tablist"
          aria-label="Tipo de vista"
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-black/60 p-1 backdrop-blur-md"
        >
          {medias.map((media, i) => (
            <button
              key={media.url}
              type="button"
              role="tab"
              aria-selected={i === indice}
              onClick={() => setIndice(i)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                i === indice ? "bg-primary text-primary-foreground" : "text-white/80 hover:text-white"
              )}
            >
              {etiquetaMedia(medias, i)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
