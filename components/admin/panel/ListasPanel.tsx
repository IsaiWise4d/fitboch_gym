import Link from "next/link";
import { Cake, Dumbbell, Flame, UserPlus } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { AvatarIniciales, EstadoVacio } from "@/components/admin/ui/varios";
import type {
  FilaActividadHoy,
  FilaCumple,
  FilaRacha,
  FilaRegistroReciente,
} from "@/lib/admin/panel";
import { cn } from "@/lib/utils";
import { fechaCorta, textoHace } from "@/lib/utils/formato";

const CLASE_FILA =
  "flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-white/[0.03]";

/** Quién registró ejercicios hoy, del más reciente al primero. */
export function ActividadHoy({
  filas,
  esDomingo,
}: {
  filas: FilaActividadHoy[];
  esDomingo: boolean;
}) {
  return (
    <Panel
      id="actividad-hoy"
      titulo="Entrenando hoy"
      descripcion={
        filas.length > 0
          ? `${filas.length} usuario${filas.length === 1 ? "" : "s"} · hora del primer ejercicio`
          : "Se llena a medida que registran ejercicios"
      }
      sinPadding
      className="h-full scroll-mt-24"
    >
      {filas.length === 0 ? (
        <EstadoVacio
          icono={<Dumbbell />}
          titulo={esDomingo ? "Domingo: día libre" : "Aún nadie registra ejercicios hoy"}
          descripcion={
            esDomingo
              ? "Los domingos no cuentan para la racha; quien entrene igual aparecerá aquí."
              : "Cuando un usuario guarde su primer ejercicio del día aparecerá en esta lista."
          }
        />
      ) : (
        <ul className="max-h-[380px] overflow-y-auto border-t border-border py-1">
          {filas.map((f) => (
            <li key={f.usuarioId}>
              <Link href={`/admin/usuarios/${f.usuarioId}`} className={CLASE_FILA}>
                <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">{f.hora}</span>
                <AvatarIniciales nombre={f.nombre} className="size-7 text-[10px]" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.nombre}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {f.ejercicios} ejercicio{f.ejercicios === 1 ? "" : "s"}
                </span>
                {f.racha > 0 && (
                  <span className="inline-flex w-10 shrink-0 items-center justify-end gap-0.5 text-xs font-semibold tabular-nums text-orange-400">
                    <Flame className="size-3.5" aria-hidden="true" />
                    {f.racha}
                    <span className="sr-only"> días de racha</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Las 5 rachas vivas más largas. */
export function TopRachas({ filas }: { filas: FilaRacha[] }) {
  return (
    <Panel titulo="Mejores rachas" descripcion="Días exigibles consecutivos" sinPadding className="h-full">
      {filas.length === 0 ? (
        <EstadoVacio icono={<Flame />} titulo="Sin rachas activas" descripcion="Se cuentan desde el inicio del sistema de rachas." />
      ) : (
        <ol className="border-t border-border py-1">
          {filas.map((f, i) => (
            <li key={f.usuarioId}>
              <Link href={`/admin/usuarios/${f.usuarioId}`} className={CLASE_FILA}>
                <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{f.nombre}</span>
                  <span className={cn("block text-xs", f.enRiesgo ? "text-warning" : "text-muted-foreground")}>
                    {f.hoyActivado ? "Entrenó hoy" : f.enRiesgo ? "En riesgo hoy" : "Pendiente hoy"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
                  <Flame
                    className={cn("size-4 text-orange-400", f.hoyActivado && "flame-pulse")}
                    aria-hidden="true"
                  />
                  {f.racha}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function Cumpleanos({ filas }: { filas: FilaCumple[] }) {
  return (
    <Panel titulo="Próximos cumpleaños" sinPadding>
      {filas.length === 0 ? (
        <EstadoVacio icono={<Cake />} titulo="Sin fechas de nacimiento" descripcion="Aparecen cuando los usuarios completan su perfil." />
      ) : (
        <ul className="border-t border-border py-1">
          {filas.map((f) => (
            <li key={f.usuarioId}>
              <Link href={`/admin/usuarios/${f.usuarioId}`} className={CLASE_FILA}>
                <Cake
                  className={cn("size-4 shrink-0", f.diasRestantes === 0 ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.nombre}</span>
                <span className="shrink-0 text-right text-xs">
                  <span className={cn("block", f.diasRestantes === 0 ? "font-semibold text-primary" : "text-foreground")}>
                    {f.diasRestantes === 0 ? "¡Hoy!" : fechaCorta(f.fecha)}
                  </span>
                  <span className="block text-muted-foreground">
                    {f.diasRestantes === 0
                      ? `Cumple ${f.cumple}`
                      : `en ${f.diasRestantes} día${f.diasRestantes === 1 ? "" : "s"}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function UltimosRegistros({ filas, hoy }: { filas: FilaRegistroReciente[]; hoy: string }) {
  return (
    <Panel
      titulo="Últimos registros"
      acciones={
        <Link href="/admin/usuarios?orden=registro&dir=desc" className="text-xs text-muted-foreground hover:text-foreground">
          Ver todos
        </Link>
      }
      sinPadding
    >
      {filas.length === 0 ? (
        <EstadoVacio icono={<UserPlus />} titulo="Aún no hay usuarios" />
      ) : (
        <ul className="border-t border-border py-1">
          {filas.map((f) => (
            <li key={f.usuarioId}>
              <Link href={`/admin/usuarios/${f.usuarioId}`} className={CLASE_FILA}>
                <AvatarIniciales nombre={f.nombre} className="size-7 text-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{f.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {f.perfilCompleto ? f.email : "Perfil sin completar"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {textoHace(f.fecha, hoy)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
