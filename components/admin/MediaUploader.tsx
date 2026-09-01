"use client";

import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Label } from "@/components/ui/label";
import { MediaPreview } from "@/components/calentamientos/MediaPreview";

const MAX_SIZE_MB = 50;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export type MediaSeleccionada = { url: string; tipo: "imagen" | "video" };

type MediaUploaderProps = {
  url: string;
  tipo: "imagen" | "video" | null;
  onChange: (media: MediaSeleccionada | null) => void;
};

export function MediaUploader({ url, tipo, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleArchivo(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa una imagen (JPG, PNG, WEBP, GIF) o un video (MP4, WEBM, MOV).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera el máximo de ${MAX_SIZE_MB}MB`);
      return;
    }
    setSubiendo(true);
    setProgreso(0);
    try {
      const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
      const blob = await upload(`calentamientos/${Date.now()}-${nombreLimpio}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        onUploadProgress: (progress) => setProgreso(Math.round(progress.percentage)),
      });
      onChange({ url: blob.url, tipo: file.type.startsWith("video/") ? "video" : "imagen" });
    } catch (e: unknown) {
      console.error("Error subiendo archivo a Blob:", e);
      setError("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
      setProgreso(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (subiendo) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleArchivo(file);
  }

  return (
    <div className="space-y-2">
      <Label>Imagen o video</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleArchivo(file);
        }}
      />

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
          <MediaPreview url={url} tipo={tipo} alt="Vista previa" className="max-h-64 w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={subiendo}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            title="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground">
            {tipo === "video" ? <Film className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {tipo === "video" ? "Video (se reproduce en bucle como GIF)" : "Imagen"}
          </p>
        </div>
      ) : (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl border border-dashed border-border bg-surface transition-colors hover:bg-surface-hover"
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="flex w-full flex-col items-center gap-2 px-4 py-6 text-center"
          >
            {subiendo ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Subiendo... {progreso}%</span>
                <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
                </div>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Toca para elegir un archivo o arrástralo aquí
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Imagen o video · máx. {MAX_SIZE_MB}MB
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
