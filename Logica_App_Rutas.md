# App «Rutas por sitio»: lógica completa, cómo funciona y por qué

Documento de referencia de `dashboard_dpe_facility.html`: un solo archivo HTML para Grid, sin backend propio, hecho para que gente **no técnica** pueda traer los envíos planeados de alto valor de su sitio, repartirlos a su equipo y ver cómo va el avance.

Etiquetas de evidencia que se usan abajo:

- **[PROBADO]**: observado en uso real de Grid.
- **[SIMULADO]**: probado con un navegador automático y respuestas de Grid simuladas, **no** contra Grid real.
- **[SIN PROBAR]**: programado, pero sin ninguna prueba.
- **[DECISIÓN]**: elección de diseño y su motivo.

---

## 1. Qué hace, en una frase

Una persona con acceso a BigQuery elige su **sitio**, **ciclo** y **costo mínimo**; la app trae los envíos de las rutas planeadas, los **guarda para su equipo**, y de ahí todos trabajan sobre esos datos: filtran, seleccionan, asignan a un **lote** de una persona, y monitorean el avance (encontrados / no encontrados) que registra otra app de captura.

## 2. Flujo de la persona usuaria

```
        ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
        │ 1. CARGAR    │ ──▶ │ 2. TRABAJAR       │ ──▶ │ 3. MI EQUIPO     │
        │ consulta DPE │     │ filtrar, elegir,  │     │ monitoreo de     │
        │ y guarda     │     │ asignar a un lote │     │ lotes y avance   │
        └──────────────┘     └───────────────────┘     └──────────────────┘
               ▲  Damashito explica cada paso en su burbuja
               └─ Avatar de Damashito (arriba a la derecha) = Configuración
```

| Paso | Quién lo usa | Qué necesita |
|---|---|---|
| 1. Cargar | Quien tenga acceso a BigQuery vía DPE | Rol de Shield y términos de QueryBuilder aceptados |
| 2. Trabajar | Cualquier persona con acceso al documento | Que exista una carga guardada |
| 3. Mi equipo | Líderes y miembros de un equipo | Que exista un equipo y lotes |
| Configuración | Todos (la parte del libro, solo el dueño) | — |

**Por qué así [DECISIÓN]:** consultar BigQuery es lo que exige permisos especiales; trabajar sobre datos ya guardados no. Separar los pasos permite que pocas personas carguen y muchas trabajen.

## 3. Arquitectura: de dónde sale cada cosa

No hay servidor propio. Todo ocurre en el navegador, hablando con rutas del mismo origen de Grid (`credentials: 'include'`, la cookie de sesión de quien abre el documento):

```
                     ┌────────────────────────────────────────┐
   HTML en Grid ───▶ │ /api/v1/dpe/sources/bigquery/.../query │ ──▶ DPE ──▶ QueryBuilder ──▶ BigQuery
   (navegador)       │ /api/v1/documents/{doc}/states/{name}  │     (Named State: cargas y lotes)
                     │ /api/v1/sheets/{libro}...              │     (Google Sheets: catálogo, equipos, historial)
                     │ /api/v1/me, /people/search, /documents │     (identidad, personas, propietario)
                     └────────────────────────────────────────┘
```

| Pieza | Para qué | Quién puede escribir |
|---|---|---|
| **DPE** (Data Platform Engine) | Ejecutar el SQL de solo lectura en BigQuery con la identidad de **quien lo presiona** | — (solo lectura) |
| **Named State** (buckets) | Guardar la carga y los lotes (datos de trabajo) | Cualquier persona con acceso al documento |
| **Google Sheets** (libro de control) | Catálogo de sitios, equipos, miembros, bitácora de cargas e historial de captura | Cualquier persona con acceso, por el proxy de Sheets |
| **Directorio de personas** | Buscar por LDAP o correo | — |

## 4. Los datos: dónde vive cada cosa y por qué

