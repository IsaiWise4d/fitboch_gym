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
import { iconoDeGrupo } from "@/components/shared/iconos";
import { Button } from "@/components/ui/button";
import {
  CATEGORIAS_EJERCICIO,
  etiquetaCatalogo,
  GRUPOS_MUSCULARES,
  NIVELES,
  nombreDuplicado,
  type ItemBiblioteca,
} from "@/lib/admin/biblioteca";
import { cn } from "@/lib/utils";
import { esVideoDirecto, getYouTubeId, mediaParaMiniatura, mediasEjercicio, tieneVideo } from "@/lib/utils/media";
import type { Ejercicio } from "@/types/app";

interface FormEjercicio {
  nombre: string;
  descripcion: string;
  instrucciones: string;
  grupo_muscular: string;
  categoria: string;
  nivel: string;
  imagen_url: string;
  video_url: string;
}

const FORM_VACIO: FormEjercicio = {
  nombre: "",
  descripcion: "",
  instrucciones: "",
  grupo_muscular: "pecho",
  categoria: "fuerza",
  nivel: "todos",
  imagen_url: "",
  video_url: "",
};

const ETIQUETA_NIVEL_TARJETA: Record<string, string | undefined> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function formDe(e: Ejercicio): FormEjercicio {
  return {
    nombre: e.nombre,
    descripcion: e.descripcion ?? "",
    instrucciones: e.instrucciones,
    grupo_muscular: e.grupo_muscular,
    categoria: e.categoria,
    nivel: e.nivel,
    imagen_url: e.imagen_url ?? "",
    video_url: e.video_url ?? "",
  };
}

function opciones(valores: readonly string[], actual: string) {
  const lista = valores.includes(actual) || !actual ? [...valores] : [...valores, actual];
  return lista.map((v) => ({ valor: v, etiqueta: etiquetaCatalogo(v) }));
}

