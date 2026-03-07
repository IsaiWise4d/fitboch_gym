export interface DatosRutina {
  nombre: string;
  edad: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  genero: string | null;
  objetivo: string;
  nivel: string;
  dias_semana: number;
  duracion_plan: string;
  equipamiento: string;
  lesiones?: string;
  notas_adicionales?: string;
}

const NIVEL_DESCRIPCION: Record<string, string> = {
  principiante: "Menos de 6 meses entrenando, necesita aprender técnica básica",
  intermedio: "Entre 6 meses y 2 años, domina ejercicios compuestos",
  avanzado: "Más de 2 años, busca técnicas avanzadas y periodización",
};

const OBJETIVO_LABEL: Record<string, string> = {
  perdida_de_peso: "Pérdida de peso / grasa",
  hipertrofia: "Hipertrofia (ganancia muscular)",
  fuerza: "Fuerza máxima",
  resistencia: "Resistencia muscular y cardiovascular",
  tonificacion: "Tonificación y definición",
  salud_general: "Salud general y bienestar",
};

const EQUIPAMIENTO_LABEL: Record<string, string> = {
  gym_completo: "Gimnasio completo (máquinas, pesas libres, cables, etc.)",
  pesas_libres: "Solo pesas libres (mancuernas, barra, discos)",
  maquinas: "Solo máquinas de gimnasio",
  peso_corporal: "Solo peso corporal (sin equipamiento)",
};

const DURACION_LABEL: Record<string, string> = {
  "3_meses": "3 meses",
  "6_meses": "6 meses",
  "12_meses": "12 meses",
};

export function construirPromptRutina(datos: DatosRutina): string {
  return `Eres un entrenador personal experto con más de 15 años de experiencia en diseño de programas de entrenamiento.
Tu tarea es crear un plan de entrenamiento completamente personalizado y detallado para el siguiente atleta.

## DATOS DEL USUARIO
- **Nombre**: ${datos.nombre}
- **Edad**: ${datos.edad ? `${datos.edad} años` : "No especificada"}
- **Peso**: ${datos.peso_kg ? `${datos.peso_kg} kg` : "No especificado"}
- **Altura**: ${datos.altura_cm ? `${datos.altura_cm} cm` : "No especificada"}
- **Género**: ${datos.genero || "No especificado"}
- **Nivel de experiencia**: ${datos.nivel} (${NIVEL_DESCRIPCION[datos.nivel] || datos.nivel})
- **Objetivo principal**: ${OBJETIVO_LABEL[datos.objetivo] || datos.objetivo}
- **Días disponibles por semana**: ${datos.dias_semana} días
- **Duración del plan**: ${DURACION_LABEL[datos.duracion_plan] || datos.duracion_plan}
- **Lesiones o limitaciones físicas**: ${datos.lesiones || "Ninguna conocida"}
- **Equipamiento disponible**: ${EQUIPAMIENTO_LABEL[datos.equipamiento] || datos.equipamiento}
- **Notas adicionales**: ${datos.notas_adicionales || "Ninguna"}

## INSTRUCCIONES PARA EL PLAN

Crea un plan de entrenamiento estructurado que incluya:

1. **RESUMEN DEL PLAN**: Breve descripción del enfoque general y por qué es adecuado para este usuario.

2. **ESTRUCTURA SEMANAL**: Cómo se distribuyen los días de entrenamiento (qué grupos musculares cada día).

3. **PLAN DETALLADO POR FASES**:
   - Divide el plan en fases mensuales
   - Para cada fase, especifica la semana y los cambios progresivos
   - Para cada día de entrenamiento indica:
     * Nombre del día (Ej: "Día 1 - Pecho y Tríceps")
     * Lista de ejercicios con: nombre, series, repeticiones, descanso entre series
     * Notas de técnica o consejos importantes

4. **PROGRESIÓN**: Explica cómo debe progresar el peso/intensidad a lo largo del plan.

5. **RECOMENDACIONES DE NUTRICIÓN BÁSICA**: Orientaciones generales según el objetivo.

6. **NOTAS FINALES**: Consejos de recuperación, sueño, hidratación.

Usa un formato claro con encabezados, listas y tablas donde sea útil.
El plan debe ser realista, progresivo y adaptado ESPECÍFICAMENTE a los datos de este usuario.
Escribe el plan en español.`;
}
