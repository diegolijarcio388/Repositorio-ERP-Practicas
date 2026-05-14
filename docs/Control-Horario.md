# Documentación consolidada y estado actual del módulo de Control Horario

Fecha de actualización: 04/05/2026

Este documento pasa a ser la referencia única del bloque de Control Horario.

Incluye en un solo sitio:

- documentación funcional
- documentación técnica
- estado actual real del desarrollo
- reglas de negocio activas
- alcance de roles y permisos
- mejoras futuras pendientes

Se consolida a partir de:

- `Análisis_funcional_ERP.docx`
- `Análisis_técnico_ERP.docx`
- `Justificación_técnica_ERP.docx`
- `Manual_breve_uso.docx`
- `Mejoras_futuras.docx`
- `Pruebas_realizadas.docx`
- el estado real actualmente implementado en el proyecto

## 1. Objetivo del módulo

El módulo de Control Horario permite registrar la jornada laboral dentro del ERP, consultar el histórico de fichajes, detectar incidencias básicas de forma automática y gestionar flujos de revisión sobre:

- solicitudes de fichaje anterior
- justificaciones de incidencias
- solicitudes de teletrabajo y permiso

El módulo está separado conceptualmente de la imputación de horas a proyectos. Su objetivo no es medir dedicación por tarea, sino controlar presencia, jornada efectiva y trazabilidad administrativa.

## 2. Alcance funcional actual

### 2.1 Vista de trabajador

La vista de trabajador está dividida en dos pantallas principales:

- `Mi control horario`
- `Mis solicitudes de control horario`

Desde `Mi control horario`, el usuario puede:

- fichar entrada o salida
- consultar el estado actual de su jornada
- ver el resumen mensual
- navegar por el calendario de registros
- abrir el detalle de un día concreto
- solicitar un fichaje anterior
- solicitar teletrabajo o permiso
- consultar ayuda de ubicación

Desde `Mis solicitudes de control horario`, el usuario dispone de un menú unificado por pestañas con cuatro bloques:

- `Todas`
- `Fichajes`
- `Incidencias`
- `Permisos`

Ahí puede consultar:

- solicitudes de fichaje enviadas
- incidencias justificables y sus justificaciones
- solicitudes de teletrabajo/permiso
- comentarios de revisión y estado de cada flujo

### 2.2 Vista de gestión

La pantalla `Gestión de control horario` concentra la supervisión para perfiles con permisos de revisión.

Actualmente existe una bandeja unificada con pestañas:

- `Todas las solicitudes`
- `Fichajes`
- `Incidencias`
- `Registros`
- `Permisos`

No todos los perfiles ven las mismas pestañas:

- Admin:
  - ve todos los flujos
  - accede a registros de equipo
  - accede al seguimiento diario
- Coordinador sin permisos de administración:
  - revisa incidencias y permisos de su ámbito
  - no revisa solicitudes de fichaje
  - no tiene acceso completo a registros globales

## 3. Roles y permisos

### 3.1 Trabajador

Puede:

- registrar entrada y salida
- ver su histórico
- enviar solicitudes de fichaje anterior
- justificar incidencias permitidas
- pedir teletrabajo o permiso
- consultar el estado de sus solicitudes

### 3.2 Coordinador

Puede:

- revisar incidencias justificadas de su ámbito
- revisar solicitudes de teletrabajo y permiso de su ámbito
- realizar el primer paso del flujo cuando corresponde

Restricciones actuales del modelo:

- no gestiona solicitudes de fichaje si no tiene permisos adicionales
- no actúa como administrador global
- su alcance está acotado al conjunto de usuarios permitido por departamento

### 3.3 Administrador

Puede:

- revisar solicitudes de fichaje en paso admin
- revisar incidencias en paso admin
- revisar permisos y teletrabajo en paso admin
- consultar registros del equipo
- usar filtros avanzados
- acceder al seguimiento diario

### 3.4 Decisión funcional sobre `canManageTimeControlRequests`

