import { describe, expect, it } from "vitest";

import { parsearDiasRutina } from "./parsear-rutina";

const TABLA = [
  "| Ejercicio | Series | Reps |",
  "|-----------|--------|------|",
  "| Press banca | 3 | 10 |",
].join("\n");

describe("parsearDiasRutina", () => {
  it("parsea headers con emojis entre ## y Día (caso Jose Ruiz)", () => {
    const texto = [
      "# PLAN 12 SEMANAS",
      "## 🔥 Día 1 (Lunes): PECHO + HOMBRO + TRÍCEPS",
      TABLA,
      "## ⚡ Día 2 (Martes): BÍCEPS + ESPALDA",
      TABLA,
      "## 🛑 Día 7 (Domingo): DESCANSO TOTAL",
      "- caminar suave",
    ].join("\n");

    const dias = parsearDiasRutina(texto);
    // 2 días con tabla + resto rellenado hasta 7
    expect(dias.length).toBe(7);
    expect(dias[0].numero).toBe(1);
    expect(dias[0].esDescanso).toBe(false);
    expect(dias[0].tablaMd).toContain("Press banca");
  });

  it("no marca como descanso un viernes Full Body + Cardio HIIT con tabla (caso Belkis)", () => {
    const texto = [
      "### **Día 5 (Viernes): Full Body Metabólico + Cardio HIIT**",
      TABLA,
      "### **Día 6 (Sábado): Descanso Activo / Cardio LISS**",
      "- caminata 45 min",
    ].join("\n");

    const dias = parsearDiasRutina(texto);
    const dia5 = dias.find((d) => d.numero === 5);
    const dia6 = dias.find((d) => d.numero === 6);

    expect(dia5).toBeDefined();
    expect(dia5!.esDescanso).toBe(false);
    expect(dia5!.tablaMd).toContain("Press banca");

    expect(dia6).toBeDefined();
    expect(dia6!.esDescanso).toBe(true);
  });

  it("sigue soportando Día 6 & 7 combinados y no matchea prosa", () => {
    const texto = [
      "**Día 6 & 7: Descanso**",
      "- dormir bien",
      "- **Cuándo**: Día 6 (sábado) y opcionalmente Día 7 (domingo)",
    ].join("\n");

    const dias = parsearDiasRutina(texto);
    const numeros = dias.map((d) => d.numero).sort((a, b) => a - b);
    expect(numeros).toContain(6);
    expect(numeros).toContain(7);
    // La línea de prosa "- **Cuándo**: Día 6..." no debe crear días extra
    expect(dias.filter((d) => d.numero === 6).length).toBe(1);
  });
});
