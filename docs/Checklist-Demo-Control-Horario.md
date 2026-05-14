# Checklist de demo - Control Horario

Fecha: 06/05/2026

Este guion está pensado para enseñar el bloque de Control Horario de forma rápida, ordenada y sin perderse entre pantallas.

## 1. Entrada y contexto

- Abrir `Mi control horario`.
- Explicar en una frase qué controla este módulo:
  - presencia, jornada, incidencias y flujos de revisión

## 2. Flujo de trabajador

- Mostrar el bloque de fichaje actual.
- Enseñar el calendario e indicar que permite consultar histórico por día.
- Abrir `Mis solicitudes`.
- Enseñar el menú unificado:
  - `Todas`
  - `Fichajes`
  - `Incidencias`
  - `Permisos`

## 3. Solicitud de fichaje anterior

- Crear o enseñar una solicitud de fichaje anterior.
- Explicar las validaciones ya activas:
  - no se permiten fechas futuras
  - no se permite salida sin entrada previa abierta
  - no se permite entrada en una franja ya cubierta

## 4. Justificación de incidencias

- Enseñar una incidencia justificable.
- Mostrar cómo se envía una justificación.
- Explicar que no todas las incidencias se pueden justificar, solo las permitidas por regla de negocio.

## 5. Permisos y teletrabajo

- Abrir el modal de `Pedir teletrabajo o permiso`.
- Mostrar que el trabajador puede solicitar ambos desde el mismo punto.
- Comentar las validaciones importantes:
  - no se pueden solicitar días anteriores
  - no se pueden duplicar solicitudes activas del mismo tipo para la misma fecha

## 6. Flujo de coordinador

- Entrar en `Gestión de control horario` con perfil coordinador.
- Mostrar que su vista está recortada respecto al admin.
- Enseñar que revisa:
  - incidencias
  - permisos/teletrabajo
- Comentar que no gestiona fichajes si no tiene permisos administrativos del módulo.

## 7. Flujo de administrador

- Entrar en `Gestión de control horario` con perfil admin o con permiso funcional global.
- Mostrar el menú completo:
  - `Todas las solicitudes`
  - `Fichajes`
  - `Incidencias`
  - `Registros`
  - `Permisos`
  - `Redes confiables`
- Enseñar una revisión en segundo nivel (`PENDING_ADMIN`).

## 8. Registros y seguimiento

- Mostrar `Registros` y sus filtros:
  - fecha desde/hasta
  - hora desde/hasta
  - trabajador
  - validación
- Mostrar el seguimiento diario:
  - fichados
  - no fichados
  - exclusiones
  - teletrabajo autorizado

## 9. Validación de perfiles

- Probar un coordinador sin `canManageTimeControlRequests`.
- Confirmar que:
  - entra en `Gestión de control horario`
  - ve `Incidencias`
  - ve `Permisos`
  - no ve `Fichajes`
  - no ve `Registros`
  - no ve `Redes confiables`
  - no puede aprobar elementos en estado `PENDING_ADMIN`

- Probar un usuario con `canManageTimeControlRequests`.
- Confirmar que:
  - ve el menú completo de gestión
  - puede revisar fichajes
  - puede ver registros del equipo
  - puede actuar sobre elementos en estado `PENDING_ADMIN`
  - puede gestionar redes confiables
  - no queda limitado al ámbito departamental en el bloque

## 10. Checklist de prueba - Redes confiables

### 10.1 Alta de una IP exacta

- Entrar en `Gestión de control horario > Redes confiables`.
- Crear una red con:
  - nombre reconocible
  - tipo `IP exacta`
  - una IP válida
  - estado activa
- Confirmar que aparece en el listado.

Resultado esperado:
- se guarda sin error
- aparece en tabla con estado `Activa`

### 10.2 Alta de un rango CIDR

- Crear una segunda red con:
  - tipo `Rango CIDR`
  - valor tipo `192.168.1.0/24`
- Confirmar que queda registrada.

Resultado esperado:
- el sistema acepta el formato CIDR válido
- aparece etiquetada como `Rango CIDR`

### 10.3 Validación de errores

- Intentar crear una red sin nombre.
- Intentar crear una IP exacta con valor inválido.
- Intentar crear un CIDR inválido.

Resultado esperado:
- el formulario no se guarda
- aparece mensaje de error claro

### 10.4 Edición

- Editar una red ya creada.
- Cambiar nombre, descripción o valor.

Resultado esperado:
- los cambios se guardan
- la fila muestra el nuevo contenido
- la fecha de actualización cambia

### 10.5 Activación y desactivación

- Desactivar una red activa.
- Volver a activarla.

Resultado esperado:
- cambia el badge de `Activa` a `Inactiva`
- el botón cambia entre `Activar` y `Desactivar`
- no se elimina el registro, solo cambia su estado

### 10.6 Impacto funcional en fichajes nuevos

- Con una IP/red confiable activa, realizar un fichaje nuevo desde esa red.
- Revisar el resultado en `Registros`.

Resultado esperado:
- si la ubicación y el dispositivo también encajan, la validación puede subir a `Correcta`

- Desactivar esa red y repetir un fichaje nuevo equivalente.

Resultado esperado:
- el sistema deja de tratar esa red como confiable para fichajes futuros
- el fichaje puede pasar a `Revisar` si ya no hay otra coincidencia confiable

### 10.7 Prioridad entre BD y variable de entorno

- Si existe una coincidencia en base de datos, revisar que esa sea la fuente principal.
- Si no existe coincidencia en BD, comprobar que el sistema todavía puede usar `TIME_CONTROL_TRUSTED_IP_RANGES` como respaldo.

Resultado esperado:
- la BD manda
- la variable de entorno sigue actuando como fallback temporal

## 11. Cierre funcional

- Resumir el flujo completo:
  - trabajador crea
  - coordinador revisa primer nivel
  - admin funcional o admin del ERP resuelve el nivel final cuando aplica
  - la validación del fichaje ya tiene en cuenta geolocalización, dispositivo e IP/red confiable

## 12. Mensaje final recomendado

Puedes cerrar con algo así:

> El bloque ya cubre el flujo principal de fichaje, revisión de incidencias, gestión de permisos y una primera capa de validación contextual del fichaje. A partir de aquí, lo siguiente sería seguir afinando negocio y la administración de redes confiables con más detalle si hace falta.
