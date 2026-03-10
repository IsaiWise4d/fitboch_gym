export interface DatosRutina {
  nombre: string;
  edad: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  genero: string | null;
  objetivo: string;
  nivel: string;
  dias_semana: number;
  duracion_sesion: string;
  equipamiento: string;
  biotipo: string;
  tiempo_entrenando: string;
  zonas_prioritarias: string;
  porcentaje_grasa?: string;
  lesiones?: string;
  notas_adicionales?: string;
}

const NIVEL_DESCRIPCION: Record<string, string> = {
  principiante: "Menos de 6 meses entrenando, necesita aprender técnica básica y activación neuromuscular",
  intermedio: "Entre 6 meses y 2 años, domina ejercicios compuestos y tiene buena conexión mente-músculo",
  avanzado: "Más de 2 años, busca técnicas avanzadas, periodización científica y sobrecarga progresiva",
};

const OBJETIVO_LABEL: Record<string, string> = {
  perdida_de_grasa: "Pérdida de grasa / definición",
  hipertrofia: "Hipertrofia muscular (volumen limpio)",
  recomposicion: "Recomposición corporal",
  fuerza_estetica: "Fuerza + Estética",
  salud_general: "Salud general y bienestar",
};

const EQUIPAMIENTO_LABEL: Record<string, string> = {
  gym_completo: "Gimnasio completo FitBoch (máquinas, poleas, barras, mancuernas, bancos, accesorios)",
  pesas_libres: "Solo pesas libres (mancuernas, barra olímpica, barra Z, discos)",
  maquinas: "Solo máquinas y poleas de gimnasio",
  peso_corporal: "Solo peso corporal (sin equipamiento)",
};

const DURACION_SESION_LABEL: Record<string, string> = {
  "45_min": "45 minutos",
  "60_min": "60 minutos",
  "75_min": "75 minutos",
  "90_min": "90 minutos",
  "120_min": "120 minutos",
};

const BIOTIPO_LABEL: Record<string, string> = {
  ectomorfo: "Ectomorfo (delgado, metabolismo rápido, dificultad para ganar masa)",
  mesomorfo: "Mesomorfo (contextura media, facilidad para ganar músculo)",
  endomorfo: "Endomorfo (contextura robusta, tendencia a acumular grasa)",
  mixto: "Mixto / No definido",
};

const TIEMPO_ENTRENANDO_LABEL: Record<string, string> = {
  menos_3_meses: "Menos de 3 meses",
  "3_12_meses": "3 a 12 meses",
  "1_3_anos": "1 a 3 años",
  mas_3_anos: "Más de 3 años",
};

const ZONAS_LABEL: Record<string, string> = {
  tren_superior: "Tren superior (pecho, espalda, hombros, brazos)",
  tren_inferior: "Tren inferior (piernas, glúteos)",
  core: "Core y zona media",
  todo_cuerpo: "Todo el cuerpo de forma equilibrada",
};

const EQUIPAMIENTO_DETALLE_GYM = `
Gimnasio FitBoch equipado con:
- Máquinas: aductores, extensión femoral tumbado, sentadilla Smith, prensa (pies cerrados y abiertos), extensión de cuádriceps, pec deck, predicador, remo T, máquina de abdomen
- Poleas: polea alta y baja, jalón en polea, remo en polea, jalón a una mano, remo a una mano, curl en polea, tríceps en polea, elevación lateral en polea, patada en polea
- Barras y mancuernas: barra olímpica, barra Z, mancuernas (todo rango), kettlebell rusa
- Bancos y accesorios: banco plano, banco inclinado, cajón pliométrico, balón Bosu, hip thrust
- Ejercicios libres: sentadilla libre, sentadilla búlgara, sentadilla sumo, press plano/inclinado/militar/francés, peso muerto, dominadas, fondos, push-ups, elevaciones laterales, caminata del granjero, hip thrust, zancadas, puente de glúteo, burpees, plancha, hollow hold, crunch, elevación de piernas, elevación de talones, pullover, remo con mancuerna`;