export function GestionEjercicios({
  ejercicios,
  uso,
}: {
  ejercicios: Ejercicio[];
  /** Registros por ejercicio en los últimos 30 días. */
  uso: Record<string, number>;
}) {
  const [modo, setModo] = useState<ModoEditor | null>(null);
  const [form, setForm] = useState<FormEjercicio>(FORM_VACIO);
  const [inicial, setInicial] = useState<FormEjercicio>(FORM_VACIO);
  const [exito, setExito] = useState<string | null>(null);
  const { guardando, error, setError, guardar } = useGuardarBiblioteca("/api/admin/ejercicios");

  const items = useMemo<ItemBiblioteca[]>(
    () =>
      ejercicios.map((e) => {
        const medias = mediasEjercicio(e);
        return {
          id: e.id,
          nombre: e.nombre,
          categoria: e.grupo_muscular,
          etiquetas: [etiquetaCatalogo(e.grupo_muscular), etiquetaCatalogo(e.categoria)],
          nivel: e.nivel,
          activo: e.activo,
          media: mediaParaMiniatura(medias),
          conVideo: tieneVideo(medias),
          uso: uso[e.id] ?? 0,
        };
      }),
    [ejercicios, uso]
  );

  const grupos = useMemo(() => {
    const extra = [...new Set(ejercicios.map((e) => e.grupo_muscular.toLowerCase()))].filter(
      (g) => !(GRUPOS_MUSCULARES as readonly string[]).includes(g)
    );
    return [...GRUPOS_MUSCULARES, ...extra];
  }, [ejercicios]);

  function abrir(nuevoModo: ModoEditor) {
    const base =
      nuevoModo.tipo === "crear"
        ? FORM_VACIO
        : (() => {
            const e = ejercicios.find((x) => x.id === nuevoModo.id);
            if (!e) return FORM_VACIO;
            const f = formDe(e);
            return nuevoModo.tipo === "duplicar" ? { ...f, nombre: `${f.nombre} (copia)` } : f;
          })();
    setForm(base);
    // Al duplicar, el formulario ya trae datos nuevos: cuenta como cambio.
    setInicial(nuevoModo.tipo === "duplicar" ? FORM_VACIO : base);
    setExito(null);
    setError(null);
    setModo(nuevoModo);
  }

  function cambiar<K extends keyof FormEjercicio>(campo: K, valor: FormEjercicio[K]) {
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
      // Conserva grupo, categoría y nivel para cargar varios seguidos.
      const siguiente = { ...FORM_VACIO, grupo_muscular: form.grupo_muscular, categoria: form.categoria, nivel: form.nivel };
      setExito(`«${form.nombre.trim()}» creado. Sigue con el próximo.`);
      setForm(siguiente);
      setInicial(siguiente);
      setModo({ tipo: "crear" });
    } else {
      setModo(null);
    }
  }

  const medias = mediasEjercicio({ imagen_url: form.imagen_url || null, video_url: form.video_url || null });
  const idPropio = modo?.tipo === "editar" ? modo.id : undefined;
  const duplicado = nombreDuplicado(ejercicios, form.nombre, idPropio);
  const videoLimpio = form.video_url.trim();
  const youtubeId = videoLimpio ? getYouTubeId(videoLimpio) : null;
  const avisoVideo =
    videoLimpio && !youtubeId && !esVideoDirecto(videoLimpio)
      ? "No parece un enlace de YouTube ni un video directo; se mostrará incrustado tal cual."
      : null;
  const visiblesTotal = ejercicios.filter((e) => e.activo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Ejercicios"
        descripcion={`${ejercicios.length} ejercicios · ${visiblesTotal} visibles para los usuarios. Haz clic en uno para editarlo.`}
        acciones={
          <Button onClick={() => abrir({ tipo: "crear" })}>
            <Plus aria-hidden="true" />
            Nuevo ejercicio
          </Button>
        }
      />

      <VistaBiblioteca
        items={items}
        categorias={grupos}
        textos={{ singular: "ejercicio", plural: "ejercicios", nuevo: "Nuevo ejercicio", categoria: "Grupo muscular" }}
        endpoint="/api/admin/ejercicios"
        iconoDe={(i) => iconoDeGrupo(i.categoria)}
        conUso
        onNuevo={() => abrir({ tipo: "crear" })}
        onEditar={(id) => abrir({ tipo: "editar", id })}
        onDuplicar={(id) => abrir({ tipo: "duplicar", id })}
      />

      <EditorBiblioteca
        abierto={modo !== null}
        titulo={modo?.tipo === "editar" ? "Editar ejercicio" : modo?.tipo === "duplicar" ? "Duplicar ejercicio" : "Nuevo ejercicio"}
        descripcion={
          modo?.tipo === "editar"
            ? "Los cambios se ven de inmediato en la biblioteca de los usuarios."
            : "Completa los datos; la vista previa muestra cómo lo verán los usuarios."
        }
        sucio={JSON.stringify(form) !== JSON.stringify(inicial)}
        guardando={guardando}
        error={error}
        exito={exito}
        textoGuardar={modo?.tipo === "editar" ? "Guardar cambios" : "Crear ejercicio"}
        conCrearOtro={modo?.tipo !== "editar"}
        onGuardar={(otro) => void onGuardar(otro)}
        onCerrar={() => setModo(null)}
        formulario={
          <>
            <Campo
              etiqueta="Nombre"
              htmlFor="ej-nombre"
              obligatorio
              aviso={duplicado ? "Ya existe un ejercicio con este nombre." : undefined}
            >
              <input
                id="ej-nombre"
                value={form.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
                placeholder="Press de banca con barra"
                maxLength={120}
                autoComplete="off"
                autoFocus
                className={cn(CLASE_ENTRADA, "h-10")}
              />
            </Campo>

            <Campo etiqueta="Grupo muscular" obligatorio>
              <SelectorChips
                etiqueta="Grupo muscular"
                opciones={opciones(grupos, form.grupo_muscular)}
                valor={form.grupo_muscular}
                onCambio={(v) => cambiar("grupo_muscular", v)}
              />
            </Campo>

            <div className="grid gap-5 md:grid-cols-2">
              <Campo etiqueta="Categoría" obligatorio>
                <SelectorChips
                  etiqueta="Categoría"
                  opciones={opciones(CATEGORIAS_EJERCICIO, form.categoria)}
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

            <Campo etiqueta="Descripción" htmlFor="ej-desc" ayuda="Una línea que resuma el ejercicio (opcional).">
              <input
                id="ej-desc"
                value={form.descripcion}
                onChange={(e) => cambiar("descripcion", e.target.value)}
                placeholder="Empuje horizontal para pecho, hombro anterior y tríceps"
                maxLength={300}
                className={cn(CLASE_ENTRADA, "h-10")}
              />
            </Campo>

            <AreaInstrucciones
              id="ej-instrucciones"
              valor={form.instrucciones}
              onCambio={(v) => cambiar("instrucciones", v)}
              placeholder={"Acuéstate en el banco con los pies apoyados\nBaja la barra controlada hasta el pecho\nEmpuja hasta extender los brazos"}
            />

            <MediaUploader
              carpeta="ejercicios"
              etiqueta="Demostración (imagen, GIF o video corto)"
              permitirEnlace
              url={form.imagen_url}
              tipo={form.imagen_url && esVideoDirecto(form.imagen_url) ? "video" : form.imagen_url ? "imagen" : null}
              onChange={(m) => cambiar("imagen_url", m?.url ?? "")}
            />

            <Campo
              etiqueta="Video explicativo"
              htmlFor="ej-video"
              aviso={avisoVideo}
              ayuda={youtubeId ? "Video de YouTube detectado." : "Enlace de YouTube (opcional)."}
            >
              <div className="flex items-center gap-3">
                <input
                  id="ej-video"
                  type="url"
                  value={form.video_url}
                  onChange={(e) => cambiar("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className={cn(CLASE_ENTRADA, "h-10 min-w-0 flex-1")}
                />
                {youtubeId && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura externa de YouTube
                  <img
                    src={`https://i.ytimg.com/vi/${youtubeId}/default.jpg`}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-md object-cover"
                  />
                )}
              </div>
            </Campo>
          </>
        }
        vistaPrevia={
          <VistaPrevia
            nombre={form.nombre}
            subtitulo={etiquetaCatalogo(form.grupo_muscular)}
            insignia={ETIQUETA_NIVEL_TARJETA[form.nivel]}
            media={mediaParaMiniatura(medias)}
            conVideo={tieneVideo(medias)}
            icono={iconoDeGrupo(form.grupo_muscular)}
            instrucciones={form.instrucciones}
            descripcion={form.descripcion}
          />
        }
      />
    </div>
  );
}
