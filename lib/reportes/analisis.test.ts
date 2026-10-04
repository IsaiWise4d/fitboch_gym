import { describe, expect, it } from "vitest";

import { construirVistaReporte } from "./analisis";
import { construirReporteMensual } from "./mensual";
import { construirTendencia, mesesHasta, variacion } from "./tendencia";

const reporte = construirReporteMensual({
  mes: "2026-09",
  hoy: "2026-10-03",
  usuarios: [
    {
      id: "u1",
      nombre: "Ana",
      apellido: null,
      email: "ana@fitboch.co",
      telefono: null,
      genero: null,
      fecha_nacimiento: null,
      activo: true,
      created_at: "2026-08-01T12:00:00.000Z",
      membresias: [],
    },
  ],
  registrosMes: [
    {
      id: "r1",
      user_id: "u1",
      ejercicio_id: "e1",
      fecha_completado: "2026-09-07T13:00:00.000Z", // lunes 08:00
      tiempo_descanso_minutos: 2,
      ejercicio: { nombre: "Sentadilla", grupo_muscular: "piernas" },
      series: [{ serie_numero: 1, peso_kg: 50, repeticiones: 10 }],
    },
    {
      id: "r2",
      user_id: "u1",
      ejercicio_id: "e2",
      fecha_completado: "2026-09-07T13:30:00.000Z",
      tiempo_descanso_minutos: 2,
      ejercicio: { nombre: "Press banca", grupo_muscular: "pecho" },
      series: [{ serie_numero: 1, peso_kg: 40, repeticiones: 8 }],
    },
    {
      id: "r3",
      user_id: "u1",
      ejercicio_id: "e1",
      fecha_completado: "2026-09-13T15:00:00.000Z", // domingo 10:00
      tiempo_descanso_minutos: 2,
      ejercicio: { nombre: "Sentadilla", grupo_muscular: "piernas" },
      series: [{ serie_numero: 1, peso_kg: 55, repeticiones: 10 }],
    },
  ],
  registrosPrevios: [],
});

describe("construirVistaReporte", () => {
  const vista = construirVistaReporte(reporte, "2026-10-03", { limiteDetalle: 2 });

  it("quita el detalle completo y deja los más recientes", () => {
    expect("detalle" in vista).toBe(false);
    expect(vista.totalDetalle).toBe(3);
    expect(vista.detalleReciente.map((d) => d.fecha)).toEqual(["2026-09-13", "2026-09-07"]);
  });

  it("agrega por día, día de la semana, hora y grupo", () => {
    const dia7 = vista.analisis.porDia.find((p) => p.fecha === "2026-09-07");
    expect(dia7).toMatchObject({ usuarios: 1, registros: 2, domingo: false, futuro: false });
    expect(vista.analisis.porDia.find((p) => p.fecha === "2026-09-13")?.domingo).toBe(true);
    expect(vista.analisis.porDiaSemana[0]).toEqual({ dia: "Lun", asistencias: 1, registros: 2 });
    expect(vista.analisis.porDiaSemana[6]).toEqual({ dia: "Dom", asistencias: 1, registros: 1 });
    expect(vista.analisis.porHora[8].registros).toBe(2);
    expect(vista.analisis.porGrupo[0]).toEqual({ grupo: "piernas", registros: 2, volumenKg: 1050 });
  });
});

describe("tendencia", () => {
  it("lista meses ascendentes cruzando el año", () => {
    expect(mesesHasta("2027-02", 4)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
  });

  it("agrupa membresías por mes Bogotá", () => {
    const puntos = construirTendencia({
      meses: ["2026-09", "2026-10"],
      mesActual: "2026-10",
      registrosPorMes: { "2026-09": 120 },
      usuariosNuevosPorMes: { "2026-10": 2 },
      membresias: [
        { created_at: "2026-10-01T03:00:00.000Z", monto_pagado: 80000 }, // 30 sep en Bogotá
        { created_at: "2026-10-02T15:00:00.000Z", monto_pagado: null },
      ],
    });
    expect(puntos).toEqual([
      { mes: "2026-09", registros: 120, usuariosNuevos: 0, membresiasNuevas: 1, ingresos: 80000, enCurso: false },
      { mes: "2026-10", registros: 0, usuariosNuevos: 2, membresiasNuevas: 1, ingresos: 0, enCurso: true },
    ]);
  });

  it("variación sin base devuelve null", () => {
    expect(variacion(12, 10)).toBeCloseTo(0.2);
    expect(variacion(5, 0)).toBeNull();
    expect(variacion(5, null)).toBeNull();
  });
});
