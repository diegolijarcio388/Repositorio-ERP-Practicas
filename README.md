# ERP interno — Astro

Aplicación web desarrollada sobre una base de código existente durante mis prácticas en CETEMET.

El proyecto está orientado a la gestión interna de empleados, proyectos, control horario, vacaciones y administración.

La versión pública del repositorio ha sido adaptada para portfolio utilizando datos ficticios de demostración.

## 🚀 Funcionalidades principales

- Gestión de usuarios y departamentos.
- Gestión de proyectos, tareas y asignaciones.
- Registro e imputación de horas.
- Control horario y turnos de trabajo.
- Gestión de vacaciones y solicitudes.
- Paneles de administración.
- Reporting.
- Control de acceso según rol.
- Persistencia de datos con MySQL.
- Datos de demostración mediante seed.

## 🛠️ Stack

- Astro
- TypeScript
- React
- JavaScript
- Tailwind CSS
- MySQL
- mysql2/promise
- Node.js
- npm

## 🧱 Arquitectura

El proyecto sigue una estructura modular con separación entre lógica compartida, módulos funcionales, servicios y adaptadores.

```text
src/
  core/
  shared/
  modules/
    auth/
    projects/
    time/
    admin/
    reporting/
  pages/
  layouts/

La aplicación utiliza contratos y adaptadores para desacoplar la lógica de negocio de las implementaciones concretas de persistencia y acceso a datos.

🗄️ Base de datos

El proyecto incluye persistencia en MySQL y migraciones SQL almacenadas en:

db/migrations/

Para aplicar las migraciones:

npm run db:migrate
🌱 Datos de demostración

El repositorio incluye un seed con datos ficticios para poder probar la aplicación.

npm run db:seed

El seed incluye usuarios, departamentos, proyectos, tareas, asignaciones, imputaciones de horas, vacaciones y datos de control horario.

⚙️ Instalación
git clone https://github.com/diegolijarcio388/Repositorio-ERP-Practicas.git
cd Repositorio-ERP-Practicas
npm install

Crea un archivo .env a partir de .env.example.

API_BASE_URL=http://localhost:3001
MYSQL_URL=mysql://root:root@localhost:3306/cetemet_control

Después:

npm run db:migrate
npm run db:seed
npm run dev
📜 Scripts
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run db:migrate
npm run db:seed
🔐 Roles y acceso

La aplicación dispone de distintos niveles de acceso para administración, coordinación y empleados.

Las funcionalidades y rutas disponibles varían según el rol del usuario.

📂 Principales rutas
/login
/dashboard
/proyectos
/horas
/reporting
/vacaciones
/vacaciones-departamento
/admin/usuarios
/admin/configuracion
/admin/vacaciones
/admin/calendario
ℹ️ Contexto del proyecto

Proyecto desarrollado durante mis prácticas de DAM sobre una aplicación ERP existente.

La versión publicada en GitHub está adaptada para portfolio y utiliza únicamente datos ficticios de demostración.
