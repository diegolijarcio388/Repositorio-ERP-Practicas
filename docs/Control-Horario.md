# Documentacion final - Modulo de Control Horario

Fecha de actualizacion: 16/06/2026

Este documento resume el estado final del modulo de Control Horario desarrollado durante las practicas. Sirve como guia funcional y tecnica para entender que hace el modulo, como se usa, que reglas aplica y que puntos quedan como posibles mejoras futuras.

## 1. Objetivo del modulo

El modulo de Control Horario permite gestionar la presencia diaria de los trabajadores dentro del ERP.

Su alcance principal es:

- Registrar entrada y salida de jornada.
- Consultar historico de fichajes.
- Detectar anomalias horarias o tecnicas.
- Permitir solicitudes de fichaje anterior.
- Permitir justificaciones de anomalias.
- Gestionar permisos y teletrabajo.
- Dar a administracion una vista de supervision.
- Dar a coordinacion una vista limitada a registros revisables de su ambito.

Este modulo no sustituye a la imputacion de horas a proyectos. Control Horario se centra en presencia, jornada efectiva y trazabilidad administrativa.

## 2. Roles principales

### Trabajador

El trabajador puede:

- Fichar entrada y salida.
- Consultar su calendario mensual.
- Ver el detalle de una jornada.
- Solicitar un fichaje anterior.
- Justificar una anomalia horaria.
- Solicitar permisos y teletrabajo.
- Adjuntar justificantes en solicitudes de permiso.
- Consultar el estado de sus solicitudes.
- Recibir avisos globales cuando tenga una jornada abierta.

### Administracion

Administracion puede:

- Ver el cuadrante diario de fichajes.
- Revisar fichajes del equipo.
- Aprobar o rechazar solicitudes.
- Validar registros marcados como revisables.
- Cerrar jornadas abiertas de trabajadores.
- Revisar permisos y teletrabajo.
- Consultar datos tecnicos de entrada y salida.
- Filtrar por trabajador, estado, validacion y fecha.

### Coordinador

El coordinador tiene una vista recortada. Su funcion es consultar desajustes horarios de trabajadores de su ambito.

El coordinador puede:

- Ver registros horarios revisables de su equipo.
- Usar calendario historico.
- Abrir detalle de un registro.
- Consultar motivos horarios como duracion corta o larga.

El coordinador no ve datos tecnicos sensibles como ubicacion, dispositivo o IP. Tampoco valida administrativamente el fichaje. La decision funcional acordada es que esos casos se comentan entre coordinador y trabajador, y la validacion final queda en administracion.

## 3. Estados funcionales

### Estado de jornada

En la interfaz se usan estos estados:

- Cerrado: la jornada tiene entrada y salida.
- Abierta: existe entrada, pero todavia no hay salida.
- Ausente: no existe entrada ni salida para el dia esperado.

### Estado de validacion

En la interfaz se usan estos estados:

- Correcta: el registro no requiere revision.
- Revisar: el registro contiene alguna anomalia o requiere validacion administrativa.

Cuando administracion valida un registro revisable, la validacion pasa a Correcta.

### Estados de solicitudes

Las solicitudes se muestran de forma homogenea:

- Pendiente administracion.
- Aprobada.
- Rechazada.

Internamente pueden existir pasos intermedios, pero de cara a la interfaz se ha simplificado para que el usuario vea un flujo claro.

## 4. Vista de trabajador

La vista de trabajador esta dividida en:

- Mi control horario.
- Mis solicitudes.

### Mi control horario

Permite registrar entrada y salida y revisar el calendario del mes.

Tambien muestra:

- Estado actual de la jornada.
- Horas acumuladas del mes.
- Calendario de fichajes.
- Acciones rapidas.

Las acciones rapidas incluyen:

- Fichar entrada o salida.
- Solicitar fichaje anterior.
- Solicitar ayuda de ubicacion.
- Solicitar permiso.

### Mis solicitudes

El trabajador puede consultar:

- Solicitudes de fichaje anterior.
- Anomalias justificables.
- Solicitudes de permiso.
- Solicitudes de teletrabajo.

Las solicitudes se filtran por mes activo. Esto evita que se mezclen registros de meses anteriores al navegar por junio, mayo, etc.

## 5. Aviso global de jornada abierta

Existe un aviso global para jornadas abiertas.

Caracteristicas:

- Aparece en cualquier ruta del ERP cuando el trabajador tiene una jornada abierta.
- Se muestra centrado en la parte superior.
- Usa fondo verde suave y punto verde de estado.
- Muestra la hora de entrada y el tiempo acumulado.
- A partir de 7 horas recuerda al usuario que no olvide cerrar la jornada.
- Al pulsarlo redirige a Mi control horario.
- En la propia ruta de Control Horario no se muestra para no duplicar informacion.

