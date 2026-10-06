import { describe, expect, it } from "vitest";

import {
  calcularMejorRacha,
  calcularRacha,
  construirCalendarioActivaciones,
  esDiaExigible,
  FECHA_INICIO_RACHA,
  semanaActual,
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

  it("tolera dos fallos exigibles seguidos y resetea al tercero", () => {
    expect(calcularRacha(set("2024-02-26", "2024-02-28"), "2024-02-28").currentCount).toBe(2);
    expect(calcularRacha(set("2024-02-26", "2024-02-29"), "2024-02-29").currentCount).toBe(2);
    expect(calcularRacha(set("2024-02-26"), "2024-03-01")).toMatchObject({
      currentCount: 0,
      rota: true,
    });
  });

  it("el fin de semana es neutro: no reinicia los fallos y calcula el riesgo", () => {
    // Mié, jue y vie fallados + lunes pendiente: 3 seguidos → rota.
    expect(calcularRacha(set("2024-02-27"), "2024-03-04")).toMatchObject({
      currentCount: 0,
      rota: true,
    });
    // Jue y vie fallados (2 de protección usados) y hoy lunes pendiente.
    expect(calcularRacha(set("2024-02-28"), "2024-03-04")).toMatchObject({
      currentCount: 1,
      enRiesgo: true,
      rota: false,
    });
    // Un solo fallo no pone en riesgo.
    expect(calcularRacha(set("2024-02-28", "2024-02-29"), "2024-03-04").enRiesgo).toBe(false);
  });

  it("mantiene sábado y domingo como descanso, aunque exista un registro", () => {
    const domingo = calcularRacha(set("2024-02-23", "2024-02-24", "2024-02-25"), "2024-02-25");
    expect(domingo).toMatchObject({ currentCount: 1, hoyActivado: false, esDomingo: true });
    const sabado = calcularRacha(set("2024-02-23", "2024-02-24"), "2024-02-24");
    expect(sabado).toMatchObject({ currentCount: 1, hoyActivado: false, esDomingo: true });
    expect(esDiaExigible(stringAFecha("2024-02-24"))).toBe(false);
    expect(esDiaExigible(stringAFecha("2024-02-25"))).toBe(false);
    expect(esDiaExigible(stringAFecha("2024-02-23"))).toBe(true);
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
    ).toBe(4);
    expect(calcularMejorRacha(set("2024-02-26", "2024-02-28"))).toBe(2);
  });

  it("arma la semana actual de lunes a domingo", () => {
    // 2024-02-28 es miércoles.
    const semana = semanaActual(set("2024-02-26", "2024-02-28"), "2024-02-28");
    expect(semana.map((d) => d.letra).join("")).toBe("LMXJVSD");
    expect(semana[0]).toMatchObject({ fecha: "2024-02-26", dia: 26, activado: true, futuro: false });
    expect(semana[1]).toMatchObject({ activado: false, esHoy: false });
    expect(semana[2]).toMatchObject({ esHoy: true, activado: true });
    expect(semana[3].futuro).toBe(true);
    expect(semana[5]).toMatchObject({ fecha: "2024-03-02", exigible: false });
    expect(semana[6]).toMatchObject({ fecha: "2024-03-03", exigible: false });
    // Un domingo pertenece a la semana que empezó el lunes anterior.
    expect(semanaActual(set(), "2024-03-03")[0].fecha).toBe("2024-02-26");
  });

  it("define una fecha de corte de racha con formato YYYY-MM-DD válido", () => {
    // La lógica pura recibe el Set ya filtrado por server.ts; aquí solo
    // verificamos que la constante existe y tiene el formato esperado.
    expect(FECHA_INICIO_RACHA).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
