import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando className="p-0" etiqueta="Cargando usuarios…">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:justify-between">
        <Skeleton className="h-9 w-[560px] max-w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg xl:w-96" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-[61px] rounded-none border-b border-border last:border-0" />
        ))}
      </div>
    </PantallaCargando>
  );
}
