import { describe, expect, it } from "vitest";

import { extraerDias, extraerSecciones, partesDia, slugTitulo } from "./markdown-secciones";

const RUTINA = `# Tu rutina FitBoch

## 1. **Resumen ejecutivo**
Texto.

## 2. Cronograma de fases
| Fase | Semanas |
|---|---|

## 3. Rutina semanal

#### **Día 1 (Lunes): Torso A**
| Ejercicio | Series |
|---|---|

#### **Día 2 (Martes): Descanso activo**

#### **Día 3 (Miércoles): Pierna**

\`\`\`
## Esto no es un encabezado
\`\`\`

## 4. Progresión semanal
`;

describe("slugTitulo", () => {
  it("quita tildes y símbolos", () => {
    expect(slugTitulo("Día 1 (Lunes): Torso A")).toBe("dia-1-lunes-torso-a");
    expect(slugTitulo("💪 Progresión")).toBe("progresion");
  });
});

describe("extraerSecciones", () => {
  it("usa el nivel que se repite y quita la numeración del título", () => {
    expect(extraerSecciones(RUTINA)).toEqual([
      { id: "1-resumen-ejecutivo", titulo: "Resumen ejecutivo" },
      { id: "2-cronograma-de-fases", titulo: "Cronograma de fases" },
      { id: "3-rutina-semanal", titulo: "Rutina semanal" },
      { id: "4-progresion-semanal", titulo: "Progresión semanal" },
    ]);
  });

  it("devuelve vacío si no hay encabezados suficientes", () => {
    expect(extraerSecciones("Solo texto\n\n**negrita**")).toEqual([]);
  });
});

describe("extraerDias", () => {
  it("detecta días, letra de la semana y descanso", () => {
    expect(extraerDias(RUTINA)).toEqual([
      { id: "dia-1-lunes-torso-a", numero: 1, diaSemana: "Lunes", letra: "L", descanso: false },
      {
        id: "dia-2-martes-descanso-activo",
        numero: 2,
        diaSemana: "Martes",
        letra: "M",
        descanso: true,
      },
      { id: "dia-3-miercoles-pierna", numero: 3, diaSemana: "Miércoles", letra: "X", descanso: false },
    ]);
  });

  it("separa las partes de un día", () => {
    expect(partesDia("Día 6 & 7: Descanso")).toEqual({ numero: 6, diaSemana: null, titulo: "Descanso" });
    expect(partesDia("Resumen")).toBeNull();
    expect(partesDia("Dia 4: Push")).toEqual({ numero: 4, diaSemana: null, titulo: "Push" });
  });
});
