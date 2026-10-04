"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  AreaInstrucciones,
  Campo,
  CLASE_ENTRADA,
  EditorBiblioteca,
  SelectorChips,
  VistaPrevia,
} from "@/components/admin/biblioteca/EditorBiblioteca";
import { useGuardarBiblioteca, type ModoEditor } from "@/components/admin/biblioteca/useGuardarBiblioteca";
import { VistaBiblioteca } from "@/components/admin/biblioteca/VistaBiblioteca";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { iconoDeCategoriaCalentamiento } from "@/components/shared/iconos";
import { Button } from "@/components/ui/button";
import {
  CATEGORIAS_CALENTAMIENTO,
  etiquetaCatalogo,
  NIVELES,
  nombreDuplicado,
  type CategoriaCalentamiento,
  type ItemBiblioteca,
} from "@/lib/admin/biblioteca";
import { cn } from "@/lib/utils";
import { mediaParaMiniatura, mediasCalentamiento, tieneVideo } from "@/lib/utils/media";
import type { Calentamiento } from "@/types/app";

interface FormCalentamiento {
  nombre: string;
  descripcion: string;
  instrucciones: string;
  categoria: CategoriaCalentamiento;
  nivel: string;
  media_url: string;
  media_tipo: "imagen" | "video" | null;
}

const FORM_VACIO: FormCalentamiento = {
  nombre: "",
  descripcion: "",
  instrucciones: "",
  categoria: "tren_superior",
  nivel: "todos",
  media_url: "",
  media_tipo: null,
};

function formDe(c: Calentamiento): FormCalentamiento {
  return {
    nombre: c.nombre,
    descripcion: c.descripcion ?? "",
    instrucciones: c.instrucciones,
    categoria: c.categoria,
    nivel: c.nivel,
    media_url: c.media_url ?? "",
    media_tipo: c.media_tipo,
  };
}

