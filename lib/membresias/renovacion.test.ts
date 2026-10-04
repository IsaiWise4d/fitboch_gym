import { describe, expect, it } from "vitest";

import { calcularFechaFinRenovacion, sumarMesesFecha } from "./renovacion";

describe("sumarMesesFecha", () => {
  it("recorta al último día del mes destino (como date-fns addMonths)", () => {
    expect(sumarMesesFecha("2026-01-31", 1)).toBe("2026-02-28");
    expect(sumarMesesFecha("2028-01-31", 1)).toBe("2028-02-29");
    expect(sumarMesesFecha("2026-08-31", 3)).toBe("2026-11-30");
  });

  it("cruza el año", () => {
    expect(sumarMesesFecha("2026-11-15", 3)).toBe("2027-02-15");
    expect(sumarMesesFecha("2026-10-03", 12)).toBe("2027-10-03");
  });
});

describe("calcularFechaFinRenovacion", () => {
  const hoy = "2026-10-03";

  it("sin membresía: hoy + N meses − 1 día", () => {
    expect(calcularFechaFinRenovacion({ hoy, finVigente: null, tipoPlan: "mensual" })).toBe(
      "2026-11-02"
    );
    expect(calcularFechaFinRenovacion({ hoy, finVigente: null, tipoPlan: "anual" })).toBe(
      "2027-10-02"
    );
  });

  it("membresía vencida: se ignora su fin y empieza hoy", () => {
    expect(
      calcularFechaFinRenovacion({ hoy, finVigente: "2026-09-20", tipoPlan: "trimestral" })
    ).toBe("2027-01-02");
  });

  it("membresía vigente: el nuevo periodo empieza el día siguiente al fin (no pierde un día)", () => {
    expect(
      calcularFechaFinRenovacion({ hoy, finVigente: "2026-11-02", tipoPlan: "mensual" })
    ).toBe("2026-12-02");
  });

  it("vigente que vence hoy también encadena desde mañana", () => {
    expect(calcularFechaFinRenovacion({ hoy, finVigente: hoy, tipoPlan: "mensual" })).toBe(
      "2026-11-03"
    );
  });

  it("31 de enero + mensual respeta febrero (y año bisiesto)", () => {
    expect(
      calcularFechaFinRenovacion({ hoy: "2026-01-31", finVigente: null, tipoPlan: "mensual" })
    ).toBe("2026-02-27");
    expect(
      calcularFechaFinRenovacion({ hoy: "2028-01-31", finVigente: null, tipoPlan: "mensual" })
    ).toBe("2028-02-28");
  });

  it("plan desconocido cae a 1 mes", () => {
    expect(calcularFechaFinRenovacion({ hoy, finVigente: null, tipoPlan: "x" })).toBe(
      "2026-11-02"
    );
  });
});
