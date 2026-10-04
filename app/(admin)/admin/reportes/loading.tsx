import { SkeletonReporte } from "@/components/admin/reportes/SkeletonReporte";
import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-[460px] max-w-full" />
      </div>
      <Skeleton className="h-[74px] rounded-xl" />
      <SkeletonReporte />
    </div>
  );
}