Como criterio funcional del módulo, se acuerda interpretar `canManageTimeControlRequests` como un permiso de administración funcional global del bloque de Control Horario.

Esto implica que un usuario con este permiso debe poder:

- acceder a `Gestión de control horario`
- revisar solicitudes de fichaje
- revisar incidencias justificadas
- revisar permisos y teletrabajo
- consultar registros del equipo
- utilizar el seguimiento diario completo

Este permiso se debe entender como un "admin del módulo", aunque el usuario no sea administrador global del ERP.

### 3.5 Decisión funcional sobre coordinador normal

El coordinador que no disponga de `canManageTimeControlRequests` debe quedarse como perfil intermedio limitado a su ámbito.

Su alcance funcional esperado es:

- revisar incidencias justificadas de su ámbito
- revisar permisos y teletrabajo de su ámbito
- participar en el primer nivel de revisión cuando aplique

Y no debe:

- revisar solicitudes de fichaje como flujo administrativo completo
- ver registros globales de todo el equipo como un admin funcional
- salir del alcance de su departamento o ámbito asignado

## 4. Arquitectura y enfoque técnico

Se mantiene una arquitectura cliente-servidor con lógica de negocio centralizada en backend y persistencia en base de datos relacional.

Capas principales:

- presentación
- API
- servicios
- repositorios
- persistencia

Este enfoque sigue siendo el adecuado porque permite:

- centralizar validaciones
- mantener coherencia de permisos por rol
- evitar que la interfaz sea la fuente de verdad
- dejar trazabilidad de revisiones y comentarios
- evolucionar el módulo sin romper la base actual

## 5. Modelo de datos funcional

### 5.1 Registros de jornada

La entidad base sigue siendo `workday_records`, donde se almacena:

- usuario
- fecha de trabajo
- hora de entrada
- hora de salida
- estado de jornada
- minutos trabajados
- minutos extra
- flags de incidencia
- coordenadas de entrada y salida

Estados principales:

- `OPEN`
- `COMPLETED`
- `INCOMPLETE`
- `INCIDENT`

### 5.2 Solicitudes de fichaje

El flujo de regularización de fichajes usa solicitudes separadas del registro diario real.

Estados actualmente usados:

- `PENDING_COORDINATOR`
- `PENDING_ADMIN`
- `APPROVED`
- `REJECTED`

La aprobación final como admin aplica el cambio sobre `workday_records`.

### 5.3 Justificaciones de incidencia

Las incidencias justificables también viven en una entidad propia y siguen doble revisión:

- coordinador
- admin

Solo se admiten incidencias concretas como justificables.

### 5.4 Solicitudes de teletrabajo y permiso

Se gestionan como flujos diferenciados, pero en la interfaz se presentan de forma unificada bajo el bloque de `Permisos`.

En la práctica, la pantalla unifica:

- solicitudes de teletrabajo
- solicitudes de permiso

## 6. Reglas de negocio actualmente cubiertas

### 6.1 Fichaje

- no puede existir una segunda jornada abierta simultánea
- el fichaje depende de geolocalización disponible
- se valida si el fichaje cae fuera de horario permitido
- se valida si el fichaje se realiza fuera del punto permitido

### 6.2 Solicitudes de fichaje anterior

- no se permiten fechas futuras
- no se puede pedir una salida sin una entrada abierta previa
- no se puede pedir una entrada dentro de una franja ya cubierta por otra jornada
- la revisión se hace por pasos según rol

### 6.3 Justificación de incidencias

Solo se pueden justificar incidencias con flags permitidos. Actualmente el flujo contempla:

- `DURATION_TOO_SHORT`
- `DURATION_TOO_LONG`
- `OUT_OF_SCHEDULE`
- `OUT_OF_ALLOWED_LOCATION`

### 6.4 Teletrabajo y permiso

- no se pueden solicitar fechas anteriores al día actual
- se exige motivo
- siguen flujo de revisión
- su resultado impacta en el seguimiento diario y exclusiones
- no debe permitirse más de una solicitud activa del mismo tipo para el mismo usuario y la misma fecha

