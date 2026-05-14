# CLAUDE.md — Cetemet Control Web

## Descripción del proyecto

Aplicación ERP interna para **CETEMET** (centro tecnológico). Gestiona proyectos, imputación de horas, vacaciones y calendarios. Stack: **Astro 6 (SSR) + React 19 + MySQL 2 + TypeScript 5 + Tailwind 4**.

## Arquitectura

**Hexagonal (Ports & Adapters)** con strict module isolation:

- `src/core/` — infraestructura compartida, contratos (puertos), DI container
- `src/modules/<name>/` — módulos aislados: cada uno tiene `domain/`, `repositories/`, `services/`, `ui/`
- `src/features/<name>/` — componentes React de alto nivel que usan módulos
- `src/shared/ui/` — componentes UI genéricos (Button, Modal, Table, Toast…)
- `src/pages/` — rutas Astro (SSR) + `src/pages/api/` para endpoints REST
- `src/layouts/AppLayout.astro` — layout principal con guards de auth

**Reglas de dependencia:**
- Los módulos pueden importar de `core/` y `shared/`, NO entre sí
- `shared/` no tiene dependencias de módulos
- Los puertos (`core/ports/`) son las interfaces; los módulos implementan los adaptadores

## Módulos

| Módulo | Propósito |
|--------|-----------|
| `auth` | Login por email, sesión en cookie `ccw_session` (30 días) |
| `rbac` | Guards de API: `requireApiUser()`, `ensureRole()` |
| `projects` | CRUD de proyectos, paquetes de trabajo, tareas, asignaciones |
| `time` | Imputación de horas a proyectos y categorías internas |
| `assignments` | Asignación de usuarios a proyectos/tareas |
| `vacations` | Solicitudes de vacaciones (full-day y por horas), flujo de aprobación |
| `calendar` | Eventos y festivos del calendario |
| `notifications` | Bandeja de notificaciones de usuario |
| `export` | Exportación a XLSX (vacaciones) |
| `reporting` | Dashboards y analítica |

## Base de datos (MySQL)

Migraciones en `db/migrations/` — ejecutar con `npm run db:migrate`:

| Migración | Contenido |
|-----------|-----------|
| 001–006 | Módulo de vacaciones: `departments`, `users`, `vacation_requests`, `vacation_blocks`, `calendar_events`, `notifications` |
| 007 | Módulo de proyectos: `projects`, `project_work_packages`, `project_tasks`, `project_assignments`, `project_task_assignments`, `project_time_entries`, `internal_time_entries`, `project_budget_partitions`, `project_expenses` |

Conexión: variable de entorno `MYSQL_URL` (ej: `mysql://root:root@localhost:3306/cetemet_control`).

## Roles y autenticación

**Roles en `users.role`:** `worker`, `coordinator`, `admin`

**Auth en desarrollo:** mock por email en `src/modules/auth/services/auth.service.ts`
- `admin@example.com` → admin
- `responsable@example.com` → coordinador
- Resto → worker

**Guards de página:** `requireAuth()` / `requireAdmin()` en el frontmatter de las páginas Astro.

**Guards de API:** `requireApiUser()` en `src/modules/rbac/services/api-auth.ts` — parsea la cookie y carga el usuario desde MySQL.

## Contexto multi-año

El año activo se guarda en localStorage (`app_year`, default 2026). Los repositorios reciben `year: number`. Años soportados: 2026, 2027, 2028.

## Proyectos — detalles clave (migration 007)

- **`hour_tracking_mode`**: `GENERAL` (presupuesto total) vs `STRUCTURED` (WBS con paquetes y tareas)
- **`project_assignments`**: controla qué usuarios ven el proyecto
- **`project_task_assignments`**: controla en qué tareas puede imputar cada usuario
- **`internal_time_entries`**: categorías internas fijas (FORMACION_RECIBIDA, VACACIONES, BAJA_LABORAL, PERMISO_MEDICO, ASUNTOS_PROPIOS, etc.)
- **`project_expenses`**: flujo PENDING → APPROVED / REJECTED con revisor y motivo de rechazo
- **`project_budget_partitions`**: partidas presupuestarias (Viajes, Personal, Materiales…)

## Scripts útiles

```bash
npm run dev          # Servidor de desarrollo
npm run db:migrate   # Ejecutar todas las migraciones SQL
npm run db:seed      # Poblar datos de prueba
npm run test         # Vitest (unit tests)
npm run lint         # astro check (TypeScript)
npm run build        # Build de producción
```

## Convenciones de código

- IDs: `VARCHAR(64)`, generados en la capa de servicio (no auto-increment)
- Fechas: `DATETIME(3)` para timestamps, `DATE` para fechas de negocio
- API responses: wrapper en `src/core/server/api-handler.ts` y `api-response.ts`
- Nombres de archivos: kebab-case; componentes React: PascalCase
- Idioma del código: inglés (variables, funciones); UI y comentarios: español

## Estado actual del desarrollo

- Módulo de vacaciones: completo y funcional
- Módulo de proyectos (migration 007): migración ejecutada, implementación en curso
  - Repositorios, servicios y APIs de proyectos creados
  - Workspaces por rol: Admin (`AdminProjectsWorkspace`), Coordinador (`CoordinatorProjectsWorkspace`), Worker (`WorkerProjectsWorkspace`)