export function GestionCalentamientos({ calentamientos }: { calentamientos: Calentamiento[] }) {
  const [modo, setModo] = useState<ModoEditor | null>(null);
  const [form, setForm] = useState<FormCalentamiento>(FORM_VACIO);
  const [inicial, setInicial] = useState<FormCalentamiento>(FORM_VACIO);
  const [exito, setExito] = useState<string | null>(null);
  const { guardando, error, setError, guardar } = useGuardarBiblioteca("/api/admin/calentamientos");

  const items = useMemo<ItemBiblioteca[]>(
    () =>
      calentamientos.map((c) => {
        const medias = mediasCalentamiento(c);
        return {
          id: c.id,
          nombre: c.nombre,
          categoria: c.categoria,
          etiquetas: [etiquetaCatalogo(c.categoria), etiquetaCatalogo(c.nivel)],
          nivel: c.nivel,
          activo: c.activo,
          media: mediaParaMiniatura(medias),
          conVideo: tieneVideo(medias),
          uso: null,
        };
      }),
    [calentamientos]
  );

  // Elemento en edición: sus URLs antiguas (imagen_url/video_url) siguen
  // mostrándose al usuario mientras no se suba una media nueva.
  const original = modo && modo.tipo !== "crear" ? calentamientos.find((c) => c.id === modo.id) : undefined;

  function abrir(nuevoModo: ModoEditor) {
    const c = nuevoModo.tipo === "crear" ? undefined : calentamientos.find((x) => x.id === nuevoModo.id);
    const base = c ? formDe(c) : FORM_VACIO;
    const conNombre = nuevoModo.tipo === "duplicar" ? { ...base, nombre: `${base.nombre} (copia)` } : base;
    setForm(conNombre);
    setInicial(nuevoModo.tipo === "duplicar" ? FORM_VACIO : conNombre);
    setExito(null);
    setError(null);
    setModo(nuevoModo);
  }

  function cambiar<K extends keyof FormCalentamiento>(campo: K, valor: FormCalentamiento[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setExito(null);
  }

  async function onGuardar(crearOtro: boolean) {
    if (!modo) return;
    if (!form.nombre.trim() || !form.instrucciones.trim()) {
      setError("El nombre y las instrucciones son obligatorios.");
      return;
    }
    const id = modo.tipo === "editar" ? modo.id : undefined;
    const ok = await guardar({ ...form }, id);
    if (!ok) return;
    if (crearOtro) {
      const siguiente = { ...FORM_VACIO, categoria: form.categoria, nivel: form.nivel };
      setExito(`«${form.nombre.trim()}» creado. Sigue con el próximo.`);
      setForm(siguiente);
      setInicial(siguiente);
      setModo({ tipo: "crear" });
    } else {
      setModo(null);
    }
  }

  const medias = mediasCalentamiento({
    media_url: form.media_url || null,
    media_tipo: form.media_tipo,
    imagen_url: modo?.tipo === "editar" ? original?.imagen_url ?? null : null,
    video_url: modo?.tipo === "editar" ? original?.video_url ?? null : null,
  });
  const idPropio = modo?.tipo === "editar" ? modo.id : undefined;
  const duplicado = nombreDuplicado(calentamientos, form.nombre, idPropio);
  const visiblesTotal = calentamientos.filter((c) => c.activo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Calentamientos"
        descripcion={`${calentamientos.length} calentamientos · ${visiblesTotal} visibles para los usuarios. Haz clic en uno para editarlo.`}
        acciones={
          <Button onClick={() => abrir({ tipo: "crear" })}>
            <Plus aria-hidden="true" />
            Nuevo calentamiento
          </Button>
        }
      />

      <VistaBiblioteca
        items={items}
        categorias={[...CATEGORIAS_CALENTAMIENTO]}
        textos={{
          singular: "calentamiento",
          plural: "calentamientos",
          nuevo: "Nuevo calentamiento",
          categoria: "Zona del cuerpo",
        }}
        endpoint="/api/admin/calentamientos"
        iconoDe={(i) => iconoDeCategoriaCalentamiento(i.categoria)}
        onNuevo={() => abrir({ tipo: "crear" })}
        onEditar={(id) => abrir({ tipo: "editar", id })}
        onDuplicar={(id) => abrir({ tipo: "duplicar", id })}
      />

      <EditorBiblioteca
        abierto={modo !== null}
        titulo={
          modo?.tipo === "editar"
            ? "Editar calentamiento"
            : modo?.tipo === "duplicar"
              ? "Duplicar calentamiento"
              : "Nuevo calentamiento"
        }
        descripcion={
          modo?.tipo === "editar"
            ? "Los cambios se ven de inmediato en la sección de calentamientos de los usuarios."
            : "Completa los datos; la vista previa muestra cómo lo verán los usuarios."
        }
        sucio={JSON.stringify(form) !== JSON.stringify(inicial)}
        guardando={guardando}
        error={error}
        exito={exito}
        textoGuardar={modo?.tipo === "editar" ? "Guardar cambios" : "Crear calentamiento"}
        conCrearOtro={modo?.tipo !== "editar"}
        onGuardar={(otro) => void onGuardar(otro)}
        onCerrar={() => setModo(null)}
        formulario={
          <>
            <Campo
              etiqueta="Nombre"
              htmlFor="cal-nombre"
              obligatorio
              aviso={duplicado ? "Ya existe un calentamiento con este nombre." : undefined}
            >
              <input
                id="cal-nombre"
                value={form.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
                placeholder="Movilidad de hombros"
                maxLength={120}
                autoComplete="off"
                autoFocus
                className={cn(CLASE_ENTRADA, "h-10")}
              />
            </Campo>

            <div className="grid gap-5 md:grid-cols-2">
              <Campo etiqueta="Zona del cuerpo" obligatorio>
                <SelectorChips
                  etiqueta="Zona del cuerpo"
                  opciones={CATEGORIAS_CALENTAMIENTO.map((c) => ({ valor: c, etiqueta: etiquetaCatalogo(c) }))}
                  valor={form.categoria}
                  onCambio={(v) => cambiar("categoria", v)}
                />
              </Campo>
              <Campo etiqueta="Nivel">
                <SelectorChips
                  etiqueta="Nivel"
                  opciones={NIVELES.map((n) => ({ valor: n, etiqueta: n === "todos" ? "Todos" : etiquetaCatalogo(n) }))}
                  valor={form.nivel}
                  onCambio={(v) => cambiar("nivel", v)}
                />
              </Campo>
            </div>

            <Campo etiqueta="Descripción" htmlFor="cal-desc" ayuda="Una línea que resuma el calentamiento (opcional).">
              <input
                id="cal-desc"
                value={form.descripcion}
                onChange={(e) => cambiar("descripcion", e.target.value)}
                placeholder="Activa el manguito rotador antes de empujar"
                maxLength={300}
                className={cn(CLASE_ENTRADA, "h-10")}
              />
            </Campo>

            <AreaInstrucciones
              id="cal-instrucciones"
              valor={form.instrucciones}
              onCambio={(v) => cambiar("instrucciones", v)}
              placeholder={"Brazos extendidos a los lados\nHaz círculos pequeños durante 20 segundos\nCambia de sentido"}
            />

            <MediaUploader
              carpeta="calentamientos"
              etiqueta="Imagen o video (se reproduce en bucle)"
              permitirEnlace
              url={form.media_url}
              tipo={form.media_tipo}
              onChange={(m) => {
                setForm((f) => ({ ...f, media_url: m?.url ?? "", media_tipo: m?.tipo ?? null }));
                setExito(null);
              }}
            />
          </>
        }
        vistaPrevia={
          <VistaPrevia
            nombre={form.nombre}
            subtitulo={etiquetaCatalogo(form.categoria)}
            media={mediaParaMiniatura(medias)}
            conVideo={tieneVideo(medias)}
            icono={iconoDeCategoriaCalentamiento(form.categoria)}
            instrucciones={form.instrucciones}
            descripcion={form.descripcion}
          />
        }
      />
    </div>
  );
}