### 6.5 Regla funcional sobre duplicados de solicitud

Para mantener coherencia de revisión e informes, se acuerda que no deben existir duplicados activos para un mismo usuario, mismo día y mismo flujo de solicitud.

Aplicación esperada:

- si ya existe una solicitud `PENDING_COORDINATOR` o `PENDING_ADMIN`, no debe permitirse otra igual
- si la solicitud anterior está `REJECTED`, sí puede permitirse una nueva
- si la solicitud anterior está `APPROVED`, no debería abrirse otra del mismo tipo para esa fecha

Esta regla debe aplicarse especialmente en:

- teletrabajo
- permiso
- fichajes retroactivos, donde ya existe control de duplicidad

## 7. Geolocalización y dispositivo

### 7.1 Objetivo de esta fase

En esta fase, el objetivo no es bloquear de forma agresiva el fichaje, sino registrar suficiente contexto para:

- saber desde qué dispositivo se ficha
- saber desde qué IP se ficha
- contrastar si la ubicación es válida
- detectar casos anómalos
- dejar trazabilidad para revisión posterior

### 7.2 Principio general de funcionamiento

Regla general:

- si el fichaje tiene datos mínimos correctos, debe poder registrarse
- si el contexto es sospechoso, debe quedar marcado como incidencia o anomalía
- solo se bloquea cuando faltan datos esenciales o la petición es inválida

### 7.3 Tipos de dispositivo reconocidos

El sistema distinguirá estos tipos:

- `TABLET`
- `MOBILE`
- `DESKTOP`
- `UNKNOWN`

Interpretación inicial:

- `TABLET` y `MOBILE` son dispositivos esperables para fichar
- `DESKTOP` y `UNKNOWN` no bloquean por sí mismos en esta fase, pero deben tratarse como anómalos

Nota importante:

- el tipo de dispositivo se obtiene por detección desde navegador
- por tanto, debe interpretarse como `dispositivo detectado por navegador`
- no equivale a una identificación infalible del hardware real
- se usa como señal de contexto, no como prueba absoluta

### 7.4 Política funcional por usuario

Cada usuario podrá tener una política de fichaje por dispositivo:

- solo `TABLET`
- solo `MOBILE`
- `TABLET` y `MOBILE`

En esta fase no se exige todavía bloqueo automático por desviación de la política. Si el dispositivo real no coincide con el esperado:

- el fichaje puede completarse
- el sistema debe registrar la discrepancia
- la discrepancia podrá convertirse en incidencia revisable

### 7.5 IP y entorno de instalaciones

Se considerará entorno confiable de instalaciones cuando el fichaje proceda de:

- una IP conocida o rango de IPs autorizado
- y, preferiblemente, desde una `TABLET`

En esta fase:

- la IP confiable suma contexto positivo
- una IP no reconocida no bloquea por sí sola
- una IP inesperada debe poder verse en gestión

### 7.6 Regla de geolocalización

La geolocalización sigue siendo el factor principal.

Reglas:

- si la ubicación está dentro del punto permitido, el fichaje es geográficamente correcto
- si la ubicación está fuera del punto permitido, el fichaje puede registrarse pero debe marcarse como incidencia
- si no hay coordenadas utilizables, el fichaje no debe completarse

### 7.7 Fichaje desde móvil

En esta primera iteración:

- fichar desde `MOBILE` no bloquea automáticamente
- si el usuario no tiene permitido el uso de móvil, debe registrarse como contexto anómalo
- el motivo explícito de fichaje desde móvil queda como mejora de una fase posterior

### 7.8 Tabla de decisiones

