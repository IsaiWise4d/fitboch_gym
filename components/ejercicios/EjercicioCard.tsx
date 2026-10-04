import Link from "next/link";
import type { Ejercicio } from "@/types/app";
import { cn } from "@/lib/utils";
import { mediaParaMiniatura, mediasEjercicio, tieneVideo } from "@/lib/utils/media";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import { iconoDeGrupo } from "@/components/shared/iconos";

const ETIQUETA_NIVEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

interface EjercicioCardProps {
  ejercicio: Pick<
    Ejercicio,
    "id" | "nombre" | "grupo_muscular" | "nivel" | "imagen_url" | "video_url"
  >;
  className?: string;
}

/** Tarjeta con vista previa grande: se reconoce el ejercicio de un vistazo. */
export function EjercicioCard({ ejercicio, className }: EjercicioCardProps) {
  const medias = mediasEjercicio(ejercicio);
  const nivel = ETIQUETA_NIVEL[ejercicio.nivel];

  return (
    <Link
      href={`/ejercicios/${ejercicio.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 active:scale-[0.98]",
        className
      )}
    >
      <div className="relative">
        <MiniaturaMedia
          media={mediaParaMiniatura(medias)}
          alt=""
          icono={iconoDeGrupo(ejercicio.grupo_muscular)}
          conVideo={tieneVideo(medias)}
          className="aspect-square w-full"
        />
        {nivel && (
          <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {nivel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{ejercicio.nombre}</p>
        <p className="mt-auto pt-1 text-xs capitalize text-muted-foreground">
          {ejercicio.grupo_muscular}
        </p>
      </div>
    </Link>
  );
}
