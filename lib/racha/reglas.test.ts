import { describe, expect, it } from "vitest";

import {
  calcularMejorRacha,
  calcularRacha,
  construirCalendarioActivaciones,
  esDiaExigible,
  FECHA_INICIO_RACHA,
} from "./reglas";
import { stringAFecha } from "./bogota";

const set = (...fechas: string[]) => new Set(fechas);

describe("reglas de racha", () => {
  it("cuenta días consecutivos y no duplica ejercicios del mismo día", () => {
    expect(
      calcularRacha(set("2024-02-26", "2024-02-27", "2024-02-28"), "2024-02-28")
    ).toMatchObject({ currentCount: 3, hoyActivado: true, enRiesgo: false });
    expect(calcularRacha(set("2024-02-02"), "2024-02-02").currentCount).toBe(1);
  });

  it("tolera un fallo, pero resetea después de dos fallos exigibles", () => {
    expect(calcularRacha(set("2024-02-26", "2024-02-28"), "2024-02-28").currentCount).toBe(2);
    expect(calcularRacha(set("2024-02-26"), "2024-02-29")).toMatchObject({
      currentCount: 0,
      rota: true,
    });
  });

  it("reinicia los fallos al cruzar domingo y calcula el riesgo", () => {
    expect(calcularRacha(set("2024-02-23"), "2024-02-27")).toMatchObject({
      currentCount: 1,
      enRiesgo: true,
      rota: false,
    });
  });

  it("mantiene domingo como descanso, aunque exista un registro ese día", () => {
    const estado = calcularRacha(set("2024-02-24", "2024-02-25"), "2024-02-25");
    expect(estado).toMatchObject({ currentCount: 1, hoyActivado: false, esDomingo: true });
    expect(esDiaExigible(stringAFecha("2024-02-25"))).toBe(false);
  });

  it("convierte timestamps a días Bogotá", () => {
    expect(construirCalendarioActivaciones(["2024-02-27T02:00:00Z"]).has("2024-02-26")).toBe(true);
    expect(construirCalendarioActivaciones(["2024-02-27T05:00:00Z"]).has("2024-02-27")).toBe(true);
  });

  it("calcula la mejor racha histórica", () => {
    expect(
      calcularMejorRacha(
        set("2024-02-26", "2024-02-27", "2024-02-28", "2024-03-01", "2024-03-02")
      )
    ).toBe(5);
    expect(calcularMejorRacha(set("2024-02-26", "2024-02-28"))).toBe(2);
  });

  it("define una fecha de corte de racha con formato YYYY-MM-DD válido", () => {
    // La lógica pura recibe el Set ya filtrado por server.ts; aquí solo
    // verificamos que la constante existe y tiene el formato esperado.
    expect(FECHA_INICIO_RACHA).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