| Caso | Resultado esperado |
| --- | --- |
| Ubicación válida + dispositivo esperado | Fichaje normal |
| Ubicación válida + dispositivo no esperado | Fichaje permitido + anomalía/incidencia |
| Ubicación válida + `DESKTOP` o `UNKNOWN` | Fichaje permitido + anomalía/incidencia |
| Ubicación fuera de zona + dispositivo esperado | Fichaje permitido + incidencia de ubicación |
| Ubicación fuera de zona + dispositivo no esperado | Fichaje permitido + incidencia reforzada |
| Sin coordenadas o coordenadas inválidas | Fichaje bloqueado |
| IP confiable + `TABLET` | Contexto positivo |
| IP no confiable + ubicación válida | Fichaje permitido + trazabilidad |

### 7.9 Casos que generan incidencia

Sin bloquear de primeras, deben poder marcarse como incidencia:

- fichaje fuera del punto permitido
- fichaje desde dispositivo no esperado
- fichaje desde `DESKTOP`
- fichaje desde `UNKNOWN`
- fichaje desde IP no reconocida cuando se esperaba entorno interno

### 7.10 Casos que sí deben bloquear

En esta fase solo se bloqueará cuando:

- no haya permisos de ubicación
- falten coordenadas
- las coordenadas sean inválidas o corruptas
- la petición llegue sin datos mínimos necesarios

### 7.11 Fases de implementación previstas

1. Guardar dispositivo e IP en cada fichaje.
2. Definir política de dispositivo permitida por usuario.
3. Comparar el dispositivo real con la política esperada.
4. Reflejar anomalías como incidencias o contexto de revisión.
5. Mostrar dispositivo e IP en la vista de gestión.
6. Valorar motivo obligatorio para fichajes desde móvil en una fase posterior.

### 7.12 Decisión consolidada sobre confianza del fichaje

Como criterio funcional del módulo, se acuerda esta lectura:

- sin ubicación válida, no hay fichaje
- con ubicación válida, el fichaje puede existir
- el dispositivo y la IP no deciden si el fichaje existe, sino el nivel de confianza con el que se interpreta

Se definen cuatro niveles de confianza:

- `ALTA`
- `MEDIA`
- `BAJA`
- `INVÁLIDA`

Interpretación acordada:

- `ALTA`: ubicación válida + dispositivo esperado + IP confiable o contexto claramente interno
- `MEDIA`: ubicación válida + dispositivo esperado + IP desconocida
- `BAJA`: ubicación válida + dispositivo no esperado, o dispositivo `DESKTOP` o `UNKNOWN`, o contexto de red anómalo
- `INVÁLIDA`: sin coordenadas, con coordenadas inválidas o con datos mínimos corruptos

Resultado operativo:

- `ALTA`: fichaje normal
- `MEDIA`: fichaje permitido con trazabilidad
- `BAJA`: fichaje permitido con incidencia o anomalía
- `INVÁLIDA`: fichaje bloqueado

Esto refuerza la decisión principal de esta fase:

- la geolocalización es la condición fuerte
- el dispositivo detectado es una señal contextual
- la IP es una señal secundaria de confianza, no una identidad absoluta del dispositivo

### 7.13 Mini especificación funcional: redes e IPs confiables

#### Objetivo

Permitir que la confianza de red del fichaje no dependa solo de una variable de entorno técnica, sino también de una configuración administrable desde el propio módulo.

Esta fase busca:

- dar autonomía al administrador funcional del bloque
- facilitar altas, bajas o cambios de red sin tocar código
- mantener coherencia entre la lógica de confianza y la operativa diaria
- dejar preparada una base más sólida para futuras sedes o dispositivos corporativos

#### Problema que resuelve

Actualmente la confianza alta de red depende de `TIME_CONTROL_TRUSTED_IP_RANGES`.

Eso sirve como arranque técnico, pero tiene limitaciones:

- obliga a tocar configuración técnica para cualquier cambio
- no deja trazabilidad funcional de qué red se consideró confiable
- complica pruebas o ampliaciones a nuevas sedes
- mezcla una decisión de negocio con una decisión de despliegue

#### Alcance funcional de la primera versión

La primera versión debe ser simple y operativa.

Debe permitir:

