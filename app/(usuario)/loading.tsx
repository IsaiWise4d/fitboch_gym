import { PantallaCargando, SkeletonEncabezado, SkeletonTarjetas } from "@/components/shared/Skeleton";

// Fallback genÃ©rico para las pantallas de usuario sin skeleton propio.
export default function Loading() {
  return (
    <PantallaCargando>
      <SkeletonEncabezado />
      <SkeletonTarjetas cantidad={4} alto="h-24" />
    </PantallaCargando>
  );
}
