import { describe, expect, it } from "vitest";

import { agruparDiasEntreno } from "./actividad";
import { construirPanel, contarAlertasMembresia, proximosCumpleanos } from "./panel";
import type { UsuarioAdmin } from "./tipos";

const HOY = "2026-10-03"; // sábado

function usuario(id: string, extra: Partial<UsuarioAdmin> = {}): UsuarioAdmin {
  return {
    id,
    nombre: id.toUpperCase(),
    apellido: null,
    email: `${id}@fitboch.co`,
    telefono: null,
    fecha_nacimiento: null,
    activo: true,
    perfil_completo: true,
    created_at: "2026-09-01T12:00:00.000Z",
    membresias: [],
    ...extra,
  };
}

function membresia(fecha_fin: string, estado = "activa") {
  return {
    id: `m-${fecha_fin}`,
    created_at: "2026-09-01T12:00:00.000Z",
    tipo_plan: "mensual",
    fecha_inicio: "2026-09-01",
    fecha_fin,
    estado,
    monto_pagado: 80000,
  };
}

const usuarios: UsuarioAdmin[] = [
  usuario("ana", { membresias: [membresia("2026-12-31")], fecha_nacimiento: "1990-10-03" }),
  usuario("beto", { membresias: [membresia("2026-10-05")], telefono: "3001234567" }),
  usuario("caro", { membresias: [membresia("2026-09-20")] }),
  usuario("dani", { activo: false, membresias: [membresia("2026-12-31")] }),
  usuario("eva", { created_at: "2026-10-01T12:00:00.000Z" }),
];

const dias = agruparDiasEntreno([
  { user_id: "ana", fecha_completado: "2026-10-03T13:00:00.000Z" }, // hoy 08:00
  { user_id: "ana", fecha_completado: "2026-10-03T13:20:00.000Z" },
  { user_id: "ana", fecha_completado: "2026-10-02T23:30:00.000Z" }, // 2 oct 18:30
  { user_id: "dani", fecha_completado: "2026-10-03T14:00:00.000Z" }, // desactivado
]);

describe("construirPanel", () => {
  const panel = construirPanel({ hoy: HOY, usuarios, dias });

  it("distribuye cada usuario en un único estado", () => {
    expect(panel.distribucion).toEqual({
      activa: 1,
      por_vencer: 1,
      vencida: 1,
      sin_membresia: 1,
      desactivado: 1,
    });
    expect(panel.kpis.usuariosActivos).toBe(4);
    expect(panel.kpis.miembrosVigentes).toBe(2);
    expect(panel.kpis.vencidasRecientes).toBe(1);
  });

  it("entrenaron hoy solo cuenta cuentas activas", () => {
    expect(panel.kpis.entrenaronHoy).toBe(1);
    expect(panel.actividadHoy).toEqual([
      { usuarioId: "ana", nombre: "ANA", ejercicios: 2, hora: "08:00", racha: 1 },
    ]);
  });

  it("arma las listas de atención", () => {
    expect(panel.atencion.porVencer).toEqual([
      { usuarioId: "beto", nombre: "BETO", telefono: "3001234567", detalle: "Vence en 2 días", extra: "Mensual" },
    ]);
    expect(panel.atencion.vencidasRecientes[0]).toMatchObject({
      usuarioId: "caro",
      detalle: "Venció hace 13 días",
    });
    expect(panel.atencion.inactivos.map((f) => f.usuarioId)).toEqual(["beto"]);
  });

  it("serie diaria de 90 días terminando hoy", () => {
    expect(panel.asistenciaDiaria).toHaveLength(90);
    expect(panel.asistenciaDiaria.at(-1)).toEqual({ fecha: HOY, usuarios: 2, domingo: true });
    expect(panel.asistenciaDiaria.at(-2)?.usuarios).toBe(1);
    expect(panel.kpis.sparkline).toHaveLength(14);
  });

  it("horas pico por hora de llegada (Bogotá)", () => {
    expect(panel.horasPico[8].llegadas).toBe(1);
    expect(panel.horasPico[9].llegadas).toBe(1);
    expect(panel.horasPico[18].llegadas).toBe(1);
  });

  it("top rachas, cumpleaños y últimos registros", () => {
    expect(panel.topRachas[0]).toMatchObject({ usuarioId: "ana", racha: 1, hoyActivado: false });
    expect(panel.cumpleanos[0]).toMatchObject({ usuarioId: "ana", diasRestantes: 0, cumple: 36 });
    expect(panel.ultimosRegistros[0].usuarioId).toBe("eva");
  });
});

describe("contarAlertasMembresia", () => {
  it("suma por vencer + vencidas recientes de cuentas activas", () => {
    expect(contarAlertasMembresia(usuarios, HOY)).toBe(2);
  });
});

describe("proximosCumpleanos", () => {
  it("pasa al año siguiente si el cumpleaños ya ocurrió", () => {
    const [fila] = proximosCumpleanos([usuario("x", { fecha_nacimiento: "1995-10-01" })], HOY);
    expect(fila).toMatchObject({ fecha: "2027-10-01", diasRestantes: 363, cumple: 32 });
  });
});