| Dato | Dónde | Quién escribe | Por qué ahí |
|---|---|---|---|
| Sitios (`SITIOS`) | Sheets | El operador, a mano | Catálogo que cambia poco; no se pone en el código |
| Equipos (`EQUIPOS`) | Sheets | La app | Se necesita en todas las sesiones y debe sobrevivir |
| Miembros (`MIEMBROS`) | Sheets, **bitácora** | La app | Una persona puede estar en varios equipos; cada alta/baja es una fila |
| Cargas (`CARGAS`) | Sheets, bitácora | La app | Índice: quién cargó qué y en qué documento quedó |
| Datos de la carga | Named State `snap_<sitio>_<ciclo>` | Cualquier usuario | Los envíos pueden pesar >1 MB; no caben en celdas de Sheets |
| Lotes y envíos asignados | Named State `lotes_<sitio>` | Cualquier usuario | Son de trabajo y **caducan** a los 3 días |
| Historial de captura (`HISTORIAL`) | Sheets | **Otra app** (captura) | Es el registro permanente de lo encontrado y no encontrado |

**Esquema del libro (5 pestañas)** [DECISIÓN]:

| Pestaña | Columnas |
|---|---|
| `SITIOS` | `sitio, nombre, activo` |
| `EQUIPOS` | `equipo_id, sitio, nombre, lider_ldap, activo, creado_por, fecha` |
| `MIEMBROS` | `ts, equipo_id, ldap, nombre, email, accion, por_ldap` |
| `CARGAS` | `ts, sitio, ciclo, ldap, filas, costo_min, doc_id, ref` |
| `HISTORIAL` | `datetime, sitio, ldap, envio_id, resultado, foto_ref, lote_id, doc_id` (las últimas tres y `resultado` son opcionales para la app) |

El campo `activo` acepta `1` o `0` (también `no`, `false`, `inactivo`); una celda vacía cuenta como activa.

### Por qué Sheets «solo agrega filas» (bitácoras) [DECISIÓN]
Con varias personas escribiendo, leer-modificar-escribir una fila compartida pierde cambios. En cambio cada evento es **una fila nueva** y el estado actual se reconstruye repitiendo la bitácora (gana el último evento por persona o por envío). Quitar a alguien de un equipo es agregar una fila `REMOVE`. Es lo más seguro con varios usuarios y no necesita bloqueos.

### Por qué los lotes son estado temporal y no Sheets [DECISIÓN]
- Lo que queda como evidencia es lo **encontrado y lo no encontrado** (`HISTORIAL`); las asignaciones son trabajo del día.
- Evita la cuota de Sheets: cada alta o baja de un envío sería una escritura con pausa de 700 ms y riesgo de 429.
- El estado se puede borrar por partes y caduca solo.
- Costo de la decisión: **no hay registro permanente de quién asignó qué**, y el estado no tiene historial de versiones. El operador lo aceptó.

### Por qué no se usa Dataset [DECISIÓN]
Publicar un Dataset exige ser **dueño o editor** del documento. Se necesita que usuarios que no son ninguno de los dos corran DPE y guarden, así que la carga va a Named State, donde cualquiera con acceso escribe. El flujo de Dataset se quitó por completo.

## 5. Paso 1: Cargar

### Entradas
| Campo | Regla | Por qué |
|---|---|---|
| Sitio | Mayúsculas, números y guion bajo (`^[A-Z0-9_]{1,20}$`); sugiere los de `SITIOS` | El valor **se inserta en el SQL**, así que se valida estricto |
| Ciclo | Misma regla | Igual |
| Costo mayor o igual a | Solo dígitos (los demás caracteres se descartan al escribir); 1 a 9 dígitos; por defecto 2000 | Evita inyección y errores de captura |
| Datos | `BigQuery` o `Ejemplo` | Ejemplo permite conocer la herramienta sin consultar |

