"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaPreview } from "@/components/calentamientos/MediaPreview";
import type { Calentamiento } from "@/types/app";

const CATEGORIAS = ["tren_superior", "tren_inferior"] as const;
const NIVELES = ["todos", "principiante", "intermedio", "avanzado"] as const;
type Categoria = (typeof CATEGORIAS)[number];
type Nivel = (typeof NIVELES)[number];

type FormData = {
  id?: string;
  nombre: string;
  descripcion: string;
  instrucciones: string;
  categoria: Categoria;
  nivel: Nivel;
  media_url: string;
  media_tipo: "imagen" | "video" | null;
};

const emptyForm: FormData = {
  nombre: "",
  descripcion: "",
  instrucciones: "",
  categoria: "tren_superior",
  nivel: "todos",
  media_url: "",
  media_tipo: null,
};

function labelCategoria(categoria: string) {
  return categoria === "tren_superior" ? "Tren superior" : "Tren inferior";
}

function mediaDe(calentamiento: Calentamiento): { url: string; tipo: "imagen" | "video" | null } | null {
  if (calentamiento.media_url) return { url: calentamiento.media_url, tipo: calentamiento.media_tipo };
  if (calentamiento.imagen_url) return { url: calentamiento.imagen_url, tipo: "imagen" };
  return null;
}

export function GestionCalentamientos({ calentamientos }: { calentamientos: Calentamiento[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showForm]);

  const filtrados = calentamientos.filter((calentamiento) => {
    const term = busqueda.toLowerCase();
    const matchBusqueda = !term || calentamiento.nombre.toLowerCase().includes(term) || calentamiento.categoria.includes(term);
    const matchCategoria = categoriaActiva === "Todos" || calentamiento.categoria === categoriaActiva;
    return matchBusqueda && matchCategoria;
  });

  function handleNuevo() {
    setForm(emptyForm);
    setEditando(false);
    setError(null);
    setShowForm(true);
  }

  function handleEditar(calentamiento: Calentamiento) {
    setForm({
      id: calentamiento.id,
      nombre: calentamiento.nombre,
      descripcion: calentamiento.descripcion ?? "",
      instrucciones: calentamiento.instrucciones,
      categoria: calentamiento.categoria,
      nivel: calentamiento.nivel,
      media_url: calentamiento.media_url ?? "",
      media_tipo: calentamiento.media_tipo,
    });
    setEditando(true);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.nombre.trim() || !form.instrucciones.trim()) {
      setError("Nombre e instrucciones son obligatorios");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/calentamientos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(calentamiento: Calentamiento) {
    setTogglingId(calentamiento.id);
    try {
      const response = await fetch("/api/admin/calentamientos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: calentamiento.id, activo: !calentamiento.activo }),
      });
      if (!response.ok) setError("No se pudo cambiar la disponibilidad");
      else router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar calentamiento..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} className="pl-10" />
        </div>
        <Button size="sm" onClick={handleNuevo}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {["Todos", ...CATEGORIAS].map((categoria) => (
          <button
            key={categoria}
            onClick={() => setCategoriaActiva(categoria)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${categoriaActiva === categoria ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:bg-surface-hover"}`}
          >
            {categoria === "Todos" ? categoria : labelCategoria(categoria)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg space-y-4 rounded-xl border border-border bg-[#1A1A1A] p-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></button>
              <p className="flex-1 text-base font-semibold">{editando ? "Editar calentamiento" : "Nuevo calentamiento"}</p>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Movilidad de hombros" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="Breve descripción" /></div>
            <div className="space-y-2"><Label>Instrucciones *</Label><textarea value={form.instrucciones} onChange={(event) => setForm({ ...form, instrucciones: event.target.value })} placeholder="Cómo realizar el calentamiento..." className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Categoría *</Label><select value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value as Categoria })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="tren_superior">Tren superior</option><option value="tren_inferior">Tren inferior</option></select></div>
              <div className="space-y-2"><Label>Nivel</Label><select value={form.nivel} onChange={(event) => setForm({ ...form, nivel: event.target.value as Nivel })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">{NIVELES.map((nivel) => <option key={nivel} value={nivel}>{nivel.charAt(0).toUpperCase() + nivel.slice(1)}</option>)}</select></div>
            </div>
            <MediaUploader
              url={form.media_url}
              tipo={form.media_tipo}
              onChange={(media) =>
                setForm({ ...form, media_url: media?.url ?? "", media_tipo: media?.tipo ?? null })
              }
            />
            {error && <div className="rounded-md bg-error/10 p-2 text-sm text-error">{error}</div>}
            <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={loading}>Cancelar</Button><Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editando ? "Guardar cambios" : "Crear calentamiento"}</Button></div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtrados.length} calentamiento{filtrados.length !== 1 ? "s" : ""}</p>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtrados.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">No hay calentamientos</p> : filtrados.map((calentamiento) => {
          const media = mediaDe(calentamiento);
          return (
            <div key={calentamiento.id} className="flex items-center justify-between p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {media && (
                  <MediaPreview url={media.url} tipo={media.tipo} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0"><p className={`truncate text-sm font-medium ${!calentamiento.activo ? "text-muted-foreground line-through" : ""}`}>{calentamiento.nombre}</p><p className="text-xs capitalize text-muted-foreground">{labelCategoria(calentamiento.categoria)} · {calentamiento.nivel}</p></div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-1"><button onClick={() => toggleActivo(calentamiento)} disabled={togglingId === calentamiento.id} className="rounded-md p-2 text-muted-foreground hover:bg-white/10" title={calentamiento.activo ? "Desactivar" : "Activar"}>{togglingId === calentamiento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : calentamiento.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button onClick={() => handleEditar(calentamiento)} className="rounded-md p-2 text-muted-foreground hover:bg-white/10"><Pencil className="h-4 w-4" /></button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
