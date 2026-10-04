// Extrae (de forma PURA) las secciones y los días del Markdown que genera la
// IA para la rutina y el plan nutricional, para el índice y los accesos
// rápidos de las vistas en el teléfono. El renderizador (RutinaMarkdown)
// usa `slugTitulo` sobre el texto plano de cada encabezado, así que los ids
// coinciden con los que se calculan aquí.

export interface SeccionMarkdown {
  id: string;
  /** Título corto para el chip del índice (sin numeración). */
  titulo: string;
}

export interface DiaMarkdown {
  id: string;
  numero: number;
  /** "Lunes", "Martes"… si viene en el encabezado. */
  diaSemana: string | null;
  /** "L", "M", "X"… (o el número si no hay día de la semana). */
  letra: string;
  descanso: boolean;
}

const ENCABEZADO = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
// "Día 1 (Lunes): Torso A" y rangos como "Día 6 & 7: Descanso".
const DIA = /^d[ií]a\s*(\d+)(?:\s*(?:&|y|-|–|a)\s*\d+)?\s*(?:\(([^)]+)\))?\s*[:\-–]?\s*(.*)$/i;
const NUMERACION = /^\s*(?:\d+\s*[.)|:\-–]\s*|\d+\s+\|\s*)/;

export function slugTitulo(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "seccion"
  );
}

/** Texto plano de un encabezado Markdown (sin **, _, `, ni enlaces). */
export function textoPlanoMarkdown(texto: string): string {
  return texto
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "1. Resumen ejecutivo" → "Resumen ejecutivo". */
export function sinNumeracion(titulo: string): string {
  const limpio = titulo.replace(NUMERACION, "").trim();
  return limpio || titulo;
}

export interface PartesDia {
  numero: number;
  diaSemana: string | null;
  titulo: string;
}

/** Separa "Día 1 (Lunes): Torso A" en sus partes; null si no es un día. */
export function partesDia(textoPlano: string): PartesDia | null {
  const match = textoPlano.match(DIA);
  if (!match) return null;
  return {
    numero: Number(match[1]),
    diaSemana: match[2]?.trim() || null,
    titulo: match[3]?.trim() || "",
  };
}

function encabezados(markdown: string): { nivel: number; texto: string }[] {
  const resultado: { nivel: number; texto: string }[] = [];
  let enBloqueCodigo = false;
  for (const linea of markdown.split(/\r?\n/)) {
    if (linea.trim().startsWith("```")) {
      enBloqueCodigo = !enBloqueCodigo;
      continue;
    }
    if (enBloqueCodigo) continue;
    const match = linea.match(ENCABEZADO);
    if (match) resultado.push({ nivel: match[1].length, texto: textoPlanoMarkdown(match[2]) });
  }
  return resultado;
}

/**
 * Secciones principales para el índice: el nivel de encabezado más alto
 * (#, ## o ###) que se repite al menos dos veces, sin contar los días.
 */
export function extraerSecciones(markdown: string): SeccionMarkdown[] {
  const candidatos = encabezados(markdown).filter((e) => e.nivel <= 3 && !partesDia(e.texto));
  for (const nivel of [1, 2, 3]) {
    const delNivel = candidatos.filter((e) => e.nivel === nivel);
    if (delNivel.length >= 2) {
      const vistos = new Set<string>();
      return delNivel
        .map((e) => ({ id: slugTitulo(e.texto), titulo: sinNumeracion(e.texto) }))
        .filter((s) => (vistos.has(s.id) ? false : (vistos.add(s.id), true)));
    }
  }
  return [];
}

const LETRA_DIA: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miercoles: "X",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
};

/** Días de la rutina ("Día 1 (Lunes): …") en orden, para accesos rápidos. */
export function extraerDias(markdown: string): DiaMarkdown[] {
  const dias: DiaMarkdown[] = [];
  const vistos = new Set<number>();
  for (const e of encabezados(markdown)) {
    const partes = partesDia(e.texto);
    if (!partes || vistos.has(partes.numero)) continue;
    vistos.add(partes.numero);
    const clave = partes.diaSemana
      ?.normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
    dias.push({
      id: slugTitulo(e.texto),
      numero: partes.numero,
      diaSemana: partes.diaSemana,
      letra: (clave && LETRA_DIA[clave]) || String(partes.numero),
      descanso: /descanso/i.test(partes.titulo),
    });
  }
  return dias;
}