Tambien existen avisos especificos cuando la jornada supera determinados limites, como 8 horas y 15 minutos o mas de 24 horas abierta.

## 6. Fichaje desde tablet

Se ha incorporado soporte para fichar desde tablet mediante codigo.

Funcionamiento:

- En modo tablet se sustituye el acceso por correo por un codigo de trabajador.
- Cada trabajador puede tener un codigo propio.
- Al acceder correctamente se redirige a Control Horario.
- Para fichajes desde tablet se solicita el codigo correspondiente.

La migracion asociada es:

- `038_users_time_control_tablet_code.sql`

## 7. Cuadrante de fichajes

El cuadrante permite a administracion ver la actividad diaria por trabajador y hora.

Caracteristicas:

- Muestra las 24 horas del dia.
- Abre visualmente cerca de las 06:00 para que sea comodo en jornadas normales.
- Permite desplazamiento horizontal.
- Representa jornadas nocturnas y jornadas que cruzan de un dia a otro.
- Los bloques cortos tienen un tamaño minimo visible.
- Los bloques de jornada cubren visualmente el bloque horario completo para facilitar lectura.
- Incluye filtros por trabajador, estado y validacion.
- El buscador de trabajador permite escribir y seleccionar desde desplegable.

## 8. Detalle de fichaje

El detalle de fichaje se ha unificado visualmente.

En administracion:

- Muestra fecha de jornada.
- Muestra rango horario.
- Muestra tiempo computado.
- Muestra estado y validacion.
- Muestra motivos de revision cuando existen.
- Los datos tecnicos se consultan haciendo hover sobre la hora de entrada o salida.
- Se muestra dispositivo usado: Movil, Tablet, Escritorio o Desconocido.

En trabajador:

- Se mantiene la misma estructura visual.
- Se evita mostrar informacion tecnica innecesaria.

En coordinador:

- Se ocultan datos tecnicos.
- Se muestra solo el motivo horario revisable.

## 9. Anomalias y revision

Las antiguas incidencias se han replanteado como anomalias o motivos de revision.

Ejemplos:

- Duracion demasiado corta.
- Duracion demasiado larga.
- Fichaje fuera del horario previsto.
- Fichaje fuera del punto permitido.
- Dispositivo no permitido.
- Dispositivo no identificado.
- Salida pendiente.

Se ha eliminado el enfoque visual de "incidencia" roja permanente para evitar sensacion de error grave cuando solo se requiere revision.

Cuando una anomalia se revisa y queda validada, no debe seguir apareciendo como problema activo para el usuario.

## 10. Solicitudes de fichaje anterior

El trabajador puede solicitar una entrada o salida anterior.

Administracion revisa la solicitud y puede:

- Aprobarla.
- Rechazarla con comentario.

Cuando se aprueba:

- Se actualiza el registro horario correspondiente.
- El trabajador recibe notificacion.
- La solicitud aparece como aprobada en Mis solicitudes.

## 11. Cierre de jornada por administracion

Administracion puede cerrar una jornada abierta.

Funcionamiento:

- Se abre el detalle del fichaje.
- Si la jornada esta abierta, aparece la accion de cerrar jornada.
- El sistema propone por defecto una salida calculada con 8 horas de jornada.
- Administracion puede incluir un comentario.
- El trabajador recibe aviso de que su jornada ha sido cerrada por administracion.

El aviso debe aparecer aunque el trabajador no este situado en el mes concreto del registro.

## 12. Permisos

Se ha incorporado un flujo basico de permisos legales.

Tipos contemplados:

- Permiso medico: tiempo indispensable si es por Seguridad Social.
- Matrimonio o registro de pareja de hecho: 15 dias naturales.
- Fallecimiento de conyuge, padres o hijos: 4 dias laborables.
- Hospitalizacion, enfermedad grave, intervencion quirurgica o fallecimiento de familiar hasta segundo grado: 2 dias laborables, o 4 si hay desplazamiento superior a 200 km.
- Traslado de domicilio: 1 dia laborable.
- Deber publico inexcusable: tiempo indispensable.
- Examenes: tiempo indispensable.

Ejemplos de deber publico inexcusable:

- Comparecencia judicial.
- Renovacion de DNI o pasaporte cuando no pueda realizarse fuera de la jornada.
- Citaciones oficiales obligatorias.

### Adjuntos

Las solicitudes de permiso permiten adjuntar varios archivos.

Reglas actuales:

- Maximo 3 archivos.
- Formatos admitidos: JPG, PNG, WEBP y PDF.
- Tamano maximo por archivo: 5 MB.

Los adjuntos se suben mediante API y se guardan como referencias asociadas a la solicitud.

## 13. Teletrabajo

