CREATE TABLE public.calentamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  instrucciones TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('tren_superior', 'tren_inferior')),
  nivel TEXT NOT NULL DEFAULT 'todos' CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'todos')),
  imagen_url TEXT,
  video_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX calentamientos_categoria_nombre_idx
  ON public.calentamientos (categoria, nombre);

ALTER TABLE public.calentamientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos ven calentamientos activos"
  ON public.calentamientos FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admins gestionan calentamientos"
  ON public.calentamientos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
