import fs from "fs";
import path from "path";
import crypto from "crypto";

export function pickPhrase(seed?: string | null): string {
  const frasesPath = path.join(process.cwd(), "frases.txt");
  let frase = "¡Bienvenido! Mantén la constancia y verás resultados.";

  try {
    const raw = fs.readFileSync(frasesPath, "utf8");
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\d+:\s*/, "").trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const key = seed ?? "default";
      const hash = crypto.createHash("sha256").update(String(key)).digest("hex");
      const idx = parseInt(hash.slice(0, 8), 16) % lines.length;
      frase = lines[idx];
    }
  } catch (e) {
    console.error("No se pudo leer frases.txt:", e);
  }

  return frase;
}

export function pickRandomPhrase(): string {
  const frasesPath = path.join(process.cwd(), "frases.txt");
  let frase = "¡Bienvenido! Mantén la constancia y verás resultados.";

  try {
    const raw = fs.readFileSync(frasesPath, "utf8");
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\d+:\s*/, "").trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const rnd = parseInt(crypto.randomBytes(4).toString("hex"), 16) % lines.length;
      frase = lines[rnd];
    }
  } catch (e) {
    console.error("No se pudo leer frases.txt:", e);
  }

  return frase;
}

export function pickRandomPhraseWithIndex(excludeIndex?: number): { frase: string; index: number } {
  const frasesPath = path.join(process.cwd(), "frases.txt");
  let frase = "¡Bienvenido! Mantén la constancia y verás resultados.";
  let chosen = 0;

  try {
    const raw = fs.readFileSync(frasesPath, "utf8");
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\d+:\s*/, "").trim())
      .filter(Boolean);

    const len = lines.length;
    if (len > 0) {
      if (len === 1) {
        chosen = 0;
        frase = lines[0];
      } else {
        // pick a random index not equal to excludeIndex
        let idx = excludeIndex ?? -1;
        // if excludeIndex is out of range, ignore it
        if (idx < 0 || idx >= len) idx = -1;
        // loop until we pick a different index
        do {
          const rnd = parseInt(crypto.randomBytes(4).toString("hex"), 16);
          idx = rnd % len;
        } while (idx === excludeIndex && len > 1);
        chosen = idx;
        frase = lines[chosen];
      }
    }
  } catch (e) {
    console.error("No se pudo leer frases.txt:", e);
  }

  return { frase, index: chosen };
}
