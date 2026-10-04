import { PantallaCargando, Skeleton, SkeletonEncabezado } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando etiqueta="Cargando rachaâ€¦">
      <SkeletonEncabezado />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[380px] rounded-xl" />
    </PantallaCargando>
  );
}