- listar redes/IPs confiables activas e inactivas
- dar de alta una IP exacta
- dar de alta un rango CIDR
- editar nombre, descripción y activación
- desactivar una red sin eliminar su histórico funcional

No hace falta en esta fase:

- auditoría completa de cambios
- gestión avanzada por sedes con relaciones complejas
- versionado histórico de redes
- reglas diferentes por departamento

#### Quién puede gestionarlo

Solo el admin funcional global del bloque de Control Horario debe poder gestionar redes/IPs confiables.

Esto incluye:

- usuario con rol `Admin`
- usuario con `canManageTimeControlRequests`

Un coordinador normal no debe poder:

- crear redes confiables
- editar rangos/IPs
- cambiar activaciones

#### Modelo funcional propuesto

Primera propuesta de entidad:

- `id`
- `name`
- `network_value`
- `network_type`
- `is_active`
- `description`
- `created_at`
- `updated_at`

Interpretación de campos:

- `name`: nombre legible de la red o sede
- `network_value`: IP exacta o rango
- `network_type`: `EXACT_IP` o `CIDR`
- `is_active`: si participa o no en la validación actual
- `description`: contexto opcional para administración

#### Regla de negocio principal

Si una red está activa y la IP del fichaje coincide con ella, el sistema la tratará como red confiable.

Si no coincide:

- la IP se tratará como externa o no validada
- el fichaje no se bloqueará por eso en esta fase
- simplemente afectará al nivel de confianza del registro

#### Relación con la variable de entorno

La variable `TIME_CONTROL_TRUSTED_IP_RANGES` puede mantenerse como respaldo temporal durante la transición.

Criterio recomendado:

- las redes configuradas en base de datos deben ser la fuente principal
- la variable de entorno puede actuar como fallback inicial
- una vez consolidada la gestión administrativa, la variable podrá retirarse o quedar solo para emergencia

#### Impacto esperado en el cálculo de confianza

La lógica funcional quedaría así:

- ubicación válida + dispositivo esperado + IP en red confiable -> `ALTA`
- ubicación válida + dispositivo esperado + IP fuera de red confiable -> `MEDIA`
- ubicación válida + dispositivo anómalo o red problemática relevante -> `BAJA`
- sin ubicación válida -> `INVÁLIDA`

La red confiable no decide por sí sola si un fichaje existe, pero sí mejora o empeora la interpretación del contexto.

#### Comportamiento al desactivar una red

La desactivación de una red debe afectar solo a fichajes futuros.

No debe recalcular automáticamente registros históricos ya guardados, porque:

- esos registros reflejan el contexto con el que fueron creados
- cambiar la historia operativa introduciría confusión
- el histórico debe ser estable para revisión y exportación

#### Ubicación en la interfaz

No debería mezclarse con la tabla principal de `Registros`.

La propuesta funcional más limpia es una sección específica, por ejemplo:

- `Gestión de control horario > Redes confiables`

Así se separa:

- operativa diaria de revisión
- configuración administrativa del bloque

#### Fases de implementación recomendadas

1. Crear la entidad y persistencia de redes/IPs confiables.
2. Resolver coincidencia por IP exacta o CIDR.
3. Integrar esa resolución en el cálculo de `isTrustedNetwork`.
4. Mantener la variable de entorno como fallback temporal.
5. Crear pantalla administrativa de listado y edición básica.
6. Valorar después si merece la pena añadir sedes, auditoría o reglas más avanzadas.

### 7.14 Diseño técnico propuesto: redes e IPs confiables

#### Objetivo técnico

Sustituir progresivamente la dependencia exclusiva de `TIME_CONTROL_TRUSTED_IP_RANGES` por una fuente persistente y administrable, manteniendo compatibilidad con la lógica actual de confianza del fichaje.

#### Persistencia propuesta

Tabla inicial recomendada:

- `time_control_trusted_networks`

Campos propuestos:

