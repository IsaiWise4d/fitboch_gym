import Link from "next/link";
import type { Calentamiento } from "@/types/app";
import { cn } from "@/lib/utils";
import { mediaParaMiniatura, mediasCalentamiento, tieneVideo } from "@/lib/utils/media";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import { iconoDeCategoriaCalentamiento } from "@/components/shared/iconos";

export function etiquetaCategoriaCalentamiento(categoria: string): string {
  return categoria === "tren_superior"
    ? "Tren superior"
    : categoria === "tren_inferior"
      ? "Tren inferior"
      : categoria.replace("_", " ");
}

interface CalentamientoCardProps {
  calentamiento: Pick<
    Calentamiento,
    "id" | "nombre" | "categoria" | "media_url" | "media_tipo" | "imagen_url" | "video_url"
  >;
  /** Posición dentro de su zona (1, 2, 3…) para seguirlos en orden. */
  orden?: number;
  className?: string;
}

/** Tarjeta con vista previa grande y su número de orden dentro de la zona. */
export function CalentamientoCard({ calentamiento, orden, className }: CalentamientoCardProps) {
  const medias = mediasCalentamiento(calentamiento);

  return (
    <Link
      href={`/calentamientos/${calentamiento.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 active:scale-[0.98]",
        className
      )}
    >
      <div className="relative">
        <MiniaturaMedia
          media={mediaParaMiniatura(medias)}
          alt=""
          icono={iconoDeCategoriaCalentamiento(calentamiento.categoria)}
          conVideo={tieneVideo(medias)}
          className="aspect-square w-full"
        />
        {orden !== undefined && (
          <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
            {orden}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{calentamiento.nombre}</p>
        <p className="mt-auto pt-1 text-xs text-muted-foreground">
          {etiquetaCategoriaCalentamiento(calentamiento.categoria)}
        </p>
      </div>
    </Link>
  );
}
