"use client";

import { useEffect, useState } from "react";

interface InicioFraseProps {
  initialFrase?: string;
  seed?: string | null;
}

export function InicioFrase({ initialFrase, seed }: InicioFraseProps) {
  const [frase, setFrase] = useState<string>(
    initialFrase || "La disciplina diaria construye resultados permanentes."
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const prev = localStorage.getItem("fitboch_frase_index");
        const params = new URLSearchParams();
        params.set("mode", "random");
        if (seed) params.set("seed", String(seed));
        if (prev !== null) params.set("exclude", prev);

        const res = await fetch(`/api/frase?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (data?.frase) setFrase(String(data.frase));
        if (typeof data?.index === "number") {
          localStorage.setItem("fitboch_frase_index", String(data.index));
        }
      } catch (e) {
        console.error("Error fetching frase:", e);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [seed]);

  return (
    <div>
      <p
        key={frase}
        aria-live="polite"
        className="mt-1.5 text-sm leading-snug text-foreground/70 animate-fade-in"
      >
        {frase}
      </p>
    </div>
  );
}
