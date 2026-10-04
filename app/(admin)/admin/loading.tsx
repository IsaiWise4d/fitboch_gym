import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

/** Mismo esqueleto que el dashboard: encabezado, franja de KPIs y grilla. */
export default function Loading() {
  return (
    <PantallaCargando className="p-0" etiqueta="Cargando panel…">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-80 rounded-lg md:block" />
      </div>
      <Skeleton className="h-[104px] rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-12">
        <Skeleton className="h-[380px] rounded-xl xl:col-span-8" />
        <Skeleton className="h-[380px] rounded-xl xl:col-span-4" />
        <Skeleton className="h-[360px] rounded-xl xl:col-span-7" />
        <Skeleton className="h-[360px] rounded-xl xl:col-span-5" />
      </div>
    </PantallaCargando>
  );
}
