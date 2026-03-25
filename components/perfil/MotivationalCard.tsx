"use client";

import { useEffect, useState } from "react";

interface MotivationalCardProps {
  nombre?: string | null;
}

export function MotivationalCard({ nombre }: MotivationalCardProps) {
  const firstName = nombre ? String(nombre).split(" ")[0] : null;
  const [frase, setFrase] = useState<string>(
    "La disciplina diaria construye resultados permanentes."
  );

  useEffect(() => {
    const seed = nombre ?? undefined;
    const qs = seed ? `?seed=${encodeURIComponent(String(seed))}` : "";
    fetch(`/api/frase${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.frase) setFrase(String(data.frase));
      })
      .catch((e) => {
        console.error("No se pudo obtener frase:", e);
      });
  }, [nombre]);

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-surface p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">🔥</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {firstName ? `¡Hola ${firstName}!` : "¡Hola!"}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug">{frase}</p>
        </div>
      </div>
    </div>
  );
}
