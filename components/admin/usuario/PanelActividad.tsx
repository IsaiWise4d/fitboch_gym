import { Dumbbell, Flame } from "lucide-react";

import { Panel } from "@/components/admin/ui/Panel";
import { EstadoVacio, MiniBarra } from "@/components/admin/ui/varios";
import {
  diaYHoraBogota,
  horaMinutoBogota,
  type CeldaActividad,
  type MetricasUsuario,
} from "@/lib/admin/actividad";
import type { RegistroReciente } from "@/lib/admin/tipos";
import { cn } from "@/lib/utils";
import { fechaConDia, fechaCorta, formatoCompacto, formatoNumero, textoHace } from "@/lib/utils/formato";

/** Precedencia: rota > en riesgo > hoy activada > domingo > pendiente. */
function metaEstadoRacha(racha: MetricasUsuario["racha"]): { label: string; clase: string } {
  if (racha.rota) return { label: "Rota", clase: "bg-error/15 text-error" };
  if (racha.enRiesgo) return { label: "En riesgo", clase: "bg-warning/15 text-warning" };
  if (racha.hoyActivado) return { label: "Hoy activada", clase: "bg-success/15 text-success" };
  if (racha.esDomingo) return { label: "Descanso (domingo)", clase: "bg-white/10 text-muted-foreground" };
  return { label: "Pendiente hoy", clase: "bg-white/10 text-muted-foreground" };
}

const COLOR_NIVEL = ["bg-white/[0.06]", "bg-primary/30", "bg-primary/50", "bg-primary/75", "bg-primary"];
const LETRAS = ["L", "M", "X", "J", "V", "S", "D"];

function dias(n: number) {
  return `${n} ${n === 1 ? "día" : "días"}`;
}

/** Calendario de 16 semanas tipo GitHub: intensidad = ejercicios del día. */
function CalendarioActividad({ semanas }: { semanas: CeldaActividad[][] }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="grid shrink-0 grid-rows-7 gap-[3px] pt-5 text-[10px] text-muted-foreground">
          {LETRAS.map((l, i) => (
            <span key={l} className={cn("flex h-3 items-center", i % 2 === 1 && "invisible")}>
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {semanas.map((semana, s) => {
            const primerDia = semana[0].fecha;
            const mostrarMes = s === 0 || Number(primerDia.slice(8)) <= 7;
            return (
              <div key={primerDia} className="flex flex-col gap-[3px]">
                <span className="h-4 text-[10px] whitespace-nowrap text-muted-foreground">
                  {mostrarMes ? fechaCorta(primerDia).split(" ")[1] : ""}
                </span>
                {semana.map((c) => (
                  <span
                    key={c.fecha}
                    role="img"
                    aria-label={`${fechaConDia(c.fecha)}: ${c.ejercicios} ejercicios`}
                    title={
                      c.futuro
                        ? undefined
                        : `${fechaConDia(c.fecha)} · ${c.ejercicios > 0 ? `${c.ejercicios} ejercicio${c.ejercicios === 1 ? "" : "s"}` : c.exigible ? "sin entrenar" : "domingo"}`
                    }
                    className={cn(
                      "size-3 rounded-[3px]",
                      c.futuro
                        ? "bg-transparent"
                        : c.antesDeRegistro
                          ? "bg-white/[0.02]"
                          : c.ejercicios === 0 && !c.exigible
                            ? "bg-white/[0.025]"
                            : COLOR_NIVEL[c.nivel]
                    )}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        Menos
        {COLOR_NIVEL.map((c) => (
          <span key={c} aria-hidden="true" className={cn("size-3 rounded-[3px]", c)} />
        ))}
        Más
      </div>
    </div>
  );
}

export function PanelActividad({
  metricas,
  calendario,
  recientes,
  hoy,
}: {
  metricas: MetricasUsuario;
  calendario: CeldaActividad[][];
  recientes: RegistroReciente[];
  hoy: string;
}) {
  const { racha } = metricas;
  const meta = metaEstadoRacha(racha);
  const colorRacha = racha.enRiesgo
    ? "text-warning"
    : racha.currentCount > 0
      ? "text-orange-400"
      : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        <div className="space-y-2 bg-panel px-5 py-4">
          <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            Racha actual
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.clase)}>{meta.label}</span>
          </p>
          <p className={cn("flex items-center gap-1.5 text-2xl font-semibold", colorRacha)}>
            <Flame className={cn("size-5", racha.hoyActivado && "flame-pulse")} aria-hidden="true" />
            {dias(racha.currentCount)}
          </p>
        </div>
        <div className="space-y-2 bg-panel px-5 py-4">
          <p className="text-xs text-muted-foreground">Mejor racha</p>
          <p className="text-2xl font-semibold">{dias(metricas.mejorRacha)}</p>
        </div>
        <div className="space-y-2 bg-panel px-5 py-4">
          <p className="text-xs text-muted-foreground">Activos este mes</p>
          <p className="text-2xl font-semibold">{dias(metricas.diasActivosMes)}</p>
        </div>
        <div className="space-y-2 bg-panel px-5 py-4">
          <p className="text-xs text-muted-foreground">Asistencia 30 días</p>
          <MiniBarra valor={metricas.asistencia30} className="h-8" />
          <p className="text-xs text-muted-foreground">
            {metricas.ultimoEntreno ? `Último: ${textoHace(metricas.ultimoEntreno, hoy).toLowerCase()}` : "Sin entrenos recientes"}
          </p>
        </div>
      </div>

      <Panel titulo="Actividad de las últimas 16 semanas" descripcion="Cada cuadro es un día; más intenso = más ejercicios">
        <CalendarioActividad semanas={calendario} />
      </Panel>

      <Panel titulo="Ejercicios recientes" sinPadding>
        {recientes.length === 0 ? (
          <EstadoVacio icono={<Dumbbell />} titulo="Aún no registra ejercicios" />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {recientes.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-2.5">
                <div className="w-24 shrink-0 text-xs text-muted-foreground">
                  <span className="block">{textoHace(diaYHoraBogota(r.fecha).dia, hoy)}</span>
                  <span className="block tabular-nums">{horaMinutoBogota(r.fecha)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{r.ejercicio}</p>
                  {r.grupo && <p className="text-xs text-muted-foreground capitalize">{r.grupo}</p>}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <span className="block text-foreground/90">
                    {r.series} serie{r.series === 1 ? "" : "s"} · {r.repeticiones} reps
                  </span>
                  <span className="block tabular-nums">
                    {r.pesoMaxKg !== null ? `${formatoNumero(r.pesoMaxKg, r.pesoMaxKg % 1 ? 1 : 0)} kg máx.` : "—"}
                    {r.volumenKg > 0 && ` · ${formatoCompacto(r.volumenKg)} kg vol.`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
