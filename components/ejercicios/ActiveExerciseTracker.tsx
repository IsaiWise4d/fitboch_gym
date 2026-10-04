"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Flame,
  History,
  Loader2,
  Minus,
  Plus,
  Save,
  Search,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MiniaturaMedia } from "@/components/shared/MiniaturaMedia";
import { iconoDeGrupo } from "@/components/shared/iconos";
import { mediaParaMiniatura, mediasEjercicio } from "@/lib/utils/media";
import { etiquetaGrupo } from "@/lib/utils/grupos-musculares";
import { textoHaceCuanto } from "@/lib/utils/fecha";
import { cn } from "@/lib/utils";
import type { Ejercicio } from "@/types/app";
import type { EstadoRacha } from "@/lib/racha/types";
import { SelectorEjercicio } from "./SelectorEjercicio";

interface Serie {
  peso: number;
  reps: number;
  /** Solo de interfaz: la serie se marcó como hecha. */
  hecha?: boolean;
}

interface ActiveWorkoutState {
  ejercicio_id: string;
  tiempo_descanso: number;
  series: Serie[];
}

interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

interface SerieAnterior {
  serie_numero: number;
  peso_kg: number;
  repeticiones: number;
}

interface SesionAnterior {
  fecha: string;
  series: SerieAnterior[];
}

const INITIAL_STATE: ActiveWorkoutState = {
  ejercicio_id: "",
  tiempo_descanso: 1.5,
  series: [{ peso: 0, reps: 0 }],
};

const DESCANSO_MIN = 0;
const DESCANSO_MAX = 10;
const PASO_DESCANSO = 0.5;