El flujo de teletrabajo se mantiene dentro de solicitudes, pero no ha sido el foco principal de la ultima fase.

La interfaz permite diferenciar:

- Teletrabajo.
- Permiso.

En administracion se muestran pills diferenciadas para que se reconozca rapidamente el tipo de solicitud.

## 14. Navegacion y layout

Se ha ajustado el menu lateral:

- Puede ocultarse y mostrarse.
- El logo se mantiene visible.
- El boton de plegado se ha colocado en una posicion intermedia del panel.
- En tablet y movil, las ventanas modales se superponen correctamente y no quedan tapadas por el menu.
- El menu queda fijo al bajar la pantalla.

Tambien se ha reorganizado la navegacion del bloque de Control Horario:

- Cuadrante.
- Fichajes.
- Solicitudes.
- Revision.
- Permisos.

## 15. Endpoints y ficheros relevantes

Algunos ficheros importantes del modulo:

- `src/modules/time-control/ui/TimeControlFeature.tsx`
- `src/modules/time-control/ui/GlobalOpenWorkdayWarning.tsx`
- `src/layouts/AppLayout.astro`
- `src/pages/api/time-control/check-in.ts`
- `src/pages/api/time-control/check-out.ts`
- `src/pages/api/permissions/request.ts`
- `src/pages/api/permissions/upload-attachment.ts`
- `src/pages/api/permissions/admin.ts`
- `src/modules/permissions/domain/types.ts`
- `src/modules/permissions/services/permissions.service.ts`
- `src/modules/permissions/repositories/permission-requests.repository.ts`

Migraciones relevantes recientes:

- `037_workday_records_admin_close.sql`
- `038_users_time_control_tablet_code.sql`
- `039_permission_requests_legal_fields.sql`

## 16. Consideraciones de base de datos

Las migraciones deben aplicarse en orden.

Puntos importantes:

- Los campos de cierre administrativo permiten guardar quien cerro una jornada y cuando.
- Los codigos de tablet viven en usuarios.
- Los permisos legales incorporan tipo de permiso, unidad solicitada y adjuntos.
- Algunas solicitudes antiguas pueden haber quedado con estados previos, por lo que conviene revisar datos de prueba antes de una demo.

## 17. Checklist de prueba rapida

### Trabajador

- Entrar en Mi control horario.
- Fichar entrada.
- Comprobar que aparece la jornada abierta.
- Navegar a otra ruta y confirmar que el aviso global sigue visible.
- Pulsar el aviso y confirmar que vuelve a Control Horario.
- Fichar salida.
- Revisar el calendario mensual.
- Abrir Mis solicitudes.
- Crear una solicitud de fichaje anterior.
- Crear una solicitud de permiso con adjuntos.
- Justificar una anomalia si existe.

### Administracion

- Entrar en Gestion de control horario.
- Revisar el cuadrante.
- Filtrar por trabajador.
- Abrir detalle de un fichaje.
- Pasar el cursor sobre entrada y salida para ver datos tecnicos.
- Validar un registro en Revisar.
- Cerrar una jornada abierta.
- Aprobar o rechazar una solicitud de fichaje.
- Aprobar o rechazar una solicitud de permiso.

### Coordinador

- Entrar con perfil coordinador.
- Confirmar que solo aparecen trabajadores de su ambito.
- Confirmar que no se ven datos tecnicos.
- Abrir el calendario historico.
- Abrir el detalle de un registro revisable.

### Tablet

- Acceder en modo tablet.
- Usar codigo de trabajador.
- Confirmar redireccion a Control Horario.
- Fichar con codigo.

## 18. Puntos pendientes o mejoras futuras

Aunque el modulo queda funcional, hay mejoras razonables para una fase posterior:

- Sustituir el refresco periodico por WebSocket o Server-Sent Events.
- Mover adjuntos de permisos a almacenamiento privado si se despliega en produccion.
- Anadir tests automaticos de servicios y APIs.
- Auditar historico de cambios de validacion.
- Revisar limpieza automatica de archivos adjuntos eliminados.
- Separar componentes grandes de `TimeControlFeature.tsx` para mejorar mantenibilidad.
- Revisar permisos por rol con una matriz formal antes de despliegue real.

## 19. Resumen final

El modulo queda preparado para cubrir el ciclo principal de control horario:

- Fichaje diario.
- Avisos de jornada abierta.
- Supervision administrativa.
- Consulta por coordinador.
- Solicitudes de fichaje.
- Justificaciones.
- Permisos con adjuntos.
- Fichaje por tablet mediante codigo.

La parte mas importante pendiente para produccion no es funcional, sino de endurecimiento tecnico: pruebas automaticas, almacenamiento definitivo de adjuntos y revision formal de permisos.
