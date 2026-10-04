import { describe, expect, it } from "vitest";

import {
  calcularRachaMaximaEnRango,
  construirReporteMensual,
  esMesValido,
  rangoMes,
  sumarMeses,
} from "./mensual";
import type { RegistroReporte, UsuarioReporte } from "./mensual";

// Calendario de referencia: 2026-08-23 es domingo (inicio de la racha),
// 2026-09-01 es martes y los domingos de septiembre son 6, 13, 20 y 27.

const usuarioBase: UsuarioReporte = {
  id: "u1",
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@test.com",
  telefono: null,
  genero: "femenino",
  fecha_nacimiento: "2000-10-05",
  activo: true,
  created_at: "2026-08-01T15:00:00Z",
  membresias: [
    {
      id: "m1",
      created_at: "2026-09-01T12:00:00Z",
      tipo_plan: "mensual",
      fecha_inicio: "2026-09-01",
      fecha_fin: "2026-09-30",
      estado: "activa",
      monto_pagado: 80000,
    },
  ],
};

const banca = { nombre: "Press banca", grupo_muscular: "Pecho" };
const sentadilla = { nombre: "Sentadilla", grupo_muscular: "Piernas" };

const registrosSeptiembre: RegistroReporte[] = [
  {
    id: "h1",
    user_id: "u1",
    ejercicio_id: "e-banca",
    fecha_completado: "2026-09-01T15:00:00Z",
    tiempo_descanso_minutos: 2,
    ejercicio: banca,
    series: [
      { serie_numero: 1, peso_kg: 60, repeticiones: 10 },
      { serie_numero: 2, peso_kg: 65, repeticiones: 8 },
    ],
  },
  {
    id: "h2",
    user_id: "u1",
    ejercicio_id: "e-banca",
    fecha_completado: "2026-09-02T15:00:00Z",
    tiempo_descanso_minutos: 1,
    ejercicio: banca,
    series: [{ serie_numero: 1, peso_kg: 70, repeticiones: 5 }],
  },
  {
    id: "h3",
    user_id: "u1",
    ejercicio_id: "e-sentadilla",
    fecha_completado: "2026-09-06T15:00:00Z",
    tiempo_descanso_minutos: 3,
    ejercicio: sentadilla,
    series: [{ serie_numero: 1, peso_kg: 100, repeticiones: 5 }],
  },
];

describe("utilidades de mes", () => {
  it("valida y desplaza meses", () => {
    expect(esMesValido("2026-09")).toBe(true);
    expect(esMesValido("2026-13")).toBe(false);
    expect(esMesValido("26-09")).toBe(false);
    expect(sumarMeses("2026-01", -1)).toBe("2025-12");
    expect(sumarMeses("2026-12", 1)).toBe("2027-01");
  });

  it("calcula el rango del mes en Bogotá", () => {
    const rango = rangoMes("2026-09");
    expect(rango.inicio).toBe("2026-09-01");
    expect(rango.fin).toBe("2026-09-30");
    expect(rango.dias).toHaveLength(30);
    expect(rango.inicioUtcIso).toBe("2026-09-01T05:00:00.000Z");
    expect(rango.finUtcIso).toBe("2026-10-01T05:00:00.000Z");
    expect(rangoMes("2028-02").dias).toHaveLength(29);
  });
});

describe("calcularRachaMaximaEnRango", () => {
  it("continúa la racha que viene del mes anterior", () => {
    const activados = new Set(["2026-08-27", "2026-08-28", "2026-08-29", "2026-09-01"]);
    // Lunes 31 fallado (tolerado) → el martes 1 sube la racha a 4.
    expect(calcularRachaMaximaEnRango(activados, "2026-09-01", "2026-09-30")).toBe(4);
    expect(calcularRachaMaximaEnRango(activados, "2026-08-01", "2026-08-31")).toBe(3);
  });

  it("devuelve 0 si no hubo activaciones dentro del rango", () => {
    const activados = new Set(["2026-08-27", "2026-08-28"]);
    expect(calcularRachaMaximaEnRango(activados, "2026-09-01", "2026-09-30")).toBe(0);
  });
});

