import { describe, expect, it } from "vitest";

import { enlaceWhatsApp, normalizarTelefonoCo } from "./contacto";
import {
  construirFilasUsuarios,
  contarPorEstado,
  filasACsv,
  filtrarUsuarios,
  ordenarUsuarios,
  parsearFiltroEstado,
  parsearOrden,
} from "./usuarios";
import type { UsuarioAdmin } from "./tipos";

const HOY = "2026-10-03";

function usuario(id: string, nombre: string, extra: Partial<UsuarioAdmin> = {}): UsuarioAdmin {
  return {
    id,
    nombre,
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

const membresia = (fecha_fin: string, monto: number | null = 80000) => ({
  id: fecha_fin,
  created_at: "2026-09-01T12:00:00.000Z",
  tipo_plan: "trimestral",
  fecha_inicio: "2026-09-01",
  fecha_fin,
  estado: "activa",
  monto_pagado: monto,
});

const filas = construirFilasUsuarios(
  [
    usuario("a", "Álvaro", { membresias: [membresia("2026-12-01")] }),
    usuario("b", "Beatriz", { membresias: [membresia("2026-10-06")], telefono: "300 555 1234" }),
    usuario("c", "Camilo", { membresias: [membresia("2026-09-01", null)] }),
    usuario("d", "Diana", { activo: false }),
    usuario("e", "Esteban"),
  ],
  [{ userId: "a", dia: "2026-10-02", primeraIso: "2026-10-02T13:00:00.000Z", horaLlegada: 8, ejercicios: 3 }],
  HOY
);

describe("construirFilasUsuarios", () => {
  it("calcula estado, plan y métricas por usuario", () => {
    const alvaro = filas.find((f) => f.id === "a")!;
    expect(alvaro).toMatchObject({
      estado: "activa",
      plan: "Trimestral",
      racha: 1,
      // Faltó el jueves y hoy (sábado) aún no entrena → misma semana laboral.
      estadoRacha: "en_riesgo",
      ultimoEntreno: "2026-10-02",
      dias30: 1,
    });
    expect(filas.find((f) => f.id === "b")?.estado).toBe("por_vencer");
    expect(filas.find((f) => f.id === "d")?.estado).toBe("desactivado");
  });
});

describe("filtrarUsuarios", () => {
  it("filtra por estado", () => {
    expect(filtrarUsuarios(filas, { estado: "vencida", q: "" }).map((f) => f.id)).toEqual(["c"]);
  });

  it("busca sin tildes por nombre, email o teléfono", () => {
    expect(filtrarUsuarios(filas, { estado: "todos", q: "alvaro" }).map((f) => f.id)).toEqual(["a"]);
    expect(filtrarUsuarios(filas, { estado: "todos", q: "e@fit" }).map((f) => f.id)).toEqual(["e"]);
    expect(filtrarUsuarios(filas, { estado: "todos", q: "5551" }).map((f) => f.id)).toEqual(["b"]);
  });
});

describe("ordenarUsuarios", () => {
  it("por defecto prioriza por vencer, vencidas y luego activas", () => {
    expect(ordenarUsuarios(filas, { campo: "estado", dir: "asc" }).map((f) => f.id)).toEqual([
      "b",
      "c",
      "a",
      "e",
      "d",
    ]);
  });

  it("deja los nulos al final en ambas direcciones", () => {
    const asc = ordenarUsuarios(filas, { campo: "monto", dir: "asc" });
    const desc = ordenarUsuarios(filas, { campo: "monto", dir: "desc" });
    expect(asc.at(-1)?.monto).toBeNull();
    expect(desc.at(-1)?.monto).toBeNull();
  });
});

describe("contarPorEstado / parseo", () => {
  it("cuenta cada estado y el total", () => {
    expect(contarPorEstado(filas)).toEqual({
      todos: 5,
      activa: 1,
      por_vencer: 1,
      vencida: 1,
      sin_membresia: 1,
      desactivado: 1,
    });
  });

  it("valores desconocidos caen a los valores por defecto", () => {
    expect(parsearFiltroEstado("otro")).toBe("todos");
    expect(parsearFiltroEstado("por_vencer")).toBe("por_vencer");
    expect(parsearOrden("racha", "desc")).toEqual({ campo: "racha", dir: "desc" });
    expect(parsearOrden("x", "desc")).toEqual({ campo: "estado", dir: "asc" });
  });
});

describe("filasACsv", () => {
  it("incluye BOM, encabezado y separador ;", () => {
    const csv = filasACsv([{ ...filas[0], nombre: 'Álvaro "Toro"; Gym' }]);
    expect(csv.startsWith("﻿Nombre;Email;")).toBe(true);
    expect(csv).toContain('"Álvaro ""Toro""; Gym";a@fitboch.co');
  });
});

describe("contacto", () => {
  it("normaliza celulares colombianos", () => {
    expect(normalizarTelefonoCo("300 123 4567")).toBe("573001234567");
    expect(normalizarTelefonoCo("+57 300-123-4567")).toBe("573001234567");
    expect(normalizarTelefonoCo("12345")).toBeNull();
    expect(normalizarTelefonoCo(null)).toBeNull();
  });

  it("arma el enlace de WhatsApp con mensaje codificado", () => {
    expect(enlaceWhatsApp("3001234567", "Hola Ana")).toBe("https://wa.me/573001234567?text=Hola%20Ana");
    expect(enlaceWhatsApp("123")).toBeNull();
  });
});
