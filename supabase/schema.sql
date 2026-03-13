-- =============================================
-- FitBoch Database Schema
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla profiles (extiende auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  nombre        TEXT NOT NULL,
  apellido      TEXT,
  email         TEXT NOT NULL,
  avatar_url    TEXT,
  edad          INTEGER,
  peso_kg       DECIMAL(5,2),
  altura_cm     INTEGER,
  porcentaje_grasa TEXT,
  lesiones      TEXT,
  genero        TEXT CHECK (genero IN ('masculino', 'femenino', 'otro')),
  rol           TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  activo        BOOLEAN DEFAULT TRUE
);

-- 2. Tabla membresias
CREATE TABLE membresias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  usuario_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo_plan       TEXT NOT NULL CHECK (tipo_plan IN ('mensual', 'trimestral', 'semestral', 'anual')),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  estado          TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'suspendida', 'pendiente')),
  renovacion_habilitada  BOOLEAN DEFAULT FALSE,
  notas           TEXT,
  monto_pagado    DECIMAL(10,2)
);

-- 3. Tabla rutinas
CREATE TABLE rutinas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  usuario_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membresia_id    UUID REFERENCES membresias(id),
  datos_input     JSONB NOT NULL,
  texto_rutina    TEXT NOT NULL,
  duracion_plan   TEXT NOT NULL,
  estado          TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'archivada')),
  modelo_ia       TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_usados   INTEGER
);

-- 4. Tabla ejercicios
CREATE TABLE ejercicios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  instrucciones   TEXT NOT NULL,
  grupo_muscular  TEXT NOT NULL,
  categoria       TEXT NOT NULL,
  nivel           TEXT DEFAULT 'todos' CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'todos')),
  imagen_url      TEXT,
  video_url       TEXT,
  activo          BOOLEAN DEFAULT TRUE
);

-- 5. Tabla logs de acceso
CREATE TABLE logs_acceso (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  usuario_id    UUID REFERENCES profiles(id),
  accion        TEXT,
  metadata      JSONB
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acceso ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuarios ven solo su perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan solo su perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins gestionan todos los perfiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Policies para membresias
CREATE POLICY "Usuarios ven solo sus membresias"
  ON membresias FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins gestionan todas las membresias"
  ON membresias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Policies para rutinas
CREATE POLICY "Usuarios ven solo sus rutinas"
  ON rutinas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios insertan sus rutinas"
  ON rutinas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins gestionan todas las rutinas"
  ON rutinas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Policies para ejercicios (todos ven, solo admins modifican)
CREATE POLICY "Todos ven ejercicios activos"
  ON ejercicios FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins gestionan ejercicios"
  ON ejercicios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Policies para logs
CREATE POLICY "Admins ven todos los logs"
  ON logs_acceso FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Usuarios insertan sus propios logs"
  ON logs_acceso FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- =============================================
-- Trigger: Auto-crear perfil al registrar usuario
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
