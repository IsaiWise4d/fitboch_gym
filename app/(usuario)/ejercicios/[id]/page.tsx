import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExerciseHistoryLog } from "@/components/ejercicios/ExerciseHistoryLog";
import { MediaPreview } from "@/components/calentamientos/MediaPreview";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function esVideoDirecto(url: string): boolean {
  return /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url);
}

export default async function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ejercicio } = await supabase
    .from("ejercicios")
    .select("*")
    .eq("id", id)
    .single();

  if (!ejercicio) {
    notFound();
  }

  const videoUrl = ejercicio.video_url;
  const youTubeId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/ejercicios"
          className="rounded-lg p-2 hover:bg-surface transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{ejercicio.nombre}</h1>
      </div>

      {/* Imagen */}
      {ejercicio.imagen_url && (
        <div className="flex justify-center">
          <div className="rounded-xl overflow-hidden border border-border w-full max-w-md">
            <img
              src={ejercicio.imagen_url}
              alt={ejercicio.nombre}
              className="w-full aspect-square object-cover"
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
          {ejercicio.grupo_muscular}
        </span>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
          {ejercicio.categoria}
        </span>
        {ejercicio.nivel !== "todos" && (
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
            {ejercicio.nivel}
          </span>
        )}
      </div>

      {/* Descripción */}
      {ejercicio.descripcion && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Descripción
          </h2>
          <p className="text-sm leading-relaxed">{ejercicio.descripcion}</p>
        </div>
      )}

      {/* Instrucciones */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Cómo hacerlo correctamente
        </h2>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {ejercicio.instrucciones}
          </p>
        </div>
      </div>

      {/* Video: se muestra como GIF (en bucle, silenciado y sin controles) */}
      {videoUrl && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Video</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {esVideoDirecto(videoUrl) ? (
              <MediaPreview url={videoUrl} tipo="video" alt={ejercicio.nombre} className="max-h-[480px] w-full object-contain" />
            ) : youTubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&loop=1&playlist=${youTubeId}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1`}
                className="aspect-video w-full"
                allow="autoplay; encrypted-media"
                title={ejercicio.nombre}
              />
            ) : (
              <iframe src={videoUrl} className="aspect-video w-full" allowFullScreen title={ejercicio.nombre} />
            )}
          </div>
        </div>
      )}

      {/* Historial Específico del Ejercicio */}
      <ExerciseHistoryLog ejercicioId={id} />
    </div>
  );
}
