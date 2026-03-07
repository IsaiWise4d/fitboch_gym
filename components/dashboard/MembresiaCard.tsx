import type { Membresia } from "@/types/app";
import {
  calcularEstadoMembresia,
  getEstadoConfig,
  formatTipoPlan,
} from "@/lib/utils/membresia";
import { Clock, AlertTriangle, XCircle, CreditCard } from "lucide-react";

interface MembresiaCardProps {
  membresia: Membresia | null;
}

export function MembresiaCard({ membresia }: MembresiaCardProps) {
  if (!membresia) {
    const config = getEstadoConfig("sin_membresia");
    return (
      <div
        className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 space-y-3`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Membresía
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}
          >
            <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
            {config.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          No tienes una membresía activa. Contacta al administrador del
          gimnasio.
        </p>
      </div>
    );
  }

  const { estado, diasRestantes, fechaFormateada } = calcularEstadoMembresia(
    membresia.fecha_fin
  );
  const config = getEstadoConfig(estado);

  return (
    <div
      className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 space-y-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Membresía {formatTipoPlan(membresia.tipo_plan)}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}
        >
          <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          {config.label}
        </span>
      </div>

      <div className="space-y-1">
        {estado === "vencida" ? (
          <div className="flex items-center gap-2">
            <XCircle className={`h-4 w-4 ${config.color}`} />
            <p className={`text-sm ${config.color}`}>
              Tu membresía venció el {fechaFormateada}
            </p>
          </div>
        ) : estado === "por_vencer" ? (
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${config.color}`} />
            <p className={`text-sm ${config.color}`}>
              Vence en {diasRestantes} {diasRestantes === 1 ? "día" : "días"} —{" "}
              {fechaFormateada}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Vence el {fechaFormateada} — {diasRestantes} días restantes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
