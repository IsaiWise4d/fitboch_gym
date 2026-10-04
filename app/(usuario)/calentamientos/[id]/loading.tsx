import { PantallaCargando, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <PantallaCargando>
      <Skeleton className="-mx-4 -mt-4 aspect-square max-h-[460px] rounded-none rounded-b-3xl sm:mx-0 sm:mt-0 sm:rounded-3xl" />
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-4 rounded-2xl border border-border p-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>
    </PantallaCargando>
  );
}
