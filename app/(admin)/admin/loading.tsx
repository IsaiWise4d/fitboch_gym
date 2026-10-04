import { PantallaCargando, Skeleton, SkeletonTarjetas } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando className="p-0">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
      <SkeletonTarjetas cantidad={5} alto="h-[68px]" />
    </PantallaCargando>
  );
}