- `id` `VARCHAR(36)` o similar
- `name` `VARCHAR(120)` no nulo
- `network_value` `VARCHAR(64)` no nulo
- `network_type` `ENUM('EXACT_IP', 'CIDR')` no nulo
- `is_active` `TINYINT(1)` o `BOOLEAN` no nulo
- `description` `VARCHAR(255)` nulo
- `created_at` `DATETIME` no nulo
- `updated_at` `DATETIME` no nulo

Restricciones mínimas recomendadas:

- índice por `is_active`
- índice por `network_type`
- unicidad funcional sobre `network_value` para evitar duplicados exactos

#### Repositorio

Se recomienda un repositorio dedicado, por ejemplo:

- `time-control-trusted-networks.repository.ts`

Operaciones mínimas de la primera fase:

- `listAll()`
- `listActive()`
- `findById(id)`
- `create(input)`
- `update(input)`
- `setActive(id, isActive)`

No hace falta todavía:

- borrado físico
- auditoría histórica
- filtros complejos

#### Servicio de negocio

Se recomienda encapsular la lógica de resolución en un servicio propio, por ejemplo:

- `time-control-trusted-networks.service.ts`

Responsabilidades:

- normalizar IPs de entrada
- validar si `network_value` encaja con `network_type`
- resolver si una IP pertenece a una red activa
- exponer una función del tipo `isTrustedNetworkIp(ip: string | null): boolean`

#### Integración con la lógica actual

Hoy la lógica vive embebida en `time-control.service.ts` y depende de:

- `getTrustedNetworkConfig()`
- `parseTrustedNetworkRule()`
- `isTrustedNetworkIp()`

La transición técnica recomendada sería:

1. extraer la resolución de red a un servicio dedicado
2. dejar que ese servicio consulte primero base de datos
3. usar la variable de entorno solo como fallback si no hay coincidencia o no hay redes persistidas

Resultado esperado:

- `time-control.service.ts` deja de conocer directamente la configuración técnica de redes
- solo consume una abstracción de “IP confiable o no”

#### Estrategia de fallback

Primera versión recomendada:

- si existen redes activas en base de datos, se usan como fuente principal
- si no existen o no hay coincidencia, se puede consultar `TIME_CONTROL_TRUSTED_IP_RANGES`
- si tampoco hay coincidencia en fallback, la IP se considera externa

Esto permite:

- desplegar sin romper entornos actuales
- migrar poco a poco desde configuración técnica a configuración funcional

#### Validaciones técnicas mínimas

Antes de guardar una red:

- si `network_type` es `EXACT_IP`, `network_value` debe ser una IP exacta válida
- si `network_type` es `CIDR`, `network_value` debe ser un CIDR válido
- no debe permitirse un valor vacío
- no debe permitirse guardar duplicados exactos activos del mismo `network_value`

#### Endpoints necesarios

Primera fase de API recomendada:

- `GET /api/time-control/trusted-networks`
- `POST /api/time-control/trusted-networks`
- `PUT /api/time-control/trusted-networks/[id]`
- `PATCH /api/time-control/trusted-networks/[id]/active`

Permisos:

- solo admin funcional global del bloque
- respuesta `FORBIDDEN` para coordinador normal o trabajador

#### Encaje en la interfaz

Pantalla recomendada:

- `Gestión de control horario > Redes confiables`

Primera versión de UI:

- listado tabular simple
- nombre
- valor de red
- tipo
- activa/inactiva
- descripción
- acciones de editar y activar/desactivar

No hace falta todavía:

- búsqueda avanzada
- agrupación por sede
- panel visual complejo

#### Impacto en el cálculo de confianza

La integración técnica no debería cambiar la filosofía del cálculo actual, solo la fuente del dato de red confiable.

El flujo esperado queda así:

1. se normaliza la IP del fichaje
2. el servicio de redes confiables decide si coincide con una red activa
3. el resultado alimenta `isTrustedNetwork`
4. `calculateTrustLevel()` sigue resolviendo `ALTA`, `MEDIA`, `BAJA` o `INVÁLIDA`

