import { NextResponse } from "next/server";
import { pickPhrase, pickRandomPhraseWithIndex } from "@/lib/server/motivation";

export function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const seed = url.searchParams.get("seed") ?? undefined;
    const mode = url.searchParams.get("mode");
    if (mode === "random") {
      // optional exclude index to avoid repeat across quick reloads if provided
      const exclude = url.searchParams.get("exclude")
        ? Number(url.searchParams.get("exclude"))
        : undefined;
      const picked = pickRandomPhraseWithIndex(exclude);
      return NextResponse.json({ frase: picked.frase, index: picked.index });
    }

    const frase = pickPhrase(seed);
    return NextResponse.json({ frase });
  } catch (e) {
    console.error("Error en /api/frase:", e);
    return NextResponse.json(
      { frase: "La disciplina diaria construye resultados permanentes." },
      { status: 500 }
    );
  }
}