### La consulta
- **Una sola sentencia `WITH`.** DPE rechaza cualquier SQL que no empiece con `SELECT`/`WITH` o que traiga dos sentencias; por eso las variables (`DECLARE` del SQL original) se sustituyen por literales ya validados.
- **Tablas:** rutas planeadas de hoy (`BT_SHP_LG_RTG_ROUTE`, paradas, acciones y unidades), inventario (`BT_SHP_INVENTORIED_INVENTORY_UNIT` mediante `EXISTS`), embalaje (`BT_FBM_OUTBOUND`), estado logístico (`BT_SHP_LG_SHIPMENTS`), orden (`BT_ORD_ORDERS`) y **costo** desde `BT_SHP_SHIPMENTS`.
- **El filtro de costo va en el `JOIN`:** `C.SHP_ORDER_COST >= <valor>` dentro del `ON` de `BT_SHP_SHIPMENTS`, que es la columna que se muestra como `Costo_MXN`. La columna está en una constante (`CFG.COST_COL`).
- **Fechas:** `CURRENT_DATE('America/Mexico_City')`; ventanas de 3 días y 1 mes para los `JOIN` laterales.
- **Parámetros de DPE:** `limit` 5.000 filas, `cache_ttl` 300 s, `billing_project` = el proyecto de reporting.

### Caché de DPE (por qué una segunda consulta tarda 0,1 s)
DPE recuerda el resultado de una consulta idéntica por usuario durante 5 minutos (`cached: true`). La primera vez tarda lo que tarde BigQuery (~17 s observados); la repetición dentro de esos 5 minutos responde en ~130 ms. Los datos pueden tener hasta 5 minutos de antigüedad [DECISIÓN: aceptado].

### Los tres pasos de «Consultar y guardar»
1. **Consultar** BigQuery por DPE (o generar datos de ejemplo).
2. **Guardar la carga para el equipo:** `PUT /states/snap_<sitio>_<ciclo>` con `{state: {meta, rows}, if_updated_at: ''}`. **Reemplaza** la carga anterior de ese sitio y ciclo.
3. **Anotar la carga** en la pestaña `CARGAS` (con el `doc_id` donde quedó). Si falla, la app avisa pero se puede trabajar.

Hay un botón secundario **«Solo consultar»** (hace solo el paso 1) y un **Cancelar** mientras corre.

### Modo «Ejemplo»
Genera datos de prueba solo en la memoria de la pantalla. **No escribe en Sheets ni en el estado**, y no permite asignar a lotes (para no ensuciar los buckets reales).

### Si la consulta no es aceptada
DPE responde `403 client_permission` («upstream responded with status 401»). La app no lo muestra como error técnico: **Damashito** explica que hay que aceptar los términos de QueryBuilder, con un botón que abre `https://web.furycloud.io/data/query-builder` y otro **«Ya los acepté»** que vuelve a verificar. Además ofrece abrir una carga que ya exista, para trabajar sin consultar. (Ver sección 10.)

## 6. Paso 2: Trabajar

1. **Abrir una carga:** se escribe `SITIO_CICLO` (hay sugerencias salidas de `CARGAS`). La app lee `snap_<sitio>_<ciclo>` del estado; si no existe, lo dice con claridad. Al abrir, también lee los lotes del sitio para saber qué envíos ya están asignados.
2. **Filtros** (todos en el navegador, sin volver a consultar):
   - **Dominio** (lista de los que trae la carga).
   - **Costo mínimo y máximo**.
   - **Descripción con `LIKE`:** `%` es cualquier cantidad de caracteres y `_` uno solo; si no se escribe ninguno, equivale a «contiene» (`%texto%`). No distingue mayúsculas.
3. **Selección múltiple:** casillas por fila, «Seleccionar visibles» y «Limpiar selección». Los envíos **ya asignados a un lote** aparecen atenuados y no se pueden seleccionar (evita asignar dos veces).
4. **«Seleccionar los 10 más caros en contenedor»:** está **deshabilitado** a propósito. Necesita una segunda consulta a BigQuery (si el envío ya está en un contenedor) que se hará después. La columna «Contenedor» muestra «pendiente».
5. **Centro de control** (columna derecha, sobre los envíos filtrados): totales, costo total, % en inventario, seleccionados y su costo, barras por dominio (clic para filtrar) y una distribución de costo en 6 tramos.
6. **Exportar CSV** de lo que se está viendo.
7. **Asignar a lote:** se elige el equipo (de ese sitio), la persona que los buscará (miembros del equipo más el líder) y un lote existente o uno nuevo (con nombre editable). Se escribe en `lotes_<sitio>` (sección 8).

## 7. Paso 3: Mi equipo

