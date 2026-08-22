"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Calentamiento } from "@/types/app";
import { CalentamientoCard } from "./CalentamientoCard";

const CATEGORIAS = [
  { value: "Todos", label: "Todos" },
  { value: "tren_superior", label: "Tren superior" },
  { value: "tren_inferior", label: "Tren inferior" },
];

export function CalentamientosList({ calentamientos }: { calentamientos: Calentamiento[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const filtrados = calentamientos.filter((calentamiento) => {
    const matchBusqueda = calentamiento.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaActiva === "Todos" || calentamiento.categoria === categoriaActiva;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar calentamiento..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIAS.map((categoria) => (
          <button
            key={categoria.value}
            onClick={() => setCategoriaActiva(categoria.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaActiva === categoria.value
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            {categoria.label}
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {calentamientos.length === 0
              ? "Aún no hay calentamientos registrados."
              : "No se encontraron calentamientos con esos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((calentamiento) => (
            <CalentamientoCard key={calentamiento.id} calentamiento={calentamiento} />
          ))}
        </div>
      )}
    </div>
  );
}
