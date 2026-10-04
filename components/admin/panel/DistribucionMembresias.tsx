import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { ESTILO_ESTADO, ORDEN_ESTADOS } from "@/components/admin/ui/estado";
import { ETIQUETA_ESTADO, type EstadoUsuarioClave } from "@/lib/membresias/estado";
import { cn } from "@/lib/utils";

const DESCRIPCION: Record<EstadoUsuarioClave, string> = {
  activa: "Más de 7 días de plan",
  por_vencer: "Vencen en 7 días o menos",
  vencida: "Sin renovar",
  sin_membresia: "Nunca han tenido plan activo",
  desactivado: "Cuentas bloqueadas",
};

/**
 * Parte-del-todo de los usuarios por estado de membresía: una barra
 * apilada (huecos de 2px entre segmentos) + leyenda con cifras que filtra
 * la lista de usuarios al hacer clic.
 */
export function DistribucionMembresias({
  distribucion,
}: {
  distribucion: Record<EstadoUsuarioClave, number>;
}) {
  const total = ORDEN_ESTADOS.reduce((t, e) => t + distribucion[e], 0);

  return (
    <Panel
      titulo="Estado de membresías"
      descripcion={`${total} usuario${total === 1 ? "" : "s"} registrados`}
      className="h-full"
    >
      {total > 0 ? (
        <div className="flex h-3 w-full gap-0.5" role="img" aria-label="Distribución de usuarios por estado de membresía">
          {ORDEN_ESTADOS.filter((e) => distribucion[e] > 0).map((estado) => (
            <Link
              key={estado}
              href={`/admin/usuarios?estado=${estado}`}
              title={`${ETIQUETA_ESTADO[estado]}: ${distribucion[estado]}`}
              className={cn(
                "h-full min-w-1.5 rounded-[4px] transition-opacity duration-150 hover:opacity-80",
                ESTILO_ESTADO[estado].marca
              )}
              style={{ flexGrow: distribucion[estado], flexBasis: 0 }}
            >
              <span className="sr-only">
                {ETIQUETA_ESTADO[estado]}: {distribucion[estado]}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-3 w-full rounded-[4px] bg-white/[0.06]" />
      )}

      <ul className="mt-4 -mx-2 space-y-0.5">
        {ORDEN_ESTADOS.map((estado) => {
          const cantidad = distribucion[estado];
          const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
          return (
            <li key={estado}>
              <Link
                href={`/admin/usuarios?estado=${estado}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-[3px]", ESTILO_ESTADO[estado].marca)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">{ETIQUETA_ESTADO[estado]}</span>
                  <span className="block text-xs text-muted-foreground">{DESCRIPCION[estado]}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold tabular-nums text-foreground">{cantidad}</span>
                  <span className="block text-xs tabular-nums text-muted-foreground">{porcentaje}%</span>
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
