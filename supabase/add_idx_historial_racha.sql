-- Índice para acelerar el cálculo de la racha (streak).
-- La racha se deriva de historial_ejercicios (user_id, fecha_completado)
-- y se consulta frecuentemente al abrir la app / guardar un ejercicio.
-- Índice compuesto descendente sobre fecha_completado para los
-- "últimos N ejercicios del usuario".

CREATE INDEX IF NOT EXISTS historial_ejercicios_user_fecha_idx
  ON public.historial_ejercicios (user_id, fecha_completado DESC);