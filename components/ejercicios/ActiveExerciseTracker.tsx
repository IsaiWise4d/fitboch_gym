"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X, Dumbbell, Timer, Search, Filter, ChevronDown, AlertTriangle } from "lucide-react";
import type { Ejercicio } from "@/types/app";

interface Serie {
  peso: number;
  reps: number;
}

interface ActiveWorkoutState {
  ejercicio_id: string;
  tiempo_descanso: number;
  series: Serie[];
}

const INITIAL_STATE: ActiveWorkoutState = {
  ejercicio_id: "",
  tiempo_descanso: 1.5,
  series: [{ peso: 0, reps: 0 }],
};

export function ActiveExerciseTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ActiveWorkoutState>(INITIAL_STATE);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // States for Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // States for Modals
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const savedState = localStorage.getItem("fitboch_active_workout");
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
        setIsOpen(true);
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
    loadEjercicios();
  }, []);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("fitboch_active_workout", JSON.stringify(state));
    } else {
      localStorage.removeItem("fitboch_active_workout");
    }
  }, [state, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSerie = () => {
    setState((s) => ({
      ...s,
      series: [...s.series, { peso: 0, reps: 0 }],
    }));
  };

  const updateSerie = (index: number, field: keyof Serie, value: number) => {
    setState((s) => {
      const newSeries = [...s.series];
      newSeries[index] = { ...newSeries[index], [field]: value };
      return { ...s, series: newSeries };
    });
  };

  const removeSerie = (index: number) => {
    setState((s) => {
      const newSeries = s.series.filter((_, i) => i !== index);
      return { ...s, series: newSeries };
    });
  };

  const executeSave = async () => {
    setIsSaving(true);
    setShowSaveConfirm(false);
    
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

      if (seriesError) throw seriesError;

      setState({
        ...state,
        series: [{ peso: state.series[state.series.length - 1]?.peso || 0, reps: 0 }]
      });
      alert("Ejercicio guardado correctamente.");
      window.dispatchEvent(new Event('exercise-saved'));

    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("Hubo un error al guardar el ejercicio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!state.ejercicio_id) {
      alert("Por favor selecciona un ejercicio.");
      return;
    }
    if (state.series.length === 0) {
      alert("Debes agregar al menos una serie.");
      return;
    }
    if (state.series.some(s => s.reps <= 0)) {
      alert("Asegúrate de registrar al menos 1 repetición en cada serie.");
      return;
    }
    setShowSaveConfirm(true);
  };

  const executeFinish = () => {
    setState(INITIAL_STATE);
    setIsOpen(false);
    setShowFinishConfirm(false);
  };

  const categories = Array.from(new Set(ejercicios.map(e => e.grupo_muscular))).filter(Boolean);
  
  const filteredEjercicios = ejercicios.filter(e => {
    const matchesSearch = e.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? e.grupo_muscular === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const selectedEjercicioObj = ejercicios.find(e => e.id === state.ejercicio_id);

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 mt-4"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Iniciar Nuevo Ejercicio
      </Button>
    );
  }

  return (
    <div className="mt-6 border border-primary/20 bg-primary/5 rounded-xl p-4 shadow-sm relative space-y-4">
      {/* Modals */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-5 max-w-sm w-full shadow-lg space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Terminar Ejercicio
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al terminar, se borrarán todos los datos no guardados del ejercicio actual y se cerrará el panel activo. ¿Estás seguro que deseas continuar?
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowFinishConfirm(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={executeFinish}>Sí, terminar</Button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-5 max-w-sm w-full shadow-lg space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
              <Save className="h-5 w-5" /> Guardar Ejercicio
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ¿Estás seguro que deseas guardar este bloque de series? <strong className="text-foreground">Cuidado: No podrás editar este historial una vez guardado.</strong>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>Volver a editar</Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={executeSave}>Sí, guardar permanentemente</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Ejercicio Activo
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setShowFinishConfirm(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Custom Dropdown */}
        <div className="space-y-1 relative" ref={dropdownRef}>
          <Label className="text-xs text-muted-foreground">Ejercicio</Label>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
          >
            <span className={selectedEjercicioObj ? "font-medium text-foreground" : "text-muted-foreground"}>
              {selectedEjercicioObj ? selectedEjercicioObj.nombre : "Busca o selecciona un ejercicio..."}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-40 top-[60px] left-0 w-full bg-background border border-border rounded-md shadow-md p-2 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar ejercicio..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                    autoFocus
                  />
                </div>
                {categories.length > 0 && (
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Todos (Grupo)</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <ul className="max-h-52 overflow-y-auto space-y-1 mt-2">
                {filteredEjercicios.length === 0 ? (
                  <li className="text-center text-xs text-muted-foreground py-3">No hay resultados</li>
                ) : (
                  filteredEjercicios.map(e => (
                    <li 
                      key={e.id}
                      onClick={() => {
                        setState(s => ({ ...s, ejercicio_id: e.id }));
                        setIsDropdownOpen(false);
                      }}
                      className={`px-2 py-2 text-sm rounded-md cursor-pointer flex justify-between items-center ${
                        state.ejercicio_id === e.id ? 'bg-primary border-primary text-primary-foreground' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <span>{e.nombre}</span>
                      <span className="text-[10px] opacity-70 uppercase tracking-wider">{e.grupo_muscular}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Imagen del Ejercicio (GIF/Demonstration) */}
        {selectedEjercicioObj?.imagen_url && !isDropdownOpen && (
          <div className="w-full rounded-lg overflow-hidden border border-border/50 bg-black/5 mt-1">
            <img 
              src={selectedEjercicioObj.imagen_url} 
              alt={`Demostración de ${selectedEjercicioObj.nombre}`} 
              className="w-full h-auto max-h-48 object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        )}

        {/* Descanso */}
        <div className="space-y-1">
          <Label htmlFor="descanso-input" className="text-xs text-muted-foreground flex items-center gap-1">
            <Timer className="h-3 w-3" /> Tiempo de descanso (min)
          </Label>
          <Input 
            id="descanso-input"
            type="number"
            step="0.5"
            min="0"
            value={state.tiempo_descanso}
            onChange={(e) => setState(s => ({ ...s, tiempo_descanso: parseFloat(e.target.value) || 0 }))}
          />
        </div>

        {/* Series */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs text-muted-foreground">Series</Label>
          
          <div className="space-y-2">
            {state.series.map((serie, idx) => (
              <div key={idx} className="flex items-center gap-2 border border-border/50 p-2 rounded-lg bg-surface">
                <div className="flex-none w-6 text-center text-xs font-bold text-muted-foreground">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Peso (kg)</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    max="200" 
                    step="0.5" 
                    value={serie.peso || ""} 
                    onChange={(e) => updateSerie(idx, "peso", parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Reps</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    value={serie.reps || ""} 
                    onChange={(e) => updateSerie(idx, "reps", parseInt(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                {state.series.length > 1 && (
                  <Button variant="ghost" size="icon" className="flex-none h-8 w-8 mt-5 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => removeSerie(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <Button variant="secondary" size="sm" onClick={addSerie} className="w-full mt-2 text-xs border border-dashed border-input hover:border-primary">
            <Plus className="h-3 w-3 mr-1" /> Agregar Serie
          </Button>
        </div>

        {/* Acciones Finales */}
        <div className="pt-4 grid grid-cols-2 gap-3">
          <Button variant="destructive" className="w-full bg-destructive/10 text-destructive hover:bg-destructive border border-destructive hover:text-white" onClick={() => setShowFinishConfirm(true)}>
            Terminar
          </Button>
          <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveClick} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" /> 
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
