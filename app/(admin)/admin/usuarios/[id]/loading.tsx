import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando className="p-0" etiqueta="Cargando ficha del usuario…">
      <Skeleton className="h-4 w-20" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-[104px] rounded-xl" />
          <Skeleton className="h-[220px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl" />
        </div>
      </div>
    </PantallaCargando>
  );
}
