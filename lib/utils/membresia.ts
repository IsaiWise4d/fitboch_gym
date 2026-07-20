import { differenceInDays, parseISO } from "date-fns";
import { getHoyColombia, formatFechaColombia } from "@/lib/utils/fecha";
import type { EstadoMembresia } from "@/types/app";

export function calcularEstadoMembresia(fechaFin: string): {
  estado: EstadoMembresia;
  diasRestantes: number;
  fechaFormateada: string;
} {
  const hoy = parseISO(getHoyColombia());
  const fin = parseISO(fechaFin);
  const diasRestantes = differenceInDays(fin, hoy);
  const fechaFormateada = formatFechaColombia(fechaFin, "d 'de' MMMM, yyyy");

  let estado: EstadoMembresia;
  if (diasRestantes < 0) {
    estado = "vencida";
  } else if (diasRestantes <= 7) {
    estado = "por_vencer";
  } else {
    estado = "activa";
  }

  return { estado, diasRestantes, fechaFormateada };
}

export function getEstadoConfig(estado: EstadoMembresia) {
  switch (estado) {
    case "activa":
      return {
        color: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success/30",
        dotColor: "bg-success",
        label: "Activa",
      };
    case "por_vencer":
      return {
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/30",
        dotColor: "bg-warning",
        label: "Por vencer",
      };
    case "vencida":
      return {
        color: "text-error",
        bgColor: "bg-error/10",
        borderColor: "border-error/30",
        dotColor: "bg-error",
        label: "Vencida",
      };
    case "sin_membresia":
      return {
        color: "text-muted-foreground",
        bgColor: "bg-muted/10",
        borderColor: "border-border",
        dotColor: "bg-muted-foreground",
        label: "Sin membresía",
      };
  }
}

export function formatTipoPlan(tipo: string): string {
  const map: Record<string, string> = {
    mensual: "Mensual",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };
  return map[tipo] || tipo;
}
