import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

/** Esqueleto común de las bibliotecas (ejercicios y calentamientos). */
export function SkeletonBiblioteca({ etiqueta }: { etiqueta: string }) {
  return (
    <PantallaCargando className="p-0" etiqueta={etiqueta}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-[640px] max-w-full rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-96 max-w-full rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </PantallaCargando>
  );
}
