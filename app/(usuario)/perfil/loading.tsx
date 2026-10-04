import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando etiqueta="Cargando perfilâ€¦" className="space-y-5">
      <Skeleton className="h-[148px] rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[66px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[132px] rounded-2xl" />
      <div className="space-y-4 rounded-2xl border border-border p-4">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ))}
      </div>
    </PantallaCargando>
  );
}
