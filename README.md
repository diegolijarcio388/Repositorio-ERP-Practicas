# cetemet-control-web

Base ERP modular en Astro + React Islands.

## Stack

- Astro + TypeScript strict
- React para islas interactivas
- Tailwind CSS v4
- Persistencia mock en localStorage (modulos legacy) + MySQL para Vacaciones/API
- Output Astro en modo `server` con `@astrojs/node` para que los guards por cookie funcionen en runtime.

## Comandos

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`

## Rutas

- `/login`
- `/dashboard`
- `/proyectos`
- `/horas`
- `/reporting`
- `/vacaciones`
- `/vacaciones-departamento`
- `/admin/usuarios`
- `/admin/configuracion`
- `/admin/vacaciones`
- `/admin/calendario`

## Arquitectura modular

```text
src/
  core/      -> contratos compartidos, guards, DI, storage, year-context
  shared/    -> UI y utilidades realmente reutilizables
  modules/
    auth/
    projects/
    time/
    admin/
    reporting/
  pages/     -> composicion Astro (layout + islas)
  layouts/
```

### Reglas de dependencias

- Un modulo puede depender de `src/core` y `src/shared`.
- Un modulo no puede importar desde otro modulo.
- `src/shared` no depende de modulos.
- Las paginas Astro no contienen logica de negocio; solo ensamblan layout + feature.
- Contratos entre capa de aplicacion y adapters definidos en `src/core/ports`.

## Ports & Adapters (actual)

- `core/ports/AuthProvider`
- `core/ports/ProjectsRepository`
- `core/ports/TimeEntriesRepository`

Implementaciones actuales:

- `modules/auth/services/auth.service.ts`
- `modules/projects/services/projects.repository.ts`
- `modules/time/services/time.repository.ts`

Wiring centralizado en `src/core/di/container.ts`.
Politica de imputacion de horas en `src/core/services/time-entry-policy.service.ts`:
el usuario debe estar asignado al proyecto para poder registrar horas.

## Año transversal

- Contexto en `src/core/year/year-context.ts`:
  - `getYear()`
  - `setYear(year)`
  - `subscribeYearChange(cb)`
- Persistencia namespaced en localStorage.
- Selector en topbar (2026, 2027, 2028).
- Al cambiar de año se refrescan listados de proyectos y horas.

## Auth y guards

- Login mock por email:
  - `admin@example.com` -> `Admin`
  - `responsable@example.com` -> `Responsable`
  - resto -> `Empleado`
- Guard auth: si no hay sesion, redirige a `/login`.
- Guard admin: `/admin/*` solo para `Admin`.
- En `horas`, filtro por usuario solo para `Admin` y `Responsable`.

## Datos seed

- Projects: 3 registros en 2026, 2 en 2027.
- Time entries: 10 registros distribuidos en 2026/2027.

## Como añadir un modulo nuevo sin tocar otros

1. Crear `src/modules/<nuevo>/` con subcarpetas `domain`, `services`, `ui`, `pages`.
2. Definir contratos nuevos en `src/core/ports` solo si necesitas integrar infraestructura.
3. Implementar adapter del modulo en `services`.
4. Exportar API publica minima en `src/modules/<nuevo>/index.ts`.
5. Componer ruta Astro en `src/pages/...` usando layout + isla del modulo.
6. Registrar dependencias en `src/core/di/container.ts` sin modificar otros modulos.

## Migrar localStorage a API (sin romper modulos)

1. Mantener interfaces en `src/core/ports` sin cambios.
2. Crear nuevos adapters HTTP en `modules/<modulo>/services/*`.
3. Cambiar solo el binding en `src/core/di/container.ts`.
4. UI y paginas no se tocan, porque consumen el port, no la implementacion concreta.

## Variables de entorno

Archivo `.env.example`:

```env
API_BASE_URL=http://localhost:3001
MYSQL_URL=mysql://root:root@localhost:3306/cetemet_control
```

## Base de datos MySQL (modulo Vacaciones)

- `npm run db:migrate`
- `npm run db:seed`