export function construirPromptRutina(datos: DatosRutina, incluirNutricional: boolean = false): string {
  const equipamientoTexto = datos.equipamiento === "gym_completo"
    ? EQUIPAMIENTO_DETALLE_GYM
    : EQUIPAMIENTO_LABEL[datos.equipamiento] || datos.equipamiento;

  return `## 01 | ROL Y PERSONA DE LA IA

Actúa como un entrenador personal de élite, especializado en:
- Hipertrofia muscular y recomposición corporal
- Estética fitness natural (sin esteroides ni fármacos)
- Fisiología del ejercicio y biomecánica avanzada
- Periodización científica del entrenamiento
- Nutrición deportiva basada en evidencia
- Prevención de lesiones y salud articular a largo plazo

Tu comunicación es:
- Técnica pero comprensible para el nivel del usuario
- Basada en evidencia científica actual
- Proactiva: anticipas errores comunes y los corriges
- Motivadora sin ser exagerada

---

## 02 | CONTEXTO — DATOS DEL USUARIO

### Datos físicos
- **Nombre**: ${datos.nombre}
- **Edad**: ${datos.edad ? `${datos.edad} años` : "No especificada"}
- **Sexo biológico**: ${datos.genero === "masculino" ? "Hombre" : datos.genero === "femenino" ? "Mujer" : "No especificado"}
- **Estatura**: ${datos.altura_cm ? `${datos.altura_cm} cm` : "No especificada"}
- **Peso corporal**: ${datos.peso_kg ? `${datos.peso_kg} kg` : "No especificado"}
- **% Grasa corporal estimado**: ${datos.porcentaje_grasa ? `${datos.porcentaje_grasa}%` : "No especificado"}
- **Biotipo aproximado**: ${BIOTIPO_LABEL[datos.biotipo] || datos.biotipo}

### Historial de entrenamiento
- **Nivel**: ${datos.nivel} — ${NIVEL_DESCRIPCION[datos.nivel] || datos.nivel}
- **Tiempo entrenando continuamente**: ${TIEMPO_ENTRENANDO_LABEL[datos.tiempo_entrenando] || datos.tiempo_entrenando}

### Disponibilidad y logística
- **Días disponibles por semana**: ${datos.dias_semana} días
- **Duración por sesión**: ${DURACION_SESION_LABEL[datos.duracion_sesion] || datos.duracion_sesion}
- **Duración total del plan**: 12 semanas (3 meses)

### Equipamiento disponible
${equipamientoTexto}

### Lesiones o limitaciones físicas
${datos.lesiones || "Ninguna conocida"}

---

## 03 | OBJETIVOS Y PRIORIDADES

- **Objetivo principal**: ${OBJETIVO_LABEL[datos.objetivo] || datos.objetivo}
- **Zonas prioritarias**: ${ZONAS_LABEL[datos.zonas_prioritarias] || datos.zonas_prioritarias}
- **Notas adicionales del usuario**: ${datos.notas_adicionales || "Ninguna"}

---

## 04 | TAREA — QUÉ DEBE GENERAR LA IA

Con los datos anteriores, genera un plan completo estructurado de la siguiente forma:

### A. Periodización de 12 semanas
- Divide el plan en 4 fases de 3 semanas cada una:
- **Fase 1** — Adaptación neuromuscular: cargas moderadas, técnica y activación
- **Fase 2** — Volumen acumulativo: máximo estímulo de hipertrofia
- **Fase 3** — Intensificación: cargas altas, volumen controlado
- **Fase 4** — Recomposición / peak: cardio estratégico, definición, deload final
- Incluye una semana de deload entre fases 2–3 y al final de la fase 4

### B. Rutina semanal detallada
- Selecciona la división muscular óptima según los días disponibles:
  - 2–3 días → Full Body
  - 4 días → Upper/Lower o Torso-Pierna
  - 5–6 días → Push/Pull/Legs (PPL) o especialización
- Para cada día de entrenamiento, genera una tabla con:
  **Ejercicio | Series | Reps | RIR/RPE | Tempo | Descanso (seg)**
- Prioriza ejercicios compuestos primero; aislados al final
- Garantiza frecuencia 2x/semana por grupo muscular
- Aplica sobrecarga progresiva semanal (carga, volumen o densidad)
- Incluye calentamiento general (5–8 min) y específico articular antes de cada sesión

### C. Recomendaciones técnicas de ejercicios clave
- Para los 5–8 ejercicios principales: cues de activación, errores frecuentes y variantes de regresión/progresión

### D. Cardio estratégico
- HIIT si el objetivo es pérdida de grasa o recomposición (2x/semana)
- LISS si el objetivo es volumen limpio (1–2x/semana, días de descanso activo)
- Especifica duración, intensidad y protocolo
${incluirNutricional ? `
### E. Plan nutricional general
- Calorías estimadas (TDEE × factor de actividad ± déficit/superávit)
- Distribución de macros: proteína (g/kg), carbohidratos y grasas
- Timing proteico y distribución de comidas
- Suplementación natural recomendada (creatina, proteína de suero, cafeína, omega-3, vitamina D)
` : ''}
### ${incluirNutricional ? 'F' : 'E'}. Sistema de seguimiento y ajuste
- Métricas semanales: peso, perímetros, rendimiento en ejercicios clave
- Regla de ajuste si hay estancamiento
- Protocolo de recuperación: sueño (7–9h), hidratación (35 ml/kg), manejo del estrés

---

## 05 | FORMATO DE SALIDA REQUERIDO

La respuesta debe seguir este orden exacto:

1. **Resumen ejecutivo del plan** — Objetivo, nivel, días, duración y enfoque en 3–5 líneas
2. **Cronograma de fases** — Tabla con fases, semanas, enfoque, volumen e intensidad
3. **Rutina semanal — Semana tipo** — Tablas día a día con ejercicio, series, reps, RIR, tempo, descanso
4. **Progresión semanal** — Cómo aumentan carga/volumen/densidad cada semana
5. **Guía técnica de ejercicios clave** — Cues, errores y variantes
6. **Cardio y recuperación activa** — Protocolo HIIT/LISS
${incluirNutricional ? `7. **Plan nutricional** — Calorías, macros, timing, suplementación
8. **Sistema de seguimiento** — Métricas y criterios de ajuste
9. **Justificación científica breve** — 1–2 párrafos que respalden las decisiones clave` : `7. **Sistema de seguimiento** — Métricas y criterios de ajuste
8. **Justificación científica breve** — 1–2 párrafos que respalden las decisiones clave

**IMPORTANTE: NO incluyas plan nutricional en la respuesta. El usuario no tiene este servicio habilitado.**`}

---

## 06 | RESTRICCIONES Y REGLAS DE CALIDAD

**NUNCA debes:**
- Recomendar esteroides, prohormones o sustancias prohibidas
- Generar planes genéricos sin considerar los datos específicos del usuario
- Incluir ejercicios contraindicados con las lesiones declaradas
- Superar los días o tiempo de sesión disponibles
- Omitir calentamiento, deloads o protocolo de recuperación
- Recomendar déficit calórico mayor a 500 kcal/día o superávit mayor a 350 kcal/día

**Estándares obligatorios:**
- Toda decisión programática debe tener justificación fisiológica
- El volumen semanal debe estar dentro de los rangos MEV–MAV por grupo muscular
- Mínimo 1.6 g proteína/kg/día
- El plan debe ser sostenible y realista
- Usa el sistema métrico (kg, cm) en toda la respuesta
- Escribe completamente en español

---

## 07 | INSTRUCCIÓN DE RAZONAMIENTO

Antes de generar el plan, sigue este orden de pensamiento:

1. Analiza el perfil del usuario: nivel, disponibilidad, limitaciones y objetivo principal
2. Determina la división muscular más eficiente para sus días y objetivo
3. Selecciona los ejercicios de mayor ROI de estímulo para su equipamiento disponible
4. Calcula el volumen semanal por grupo muscular (series efectivas) según evidencia actual
5. Diseña la progresión semanal de carga/volumen para toda la duración del plan
${incluirNutricional ? '6. Calcula el TDEE y ajusta las calorías al objetivo\n7. Verifica que el plan sea coherente, sostenible y libre de contradicciones\n8. Formatea la respuesta exactamente como se indica en la Sección 05' : '6. Verifica que el plan sea coherente, sostenible y libre de contradicciones\n7. Formatea la respuesta exactamente como se indica en la Sección 05'}`;
}
