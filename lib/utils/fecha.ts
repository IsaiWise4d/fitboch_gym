import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function calcularEdad(fechaNacimiento: string): number {
  const [hY, hM, hD] = getHoyColombia().split("-").map(Number);
  const [nY, nM, nD] = fechaNacimiento.split("-").map(Number);
  let edad = hY - nY;
  if (hM < nM || (hM === nM && hD < nD)) edad -= 1;
  return edad;
}

export function getHoyColombia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

export function getRangoDiaColombiaUTC(fechaBase: Date = new Date()) {
  const fechaColombia = fechaBase.toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });

  const [year, month, day] = fechaColombia.split("-").map(Number);

  const inicioUtc = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
  const finUtc = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0, 0));

  return {
    fechaColombia,
    inicioUtcIso: inicioUtc.toISOString(),
    finUtcIso: finUtc.toISOString(),
  };
}

export function formatFechaColombia(
  fecha: string | Date,
  pattern: string
): string {
  let d: Date;
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    d = new Date(`${fecha}T12:00:00Z`);
  } else if (typeof fecha === "string") {
    d = parseISO(fecha);
  } else {
    d = fecha;
  }
  return format(d, pattern, { locale: es });
}
