import { describe, expect, it } from "vitest";

import {
  agruparDiasEntreno,
  construirCalendarioActividad,
  diaYHoraBogota,
  horaMinutoBogota,
  metricasUsuario,
} from "./actividad";
import type { DiaEntreno } from "./tipos";

// 2026-10-03 es sábado; 2026-10-04 domingo.
const HOY = "2026-10-03";

function dia(fecha: string, ejercicios = 1, userId = "u1"): DiaEntreno {
  return { userId, dia: fecha, primeraIso: `${fecha}T13:00:00.000Z`, horaLlegada: 8, ejercicios };
}

describe("diaYHoraBogota", () => {
  it("entre 00:00 y 05:00 UTC sigue siendo el día anterior en Bogotá", () => {
    expect(diaYHoraBogota("2026-10-03T03:00:00.000Z")).toEqual({ dia: "2026-10-02", hora: 22 });
    expect(diaYHoraBogota("2026-10-03T05:00:00.000Z")).toEqual({ dia: "2026-10-03", hora: 0 });
  });

  it("formatea HH:mm en Bogotá", () => {
    expect(horaMinutoBogota("2026-10-03T13:05:00.000Z")).toBe("08:05");
  });
});

describe("agruparDiasEntreno", () => {
  it("agrupa por usuario y día Bogotá, contando ejercicios y la primera llegada", () => {
    const dias = agruparDiasEntreno([
      { user_id: "u1", fecha_completado: "2026-10-03T13:00:00.000Z" },
      { user_id: "u1", fecha_completado: "2026-10-03T12:00:00.000Z" },
      { user_id: "u1", fecha_completado: "2026-10-03T04:30:00.000Z" },
      { user_id: "u2", fecha_completado: "2026-10-03T15:00:00.000Z" },
    ]);
    expect(dias).toHaveLength(3);
    const u1Hoy = dias.find((d) => d.userId === "u1" && d.dia === "2026-10-03");
    expect(u1Hoy).toMatchObject({ ejercicios: 2, horaLlegada: 7, primeraIso: "2026-10-03T12:00:00.000Z" });
    expect(dias.find((d) => d.userId === "u1" && d.dia === "2026-10-02")?.horaLlegada).toBe(23);
  });
});

describe("metricasUsuario", () => {
  const semana = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"].map((f) =>
    dia(f)
  );

  it("calcula racha, último entreno y asistencia sin contar hoy como fallo", () => {
    const m = metricasUsuario(semana, HOY, { registro: "2026-09-28T10:00:00.000Z" });
    expect(m.racha.currentCount).toBe(5);
    expect(m.racha.hoyActivado).toBe(false);
    expect(m.ultimoEntreno).toBe("2026-10-02");
    expect(m.diasSinEntrenar).toBe(1);
    expect(m.entrenoHoy).toBe(false);
    expect(m.dias30).toBe(5);
    expect(m.exigibles30).toBe(5);
    expect(m.asistencia30).toBe(1);
    expect(m.diasActivosMes).toBe(2);
  });

  it("los días anteriores al registro no cuentan como fallos", () => {
    const m = metricasUsuario([dia("2026-10-02")], HOY, { registro: "2026-10-02" });
    expect(m.exigibles30).toBe(1);
    expect(m.asistencia30).toBe(1);
  });

  it("ignora para la racha los días previos a FECHA_INICIO_RACHA", () => {
    const m = metricasUsuario([dia("2026-08-22")], "2026-08-24");
    expect(m.racha.currentCount).toBe(0);
    expect(m.mejorRacha).toBe(0);
    expect(m.ultimoEntreno).toBe("2026-08-22");
  });

  it("sin entrenos: métricas vacías", () => {
    const m = metricasUsuario([], HOY);
    expect(m.ultimoEntreno).toBeNull();
    expect(m.diasSinEntrenar).toBeNull();
    expect(m.asistencia30).toBe(0);
  });

  it("hoy domingo: no exige el día", () => {
    const m = metricasUsuario(semana, "2026-10-04", { registro: "2026-09-28" });
    expect(m.racha.esDomingo).toBe(true);
    expect(m.racha.enRiesgo).toBe(false);
  });
});

describe("construirCalendarioActividad", () => {
  it("arma semanas lunes→domingo terminando en la semana de hoy", () => {
    const cal = construirCalendarioActividad([dia("2026-10-01", 5)], HOY, 2, "2026-09-25");
    expect(cal).toHaveLength(2);
    expect(cal[0][0].fecha).toBe("2026-09-21");
    expect(cal[1][6].fecha).toBe("2026-10-04");
    expect(cal[1][6]).toMatchObject({ futuro: true, exigible: false });
    expect(cal[1][3]).toMatchObject({ fecha: "2026-10-01", ejercicios: 5, nivel: 3 });
    expect(cal[0][0].antesDeRegistro).toBe(true);
  });
});
