// Resolución PURA de la media (imagen / GIF / video / YouTube) de ejercicios
// y calentamientos, para mostrar vistas previas en listas y el visor del
// detalle. Sin dependencias de React ni Supabase (testeable, ver media.test.ts).

export type TipoMedia = "imagen" | "video" | "youtube" | "embed";

export interface MediaResuelta {
  tipo: TipoMedia;
  url: string;
  /** Imagen fija para miniaturas cuando la media no es una imagen (YouTube). */
  miniatura: string | null;
  youtubeId: string | null;
}

const EXTENSION_VIDEO = /\.(mp4|webm|mov|ogg|m4v)(\?.*)?(#.*)?$/i;

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function esVideoDirecto(url: string): boolean {
  return EXTENSION_VIDEO.test(url);
}

/**
 * Clasifica una URL. `pista` indica qué se esperaba en ese campo: los campos
 * de imagen a veces traen un .mp4 y los de video una URL de YouTube.
 */
function clasificar(
  url: string | null | undefined,
  pista: "imagen" | "video"
): MediaResuelta | null {
  const limpia = url?.trim();
  if (!limpia) return null;

  const youtubeId = getYouTubeId(limpia);
  if (youtubeId) {
    return {
      tipo: "youtube",
      url: limpia,
      miniatura: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      youtubeId,
    };
  }
  if (esVideoDirecto(limpia)) {
    return { tipo: "video", url: limpia, miniatura: null, youtubeId: null };
  }
  if (pista === "imagen") {
    return { tipo: "imagen", url: limpia, miniatura: null, youtubeId: null };
  }
  // URL de video desconocida (p. ej. Vimeo): se incrusta como iframe.
  return { tipo: "embed", url: limpia, miniatura: null, youtubeId: null };
}

function sinDuplicados(medias: (MediaResuelta | null)[]): MediaResuelta[] {
  const vistas = new Set<string>();
  const resultado: MediaResuelta[] = [];
  for (const media of medias) {
    if (!media || vistas.has(media.url)) continue;
    vistas.add(media.url);
    resultado.push(media);
  }
  return resultado;
}

/** Medias de un ejercicio, la demostración (imagen/GIF) primero. */
export function mediasEjercicio(ejercicio: {
  imagen_url: string | null;
  video_url: string | null;
}): MediaResuelta[] {
  return sinDuplicados([
    clasificar(ejercicio.imagen_url, "imagen"),
    clasificar(ejercicio.video_url, "video"),
  ]);
}

/** Medias de un calentamiento: la subida al Blob primero, luego las URLs antiguas. */
export function mediasCalentamiento(calentamiento: {
  media_url: string | null;
  media_tipo: "imagen" | "video" | null;
  imagen_url: string | null;
  video_url: string | null;
}): MediaResuelta[] {
  return sinDuplicados([
    clasificar(calentamiento.media_url, calentamiento.media_tipo === "video" ? "video" : "imagen"),
    clasificar(calentamiento.imagen_url, "imagen"),
    clasificar(calentamiento.video_url, "video"),
  ]);
}

/** La mejor media para una miniatura (se descarta lo que no tiene imagen fija). */
export function mediaParaMiniatura(medias: MediaResuelta[]): MediaResuelta | null {
  return medias.find((m) => m.tipo !== "embed") ?? null;
}

/** true si alguna media es un video (para mostrar el distintivo "Video"). */
export function tieneVideo(medias: MediaResuelta[]): boolean {
  return medias.some((m) => m.tipo !== "imagen");
}
