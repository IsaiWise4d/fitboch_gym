"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Ejercicio } from "@/types/app";
import { EjercicioCard } from "./EjercicioCard";

const GRUPOS_MUSCULARES = [
  "Todos",
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Glúteos",
  "Core",
  "Cardio",
];

interface EjerciciosListProps {
  ejercicios: Ejercicio[];
}

export function EjerciciosList({ ejercicios }: EjerciciosListProps) {
  const [busqueda, setBusqueda] = useState("");
  const [grupoActivo, setGrupoActivo] = useState("Todos");

  const filtrados = ejercicios.filter((ej) => {
    const matchBusqueda = ej.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const matchGrupo =
      grupoActivo === "Todos" ||
      ej.grupo_muscular.toLowerCase() === grupoActivo.toLowerCase();
    return matchBusqueda && matchGrupo;
  });

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ejercicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros por grupo muscular */}
      <div className="flex flex-wrap justify-center gap-2">
        {GRUPOS_MUSCULARES.map((grupo) => (
          <button
            key={grupo}
            onClick={() => setGrupoActivo(grupo)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              grupoActivo === grupo
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            {grupo}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {ejercicios.length === 0
              ? "Aún no hay ejercicios registrados."
              : "No se encontraron ejercicios con esos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((ej) => (
            <EjercicioCard key={ej.id} ejercicio={ej} />
          ))}
        </div>
      )}
    </div>
  );
}
