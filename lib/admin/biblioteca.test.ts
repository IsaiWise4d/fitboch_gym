import { describe, expect, it } from "vitest";

import {
  etiquetaCatalogo,
  filtrarBiblioteca,
  nombreDuplicado,
  resumirBiblioteca,
  validarCalentamiento,
  validarEjercicio,
  type ItemBiblioteca,
} from "./biblioteca";

function item(id: string, nombre: string, extra: Partial<ItemBiblioteca> = {}): ItemBiblioteca {
  return {
    id,
    nombre,
    categoria: "pecho",
    etiquetas: ["Pecho", "Fuerza"],
    nivel: "todos",
    activo: true,
    media: null,
    conVideo: false,
    uso: 0,
    ...extra,
  };
}

const items = [
  item("1", "Press banca", { uso: 40, media: { tipo: "imagen", url: "https://x/a.png", miniatura: null, youtubeId: null } }),
  item("2", "Sentadilla", { categoria: "piernas", etiquetas: ["Piernas"], uso: 90 }),
  item("3", "Aperturas", { activo: false }),
  item("4", "Curl de bíceps", { categoria: "bíceps", etiquetas: ["Bíceps"], uso: 5 }),
];

describe("filtrarBiblioteca", () => {
  const base = { q: "", categoria: "todas", estado: "todos" as const, orden: "nombre" as const };

  it("ordena por nombre y filtra por categoría sin tildes", () => {
    expect(filtrarBiblioteca(items, base).map((i) => i.id)).toEqual(["3", "4", "1", "2"]);
    expect(filtrarBiblioteca(items, { ...base, categoria: "biceps" }).map((i) => i.id)).toEqual(["4"]);
  });

  it("filtra por estado y busca en nombre o etiquetas", () => {
    expect(filtrarBiblioteca(items, { ...base, estado: "ocultos" }).map((i) => i.id)).toEqual(["3"]);
    expect(filtrarBiblioteca(items, { ...base, estado: "sin_media" })).toHaveLength(3);
    expect(filtrarBiblioteca(items, { ...base, q: "piern" }).map((i) => i.id)).toEqual(["2"]);
  });

  it("ordena por uso descendente", () => {
    expect(filtrarBiblioteca(items, { ...base, orden: "uso" }).map((i) => i.id)).toEqual(["2", "1", "4", "3"]);
  });
});

describe("resumirBiblioteca / nombreDuplicado / etiquetas", () => {
  it("cuenta visibles, ocultos, sin media y sin uso", () => {
    const r = resumirBiblioteca(items);
    expect(r).toMatchObject({ total: 4, visibles: 3, ocultos: 1, sinMedia: 3, sinUso: 0 });
    expect(r.porCategoria.pecho).toBe(2);
  });

  it("detecta nombres repetidos ignorando el propio", () => {
    expect(nombreDuplicado(items, "  press BANCA ")).toBe(true);
    expect(nombreDuplicado(items, "Press banca", "1")).toBe(false);
  });

  it("etiqueta valores del catálogo", () => {
    expect(etiquetaCatalogo("tren_superior")).toBe("Tren superior");
    expect(etiquetaCatalogo("bíceps")).toBe("Bíceps");
  });
});

describe("validarEjercicio", () => {
  const valido = {
    nombre: " Press banca ",
    instrucciones: "Baja la barra",
    grupo_muscular: "Pecho",
    categoria: "fuerza",
    nivel: "",
    imagen_url: "",
    video_url: "https://youtu.be/abcdefghijk",
  };

  it("normaliza y completa valores por defecto", () => {
    const r = validarEjercicio(valido, false);
    expect(r).toEqual({
      ok: true,
      datos: {
        nombre: "Press banca",
        instrucciones: "Baja la barra",
        descripcion: null,
        nivel: "todos",
        grupo_muscular: "pecho",
        categoria: "fuerza",
        imagen_url: null,
        video_url: "https://youtu.be/abcdefghijk",
      },
    });
  });

  it("rechaza faltantes, niveles y URLs inválidas", () => {
    expect(validarEjercicio({ ...valido, nombre: "" }, false).ok).toBe(false);
    expect(validarEjercicio({ ...valido, nivel: "experto" }, false).ok).toBe(false);
    expect(validarEjercicio({ ...valido, imagen_url: "javascript:alert(1)" }, false).ok).toBe(false);
  });

  it("en parcial solo toma los campos presentes e ignora los desconocidos", () => {
    expect(validarEjercicio({ id: "x", activo: false, rol: "admin" }, true)).toEqual({
      ok: true,
      datos: { activo: false },
    });
  });
});

describe("validarCalentamiento", () => {
  it("exige categoría válida y deriva el tipo de media", () => {
    expect(validarCalentamiento({ nombre: "A", instrucciones: "B", categoria: "otra" }, false).ok).toBe(false);
    const r = validarCalentamiento(
      { nombre: "A", instrucciones: "B", categoria: "tren_inferior", media_url: "https://b/v.mp4", media_tipo: "video" },
      false
    );
    expect(r.ok && r.datos).toMatchObject({ media_url: "https://b/v.mp4", media_tipo: "video", nivel: "todos" });
    const sinMedia = validarCalentamiento({ media_url: "" }, true);
    expect(sinMedia.ok && sinMedia.datos).toEqual({ media_url: null, media_tipo: null });
  });
});
