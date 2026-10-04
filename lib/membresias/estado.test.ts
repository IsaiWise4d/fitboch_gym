import { describe, expect, it } from "vitest";

import {
  diasEntreFechas,
  esVigente,
  estadoMembresia,
  estadoUsuario,
  membresiaActual,
  sumarDiasFecha,
  textoVencimiento,
} from "./estado";

const HOY = "2026-10-03";

describe("diasEntreFechas / sumarDiasFecha", () => {
  it("cuenta días calendario en ambos sentidos", () => {
    expect(diasEntreFechas(HOY, "2026-10-10")).toBe(7);
    expect(diasEntreFechas(HOY, "2026-10-02")).toBe(-1);
    expect(diasEntreFechas("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("suma días cruzando mes y año", () => {
    expect(sumarDiasFecha("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDiasFecha("2027-01-01", -1)).toBe("2026-12-31");
    expect(sumarDiasFecha("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("estadoMembresia", () => {
  it("vence hoy → por vencer con 0 días", () => {
    expect(estadoMembresia(HOY, HOY)).toEqual({ clave: "por_vencer", diasRestantes: 0 });
  });

  it("vence en 7 días → por vencer (umbral inclusive)", () => {
    expect(estadoMembresia("2026-10-10", HOY).clave).toBe("por_vencer");
  });

  it("vence en 8 días → activa", () => {
    expect(estadoMembresia("2026-10-11", HOY)).toEqual({ clave: "activa", diasRestantes: 8 });
  });

  it("venció ayer → vencida", () => {
    expect(estadoMembresia("2026-10-02", HOY)).toEqual({ clave: "vencida", diasRestantes: -1 });
  });

  it("sin fecha → sin membresía", () => {
    expect(estadoMembresia(null, HOY)).toEqual({ clave: "sin_membresia", diasRestantes: null });
  });
});

describe("membresiaActual / esVigente", () => {
  const membresias = [
    { id: "a", estado: "vencida", fecha_fin: "2026-12-31" },
    { id: "b", estado: "activa", fecha_fin: "2026-09-30" },
    { id: "c", estado: "activa", fecha_fin: "2026-11-15" },
  ];

  it("toma la activa con la fecha fin más lejana, ignorando otros estados", () => {
    expect(membresiaActual(membresias)?.id).toBe("c");
  });

  it("devuelve null si no hay activas", () => {
    expect(membresiaActual([{ estado: "vencida", fecha_fin: HOY }])).toBeNull();
  });

  it("vigente mientras fecha_fin ≥ hoy", () => {
    expect(esVigente({ estado: "activa", fecha_fin: HOY }, HOY)).toBe(true);
    expect(esVigente({ estado: "activa", fecha_fin: "2026-10-02" }, HOY)).toBe(false);
    expect(esVigente(null, HOY)).toBe(false);
  });
});

describe("estadoUsuario", () => {
  it("desactivado tiene prioridad pero conserva la membresía", () => {
    const r = estadoUsuario(
      { activo: false, membresias: [{ estado: "activa", fecha_fin: "2026-12-01" }] },
      HOY
    );
    expect(r.clave).toBe("desactivado");
    expect(r.membresia?.fecha_fin).toBe("2026-12-01");
  });

  it("activo sin membresías → sin membresía", () => {
    expect(estadoUsuario({ activo: true, membresias: [] }, HOY).clave).toBe("sin_membresia");
  });
});

describe("textoVencimiento", () => {
  it("redacta según los días restantes", () => {
    expect(textoVencimiento(0)).toBe("Vence hoy");
    expect(textoVencimiento(1)).toBe("Vence mañana");
    expect(textoVencimiento(5)).toBe("Vence en 5 días");
    expect(textoVencimiento(-1)).toBe("Venció ayer");
    expect(textoVencimiento(-4)).toBe("Venció hace 4 días");
  });
});
