import { AlertCircle, AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Rangos de la OMS. La escala se dibuja de 15 a 40 (los extremos se recortan).
const ESCALA_MIN = 15;
const ESCALA_MAX = 40;

type Tono = "bueno" | "alerta" | "critico";

const RANGOS: { desde: number; hasta: number; etiqueta: string; tono: Tono }[] = [
  { desde: ESCALA_MIN, hasta: 18.5, etiqueta: "Bajo peso", tono: "alerta" },
  { desde: 18.5, hasta: 25, etiqueta: "Normal", tono: "bueno" },
  { desde: 25, hasta: 30, etiqueta: "Sobrepeso", tono: "alerta" },
  { desde: 30, hasta: ESCALA_MAX, etiqueta: "Obesidad", tono: "critico" },
];

// Colores de estado reservados (contraste ≥ 4.6:1 contra la tarjeta),
// siempre acompañados de icono + texto: el color nunca va solo.
const TONOS: Record<Tono, { barra: string; icono: string; Icono: LucideIcon }> = {
  bueno: { barra: "bg-success", icono: "text-success", Icono: CheckCircle2 },
  alerta: { barra: "bg-warning", icono: "text-warning", Icono: AlertTriangle },
  critico: { barra: "bg-error", icono: "text-error", Icono: AlertCircle },
};

const MARCAS = [18.5, 25, 30];

function posicion(valor: number): number {
  const recortado = Math.min(Math.max(valor, ESCALA_MIN), ESCALA_MAX);
  return ((recortado - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * 100;
}

function formatear(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

/** IMC = peso / altura². null si faltan datos o no son razonables. */
export function calcularImc(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoKg || !alturaCm || pesoKg < 20 || pesoKg > 400 || alturaCm < 100 || alturaCm > 250) {
    return null;
  }
  const metros = alturaCm / 100;
  return pesoKg / (metros * metros);
}

/** Medidor de IMC: valor, categoría (icono + texto) y escala con marcador. */
export function MedidorImc({ imc }: { imc: number | null }) {
  if (imc === null) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-4">
        <Scale className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Ingresa tu peso y altura para ver tu índice de masa corporal.
        </p>
      </div>
    );
  }

  const rango = RANGOS.find((r) => imc < r.hasta) ?? RANGOS[RANGOS.length - 1];
  const tono = TONOS[rango.tono];
  const Icono = tono.Icono;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Índice de masa corporal</p>
          <p className="mt-1 text-3xl font-bold leading-none">{formatear(imc)}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium">
          <Icono className={cn("h-3.5 w-3.5", tono.icono)} aria-hidden="true" />
          {rango.etiqueta}
        </span>
      </div>

      <div
        role="img"
        aria-label={`IMC ${formatear(imc)}: ${rango.etiqueta}. El rango normal va de 18,5 a 24,9.`}
        className="mt-5"
      >
        <div className="relative">
          <div className="flex h-2.5 gap-0.5">
            {RANGOS.map((r) => (
              <div
                key={r.etiqueta}
                className={cn(
                  "h-full first:rounded-l-full last:rounded-r-full",
                  TONOS[r.tono].barra,
                  r === rango ? "opacity-100" : "opacity-35"
                )}
                style={{ width: `${((r.hasta - r.desde) / (ESCALA_MAX - ESCALA_MIN)) * 100}%` }}
              />
            ))}
          </div>
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-white shadow-md transition-[left] duration-500"
            style={{ left: `${posicion(imc)}%` }}
          />
        </div>
        <div aria-hidden="true" className="relative mt-1.5 h-4 text-[10px] text-muted-foreground">
          {MARCAS.map((marca) => (
            <span
              key={marca}
              className="absolute -translate-x-1/2"
              style={{ left: `${posicion(marca)}%` }}
            >
              {formatear(marca).replace(",0", "")}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Referencia general de la OMS: no distingue músculo de grasa.
      </p>
    </div>
  );
}