- Se elige un equipo de los **propios** (donde la persona es líder o miembro) y, opcionalmente, un ciclo.
- Cada lote muestra: nombre, sitio y ciclo, persona asignada, barra de avance y chip de estado (**Pendiente / En curso / Completo / Vacío**).
- **Avance = (encontrados + no encontrados) ÷ envíos asignados.** Se calcula con el último `resultado` por envío en `HISTORIAL` (`ENCONTRADO` o `NO_ENCONTRADO`). Si la columna `resultado` viene vacía pero hay `foto_ref`, cuenta como encontrado.
- Al abrir un lote se pueden **quitar** envíos (×) o **agregar** pegando IDs (coma, espacio o renglón; solo números de 5 o más dígitos). Si un ID ya está en otro lote, no se mueve y se avisa.
- Al entrar a esta pestaña o presionar **Actualizar**, el historial se lee **fresco**; las listas de sitios y equipos reutilizan una lectura de hasta 30 s para cuidar la cuota de Sheets.

## 8. Lotes en Named State: el mecanismo

**Un bucket por sitio:** `lotes_<sitio en minúsculas>`. Contiene claves de primer nivel:

| Clave | Valor |
|---|---|
| `L:<lote_id>` | `{nombre, equipo_id, asignado_ldap, creado_por, ts, ciclo, dia}` |
| `S:<envio_id>` | `{lote_id, ts, por, dia, ciclo}` |

- **Asignar, agregar o quitar** un envío es escribir o borrar una sola clave (`PATCH`, con `null` para borrar). Quitar un envío = `S:<id>` en `null`.
- **Escritura segura (patrón de la Biblia §5.8-§5.9):** se lee el bucket (`updated_at`) → `PATCH` con `if_updated_at` → si responde 409, espera aleatoria (150-550 ms) y reintenta → se **relee para verificar** que las claves quedaron (o desaparecieron) → hasta 5 intentos. Un 200 de Grid no garantiza persistencia bajo escrituras simultáneas, por eso la verificación.
- **Caducidad automática [DECISIÓN]:** cada valor lleva `dia` (hora de México). Todo lo de más de **3 días** (`KEEP_DAYS`) se borra en la misma escritura de cualquiera, o al abrir el paso 2/3 (idempotente: borrar dos veces lo mismo no daña). Un lote que sigue en uso renueva su `dia` al agregarle envíos.
- **Buckets acotados [DECISIÓN]:** no hay forma probada de borrar un bucket, así que se evita crear uno por día. Con un bucket por sitio, el número nunca pasa de uno por sitio (27 hoy). Las cargas (`snap_<sitio>_<ciclo>`) se reemplazan en cada carga, por lo que tampoco crecen sin límite.

## 9. Configuración (el avatar de Damashito)

- **Tú:** nombre, LDAP y correo (de `/api/v1/me`) y el estado de BigQuery.
- **Mis equipos:** elegir sitio y equipo; **crear equipo** (un líder puede tener varios, cada uno de un sitio); ver miembros y **quitarlos**; **agregar personas** buscando por LDAP o correo.
  - La búsqueda usa `/api/v1/people/search` (mínimo 2 caracteres; devuelve `username`, `email`, `full_name`). **Siempre se guarda el LDAP**, nunca el prefijo del correo.
- **Libro de control (solo el dueño del documento):** muestra el libro que usa la app (fijo en `CFG.SHEET_ID`, con enlace para abrirlo), permite **verificar las pestañas** y **vincular el libro al documento**. No hay campo para cambiar de libro: cambiarlo exige editar `CFG.SHEET_ID` en el código. Se detecta al dueño comparando `owner_id` del documento con el usuario de `/me`.
  - **Es solo interfaz [DECISIÓN]:** ocultar la sección no es seguridad; quien impone el permiso (por ejemplo registrar el vínculo) es Grid. Con `?admin=1` en la URL se muestra la sección aunque no se pueda determinar al dueño.

### El vínculo documento-libro
Desde el 14 de octubre, Grid exige que el **dueño** registre un vínculo entre el documento y cada libro (`PUT /api/v1/sheets/{libro}/link?doc_id=…`, capacidad `read_write`). Sin él, cualquier otra persona recibe `403 permission_denied`. Por eso **la app registra el vínculo sola la primera vez que el dueño la abre** (lo recuerda en `localStorage`) [SIN PROBAR contra Grid real]. A quien no es dueño y recibe el 403, Damashito le dice que el dueño debe abrir la app una vez.

