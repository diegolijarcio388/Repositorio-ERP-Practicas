# Modulo Vacaciones

## Endpoints

- `GET /api/vacations/me`
- `POST /api/vacations/request` body `{ days: ["YYYY-MM-DD"] }`
- `GET /api/vacations/department`
- `POST /api/vacations/department/:id/approve`
- `POST /api/vacations/department/:id/reject`
- `GET /api/vacations/blocks`
- `POST /api/vacations/blocks`
- `DELETE /api/vacations/blocks/:id`
- `GET /api/vacations/admin`
- `POST /api/vacations/admin/manual`
- `POST /api/vacations/admin/fixed-by-department`
- `GET /api/vacations/admin/export.xlsx`
- `GET /api/calendar/events`
- `POST /api/calendar/events`
- `PATCH /api/calendar/events/:id`
- `DELETE /api/calendar/events/:id`

## Permisos

- `worker`: `vacations/me`, `vacations/request`, lectura de bloques y calendario.
- `coordinator`: worker + `vacations/department`, aprobar/rechazar, crear/borrar bloques.
- `admin`: global + CRUD de calendario, export XLSX y alta manual.

## Variables

- `MYSQL_URL` o `DATABASE_URL`

## Migraciones y seeds

- `npm run db:migrate`
- `npm run db:seed`

## Probar local

1. Login con:
- `admin@example.com` (admin)
- `responsable@example.com` (coordinator)
- `ana.worker@example.com` (worker)
2. Worker: `http://localhost:4321/vacaciones`
3. Coordinator: `http://localhost:4321/vacaciones-departamento`
4. Admin vacaciones: `http://localhost:4321/admin/vacaciones`
5. Admin calendario: `http://localhost:4321/admin/calendario`
