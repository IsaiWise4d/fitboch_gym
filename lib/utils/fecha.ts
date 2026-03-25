import { differenceInYears, parseISO } from "date-fns";

export function calcularEdad(fechaNacimiento: string): number {
  return differenceInYears(new Date(), parseISO(fechaNacimiento));
}

export function getHoyColombia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}