## 10. Permisos y avisos de BigQuery

- **Verificación informativa:** al abrir, la app hace una consulta mínima (`SELECT 1`). Si falla, muestra el chip «Falta habilitar BigQuery» y el aviso de Damashito. **Nunca bloquea los botones** [DECISIÓN]: una verificación previa puede equivocarse; la consulta real decide.
- **Causas documentadas del 403 (skill Data Dash Creator):** (1) falta el rol de Shield `gcp_meli-da-platform-admin_lookerstudio@mercadolibre.com` (`https://shield.adminml.com/requests/create/1223`); (2) términos de QueryBuilder sin aceptar (`https://web.furycloud.io/data/query-builder`). Cada persona que consulta (o usa Refresh) los necesita porque DPE ejecuta con **su** identidad. El acceso a las tablas en BigQuery no basta.
- **Lo observado [PROBADO]:** la cuenta dueña consulta bien; otra cuenta recibe `client_permission` con cualquier proyecto de facturación, con el frente idéntico (mismo dominio, `auth_path`, iframe). Por eso el aviso es de identidad y no del proyecto. La causa exacta la identificó el operador; el aviso de la app apunta a los términos de QueryBuilder.
- **Facturación:** siempre al proyecto de reporting. No se ofrece cambiar a `meli-bi-data` (sus slots vienen reduciéndose).

## 11. Una operación a la vez (bloqueos y carga)

- **Un solo candado global:** mientras una operación larga corre (consultar, guardar, asignar, quitar, buscar personas), **todos** los botones, campos y selectores se deshabilitan y las tarjetas se cubren con un velo animado; los clics y la tecla Enter se ignoran con un aviso. Se restablece al terminar.
- **Feedback visual:** barra de progreso arriba, spinner con segundos transcurridos en el botón, Damashito saltando, y la fase actual en su burbuja (por ejemplo «Consultando 12 s», con una nota si pasa de 15 s).
- **Cancelar y tiempo límite:** el botón **Cancelar** aborta la petición en curso; si nada responde, se corta a los 60 s (120 s para la carga completa). Así la pantalla nunca queda bloqueada.
- **Un solo candado por una razón [DECISIÓN]:** las escrituras dependen del orden y comparten cuota; permitir varias a la vez provoca conflictos y 429.

## 12. Cuidado con la cuota de Sheets

- Las llamadas a Sheets van en **cola, con 700 ms de separación** (`SHEETS_GAP_MS`).
- Cada pestaña leída se reutiliza **30 s** (`SHEETS_TTL_MS`); las escrituras la invalidan.
- Ante un 429, espera lo que indique `Retry-After` (máximo 5 s) y reintenta una vez.
- Por eso los lotes **no** están en Sheets (sección 4).

## 13. Seguridad y límites (lo que no protege)

- **Validación de entradas** antes de armar el SQL; todo lo que se pinta en pantalla pasa por escape de HTML (descripciones de productos, nombres, errores).
- **Errores sin datos internos:** se tachan nombres de host de servicios internos e identificadores de ejecución con LDAP.
- **No hay protección por fila.** Cualquiera con acceso al documento puede leer y escribir los buckets y las pestañas del libro fuera de la interfaz. La app organiza el trabajo; **no** es un control de acceso ni un registro de auditoría.
- **El SQL y las rutas viven en el navegador:** son visibles. La autorización de datos la hace DPE/QueryBuilder con la identidad de quien consulta.
- **Fotos:** no hay almacenamiento probado en Grid (sección 15).

## 14. Consola de llamadas (modo pruebas)