/** 1.5 → "1:30". */
function formatoDescanso(minutos: number): string {
  const total = Math.round(minutos * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function ActiveExerciseTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ActiveWorkoutState>(INITIAL_STATE);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prPesoMaximo, setPrPesoMaximo] = useState<number | null>(null);
  const [ultimaSesion, setUltimaSesion] = useState<SesionAnterior | null>(null);
  const [isPrLoading, setIsPrLoading] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [recientesIds, setRecientesIds] = useState<string[]>([]);

  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [mostrarDemo, setMostrarDemo] = useState(false);

  // States for Modals
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Confirmación visible tras guardar (el historial queda más abajo, fuera de vista en móvil).
  const [ultimoGuardado, setUltimoGuardado] = useState<{
    nombre: string;
    rachaActivada: boolean;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const savedState = localStorage.getItem("fitboch_active_workout");
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
        setIsOpen(true);
        // Viene de "Registrar este ejercicio" (detalle): llevarlo a la vista.
        if (window.location.hash === "#ejercicio-activo") {
          window.setTimeout(() => {
            document
              .getElementById("ejercicio-activo")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 350);
        }
      } catch (e) {
        console.error("Error loading saved workout state", e);
      }
    }

    async function loadEjercicios() {
      const { data } = await supabase.from("ejercicios").select("*").eq("activo", true).order("nombre");
      if (data) {
        setEjercicios(data);
      }
    }

    // Ejercicios usados últimamente, para la sección "Recientes" del selector.
    async function loadRecientes() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase
        .from("historial_ejercicios")
        .select("ejercicio_id")
        .eq("user_id", userData.user.id)
        .order("fecha_completado", { ascending: false })
        .limit(60);
      if (error) {
        console.error("Error cargando ejercicios recientes:", error);
        return;
      }
      const unicos = [...new Set((data ?? []).map((fila) => fila.ejercicio_id))];
      setRecientesIds(unicos.slice(0, 6));
    }

    loadEjercicios();
    void loadRecientes();
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("fitboch_active_workout", JSON.stringify(state));
    } else {
      localStorage.removeItem("fitboch_active_workout");
    }
  }, [state, isOpen]);

  const addSerie = () => {
    // La serie nueva hereda el peso de la anterior: lo habitual es repetir carga.
    setState((s) => ({
      ...s,
      series: [...s.series, { peso: s.series[s.series.length - 1]?.peso ?? 0, reps: 0 }],
    }));
  };

  const updateSerie = (index: number, cambios: Partial<Serie>) => {
    setState((s) => {
      const newSeries = [...s.series];
      newSeries[index] = { ...newSeries[index], ...cambios };
      return { ...s, series: newSeries };
    });
  };

  const removeSerie = (index: number) => {
    setState((s) => {
      const newSeries = s.series.filter((_, i) => i !== index);
      return { ...s, series: newSeries };
    });
  };

  // Marcar una serie como hecha (solo visual: ayuda a llevar la cuenta).
  const toggleHecha = (index: number) => {
    const serie = state.series[index];
    if (!serie || serie.reps <= 0) return;
    updateSerie(index, { hecha: !serie.hecha });
  };

  const cambiarDescanso = (delta: number) => {
    setState((s) => ({
      ...s,
      tiempo_descanso: Math.min(
        DESCANSO_MAX,
        Math.max(DESCANSO_MIN, Math.round((s.tiempo_descanso + delta) * 2) / 2)
      ),
    }));
  };

  const formatPeso = (peso: number) => {
    if (Number.isInteger(peso)) return String(peso);
    return peso.toFixed(1).replace(/\.0$/, "");
  };

  // Mejor marca (PR) + última sesión de este ejercicio, para guiar las series.
  const loadPrEjercicio = useCallback(async (ejercicioId: string) => {
    setIsPrLoading(true);
    setPrError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setPrPesoMaximo(null);
        setUltimaSesion(null);
        return;
      }

      const [pr, ultima] = await Promise.all([
        supabase
          .from("series_ejercicios")
          .select("peso_kg, historial_ejercicios!inner(user_id, ejercicio_id)")
          .eq("historial_ejercicios.user_id", userData.user.id)
          .eq("historial_ejercicios.ejercicio_id", ejercicioId)
          .order("peso_kg", { ascending: false })
          .limit(1),
        supabase
          .from("historial_ejercicios")
          .select("fecha_completado, series_ejercicios(serie_numero, peso_kg, repeticiones)")
          .eq("user_id", userData.user.id)
          .eq("ejercicio_id", ejercicioId)
          .order("fecha_completado", { ascending: false })
          .limit(1),
      ]);

      if (pr.error) throw pr.error;
      setPrPesoMaximo(pr.data?.[0]?.peso_kg ?? null);

      if (ultima.error) {
        console.error("Error cargando la última sesión:", ultima.error);
        setUltimaSesion(null);
      } else {
        const fila = ultima.data?.[0] as
          | { fecha_completado: string; series_ejercicios: SerieAnterior[] | null }
          | undefined;
        setUltimaSesion(
          fila
            ? {
                fecha: fila.fecha_completado,
                series: (fila.series_ejercicios ?? [])
                  .slice()
                  .sort((a, b) => a.serie_numero - b.serie_numero),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error loading PR:", error);
      setPrError("No se pudo cargar tu PR en este momento.");
      setPrPesoMaximo(null);
    } finally {
      setIsPrLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!state.ejercicio_id) {
      setPrPesoMaximo(null);
      setUltimaSesion(null);
      setPrError(null);
      setIsPrLoading(false);
      return;
    }

    loadPrEjercicio(state.ejercicio_id);
  }, [state.ejercicio_id, loadPrEjercicio]);

  useEffect(() => {
    if (!ultimoGuardado) return;
    const timer = window.setTimeout(() => setUltimoGuardado(null), 5000);
    return () => window.clearTimeout(timer);
  }, [ultimoGuardado]);

  const executeSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setUltimoGuardado(null);
    setShowSaveConfirm(false);
    const nombreGuardado =
      ejercicios.find((e) => e.id === state.ejercicio_id)?.nombre ?? "Ejercicio";
    let rachaActivada = false;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const { data: historialData, error: historialError } = await supabase
        .from("historial_ejercicios")
        .insert({
          user_id: userData.user.id,
          ejercicio_id: state.ejercicio_id,
          tiempo_descanso_minutos: state.tiempo_descanso,
        })
        .select()
        .single();

      if (historialError) throw historialError;

      const seriesToInsert = state.series.map((s, idx) => ({
        historial_origen_id: historialData.id,
        serie_numero: idx + 1,
        peso_kg: s.peso,
        repeticiones: s.reps,
      }));

      const { error: seriesError } = await supabase
        .from("series_ejercicios")
        .insert(seriesToInsert);

      if (seriesError) {
        await supabase
          .from("historial_ejercicios")
          .delete()
          .eq("id", historialData.id);
        throw seriesError;
      }

      setState({
        ...state,
        series: [{ peso: state.series[state.series.length - 1]?.peso || 0, reps: 0 }]
      });
      setRecientesIds((ids) => [state.ejercicio_id, ...ids.filter((id) => id !== state.ejercicio_id)].slice(0, 6));

      await loadPrEjercicio(state.ejercicio_id);

      window.dispatchEvent(new Event('exercise-saved'));

      // Avisar al widget de racha para que evalúe si este registro la
      // "activó" (incrementa). El Route Handler /api/racha/activar es
      // idempotente: solo activa si es el primer ejercicio del día exigible.
      // Enviamos el historialId para que el server excluya este registro del
      // recuento de "ejercicios anteriores hoy" y no se cuente a sí mismo.
      // Si activada, despachamos 'streak-activated' (con el estado nuevo)
      // para que el widget reproduzca la animación; si no, despachamos un
      // 'exercise-saved' con detail.estado para que el widget refresque el
      // número (caso 2º ejercicio del día: no anima, pero actualiza UI).
      try {
        const res = await fetch("/api/racha/activar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historialId: historialData.id }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            activada?: boolean;
            estado?: EstadoRacha;
          };
          if (json.activada && json.estado) {
            rachaActivada = true;
            window.dispatchEvent(
              new CustomEvent("streak-activated", { detail: { estado: json.estado } })
            );
          } else if (json.estado) {
            window.dispatchEvent(
              new CustomEvent("exercise-saved", { detail: { estado: json.estado } })
            );
          }
        }
      } catch (e) {
        console.error("Error notificando racha:", e);
      }

      setUltimoGuardado({ nombre: nombreGuardado, rachaActivada });
    } catch (error) {
      console.error("Error saving exercise:", error);
      const dbError = error as SupabaseLikeError;
      const rawMessage = `${dbError?.message ?? ""} ${dbError?.details ?? ""} ${dbError?.hint ?? ""}`.toLowerCase();

      if (dbError?.code === "23514" || (rawMessage.includes("peso_kg") && rawMessage.includes("check"))) {
        setSaveError("No se pudo guardar: la base de datos tiene un límite para este campo de peso. Ajusta ese límite en Supabase si necesitas más rango.");
      } else {
        setSaveError(dbError?.message || "No se pudo guardar el ejercicio. Intenta de nuevo.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!state.ejercicio_id) return;
    if (state.series.length === 0) return;
    if (state.series.some(s => s.reps <= 0)) return;

    setShowSaveConfirm(true);
  };

  const executeFinish = () => {
    setState(INITIAL_STATE);
    setIsOpen(false);
    setShowFinishConfirm(false);
  };

  const seleccionarEjercicio = (id: string) => {
    setState((s) => ({ ...s, ejercicio_id: id }));
    setSelectorAbierto(false);
    setMostrarDemo(false);
  };

  const selectedEjercicioObj = ejercicios.find(e => e.id === state.ejercicio_id);
  const mediasSeleccionado = selectedEjercicioObj ? mediasEjercicio(selectedEjercicioObj) : [];
  const miniaturaSeleccionado = mediaParaMiniatura(mediasSeleccionado);

  const avisoGuardado = ultimoGuardado && (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {ultimoGuardado.rachaActivada ? (
        <Flame className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
      )}
      <div className="min-w-0 text-sm">
        <p className="font-medium text-success">{ultimoGuardado.nombre} guardado</p>
        <p className="text-xs text-muted-foreground">
          {ultimoGuardado.rachaActivada
            ? "¡Racha activada hoy! Sigue así."
            : "Lo verás en tus ejercicios de hoy."}
        </p>
      </div>
    </div>
  );

  const selector = (
    <SelectorEjercicio
      abierto={selectorAbierto}
      ejercicios={ejercicios}
      recientesIds={recientesIds}
      seleccionadoId={state.ejercicio_id}
      onSeleccionar={seleccionarEjercicio}
      onCerrar={() => setSelectorAbierto(false)}
    />
  );

  if (!isOpen) {
    return (
      <div id="ejercicio-activo" className="scroll-mt-16 space-y-3">
        {avisoGuardado}
        <Button
          onClick={() => {
            setIsOpen(true);
            // Lo primero es elegir el ejercicio: se abre el selector directamente.
            if (!state.ejercicio_id) setSelectorAbierto(true);
          }}
          className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/10"
        >
          <Plus className="h-5 w-5" />
          Iniciar Nuevo Ejercicio
        </Button>
        {selector}
      </div>
    );
  }

  const isFormValid = state.ejercicio_id && state.series.length > 0 && !state.series.some(s => s.reps <= 0);
  const faltanReps = Boolean(state.ejercicio_id) && state.series.some(s => s.reps <= 0);
  const columnasSerie =
    "grid grid-cols-[1.25rem_2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem_1.75rem] items-center gap-1 min-[380px]:grid-cols-[1.5rem_3.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2rem] min-[380px]:gap-1.5";

  return (
    <div id="ejercicio-activo" className="mt-6 min-w-0 scroll-mt-16 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-sm animate-in fade-in zoom-in-95 duration-200 min-[380px]:p-4">
      <ConfirmDialog
        abierto={showFinishConfirm}
        tono="peligro"
        icono={<AlertTriangle className="h-5 w-5" />}
        titulo="Cancelar Ejercicio"
        descripcion="¿Seguro que deseas cancelar? Se borrarán las series que estabas anotando."
        textoCancelar="No, seguir"
        textoConfirmar="Sí, cancelar"
        onCancelar={() => setShowFinishConfirm(false)}
        onConfirmar={executeFinish}
      />

      <ConfirmDialog
        abierto={showSaveConfirm}
        icono={<Save className="h-5 w-5" />}
        titulo="Guardar Ejercicio"
        descripcion="¿Seguro que deseas guardar este bloque de series? Recuerda que una vez guardado no se podrá editar."
        textoConfirmar="Sí, guardar"
        onCancelar={() => setShowSaveConfirm(false)}
        onConfirmar={executeSave}
      />

      {selector}

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-primary">
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
          Ejercicio Activo
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 h-10 w-10 text-muted-foreground hover:text-destructive"
          onClick={() => setShowFinishConfirm(true)}
          aria-label="Cancelar ejercicio"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {avisoGuardado}

      {/* 1. Ejercicio elegido (o botón para elegirlo) */}
      {selectedEjercicioObj ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectorAbierto(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 text-left transition-all hover:border-primary/40 active:scale-[0.99]"
          >
            <MiniaturaMedia
              media={miniaturaSeleccionado}
              alt=""
              icono={iconoDeGrupo(selectedEjercicioObj.grupo_muscular)}
              distintivo={false}
              className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-lg"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                {etiquetaGrupo(selectedEjercicioObj.grupo_muscular)}
              </span>
              <span className="mt-0.5 line-clamp-2 font-semibold leading-snug">
                {selectedEjercicioObj.nombre}
              </span>
              <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                Cambiar ejercicio
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {miniaturaSeleccionado && (
              <button
                type="button"
                onClick={() => setMostrarDemo(!mostrarDemo)}
                aria-expanded={mostrarDemo}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", mostrarDemo && "rotate-180")}
                  aria-hidden="true"
                />
                {mostrarDemo ? "Ocultar demostración" : "Ver demostración"}
              </button>
            )}
            <Link
              href={`/ejercicios/${selectedEjercicioObj.id}`}
              className="ml-auto inline-flex h-9 items-center gap-0.5 rounded-lg px-2 text-xs font-medium text-primary"
            >
              Cómo se hace
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {mostrarDemo && miniaturaSeleccionado && (
            <MiniaturaMedia
              media={miniaturaSeleccionado}
              alt={`Demostración de ${selectedEjercicioObj.nombre}`}
              icono={iconoDeGrupo(selectedEjercicioObj.grupo_muscular)}
              distintivo={false}
              ajuste="contener"
              className="h-56 w-full rounded-xl bg-white animate-in fade-in duration-300"
            />
          )}

          {/* Mejor marca y última vez */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/90">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                Mejor marca
              </p>
              {isPrLoading ? (
                <Loader2 className="mt-1.5 h-5 w-5 animate-spin text-primary" aria-label="Cargando PR" />
              ) : (
                <p className="mt-1 text-xl font-bold leading-tight text-primary">
                  {prPesoMaximo !== null && prPesoMaximo > 0 ? `${formatPeso(prPesoMaximo)} kg` : "—"}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                Última vez
              </p>
              <p className="mt-1 text-base font-semibold leading-tight">
                {ultimaSesion ? textoHaceCuanto(ultimaSesion.fecha) : "Primera vez"}
              </p>
              {ultimaSesion && (
                <p className="text-[11px] text-muted-foreground">
                  {ultimaSesion.series.length}{" "}
                  {ultimaSesion.series.length === 1 ? "serie" : "series"}
                </p>
              )}
            </div>
          </div>
          {prError && <p className="text-xs text-destructive">{prError}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSelectorAbierto(true)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">Elegir ejercicio</span>
            <span className="block text-xs text-muted-foreground">
              Busca por nombre o grupo muscular
            </span>
          </span>
        </button>
      )}

      {/* 2. Descanso entre series */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <p id="titulo-descanso" className="text-sm font-medium leading-tight">Descanso</p>
            <p className="text-[11px] text-muted-foreground">entre series</p>
          </div>
        </div>
        <div className="flex items-center gap-1" role="group" aria-labelledby="titulo-descanso">
          <button
            type="button"
            onClick={() => cambiarDescanso(-PASO_DESCANSO)}
            disabled={state.tiempo_descanso <= DESCANSO_MIN}
            aria-label="Menos descanso"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface transition-transform active:scale-90 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-16 text-center text-base font-semibold tabular-nums" aria-live="polite">
            {formatoDescanso(state.tiempo_descanso)}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">min</span>
          </span>
          <button
            type="button"
            onClick={() => cambiarDescanso(PASO_DESCANSO)}
            disabled={state.tiempo_descanso >= DESCANSO_MAX}
            aria-label="Más descanso"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface transition-transform active:scale-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Series en tabla: anterior · peso · reps · hecha */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Series</p>
          <p className="min-w-0 truncate text-[11px] text-muted-foreground">
            Marca ✓ al terminar cada serie
          </p>
        </div>

        <div className={cn(columnasSerie, "px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground")}>
          <span className="text-center">#</span>
          <span className="text-center">Anterior</span>
          <span className="text-center">Kg</span>
          <span className="text-center">Reps</span>
          <span className="text-center">Hecha</span>
          <span aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          {state.series.map((serie, idx) => {
            const anterior = ultimaSesion?.series[idx] ?? null;
            return (
              <div
                key={idx}
                className={cn(
                  columnasSerie,
                  "rounded-xl border p-1 transition-colors duration-300 animate-in fade-in slide-in-from-top-1",
                  serie.hecha ? "border-success/40 bg-success/10" : "border-border/60 bg-surface"
                )}
              >
                <span className="text-center text-sm font-bold text-muted-foreground">{idx + 1}</span>

                {anterior ? (
                  <button
                    type="button"
                    onClick={() => updateSerie(idx, { peso: anterior.peso_kg, reps: anterior.repeticiones })}
                    title="Usar los valores de la última vez"
                    aria-label={`Serie ${idx + 1}: usar ${formatPeso(anterior.peso_kg)} kg por ${anterior.repeticiones} de la última vez`}
                    className="h-10 rounded-lg text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:bg-white/5 hover:text-foreground active:bg-white/10"
                  >
                    {formatPeso(anterior.peso_kg)}×{anterior.repeticiones}
                  </button>
                ) : (
                  <span className="text-center text-xs text-muted-foreground/50">—</span>
                )}

                <input
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="next"
                  min="0"
                  max="1000"
                  step="0.5"
                  placeholder="0"
                  aria-label={`Peso de la serie ${idx + 1} en kilogramos`}
                  value={serie.peso === 0 ? "" : serie.peso}
                  onChange={(e) => updateSerie(idx, { peso: parseFloat(e.target.value) || 0 })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-0.5 text-center text-base font-semibold tabular-nums outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 min-[380px]:px-1"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="done"
                  min="1"
                  placeholder="0"
                  aria-label={`Repeticiones de la serie ${idx + 1}`}
                  value={serie.reps === 0 ? "" : serie.reps}
                  onChange={(e) => updateSerie(idx, { reps: parseInt(e.target.value) || 0 })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-0.5 text-center text-base font-semibold tabular-nums outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 min-[380px]:px-1"
                />

                <button
                  type="button"
                  onClick={() => toggleHecha(idx)}
                  disabled={serie.reps <= 0}
                  aria-pressed={Boolean(serie.hecha)}
                  aria-label={serie.hecha ? `Serie ${idx + 1} hecha` : `Marcar serie ${idx + 1} como hecha`}
                  className={cn(
                    "mx-auto inline-flex h-10 w-9 items-center justify-center rounded-lg transition-all active:scale-90 disabled:opacity-30 min-[380px]:w-10",
                    serie.hecha
                      ? "bg-success text-black"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </button>

                {state.series.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSerie(idx)}
                    aria-label={`Eliminar serie ${idx + 1}`}
                    className="inline-flex h-10 w-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="secondary"
          onClick={addSerie}
          className="w-full border border-dashed border-input text-sm hover:border-primary"
        >
          <Plus className="h-4 w-4" /> Agregar Serie
        </Button>
      </div>

      {saveError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[12px] text-destructive animate-in fade-in">
          {saveError}
        </div>
      )}

      {/* Acciones finales */}
      <div className="space-y-2 pt-1">
        <Button
          className="h-12 w-full min-w-0 rounded-xl text-base font-semibold shadow-lg shadow-primary/10"
          onClick={handleSaveClick}
          disabled={isSaving || !isFormValid}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="truncate">{isSaving ? "Guardando..." : "Guardar ejercicio"}</span>
          {!isSaving && (
            <span className="shrink-0 rounded-full bg-black/15 px-2 py-0.5 text-xs font-semibold">
              {state.series.length} {state.series.length === 1 ? "serie" : "series"}
            </span>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {!state.ejercicio_id
            ? "Elige un ejercicio para empezar."
            : faltanReps
              ? "Anota las repeticiones de cada serie para poder guardar."
              : "Guarda cuando termines todas las series de este ejercicio."}
        </p>
        <button
          type="button"
          onClick={() => setShowFinishConfirm(true)}
          className="mx-auto block rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          Cancelar ejercicio
        </button>
      </div>
    </div>
  );
}
