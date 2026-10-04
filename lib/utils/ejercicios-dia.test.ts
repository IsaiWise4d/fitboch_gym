import { describe, expect, it } from "vitest";

import { ejerciciosDelDia, resumenSeriesReps } from "./ejercicios-dia";

const TABLA = `| Ejercicio | Series | Reps | RIR/RPE | Tempo | Descanso (min) |
|---|---|---|---|---|---|
| **Press de banca plano** | 4 | 6-8 | RIR 2 | 3-1-1-0 | 3 |
| Elevaciones laterales | 3 | 12-15 | RIR 1 | 2-0-1-0 | 2.5 |`;

describe("ejerciciosDelDia", () => {
  it("ubica las columnas por encabezado y agrega la unidad del descanso", () => {
    expect(ejerciciosDelDia(TABLA)).toEqual([
      { nombre: "Press de banca plano", series: "4", reps: "6-8", intensidad: "RIR 2", descanso: "3 min" },
      {
        nombre: "Elevaciones laterales",
        series: "3",
        reps: "12-15",
        intensidad: "RIR 1",
        descanso: "2.5 min",
      },
    ]);
  });

  it("tolera tablas sin algunas columnas y texto alrededor", () => {
    const tabla = `Notas del día\n| Ejercicio | Repeticiones |\n|---|---|\n| Plancha | 3x30s |`;
    const [plancha] = ejerciciosDelDia(tabla);
    expect(plancha).toMatchObject({ nombre: "Plancha", reps: "3x30s", series: null, descanso: null });
    expect(resumenSeriesReps(plancha)).toBe("3x30s reps");
  });

  it("devuelve vacío sin tabla", () => {
    expect(ejerciciosDelDia(null)).toEqual([]);
    expect(ejerciciosDelDia("Descanso total")).toEqual([]);
  });

  it("resume series y repeticiones", () => {
    expect(
      resumenSeriesReps({ nombre: "x", series: "4", reps: "6-8", intensidad: null, descanso: null })
    ).toBe("4 × 6-8");
  });
});
