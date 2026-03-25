# 🏋️ GymApp — Plan Técnico de Desarrollo
> Documento de referencia para el desarrollo completo de la aplicación web para gimnasio con IA.  
> Stack: **Next.js 14 + Supabase + Claude AI API**  
> Enfoque: **Mobile First**

---

## 📋 Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico Detallado](#3-stack-tecnológico-detallado)
4. [Estructura de Base de Datos (Supabase)](#4-estructura-de-base-de-datos-supabase)
5. [Módulos y Funcionalidades](#5-módulos-y-funcionalidades)
6. [Integración con IA (Claude API)](#6-integración-con-ia-claude-api)
7. [Estructura del Proyecto (Next.js)](#7-estructura-del-proyecto-nextjs)
8. [Flujo de Usuario](#8-flujo-de-usuario)
9. [Diseño UI/UX — Mobile First](#9-diseño-uiux--mobile-first)
10. [Autenticación y Seguridad](#10-autenticación-y-seguridad)
11. [Plan de Desarrollo por Fases](#11-plan-de-desarrollo-por-fases)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Consideraciones Importantes](#13-consideraciones-importantes)
14. [Checklist de Desarrollo](#14-checklist-de-desarrollo)

---

## 1. Visión General del Proyecto

### ¿Qué es esta app?
Una aplicación web **mobile-first** para la gestión de membresías de un gimnasio. El diferenciador principal es la **generación de rutinas personalizadas con Inteligencia Artificial** basadas en los datos de cada usuario.

### Roles de Usuario

| Rol | Acceso |
|-----|--------|
| **Admin** | Panel completo: gestión de usuarios, membresías, renovaciones, generación de rutinas |
| **Usuario/Miembro** | Perfil personal: ver su rutina, estado de membresía, biblioteca de ejercicios |

### Principios de Diseño
- **Simple**: Interfaz limpia, sin sobrecarga de información
- **Mobile First**: Diseñado primero para pantallas de 375px - 430px
- **Una sola generación de rutina por plan**: Se genera UNA vez con IA y queda guardada permanentemente hasta que el admin habilite una renovación
- **Siempre disponible**: El usuario puede consultar su rutina en cualquier momento

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                 │
│              Next.js 14 App Router                   │
│         React Components + Tailwind CSS              │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │ Supabase │ │  Claude  │ │  Next.js API │
   │  Auth    │ │  AI API  │ │   Routes     │
   └──────────┘ └──────────┘ └──────────────┘
          │                        │
          ▼                        ▼
   ┌──────────────────────────────────────┐
   │           Supabase Database          │
   │         (PostgreSQL + RLS)           │
   │                                      │
   │  usuarios | membresías | rutinas     │
   │  ejercicios | planes | logs          │
   └──────────────────────────────────────┘
```

### Flujo de Generación de Rutina

```
Admin habilita renovación
        │
        ▼
Usuario entra a su perfil
        │
        ▼
App detecta "rutina pendiente"
        │
        ▼
Formulario: datos del usuario
(edad, peso, altura, género, objetivo, nivel, lesiones, días disponibles)
        │
        ▼
Next.js API Route → Claude API
(prompt estructurado con los datos)
        │
        ▼
Claude genera texto de rutina personalizada
        │
        ▼
Se guarda en Supabase (campo texto)
Estado cambia a "rutina_activa"
        │
        ▼
Usuario ve su rutina (NO se puede regenerar)
```

---

## 3. Stack Tecnológico Detallado

### Frontend / Framework
```
Next.js 14 (App Router)
├── React 18
├── TypeScript (recomendado para evitar bugs)
├── Tailwind CSS (estilos mobile-first)
└── shadcn/ui (componentes pre-hechos, muy recomendado)
```

### Backend / Base de Datos
```
Supabase
├── Authentication (email/password + magic link opcional)
├── PostgreSQL (base de datos relacional)
├── Row Level Security — RLS (cada usuario solo ve sus datos)
├── Storage (para fotos de perfil, opcional)
└── Realtime (opcional para notificaciones)
```

### Inteligencia Artificial
```
Anthropic Claude API
├── Modelo: claude-sonnet-4-20250514
├── Uso: Generación de rutinas personalizadas
└── Integración: Next.js API Routes (server-side, nunca exponer API key al cliente)
```

### Librerías Adicionales Recomendadas
```
npm install:
├── @supabase/supabase-js          → Cliente de Supabase
├── @supabase/ssr                  → Helpers para Next.js
├── @anthropic-ai/sdk              → SDK oficial de Claude
├── jspdf + jspdf-autotable        → Generar PDF descargable de la rutina
├── date-fns                       → Manejo de fechas (vencimiento membresía)
├── react-hook-form + zod          → Formularios con validación
├── lucide-react                   → Iconos modernos
└── shadcn/ui                      → Componentes UI (instalar con CLI)
```

---

## 4. Estructura de Base de Datos (Supabase)

### Tabla: `profiles`
Extendida del usuario de Supabase Auth. Se crea automáticamente con un trigger cuando alguien se registra.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos básicos
  nombre        TEXT NOT NULL,
  apellido      TEXT,
  email         TEXT NOT NULL,
  avatar_url    TEXT,
  
  -- Datos físicos (usados para generar la rutina)
  edad          INTEGER,
  peso_kg       DECIMAL(5,2),
  altura_cm     INTEGER,
  genero        TEXT CHECK (genero IN ('masculino', 'femenino', 'otro')),
  
  -- Estado dentro del gym
  rol           TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  activo        BOOLEAN DEFAULT TRUE
);
```

### Tabla: `membresias`
Control de planes y vencimientos.

```sql
CREATE TABLE membresias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  usuario_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de plan
  tipo_plan       TEXT NOT NULL CHECK (tipo_plan IN ('mensual', 'trimestral', 'semestral', 'anual')),
  
  -- Vigencia
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  
  -- Estado
  estado          TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'suspendida', 'pendiente')),
  
  -- Control
  renovacion_habilitada  BOOLEAN DEFAULT FALSE,  -- Admin habilita nueva rutina
  notas                  TEXT,
  
  -- Precio pagado (opcional, para historial)
  monto_pagado    DECIMAL(10,2)
);

-- Vista útil: membresía activa actual de cada usuario
CREATE VIEW membresia_activa AS
SELECT DISTINCT ON (usuario_id) *
FROM membresias
WHERE estado = 'activa'
ORDER BY usuario_id, fecha_fin DESC;
```

### Tabla: `rutinas`
El corazón del sistema. Almacena el texto generado por IA.

```sql
CREATE TABLE rutinas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  usuario_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membresia_id    UUID REFERENCES membresias(id),
  
  -- Input que se le pasó a la IA
  datos_input     JSONB NOT NULL,
  -- Ejemplo del JSON:
  -- {
  --   "edad": 28, "peso": 75, "altura": 175, "genero": "masculino",
  --   "objetivo": "hipertrofia", "nivel": "intermedio",
  --   "dias_semana": 4, "duracion_plan": "3_meses",
  --   "lesiones": "ninguna", "equipamiento": "gym_completo",
  --   "notas_adicionales": "prefiero no hacer sentadillas"
  -- }
  
  -- Output de la IA
  texto_rutina    TEXT NOT NULL,             -- El texto completo generado
  duracion_plan   TEXT NOT NULL,             -- '3_meses', '6_meses', '12_meses'
  
  -- Estado
  estado          TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'archivada')),
  
  -- Metadatos
  modelo_ia       TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_usados   INTEGER
);
```

### Tabla: `ejercicios`
Biblioteca de ejercicios del gym.

```sql
CREATE TABLE ejercicios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Info básica
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  instrucciones   TEXT NOT NULL,       -- Cómo hacerlo correctamente
  
  -- Clasificación
  grupo_muscular  TEXT NOT NULL,       -- 'pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core', 'cardio'
  categoria       TEXT NOT NULL,       -- 'fuerza', 'cardio', 'flexibilidad', 'funcional'
  nivel           TEXT DEFAULT 'todos' CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'todos')),
  
  -- Media
  imagen_url      TEXT,               -- Foto del ejercicio
  video_url       TEXT,               -- Video explicativo (YouTube embed, opcional)
  
  -- Control
  activo          BOOLEAN DEFAULT TRUE
);
```

### Tabla: `logs_acceso` (Opcional pero útil)
Para que el admin vea la actividad.

```sql
CREATE TABLE logs_acceso (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  usuario_id    UUID REFERENCES profiles(id),
  accion        TEXT,  -- 'login', 'ver_rutina', 'descargar_pdf', 'generar_rutina'
  metadata      JSONB
);
```

### Row Level Security (RLS) — MUY IMPORTANTE

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuarios ven solo su perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan solo su perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins ven todos los perfiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para rutinas
CREATE POLICY "Usuarios ven solo sus rutinas"
  ON rutinas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins ven todas las rutinas"
  ON rutinas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### Trigger: Auto-crear perfil al registrar usuario

```sql
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
```

---

## 5. Módulos y Funcionalidades

### Módulo 1: Autenticación
- Login con email + contraseña
- Recuperación de contraseña por email
- Sesión persistente
- Redirect automático según rol: admin → `/admin`, usuario → `/dashboard`

### Módulo 2: Dashboard de Usuario
**Lo primero que ve el usuario al entrar.**

Secciones:
- **Card de bienvenida**: nombre del usuario, foto si tiene
- **Estado de membresía**: 
  - 🟢 Activa → "Vence el DD/MM/AAAA (X días restantes)"
  - 🟡 Por vencer → "Tu membresía vence en menos de 7 días"
  - 🔴 Vencida → "Tu membresía venció el DD/MM/AAAA"
- **Acceso rápido a rutina** → botón grande visible
- **Acceso rápido a ejercicios** → botón de biblioteca

### Módulo 3: Mi Rutina
**El módulo central de la app.**

Estados posibles:
1. **Sin rutina generada** (usuario nuevo) → Mensaje explicativo
2. **Rutina pendiente de generar** (admin habilitó renovación) → Formulario de datos → Generación con IA
3. **Rutina activa** → Visualización del texto + botón de descarga PDF

Funcionalidades:
- Ver la rutina completa en pantalla (texto formateado)
- Descargar como PDF (con nombre del usuario, fecha de generación, logo del gym)
- **NO se puede regenerar sin que el admin lo habilite**

### Módulo 4: Biblioteca de Ejercicios
- Lista de todos los ejercicios disponibles en el gym
- Filtro por grupo muscular (pecho, espalda, piernas, etc.)
- Filtro por nivel (principiante, intermedio, avanzado)
- Búsqueda por nombre
- Card de cada ejercicio con: nombre, imagen, descripción, instrucciones de cómo hacerlo correctamente
- Vista detallada de cada ejercicio

### Módulo 5: Mi Perfil
- Ver y editar datos personales (nombre, apellido, teléfono)
- Ver datos físicos actuales (peso, altura, edad) — estos se usan para la IA
- Cambiar contraseña
- Ver historial de membresías

### Módulo 6: Panel de Administración

#### 6.1 Lista de Usuarios
- Tabla/lista de todos los miembros
- Info visible: nombre, email, tipo de membresía, fecha vencimiento, estado
- Filtros: activos, vencidos, por vencer (próximos 7 días)
- Búsqueda por nombre o email
- Acceso al detalle de cada usuario

#### 6.2 Detalle de Usuario (Admin)
- Todos los datos del perfil
- Estado de membresía actual
- Botón **"Renovar Membresía"**: actualiza fecha_fin, cambia estado a 'activa'
- Botón **"Habilitar Nueva Rutina"**: activa el flag `renovacion_habilitada = true` y archiva rutina anterior
- Ver la rutina actual del usuario
- Historial de membresías anteriores

#### 6.3 Gestión de Ejercicios (Admin)
- Agregar nuevos ejercicios a la biblioteca
- Editar ejercicios existentes
- Activar/desactivar ejercicios
- Subir imágenes

#### 6.4 Métricas Básicas (Dashboard Admin)
- Total de miembros activos
- Membresías próximas a vencer (próximos 7 días)
- Membresías vencidas
- Últimos registros

---

## 6. Integración con IA (Claude API)

### API Route: `/api/generar-rutina`

Esta ruta se ejecuta **solo en el servidor** (Next.js API Route). Nunca exponer la API key al cliente.

```typescript
// app/api/generar-rutina/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  // 1. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
  
  // 2. Verificar que tenga renovación habilitada
  const { data: membresia } = await supabase
    .from('membresias')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('renovacion_habilitada', true)
    .single();
    
  if (!membresia) {
    return Response.json({ error: 'No tienes una generación de rutina pendiente' }, { status: 403 });
  }
  
  // 3. Obtener los datos del formulario
  const datosUsuario = await request.json();
  
  // 4. Construir el prompt
  const prompt = construirPromptRutina(datosUsuario);
  
  // 5. Llamar a Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const textoRutina = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // 6. Guardar en Supabase
  await supabase.from('rutinas').insert({
    usuario_id: user.id,
    membresia_id: membresia.id,
    datos_input: datosUsuario,
    texto_rutina: textoRutina,
    duracion_plan: datosUsuario.duracion_plan,
    tokens_usados: message.usage.output_tokens
  });
  
  // 7. Deshabilitar la renovación
  await supabase
    .from('membresias')
    .update({ renovacion_habilitada: false })
    .eq('id', membresia.id);
  
  return Response.json({ success: true, rutina: textoRutina });
}
```

### El Prompt de Generación

Este es el elemento más importante. Aquí está la plantilla base que debes refinar con el tiempo:

```typescript
function construirPromptRutina(datos: DatosUsuario): string {
  return `Eres un entrenador personal experto con más de 15 años de experiencia en diseño de programas de entrenamiento. 
Tu tarea es crear un plan de entrenamiento completamente personalizado y detallado para el siguiente atleta.

## DATOS DEL USUARIO
- **Nombre**: ${datos.nombre}
- **Edad**: ${datos.edad} años
- **Peso**: ${datos.peso_kg} kg
- **Altura**: ${datos.altura_cm} cm
- **Género**: ${datos.genero}
- **Nivel de experiencia**: ${datos.nivel} (${getNivelDescripcion(datos.nivel)})
- **Objetivo principal**: ${datos.objetivo}
- **Días disponibles por semana**: ${datos.dias_semana} días
- **Duración del plan**: ${datos.duracion_plan}
- **Lesiones o limitaciones físicas**: ${datos.lesiones || 'Ninguna conocida'}
- **Equipamiento disponible**: ${datos.equipamiento}
- **Notas adicionales**: ${datos.notas_adicionales || 'Ninguna'}

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
```

### Variables de Input del Formulario de Rutina

```typescript
interface DatosRutina {
  // Datos del perfil (auto-rellenados)
  nombre: string;
  edad: number;
  peso_kg: number;
  altura_cm: number;
  genero: 'masculino' | 'femenino' | 'otro';
  
  // Seleccionados en el formulario
  objetivo: 'perdida_de_peso' | 'hipertrofia' | 'fuerza' | 'resistencia' | 'tonificacion' | 'salud_general';
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  dias_semana: 2 | 3 | 4 | 5 | 6;
  duracion_plan: '3_meses' | '6_meses' | '12_meses';
  equipamiento: 'gym_completo' | 'pesas_libres' | 'maquinas' | 'peso_corporal';
  
  // Texto libre
  lesiones: string;           // "dolor rodilla derecha, no puedo correr"
  notas_adicionales: string;  // "prefiero entrenar por la mañana, no me gustan las sentadillas"
}
```

---

## 7. Estructura del Proyecto (Next.js)

```
gym-app/
├── app/
│   ├── (auth)/                    # Rutas de autenticación (layout sin navbar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── recuperar-password/
│   │       └── page.tsx
│   │
│   ├── (usuario)/                 # Rutas del usuario normal
│   │   ├── layout.tsx             # Layout con navbar bottom (mobile)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Inicio: estado membresía + accesos rápidos
│   │   ├── rutina/
│   │   │   └── page.tsx           # Ver/generar rutina
│   │   ├── ejercicios/
│   │   │   ├── page.tsx           # Lista de ejercicios
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Detalle de ejercicio
│   │   └── perfil/
│   │       └── page.tsx           # Datos personales
│   │
│   ├── (admin)/                   # Rutas de administración
│   │   ├── layout.tsx             # Layout admin con sidebar
│   │   ├── admin/
│   │   │   ├── page.tsx           # Dashboard admin (métricas)
│   │   │   ├── usuarios/
│   │   │   │   ├── page.tsx       # Lista de usuarios
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Detalle de usuario
│   │   │   └── ejercicios/
│   │   │       ├── page.tsx       # Gestión de ejercicios
│   │   │       └── nuevo/
│   │   │           └── page.tsx
│   │
│   ├── api/                       # API Routes (server-side)
│   │   ├── generar-rutina/
│   │   │   └── route.ts           # Llama a Claude API
│   │   └── descargar-pdf/
│   │       └── route.ts           # Genera PDF de la rutina
│   │
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Redirect a /login o /dashboard
│
├── components/
│   ├── ui/                        # Componentes shadcn/ui
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── dashboard/
│   │   ├── MembresiaCard.tsx      # Card con estado de membresía
│   │   └── AccesosRapidos.tsx
│   ├── rutina/
│   │   ├── RutinaViewer.tsx       # Muestra el texto de la rutina
│   │   ├── FormularioRutina.tsx   # Formulario para generar rutina
│   │   └── DescargaPDF.tsx        # Botón de descarga
│   ├── ejercicios/
│   │   ├── EjercicioCard.tsx
│   │   ├── EjercicioDetalle.tsx
│   │   └── FiltrosEjercicios.tsx
│   ├── admin/
│   │   ├── TablaUsuarios.tsx
│   │   ├── UsuarioDetalle.tsx
│   │   └── MetricasAdmin.tsx
│   └── shared/
│       ├── BottomNav.tsx          # Navegación bottom mobile
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Cliente browser
│   │   ├── server.ts              # Cliente server (SSR)
│   │   └── middleware.ts          # Refresh de sesión
│   ├── ai/
│   │   └── prompts.ts             # Función construirPromptRutina
│   ├── pdf/
│   │   └── generarPDF.ts          # Lógica para crear PDF con jsPDF
│   └── utils/
│       ├── fechas.ts              # Helpers de fechas
│       └── membresia.ts           # Estado de membresía (activa, por vencer, etc.)
│
├── types/
│   ├── database.ts                # Tipos generados por Supabase CLI
│   └── app.ts                     # Tipos propios de la app
│
├── middleware.ts                  # Protección de rutas
├── .env.local                     # Variables de entorno
└── tailwind.config.ts
```

---

## 8. Flujo de Usuario

### Usuario Nuevo (Primer Ingreso)
```
1. Recibe credenciales del admin (email + contraseña temporal)
2. Entra a /login → hace login
3. Redirect a /dashboard
4. Ve su card de membresía (activa)
5. Ve que NO tiene rutina aún → mensaje "Tu rutina aún no ha sido generada. Contacta al admin."
6. Puede explorar la biblioteca de ejercicios
```

### Usuario con Renovación Habilitada
```
1. Entra a /dashboard → ve notificación "¡Tienes una nueva rutina disponible para generar!"
2. Va a /rutina
3. Ve el formulario con sus datos pre-cargados (del perfil)
4. Completa campos adicionales: objetivo, nivel, días, duración, lesiones
5. Hace clic en "Generar Mi Rutina"
6. Loading state (puede tomar 10-20 segundos con Claude)
7. Ve su rutina generada en pantalla
8. Puede descargarla como PDF
9. La rutina queda guardada PERMANENTEMENTE
```

### Usuario con Membresía por Vencer
```
1. Entra a /dashboard
2. Ve warning: "Tu membresía vence en 5 días"
3. Toda la funcionalidad sigue activa hasta que venza
```

### Usuario con Membresía Vencida
```
1. Entra a /dashboard
2. Ve error: "Tu membresía venció el [fecha]"
3. Puede ver su rutina (ya generada y guardada)
4. NO puede generar nueva rutina
5. Se le indica contactar al admin para renovar
```

### Admin — Flujo de Renovación
```
1. Entra a /admin
2. Ve lista de usuarios filtrada por "próximos a vencer" o "vencidos"
3. Entra al detalle del usuario
4. Hace clic en "Renovar Membresía" → modal con nueva fecha_fin
5. Si quiere que el usuario tenga nueva rutina → "Habilitar Nueva Rutina"
6. El usuario verá la notificación en su próximo ingreso
```

---

## 9. Diseño UI/UX — Mobile First

### Breakpoints Principales
```css
/* Mobile (diseño base) */
/* 320px - 430px: iPhones, Android pequeños */

/* Tablet (mejora progresiva) */
@media (min-width: 768px) { ... }

/* Desktop (mejora progresiva) */
@media (min-width: 1024px) { ... }
```

### Componentes Clave Mobile

#### Bottom Navigation Bar (usuarios)
```
┌──────────────────────────────────┐
│                                  │
│         [Contenido]              │
│                                  │
├──────────────────────────────────┤
│  🏠 Inicio  💪 Rutina  📚 Ejerc  │
│   [activo]                       │
└──────────────────────────────────┘
```

#### Card de Membresía
```
┌──────────────────────────────────┐
│  MEMBRESÍA MENSUAL          🟢   │
│  ─────────────────────────────   │
│  Vence: 15 de Abril, 2025        │
│  ⏱️ 23 días restantes            │
└──────────────────────────────────┘
```

#### Pantalla de Rutina
```
┌──────────────────────────────────┐
│ ← Mi Rutina            [PDF ⬇]  │
│                                  │
│ Plan 3 Meses · Generada 01/03/25 │
│ ─────────────────────────────    │
│                                  │
│ ## RESUMEN DEL PLAN              │
│ Este plan está diseñado para...  │
│                                  │
│ ## SEMANA 1                      │
│ **Día 1 - Pecho**                │
│ • Press Banca: 4x8 ...           │
│ • [scroll continuo...]           │
└──────────────────────────────────┘
```

### Paleta de Colores Recomendada
```css
/* Variables CSS en globals.css */
:root {
  --color-primary: #FF4500;     /* Naranja/rojo energético - acción principal */
  --color-primary-dark: #CC3700;
  --color-bg: #0A0A0A;          /* Fondo oscuro (gym vibe) */
  --color-surface: #1A1A1A;     /* Cards, modales */
  --color-border: #2A2A2A;      /* Bordes */
  --color-text: #FFFFFF;        /* Texto principal */
  --color-text-muted: #888888;  /* Texto secundario */
  --color-success: #22C55E;     /* Membresía activa */
  --color-warning: #F59E0B;     /* Por vencer */
  --color-error: #EF4444;       /* Vencida */
}
```

### Tipografía Recomendada
```css
/* Google Fonts: Inter (clean, legible en mobile) */
font-family: 'Inter', sans-serif;

/* Tamaños base */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;   /* Mínimo recomendado para mobile */
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
```

### UX Considerations Mobile
- **Touch targets mínimo 44px de alto** (Apple HIG)
- **Formularios**: labels visibles, inputs grandes, autocomplete activado
- **Loading states**: siempre mostrar spinner cuando hay operaciones async
- **Error states**: mensajes claros en español, no tecnicismos
- **Generación de rutina**: progress bar o mensaje "Esto puede tomar unos segundos..."
- **Scroll**: preferir scroll vertical continuo sobre paginación
- **Teclado virtual**: asegurarse que inputs no queden tapados por el teclado en iOS/Android

---

## 10. Autenticación y Seguridad

### Middleware de Protección de Rutas
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas (no requieren auth)
  const publicPaths = ['/login', '/recuperar-password'];
  if (publicPaths.includes(pathname)) return NextResponse.next();
  
  // Verificar sesión
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Proteger rutas de admin
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();
      
    if (profile?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Reglas de Seguridad
1. **Nunca exponer** `ANTHROPIC_API_KEY` al cliente (solo en API Routes)
2. **Nunca exponer** `SUPABASE_SERVICE_ROLE_KEY` al cliente (solo en servidor)
3. **Siempre verificar** el rol del usuario en las API Routes, no confiar solo en el cliente
4. **RLS en Supabase**: cada usuario solo puede leer/escribir sus propios datos
5. **Validar todos los inputs** antes de enviarlos a la IA (zod schemas)
6. **Rate limiting** en la API Route de generación de rutinas (máximo 1 por usuario)

---

## 11. Plan de Desarrollo por Fases

### Fase 0: Setup Inicial (2-3 días)
- [ ] Crear proyecto Next.js 14: `npx create-next-app@latest gym-app --typescript --tailwind --app`
- [ ] Crear proyecto en Supabase (supabase.com)
- [ ] Instalar dependencias principales
- [ ] Configurar variables de entorno
- [ ] Instalar y configurar shadcn/ui
- [ ] Deploy en Vercel (configurar desde el inicio para detectar errores de build)
- [ ] Conectar repo de GitHub con Vercel

### Fase 1: Autenticación (2-3 días)
- [ ] Configurar Supabase Auth en Next.js
- [ ] Pantalla de Login
- [ ] Middleware de protección de rutas
- [ ] Redirect según rol
- [ ] Recuperación de contraseña
- [ ] Test completo del flujo auth

### Fase 2: Base de Datos (2-3 días)
- [ ] Crear todas las tablas en Supabase
- [ ] Configurar RLS policies
- [ ] Crear trigger de auto-perfil
- [ ] Generar tipos TypeScript con Supabase CLI: `npx supabase gen types typescript`
- [ ] Insertar datos de prueba (3-4 usuarios, ejercicios de muestra)

### Fase 3: Dashboard de Usuario (3-4 días)
- [ ] Layout mobile con Bottom Navigation
- [ ] Card de estado de membresía con lógica de fechas
- [ ] Página del perfil con edición de datos
- [ ] Biblioteca de ejercicios (listado + filtros + detalle)
- [ ] Estados de carga y error

### Fase 4: Módulo de Rutinas con IA (4-5 días)
- [ ] Formulario de datos para generación
- [ ] API Route que llama a Claude
- [ ] Construcción del prompt
- [ ] Loading state durante generación (es async, puede tardar)
- [ ] Visualización del texto de la rutina
- [ ] Generación de PDF descargable
- [ ] Test completo del flujo

### Fase 5: Panel de Administración (4-5 días)
- [ ] Dashboard admin con métricas
- [ ] Lista de usuarios con filtros
- [ ] Detalle de usuario
- [ ] Renovar membresía (modal + update)
- [ ] Habilitar nueva rutina
- [ ] Gestión de ejercicios (CRUD)
- [ ] Protección de rutas admin

### Fase 6: Polish y Testing (3-4 días)
- [ ] Revisar toda la UI en dispositivos reales (Android + iOS)
- [ ] Loading states en todas las acciones async
- [ ] Mensajes de error amigables
- [ ] Validación de formularios con zod
- [ ] Optimizar imágenes (next/image)
- [ ] Revisar accesibilidad básica
- [ ] Test de flujo completo de usuario
- [ ] Test de flujo completo de admin

### Fase 7: Lanzamiento
- [ ] Variables de entorno de producción en Vercel
- [ ] Dominio personalizado (opcional)
- [ ] Crear usuario admin en Supabase
- [ ] Agregar todos los ejercicios del gym
- [ ] Crear primeras membresías de prueba con usuarios reales
- [ ] Monitoreo de errores (Sentry, opcional)

**Tiempo total estimado: 3-5 semanas** dependiendo de dedicación

---

## 12. Variables de Entorno

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...          # Segura para el cliente
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...              # ⚠️ SOLO servidor, nunca al cliente

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...                        # ⚠️ SOLO servidor

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GYM_NOMBRE=Mi Gym                       # Para el PDF y branding
```

---

## 13. Consideraciones Importantes

### Costos de la IA
- Claude cobra por tokens (input + output)
- Una rutina de 3 meses genera aproximadamente **3,000 - 5,000 tokens** de output
- Con el modelo `claude-sonnet-4-20250514`: aproximadamente **$0.015 - $0.025 USD por rutina**
- Para 100 usuarios al mes: ~$1.5 - $2.5 USD en costos de IA
- **Muy económico**, pero igual controla cuántas veces se puede generar

### Limitaciones a Implementar
1. **Una generación por ciclo**: El flag `renovacion_habilitada` lo controla
2. **Timeout en la API Route**: La generación puede tardar 15-30 segundos. Configurar `maxDuration` en la route
3. **Tamaño del texto**: El texto de la rutina puede ser largo. Asegurarse que el campo `TEXT` en Supabase es suficiente (lo es, soporta hasta 1GB)

### Generación del PDF
```typescript
// Usar jsPDF para generar PDF en el servidor
import jsPDF from 'jspdf';

function generarPDFRutina(rutina: Rutina, usuario: Profile): Buffer {
  const doc = new jsPDF();
  
  // Header con nombre del gym
  doc.setFontSize(20);
  doc.text('MI GYM - Plan de Entrenamiento', 20, 20);
  
  // Datos del usuario
  doc.setFontSize(12);
  doc.text(`Atleta: ${usuario.nombre} ${usuario.apellido}`, 20, 40);
  doc.text(`Generado: ${format(rutina.created_at, 'dd/MM/yyyy')}`, 20, 50);
  doc.text(`Plan: ${rutina.duracion_plan}`, 20, 60);
  
  // Texto de la rutina (con saltos de línea)
  doc.setFontSize(10);
  const lineas = doc.splitTextToSize(rutina.texto_rutina, 170);
  doc.text(lineas, 20, 80);
  
  return Buffer.from(doc.output('arraybuffer'));
}
```

### Onboarding de Usuarios
El admin crea los usuarios manualmente o se usa un flujo de invitación:
1. Admin crea usuario en Supabase Auth (o usa `supabase.auth.admin.createUser()`)
2. Crea la membresía en la tabla `membresias`
3. Usuario recibe email con credenciales
4. Usuario entra por primera vez y puede cambiar su contraseña

### Escalabilidad Futura (ideas)
- Notificaciones push cuando la membresía está por vencer
- Integración con pagos (Stripe/Wompi para Colombia)
- Tracking de asistencia al gym (QR code)
- Seguimiento de progreso (registrar pesos levantados)
- Chat con el entrenador
- Fotos de progreso

---

## 14. Checklist de Desarrollo

### Setup ✅
- [ ] Repo en GitHub creado
- [ ] Next.js 14 inicializado con TypeScript + Tailwind
- [ ] Supabase proyecto creado
- [ ] Vercel conectado al repo
- [ ] Variables de entorno configuradas
- [ ] shadcn/ui instalado y configurado

### Base de Datos ✅
- [ ] Todas las tablas creadas
- [ ] RLS habilitado y policies configuradas
- [ ] Trigger de auto-perfil funcionando
- [ ] Datos de prueba insertados
- [ ] Tipos TypeScript generados

### Autenticación ✅
- [ ] Login funcionando
- [ ] Middleware protegiendo rutas
- [ ] Redirect por rol funcionando
- [ ] Recuperación de contraseña funcionando

### Funcionalidades Usuario ✅
- [ ] Dashboard con estado de membresía real
- [ ] Formulario de rutina con validación
- [ ] Generación de rutina con IA funcionando
- [ ] Rutina guardada y visible después de refresh
- [ ] Descarga de PDF funcionando
- [ ] Biblioteca de ejercicios con filtros
- [ ] Edición de perfil

### Panel Admin ✅
- [ ] Lista de usuarios
- [ ] Renovación de membresía
- [ ] Habilitar nueva rutina
- [ ] Gestión de ejercicios

### UI/UX ✅
- [ ] Probado en iPhone (Safari)
- [ ] Probado en Android (Chrome)
- [ ] Bottom nav funcionando correctamente
- [ ] Loading states en todas las acciones
- [ ] Mensajes de error claros

---

## 📝 Notas Finales

### Orden Recomendado para Comenzar HOY
1. Crea el proyecto Next.js y haz el primer deploy en Vercel (aunque esté vacío)
2. Crea el proyecto en Supabase y conecta las variables de entorno
3. Implementa el login y protección de rutas → esto desbloquea todo lo demás
4. Una vez el auth funciona, trabaja en la base de datos
5. Después, trabaja módulo por módulo comenzando por el más simple

### Recursos Esenciales
- Docs Supabase + Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Docs shadcn/ui: https://ui.shadcn.com
- Docs Claude API: https://docs.anthropic.com
- Docs jsPDF: https://artskydj.github.io/jsPDF/docs/

### Tips de Desarrollo
- Usa el emulador de dispositivos de Chrome DevTools para mobile
- Prueba en dispositivo real lo antes posible (el comportamiento del teclado virtual es diferente)
- Guarda versiones del prompt en un archivo separado y ve refinándolo
- El primer usuario admin créalo directamente en el panel de Supabase, no en la app

---

*Documento generado para el proyecto GymApp · Stack: Next.js 14 + Supabase + Claude AI*