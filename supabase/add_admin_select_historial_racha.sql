-- =============================================
-- RLS: permite al admin LEER el historial de ejercicios de todos los
-- usuarios, necesario para mostrar la racha en las vistas de admin
-- (/admin/usuarios y /admin/usuarios/[id]).
--
-- Solo lectura (SELECT): la racha se calcula al vuelo desde
-- historial_ejercicios; el admin no necesita escribir nada.
--
-- Ejecutar en Supabase SQL Editor. Idempotente: si la política ya existe,
-- no hace nada.
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'historial_ejercicios'
      AND policyname = 'Admins leen historial para racha'
  ) THEN
    CREATE POLICY "Admins leen historial para racha"
      ON public.historial_ejercicios
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND rol = 'admin'
        )
      );
  END IF;
END
$$;
