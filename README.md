# FitBoch — Aplicación de Gimnasio con IA

Applicación web móvil-first para gestión de membresías de gimnasio con generación de rutinas personalizadas usando Inteligencia Artificial (OpenRouter + DeepSeek).

---

## Características

- **Autenticación**: Login con email/contraseña mediante Supabase Auth
- **Panel de Usuario**:
  - Dashboard con estado de membresía
  - Rutina personalizada generada con IA
  - Biblioteca de ejercicios
  - Perfil personal
  - Plan nutricional
- **Panel de Administración**:
  - Gestión de usuarios y membresías
  - Control de rutinas (habilitar renovaciones)
  - Biblioteca de ejercicios (CRUD)
  - Métricas básicas

---

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL + RLS) |
| IA | OpenRouter (DeepSeek V4 Pro) |
| Autenticación | Supabase Auth |

---

## Requisitos Previos

- Node.js 18+
- pnpm (gestor recomendado)
- Cuenta de Supabase
- Cuenta de OpenRouter (https://openrouter.ai/keys) con saldo o API key válida

---
e
## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd fitboch

# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Copia .env.local y completa los valores

# Iniciar servidor de desarrollo
pnpm dev
```

---

## Variables de Entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# OpenRouter AI (https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=deepseek/deepseek-v4-pro
# Opcional: para rankings de OpenRouter (sin afectar funcionalidad)
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_TITLE=FitBoch

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Construir para producción |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm lint` | Ejecutar eslint |
| `pnpm tsc --noEmit` | Verificar tipos |

---

## Estructura del Proyecto

```
fitboch/
├── app/                    # Next.js App Router
│   ├── (admin)/          # Rutas de administración
│   ├── (auth)/           # Rutas de autenticación
│   ├── (usuario)/        # Rutas de usuario
│   └── api/              # API Routes
├── components/           # Componentes React
├── lib/                  # Utilidades y clientes
│   ├── supabase/         # Clientes Supabase
│   └── ai/               # Integración con IA
└── types/                # Tipos TypeScript
```

---

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso completo al panel de administración |
| `usuario` | Acceso al dashboard personal |

---

## Flujo de Generación de Rutina

1. El admin habilita la renovación desde el panel
2. El usuario completa el formulario de datos
3. La app envía los datos a la API de Gemini
4. La IA genera una rutina personalizada
5. La rutina se guarda en la base de datos
6. El usuario puede verla y descargar en PDF

---

## Despliegue

### Vercel (Recomendado)

1. Conectar el repositorio en vercel.com
2. Agregar las variables de entorno
3. Hacer deploy desde la rama main

### Auto-alojamiento

El proyecto es compatible con cualquier hosting que soporte Next.js:
- Railway, Render, DigitalOcean App Platform
- Contenedores Docker

---

## Contribuir

1. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
2. Hacer commit de los cambios
3. Push a la rama
4. Crear Pull Request

---

## Licencia

MIT