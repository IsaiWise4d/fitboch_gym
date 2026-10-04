// Bibliotecas del admin (ejercicios y calentamientos): catálogos, filtros
// de la vista y validación de lo que llega a las rutas /api/admin/*.
// PURO (ver biblioteca.test.ts); imports relativos para vitest.

import type { MediaResuelta } from "../utils/media";
import { normalizarTexto } from "../utils/texto";

export const NIVELES = ["todos", "principiante", "intermedio", "avanzado"] as const;
export type Nivel = (typeof NIVELES)[number];

export const GRUPOS_MUSCULARES = [
  "pecho",
  "espalda",
  "piernas",
  "hombros",
  "bíceps",
  "tríceps",
  "glúteos",
  "core",
  "cardio",
] as const;

export const CATEGORIAS_EJERCICIO = ["fuerza", "cardio", "flexibilidad", "funcional"] as const;
export const CATEGORIAS_CALENTAMIENTO = ["tren_superior", "tren_inferior"] as const;
export type CategoriaCalentamiento = (typeof CATEGORIAS_CALENTAMIENTO)[number];

const ETIQUETAS: Record<string, string> = {
  tren_superior: "Tren superior",
  tren_inferior: "Tren inferior",
  todos: "Todos los niveles",
};

/** "bíceps" → "Bíceps", "tren_superior" → "Tren superior". */
export function etiquetaCatalogo(valor: string): string {
  if (ETIQUETAS[valor]) return ETIQUETAS[valor];
  const texto = valor.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ---------------------------------------------------------------------------
// Vista
// ---------------------------------------------------------------------------

/** Elemento de biblioteca ya resuelto para la vista (JSON plano). */
export interface ItemBiblioteca {
  id: string;
  nombre: string;
  /** Clave del filtro principal (grupo muscular o categoría). */
  categoria: string;
  etiquetas: string[];
  nivel: string;
  activo: boolean;
  media: MediaResuelta | null;
  conVideo: boolean;
  /** Registros en los últimos 30 días (solo ejercicios). */
  uso: number | null;
}

export type FiltroEstadoBiblioteca = "todos" | "visibles" | "ocultos" | "sin_media";
export const FILTROS_ESTADO_BIBLIOTECA: FiltroEstadoBiblioteca[] = ["todos", "visibles", "ocultos", "sin_media"];

export type OrdenBiblioteca = "nombre" | "uso";

export interface FiltrosBiblioteca {
  q: string;
  categoria: string;
  estado: FiltroEstadoBiblioteca;
  orden: OrdenBiblioteca;
}

export function parsearFiltroEstadoBiblioteca(valor: string | null | undefined): FiltroEstadoBiblioteca {
  return FILTROS_ESTADO_BIBLIOTECA.includes(valor as FiltroEstadoBiblioteca)
    ? (valor as FiltroEstadoBiblioteca)
    : "todos";
}

function cumpleEstado(item: ItemBiblioteca, estado: FiltroEstadoBiblioteca): boolean {
  if (estado === "visibles") return item.activo;
  if (estado === "ocultos") return !item.activo;
  if (estado === "sin_media") return item.media === null;
  return true;
}

export function filtrarBiblioteca(
  items: readonly ItemBiblioteca[],
  { q, categoria, estado, orden }: FiltrosBiblioteca
): ItemBiblioteca[] {
  const consulta = normalizarTexto(q.trim());
  return items
    .filter(
      (i) =>
        (categoria === "todas" || normalizarTexto(i.categoria) === normalizarTexto(categoria)) &&
        cumpleEstado(i, estado) &&
        (!consulta ||
          normalizarTexto(i.nombre).includes(consulta) ||
          i.etiquetas.some((e) => normalizarTexto(e).includes(consulta)))
    )
    .sort((a, b) =>
      orden === "uso"
        ? (b.uso ?? 0) - (a.uso ?? 0) || a.nombre.localeCompare(b.nombre, "es")
        : a.nombre.localeCompare(b.nombre, "es")
    );
}

/** Conteos para la franja de indicadores y los filtros. */
export function resumirBiblioteca(items: readonly ItemBiblioteca[]) {
  const porCategoria: Record<string, number> = {};
  let visibles = 0;
  let sinMedia = 0;
  let sinUso = 0;
  for (const i of items) {
    const clave = normalizarTexto(i.categoria);
    porCategoria[clave] = (porCategoria[clave] ?? 0) + 1;
    if (i.activo) visibles += 1;
    if (!i.media) sinMedia += 1;
    if (i.activo && i.uso === 0) sinUso += 1;
  }
  return { total: items.length, visibles, ocultos: items.length - visibles, sinMedia, sinUso, porCategoria };
}

/** true si ya existe otro elemento con el mismo nombre (sin tildes ni mayúsculas). */
export function nombreDuplicado(items: readonly { id: string; nombre: string }[], nombre: string, idPropio?: string) {
  const buscado = normalizarTexto(nombre.trim());
  if (!buscado) return false;
  return items.some((i) => i.id !== idPropio && normalizarTexto(i.nombre.trim()) === buscado);
}

// ---------------------------------------------------------------------------
// Validación de payloads (rutas API)
// ---------------------------------------------------------------------------

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

const MAX_NOMBRE = 120;
const MAX_DESCRIPCION = 300;
const MAX_INSTRUCCIONES = 4000;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function textoOpcional(valor: unknown): string | null {
  return texto(valor) || null;
}

export function esUrlValida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function urlOpcional(valor: unknown, campo: string): Resultado<string | null> {
  const limpia = texto(valor);
  if (!limpia) return { ok: true, datos: null };
  if (!esUrlValida(limpia)) return { ok: false, error: `${campo}: la URL no es válida` };
  return { ok: true, datos: limpia };
}

function validarComunes(
  body: Record<string, unknown>,
  parcial: boolean
): Resultado<Record<string, unknown>> {
  const datos: Record<string, unknown> = {};

  if (!parcial || "nombre" in body) {
    const nombre = texto(body.nombre);
    if (!nombre) return { ok: false, error: "El nombre es obligatorio" };
    if (nombre.length > MAX_NOMBRE) return { ok: false, error: `El nombre admite máximo ${MAX_NOMBRE} caracteres` };
    datos.nombre = nombre;
  }
  if (!parcial || "instrucciones" in body) {
    const instrucciones = texto(body.instrucciones);
    if (!instrucciones) return { ok: false, error: "Las instrucciones son obligatorias" };
    if (instrucciones.length > MAX_INSTRUCCIONES)
      return { ok: false, error: `Las instrucciones admiten máximo ${MAX_INSTRUCCIONES} caracteres` };
    datos.instrucciones = instrucciones;
  }
  if (!parcial || "descripcion" in body) {
    const descripcion = textoOpcional(body.descripcion);
    if (descripcion && descripcion.length > MAX_DESCRIPCION)
      return { ok: false, error: `La descripción admite máximo ${MAX_DESCRIPCION} caracteres` };
    datos.descripcion = descripcion;
  }
  if (!parcial || "nivel" in body) {
    const nivel = texto(body.nivel) || "todos";
    if (!NIVELES.includes(nivel as Nivel)) return { ok: false, error: "Nivel no válido" };
    datos.nivel = nivel;
  }
  if ("activo" in body) {
    if (typeof body.activo !== "boolean") return { ok: false, error: "Valor de visibilidad no válido" };
    datos.activo = body.activo;
  }
  return { ok: true, datos };
}

/**
 * Ejercicio para insertar (parcial = false) o actualizar (parcial = true:
 * solo los campos presentes). Ignora cualquier campo fuera de la lista.
 */
export function validarEjercicio(body: unknown, parcial: boolean): Resultado<Record<string, unknown>> {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };
  const entrada = body as Record<string, unknown>;
  const comunes = validarComunes(entrada, parcial);
  if (!comunes.ok) return comunes;
  const datos = comunes.datos;

  if (!parcial || "grupo_muscular" in entrada) {
    const grupo = texto(entrada.grupo_muscular).toLowerCase();
    if (!grupo) return { ok: false, error: "El grupo muscular es obligatorio" };
    datos.grupo_muscular = grupo;
  }
  if (!parcial || "categoria" in entrada) {
    const categoria = texto(entrada.categoria).toLowerCase();
    if (!categoria) return { ok: false, error: "La categoría es obligatoria" };
    datos.categoria = categoria;
  }
  for (const [campo, nombre] of [
    ["imagen_url", "Demostración"],
    ["video_url", "Video"],
  ] as const) {
    if (!parcial || campo in entrada) {
      const url = urlOpcional(entrada[campo], nombre);
      if (!url.ok) return url;
      datos[campo] = url.datos;
    }
  }
  return { ok: true, datos };
}

export function validarCalentamiento(body: unknown, parcial: boolean): Resultado<Record<string, unknown>> {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };
  const entrada = body as Record<string, unknown>;
  const comunes = validarComunes(entrada, parcial);
  if (!comunes.ok) return comunes;
  const datos = comunes.datos;

  if (!parcial || "categoria" in entrada) {
    const categoria = texto(entrada.categoria);
    if (!CATEGORIAS_CALENTAMIENTO.includes(categoria as CategoriaCalentamiento))
      return { ok: false, error: "La categoría debe ser tren superior o tren inferior" };
    datos.categoria = categoria;
  }
  if (!parcial || "media_url" in entrada) {
    const url = urlOpcional(entrada.media_url, "Imagen o video");
    if (!url.ok) return url;
    datos.media_url = url.datos;
    datos.media_tipo = url.datos ? (entrada.media_tipo === "video" ? "video" : "imagen") : null;
  }
  return { ok: true, datos };
}
