import { Skeleton } from "@/components/shared/Skeleton";

/** Esqueleto del contenido del reporte: pestañas, KPIs y grilla de paneles. */
export function SkeletonReporte() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Calculando el reporte…</span>
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-[104px] rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-12">
        <Skeleton className="h-[340px] rounded-xl xl:col-span-8" />
        <Skeleton className="h-[340px] rounded-xl xl:col-span-4" />
        <Skeleton className="h-[300px] rounded-xl xl:col-span-6" />
        <Skeleton className="h-[300px] rounded-xl xl:col-span-6" />
      </div>
    </div>
  );
}
