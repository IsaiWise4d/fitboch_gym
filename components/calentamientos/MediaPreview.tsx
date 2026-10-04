"use client";

import { useEffect, useRef } from "react";

type MediaPreviewProps = {
  url: string;
  tipo: string | null;
  alt: string;
  className: string;
};

export function MediaPreview({ url, tipo, alt, className }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay bloqueado por el navegador (p. ej. modo ahorro de datos): queda en pausa, sin controles.
    });
  }, [url]);

  if (tipo === "video") {
    return (
      <video
        ref={videoRef}
        src={url}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs dinámicas de Vercel Blob; consistente con el resto del código base
    <img src={url} alt={alt} decoding="async" className={className} />
  );
}