describe("construirReporteMensual", () => {
  const reporte = construirReporteMensual({
    mes: "2026-09",
    hoy: "2026-10-02",
    usuarios: [usuarioBase],
    registrosMes: registrosSeptiembre,
    registrosPrevios: [
      {
        user_id: "u1",
        ejercicio_id: "e-banca",
        fecha_completado: "2026-08-28T15:00:00Z",
        peso_max: 62,
      },
    ],
  });
  const fila = reporte.usuarios[0];

  it("resume asistencia y racha de un mes cerrado", () => {
    expect(reporte.enCurso).toBe(false);
    expect(reporte.nombreMes).toBe("Septiembre 2026");
    expect(fila.diasEntrenados).toBe(3);
    expect(fila.diasExigiblesCumplidos).toBe(2);
    expect(fila.diasExigiblesTranscurridos).toBe(26);
    expect(fila.diasFallados).toBe(24);
    expect(fila.asistencia).toBeCloseTo(2 / 26);
    expect(fila.clasificacion).toBe("Irregular");
    expect(fila.rachaCierre).toBe(0);
    expect(fila.mejorRachaMes).toBe(3);
    expect(fila.asistenciaDias[0]).toBe("entreno");
    expect(fila.asistenciaDias[5]).toBe("domingo_entreno");
    expect(fila.asistenciaDias[6]).toBe("fallo");
    expect(fila.asistenciaDias[12]).toBe("descanso");
  });

  it("calcula volumen, frecuencias y récords superados", () => {
    expect(fila.ejercicios).toBe(3);
    expect(fila.series).toBe(4);
    expect(fila.repeticiones).toBe(28);
    expect(fila.volumenKg).toBe(1970);
    expect(fila.pesoMaximoKg).toBe(100);
    expect(fila.ejercicioPesoMaximo).toBe("Sentadilla");
    expect(fila.ejercicioFrecuente).toBe("Press banca");
    expect(fila.gruposTrabajados).toBe(2);
    expect(fila.recordsSuperados).toBe(1);
    expect(fila.detalleRecords).toBe("Press banca: 62 → 70 kg");
    expect(fila.edad).toBe(25);
  });

  it("arma el detalle en hora Bogotá y el ranking", () => {
    expect(reporte.detalle).toHaveLength(3);
    expect(reporte.detalle[0]).toMatchObject({
      fecha: "2026-09-01",
      hora: "10:00",
      diaSemana: "Martes",
      detalleSeries: "60 kg × 10 · 65 kg × 8",
    });
    expect(reporte.ranking[0]).toMatchObject({
      ejercicio: "Press banca",
      registros: 2,
      usuarios: 1,
      volumenKg: 1470,
    });
  });

  it("incluye membresías nuevas y por vencer del mes", () => {
    expect(fila.estadoMembresia).toBe("Vencida");
    expect(reporte.membresias).toHaveLength(1);
    expect(reporte.membresias[0].movimiento).toBe("Nueva y vence en el mes");
    expect(reporte.resumen).toMatchObject({
      usuariosIncluidos: 1,
      usuariosConActividad: 1,
      membresiasNuevasMes: 1,
      membresiasVencenMes: 1,
      ingresosMes: 80000,
      rachaMasAlta: 3,
      usuarioRachaMasAlta: "Ana Gómez",
    });
  });

  it("deja pendientes hoy y los días futuros en el mes en curso", () => {
    const parcial = construirReporteMensual({
      mes: "2026-09",
      hoy: "2026-09-02",
      usuarios: [{ ...usuarioBase, created_at: "2026-09-01T15:00:00Z" }],
      registrosMes: registrosSeptiembre.slice(0, 1),
      registrosPrevios: [],
    });
    const f = parcial.usuarios[0];
    expect(parcial.enCurso).toBe(true);
    expect(f.asistenciaDias[0]).toBe("entreno");
    expect(f.asistenciaDias[1]).toBe("pendiente");
    expect(f.asistenciaDias[10]).toBe("pendiente");
    expect(f.diasExigiblesTranscurridos).toBe(1);
    expect(f.asistencia).toBe(1);
    expect(f.rachaCierre).toBe(1);
  });

  it("no cuenta como fallo los días previos al registro del usuario", () => {
    const nuevo = construirReporteMensual({
      mes: "2026-09",
      hoy: "2026-10-02",
      usuarios: [{ ...usuarioBase, created_at: "2026-09-20T15:00:00Z", membresias: [] }],
      registrosMes: [],
      registrosPrevios: [],
    });
    const f = nuevo.usuarios[0];
    expect(f.asistenciaDias[0]).toBe("fuera");
    expect(f.asistenciaDias[18]).toBe("fuera");
    // Del 20 (domingo) al 30: 9 días L-S evaluables, todos fallados.
    expect(f.diasExigiblesTranscurridos).toBe(9);
    expect(f.clasificacion).toBe("Inactivo");
    expect(f.estadoMembresia).toBe("Sin membresía");
  });
});
