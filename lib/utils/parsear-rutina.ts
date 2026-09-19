/**
 * Extrae las tablas de ejercicios organizadas por día desde el texto markdown de la rutina.
 *
 * Soporta múltiples formatos de encabezado:
 *   #### **DÍA 1: Torso A (Lunes)**
 *   ### Día 1: Push
 *   **Día 1: TORSO A**
 *   **Día 6 & 7: Descanso**
 *   ## 🔥 Día 1 (Lunes): PECHO + HOMBRO (la IA a veces antepone emojis)
 *
 * Incluye días de descanso (tablaMd = null) para mostrar los 7 días de la semana.
 */

export interface DiaSemana {
  /** Número del día (1-7) */
  numero: number;
  /** Título completo, ej: "Día 1: Torso A (Lunes)" */
  titulo: string;
  /** Nombre corto, ej: "Torso A" */
  grupo: string;
  /** La tabla markdown. null = día de descanso */
  tablaMd: string | null;
  /** true si es día de descanso */
  esDescanso: boolean;
}

// Captura: grupo 1 = primer número, grupo 2 = segundo número (si "6 & 7"), grupo 3 = descripción
// Ignora el nombre del día en la semana si la IA lo incluye (ej: " (Lunes)") antes del separador (: o -).
// Tolera prefijos no alfanuméricos entre el marcador markdown y "Día" (emojis 🔥⚡🛑, bullets, **).
const REGEX_DIA =
  /^\s*(?:#{1,4}\s*)?(?:\*\*)?\s*[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü]*d[ií]a\s+(\d+)(?:\s*[&yY,]\s*(\d+))?[^:\-—–]*[:\-—–]\s*(.+?)(?:\*\*\s*)?\s*$/i;

// Solo marca descanso si NO hay tabla o el título lo dice explícitamente.
// "cardio"/"liss"/"hiit" ya no marcan descanso por sí solos: un Full Body + Cardio HIIT
// con tabla es entrenamiento, no descanso (antes el viernes de esos planes salía como Descanso).
const DESCANSO_EXPLICITO = /descanso|recuperaci[oó]n|\boff\b|\brest\b/i;

/**
 * Parsea el texto completo de la rutina y devuelve los 7 días de la semana.
 */
export function parsearDiasRutina(textoRutina: string): DiaSemana[] {
  if (!textoRutina) return [];

  const lineas = textoRutina.split("\n");
  const diasRaw: { numeros: number[]; titulo: string; grupo: string; lineas: string[] }[] = [];
  let diaActual: { numeros: number[]; titulo: string; grupo: string; lineas: string[] } | null = null;

  for (const linea of lineas) {
    const matchDia = linea.match(REGEX_DIA);
    if (matchDia) {
      if (diaActual) diasRaw.push(diaActual);

      const num1 = parseInt(matchDia[1], 10);
      const num2 = matchDia[2] ? parseInt(matchDia[2], 10) : null;
      const numeros = num2 ? Array.from({ length: num2 - num1 + 1 }, (_, i) => num1 + i) : [num1];
      const descripcion = matchDia[3].replace(/\*+$/g, "").trim();

      diaActual = {
        numeros,
        titulo: descripcion,
        grupo: extraerGrupo(descripcion),
        lineas: [],
      };
      continue;
    }

    if (diaActual) {
      diaActual.lineas.push(linea);
    }
  }

  if (diaActual) diasRaw.push(diaActual);

  // Expandir días múltiples (ej: "6 & 7") y determinar si es descanso
  const dias: DiaSemana[] = [];
  for (const raw of diasRaw) {
    const tabla = extraerTabla(raw.lineas);
    const esDescanso = !tabla || DESCANSO_EXPLICITO.test(raw.titulo);

    for (const num of raw.numeros) {
      dias.push({
        numero: num,
        titulo: `Día ${num}: ${raw.titulo}`,
        grupo: esDescanso ? "Descanso" : raw.grupo,
        tablaMd: tabla,
        esDescanso,
      });
    }
  }

  // Asegurar que siempre haya 7 días
  if (dias.length > 0 && dias.length < 7) {
    const numerosExistentes = new Set(dias.map((d) => d.numero));
    for (let n = 1; n <= 7; n++) {
      if (!numerosExistentes.has(n)) {
        dias.push({
          numero: n,
          titulo: `Día ${n}: Descanso`,
          grupo: "Descanso",
          tablaMd: null,
          esDescanso: true,
        });
      }
    }
    dias.sort((a, b) => a.numero - b.numero);
  }

  return dias;
}

/**
 * De un bloque de líneas, extrae la primera tabla markdown completa.
 */
function extraerTabla(lineas: string[]): string | null {
  const filas: string[] = [];
  let dentroTabla = false;

  for (const linea of lineas) {
    const esFila = linea.trimStart().startsWith("|");
    if (esFila) {
      dentroTabla = true;
      filas.push(linea);
    } else if (dentroTabla) {
      // Ya terminó la tabla
      break;
    }
  }

  return filas.length >= 3 ? filas.join("\n") : null; // mínimo: header + separador + 1 fila
}

/**
 * Extrae el grupo muscular corto de la descripción del día.
 * Ej: "Push (Pecho, Hombros, Tríceps)" → "Push"
 * Ej: "Tren Superior" → "Tren Superior"
 * Ej: "Piernas y Glúteos" → "Piernas y Glúteos"
 */
function extraerGrupo(descripcion: string): string {
  // Si tiene paréntesis, tomar lo que está antes
  const idx = descripcion.indexOf("(");
  if (idx > 0) {
    return descripcion.substring(0, idx).trim();
  }
  // Si tiene guión/raya, tomar lo que está antes
  const idxGuion = descripcion.search(/[\-—–]/);
  if (idxGuion > 0) {
    return descripcion.substring(0, idxGuion).trim();
  }
  return descripcion;
}

/**
 * Retorna el índice (0-based) del día que corresponde a hoy.
 * Lunes → 0, Martes → 1, ... Domingo → 6
 */
export function indiceHoy(totalDias: number): number {
  const hoy = new Date().getDay(); // 0=domingo, 1=lunes...6=sábado
  const idx = hoy === 0 ? 6 : hoy - 1; // Lunes=0 ... Domingo=6
  return Math.min(idx, totalDias - 1);
}
