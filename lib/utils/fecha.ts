import { differenceInYears, parseISO } from "date-fns";

export function calcularEdad(fechaNacimiento: string): number {
  return differenceInYears(new Date(), parseISO(fechaNacimiento));
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
