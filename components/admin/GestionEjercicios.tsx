"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Pencil,
  Search,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import type { Ejercicio } from "@/types/app";

const GRUPOS = [
  "pecho",
  "espalda",
  "piernas",
  "hombros",
  "bíceps",
  "tríceps",
  "glúteos",
  "core",
  "cardio",
];

const FILTRO_GRUPOS = ["Todos", ...GRUPOS.map((g) => g.charAt(0).toUpperCase() + g.slice(1))];

const CATEGORIAS = ["fuerza", "cardio", "flexibilidad", "funcional"];
const NIVELES = ["todos", "principiante", "intermedio", "avanzado"] as const;

type FormData = {
  id?: string;
  nombre: string;
  descripcion: string;
  instrucciones: string;
  grupo_muscular: string;
  categoria: string;
  nivel: string;
  imagen_url: string;
  video_url: string;
};

const emptyForm: FormData = {
  nombre: "",
  descripcion: "",
  instrucciones: "",
  grupo_muscular: "pecho",
  categoria: "fuerza",
  nivel: "todos",
  imagen_url: "",
  video_url: "",
};

export function GestionEjercicios({
  ejercicios,
}: {
  ejercicios: Ejercicio[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [grupoActivo, setGrupoActivo] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showForm]);

  const filtrados = ejercicios.filter((e) => {
    const matchBusqueda = !busqueda.trim() ||
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.grupo_muscular.toLowerCase().includes(busqueda.toLowerCase());
    const matchGrupo =
      grupoActivo === "Todos" ||
      e.grupo_muscular.toLowerCase() === grupoActivo.toLowerCase();
    return matchBusqueda && matchGrupo;
  });

  function handleNuevo() {
    setForm(emptyForm);
    setEditando(false);
    setShowForm(true);
    setError(null);
  }

  function handleEditar(ej: Ejercicio) {
    setForm({
      id: ej.id,
      nombre: ej.nombre,
      descripcion: ej.descripcion || "",
      instrucciones: ej.instrucciones,
      grupo_muscular: ej.grupo_muscular,
      categoria: ej.categoria,
      nivel: ej.nivel,
      imagen_url: ej.imagen_url || "",
      video_url: ej.video_url || "",
    });
    setEditando(true);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit() {
    if (!form.nombre || !form.instrucciones || !form.grupo_muscular || !form.categoria) {
      setError("Nombre, instrucciones, grupo muscular y categoría son obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ejercicios", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
      } else {
        setShowForm(false);
        setForm(emptyForm);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(ej: Ejercicio) {
    setTogglingId(ej.id);
    try {
      await fetch("/api/admin/ejercicios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ej.id, activo: !ej.activo }),
      });
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button size="sm" onClick={handleNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Filtros por grupo muscular */}
      <div className="flex flex-wrap justify-center gap-2">
        {FILTRO_GRUPOS.map((grupo) => (
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

      {/* Modal de crear/editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-[#1A1A1A] p-5 space-y-4 my-8">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="text-base font-semibold flex-1">
                {editando ? "Editar ejercicio" : "Nuevo ejercicio"}
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Press de banca"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Breve descripción del ejercicio"
              />
            </div>

            <div className="space-y-2">
              <Label>Instrucciones *</Label>
              <textarea
                value={form.instrucciones}
                onChange={(e) =>
                  setForm({ ...form, instrucciones: e.target.value })
                }
                placeholder="Cómo realizar el ejercicio correctamente..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Grupo muscular *</Label>
                <select
                  value={form.grupo_muscular}
                  onChange={(e) =>
                    setForm({ ...form, grupo_muscular: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {GRUPOS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <select
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nivel</Label>
              <select
                value={form.nivel}
                onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {NIVELES.map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>URL imagen</Label>
                <Input
                  value={form.imagen_url}
                  onChange={(e) =>
                    setForm({ ...form, imagen_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL video</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) =>
                    setForm({ ...form, video_url: e.target.value })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-error/10 p-2 text-sm text-error">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editando ? "Guardar cambios" : "Crear ejercicio"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contador */}
      <p className="text-xs text-muted-foreground">
        {filtrados.length} ejercicio{filtrados.length !== 1 ? "s" : ""}
      </p>

      {/* Lista */}
      <div className="rounded-lg border border-border bg-surface divide-y divide-border">
        {filtrados.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No hay ejercicios
          </p>
        ) : (
          filtrados.map((ej) => (
            <div
              key={ej.id}
              className="flex items-center justify-between p-4"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    !ej.activo ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {ej.nombre}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ej.grupo_muscular} · {ej.categoria} · {ej.nivel}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  onClick={() => toggleActivo(ej)}
                  disabled={togglingId === ej.id}
                  className="rounded-md p-2 text-muted-foreground hover:bg-white/10 transition-colors"
                  title={ej.activo ? "Desactivar" : "Activar"}
                >
                  {togglingId === ej.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : ej.activo ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEditar(ej)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