#### Orden de implementación recomendado

1. Crear migración de `time_control_trusted_networks`
2. Crear tipos y repositorio
3. Extraer la lógica de red confiable a servicio dedicado
4. Integrarlo en `time-control.service.ts`
5. Mantener fallback con variable de entorno
6. Exponer endpoints de administración
7. Construir pantalla de gestión básica

#### Riesgos y decisiones conscientes

Riesgos asumidos de esta primera versión:

- no habrá auditoría de cambios todavía
- la detección de red seguirá centrada en IP exacta y CIDR
- no se resuelve aún el concepto de sede como entidad separada

Decisión consciente:

- priorizar una solución útil, simple y desplegable antes que un modelo demasiado sofisticado

## 8. Interfaz y experiencia de uso

Durante las últimas iteraciones se ha refinado especialmente la UI del bloque.

Cambios ya incorporados:

- calendario mensual más claro para trabajador
- detalle por día y agrupación de registros
- menú de solicitudes unificado para trabajador
- menú de gestión unificado para revisión
- badges numéricos por pestaña
- lógica de pestañas vistas para atenuar el efecto de "notificación"
- separación visual de bandejas y filtros
- seguimiento diario con fecha seleccionable
- visualización diferenciada de fichados, no fichados, exclusiones y teletrabajo

## 9. Seguimiento diario y control de equipo

La gestión incluye un bloque de seguimiento diario que permite consultar:

- quién ha fichado en una fecha
- quién no ha fichado en una fecha
- exclusiones por vacaciones o permisos aprobados
- usuarios autorizados en teletrabajo

Además, la pestaña `Registros` permite:

- filtrar por rango de fechas
- filtrar por franja horaria
- filtrar por trabajador
- filtrar por validación
- revisar estado y detalle de cada registro

## 10. Pruebas y validaciones realizadas

Según la documentación base y las iteraciones posteriores, se han validado al menos estos casos:

- acceso al módulo desde navegación
- fichaje de entrada
- fichaje de salida
- bloqueo de doble jornada abierta
- persistencia correcta en base de datos
- visualización en histórico y calendario
- revisión de solicitudes de fichaje
- revisión de incidencias justificadas
- revisión de solicitudes de teletrabajo/permiso
- comportamiento del seguimiento diario
- exportación de informe de presencia por trabajador y rango

## 11. Estado actual frente a la documentación original

La documentación Word original describía el alcance general del módulo y su evolución prevista. A día de hoy, el proyecto ya incorpora avances que superan ese planteamiento base:

- doble flujo de revisión por coordinador y admin
- aplicación real de solicitudes aprobadas de fichaje sobre registros
- bandejas unificadas en UI
- separación clara entre tipos de solicitud
- menú de trabajador más completo
- seguimiento diario y exclusiones integradas en gestión
- validación por nivel de confianza del fichaje
- exportación Excel alineada con el modelo de informe de presencia

Por tanto, este documento debe considerarse la referencia funcional, técnica y operativa más actual del bloque en su estado presente.

## 12. Mejoras futuras todavía abiertas

Siguen vigentes varias líneas de mejora ya detectadas:

- evaluación de incidencias por jornada agregada diaria y no solo por registro
- informes y cuadros de explotación más avanzados
- configuración dinámica de puntos válidos de fichaje desde administración
- mayor automatización de regularización ante incidencias de ubicación
- control más avanzado por dispositivo o canal de fichaje
- revisión final del papel exacto del coordinador para ajustar mejor sus competencias
- posible gestión administrativa de rangos/IPs confiables sin depender solo de variables de entorno

## 13. Recomendación para próxima revisión

Si esta documentación se va a enseñar al tutor, lo más sólido es presentar el bloque en este orden:

1. flujo trabajador
2. flujo coordinador
3. flujo admin
4. validaciones de negocio
5. estado actual frente a backlog futuro

Así se ve muy bien qué está ya construido y qué queda como siguiente iteración.