Panel flotante abajo a la derecha (botón en el encabezado o tecla `` ` ``). Registra **cada** `fetch` de la página: método, ruta, estado, milisegundos, `x-request-id`, cuerpo enviado, el SQL completo y una vista previa de la respuesta (3 filas más el total). También anota eventos de la app (validaciones, reintentos, limpieza). Las URL firmadas muestran solo la ruta (`?[query oculta]`). Tiene filtros Todo/Red/App y botones para copiar y limpiar. Sirve para ver qué pasa «por detrás» y para pasar el detalle cuando algo falla.

## 15. Estado de las pruebas y pendientes

**[PROBADO] contra Grid real**
- Consulta a DPE con el SQL completo (617 filas, ~17 s la primera vez; ~130 ms desde la caché).
- Guardar en Dataset con `{rows:[…]}` (ya no se usa).
- El 403 de Sheets por falta de vínculo y el `client_permission` de DPE con una cuenta no dueña.
- `/me`, y `owner_id` en los datos del documento.

**[SIMULADO] solamente**
- Guardado de cargas y lotes en Named State (`PUT`/`PATCH` con los cuerpos del SDK), el 409, el borrado y la caducidad.
- Lectura y escritura de las pestañas del libro, y el registro automático del vínculo por el dueño.
- Búsqueda de personas, filtros, selección, asignación, quitar/agregar envíos y el cálculo de avance.

**[SIN PROBAR] / pendientes**
1. Confirmar que, tras aceptar los términos de QueryBuilder (y, si hace falta, tener el rol), una cuenta no dueña consulta bien.
2. Probar contra Grid real el estado compartido (cuerpos, 409, nombres de bucket) y la escritura de un viewer por el proxy de Sheets.
3. La app de captura debe escribir `resultado` (`ENCONTRADO` / `NO_ENCONTRADO`) en `HISTORIAL`.
4. **Fotos:** no existe una vía demostrada. Propuesta a medir: un bucket por lote con una clave por foto reducida (~800 px, ~80 KB, base64), con la bitácora en `HISTORIAL` (`foto_ref`, `lote_id`, `doc_id` y un hash). Decidir antes si pueden mostrar personas.
5. «Los 10 más caros en contenedor»: falta la segunda consulta.
6. Límite práctico del tamaño de una carga (5.000 filas ≈ 1,5 MB) y de los lotes por sitio.

## 16. Decisiones y su porqué (resumen)

| Decisión | Motivo |
|---|---|
| Sin backend propio | Es lo que ofrece Grid; todo por rutas del mismo origen |
| DPE con la identidad de cada quien | La autorización de datos queda en la fuente; nadie hereda permisos de otro |
| Carga en Named State | Cualquiera con acceso puede guardar; Dataset exige ser editor |
| Lotes en estado temporal por sitio | Son de trabajo; evita cuota de Sheets; buckets acotados con caducidad |
| Sheets como bitácora de solo agregar | Seguro con varios escritores sin bloqueos |
| Historial de captura en Sheets, resultado `ENCONTRADO`/`NO_ENCONTRADO` | Es lo único durable que importa |
| Verificación de BigQuery solo informativa | No bloquear por una verificación que puede equivocarse |
| Un candado global de operación | Orden y cuota de las escrituras |
| Sin diagnóstico en la interfaz | Quien opera ya sabe la causa; la interfaz queda simple, con Damashito explicando |
| Sección del libro solo al dueño (cosmético) | Evitar confusión; la seguridad real la impone Grid |

## 17. Dónde cambiar cada cosa (mantenimiento)

Todo está en `dashboard_dpe_facility.html`; las constantes están arriba del bloque `<script>`.

| Quiero cambiar… | Dónde |
|---|---|
| Libro de control, proyectos, límite de filas, caché, tiempos | `CFG` |
| Columna sobre la que filtra el costo | `CFG.COST_COL` |
| Días que viven los lotes | `KEEP_DAYS` |
| Columnas de las pestañas | `TABS` (y la plantilla `libro_control_rutas.xlsx`) |
| El SQL | `buildSql(...)` |
| Texto de Damashito en cada paso | `guide()` |
| Enlace de los términos de QueryBuilder | `QB_TERMS` |
| Tiempo máximo de una operación | `beginBusy(..., {timeout})` en cada acción |

Archivos relacionados: `libro_control_rutas.xlsx` (plantilla del libro, 5 pestañas) y `Biblia_Grid_V24_16_Canonica.md` (evidencia y reglas de Grid detrás de estas decisiones, §16.31 y reglas 110-119).
