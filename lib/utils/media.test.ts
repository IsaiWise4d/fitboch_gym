import { describe, expect, it } from "vitest";

import {
  mediaParaMiniatura,
  mediasCalentamiento,
  mediasEjercicio,
  tieneVideo,
} from "./media";
import { separarPasos } from "./instrucciones";

describe("mediasEjercicio", () => {
  it("pone la demostración primero y genera miniatura de YouTube", () => {
    const medias = mediasEjercicio({
      imagen_url: "https://blob.test/press.gif",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(medias.map((m) => m.tipo)).toEqual(["imagen", "youtube"]);
    expect(medias[1].miniatura).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(tieneVideo(medias)).toBe(true);
  });

  it("detecta un video subido en el campo de imagen", () => {
    const medias = mediasEjercicio({ imagen_url: "https://blob.test/a.mp4?x=1", video_url: null });
    expect(medias[0].tipo).toBe("video");
  });

  it("usa la miniatura de YouTube si no hay imagen y descarta iframes", () => {
    expect(
      mediaParaMiniatura(mediasEjercicio({ imagen_url: null, video_url: "https://youtu.be/dQw4w9WgXcQ" }))
        ?.tipo
    ).toBe("youtube");
    expect(
      mediaParaMiniatura(mediasEjercicio({ imagen_url: "", video_url: "https://vimeo.com/123" }))
    ).toBeNull();
  });
});

describe("mediasCalentamiento", () => {
  it("prioriza la media subida y elimina duplicados", () => {
    const medias = mediasCalentamiento({
      media_url: "https://blob.test/c.webm",
      media_tipo: "video",
      imagen_url: "https://blob.test/c.webm",
      video_url: null,
    });
    expect(medias).toHaveLength(1);
    expect(medias[0].tipo).toBe("video");
  });
});

describe("separarPasos", () => {
  it("separa un párrafo en oraciones", () => {
    expect(
      separarPasos(
        "Acuéstate en el banco plano, agarra el peso. Baja controladamente hasta el pecho y empuja hacia arriba."
      )
    ).toEqual([
      "Acuéstate en el banco plano, agarra el peso.",
      "Baja controladamente hasta el pecho y empuja hacia arriba.",
    ]);
  });

  it("no corta decimales ni abreviaturas", () => {
    expect(separarPasos("Usa 1.5 kg por lado. Sube aprox. diez veces.")).toEqual([
      "Usa 1.5 kg por lado.",
      "Sube aprox. diez veces.",
    ]);
  });

  it("usa cada línea como paso y quita la numeración", () => {
    expect(separarPasos("1. Párate derecho\n2) Gira los brazos\n- Respira")).toEqual([
      "Párate derecho",
      "Gira los brazos",
      "Respira",
    ]);
  });

  it("devuelve vacío sin texto", () => {
    expect(separarPasos("")).toEqual([]);
    expect(separarPasos(null)).toEqual([]);
  });
});
