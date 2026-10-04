import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando etiqueta="Cargando inicioâ€¦">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-[172px] rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[118px] rounded-2xl" />
        ))}
      </div>
    </PantallaCargando>
  );
}
