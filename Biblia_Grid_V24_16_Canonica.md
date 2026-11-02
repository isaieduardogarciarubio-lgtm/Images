# Biblia de Desarrollo en Grid - V24.16 Canonica

**Fecha de corte:** 2026-11-02 (V24.10: 2026-10-15; base histórica V23.5: 2026-08-16)  
**Estado:** Canónica consolidada hasta V24.16 (incluye §16.31: el rechazo de DPE `client_permission` por usuario y sus causas documentadas, el contrato real de Named State, Sheets y subida directa de Dataset, y el modelo de la app de rutas por sitio; antes, V24.15: el registro del proyecto de reporting de DPE, §16.30; antes, V24.14: el volcado completo del OpenAPI con descripciones, el SDK de Grid, la confirmación de que compartir una mini-app comparte su hoja en Drive y la evidencia de que el regreso de OAuth no es alcanzable sin VPN; antes, V24.13: la evidencia de mini-apps con varios usuarios: Google propio por usuario, roles, id del documento y almacén; antes, V24.12: DPE desde Grid por el proxy `/api/v1/dpe`, proyecto de facturación de BigQuery, la skill Data Dash Creator y el hallazgo de la «doble puerta» de las mini-apps; antes, V24.11: mini-apps/utilities con almacenamiento en Google Sheets, `requires_reconnect` de OAuth, límites de tasa de dos capas, `if_version` no atómico, OpenAPI 2026-10-29 y modelo de autorización del proxy de Sheets; antes: incluye relación documento ↔ Google Sheet vía `PUT /sheets/{id}/link`, identidad por dominio y cooldown adaptativo que reemplaza el de 65 s); base para V24.15+  
**Objeto:** Grid-only backend/data plane + HTML, sin backend propio, con Grid State, Grid Dataset (`external_push`), Sheets gestionados por Grid y capacidades browser/runtime validadas empíricamente.

<!-- GRID_BIBLIA_WEB_MANIFEST_V1
{
  "schema_version": 1,
  "source": "Biblia_Grid.md",
  "purpose": "Contracto estable entre la Biblia Markdown y la UI web.",
  "render": {
    "metadata": {
      "source": "document_header"
    },
    "limitations": {
      "closed_heading": "### Cerrado con evidencia suficiente para avanzar",
      "open_heading": "### Abierto"
    },
    "endpoints": {
      "source_heading": "## 12. Apendice A - Inventario OpenAPI completo"
    },
    "prompt_heading": "## 17. Prompt Maestro para Agentes"
  }
}
GRID_BIBLIA_WEB_MANIFEST_V1 -->


> Esta version reemplaza las conclusiones operativas de V11.6 cuando exista contradiccion. La V11.6 se conserva en `historical/` para CSP/Engine y contexto historico.
>
> **Nota de continuidad V24:** todo el cuerpo original hasta la Seccion 15.21 (corte 2026-08-16) se conserva intacto abajo, sin editar, por la regla de no sobreescribir evidencia cruda (§15.1/§15.21). La Seccion 16 (nueva, corte 2026-08-21/26) documenta un cambio de plataforma que **reemplaza** partes especificas de §4.5, §4.6, §7, §9 y §15.7-§15.16 — se señala explicitamente cual conclusion queda obsoleta y por que, en vez de borrarla.
>
> **Nota de continuidad V24.11:** el cuerpo hasta §16.25.8 se conserva intacto. La Sección 16.26 (nueva, corte 2026-10-29) agrega evidencia sobre mini-apps (`/api/v1/utilities`), OAuth de Google, límites de tasa, concurrencia por `if_version`, el OpenAPI vivo y el modelo de autorización del proxy de Sheets. Las conclusiones previas que ajusta se listan en §16.26.9; el Prompt Maestro (§17) añade las reglas 66-77.
>
> **Nota de continuidad V24.12:** el cuerpo hasta §16.26.11 se conserva intacto. La Sección 16.27 (nueva, mismo corte 2026-10-29) agrega la integración con Data Platform Engine (DPE) desde documentos de Grid, el proxy `/api/v1/dpe` (ausente del OpenAPI), el modelo de proyecto de datos frente a proyecto de facturación, la revisión de la skill Data Dash Creator, el hallazgo de que el Sheet de una mini-app también es alcanzable por el proxy de Sheets, y la lista de endpoints pendientes de probar. Las conclusiones previas que ajusta se listan en §16.27.10; el Prompt Maestro (§17) añade las reglas 78-90.
>
> **Nota de continuidad V24.13:** el cuerpo hasta §16.27.12 se conserva intacto. La Sección 16.28 (nueva, corte 2026-10-30) cierra con evidencia runtime la pregunta de las mini-apps con varios usuarios: cada usuario necesita su propia cuenta de Google vinculada, el id de la mini-app está en la URL, y un viewer con Google verificado lee y crea registros pero no edita los ajenos. Las conclusiones previas que ajusta se listan en §16.28.9; el Prompt Maestro (§17) añade las reglas 91-98.
>
> **Nota de continuidad V24.14:** el cuerpo hasta §16.28.11 se conserva, con tres correcciones puntuales marcadas en el texto (utility-editor-sharing, evidencia sobre VPN y la lista de preguntas abiertas). La Sección 16.29 (nueva, corte 2026-10-30) recoge el volcado completo del OpenAPI con descripciones, el SDK de Grid (`grid-sdk.js`), la prueba de conexión de Google sin VPN y la confirmación del usuario de que compartir una mini-app comparte su hoja de Google. Las conclusiones previas que ajusta se listan en §16.29.9; el Prompt Maestro (§17) añade las reglas 99-108.
>
> **Nota de continuidad V24.15:** cambio acotado. Se registra en §16.30 el ID del proyecto de reporting (`billing_project` de DPE), que V24.12 había omitido por una regla de privacidad demasiado estricta; el **número** del proyecto sigue omitido. Se ajustan la nota de privacidad de §16.27, el veredicto de §16.27.1 y la regla 81; el Prompt Maestro (§17) añade la regla 109.
>
> **Nota de continuidad V24.16:** el cuerpo hasta §16.30.4 se conserva, con cuatro correcciones puntuales marcadas en el texto como **[CORREGIDO/PRECISIÓN V24.16]** (cuerpo de la subida directa de Dataset en §4.3 y §16.5; alcance del veredicto de escritura de Sheets en §16.28.1; uso de `meli-bi-data` en §16.30.3; y el criterio de privacidad sobre el rol y las URL de Shield). La Sección 16.31 (nueva, corte 2026-11-02) reúne lo aprendido al construir una app de varios usuarios no propietarios sobre DPE, Sheets y Named State, y el Prompt Maestro (§17) añade las reglas 110-119.

## 0. Regla de evidencia

Toda afirmacion nueva debe etiquetarse mentalmente como:

- **[OPENAPI]** contrato capturado en `/openapi.json`.
- **[RUNTIME]** comportamiento observado empiricamente en una sesion/documento/ruta concreta.
- **[HISTORICO]** hallazgo previo que no fue revalidado en la ronda actual.

No convertir contrato OpenAPI en runtime sin prueba. No universalizar desde una ruta, usuario o documento a toda la plataforma.

## 1. Objetivo de arquitectura

```text
HTML Grid
  |
  +-- GET /api/v1/me
  |
  +-- Named Grid State
  |     +-- eventos / mutaciones
  |     +-- sharding
  |     +-- optimistic queue + verification
  |
  +-- Grid Dataset
  |     +-- snapshots grandes
  |     +-- reporting / analytics
  |     +-- Grid-managed BigQuery refresh
  |
  +-- Grid Sheets proxy
        +-- OAuth del owner resuelto server-side
```

Documentos usados en la investigacion: IDs omitidos en esta version canonica por privacidad; conservar solo en evidencia privada cuando sean estrictamente necesarios.

## 2. Identidad: regla canonica

Endpoint: `GET /api/v1/me` con `credentials: "include"`.

Usar **solo el primer campo estable disponible**, en este orden:

`id > user_id > userId > username > nickname > login > email`

Hash SHA-256 solo de ese valor. Persistir `source_field`, nunca `/me` completo ni la concatenacion de campos volatiles.

```js
function extractIdentityMaterial(me) {
  if (!me || typeof me !== 'object') {
    return {source_field:'fallback_scalar', material:String(me)};
  }
  const candidates = [
    ['id',me.id], ['user_id',me.user_id], ['userId',me.userId],
    ['username',me.username], ['nickname',me.nickname],
    ['login',me.login], ['email',me.email]
  ];
  for (const [key,value] of candidates) {
    if (value != null && String(value).trim() !== '') {
      return {source_field:key, material:String(value)};
    }
  }
  return {source_field:'stable_object_fallback', material:stableStringify(me)};
}
```

V19/V20.x verificaron X/A y B como identidades distintas usando `username` como primer campo estable disponible en esas respuestas.

## 3. OpenAPI capturado

Fuente primaria: `evidence/grid_v17_api_surface_discovery_2026-08-16T20-30-05-415Z.json`.

- OpenAPI: **3.1.0**
- title: **Grid - File Sharing for AI Agents**
- version del servicio: **1.0.0**
- paths: **203**
- operations: **255**
- `/openapi.json`: 200, 329814 bytes en V17.
- `/docs`: 200 (Swagger UI).
- `/redoc`: 200.
- probes POST a `/graphql`, `/api/graphql`, `/api/v1/graphql`: 403 identicos; eso **no confirma** la existencia de GraphQL.

El inventario completo de los 203 paths OpenAPI esta en el **Apendice A**.

## 4. Grid Dataset

### 4.1 Modelo runtime

**[RUNTIME] Dataset es un snapshot store.** En las rutas probadas, publicar un array reemplaza el snapshot completo; no se observo merge/upsert por `id`. Duplicate IDs sobreviven. Una mutacion logica de una fila reescribe el snapshot y un writer stale puede causar lost update.

No describir Dataset como DB transaccional ni como row store.

### 4.2 Flujo `external_push`

```text
POST /api/v1/documents/{doc_id}/datasets/{name}/upload-url
 -> revision + upload_url + publish_url
PUT  /api/v1/documents/{doc_id}/datasets/{name}/upload-content/{revision}
POST /api/v1/documents/{doc_id}/datasets/{name}/publish
GET  /api/v1/documents/{doc_id}/data/{name}
GET  /api/v1/documents/{doc_id}/data/{name}/content
```

Para `json_rows`, el cuerpo staged observado fue un array JSON raw.

### 4.3 Upload directo

`POST /api/v1/documents/{doc_id}/datasets/{name}/data`

**[CORREGIDO V24.16, §16.31.4]:** en runtime el cuerpo debe ser un objeto `{"rows": [...]}` (`DatasetDirectUploadRequest`); un array crudo devuelve 422. Lo que sigue describe la lectura previa del OpenAPI.

**[OPENAPI]** acepta un array JSON de rows, publica una revision de forma atomica, auto-crea la definicion si no existe, tiene threshold grande configurable (default documentado: 10 MB) y es owner/editor only. Para mayores, el contrato remite a `upload-url`.

### 4.4 Legacy Dataset

- `GET /api/v1/documents/{doc_id}/data`
- `GET|PUT|DELETE /api/v1/documents/{doc_id}/data/{name}`
- `GET /api/v1/documents/{doc_id}/data/{name}/content`
- `POST /api/v1/documents/{doc_id}/data/refresh`

**[OPENAPI]** el PUT legacy actualiza `data/{name}.json` y `data/_manifest.json`, computa row_count, columns, size_bytes y checksum, y es owner/editor only.

### 4.5 Dataset Definitions V2

- `GET /api/v1/documents/{doc_id}/datasets`
- `GET|POST|PATCH /api/v1/documents/{doc_id}/datasets/{name}`
- `POST /api/v1/documents/{doc_id}/datasets/{name}/refresh`

`DatasetDefinitionRequest`:

```text
source_type: grid_sql | external_push
refresh_mode: grid_refresh | external
format: json_rows | json_columnar | parquet
optional: description, source, source_config, output_config
```

### 4.6 BigQuery gestionado por Grid

Ejemplo de contrato:

```json
{
  "ventas_q1": {
    "source_type": "grid_sql",
    "refresh_mode": "grid_refresh",
    "format": "json_columnar",
    "source": "bigquery",
    "source_config": {"sql": "SELECT ..."}
  }
}
```

El OpenAPI indica que `grid_sql` crea la definicion y dispara refresh; `external_push` crea la definicion y devuelve informacion de upload/publish.

`POST /api/v1/documents/{doc_id}/data/refresh` encola datasets BigQuery-backed que tengan query almacenada y requiere write access.

**No encontrado en el OpenAPI capturado:** un endpoint generico de SQL ad hoc tipo `/api/v1/query`. La superficie observada de BigQuery esta orientada a Dataset definitions + refresh. El mecanismo exacto de autenticacion BigQuery no fue establecido.

### 4.7 Escala Dataset

V15.1 payload ladder: 30, 40, 60, 80 y 100 MiB, 5/5 exitosos. Conclusion permitida: **Dataset soporto al menos 100 MiB en el flujo probado.** No decir "ilimitado".

### 4.8 Filter/query reads

V15.1 corregido no observo reduccion server-side en las variantes de query probadas. No afirmar que Grid no tenga ninguna query server-side en toda su superficie; afirmar solo que no se observo reduccion en `/content` con las variantes probadas.

### 4.9 Consistencia y backpressure

Observado:

- control/metadata/upload/content pueden converger en momentos distintos;
- vistas stale/no monotonicas;
- 404 post-create/reserve puede ser propagacion;
- 409 revision mismatch puede corresponder a estado stale conocido;
- 429 + `Retry-After` debe convertirse en gate global;
- V13 writer resiliente alcanzo 20/20 single-writer.

Politica: respetar `Retry-After` crudo; usar revision ledger; no declarar external supersede por una sola lectura stale.

### 4.10 ACL Dataset

V16:

- viewer real: metadata/content permitidos en las rutas probadas;
- create/reserve/upload/publish: 403 en las rutas probadas.

No tenemos editor ground-truth independiente. No generalizar a rutas no probadas.

## 5. Grid State

### 5.1 Endpoints

Default:

- `GET|PUT|PATCH /api/v1/documents/{doc_id}/state`

Named:

- `GET|PUT|PATCH /api/v1/documents/{doc_id}/states/{state_name}`

### 5.2 Contrato default State

**[OPENAPI] PUT**: "Anyone with read access can write", recomienda `if_updated_at` y documenta **100 MB por state bucket**.

**[OPENAPI] PATCH**: merge de claves top-level; clave con `null` elimina; claves omitidas se preservan; `if_updated_at` activa chequeo optimista; sin token el merge es incondicional.

### 5.3 Runtime named State - V18

En named State, con viewer real, se verifico:

- GET 200;
- insert PATCH;
- update PATCH;
- null-delete;
- full PUT;
- aislamiento entre buckets;
- stale token secuencial -> 409 y la clave stale no persistio;
- concurrencia en claves distintas con overlap real y supervivencia de las claves en las rondas limpias.

Default State no fue el objeto de esas pruebas; no extrapolar automaticamente.

### 5.4 Escala y amplificacion - V19

Se verificaron 1, 5, 10, 25, 50 y 90 MiB. Un tiny PATCH devuelve una respuesta del orden del bucket completo.

Datos medidos:

| Bucket | tiny PATCH | response bytes |
|---:|---:|---:|
| 1 MiB | 428 ms | 1,048,846 |
| 5 MiB | 389 ms | 5,243,150 |
| 10 MiB | 579 ms | 10,486,032 |
| 25 MiB | 2,160 ms | 26,214,672 |
| 50 MiB | 3,109 ms | 52,429,072 |
| 90 MiB | 4,266 ms | 94,372,112 |

Esto demuestra **amplificacion visible al cliente**; no prueba una reescritura interna del servidor.

Recomendacion de diseno, no limite contractual:

- <=5-10 MiB/bucket: ideal interactivo;
- 10-25 MiB: ocasional/aceptable;
- 50+ MiB: evitar para writes frecuentes.

### 5.5 Same-key race - V19

En dos rondas limpias con overlap real, A y B obtuvieron 200 escribiendo la misma top-level key y solo un valor completo termino persistido. Describir la key como **competing replacement domain**. No llamarlo last-write-wins: no conocemos el orden interno de commit.

### 5.6 `if_updated_at` no es CAS atomico estricto

V18 demostro deteccion de stale write secuencial. V19 demostro simultaneidad con el mismo baseline token donde 2/3 rondas aceptaron ambos writes (200/200) y solo un valor final quedo.

Conclusion: `if_updated_at` sirve como stale-write detector y coordinacion optimista, pero **no debe tratarse como lock, mutex, transaccion ni CAS linearizable**.

### 5.7 Contraejemplo V20.1: 200 != durable

Burst cross-user con 12 unique-key PATCH:

- 12/12 first attempt -> HTTP 2xx;
- 6/12 eventos finalmente persistidos;
- 11 pares de overlap cross-user; max overlap 370 ms.

Conclusion: unique keys por si solas no garantizan merge durable bajo burst multiwriter; **HTTP 200 no equivale a write durable**.

### 5.8 Patron canonico V20.2: optimistic queue + verification

```text
1 logical write in-flight por writer

GET bucket
 -> updated_at = T
PATCH unique-key + if_updated_at:T
 -> 409: jitter, GET, retry
 -> 2xx: GET inmediato, verificar write_id
          esperar estabilidad
          GET de estabilidad, verificar write_id otra vez
```

V20.2:

- 12/12 nuevos eventos persistidos establemente;
- 1 conflicto 409 real;
- 0 lost-after-2xx;
- 0 repair commits;
- stable double read true;
- replay: 18 -> 30 eventos, qty esperado 473 == observado 473;
- materializacion mecanica y semantica verificadas;
- `optimistic_cas_queue_candidate: true`;
- `v20_2_closed: true`.

### 5.9 Regla de produccion provisional para State

Para writes criticos:

1. top-level unique key (`event:<uuid>` preferido para invariantes);
2. `_write_id` unico dentro del valor;
3. GET del bucket y captura del ultimo `updated_at`;
4. PATCH con `if_updated_at`;
5. 409 -> jitter + rebase/retry;
6. 429 -> gate global por `Retry-After`;
7. 503/ambiguous -> reread antes de retry; si el mismo write_id ya esta, tratar como committed;
8. despues de 2xx, reread inmediato y reread estable;
9. una sola operacion logica in-flight por writer;
10. no confiar en una key mutable compartida para invariantes estrictas.

## 6. Sharding y event model - V20

V20 verifico routing con 8 shards y FNV1a32 en el harness. El patron de producto recomendado es:

```text
event buckets:        app_evt_s00..sNN
materialized buckets: app_mat_s00..sNN
row/entity -> deterministic shard
```

Los eventos son la fuente durable logica; la proyeccion mutable es cache/materializacion. Un materializer designado evita same-key multiwriter en la proyeccion.

Importante: el V20 inicial no probo overlap; V20.1 probo que burst libre falla; V20.2 cerro el protocolo cooperativo con verificacion.

## 7. Google Sheets via Grid

OpenAPI capturado:

- `GET /api/v1/sheets/search?title=...&doc_id=...`
- `GET /api/v1/sheets/{sheet_id}/metadata?doc_id=...`
- `GET /api/v1/sheets/{sheet_id}?doc_id=...&range=...`
- `PUT /api/v1/sheets/{sheet_id}?doc_id=...`
- `POST /api/v1/sheets/{sheet_id}/append?doc_id=...`
- `DELETE /api/v1/sheets/{sheet_id}/values?doc_id=...&range=...` (202, clear encolado)
- `POST /api/v1/sheets/{sheet_id}/batch?doc_id=...`

El contrato dice que Grid usa el OAuth del owner server-side, por lo que el token no llega al browser. ACL viewer sobre este proxy sigue sin prueba runtime y es security-critical si se usa en una app compartida.

## 8. Arquitectura canonica V21+

```text
HTML
  +-- GridStateQueue SDK
  |     +-- identity hygiene
  |     +-- global 429 gate
  |     +-- optimistic GET/PATCH/verify
  |     +-- ambiguous-response reread
  |     +-- metrics
  |
  +-- ShardRouter
  |     +-- events: immutable-ish unique keys
  |     +-- materialized UI state: small named buckets
  |
  +-- Grid Dataset
  |     +-- compact snapshots
  |     +-- exports/reporting
  |     +-- BigQuery Grid-managed materialization
  |
  +-- Grid Sheets proxy (cuando aplique)
```

## 9. Lo cerrado y lo abierto

### Cerrado con evidencia suficiente para avanzar

- Dataset replace-snapshot semantics.
- Dataset >=100 MiB observado.
- Dataset viewer ACL en rutas probadas.
- Named State viewer CRUD en rutas probadas.
- Named State isolation y null-delete.
- stale sequential `if_updated_at` -> 409.
- State hasta 90 MiB observado y response amplification.
- same-key concurrent race insegura.
- strict atomic CAS no demostrado y contradicho por rondas V19.
- distinct-key burst libre inseguro (V20.1).
- HTTP 200 no equivale a durable (V20.1).
- optimistic queue cooperativa viable con 2 usuarios (V20.2).
- sharding + deterministic replay + designated materialization.
- OpenAPI Sheets proxy y BigQuery Dataset definition/refresh.

### Abierto

- 3-5+ writers usando **el protocolo V20.2**.
- throughput maximo por shard y relacion writers -> 409/latencia.
- backoff/jitter optimo.
- shard rotation/compaction.
- materializer leadership/failover.
- durabilidad a horas/dias, no solo double-read corto.
- runtime real `grid_sql` BigQuery y autenticacion implicita.
- ACL viewer del proxy Sheets si se piensa usar compartido.
- query/index server-side para State: no se encontro una primitive tipo DB query en lo capturado.

No reintroducir pruebas `no-access` salvo pedido explicito del usuario; esa dimension fue descartada como siguiente prioridad.

## 10. Roadmap acordado

### V21.0 - GridStateQueue SDK + load characterization

Construir un modulo reusable con:

```text
identity()
get(bucket)
commitUnique(bucket,key,value)
withOptimisticQueue(...)
verifyImmediate(...)
verifyStable(...)
retry409WithJitter(...)
retryAmbiguousByReread(...)
global429Gate(...)
metrics()
```

Stress con 2, 3 y 5 writers, 20 eventos por writer, siempre un write logico in-flight por writer. Medir p50/p95/p99, 409/write, retries/write, 429, 503, lost-after-2xx, throughput y convergencia exacta.

### V21.1 - sharding + rotation/compaction

- comparar shard counts y sizes;
- mantener buckets interactivos <=5-10 MiB cuando sea posible;
- definir rotacion y snapshot compactado;
- probar replay desde snapshot + tail events.

### V22 - app CRUD real Grid-only

Construir una app real (tracking/orders/tasks/incidents) con create/update/delete/comments/status/audit, proyeccion materializada y Dataset snapshot. Resolver UX de conflictos, schema y loading.

### V23 - BigQuery `grid_sql` proof

Crear una Dataset definition BigQuery real, disparar refresh, leer el resultado y cerrar mecanismo de autenticacion/errores/cadencia. No buscar SQL ad hoc si el contrato sigue exponiendo Dataset-managed SQL.

### V24 opcional - Sheets ACL/integrations

Solo si un caso de uso lo necesita: probar viewer ACL del Sheets proxy y patrones de read/write/batch.

## 11. CSP / Engine / otras capacidades historicas

La V11.6 contenia whitelist CSP, Engine, Folders, Workspaces, Presentations y observaciones de estabilidad. Se conserva completa en `historical/Biblia_Grid_V11_6_Actualizada.md`.

Regla: tratar esas afirmaciones como **[HISTORICO]** hasta revalidar si son relevantes. En particular, no dejar que una conclusion historica sobre State contradiga V18-V20.2 sin una nueva prueba comparable.

## 12. Apendice A - Inventario OpenAPI completo (203 paths / 255 operations)

El siguiente inventario se genero directamente de `results.openapi[0].parsed.paths` del snapshot V17. Su presencia indica contrato OpenAPI capturado, no que cada operacion haya sido probada en runtime.

### Documents

- `/api/v1/documents`
  - **POST** - Upload Document
  - **GET** - List Documents
- `/api/v1/documents/backfill-owner-index`
  - **POST** - Backfill Owner Index
- `/api/v1/documents/backfill-public-index`
  - **POST** - Backfill Public Index
- `/api/v1/documents/diagnose-kvs`
  - **GET** - Diagnose Kvs
- `/api/v1/documents/link-drive`
  - **POST** - Link Drive File
- `/api/v1/documents/read-owner-index`
  - **GET** - Read Owner Index
- `/api/v1/documents/rebuild-all-owner-indexes-from-qkvs-doc-id-shards`
  - **POST** - Rebuild Owner Indexes For Users Endpoint
- `/api/v1/documents/rebuild-owner-index-from-dump`
  - **POST** - Rebuild Owner Index From Dump
- `/api/v1/documents/rebuild-owner-index-from-kvs`
  - **POST** - Rebuild Owner Index From Kvs
- `/api/v1/documents/rebuild-owner-indexes-for-users`
  - **POST** - Rebuild Owner Indexes For Users Endpoint
- `/api/v1/documents/sync-owner-kvs-listing`
  - **POST** - Sync Owner Kvs Listing
- `/api/v1/documents/upload-url`
  - **POST** - Request Upload Url
- `/api/v1/documents/{doc_id}`
  - **GET** - Get Document
  - **PATCH** - Update Document
  - **DELETE** - Delete Document
- `/api/v1/documents/{doc_id}/activity`
  - **GET** - Get Activity Timeline
- `/api/v1/documents/{doc_id}/bundle-files`
  - **GET** - Get Document Bundle Files
- `/api/v1/documents/{doc_id}/comments`
  - **POST** - Create Comment
  - **GET** - List Comments
- `/api/v1/documents/{doc_id}/confirm`
  - **POST** - Confirm Upload
- `/api/v1/documents/{doc_id}/data`
  - **GET** - List Datasets
- `/api/v1/documents/{doc_id}/data/refresh`
  - **POST** - Refresh Datasets
- `/api/v1/documents/{doc_id}/data/{name}`
  - **PUT** - Upsert Dataset
  - **GET** - Get Dataset
  - **DELETE** - Delete Dataset
- `/api/v1/documents/{doc_id}/data/{name}/content`
  - **GET** - Get Dataset Content
- `/api/v1/documents/{doc_id}/datasets`
  - **GET** - List Dataset Definitions
- `/api/v1/documents/{doc_id}/datasets/{name}`
  - **POST** - Create Dataset Definition
  - **PATCH** - Update Dataset Definition
  - **GET** - Get Dataset Definition
- `/api/v1/documents/{doc_id}/datasets/{name}/data`
  - **POST** - Upload Dataset Direct
- `/api/v1/documents/{doc_id}/datasets/{name}/publish`
  - **POST** - Publish Dataset
- `/api/v1/documents/{doc_id}/datasets/{name}/refresh`
  - **POST** - Refresh Dataset Definition
- `/api/v1/documents/{doc_id}/datasets/{name}/upload-content/{revision}`
  - **PUT** - Upload Dataset Content
- `/api/v1/documents/{doc_id}/datasets/{name}/upload-url`
  - **POST** - Request Dataset Upload Url
- `/api/v1/documents/{doc_id}/disable-notifications`
  - **POST** - Disable Notifications
- `/api/v1/documents/{doc_id}/download`
  - **GET** - Download Document
- `/api/v1/documents/{doc_id}/enable-notifications`
  - **POST** - Enable Notifications
- `/api/v1/documents/{doc_id}/favorite`
  - **POST** - Favorite Document
  - **DELETE** - Unfavorite Document
- `/api/v1/documents/{doc_id}/lock`
  - **GET** - Get Lock Status
  - **POST** - Acquire Lock
  - **DELETE** - Release Lock
- `/api/v1/documents/{doc_id}/mute-notifications`
  - **POST** - Mute Notifications
- `/api/v1/documents/{doc_id}/permissions`
  - **PUT** - Update Permissions
  - **GET** - Get Permissions
- `/api/v1/documents/{doc_id}/request-edit-access`
  - **POST** - Request Edit Access
- `/api/v1/documents/{doc_id}/request-ownership`
  - **POST** - Request Ownership
- `/api/v1/documents/{doc_id}/request-share`
  - **POST** - Request Share
- `/api/v1/documents/{doc_id}/restore`
  - **POST** - Restore Document
- `/api/v1/documents/{doc_id}/reviews`
  - **POST** - Submit Review
  - **GET** - List Reviews
- `/api/v1/documents/{doc_id}/reviews/request`
  - **POST** - Request Review
- `/api/v1/documents/{doc_id}/reviews/status`
  - **GET** - Get Review Status
- `/api/v1/documents/{doc_id}/rollback`
  - **POST** - Rollback Document
- `/api/v1/documents/{doc_id}/sections`
  - **GET** - List all sections
- `/api/v1/documents/{doc_id}/sections/assemble`
  - **POST** - Assemble sections into a new version
- `/api/v1/documents/{doc_id}/sections/bulk`
  - **POST** - Create multiple sections at once
- `/api/v1/documents/{doc_id}/sections/reorder`
  - **PUT** - Reorder sections
- `/api/v1/documents/{doc_id}/sections/{name}`
  - **GET** - Get section metadata
  - **PUT** - Create or update a section
  - **DELETE** - Delete a section
- `/api/v1/documents/{doc_id}/sections/{name}/content`
  - **GET** - Download section content
- `/api/v1/documents/{doc_id}/sections/{name}/editors`
  - **PUT** - Add or remove editors from a section
- `/api/v1/documents/{doc_id}/sections/{name}/transfer`
  - **POST** - Reassign a section to a different owner
- `/api/v1/documents/{doc_id}/share`
  - **POST** - Share Document
- `/api/v1/documents/{doc_id}/state`
  - **GET** - Get State
  - **PUT** - Set State
  - **PATCH** - Patch State
- `/api/v1/documents/{doc_id}/states/{state_name}`
  - **GET** - Get Named State
  - **PUT** - Set Named State
  - **PATCH** - Patch Named State
- `/api/v1/documents/{doc_id}/transfer`
  - **POST** - Transfer Ownership
- `/api/v1/documents/{doc_id}/transfer-ownership`
  - **POST** - Transfer Ownership
- `/api/v1/documents/{doc_id}/trim-sharing-history`
  - **POST** - Trim Sharing History
- `/api/v1/documents/{doc_id}/undo-replace`
  - **POST** - Undo Replace Document
- `/api/v1/documents/{doc_id}/unmute-notifications`
  - **POST** - Unmute Notifications
- `/api/v1/documents/{doc_id}/upload-content`
  - **PUT** - Upload Content
- `/api/v1/documents/{doc_id}/versions`
  - **GET** - List Document Versions
  - **DELETE** - Purge Document Versions
  - **POST** - Upload Document Version
- `/api/v1/documents/{doc_id}/versions/{version}`
  - **DELETE** - Delete Document Version
- `/api/v1/documents/{doc_id}/views`
  - **POST** - Record View
  - **GET** - Get View Analytics
- `/api/v1/documents/{doc_id}/views/audience`
  - **PUT** - Set Audience
- `/api/v1/documents/{doc_id}/views/check`
  - **GET** - Check Viewed
- `/api/v1/documents/{doc_id}/workflow/status`
  - **GET** - Get Workflow Status
- `/api/v1/documents/{doc_id}/workflow/submit-for-review`
  - **POST** - Submit For Review
- `/api/v1/documents/{doc_id}/workflow/transition`
  - **PATCH** - Transition Workflow

### Identity / Me

- `/api/v1/me`
  - **GET** - Get Me
- `/api/v1/me/insights`
  - **GET** - Get Me Insights
- `/api/v1/me/org`
  - **GET** - Get Me Org
- `/api/v1/me/recently-viewed`
  - **GET** - Get Recently Viewed
- `/api/v1/me/social`
  - **GET** - Get Me Social
- `/api/v1/me/starred`
  - **GET** - Get Starred

### Sheets

- `/api/v1/sheets/search`
  - **GET** - Search Sheets
- `/api/v1/sheets/{sheet_id}`
  - **GET** - Proxy Sheet Values
  - **PUT** - Write Sheet Values
- `/api/v1/sheets/{sheet_id}/append`
  - **POST** - Append Sheet Values
- `/api/v1/sheets/{sheet_id}/batch`
  - **POST** - Batch Sheet Operations
- `/api/v1/sheets/{sheet_id}/metadata`
  - **GET** - Get Sheet Metadata
- `/api/v1/sheets/{sheet_id}/values`
  - **DELETE** - Clear Sheet Range

### Google

- `/api/v1/google/drive/files/upload`
  - **POST** - Upload To Drive
- `/api/v1/google/drive/files/{file_id}`
  - **GET** - Get Drive File
- `/api/v1/google/drive/files/{file_id}/download`
  - **GET** - Download Drive File
- `/api/v1/google/drive/share`
  - **POST** - Share Drive Resource
- `/api/v1/google/gmail/send`
  - **POST** - Send Gmail
- `/api/v1/google/oauth`
  - **DELETE** - Disconnect Google Oauth
- `/api/v1/google/oauth/start`
  - **GET** - Start Google OAuth (redirect)
- `/api/v1/google/oauth/status`
  - **GET** - Google Oauth Status

### Engine

- `/api/v1/engine/run`
  - **POST** - Run Engine
- `/api/v1/engine/run/json`
  - **POST** - Run Engine Json

### Fetch

- `/api/v1/fetch`
  - **POST** - Grid Fetch

### Search

- `/api/v1/search`
  - **POST** - Search

### Security

- `/api/v1/security/documents/{document_id}/privatize`
  - **POST** - Privatize

### People

- `/api/v1/people/me/peers`
  - **GET** - Get My Peers
- `/api/v1/people/me/profile`
  - **GET** - Get My Profile
- `/api/v1/people/me/reports`
  - **GET** - Get My Direct Reports
- `/api/v1/people/me/team`
  - **GET** - Get My Team
- `/api/v1/people/search`
  - **GET** - Search People
- `/api/v1/people/sync`
  - **POST** - Sync People Directory

### Notifications

- `/api/v1/notifications`
  - **GET** - List Notifications
- `/api/v1/notifications/approve-all/{doc_id}`
  - **POST** - Approve All Share Requests
- `/api/v1/notifications/debug/send`
  - **POST** - Debug Send
- `/api/v1/notifications/debug/types`
  - **GET** - List Types
- `/api/v1/notifications/incoming-requests`
  - **GET** - Incoming Requests
- `/api/v1/notifications/my-requests`
  - **GET** - My Sent Requests
- `/api/v1/notifications/pending-requests/{doc_id}`
  - **GET** - Get Pending Requests
- `/api/v1/notifications/send`
  - **POST** - Send Message
- `/api/v1/notifications/{notification_id}/approve`
  - **POST** - Approve Share Request
- `/api/v1/notifications/{notification_id}/decline`
  - **POST** - Decline Share Request
- `/api/v1/notifications/{notification_id}/read`
  - **PATCH** - Mark Notification Read

### Presentations

- `/api/v1/presentations`
  - **POST** - Create Presentation
- `/api/v1/presentations/{id}`
  - **GET** - Get Presentation
  - **PATCH** - Update Presentation Theme
- `/api/v1/presentations/{id}/slides`
  - **POST** - Add Slide
- `/api/v1/presentations/{id}/slides/order`
  - **PUT** - Reorder Slides
- `/api/v1/presentations/{id}/slides/{slide_id}`
  - **GET** - Get Slide
  - **PATCH** - Link Slide Doc
  - **DELETE** - Remove Slide
- `/api/v1/presentations/{id}/slides/{slide_id}/metadata`
  - **PATCH** - Update Slide Metadata
- `/api/v1/presentations/{id}/slides/{slide_id}/visibility`
  - **PATCH** - Set Slide Visibility
- `/api/v1/presentations/{id}/templates`
  - **GET** - List Templates
  - **POST** - Add Template
- `/api/v1/presentations/{id}/templates/{template_id}`
  - **PUT** - Update Template
  - **DELETE** - Delete Template

### Decks

- `/api/v1/decks`
  - **GET** - List Decks
  - **POST** - Create Deck
- `/api/v1/decks/{id}`
  - **GET** - Get Deck
  - **PUT** - Update Deck
  - **DELETE** - Delete Deck

### Templates

- `/api/v1/templates`
  - **GET** - List Templates
- `/api/v1/templates/{template_id}`
  - **GET** - Get Template
- `/api/v1/templates/{template_id}/render`
  - **POST** - Render Template
- `/api/v1/templates/{template_id}/render-and-upload`
  - **POST** - Render And Upload
- `/api/v1/templates/{template_id}/render-and-upload-live`
  - **POST** - Render And Upload Live

### Workspaces

- `/api/v1/workspaces`
  - **POST** - Create Workspace
  - **GET** - List Workspaces
- `/api/v1/workspaces/{workspace_id}`
  - **GET** - Get Workspace
  - **PATCH** - Patch Workspace
  - **DELETE** - Delete Workspace
- `/api/v1/workspaces/{workspace_id}/documents`
  - **GET** - List Workspace Documents
  - **POST** - Add Document To Workspace
- `/api/v1/workspaces/{workspace_id}/documents/{doc_id}`
  - **DELETE** - Remove Document From Workspace
- `/api/v1/workspaces/{workspace_id}/folders`
  - **GET** - List Workspace Folders
  - **POST** - Add Folder To Workspace
- `/api/v1/workspaces/{workspace_id}/folders/{folder_id}`
  - **DELETE** - Remove Folder From Workspace
- `/api/v1/workspaces/{workspace_id}/members`
  - **POST** - Add Members
  - **DELETE** - Remove Members
- `/api/v1/workspaces/{workspace_id}/members/me`
  - **DELETE** - Leave Workspace

### Folders

- `/api/v1/folders`
  - **POST** - Create Folder
  - **GET** - List Folders
- `/api/v1/folders/{folder_id}`
  - **GET** - Get Folder
  - **PATCH** - Patch Folder
  - **DELETE** - Delete Folder
- `/api/v1/folders/{folder_id}/documents`
  - **POST** - Add Document To Folder
- `/api/v1/folders/{folder_id}/documents/{doc_id}`
  - **DELETE** - Remove Document From Folder
- `/api/v1/folders/{folder_id}/move`
  - **POST** - Move Folder
- `/api/v1/folders/{folder_id}/permissions`
  - **GET** - Get Folder Permissions
  - **PUT** - Update Folder Permissions
- `/api/v1/folders/{folder_id}/share`
  - **POST** - Share Folder

### Groups

- `/api/v1/groups`
  - **GET** - List Groups
  - **POST** - Create Group
- `/api/v1/groups/{group_id}`
  - **GET** - Get Group
  - **PATCH** - Rename Group
  - **DELETE** - Delete Group
- `/api/v1/groups/{group_id}/members`
  - **POST** - Add Members
- `/api/v1/groups/{group_id}/members/{ldap}`
  - **DELETE** - Remove Member
- `/api/v1/groups/{group_id}/share`
  - **POST** - Share Group
- `/api/v1/groups/{group_id}/share/{ldap}`
  - **DELETE** - Revoke Share
- `/api/v1/groups/{group_id}/unsubscribe`
  - **POST** - Unsubscribe Group

### Comments

- `/api/v1/comments/{comment_id}`
  - **PATCH** - Update Comment
  - **DELETE** - Delete Comment
- `/api/v1/comments/{comment_id}/accept-suggestion`
  - **POST** - Accept Suggestion
- `/api/v1/comments/{comment_id}/reactions`
  - **POST** - Add Reaction
- `/api/v1/comments/{comment_id}/reactions/{emoji}`
  - **DELETE** - Remove Reaction
- `/api/v1/comments/{comment_id}/reject-suggestion`
  - **POST** - Reject Suggestion
- `/api/v1/comments/{comment_id}/replies`
  - **GET** - Get Replies
- `/api/v1/comments/{comment_id}/resolve`
  - **PATCH** - Resolve Thread

### Collections

- `/api/v1/collections`
  - **POST** - Create Collection [DEPRECATED]
  - **GET** - List Collections [DEPRECATED]
- `/api/v1/collections/{collection_id}`
  - **GET** - Get Collection [DEPRECATED]
  - **PATCH** - Patch Collection [DEPRECATED]
  - **DELETE** - Delete Collection [DEPRECATED]
- `/api/v1/collections/{collection_id}/documents`
  - **POST** - Add Document To Collection [DEPRECATED]
- `/api/v1/collections/{collection_id}/documents/{doc_id}`
  - **DELETE** - Remove Document From Collection [DEPRECATED]

### Contacts

- `/api/v1/contacts`
  - **GET** - Get Contacts
  - **POST** - Add Contact
- `/api/v1/contacts/{ldap}`
  - **DELETE** - Remove Contact

### Slack API

- `/api/v1/slack/channels`
  - **GET** - Search Channels
- `/api/v1/slack/send-file`
  - **POST** - Send File
- `/api/v1/slack/send-message`
  - **POST** - Send Message
- `/api/v1/slack/share-with-channel`
  - **POST** - Share With Channel
- `/api/v1/slack/users`
  - **GET** - Search Users

### Tokens

- `/api/v1/tokens`
  - **GET** - List Tokens
  - **POST** - Create Token
- `/api/v1/tokens/{token_id}`
  - **PATCH** - Set Token Enabled
  - **DELETE** - Revoke Token

### Jobs

- `/api/v1/jobs/{job_id}`
  - **GET** - Get Job

### Admin

- `/api/v1/admin/users/{user_id}/transfer-all-ownership`
  - **POST** - Transfer All Ownership

### Users

- `/api/v1/users/{user_id}/request-ownership-transfer`
  - **POST** - Request Ownership Transfer

### Viewer / d

- `/d/_assets/grid-logo.ico`
  - **GET** - Grid Logo Ico
- `/d/_assets/grid-logo.png`
  - **GET** - Grid Logo Png
- `/d/_assets/grid-sdk.js`
  - **GET** - Grid Sdk Js
- `/d/_assets/viewer.css`
  - **GET** - Viewer Css
- `/d/_assets/viewer.js`
  - **GET** - Viewer Js
- `/d/_libs/{name}`
  - **GET** - Serve Lib
- `/d/{doc_id}`
  - **GET** - Share Download
- `/d/{doc_id}/content`
  - **PUT** - Save Inline Edit
- `/d/{doc_id}/raw`
  - **GET** - Raw Document
- `/d/{doc_id}/raw/stream`
  - **GET** - Raw Video Stream
- `/d/{doc_id}/raw/{asset_path}`
  - **GET** - Raw Bundle Asset
- `/d/{doc_id}/request-access`
  - **POST** - Request Access
- `/d/{doc_id}/text`
  - **GET** - Read Document Text

### Internal

- `/internal/comments/migrate`
  - **POST** - Migrate Legacy Comment
- `/internal/documents/migrate`
  - **POST** - Migrate Document
- `/internal/presentations/slide-metadata/backfill`
  - **POST** - Backfill Presentation Slide Metadata

### Worker

- `/worker/events`
  - **POST** - Handle Event Job
- `/worker/events/internal`
  - **POST** - Handle Internal Event
- `/worker/events/mirror`
  - **POST** - Handle Mirror Event
- `/worker/notifications`
  - **POST** - Handle Notification Job

### Slack callbacks

- `/slack/commands`
  - **POST** - Handle Slash Command
- `/slack/events`
  - **POST** - Handle Event
- `/slack/interactivity`
  - **POST** - Handle Interactivity

### Health

- `/health`
  - **GET** - Health
- `/ping`
  - **GET** - Ping
- `/ping/slack`
  - **GET** - Ping Slack
- `/ping/slack/diagnostics`
  - **GET** - Ping Slack Diagnostics

### Skill

- `/skill`
  - **GET** - Download Skill
- `/skill/version`
  - **GET** - Skill Version

### Drive launcher

- `/open-from-drive`
  - **GET** - Open From Drive

### Config

- `/refresh_config`
  - **POST** - Refresh Config

### Other

- `/api/v1/reviews/{review_id}`
  - **PATCH** - Update Review
  - **DELETE** - Delete Review


## 13. Apendice B - probes de discovery fuera del contrato OpenAPI

V17 probo, entre otros:

- `/openapi.json` -> 200.
- `/docs` -> 200.
- `/redoc` -> 200.
- variantes `/swagger*`, `/api/openapi.json`, `/api/v1/openapi.json` -> 404 en la sesion capturada.
- POST `/graphql`, `/api/graphql`, `/api/v1/graphql` -> 403 JSON identico.

No incluir rutas candidate/probe como si fueran endpoints OpenAPI autoritativos.

## 14. Apendice C - fuentes de evidencia del paquete

- `evidence/grid_v15_1_payload_filtered_2026-08-16T19-42-37-047Z.json`
- `evidence/grid_v15_1_payload_filtered_2026-08-16T19-42-56-016Z.json`
- `evidence/V18_concurrency_artifacts_bundle.json`
- `evidence/grid_v17_api_surface_discovery_2026-08-16T20-30-05-415Z.json`
- `evidence/grid_v19_final_1786915751427.json`
- `evidence/grid_v20_final_1786916612860.json`
- `evidence/grid_v20_1_final_1786917021093.json`
- `evidence/grid_v20_2_final_1786917530411.json`

**Regla de continuidad:** conservar siempre los JSON completos. Las summaries pueden ocultar el orden temporal necesario para distinguir race real, vista stale, retry o convergencia.

# 15. Addendum canonico V21-V23.5

Este addendum consolida los hallazgos posteriores a V20.2. Cuando exista contradiccion con una seccion anterior, esta seccion mas reciente prevalece para V24+.

## 15.1 Reglas nuevas de privacidad y evidencia

- Reportes y harnesses deben ser **redacted-by-default**.
- No exportar `/api/v1/me` completo, cookies, tokens, headers de autorizacion, URLs de request, `content_path`, URLs firmadas/de descarga, `source_config`, SQL completo, bodies HTTP arbitrarios ni identificadores internos que no sean imprescindibles.
- Para identidad, exportar solo hash SHA-256 y, si aporta valor diagnostico, el nombre del campo estable usado.
- Para SQL/BigQuery, exportar fingerprint SHA-256 y metadatos minimos. Los valores de filas solo se exportan con opt-in explicito.
- Los JSON completos de evidencia deben conservar orden temporal. Las summaries no sustituyen el log completo cuando se analiza race, stale read, retries, 429 o convergencia.

## 15.2 Identidad y reload/reopen

**[RUNTIME]** Las apps multiusuario deben asumir que una ventana puede recargarse o reabrirse en cualquier momento.

Regla canonica:

1. ejecutar `GET /api/v1/me` al iniciar;
2. derivar un unico scalar estable en prioridad `id > user_id > userId > username > nickname > login > email`;
3. hashear solo ese scalar;
4. descartar inmediatamente el payload completo;
5. revalidar el rendezvous/State persistido usando el hash rehidratado;
6. no depender de `localStorage`, `sessionStorage`, cookies propias ni parametros de URL para coordinar participantes.

Si no existe un scalar estable reconocible, es preferible bloquear la operacion identity-dependent a fabricar una identidad con un objeto volatil.

## 15.3 V21.0: celda multiusuario de referencia

**[RUNTIME]** En el scope probado de 2 identidades, el protocolo V20.2 mantuvo convergencia exacta bajo concurrencia:

- 2 usuarios x 20 eventos = 40/40 materializados;
- se observaron 409 y retries;
- se observaron 429;
- no hubo perdida final de eventos.

No se ejecuto la celda de 3/5 identidades. No presentar V21.0 como cierre de escala multiusuario mayor a 2 identidades.

## 15.4 V21.1A: sharding

Se compararon 1, 2, 4 y 8 shards con dos identidades y 40 eventos por identidad.

| shards | p50 ms | p95 ms | p99 ms | patch p95 | 409/write | retries/write | 429 | throughput/s | unconfirmed 2xx | final lost | max bucket HTTP B | max/mean |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|1|2208|8595.15|80536.91|602.8|0.075|0.20|4|0.310448|1|0|17240|1.00|
|2|2565|5997.7|54700.39|512.4|0.05|0.15|2|0.283098|2|0|9231|1.05|
|4|2059|12494.45|77504.09|486.6|0|0.10|4|0.315169|0|0|6280|1.40|
|8|2030.5|2989.3|3319.18|579|0.025|0.025|0|0.834637|0|0|4593|2.00|

**[RUNTIME]** 8 shards fue el ganador provisional del experimento, especialmente por reduccion de amplificacion del bucket y ausencia de 429 en esa corrida. No afirmar causalidad fuerte de throughput/p99 porque 1/2/4 sufrieron 429 y 8 no.

Regla operativa vigente: para apps de concurrencia similar, comenzar con **8 shards deterministas** (`FNV1a32(entity_id) % 8`) y medir antes de aumentar/disminuir.

## 15.5 V21.1B: rotacion, compactacion y snapshot+tail

**[RUNTIME]** Se probo rotacion de generacion y compactacion:

- generacion vieja retirada completamente;
- eventos activos conservados en nueva generacion;
- snapshot Dataset generado;
- replay `snapshot + tail` produjo el mismo hash logico que el replay completo previo a compactacion.

Conclusion: para logs largos, la arquitectura recomendada es **eventos durables + snapshot compacto + tail reciente**, con un materializador designado.

## 15.6 V22: CRUD multiusuario con conflictos explicitos

**[RUNTIME]** V22 probo una app CRUD de tareas con dos identidades usando:

- 8 shards de eventos;
- event sourcing como fuente de verdad;
- Named State como proyeccion/materializacion de baja latencia;
- Dataset como snapshot analitico;
- cola V20.2 para commits;
- versiones logicas por entidad;
- `base_version` para update/status/delete;
- conflictos durables, nunca resueltos implicitamente por last-write-wins;
- evento `resolve` que elige un `chosen_event_id` exacto;
- comentarios aditivos que no incrementan version de entidad.

Corrida de cierre: 8 eventos de negocio/auditoria, 2 entidades, 1 conflicto resuelto, 0 conflictos pendientes, hashes expected/materialized/Dataset iguales.

**Regla canonica:** nunca modelar conflicto concurrente como LWW por defecto. Si dos mutaciones parten de la misma `base_version`, ambas deben sobrevivir en auditoria y la resolucion debe ser explicita.

## 15.7 BigQuery gestionado por Grid: contrato observado

**[OPENAPI]** Dataset Definitions V2 soporta:

```text
source_type: grid_sql | external_push
refresh_mode: grid_refresh | external
format: json_rows | json_columnar | parquet
source: bigquery
source_config: { sql: ... }
```

Rutas relevantes:

```text
GET  /api/v1/documents/{doc_id}/datasets
GET  /api/v1/documents/{doc_id}/datasets/{name}
POST /api/v1/documents/{doc_id}/datasets/{name}
PATCH /api/v1/documents/{doc_id}/datasets/{name}
POST /api/v1/documents/{doc_id}/datasets/{name}/refresh
GET  /api/v1/documents/{doc_id}/data/{name}/content
```

No se encontro un endpoint generico documentado de query SQL ad-hoc. La superficie BigQuery observada es Dataset-managed `grid_sql` + refresh + materializacion.

## 15.8 V23.0: ejecucion BigQuery real, primero sin FROM

**[RUNTIME]** Una query determinista sin `FROM` fue ejecutada por Grid, materializada y refrescada repetidamente. Se observo `refresh_count` incrementando y contenido exacto.

Esto probo el mecanismo `grid_sql -> BigQuery -> Dataset`, pero no acceso a tablas reales.

## 15.9 V23.1: lectura de tabla real y limite de scan

**[RUNTIME]** Una query contra una tabla BigQuery real autorizada fue ejecutada y materializada correctamente por Grid.

Durante el ajuste de filtros se observo un error de backend equivalente a:

```text
Query would scan more data than the 1,000,000,000-byte limit.
```

Conclusion acotada: en el path probado existe un limite de scan observado de aproximadamente 1 GB. No afirmar que este valor sea una configuracion universal ni atribuirlo a un campo interno especifico no documentado.

La identidad exacta con la que BigQuery ejecuta no debe inferirse del usuario que pulsa refresh; V23.4 la caracterizo despues.

## 15.10 Cap fisico de 500 filas en `grid_sql`

**[RUNTIME]** Una query de registros con cardinalidad logica >13k materializo exactamente 500 filas repetidamente.

Prueba de cardinalidad independiente:

- una query `COUNT(*)` sobre el mismo universo devolvio 13,010 en la corrida canonica V23.2;
- la query de registros materializo 500.

**[OPENAPI]** No se encontro `max_rows`, `row_limit` ni una semantica documentada que explique 500.

Conclusion canonica:

> En el path `grid_sql` probado existe un truncamiento/cap de **500 filas fisicas materializadas**. La causa backend exacta no esta probada; hipotesis plausibles incluyen `maxResults=500` o no seguir paginacion interna.

No atribuir el cap a BigQuery estandar: es comportamiento observado del path Grid/materializacion.

## 15.11 V23.2: chunking para reconstruir cardinalidad completa

**[RUNTIME]** Se implemento chunking secuencial con `ORDER BY ... LIMIT 500 OFFSET ...`, un Dataset temporal por chunk y barrera de visibilidad de definicion.

Corrida canonica:

- count_before = 13,010;
- count_after = 13,010;
- 27 chunks esperados/completados;
- chunks 1-26: 500 filas;
- chunk 27: 10 filas;
- merge final: 13,010 filas;
- todas las invariantes de cardinalidad satisfechas.

Conclusion: **V23.2 cerrado dentro del query/sesion/path probado** para reconstruccion de cardinalidad.

Caveat importante: el criterio probo cardinalidad/completitud, no igualdad de contenido contra un snapshot fuente independiente. Si el ORDER BY no es total/unico, churn de fuente entre queries repetidas puede producir inconsistencias aun con `count_before == count_after`.

### Rendimiento V23.2

Observado aproximadamente:

- wall clock: 266.5 s;
- suma de `elapsed_ms` de 27 chunks: ~105.1 s;
- 263 requests HTTP;
- 4 respuestas 429;
- Retry-After observados: 21 s, 16 s, 17 s, 60 s.

Conclusion: el cuello de botella fue materialmente el pipeline de control/materializacion de Grid y su backpressure, no solamente parseo en browser. No se midio duracion del job BigQuery interno de forma aislada.

## 15.12 V23.3: row packing, workaround preferido al cap 500

**[RUNTIME]** Row packing demostro que se puede convertir muchas filas logicas en pocas filas fisicas de Grid dentro de **una sola query BigQuery**.

Patron SQL probado:

```sql
WITH
  base AS (<QUERY>),
  ordered AS (
    SELECT
      row_alias AS payload,
      ROW_NUMBER() OVER (ORDER BY <TOTAL_OR_BEST_ORDER>) AS rn
    FROM base AS row_alias
  ),
  packs AS (
    SELECT
      DIV(rn - 1, <PACK_SIZE>) AS pack_id,
      COUNT(*) AS logical_rows,
      TO_JSON_STRING(ARRAY_AGG(payload ORDER BY rn)) AS rows_json
    FROM ordered
    GROUP BY pack_id
  )
SELECT
  pack_id,
  logical_rows,
  rows_json,
  COUNT(*) OVER () AS pack_count,
  SUM(logical_rows) OVER () AS total_rows
FROM packs
ORDER BY pack_id
```

Corrida canonica V23.3:

- pack size: 1,000;
- filas logicas: 13,012;
- filas fisicas Grid: 14;
- pack_count esperado/recibido: 14/14;
- parse errors: 0;
- packing ratio: ~929.43x;
- materializacion: 1.958 s;
- wall clock total: 2.896 s;
- requests HTTP: 8;
- 429/5xx/network: 0;
- contenido Grid: ~444 KB;
- max string JSON por pack: ~32k chars;
- todas las invariantes internas satisfechas.

Validacion directa del JSON reconstruido:

- 13,012 objetos;
- orden no decreciente por la columna usada;
- 13,009 valores unicos y 3 ocurrencias duplicadas legitimas del query;
- no atribuir duplicados a row packing salvo evidencia adicional.

Conclusion: **V23.3 cerrado dentro del query/sesion/path probado**.

Comparacion indicativa contra V23.2: ~92x menor wall clock en la corrida exitosa. No presentarlo como benchmark causal controlado porque fueron corridas distintas y V23.2 encontro backpressure 429 que V23.3 no encontro.

### Limites no probados de row packing

- 500 packs x 1,000 rows/pack = ~500k filas logicas es solo aritmetica teorica, **no un limite runtime probado**.
- Otros limites pueden dominar antes: bytes por campo/row, bytes totales del Dataset, scan cap, memoria del browser, parse JSON, limites BigQuery o Grid.
- La corrida canonica exitosa uso una forma de fila simple. Multi-column, nested, timestamps, numerics y tipos complejos deben validarse separadamente si son criticos.
- Para orden estable entre corridas, preferir ORDER BY total con tiebreaker; evitar depender de `ORDER BY 1` trasladado a window functions.

## 15.13 V23.4: ACL de refresh e identidad real de BigQuery

### ACL de trigger

**[RUNTIME]**:

```text
viewer -> POST /datasets/{name}/refresh = 403
editor -> POST /datasets/{name}/refresh = 200
```

Conclusion: refresh requiere write access en el scope probado; editor es suficiente y no es owner-only.

**[OPENAPI]** El endpoint legacy/global `POST /api/v1/documents/{doc_id}/data/refresh` tambien declara requerir owner o editor, por lo que no ofrece un bypass de ACL para viewers.

### Principal BigQuery

Se uso `SESSION_USER()` y se transformo a SHA-256 dentro de BigQuery antes de materializar el valor, para no exponer la identidad textual.

**[RUNTIME]**:

- A y B fueron identidades Grid distintas;
- A y B produjeron el mismo principal BigQuery;
- ese principal no coincidio con el hash del email de A ni de B;
- interpretacion: `STABLE_NON_GRID_EMAIL_PRINCIPAL`.

Conclusion canonica:

> El `grid_sql` probado ejecuta BigQuery con un **principal backend estable** distinto de las identidades personales A/B que disparan refresh.

No afirmar si tecnicamente es service account, workload identity u otro mecanismo; eso no fue observado directamente.

Implicacion de seguridad: un editor puede modificar el documento y, por definicion de su rol, debe tratarse como writer de confianza. No construir una arquitectura donde usuarios finales reciban editor solo para mantener datos frescos.

## 15.14 V23.5: busqueda de refresh sin editor

Objetivo: verificar si viewers pueden obtener datos frescos sin `POST /refresh` y sin un actor con write access.

### Silent wait

**[RUNTIME]** Con baseline estable, ventana owner/editor cerrada y viewer sin requests al Dataset durante la espera:

- ventana nominal: 120 s;
- ventana real observada en una corrida limpia: ~189 s;
- al final: `nonce_changed = false`, `marker_changed = false`;
- interpretacion: `NO_REFRESH_OBSERVED`.

Esto no prueba que nunca exista un scheduler de cadencia larga, pero descarta auto-refresh corto dentro de la ventana probada.

### Read pressure

**[RUNTIME]** 21 polls de lectura como viewer no produjeron cambio de nonce:

```text
NO_REFRESH_OBSERVED_DURING_READ_PRESSURE
polls = 21
nonce_changed_during_read_phase = false
```

Conclusion: no se observo lazy/on-read refresh disparado por lecturas repetidas.

### Conclusion practica V23.5

Dentro de la superficie y ventanas probadas:

- viewer explicit refresh: **no**, 403;
- editor explicit refresh: **si**, 200;
- passive short scheduler: **no observado**;
- viewer read-trigger/lazy refresh: **no observado**;
- scheduler configurable en DatasetDefinition: **no documentado en el OpenAPI capturado**.

Por tanto, sin un actor externo autorizado, el patron disponible es:

1. refresh manual por owner/editor; o
2. auto-refresh client-side mientras una ventana owner/editor permanezca abierta y autenticada.

No afirmar “Grid nunca auto-refresca”: solo “no observado dentro del scope/ventanas probadas”.

## 15.15 Actor automatizado externo: patron conocido pero no disponible en el entorno actual

**[FUENTE INTERNA, no runtime de esta investigacion]** Existe documentacion interna de un patron VerdiFlow/n8n con `Schedule Trigger` y un workflow autorizado como editor del documento. Tambien existe un patron BigQuery -> VerdiFlow -> Grid `external_push`.

Ese patron demuestra una via conceptual para eliminar la dependencia de un **humano** editor, pero sigue requiriendo un principal no-humano con write access.

En el entorno/restricciones actuales del usuario, VerdiFlow fue descartado como opcion disponible. No convertirlo en dependencia de la arquitectura canonica.

## 15.16 Patron recomendado de refresh bajo las restricciones actuales

Si no existe infraestructura externa autorizada:

```text
owner/editor abre Grid
        |
        +-- al abrir: si last_refresh > TTL -> POST /refresh
        |
        +-- mientras siga abierta:
        |      timer conservador -> POST /refresh
        |
        +-- respetar refresh in-flight
        +-- respetar 429 Retry-After global
        +-- no solapar refreshes del mismo Dataset

viewers
        |
        +-- solo GET metadata/content
        +-- consumen ultimo snapshot publicado
```

TTL sugerido debe definirse por producto/costo; no hardcodear 30 s sin medir. Dada la evidencia de backpressure, comenzar con minutos y ajustar empiricamente.

## 15.17 Reglas canonicas para apps multi-user / multi-request

1. **State para coordinacion, no para bulk data.** Named State sirve para rendezvous, eventos pequenos, metadata, leases logicos, pointers y estado de UI compartido. Su amplificacion hace mala idea guardar grandes resultados analiticos.
2. **Dataset para snapshots.** Dataset reemplaza snapshot; no asumir row-upsert ni transacciones.
3. **Event sourcing para verdad multiwriter.** Eventos append-like con claves top-level unicas y `_write_id` verificable.
4. **No confiar en HTTP 2xx como durability proof.** Confirmar por reread inmediata y reread estable.
5. **`if_updated_at` no es CAS.** Usarlo como detector de baseline stale/ayuda de coordinacion, no como mutex, lock o transaccion.
6. **Una escritura logica in-flight por writer.** Serializar por identidad para reducir self-conflicts y ambiguedad.
7. **409 = reread + jitter + retry.** Nunca hacer blind retry sobre baseline viejo.
8. **429 = gate global basado en Retry-After.** No dejar que ramas paralelas sigan golpeando la API.
9. **503/network = ambiguous commit.** Reread y buscar el mismo `_write_id` antes de reintentar.
10. **Despues de 2xx, verificar.** Reread inmediata y luego reread estable; si falta `_write_id`, tratar como no confirmado.
11. **Sharding determinista.** 8 shards es un default empirico razonable para el scope probado, no una constante universal.
12. **Conflictos explicitos.** Version logica + `base_version`; conservar ambas mutaciones y resolver con evento dedicado.
13. **Materializador designado.** Evitar multiwriter sobre la misma proyeccion/snapshot cuando un unico coordinador puede hacerlo.
14. **BigQuery: preferir row packing a chunking repetido** cuando el query y tipos lo permitan.
15. **Refresh separado de read.** Viewers leen snapshots; writers/refresher disparan compute.
16. **Rehidratacion de identidad en reload.** Nunca asumir que la identidad browser-side anterior sigue valida.
17. **Privacidad por construccion.** Logs sin secrets/PII/URLs/SQL/raw bodies; resultados sensitivos solo con opt-in.

## 15.18 Protocolo canonico V20.2 para una escritura logica

```text
writer queue (1 logical write in-flight)
    |
    v
GET latest State -> updated_at baseline
    |
    v
PATCH {unique_event_key: event, if_updated_at: baseline}
    |
    +-- 409 -> jitter -> GET latest -> retry
    |
    +-- 429 -> global Retry-After gate -> retry when open
    |
    +-- 503/network -> GET latest -> search same _write_id
    |                  +-- found: committed
    |                  +-- absent: retry
    |
    +-- 2xx -> immediate GET -> verify _write_id
                         |
                         +-- absent: unconfirmed -> recovery/retry policy
                         +-- found: stable wait -> GET -> verify again
```

Este protocolo no convierte State en transaccional; solamente reduce y detecta perdida/ambiguedad dentro del comportamiento observado.

## 15.19 Arquitectura canonica actual para una app Grid rica

```text
                           +----------------------+
                           | GET /api/v1/me       |
                           | transient identity   |
                           +----------+-----------+
                                      |
                                      v
+----------------+       +------------+-------------+       +-------------------+
| Browser A      |<----->| Named State              |<----->| Browser B / C ... |
| owner/editor   |       | rendezvous + event shards|       | viewer/editor role |
+-------+--------+       +------------+-------------+       +-------------------+
        |                             |
        |                             v
        |                  +----------+----------+
        |                  | materialized State |
        |                  | projection/cache   |
        |                  +----------+----------+
        |                             |
        |                             v
        |                  +----------+----------+
        +----------------->| Grid Dataset        |
                           | snapshot / analytics|
                           +----------+----------+
                                      |
                      grid_sql refresh (write ACL)
                                      |
                                      v
                           +----------+----------+
                           | Grid BQ backend      |
                           | stable principal     |
                           +----------+----------+
                                      |
                                      v
                           +----------+----------+
                           | BigQuery             |
                           | row packing preferred|
                           +---------------------+
```

## 15.20 Open questions V24+

- Maximo seguro de `pack_size` y bytes por pack/field.
- Tipos complejos/nested/arrays/timestamps en row packing.
- Limite total de bytes de materializacion `grid_sql`.
- Costo/memoria de reconstruccion en browser a escalas mayores.
- Cadencia maxima segura de refresh sin 429/backpressure.
- Si existe scheduler nativo de cadencia larga no documentado en la superficie capturada.
- Mecanismo no-humano de refresh disponible fuera de VerdiFlow para el entorno actual.
- Liderazgo/failover de materializador en apps con mas de dos writers.
- Validacion de escala con >=3 identidades reales.

## 15.21 Evidencia posterior a V20.2 que debe conservarse

Conservar, como minimo, los reportes completos de:

- V21.0 multiusuario;
- V21.1A sharding;
- V21.1B rotation/compaction;
- V22 CRUD tasks;
- V23.0 BigQuery grid_sql;
- V23.1 real table query y diagnostico de scan cap;
- V23.2 chunking 500;
- V23.3 row packing + reconstructed rows;
- V23.4 refresh principal/ACL;
- V23.5 silent wait/read pressure.

Para reportes nuevos, mantener nombres versionados, schema_version y `close_verdict`; no sobreescribir la evidencia cruda.

# 16. Addendum canonico V24.0-V24.1: retiro de `grid_sql` y migracion a `external_push`/Sheets

Este addendum documenta un **cambio de plataforma**, no un experimento propio como los de la Seccion 15: Grid retiro `source_type: grid_sql` de `DatasetDefinitionRequest` en algun momento entre el 2026-08-18 y el 2026-08-21, dejando `external_push` como unico patron soportado para Dataset Definitions. Cuando exista contradiccion con §4.5, §4.6, §7, §9 o §15.7-§15.16, esta seccion prevalece para V24.2+; las secciones previas se conservan sin editar como evidencia historica de que el mecanismo si funciono en su momento.

## 16.1 Retiro de `source_type: grid_sql`: confirmado OPENAPI + RUNTIME

**[OPENAPI]** El schema `DatasetDefinitionRequest` (creacion, `POST /api/v1/documents/{doc_id}/datasets/{name}`) capturado el 2026-08-21 declara:

```json
{
  "source_type": {"type": "string", "const": "external_push"},
  "refresh_mode": {"type": "string", "const": "external"}
}
```

Ambos campos son `const` (valor fijo, no enum de opciones) y **requeridos**. `grid_sql`/`grid_refresh` ya no son valores aceptables para crear una Dataset Definition nueva.

**[RUNTIME]** Confirmado contra Grid real (no solo el spec): `POST .../datasets/{name}` con `source_type: "grid_sql"` devuelve:

```json
{"error": "validation_error", "detail": "body -> source_type: Input should be 'external_push'; body -> refresh_mode: Input should be 'external'"}
```

HTTP 422, mismo dia, mismo documento de prueba.

## 16.2 PATCH sobre un dataset existente: `source_type` es inmutable, `refresh_mode` sigue validado

**[OPENAPI]** El schema `DatasetDefinitionUpdateRequest` (usado por `PATCH .../datasets/{name}`) **no declara `source_type` como campo en absoluto** — solo `refresh_mode` (const `"external"` o null), `format`, `description`, `source`, `source_config`, `output_config`.

**[RUNTIME]** Un PATCH con `{source_type: "grid_sql", refresh_mode: "grid_refresh", ...}` sobre un dataset `grid_sql` YA EXISTENTE (creado antes del retiro) devuelve 422 pero **solo** por `refresh_mode` (`"Input should be 'external'"`) — `source_type` no aparece en el error. Conclusion: no es que `source_type: grid_sql` sea "tolerado" en datasets legacy; es que el modelo de actualizacion nunca valida ni acepta ese campo, porque es inmutable despues de creado. El bloqueo real y unico en PATCH es `refresh_mode`.

**[RUNTIME]** `GET /api/v1/documents/{doc_id}/datasets` (listado completo) sobre un documento con datasets creados el 18-ago muestra que sus definiciones siguen guardadas con `source_type: "grid_sql"` y `refresh_mode: "grid_refresh"` intactos — Grid no los reescribio retroactivamente. Es estado legacy tolerado en reposo, no un valor activamente aceptado en nuevas escrituras.

## 16.3 `refresh_mode: external` mata el endpoint de refresh — `grid_sql` tambien murio para refrescar, no solo para crear

**[RUNTIME]** Se forzo `PATCH .../datasets/{name}` con `refresh_mode: "external"` (unico valor que pasa validacion) sobre un dataset `grid_sql` existente, manteniendo `source_type: "grid_sql"` en el body (ignorado, ver §16.2) y la SQL real del dataset. El PATCH dio 200. Inmediatamente despues, `POST .../datasets/{name}/refresh` sobre ese mismo dataset devolvio:

```json
{"detail": "Not Found"}
```

HTTP 404 — el endpoint de refresh deja de aplicar/existir para un dataset en modo `external`. **Conclusion canonica: `grid_sql` no solo dejo de poder crearse; el mecanismo de refresco explicito tambien quedo inutilizado para datasets que ya existian.** No hay ruta de vuelta atras una vez que se toca `refresh_mode` en un dataset legacy: quedo con `refresh_mode: external` sin forma conocida de volver a `grid_refresh` (el PATCH rechaza ese valor) ni de refrescar via `/refresh` (404).

Precaucion operativa para quien repita esta prueba: hacerlo sobre un dataset de produccion en uso deja ese dataset especifico sin mecanismo de refresco conocido. Preferir un dataset de prueba dedicado.

## 16.4 Cronologia: el cambio de plataforma ocurrio entre el 18 y el 21 de agosto de 2026

**[RUNTIME/HISTORICO]** Evidencia cronologica reunida en esta ronda:

- **16-ago (corte de la Biblia V23.5 original):** §15.8-§15.14 documentan `grid_sql` funcionando en runtime real contra tablas BigQuery reales, con refresh explicito, cap de 500 filas, row packing, y ACL de refresh caracterizada.
- **18-ago, ~21:53 UTC:** log de produccion real (no de esta investigacion, de la app Premissort del proyecto asociado) confirma un dataset creado exitosamente con `"source_type":"grid_sql"` en la respuesta de Grid.
- **21-ago:** el mismo tipo de creacion (`POST` con `source_type: grid_sql`) devuelve 422 contra el spec vigente; confirmado runtime (§16.1).

**Conclusion:** la ventana de retiro esta acotada a esos ~3 dias. No hay evidencia de que haya sido gradual ni por-documento; el spec `/openapi.json` cambio globalmente.

## 16.5 `external_push`: contrato de reemplazo confirmado end-to-end

**[OPENAPI + DOCUMENTACION OFICIAL DE GRID]** Confirmado por el schema y por documentacion oficial de Grid citada textualmente por el usuario el 2026-08-21:

> "The only supported pattern is external_push: your pipeline (Verdi Flows, DataFlow, Airflow, a Python script, or any job) produces the data and pushes it to Grid."

Flujo de 3 pasos (igual al ya documentado en §4.2, ahora confirmado como **el unico** camino, no una alternativa):

```text
POST /api/v1/documents/{doc_id}/datasets/{name}/upload-url
 -> DatasetUploadUrlResponse: {doc_id, name, revision, format,
    upload_url, upload_path, publish_url, expires_in_seconds: 1800}
PUT  <upload_url>          <- SIN headers de Authorization: la URL ya
                               lleva su propia firma; agregar un Bearer
                               token hace que el storage RECHACE la
                               request (dato de la documentacion oficial,
                               no observado directamente en esta ronda)
POST <publish_url> o /api/v1/documents/{doc_id}/datasets/{name}/publish
 -> DatasetPublishRequest {revision} -> DatasetPublishResponse
    {doc_id, name, revision, published, updated_at, data_changed}
```

Atajo de un paso para payloads chicos: `POST /api/v1/documents/{doc_id}/datasets/{name}/data` ("Upload Dataset Direct") — sin schema de body declarado (acepta el array/rows directo), publica de forma atomica. Limite documentado: **10 MB** por push inline (413 si se excede); igual limite aplica al endpoint legacy `PUT /api/v1/documents/{doc_id}/data/{name}`. Para mayores, usar el flujo de 3 pasos (soporta hasta 500 MB documentados). **[CORREGIDO V24.16, §16.31.4]:** el cuerpo no es un array crudo sino `{"rows": [...]}`; el array crudo da 422 «Input should be a valid dictionary or instance of DatasetDirectUploadRequest».

**Implicacion critica no resuelta por el contrato:** ninguno de estos 3 mecanismos ejecuta BigQuery por el llamante. Todos esperan que **alguien ya tenga los datos en mano** y los empuje. Un cliente 100% browser sin backend propio (el patron de este proyecto, ver §1) no puede correr BigQuery el mismo — nunca tuvo credenciales BigQuery, dependia enteramente de que Grid corriera la query via `grid_sql`. Con `grid_sql` retirado, ese patron de app queda sin reemplazo directo dentro de la misma arquitectura; requiere un actor externo con credenciales reales (ver §16.6) o un cambio de diseño (ver §16.7-§16.10).

## 16.6 Verdi Flows / DataFlow: pasa de "patron interno conocido pero descartado" a "patron oficialmente esperado"

**[DOCUMENTACION OFICIAL DE GRID]** La misma documentacion oficial citada en §16.5 dice textualmente, sobre refrescos automatizados:

> "To keep your dashboard up to date without manual work, connect it to a Verdi Flows workflow or a DataFlow job that queries your data source on a schedule and pushes the result to the dataset automatically."

Esto **actualiza §15.15**: el patron VerdiFlow ya no es solo "documentacion interna, no runtime de esta investigacion" — es el mecanismo que la plataforma Grid espera oficialmente que los equipos usen para refrescos programados, reemplazando funcionalmente lo que antes hacia `grid_sql` + refresh manual/timer. La pregunta abierta que sigue sin cerrar es **de acceso**, no de existencia: si el equipo que opera una app dada tiene o no acceso operativo a Verdi Flows/DataFlow (bloqueo organizacional, no tecnico — no se investigo en esta ronda).

## 16.7 Google Sheets como catalogo: la pregunta abierta de §7/§9 sobre ACL viewer queda cerrada (parcialmente)

**[RUNTIME]** §7 y §9 dejaban abierta "ACL viewer del proxy Sheets si se piensa usar compartido". Esta ronda la cierra parcialmente con evidencia directa:

- La conexion de OAuth de Google (`GET/DELETE /api/v1/google/oauth`, `GET /api/v1/google/oauth/start`) es **global por usuario de Grid**, sin `doc_id` — no es una conexion por-documento.
- El parametro `doc_id` en `GET /api/v1/sheets/{sheet_id}?doc_id=...&range=...` esta documentado en el propio OpenAPI como: *"Grid document id — used to resolve the owner's OAuth token"*.
- **[RUNTIME confirmado]:** cualquier llamante con acceso de lectura al documento `doc_id` referenciado puede leer la sheet montado en la conexion OAuth de quien sea el DUEÑO de ese documento — sin conectar su propia cuenta de Google. Verificado con un segundo usuario real del equipo, sin conexion Google propia, leyendo exitosamente via el documento correcto.

Sigue sin probarse: que pasa si el llamante tiene rol viewer pero el documento referenciado NO es el mismo que el dueño uso para conectar OAuth (ver gotcha en §16.8), ni el comportamiento si el owner revoca la conexion mientras otros la estan usando activamente.

## 16.8 Gotcha de produccion: `doc_id` separado del documento principal produce 403 para todo el equipo

**[RUNTIME]** Al usar un `doc_id` DISTINTO al documento principal de la app (uno compartido solo con quien conecto el OAuth de Google, en vez del documento ya compartido con todo el equipo) como parametro de `GET /api/v1/sheets/{sheet_id}`, cualquier otro usuario del equipo recibio:

```json
{"error": "permission_denied", "detail": "You do not have access to this resource", "retry": false, "recovery": "request_access"}
```

HTTP 403. La causa: Grid evalua el ACL sobre el `doc_id` referenciado ANTES de resolver el OAuth del dueño (ver §16.7) — no basta con que el llamante tenga acceso a la app en general.

**Fix aplicado:** usar como `doc_id` el mismo documento principal que ya esta compartido con el equipo (el mismo que se usa para todo lo demas: State Buckets, registros de auditoria), en vez de un documento separado creado solo para la conexion OAuth — **siempre que el propietario de ese documento principal sea la misma cuenta que conecto el OAuth de Google.** Si son cuentas distintas, este fix no aplica y hay que compartir explicitamente el segundo documento con el equipo, o reconectar el OAuth desde la cuenta due;a del documento principal.

**Regla operativa nueva:** cuando se use el proxy de Sheets para una app compartida, el `doc_id` del parametro debe ser el mismo documento cuya ACL ya cubre a toda la audiencia de la app — no un documento aparte, aunque parezca mas "limpio" separarlos.

## 16.9 Limite de refresco de `/api/v1/sheets/*`: sin fallo hasta ~2 req/seg en la ventana probada

> **SUPERSEDIDO operativamente por §16.24 (2026-10-14).** Esta corrida sigue siendo evidencia historica valida de una ventana que no encontro 429, pero ya no debe interpretarse como "ritmo seguro": pruebas posteriores identificaron explicitamente una cuota de Google Sheets API por `Read requests per minute`.

**[RUNTIME]** Rafaga de 20 lecturas consecutivas a `GET /api/v1/sheets/{sheet_id}` con 500 ms de intervalo (ritmo de ~2 req/seg, ~120 req/min): 20/20 exitosas, tiempos de respuesta entre 150 ms y 1.3 s, sin 429 ni otro error.

No se encontro un limite propio documentado para `/sheets` en el OpenAPI (a diferencia de Datasets, que documenta 60 req/min por usuario). Esta prueba solo establece un piso ("al menos este ritmo es seguro"), no un techo — no se busco el punto de quiebre real.

## 16.10 Patron de consumo adoptado para catalogos vía Sheets (reemplazo de facto de `grid_sql` en este proyecto)

Ante la combinacion de §16.1-§16.6 (no hay forma de que un cliente browser-only ejecute BigQuery el mismo) se adopto, para las apps de este proyecto, un patron de **snapshot cacheado + clasificacion explicita ante ambiguedad**, en vez de re-implementar el patron `grid_sql` con otro transporte:

1. Una Google Sheet ya conectada a BigQuery (Connected Sheets, refresco manual/discrecional del operador — no automatico) mantiene el catalogo completo en una pestaña.
2. La app browser-only carga esa pestaña completa **una sola vez por sesion** via `GET /api/v1/sheets/{sheet_id}?doc_id=...&range=...` (usando el `doc_id` principal, ver §16.8), la cachea en memoria, y filtra en JS por el campo que corresponda (posicion, HU, shipment_id) — sin pedir una lectura nueva por cada escaneo.
3. **Manejo de staleness explicito, no silencioso:** dado que el snapshot puede tener desfase de segundos/minutos respecto al estado real (tanto por el ciclo de refresco de la Connected Sheet como por el momento en que se cargo el snapshot dentro de la sesion), cuando un item escaneado no matchea nada en el snapshot **no se asume una conclusion** — se le presentan al operador 3 opciones explicitas: que el item si pertenece a donde se esperaba (falsa alarma de desfase), que pertenece a otro lugar pero el catalogo aun no lo refleja (hallazgo real, solo sin ubicacion conocida), o que genuinamente no aparece en ningun lado. Esto es una diferencia de diseño deliberada respecto al patron `grid_sql` documentado en §15.9-§15.14, donde "sin match" se resolvia con una segunda query en vivo (side-channel de verdad independiente) — con un snapshot cacheado esa segunda query ya no es posible ni tiene sentido, asi que la ambiguedad se traslada al humano en vez de ocultarse.

Este patron evita depender de VerdiFlow/DataFlow (§16.6, bloqueo organizacional no resuelto) a costa de "frescura" atada al refresco manual del operador sobre la Connected Sheet, no a un scheduler.

## 16.11 Verificacion de estabilidad, 2026-08-26: sin cambios en 5 dias

**[OPENAPI]** Se volvio a capturar `/openapi.json` completo el 26-ago y se comparo byte a byte contra la captura del 21-ago (246 endpoints method+route, 202 `components.schemas`): **cero diffs** — mismo conjunto exacto, mismo contenido exacto en cada schema, incluyendo `DatasetDefinitionRequest`/`DatasetDefinitionUpdateRequest`/`DatasetPublishRequest`/`DatasetUploadUrlResponse`.

**Conclusion:** el retiro de `grid_sql` documentado en §16.1-§16.3 no fue un rollback temporal ni un glitch de una sola captura — es estable en al menos esta ventana de 5 dias. No tratar §16.1-§16.3 como "posiblemente revertido" sin una nueva captura que lo contradiga.

## 16.12 Hallazgo incidental: CDN propio de librerias front-end bajo `/d/_libs/*`

**[RUNTIME]** Un probe de 26-ago encontro ~30 librerias front-end serviadas con 200 bajo `/d/_libs/{name}` (ruta ya listada en el Apendice A original, seccion "Viewer / d", sin explorar antes): React, React-DOM, D3, Plotly, Chart.js, Recharts, ag-grid-community, Leaflet, Mermaid, Tailwind, KaTeX, Vega/Vega-Lite, Three.js, GSAP, lodash, zustand, entre otras. No relacionado al caso `grid_sql`; se registra porque no estaba documentado como explorado y es util para futuras apps Grid (menos dependencia de CDNs externos, superficie CSP mas chica).

## 16.13 Actualizaciones a secciones previas — que queda obsoleto y por que

| Seccion previa | Estado previo | Estado actualizado (V24.1) |
|---|---|---|
| §4.5 / §15.7 `source_type: grid_sql \| external_push` | Documentado como enum de 2 opciones | **Obsoleto para creacion.** Ya no es una eleccion: `external_push` es el unico valor aceptado por `DatasetDefinitionRequest` (§16.1). |
| §15.8-§15.14 (V23.0-V23.5) | Evidencia runtime de `grid_sql` funcionando | **Sigue valida como evidencia historica** de que el mecanismo funciono del 16 al ~20 de agosto. No es replicable para nuevas implementaciones desde entonces. |
| §7 "ACL viewer sobre este proxy sigue sin prueba runtime" | Abierto | **Cerrado parcialmente** (§16.7): el ACL depende del `doc_id` referenciado, no de una ACL propia de Sheets ni de una conexion Google individual. Sigue abierto el caso de revocacion de OAuth del owner mientras otros dependen de el. |
| §9 "Abierto: runtime real `grid_sql` BigQuery y autenticacion implicita" | Abierto | **Cerrar como OBSOLETO**, no como resuelto: el mecanismo ya no existe para nuevas Dataset Definitions. |
| §10 "V24 opcional - Sheets ACL/integrations" | Marcado como opcional, solo si un caso de uso lo necesitaba | **Se ejecuto de facto, forzado** por el retiro de `grid_sql` — no fue una eleccion de roadmap, fue la unica salida disponible. |
| §15.15 "VerdiFlow... descartado como opcion disponible en el entorno actual del usuario" | Patron interno conocido, no oficial | **Confirmado como patron oficialmente esperado por la plataforma** (§16.6). Sigue sin resolverse si el usuario/equipo tiene acceso operativo real a el. |

## 16.14 Open questions V24.2+

Extiende §15.20:

- ¿El equipo tiene acceso operativo real a Verdi Flows o a un job de DataFlow? Bloqueo organizacional, no evaluado en esta ronda.
- ¿Cual es la cadencia real de actualizacion de una Google Connected Sheet que alimenta un catalogo consumido via el proxy de Sheets? Determina el techo real de "frescura" del patron de §16.10; no medido.
- ¿Cuanto dura sin re-autorizacion el OAuth de usuario conectado a Grid para Sheets? Depende del estado de publicacion de la app OAuth en Google Cloud (seria de dias si esta en "Testing", indefinido si esta en "Internal"/"En produccion") — no determinable desde el cliente, no probado en runtime.
- **CERRADO parcialmente por §16.24:** el 429 observado en `/api/v1/sheets/*` provino de Google Sheets API por la metrica `Read requests` y el limite `Read requests per minute` del proyecto consumidor. Sigue abierto si todas las apps/documentos/usuarios de Grid comparten el mismo proyecto consumidor o existen varios buckets.
- ¿Que pasa con la ACL del proxy de Sheets si el owner que conecto OAuth pierde acceso al documento, cambia de equipo, o revoca la conexion manualmente, mientras otros usuarios dependen de ella activamente?
- ¿El endpoint `POST /api/v1/documents/{doc_id}/datasets/{name}/data` ("Upload Dataset Direct", atajo de un paso) tiene alguna restriccion de ACL o formato distinta al flujo de 3 pasos? No se probo en runtime esta ronda, solo se confirmo su existencia en el OpenAPI.

## 16.15 Evidencia de esta ronda que debe conservarse

Extiende §15.21. Conservar:

- Captura completa de `/openapi.json` del 21-ago y del 26-ago (para permitir un diff futuro contra una tercera captura).
- El log crudo de runtime de los pasos §16.1-§16.3 (POST/PATCH/refresh con sus respuestas exactas de error).
- El log de produccion del 18-ago que confirma la ultima creacion exitosa con `source_type: grid_sql` (limite temporal superior de la ventana de retiro).
- Las 3 herramientas de diagnostico construidas esta ronda (equivalentes en funcion al Apendice B, pero reutilizables en vivo en vez de una captura estatica): una que reproduce el ciclo completo de Dataset Definitions grid_sql/external_push contra Grid real; una que extrae y tabula todo `paths` + `components.schemas` de `/openapi.json` en vivo, exportable a JSON; y una que prueba el proxy de Sheets (estado OAuth, metadata, lectura, escritura de prueba, rafaga configurable de lecturas). Nombres de archivo y ubicacion omitidos aqui por la regla de privacidad de rutas/identificadores internos (§15.1); conservar la referencia en la evidencia privada del proyecto, no en esta Biblia.

Para reportes nuevos, mantener la misma disciplina que §15.21: nombres versionados, `schema_version`, `close_verdict`, y no sobreescribir la evidencia cruda.


## 16.16 V24.3-V24.4: baseline OpenAPI vigente y disciplina de contrato

**[OPENAPI]** Captura vigente del 15-sep-2026:

- OpenAPI 3.1.0;
- 201 paths;
- 251 operations;
- 202 `components.schemas` catalogados;
- `DatasetDefinitionRequest` exige `source_type=external_push` y `refresh_mode=external`;
- `DatasetDefinitionUpdateRequest` no permite `source_type`;
- rutas legacy de refresh de Dataset siguen ausentes;
- rutas legacy específicas de Google Drive (`/api/v1/google/drive/files/*`, `link-drive`, `open-from-drive`) ya no forman parte del contrato vigente;
- el schema `FetchRequest` existe y requiere `url`, con `method`, `headers` y `body` opcionales, pero su mera presencia no implica que sea un proxy genérico utilizable.

**Regla:** no inferir autenticación, ACL o capacidad runtime a partir de la sola presencia de un schema. Todo comportamiento operativo debe quedar etiquetado como **[RUNTIME]**.

## 16.17 V24.4 Locks y capability-based ACL

### Lock management

**[RUNTIME]** En el documento objetivo correctamente compartido:

- A (owner) puede adquirir y liberar lock;
- B (viewer real del mismo `doc_id`) puede hacer `GET /lock`, adquirir el lock cuando está libre y liberar su propio lock;
- B observa correctamente el lock de A cuando A es holder.

La ronda inicial donde B no tenía ACL sobre el `doc_id` objetivo queda conservada solo como evidencia histórica y marcada:

`INVALIDATED_FOR_CROSS_USER_ACL_INTERPRETATION`

No volver a usar esos 403 para inferir que locks son owner-only o que viewers no pueden administrarlos.

### Lock enforcement

**[RUNTIME]** Con A manteniendo el lock y B como viewer válido:

- `PATCH` sobre Named State siguió devolviendo 200;
- `PATCH` de metadata del documento (`description`, `metadata_new_version=false`) siguió devolviendo 200;
- Section PUT del viewer devolvió 403 tanto antes, durante como después del lock, por lo que esa ruta no sirve para inferir enforcement del lock.

Conclusión canónica:

> `/lock` **no es un mutex global del documento**. En el scope probado es advisory/workflow-specific y **no protege** Named State ni el PATCH de metadata ensayado.

Por tanto:

- no usar `/lock` como sustituto del protocolo optimista de State;
- seguir usando `_write_id`, `if_updated_at`, reread y resolución explícita de conflictos;
- interpretar ACL por **capacidad observada por endpoint**, no por el nombre nominal del rol.

Queda abierto, si alguna vez es necesario, cerrar formalmente la exclusividad cross-user con la secuencia A-holds -> B-acquire -> A-release -> B-acquire. No es requisito para la arquitectura actual porque el lock ya quedó descartado como mecanismo de exclusión de State.

## 16.18 V24.4C-V24.4F: CSP, CDNs y runtime externo — TEMA CERRADO

### 16.18.1 Principio general

**[RUNTIME]** Grid no aplica una regla global de "externo permitido/bloqueado". La capacidad depende de:

`origen x mecanismo x directiva CSP`

No hablar de un dominio como "permitido" en abstracto. Ejemplo: jsDelivr puede funcionar para `script`, `style` y `fetch`, mientras un `<img src>` remoto equivalente puede fallar por `img-src`.

### 16.18.2 Matriz canónica

| Capacidad | Estado runtime | Nota |
|---|---|---|
| JS clásico desde jsDelivr/cdnjs/unpkg | CONFIRMED_ALLOWED | Cargar con versión exacta. |
| `import()` ES module desde esm.sh/jsDelivr/skypack | CONFIRMED_ALLOWED en hosts probados | unpkg module tuvo timeout sin violación CSP; no clasificarlo como bloqueo CSP. |
| CSS externo desde jsDelivr/unpkg/cdnjs | CONFIRMED_ALLOWED |  |
| Google Fonts (`fonts.googleapis.com` + downstream font) | CONFIRMED_ALLOWED | cadena completa observada. |
| `fetch(cors)` a jsDelivr/unpkg/cdnjs/esm.sh | CONFIRMED_ALLOWED | `connect-src` no es Internet abierto. |
| `fetch(cors)` a GitHub Raw/httpbin | CONFIRMED_CSP_BLOCKED | `connect-src`. |
| WebSocket externo probado | CONFIRMED_CSP_BLOCKED | `connect-src`. |
| `<img>` HTTPS arbitrario | CONFIRMED_CSP_BLOCKED en hosts probados | `img-src`. |
| `data:` image | CONFIRMED_ALLOWED |  |
| `blob:` image sintética | CONFIRMED_ALLOWED |  |
| PNG CDN -> fetch -> Blob -> `createImageBitmap` / `<img blob:>` | CONFIRMED_ALLOWED | prueba end-to-end cerrada. |
| SVG CDN -> Blob -> `<img>` | INCONCLUSIVE_NON_CSP_FAILURE | fallo sin SecurityPolicyViolation; no generalizar a blobs. |
| `data:` classic script | CONFIRMED_ALLOWED | no usar como patrón principal de producción. |
| `blob:` classic script | CONFIRMED_CSP_BLOCKED | `script-src-elem`. |
| `data:` stylesheet | CONFIRMED_ALLOWED |  |
| `blob:` stylesheet | CONFIRMED_CSP_BLOCKED | `style-src-elem`. |
| `blob:` Worker | CONFIRMED_ALLOWED | worker respondió correctamente. |
| `blob:` Worker -> fetch CDN | CONFIRMED_ALLOWED | procesamiento off-main-thread + red permitida. |
| `WebAssembly.compile()` local | CONFIRMED_ALLOWED | runtime WASM disponible. |
| remote `.wasm` end-to-end | INCONCLUSIVE_RESOURCE_INVALID | recurso probado no tenía magic WASM; no fue fallo CSP. |
| iframe HTTPS probado | ALLOWED_BY_GRID_CSP en scope | el destino todavía puede auto-bloquear framing. |
| iframe `data:` | CSP_RESTRICTED / no fiable | no usar como arquitectura. |
| CDN classic script con SRI SHA-384 | CONFIRMED_ALLOWED | recomendado para dependencias externas críticas. |

### 16.18.3 Recomendación de producción para dependencias externas

Para código externo crítico:

1. preferir primero una librería interna Grid (`/d/_libs/*`) cuando exista y cubra el caso;
2. si se usa CDN externa, fijar **versión exacta**;
3. evitar `@latest`, rangos amplios o resolución flotante;
4. usar **SRI** (`integrity="sha384-..."`) + `crossorigin="anonymous"` cuando aplique;
5. no asumir que porque `fetch` funciona también funcionará `<img>`, `<script>` o `<style>` al mismo host;
6. mantener un fallback local/interno para dependencias operativamente críticas cuando sea razonable.

### 16.18.4 Workers y WASM

**[RUNTIME]** Grid permite `blob:` Workers y esos workers pueden hacer `fetch(cors)` a un host permitido. Esto habilita, sin backend propio:

- parseo CSV/JSON grande;
- hashing;
- validación masiva;
- compresión/descompresión;
- transformación de snapshots;
- preparación de payloads para State/Dataset;
- procesamiento que no debe bloquear la UI.

WASM local está permitido. La única prueba remota falló porque el recurso descargado no era un binario WASM válido, no por CSP. No hace falta seguir investigando esta rama para la arquitectura actual; si alguna app depende específicamente de `.wasm` remoto, hacer una prueba puntual con un artefacto conocido y versionado.

### 16.18.5 Cierre

**CLOSE_VERDICT: `EXTERNAL_CDN_RUNTIME_SUFFICIENTLY_CHARACTERIZED`**

El tema queda cerrado para diseño general. Solo reabrir si una app concreta necesita un host o mecanismo no incluido en la matriz.

## 16.19 V24.4E-V24.4F: imágenes de Google Drive — conclusión vigente

**[RUNTIME]** Para `drive.google.com` desde el browser Grid:

- `<img src>` -> bloqueado por `img-src`;
- `fetch(cors, credentials=omit)` -> bloqueado por `connect-src`;
- `fetch(cors, credentials=include)` -> bloqueado por `connect-src`;
- `fetch(no-cors)` -> bloqueado por `connect-src`;
- el pipeline `fetch -> Blob -> render` no puede arrancar porque no se obtienen los bytes;
- iframe puede disparar `load`, pero no es una solución de imagen ni da acceso cross-origin al contenido.

Se exploró además `POST /api/v1/fetch` porque el schema `FetchRequest` existe en el OpenAPI.

**[RUNTIME]** Resultado:

- `/api/v1/fetch -> jsDelivr` -> 403;
- `/api/v1/fetch -> drive.google.com` -> 403.

Conclusión:

> `/api/v1/fetch` **no debe tratarse como proxy genérico de salida** y actualmente no rescata imágenes de Drive.
>
> **Matiz V24.14 (§16.29.5):** el SDK documenta `Grid.fetch` como reenvío autenticado hacia APIs **internas** de ML/Fury en dominios permitidos. Las pruebas de arriba usaron dominios externos; los internos no se han probado.

Las rutas legacy específicas de Google Drive ya no están en el OpenAPI vigente. Por tanto, para una app Grid browser-only **no hay una vía demostrada y soportada actualmente para obtener bytes de una imagen de Drive directamente**.

Alternativas arquitectónicas aceptables si el caso aparece:

- integración interna específica futura de Grid/Google;
- pipeline autorizado que importe/materialice la imagen a Grid u otro origen permitido;
- almacenar la imagen directamente en un origen que el mecanismo requerido pueda consumir;
- si ya se poseen bytes desde una ruta permitida, renderizar con Blob, porque `blob:` image sí está validado.

No recomendar perseguir URLs `googleusercontent` no disponibles en el flujo real del usuario como base de arquitectura.

**CLOSE_VERDICT: `DRIVE_BROWSER_IMAGE_RESCUE_NOT_AVAILABLE_IN_TESTED_SCOPE`**

## 16.20 Evidencia V24.3-V24.4 que debe conservarse

Conservar separadamente, sin incrustar datos sensibles en esta Biblia:

- captura/auditoría OpenAPI vigente y catálogo de schemas;
- resultados válidos de lock management y lock enforcement con B realmente viewer del `doc_id` objetivo;
- resultados contaminados iniciales, pero marcados como inválidos para inferencia ACL;
- probes CSP/CDN V24.4C, V24.4D, V24.4E y V24.4F;
- probe de Drive V24.4E.1;
- hashes de resultados exportados cuando estén disponibles.

Mantener los artefactos redacted-by-default: no exportar URLs Drive completas, file IDs, tokens, cookies, Authorization, cuerpos remotos, datos de `/me` ni identificadores personales.

## 16.21 V24.5: Fullscreen API — TEMA CERRADO

### 16.21.1 Soporte y disponibilidad

**[RUNTIME]** En una prueba ejecutada directamente dentro del viewer embebido de Grid se observó:

- `document.fullscreenEnabled === true`;
- `document.webkitFullscreenEnabled === true`;
- `requestFullscreen()` disponible en `document.documentElement`;
- `webkitRequestFullscreen()` disponible;
- `document.exitFullscreen()` disponible;
- `document.webkitExitFullscreen()` disponible.

La prueba se ejecutó con `window.top !== window.self`, por lo que el HTML estaba embebido y aun así la Fullscreen API permaneció habilitada en el contexto probado.

### 16.21.2 Entrada a fullscreen de página completa

**[RUNTIME]** Un `requestFullscreen()` disparado por interacción explícita del usuario sobre `document.documentElement` resolvió correctamente. Tras resolver:

- `document.fullscreenElement === document.documentElement`;
- se disparó `fullscreenchange`;
- se observó `resize`;
- no se observó `fullscreenerror`.

La activación transitoria del usuario estaba activa al iniciar la solicitud y dejó de estarlo después de resolver, consistente con el requisito normal del navegador de usar un gesto explícito para entrar a fullscreen.

### 16.21.3 Salida programática

**[RUNTIME]** `document.exitFullscreen()` resolvió correctamente durante la prueba de fullscreen de página completa. Después de salir:

- `document.fullscreenElement === null`;
- se disparó `fullscreenchange`;
- se observó `resize`.

### 16.21.4 Fullscreen de un elemento específico

**[RUNTIME]** También se verificó `requestFullscreen()` sobre un contenedor HTML específico. La solicitud resolvió correctamente y `document.fullscreenElement` pasó a ser ese elemento. Se observaron `fullscreenchange` y `resize` sin `fullscreenerror`.

La salida posterior también fue detectada correctamente por el documento mediante `fullscreenchange`.

### 16.21.5 Regla de producción

Para apps Grid que necesiten modo pantalla completa:

1. disparar `requestFullscreen()` desde un gesto explícito del usuario, por ejemplo un botón;
2. preferir `document.documentElement.requestFullscreen()` para fullscreen de toda la app;
3. usar `element.requestFullscreen()` cuando solo una superficie concreta deba ocupar la pantalla;
4. escuchar `fullscreenchange` para sincronizar el estado visual de la UI;
5. escuchar `fullscreenerror` y manejar rechazo sin asumir que fullscreen siempre estará disponible en todos los navegadores/contextos futuros;
6. usar `document.exitFullscreen()` para salida programática;
7. no intentar entrar a fullscreen automáticamente al cargar la app ni asumir que funciona sin user activation.

No se observó bloqueo por CSP ni por el embedding de Grid en el contexto probado. Esto demuestra disponibilidad runtime en ese contexto; no debe generalizarse a navegadores, políticas o shells futuros sin revalidación si cambian.

**CLOSE_VERDICT: `FULLSCREEN_API_CONFIRMED_ALLOWED`**

### 16.21.6 Evidencia que debe conservarse

Conservar el reporte JSON exportado por el harness `grid_fullscreen_runtime_probe`, incluyendo:

- baseline de disponibilidad de API;
- `embedding.isTopLevel`;
- eventos `request_start` / `request_resolved`;
- eventos `fullscreenchange`;
- salida programática;
- fullscreen de `documentElement`;
- fullscreen de elemento específico;
- métricas de viewport;
- estado de `navigator.userActivation`.

Mantener el artefacto redacted-by-default; esta prueba no requiere identidad, tokens, cookies ni datos personales.


## 16.22 People Directory: validación de LDAP/username para selección de usuarios (2026-10-02)

### 16.22.1 Contrato OpenAPI

**[OPENAPI]** Grid expone `GET /api/v1/people/search` (`Search People`). El parámetro `q` es obligatorio, acepta búsqueda por nombre o email y exige al menos 2 caracteres. `limit` es opcional, con rango 1..200 y default 50. La descripción del contrato indica que devuelve empleados coincidentes con datos de directorio como email, título, departamento y país.

### 16.22.2 Evidencia runtime

**[RUNTIME]** Se ejecutó un probe autocontenido dentro de Grid contra `/api/v1/people/search`. En una búsqueda parcial de 3 caracteres se observó HTTP 200, 20 resultados y los campos: `area_description`, `country`, `department`, `division`, `email`, `full_name`, `manager_username`, `title`, `username`.

**[RUNTIME]** En una segunda prueba con un LDAP conocido completo (12 caracteres) se observó HTTP 200, latencia aproximada de 147 ms, `result_count=1` y `exact_match_count=1`. El identificador exacto coincidió contra `people[].username`.

**Conclusión operativa para el contexto probado:** `people[].username` puede usarse como **LDAP operativo validado por el directorio de Grid** cuando el usuario selecciona un resultado devuelto por `/api/v1/people/search`.

Esto NO convierte cualquier texto escrito por el usuario en un LDAP válido. La validación requiere que el valor provenga de un resultado real del directorio y que la aplicación persista el `username` retornado, no el texto libre de búsqueda.

### 16.22.3 Patrón recomendado para selectores de personas

1. aceptar texto solo como consulta de búsqueda;
2. no permitir confirmar texto libre;
3. ejecutar `/api/v1/people/search?q=<consulta>&limit=<N>` con `credentials: "include"`;
4. mostrar resultados del directorio;
5. exigir selección explícita de un resultado;
6. persistir únicamente `people[].username` cuando el caso de uso necesite LDAP;
7. tratar nombre, email, puesto, departamento, país y demás metadata como datos efímeros de presentación salvo necesidad explícita;
8. no exportar respuestas completas del directorio ni PII en logs/artefactos de diagnóstico.

### 16.22.4 Compartición de registros de aplicación

Para compartir una entidad lógica de una app (por ejemplo una solicitud almacenada en Sheets), puede persistirse una lista de `username`/LDAP validados por el directorio y evaluar visibilidad client-side. Esto es una regla de aplicación, no un ACL row-level del proxy de Sheets.

El patrón probado para Seguimientos Mandatorios usa `Compartido con` con LDAP separados por `|`; el propietario conserva edición/eliminación/gestión del share y el usuario compartido recibe solo lectura. Revisores conservan su scope global independiente.

### 16.22.5 Adjuntos públicos para registros compartidos

**[DECISIÓN DE APP / RUNTIME A VALIDAR EN CADA DESPLIEGUE]** Para Seguimientos Mandatorios, los adjuntos nuevos se crean con `visibility=public` en Grid. La intención es que cualquier usuario que pueda abrir la solicitud desde la app pueda abrir también sus adjuntos sin administrar shares individuales por documento.

Reglas:

1. al crear un adjunto nuevo, enviar `visibility=public`;
2. las nuevas versiones permanecen sobre el mismo `doc_id`;
3. no usar `POST /api/v1/documents/{doc_id}/share` para este flujo;
4. un usuario compartido en modo solo lectura puede abrir el adjunto desde la solicitud;
5. retirar a alguien de `Compartido con` revoca la visibilidad de la solicitud en la app, pero **no debe interpretarse como revocación del documento público**;
6. `public` significa la visibilidad configurada como pública dentro de Grid. No afirmar que el documento sea público en Internet salvo una prueba específica del viewer/ACL que lo demuestre.

Esta política elimina la dependencia de un endpoint de unshare para adjuntos, a cambio de aceptar que el documento público no queda protegido por el ACL lógico de `Compartido con`. No usar este patrón para archivos que requieran confidencialidad por fila.

**CLOSE_VERDICT: `PEOPLE_USERNAME_AS_LDAP_CONFIRMED_IN_TESTED_RUNTIME`**


## 16.23 V24.8: Cierre de sesión desde apps Grid — TEMA CERRADO (dentro del contexto probado)

> Nota de privacidad (§15.1): hosts y paths de la pasarela de login aparecen abajo porque son parte de la evidencia. Si se prefiere omitirlos, sustituir por `<GATEWAY_LOGIN>` y conservar la referencia en la evidencia privada.

### 16.23.1 Veredicto

**[RUNTIME]** Una app HTML embebida en Grid **puede cerrar la sesión del usuario** cargando el endpoint de logout de la pasarela de login en un **iframe oculto** y verificando el resultado con `GET /api/v1/me`.

**CLOSE_VERDICT: `GRID_LOGOUT_VIA_LOGIN_GATEWAY_IFRAME_CONFIRMED`**

Evidencia clave (1 usuario, 1 navegador, origen `grid.adminml.com`, 2026-10-08):

- `GET /api/v1/me`: 200 antes → **401 a 1 s y a 5 s** después (hash de identidad idéntico en el baseline; sin identidad después).
- El iframe disparó `load` a ~0.5 s; la prueba completa tomó ~2.1 s.
- Al recargar Grid, el navegador pidió iniciar sesión.
- La sesión que se cierra es **compartida** entre las apps de `*.adminml.com` (confirmado con una segunda app); un logout desde una app afecta a las demás.

### 16.23.2 Patrón canónico

```text
click "Cerrar sesión"
  -> modal propio de confirmación (sin confirm())
  -> iframe oculto: https://login.adminml.com/logout?callbackURL=<URL-encoded https://grid.adminml.com>
       (src asignado ANTES de insertar el iframe)
  -> esperar load (máx. 15 s) + 1.5 s de margen
  -> verificar GET /api/v1/me con redirect:"manual": 401/403/redirect = sesión cerrada
       (reintentar hasta 4 veces, 1.5 s entre intentos)
  -> pantalla bloqueante "Sesión cerrada" + limpiar estado en memoria
```

Componente de referencia: `grid_logout_button.html` (CSS + HTML + JS, sin storage, sin cookies, sin CDNs, sin diálogos nativos).

Reglas:

1. No declarar éxito sin la verificación de `/api/v1/me`; un `load` del iframe no prueba nada.
2. Si la verificación falla o hay error de red, mostrar estado de error con reintento; nunca "Sesión cerrada".
3. Tras el cierre, no ofrecer botón de "recargar": recargar el iframe cae en la pantalla de login de Okta, que se niega a renderizarse embebida.
4. Avisar al usuario que el cierre afecta a las demás apps con el mismo inicio de sesión.
5. Limpiar el estado en memoria de la app en el gancho `onLoggedOut`; no depender de `localStorage`/`sessionStorage` (§15.2).

### 16.23.3 Cómo se llegó (cadena de hechos)

| Hecho | Etiqueta | Resultado |
|---|---|---|
| OpenAPI vigente: 207 paths / 257 operations (+6 vs baseline V24.4) | [OPENAPI] | Sin rutas de logout/sesión; solo `google/oauth`, `tokens`, `groups/share` |
| `GET /api/auth/user`, `GET /api/auth/logout` en Grid | [RUNTIME] | 404 con JSON; no existe el patrón BFF de shield en Grid |
| `OPTIONS` a ~26 rutas candidatas | [RUNTIME] | **Prueba inválida**: todo devolvió 500, incluidos controles y `/api/v1/me`. No concluir "no existe" a partir de esto |
| `window.GRID` | [RUNTIME] | Solo `docId`, `state`, `states`, marcas de actualización; **sin funciones** |
| `grid-sdk.js` / `viewer.js` | [RUNTIME] | Sin `postMessage`; sin menciones de logout; 2 listeners de `message` en `viewer.js` |
| Flags del sandbox en `viewer.js` | [RUNTIME] | `allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals`; **sin `allow-top-navigation`** |
| `window.open` desde la app | [RUNTIME] | Devolvió `null` (bloqueado) a pesar de `allow-popups` listado; contradicción **no resuelta** (posible política del navegador) |
| Navegación top (`<a target="_top">`) | [RUNTIME] | Sin efecto |
| Navegar el propio iframe al signout de Okta | [RUNTIME] | "Refused to connect" (Okta no se renderiza embebido) |
| Signout de Okta por sí solo (`auth-meli.../login/signout?fromURI=...redirect-logout...`) | [RUNTIME] | **No cierra** la sesión de Grid ni de otras apps |
| `GET /api/auth/logout` de shield (pestaña normal e iframe oculto) | [RUNTIME] | Solo devuelve JSON con `logoutUrl`; **no cierra** la sesión por sí solo |
| `logoutUrl` devuelto por shield | [RUNTIME] | `https://login.adminml.com/logout?callbackURL=<URL-encoded https://shield.adminml.com>` |
| Pestaña normal -> `login.adminml.com/logout?callbackURL=<grid>` | [RUNTIME] | Cierra la sesión; Grid pide login |
| Iframe oculto -> el mismo endpoint | [RUNTIME] | `/me` 401 a 1 s y 5 s; Grid pide login al recargar |

**[INFERENCIA, no observada]** La URL de signout de Okta (`auth-meli.adminml.com/login/signout?fromURI=...`) que muestran las apps parece ser un paso posterior de la cadena que arranca en `login.adminml.com/logout`. Se infiere de la forma de las URLs; no se capturaron las redirecciones.

### 16.23.4 Lecciones de método

- Un control inexistente que responde igual que el endpoint conocido **invalida** la fase (el 500 uniforme de `OPTIONS`).
- Antes de concluir "la sesión es propia de la app", reproducir la cadena **completa** de la app que sí funciona: el paso decisivo estaba en la primera redirección, que el enlace parcial omitía.
- Leer el bundle público de una app que ya resuelve el problema (shield) fue más rápido que adivinar rutas.

### 16.23.5 Límites no probados

- Un solo usuario y un solo navegador; sin pruebas en Safari/ITP, móvil ni modo incógnito.
- `callbackURL` probado únicamente con `https://grid.adminml.com`. No se sabe si la pasarela acepta otros destinos (por ejemplo `grid.melioffice.com`) ni si hay lista de permitidos.
- Apps detrás de otra pasarela (por ejemplo `okta-login-shipping`) no fueron probadas; no asumir que comparten sesión.
- Dependencia de un endpoint interno de la pasarela que no pertenece a Grid: puede cambiar sin aviso. Revalidar si el botón deja de funcionar.
- No se midió si una app con la sesión ya cerrada puede quedar "colgada" con peticiones en vuelo; el componente bloquea la UI tras el cierre.
- Duración de la sesión de Grid sin cierre explícito: no determinada.

### 16.23.6 Evidencia que debe conservarse

Conservar los JSON completos exportados por el harness `grid_logout_probe` (Fases 0, 1, 2, 4, 5, 6, 7 y 8), incluyendo:

- baseline de embedding y de `/me` (solo hash SHA-256 y nombre del campo);
- eventos temporales de la Fase 8 (`iframe_start`, `iframe_load`, `iframe_end`, `post_me_1s`, `post_me_5s`, `verdict`);
- resultados negativos (Fases 2, 4, 5 y 7) que justifican descartar las otras vías.

Mantener los artefactos redacted-by-default: sin cookies, tokens, `state`, `code`, URLs de request completas ni datos de `/me`.


## 16.24 V24.9: `429` del proxy de Sheets identificado como cuota Google Sheets API — TEMA CERRADO para la causa observada

### 16.24.1 Veredicto

**[RUNTIME]** En pruebas del 2026-10-14 sobre `GET /api/v1/sheets/{sheet_id}?doc_id=...&range=...`, el `HTTP 429` observado fue explicado explicitamente por el body de error del proxy:

```text
Quota exceeded for quota metric 'Read requests'
and limit 'Read requests per minute'
of service 'sheets.googleapis.com'
for consumer 'project_number:[redacted]'.
```

**CLOSE_VERDICT: `SHEETS_429_IS_GOOGLE_READ_REQUESTS_PER_MINUTE_QUOTA_IN_TESTED_RUNTIME`**

La causa observada no fue una desconexion de Google, un error ACL del Sheet ni un "backpressure" inventado por el cliente. El dashboard llamo al proxy de Grid; el proxy llego a Google Sheets API; Google rechazo la lectura porque la cuota de requests de lectura por minuto del proyecto consumidor estaba agotada.

### 16.24.2 Evidencia runtime

Se ejecutaron dos probes redacted-by-default usando el mismo `doc_id`/Sheet del caso real, pero rangos minimos para no consumir datos ni amplificar trafico:

1. **Probe V1:** `/api/v1/me` respondio 200; la primera lectura de rango ya respondio 429 y metadata tambien 429. No aparecieron `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` ni `X-RateLimit-Reset`. Lecturas de recuperacion siguieron en 429 tras esperas aproximadas de 4.6 s, 7.5 s y 13.5 s; una lectura posterior respondio 200 tras una espera adicional aproximada de 25.7 s. La recuperacion total desde el primer 429 fue de ~52 s.
2. **Probe V2:** `/me` 200, lectura de rango 200 y metadata 200; la siguiente lectura de rango respondio 429. Tampoco hubo headers estandar de rate limit. Esta vez se inspecciono de forma sanitizada el body de error y aparecio la causa exacta de Google Sheets API citada arriba.
3. El body util tenia ~220 bytes en la corrida observada. El feedback diagnostico estaba en `detail`; no en headers de quota/retry.

**Correccion metodologica:** un verdict temprano del Probe V2 etiqueto el 429 como `LOCAL_BURST_429_AT_2000MS`, pero el primer request de esa fase salio sin esperar los 2000 ms completos (`since_prev_ms` ~413 ms). Ese verdict de cadencia queda **INVALIDADO**. El hallazgo valido es el feedback del backend: cuota Google Sheets API de lecturas por minuto.

### 16.24.3 Que se puede y no se puede concluir

**Confirmado:**

- la metrica agotada fue `Read requests`;
- el limite reportado fue `Read requests per minute`;
- el servicio que aplico la cuota fue `sheets.googleapis.com`;
- el error identifica un **proyecto consumidor** (numero omitido por privacidad);
- el proxy probado no expuso `Retry-After` ni `X-RateLimit-*` en esas respuestas;
- una lectura puede empezar ya en 429 si la ventana de cuota fue consumida antes de esa instancia del dashboard.

**No confirmado:**

- que todas las apps Grid usen el mismo proyecto consumidor;
- que todos los usuarios/documentos/Sheets compartan exactamente el mismo bucket;
- el valor numerico del limite configurado para ese proyecto;
- si existe ademas una cuota por usuario superpuesta;
- que ~60 s sea un TTL contractual. La recuperacion ~52 s es solo una observacion consistente con una ventana por minuto, no una garantia de reset exacto.

### 16.24.4 Patron canonico actualizado para lecturas de Sheets

Para catalogos/bitacoras que deban cargarse completos, optimizar primero el **numero de requests**, no el numero de filas por request:

```text
abrir / refresh explicito
        |
        v
1 x GET snapshot completo del rango necesario
        |
        v
cache en memoria
  |-- filtros
  |-- busquedas
  |-- fechas
  |-- orden
  `-- metricas
      (0 requests a Sheets)
```

Reglas:

1. Preferir **una sola lectura de snapshot completo** (`values.get` via proxy) cuando el payload real lo permita. No paginar en bloques pequenos por defecto: cada pagina consume otra `Read request`.
2. Cachear el snapshot en memoria y hacer filtros/busquedas/fechas/orden/metricas localmente. Un cambio de filtro nunca debe releer Sheets.
3. Coalescer refreshes: una sola Promise/lectura in-flight por recurso. Clicks repetidos no generan lecturas paralelas.
4. Aplicar un TTL local razonable cuando la frescura de negocio lo permita. En el Dashboard XMT1 se adopta **60 s entre refresh externos exitosos** como defensa de aplicacion, no como contrato de Google/Grid.
5. **[SUPERSEDIDO por §16.25.6]** Ante el 429 de cuota de lecturas identificado, **no hacer retries automaticos inmediatos**. Conservar el ultimo snapshot verificado y abrir un cooldown local; en XMT1 se adopta 65 s. Es una politica conservadora de la app, no un `Retry-After` del servidor.
6. No propagar automaticamente un 429 de Sheets al gate global de Named State u otros servicios: la evidencia actual identifica especificamente una cuota de `sheets.googleapis.com`. Mantener el cooldown **service-scoped** salvo nueva evidencia que demuestre un bucket comun.
7. Metadata de Sheets es otra lectura HTTP al proxy y no debe pedirse en el hot path si no es necesaria para la UX. Reservarla para diagnostico/configuracion.
8. Si se inspecciona el body de error para diagnostico, exportar solo campos sanitizados. No conservar `project_number`, IDs, URLs, contenido de celdas, OAuth ni PII.
9. Si el snapshot completo excede limites de payload/timeout, medir el maximo util antes de volver a paginar; si se pagina, usar el menor numero razonable de paginas y nunca re-leer por filtros locales.

### 16.24.5 Aplicacion concreta: Dashboard XMT1 / Inbound HV

**[IMPLEMENTACION]** La revision asociada a este hallazgo cambia Inbound HV de paginacion de 1000 filas + retries a:

- rango unico `AUDIT_SHIPMENTS!A:W`;
- **1 GET** por carga externa exitosa;
- cache en memoria para fecha/busqueda/render;
- 60 s de TTL despues de una lectura exitosa;
- 65 s de cooldown local tras un 429 de Sheets;
- cero retry automatico tras el 429 conocido;
- preservacion del ultimo snapshot valido;
- feedback `detail` sanitizado (sin numero de proyecto consumidor);
- el 429 de Sheets ya no llama al gate global de `GridClient` usado por State.

Este cambio reduce una actualizacion de N paginas a una sola `Read request` cuando el snapshot completo cabe en la respuesta. No garantiza ausencia total de 429 si otras instancias consumen la misma cuota del proyecto; minimiza la contribucion de esta app.

### 16.24.6 Open question residual

La siguiente prueba, solo si hace falta escalar el problema a plataforma, es comparar un **fingerprint irreversible del proyecto consumidor** entre varias apps/Sheets/usuarios que sufran 429. Si coincide, demostraría que esas rutas comparten el mismo proyecto consumidor. No conservar ni publicar el `project_number` crudo.


## 16.25 V24.10: relación documento ↔ Google Sheet (cambio de seguridad del 14-oct-2026), identidad por dominio y patrones de carga — TEMA CERRADO (dentro del contexto probado)

> Nota de privacidad (§15.1): los IDs de documentos y libros se omiten; los nombres de usuario de terceros se omiten. Conservar el detalle en la evidencia privada del proyecto.

### 16.25.1 Veredicto

**[OPENAPI + RUNTIME]** Desde el **14-oct-2026** el proxy de Sheets de Grid exige una **relación registrada por par exacto (doc_id, sheet_id)**. Sin esa relación, toda llamada `/api/v1/sheets/{sheet_id}?doc_id=…` (GET/PUT/append/metadata/batch) responde:

```json
{"error": "permission_denied", "detail": "You do not have access to this resource"}
```

HTTP 403 — **el mismo cuerpo que el ACL de Grid**, aunque el llamante sea dueño del documento y del libro y tenga OAuth conectado.

La relación la registra **el dueño del documento** con:

```text
PUT /api/v1/sheets/{sheet_id}/link?doc_id={doc_id}
body: {"capability": "read_only" | "read_write"}   (default read_write)
```

**[OPENAPI]** descripción literal: *"Register or upgrade an exact Sheet relationship confirmed by the owner."*

**CLOSE_VERDICT: `SHEETS_DOC_RELATIONSHIP_REGISTERED_VIA_LINK_ENDPOINT`**

### 16.25.2 Evidencia runtime (2026-10-15)

- Documentos propios, dueño de los 3 libros, OAuth `connected: true` con scope `spreadsheets`: **403 en los 3 libros** por cuatro vías — `fetch` directo, SDK `Grid.sheets.get`, SDK con `Grid.configure({docId})` literal en el HTML + nueva versión, y apertura del documento como dueño.
- Tras `PUT …/link` desde una app Grid ejecutada **por el dueño**: **8/8 pares registrados (200) y 8/8 lecturas 200** inmediatamente.
- **Un mismo libro admite varios documentos vinculados a la vez** (Admin y Form vinculados a 3 documentos distintos) — necesario porque varias apps leen el mismo libro.
- Escritura en producción con capacidad `read_write` reportada como estable por el operador tras la migración (append de Scan, decisiones de Management, edición en Admin Panel); no se capturó evidencia JSON de esas escrituras.
- Documentos registrados antes del 14-oct conservaron **sólo los pares que su dueño ejercitó al abrirlos**: un documento compartido por varias apps conservó Admin y Form (los usaba la app que su dueño abría) pero **no** Ingresos (sólo lo usaba Scan, abierto por guardias, no por el dueño).
- Aviso oficial de Grid (documentación de Google Sheets, sección *Security and access*): "Only the document owner can confirm or renew a Google Sheets relationship". No documenta el endpoint; se encontró por diff del OpenAPI vivo.

### 16.25.3 Diff OpenAPI 2026-10-15 vs V17

**[OPENAPI]** 216 rutas / 268 operaciones / 231 schemas.

- Nuevas relevantes: `PUT /api/v1/sheets/{sheet_id}/link`; rutas `security/*` de clasificación/privatización; `announcements`; rutas `/api/v2/*` (documents, folders, favorites, notifications).
- Bajas relevantes: `GET /api/v1/sheets/search` (y por tanto `Grid.sheets.search`), `POST /api/v1/google/gmail/send`, `POST /api/v1/google/drive/share`, `collections` (deprecated), además de las ya conocidas (refresh de Datasets, Drive files, link-drive, open-from-drive).
- `GET /api/v1/google/oauth/status` devuelve `{connected, google_email, scopes, expires_in_seconds}` y **nunca** 4xx por credenciales faltantes.
- El rate limit documentado del proxy es **20 escrituras/min por documento** (skill oficial de Grid) — independiente de la cuota de Google.

### 16.25.4 Identidad distinta por dominio (causa del "Sign-in session mismatch")

**[RUNTIME]** `GET /api/v1/me` puede devolver **usuarios distintos** según el dominio en el mismo navegador:

- `grid.adminml.com` → `auth_path: grid_user` (sesión de Grid del usuario).
- `grid.melioffice.com` → `auth_path: fury_user` (sesión de **Fury** del navegador; en el caso observado pertenecía a otra persona).

El flujo oficial `https://grid.melioffice.com/google/oauth/start` guarda los tokens para el usuario **de ese dominio**. Si difiere, la conexión queda en otra cuenta (`status` en adminml sigue `connected: false`) y empezar desde adminml da *"Sign-in session mismatch"*.

Regla: antes de conectar OAuth, comparar `/api/v1/me` en ambos dominios; si difieren, iniciar sesión en Fury/melioffice con la cuenta correcta (o limpiar datos de sitio de `melioffice.com`/`furycloud.io`) y verificar `oauth/status` en **adminml**.

### 16.25.5 Arquitectura vigente

```text
1 documento de Grid por app (dueño = cuenta con OAuth)
   │  compartido con la audiencia de ESA app
   │  doc_id = window.GRID.docId (respaldo: ID de producción literal)
   ▼
pares registrados con PUT /sheets/{sheet}/link, capacidad mínima:
   Scan        → Admin (read_only), Form (read_only), Ingresos (read_write)
   Management  → Admin (read_write), Form (read_write)
   Admin Panel → Admin (read_write)
```

Motivo de seguridad del "1 documento por app": con un documento compartido por todas las apps, cualquier viewer (p. ej. un guardia) hereda `read_write` sobre Usuarios vía proxy. Con documentos separados, la escritura sobre Usuarios queda limitada a los documentos que sólo abren gestores/admins.

**Regla operativa nueva:** todo documento nuevo de una app (otra versión de test, un fork) requiere registrar sus pares antes de usarse. Un documento que no aparece en el registro falla con el 403 genérico.

### 16.25.6 Actualización a §16.24 (cuota) — supersede la regla de 65 s

**[RUNTIME]** Recuperación observada ~13 s tras el último 429 y ~30 s tras el primero. La política de cooldown fijo de 65 s de §16.24.4 regla 5 queda **reemplazada** por:

- cooldown **por cubo** (lectura / escritura) con escalera 4 → 8 → 16 → 30 → 30 s ±25 % de jitter;
- una sola sonda tras el cooldown (cola serial); máximo 2 reintentos por petición;
- un 2xx del cubo reinicia la escalera;
- la espera del cooldown ocurre **fuera** de la cola serializada (si no, una petición de fondo bloquea a la prioritaria: head-of-line blocking);
- clasificar el alcance desde el texto de Google: `Read requests per minute` = **proyecto**; `… per minute per user` = **usuario** (el dueño del OAuth).

### 16.25.7 Patrones de carga validados en simulación (pendientes de piloto real)

- **Escrituras en lotes** (append de N filas = 1 escritura; verificación de N `write_id` = 1 lectura), con *linger* 10 s / máx. 50 filas, aislamiento uno-por-uno ante 4xx permanente, resolución de ambigüedad por `write_id` y precheck al reanudar.
- **Candado entre pestañas** con Web Locks API para el drenado del outbox (sin él, dos pestañas duplican todas las filas).
- **Reuso asimétrico** de la lectura en vivo (sólo un "permitido" puede reutilizar una lectura ≤15 s; bloqueados/desconocidos siempre releen).
- **Fotos en caché sólo en memoria** (LRU, TTL 4 h, borrado al cerrar sesión) — política de Loss Prevention: sin persistencia de biométricos.
- **Memoria de arranque**: un reintento tras 429 no repite las lecturas que ya salieron bien.

### 16.25.8 Límites no probados

- Si `read_only` realmente bloquea escrituras (no se probó una escritura deliberada con un par `read_only`).
- Si existe un endpoint para listar o revocar pares (no aparece en el OpenAPI capturado).
- Duración/caducidad de un par registrado y efecto de un cambio de dueño del documento.
- Comportamiento del límite de 20 escrituras/min por documento bajo la carga real de Scan.


## 16.26 V24.11: mini-apps (`/api/v1/utilities`), OAuth de Google, límites de tasa, `if_version` y autorización por fila (corte 2026-10-29)

> Nota de privacidad (§15.1): se omiten `doc_id`, `sheet_id`, LDAP/usernames, correos, el número de proyecto de Google Cloud que aparece en un mensaje de error de Google y cualquier URL con parámetros. Solo se conservan nombres de campo, tipos, conteos, códigos y tiempos.

Fuentes de esta ronda (conservar los JSON completos, ver §16.26.11): `grid_openapi_probe_20261029_172541.json`, `grid_utilities_probe_20261029_175048.json` (preflight + 403) y `grid_utilities_probe_20261029_180317.json` (corrida completa de 251 requests, 221 s). Además se revisó el código de dos apps reales (§16.26.8).

### 16.26.1 Veredictos

- **CLOSE_VERDICT: `MINIAPPS_STORAGE_IS_A_GOOGLE_SHEET_CONFIRMED`** **[RUNTIME]**. La metadata del Sheet vinculado lista una pestaña por colección más pestañas internas, y los 429 de escritura traen el texto literal de `sheets.googleapis.com`.
- **CLOSE_VERDICT: `UTILITIES_REQUIRE_A_VERIFIED_GOOGLE_ACCOUNT`** **[RUNTIME]**. `POST /utilities` devolvió 403 `google_not_connected` mientras `oauth/status` decía `connected=true`; lo que cambió tras reconectar fue `requires_reconnect`, `google_email` y los scopes (§16.26.3).
- **CLOSE_VERDICT: `RECORD_IF_VERSION_IS_NOT_ATOMIC_UNDER_CONCURRENCY`** **[RUNTIME]**. En secuencia detecta versiones obsoletas (409); con escritores simultáneos puede aceptar a más de uno (§16.26.5).
- **CLOSE_VERDICT: `SHEETS_PROXY_HAS_NO_ROW_LEVEL_AUTHORIZATION_IN_CONTRACT`** **[OPENAPI]**. El proxy solo recibe rangos; no hay parámetro de filtro ni identidad por fila. Que un gestor pueda leer o escribir hojas que la app solo oculta en el HTML es **[INFERENCIA, no probada]** (§16.26.7).

### 16.26.2 OpenAPI vivo, 2026-10-29

| Corte | Rutas | Operaciones | Schemas |
|---|---|---|---|
| V17 (2026-08-16, Apéndice A) | 203 | 255 | n/d |
| 2026-10-15 (§16.25.3) | 216 | 268 | 231 |
| **2026-10-29** | **229** | **286** | **259** |

- `GET /openapi.json`: 200, 367.764 bytes (V17: 329.814), `Cache-Control: no-store`, sin `ETag`. `/docs` y `/redoc`: 200. OpenAPI 3.1.0, versión de servicio `1.0.0`, sin `servers` ni `securitySchemes` declarados, 0 operaciones `deprecated`, todas con `operationId`.
- Prefijos: `/api/v1` 243 operaciones, `/api/v2` 8, `/d/*` 13, resto `internal/*`, `worker/*`, `slack/*`, `ping`, `health`, `skill`.
- El inventario del 2026-10-15 **no se conservó**; el diff exacto es contra V17 (Apéndice A): **49 operaciones nuevas y 18 retiradas**. Desde el 2026-10-15 hay +13 rutas, +18 operaciones y +28 schemas, sin poder aislar cuáles.
- Las 11 rutas `/me`, `people/me/*` y `workspaces/{id}/members/me` de la Biblia siguen todas presentes y sin cambios. **El contrato declara la respuesta de `GET /me` como `any`**, por lo que el OpenAPI no puede detectar cambios en el payload de `/me`: eso solo se ve en runtime.
- `grid_sql` aparece 2 veces en el texto del contrato; no está en enums ni propiedades exportadas. `DatasetMeta.source_type` y `DatasetUpsertResponse.source_type` aceptan 2 valores en la respuesta (probablemente legado), mientras la creación sigue siendo `const external_push` (§16.1). No confirmado dónde están las 2 menciones.
- Campos de `/me` observados el 2026-10-29 (solo nombres): `area_description`, `auth_path`, `caller_id`, `country`, `department`, `division`, `email`, `full_name`, `is_public`, `ldap`, `manager_username`, `title`, `username`. `caller_id` e `is_public` no estaban documentados antes; no hay baseline anterior para afirmar que sean nuevos.

#### Operaciones nuevas respecto a V17 (49)

La columna «§16.25.3» indica si la Biblia ya las había anotado como «nuevas relevantes» (21 sí, 28 no).

| Operación | Resumen | Tag | §16.25.3 |
|---|---|---|---|
| `DELETE /api/v1/announcements/{announcement_id}` | Delete Announcement | announcements | Sí |
| `DELETE /api/v1/utilities/{doc_id}/collections/{name}/records/{record_id}` | Delete Record | utilities | **No** |
| `DELETE /api/v2/documents/{doc_id}/favorite` | Unfavorite Document | documents-v2 | Sí |
| `GET /api/v1/announcements` | List Announcements | announcements | Sí |
| `GET /api/v1/announcements/{announcement_id}` | Get Announcement | announcements | Sí |
| `GET /api/v1/document-classification-backfill/runs/{run_id}` | Get Document Classification Backfill Run | jobs | **No** |
| `GET /api/v1/security/documents/{doc_id}/content` | Read Private Document Content | security | Sí |
| `GET /api/v1/security/documents/{doc_id}/metadata` | Read Private Document Metadata | security | Sí |
| `GET /api/v1/security/presentations/{presentation_id}/metadata` | Read Private Presentation Metadata | security | Sí |
| `GET /api/v1/utilities/{doc_id}/collections` | List Collections | utilities | **No** |
| `GET /api/v1/utilities/{doc_id}/collections/{name}` | Get Collection | utilities | **No** |
| `GET /api/v1/utilities/{doc_id}/collections/{name}/records` | List Records | utilities | **No** |
| `GET /api/v1/utilities/{doc_id}/collections/{name}/records/{record_id}` | Get Record | utilities | **No** |
| `GET /api/v1/utilities/{doc_id}/storage` | Get Utility Storage | utilities | **No** |
| `GET /api/v2/documents` | List Documents | documents-v2 | Sí |
| `GET /api/v2/folders` | List Folders | folders-v2 | Sí |
| `GET /api/v2/frontend-config` | Get Frontend Config | frontend-config-v2 | Sí |
| `GET /api/v2/notifications/incoming-requests` | Incoming Requests | notifications-v2 | Sí |
| `GET /api/v2/notifications/my-requests` | My Requests | notifications-v2 | Sí |
| `GET /internal/migration-check/documents/{doc_id}` | Check Document | internal | **No** |
| `GET /internal/migration-check/owners/{owner_id}` | Check Owner | internal | **No** |
| `GET /internal/migration-check/owners/{owner_id}/summary` | Summarize Owner | internal | **No** |
| `PATCH /api/v1/utilities/{doc_id}/collections/{name}` | Update Collection | utilities | **No** |
| `PATCH /api/v1/utilities/{doc_id}/collections/{name}/records/{record_id}` | Update Record | utilities | **No** |
| `PATCH /api/v1/workspaces/{workspace_id}/members/{member_id}` | Update Member Role | workspaces | **No** |
| `POST /api/v1/announcements` | Create Announcement | announcements | Sí |
| `POST /api/v1/announcements/{announcement_id}/publish` | Publish Announcement | announcements | Sí |
| `POST /api/v1/announcements/{announcement_id}/unpublish` | Unpublish Announcement | announcements | Sí |
| `POST /api/v1/document-classification-backfill/sync` | Sync Document Classification Backfill | jobs | **No** |
| `POST /api/v1/documents/{doc_id}/leave` | Leave Lock | documents | **No** |
| `POST /api/v1/documents/{doc_id}/repair-bundle-prefix` | Repair Bundle Prefix | documents | **No** |
| `POST /api/v1/documents/{doc_id}/utility-editor-sharing` | Enable Utility Editor Sharing | permissions | **No** |
| `POST /api/v1/security/documents/{doc_id}/versions/{version}/metadata` | Classify Document Version Confidentiality | security | Sí |
| `POST /api/v1/security/documents/{document_id}/deprivatize` | Deprivatize | security | Sí |
| `POST /api/v1/shield/tickets/ownership-transfer` | Execute Ownership Transfer | shield | **No** |
| `POST /api/v1/utilities` | Create Mini App | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/collections` | Create Collection | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/collections/{name}/archive` | Archive Collection | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/collections/{name}/records` | Create Record | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/collections/{name}/records/search` | Search Records | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/collections/{name}/restore` | Restore Collection | utilities | **No** |
| `POST /api/v1/utilities/{doc_id}/storage/provision` | Retry Utility Storage Provision | utilities | **No** |
| `POST /api/v2/documents/names` | Read Document Names | documents-v2 | Sí |
| `POST /api/v2/documents/{doc_id}/favorite` | Favorite Document | documents-v2 | Sí |
| `POST /internal/documents/reconcile` | Reconcile Document | internal | **No** |
| `POST /internal/presentations/slide-doc-type/backfill` | Backfill Slide Doc Type | internal,slide-doc-type-backfill | **No** |
| `PUT /api/v1/announcements/{announcement_id}` | Update Announcement | announcements | Sí |
| `PUT /api/v1/presentations/{id}/timer` | Update Presentation Timer | presentations | **No** |
| `PUT /api/v1/sheets/{sheet_id}/link` | Register Sheet Link | sheets | Sí |

Grupos **no anotados antes**: `utilities` (15: mini-apps, colecciones, registros, storage), `document-classification-backfill` (2), `internal/migration-check` (3), `internal/documents/reconcile` y `internal/presentations/slide-doc-type/backfill`, `shield/tickets/ownership-transfer`, `documents/{doc_id}/leave`, `repair-bundle-prefix`, `utility-editor-sharing`, `PATCH workspaces/{id}/members/{member_id}` y `PUT presentations/{id}/timer`.

#### Operaciones retiradas respecto a V17 (18)

| Operación | Resumen previo | §16.25.3 |
|---|---|---|
| `DELETE /api/v1/collections/{collection_id}` | Delete Collection [DEPRECATED] | Sí |
| `DELETE /api/v1/collections/{collection_id}/documents/{doc_id}` | Remove Document From Collection [DEPRECATED] | Sí |
| `DELETE /api/v1/documents/{doc_id}/versions` | Purge Document Versions | **No** |
| `DELETE /api/v1/documents/{doc_id}/versions/{version}` | Delete Document Version | **No** |
| `GET /api/v1/collections` | List Collections [DEPRECATED] | Sí |
| `GET /api/v1/collections/{collection_id}` | Get Collection [DEPRECATED] | Sí |
| `GET /api/v1/google/drive/files/{file_id}` | Get Drive File | Sí |
| `GET /api/v1/google/drive/files/{file_id}/download` | Download Drive File | Sí |
| `GET /api/v1/sheets/search` | Search Sheets | Sí |
| `GET /open-from-drive` | Open From Drive | Sí |
| `PATCH /api/v1/collections/{collection_id}` | Patch Collection [DEPRECATED] | Sí |
| `POST /api/v1/collections` | Create Collection [DEPRECATED] | Sí |
| `POST /api/v1/collections/{collection_id}/documents` | Add Document To Collection [DEPRECATED] | Sí |
| `POST /api/v1/documents/link-drive` | Link Drive File | Sí |
| `POST /api/v1/documents/{doc_id}/data/refresh` | Refresh Datasets | Sí |
| `POST /api/v1/documents/{doc_id}/datasets/{name}/refresh` | Refresh Dataset Definition | Sí |
| `POST /api/v1/google/drive/share` | Share Drive Resource | Sí |
| `POST /api/v1/google/gmail/send` | Send Gmail | Sí |

**Baja no anotada antes:** `DELETE /api/v1/documents/{doc_id}/versions` (Purge Document Versions) y `DELETE …/versions/{version}`. Hoy solo quedan `GET` y `POST` sobre `/versions`. Una app que purgara versiones recibiría error. **[OPENAPI]**; no se probó en runtime.

### 16.26.3 OAuth de Google: `requires_reconnect`, scopes y host de reconexión

**[RUNTIME]** `GET /api/v1/google/oauth/status` devuelve ahora cinco campos: `connected`, `expires_in_seconds`, `google_email`, `requires_reconnect` y `scopes` (array). §16.25.3 documentaba cuatro; **`requires_reconnect` es nuevo**. Respondió 200 en las tres corridas (no se probó sin sesión).

| Momento | `connected` | `requires_reconnect` | `google_email` | Scopes | `expires_in_seconds` | `POST /utilities` |
|---|---|---|---|---|---|---|
| Antes de reconectar (corrida 2) | true | **true** | null | `drive.file`, `spreadsheets` | 755 | **403** `google_not_connected` |
| Tras reconectar | true | **false** | presente | `drive`, `spreadsheets`, `drive.file`, `userinfo.email`, `openid` | 3562 | 201 |

- La primera corrida con preflight observó `connected=true`, mismos scopes y `google_email` nulo (el valor de `requires_reconnect` aún no se registraba), con expiración de 1221 s.
- **Regla:** no basta `connected=true`. Para crear mini-apps hace falta `requires_reconnect=false` y `google_email` presente. La explicación más probable (**[HIPÓTESIS]**) es que Grid necesita verificar de quién es la cuenta de Google y la conexión previa no tenía scopes de identidad; el cambio de scopes tras reconectar es consistente con eso, pero Grid no documenta la causa.
- **Cuerpo del 403 (campos):** `detail` («Reconnect Google so Grid can verify the connected account.»), `error` = `google_not_connected`, `retry` = `false`, `recovery` (texto que pide abrir la URL en un navegador y reintentar) y `oauth_url`. El `oauth_url` apunta a **`grid.melisystems.com`**, ruta `/api/v1/google/oauth/start`, sin query. Es un tercer dominio que la Biblia no tenía (la skill y §16.25.4 citan `grid.melioffice.com/google/oauth/start`).
- En un intento del usuario la URL de `grid.melisystems.com` **no terminó de cargar**; no se diagnosticó (red/VPN, host o bucle de redirecciones). La reconexión se completó después por una ruta que no quedó registrada.
- **Alcance ampliado:** tras reconectar aparece el scope `drive` completo, más amplio que el `drive.file` anterior. Quien administre la cuenta del dueño debe saberlo; Grid no explica para qué lo pide.
- Sigue vigente la regla de no desconectar OAuth como diagnóstico (§17, regla 65).

### 16.26.4 Mini-apps (utilities) y colecciones

**[OPENAPI]** 15 operaciones bajo `/api/v1/utilities`. **[RUNTIME]** salvo que se indique.

**Creación y almacenamiento**

- `POST /api/v1/utilities` con `{title, description?, html}` → 201 `{utility:{doc_id, title, status, criticality, version}}`. Observado: `status=ready`, `criticality=low`, `version=1`. Tardó ~3,8 s. Es un documento de Grid con HTML.
- `GET /api/v1/utilities/{doc_id}/storage` → `{storage:{doc_id, sheet_id, owner_ldap, status, created_at, updated_at}}`; con `status=ready` desde la primera lectura (no hizo falta `POST …/storage/provision`, que existe como reintento y no se ejercitó).
- **Respaldo en Google Sheets:** `GET /sheets/{sheet_id}/metadata?doc_id=…` listó las pestañas `Hoja 1` (vacía), `__grid_utility`, `__grid_collections` y **una pestaña por colección**. Leer un rango sin nombre de pestaña lee `Hoja 1`; hay que calificarlo (`coleccion!A1:J4`). El formato interno de las pestañas no se inspeccionó.

**Colecciones**

- `POST …/collections` con `{name, fields:{campo:{type, required?, options?}}}` → 201. Tipos: `string`, `text`, `number`, `boolean`, `date`, `select` (el `select` exige `options` no vacío). Mínimo un campo. Nombre: `^[a-z][a-z0-9_]{0,63}$` (mayúsculas, guion, espacios y 80 caracteres → 422). Nombre repetido → 409. Eco con valores por defecto `required:false`, `status:enabled`, `options:null`. Cada colección tarda ~1,4 s (crea una pestaña).
- `PATCH …/collections/{name}` con `{if_version, add_fields?, field_statuses?}` → 200 con `version` +1. Con `if_version` obsoleto → 409 (mensaje genérico «Document … has been modified. You sent version X but current is Y. Re-fetch and retry.»). Un campo `disabled` rechaza escrituras que lo usen (400 `disabled fields: [...]`).
- `archive` y `restore` (POST con `{if_version}`) → 200. La lista por defecto excluye archivadas (`?include_archived=true` las incluye). **Registros de una colección archivada: lectura y escritura devuelven 404.**

**Registros**

- `POST …/records` con `{data}` → 201 `{record:{_id (ULID de 26 caracteres), _meta:{created_at, created_by, criticality, updated_at, updated_by}, collection, data, doc_id, version}}`. `version` inicial 1.
- **Validación estricta con 400** (los errores de esquema/parámetros son 422): campo requerido ausente, tipo incorrecto (número, texto, booleano), opción de `select` inválida, fecha no ISO-8601, `data` vacío y **campos desconocidos (se rechazan, no se descartan)**. `null` se acepta. Un `date` acepta un datetime ISO («2026-11-05T10:00:00Z») y se guarda tal cual.
- `GET …/records?limit&cursor` → `{records, cursor}`. **Orden por defecto: más nuevo primero.** `limit` máximo **200** (500 y 1000 → 422 «less than or equal to 200»; 0, -1 y texto → 422). Cursor de ~11 caracteres. Con `limit=7` recorrió 25/25 registros sin duplicados. No se midió el tamaño de página por defecto (≥ 25).
- `POST …/records/search` con `{filters, limit?, cursor?}`: mínimo un filtro (lista vacía → 422). Operadores `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `between` (exige `second_value`, si no 400). **Los filtros se combinan con AND; `between` es inclusivo;** las fechas ISO comparan como texto. 18 de 18 casos coincidieron con el conteo esperado. Campo desconocido → 400 `unknown field: x`. **Un valor de tipo incorrecto (`qty eq "abc"`) devuelve 200 con 0 resultados, sin error.** No existe parámetro de orden ni agregaciones; los campos `modified` y `updated_at` no son filtrables (400), aunque el schema `ModifiedFilterEnum` (`today`, `this_week`, `this_month`) existe sin campo asociado identificado.
- `PATCH …/records/{id}` exige `{data, if_version}` (sin `if_version` → 422). `DELETE …/records/{id}` exige cuerpo `{if_version}`; 204; después `GET` → 404 («Document <id> not found»). No hay endpoint de lote para registros.
- **Latencias** (con 300 ms de pausa entre requests): crear registro p50 ≈ 575 ms (p95 ≈ 812 ms); `PATCH` ≈ 1,0 s; listar y buscar ≈ 170 ms; archivar/restaurar ≈ 0,4 s.

**No medido por un fallo del probe:** si `PATCH` de registro hace *merge* o reemplaza `data` (el primer `PATCH` recibió tres 429 y nunca se aplicó), y la prueba limpia de `if_version` obsoleto sobre registros (ver §16.26.11).

### 16.26.5 Concurrencia: `if_version` no es un CAS

**[RUNTIME]** Registros nuevos en versión 1, escritores simultáneos con la misma `if_version`:

| Prueba | Resultado |
|---|---|
| 2 `PATCH` simultáneos | **200 / 200**; la versión final subió solo una vez y se perdió una de las escrituras |
| 5 `PATCH` simultáneos | 4 × 200 y 1 × 409 |
| `DELETE` con versión incorrecta (secuencial) | 409 |
| `PATCH` de colección con versión obsoleta (secuencial) | 409 |

Conclusión canónica: `if_version` en colecciones es, igual que `if_updated_at` en Named State (§16.17), un **detector de versión obsoleta en secuencia, no un CAS ni un lock**. Con escritores simultáneos puede ocurrir lost update. Los mensajes de error usan la palabra «Document», lo que sugiere el mismo motor de versionado de documentos (**[INFERENCIA]**). Esto no cumple la regla de §15 de no modelar conflicto concurrente como LWW; para ediciones simultáneas de una misma fila hay que serializar en el cliente o modelar eventos append-only.

### 16.26.6 Límites de tasa observados (endpoints de utilities)

Dos capas distintas, **[RUNTIME]**:

1. **Cuota de Google Sheets.** Durante la siembra, tras ~28 escrituras OK en 60 s, dos 429 con `Retry-After` de 10 y 6 s: «Quota exceeded for quota metric 'Write requests' and limit 'Write requests per minute' of service 'sheets.googleapis.com'…» y después «Google Sheets is temporarily rate limited. Retry later.». El texto **no** dice «per user»; por la clasificación de §16.25.6 corresponde a cuota **de proyecto** (**[INFERENCIA]**: compartida con todo lo que Grid envía a Sheets). **El mensaje incluye el número de proyecto de Google Cloud: redactarlo siempre** (§16.24.4 regla 8).
2. **Limitador propio de Grid.** Cuerpo «Too many requests. Try again in Ns.» **con cabecera `Retry-After`** y cuenta regresiva exacta. Episodios: bloqueo de **13 s** (14 escrituras + 36 lecturas en los 60 s previos), de **16 s** (33 escrituras seguidas sin pausa en ~23 s) y de **41 s** (58 lecturas seguidas en ~18 s). Durante el bloqueo, **lecturas y escrituras recibieron 429 por igual** hasta que expiró. No hay un umbral simple.

Diferencia con §16.24.2: allí el proxy de Sheets no devolvía `Retry-After`; en los endpoints de utilities **sí**. No se midió si el proxy de Sheets comparte este limitador. Política vigente: respetar `Retry-After` (cabecera) cuando esté presente; la escalera 4 → 8 → 16 → 30 s de §16.25.6 queda como respaldo.

Implicación práctica: cada registro es una escritura (~0,6 s) sin lote, y unas 50 peticiones por minuto bastaron para dispararlo.

### 16.26.7 Autorización por fila y confidencialidad: lo que existe y lo que no

- **[OPENAPI]** El proxy de Sheets solo acepta `doc_id` y `range` (`GET`); las operaciones de lote son `{op, range, values}`. No hay parámetro de filtro ni de identidad. `sheets/search` está retirado. Coincide con §16.22.4: la visibilidad por fila es «una regla de aplicación, no un ACL row-level del proxy de Sheets».
- **[RUNTIME, §16.17]** Las capacidades se interpretan por endpoint, no por el nombre del rol: un viewer real pudo hacer `PATCH` sobre Named State y adquirir locks.
- **[OPENAPI + RUNTIME]** Los filtros de `records/search` filtran en el servidor, **pero los envía el cliente**: un usuario puede mandar otro filtro. **Sirven para eficiencia, no como autorización.**
- **[OPENAPI]** La autorización existente es **por documento** (`/documents/{id}/permissions`, `share`, `groups`, `workspaces`, `security/privatize`) y **por par (documento, hoja) con capacidad `read_only`/`read_write`** (§16.25.1), nunca por usuario ni por fila.
- **[INFERENCIA, no probada]** Si una app lee rangos completos y filtra por sitio/rol en el HTML, cualquier usuario con acceso al documento puede pedir esos rangos directamente; si la app escribe desde el navegador, el par necesita `read_write` y el mismo usuario podría escribir fuera de la UI (§16.25.5 ya advierte que un viewer hereda lo que registre el documento). **Prueba recomendada, solo lectura:** con una cuenta de bajo privilegio, pedir por `fetch` el rango de usuarios/roles desde el documento de la app.
- **Opciones con aislamiento real**, de menor a mayor cambio: (1) pestañas derivadas por audiencia (`QUERY`/`FILTER`) en documentos distintos, cada uno compartido solo con esa audiencia; (2) un documento por audiencia con capacidad mínima (`read_only` para lectura, bandeja de solicitudes aparte, hoja de usuarios solo para administradores); (3) usar los grupos/permisos de Grid como fuente de verdad del acceso (alta en el grupo al aceptar); (4) solicitar a la plataforma un filtro por filas atado a la identidad del llamante (no existe hoy).
- **No usar** un gate en el HTML (`estatus_app`, `rol_app`) ni los filtros de `records/search` como control de seguridad de datos confidenciales (§16.22.5 ya excluye el patrón de adjuntos públicos para confidencialidad por fila).
- **Abierto:** si los endpoints de registros de una mini-app respetan roles viewer/editor distintos al proxy (existe `utility-editor-sharing`). No probado; requiere dos cuentas.

### 16.26.8 Evaluación de apps existentes (revisión de código, sin prueba runtime)

**Captura de Auditoría XMT1** (escaneo continuo con lector de mano). Patrón observado: cola local por dispositivo (IndexedDB), sincronización cada 10 registros o 5 s con un `GET`+`PUT` por *shard* diario de Named State (registro de shards, circuito de 60 s, respaldo en CSV como documento de Grid por lotes de 50-100), bitácora de HV Inbound con `append` de hasta 50 filas y máximo 19 por minuto por dispositivo, comprobación de `uid` antes y relectura después (nunca reintento a ciegas), fotos como documentos de Grid (solo el `doc_id` en la hoja), `dedupe_key` solo como metadato, freno global ante 429 con `Retry-After`. **Decisión: no migrar a mini-apps.** Las colecciones no tienen lote (1 escritura por registro), no hay clave idempotente en `create` ni restricción de unicidad, el `if_version` no es atómico, los catálogos son hojas externas y la hoja de bitácora la consumen otros. **Riesgo a medir (no medido):** el tope de 19/min es por dispositivo, pero la skill documenta 20 escrituras/min **por documento**; varios dispositivos podrían sumar más.

**Obsidian Access Management.** Fuente de datos: respuestas de un formulario de Google, hoja de validaciones y un libro administrativo (Usuarios, Meta, Sitios, Áreas, Accesos_Estado) compartido con la app de guardias. El *gate* (`estatus_app`, `rol_app`) y la visibilidad por sitio/área (`visibleParaMi`) se evalúan en el navegador tras leer rangos completos por el proxy; la app escribe en esas hojas desde el navegador (`PUT`/`append`). Es el caso de §16.26.7. **Decisión del equipo: no migrar por estabilidad.** Mini-apps no resuelven el filtrado por fila (filtro controlado por el cliente) y fragmentarían la fuente de verdad.

### 16.26.9 Actualizaciones a secciones previas

| Sección previa | Estado previo | Estado actualizado (V24.11) |
|---|---|---|
| §16.25.3 totales OpenAPI | 216 / 268 / 231 | **229 / 286 / 259** (2026-10-29) |
| §16.25.3 «bajas relevantes» | Sin purga/borrado de versiones | **Añadir** `DELETE …/versions` y `DELETE …/versions/{version}` |
| §16.25.3 `oauth/status` | `{connected, google_email, scopes, expires_in_seconds}` | **Añade `requires_reconnect`**; `connected=true` no basta para crear mini-apps (§16.26.3) |
| §16.25.4 / skill: URL de conexión | `grid.melioffice.com/google/oauth/start` | El 403 de utilities remite a `grid.melisystems.com/api/v1/google/oauth/start`; no diagnosticado |
| §16.24.2 429 del proxy sin `Retry-After` | Sin cabeceras de tasa | En **utilities** hay `Retry-After` y dos capas (Google + Grid); no medido para el proxy de Sheets |
| §16.24.4 regla 5 / §16.25.6 escalera | Cooldown fijo/escalonado | Con `Retry-After` presente, **usarlo primero**; la escalera es respaldo |
| §16.14 pregunta del 429 «proyecto vs usuario» | Abierta | Texto de Google sin «per user» → cuota de proyecto (**[INFERENCIA]**) |
| §16.17 ACL por endpoint | Viewer puede `PATCH` Named State | Se suma el modelo del proxy: capacidad por par, sin filtro por fila (§16.26.7) |
| §4.1 Dataset (snapshot store) y §15 Named State (coordinación) | No había almacén por filas con versión y filtros del lado del servidor | **Colecciones de mini-apps**: almacén por filas con `if_version`, filtros y paginación, respaldado en Sheets; sin lote ni CAS |

### 16.26.10 Open questions V24.12+

- ¿Los endpoints de registros respetan viewer/editor distinto del proxy? (dos cuentas; `utility-editor-sharing`).
- ¿Un gestor sin privilegios puede leer o escribir los rangos de Usuarios/Solicitudes en apps cuyo gate vive en el HTML? (prueba de lectura primero).
- ¿`PATCH` de registro hace merge o reemplaza `data`? ¿Funciona el `if_version` obsoleto limpio en registros?
- Formato interno de las pestañas `__grid_utility`, `__grid_collections` y de colección; ¿existe historial de ediciones de registros?
- ¿Los registros aceptan un `_id` provisto por el cliente (idempotencia)? ¿Hay unicidad por campo?
- Tamaño de página por defecto de `GET records` y límite real por encima de 200 registros (se probó solo con 25).
- ¿El limitador propio de Grid (13-41 s) aplica también al proxy de Sheets? ¿Cuál es el techo de escrituras por documento por minuto en el `append` real?
- ¿Sigue operando `Grid.query(sql)` (BigQuery en vivo, `SELECT`/`WITH`, 10.000 filas, 1 GB, 30 s, según la skill) tras el retiro de `grid_sql`? El contrato no expone ruta SQL.
- Causa de que `grid.melisystems.com` no cargara y relación con `grid.melioffice.com` / `grid.adminml.com`.
- Por qué la reconexión pide el scope `drive` completo.
- ¿Cómo se comporta un documento de mini-app borrado: queda el Sheet en el Drive del dueño? (el borrado de documentos es lógico).

### 16.26.11 Evidencia que debe conservarse

- `grid_openapi_probe_20261029_172541.json` (probe `grid_openapi_probe_v1`, con huellas por operación y por schema) como **baseline** de futuros diffs, porque el inventario del 2026-10-15 no se guardó.
- `grid_utilities_probe_20261029_175048.json` (preflight OAuth, `/me` por forma, 403) y `grid_utilities_probe_20261029_180317.json` (corrida completa, probe `grid_utilities_probe_v1`). **El segundo contiene el número de proyecto de Google Cloud dentro de un mensaje de error: redactarlo antes de compartirlo.** El probe actual ya lo oculta.
- **Veredictos invalidados** de esa corrida: `patch_stale` (rojo) fue un falso positivo porque el `PATCH` previo recibió tres 429 y la «versión obsoleta» era la vigente; `sheet_backed` quedó en *info* porque el probe leyó la pestaña equivocada (`Hoja 1`). Defectos corregidos en el probe: reintento ignoraba `Retry-After`, lectura sin nombre de pestaña, y mensajes de error sin redactar proyecto.
- Documentos y hojas creados por el probe (documento `zz_probe_utilities_*`) deben eliminarse; el borrado de documentos es lógico y el Sheet vinculado podría permanecer en el Drive del dueño.
- Los HTML de las apps revisadas (§16.26.8) no se anexan a la evidencia.


## 16.27 V24.12: Data Platform Engine (DPE) desde Grid, proxy `/api/v1/dpe`, proyecto de facturación y «doble puerta» de las mini-apps (corte 2026-10-29)

> Nota de privacidad (§15.1): se omiten `doc_id`, LDAP/usernames, el número del proyecto de facturación del usuario (el ID del proyecto de reporting se registra en §16.30 desde V24.15), el rol de acceso y las URL de solicitud de Shield. Los mensajes de error de DPE traen identificadores de ejecución de QueryBuilder con el LDAP como prefijo y nombres de host internos: redactarlos siempre (regla 84).

Fuentes de esta ronda: documentación técnica de DPE (HTML de Grid, actualizada 2026-10-28, «versión 8»), la página «DPE and connected Grid dashboards», el paquete `data-dash-creator` 1.0.11 (revisión de código, sin ejecutarlo) y cinco corridas de probes en `grid.adminml.com` (ver §16.27.12). Etiquetas: **[DOC]** = documentación, **[SKILL]** = código o texto de la skill, **[RUNTIME]** = observado.

### 16.27.1 Veredictos

- **CLOSE_VERDICT: `GRID_HTML_CAN_QUERY_BIGQUERY_THROUGH_DPE_PROXY_CONFIRMED`** **[RUNTIME]**. Un documento de Grid ejecutó `SELECT` de BigQuery por `POST /api/v1/dpe/sources/bigquery/{proyecto}/query` con la cookie de sesión, sin tokens ni cabeceras de identidad.
- **CLOSE_VERDICT: `DPE_PROXY_EXPOSES_ONLY_QUERY_ROUTES_IN_TESTED_SCOPE`** **[RUNTIME]**. `GET /api/v1/dpe/sources`, `…/sources/bigquery` y `…/discovery/datasets` devolvieron 404 en tres corridas.
- **CLOSE_VERDICT: `DPE_PROXY_ABSENT_FROM_OPENAPI`** **[OPENAPI]**. El contrato del 2026-10-29 no contiene ninguna ruta con «dpe»: es otra ruta no documentada, como `Grid.query`.
- **CLOSE_VERDICT: `REPORTING_BILLING_PROJECT_USABLE_BY_TESTED_USER`** **[RUNTIME]**. El usuario probado ejecutó con el proyecto de reporting y con `meli-bi-data`, con latencias equivalentes. No se probó si sus lectores tienen el mismo acceso. El ID del proyecto está en §16.30.1.
- **CLOSE_VERDICT: `EMBEDDED_SNAPSHOTS_BYPASS_SOURCE_ACL_FOR_VIEWERS`** **[SKILL]**. La skill incrusta datos reales de la consulta del autor y afirma que los lectores «solo snapshot» no necesitan permiso en la fuente. No se probó en runtime.

### 16.27.2 Qué es DPE (según su documentación) **[DOC]**

- Gateway de datos en Go (Fury PaaS) entre consumidores (HTML de Grid, agentes, clientes corporativos) y Looker, QueryBuilder (MySQL y BigQuery) y Tableau Cloud. **No guarda el HTML ni un catálogo de dashboards**: el artefacto y sus visuales son del consumidor.
- Identidad, por orden: Tiger JWT (`X-Tiger-Token`), cookie `session_id` resuelta por Odin, o `X-Api-Source: office` + `X-Fury-User` inyectados por Tengine. Un Tiger JWT inválido se rechaza sin respaldo. `X-Grid-User` no es identidad.
- Autorización por fuente: Looker por suplantación (token del lector; respeta RLS de Looker), QueryBuilder por reenvío de la credencial del lector (la ACL la aplica QueryBuilder, descrita a nivel de esquema), Tableau por Direct Trust con el email del lector.
- Caché por usuario (clave con LDAP): tokens 55 min, descubrimiento 1 h, resultados con `cache_ttl`; `singleflight` por usuario. Límites documentados: Looker 50 rps y circuito tras 5 errores 5xx; Tableau 200 simultáneas por sitio y 12 por lector.
- Auditoría a BigQuery (`BT_DPE_EVENT`) con `client_component_id`, `client_view_id`, `client_element_id`, `auth_method`, `resolution_type` (`fresh`, `dpe_cache`, `dpe_singleflight`…).
- La página «DPE and connected Grid dashboards» añade: Data Dash Creator genera y actualiza el documento de Grid tras confirmación; la fuente aplica sus permisos al lector; compartir el enlace del documento no confiere los permisos de datos del autor.

### 16.27.3 Cómo llega un HTML de Grid a DPE **[SKILL + RUNTIME]**

- **Contrato de producción:** `var GATEWAY_URL = ""` y `LOCAL_TOKEN = ""`; cada `query_url` es una ruta relativa `/api/v1/dpe/sources/{tecnología}/{fuente}/query` (o `/query/paged` y `/query/page`); todas las llamadas con `credentials: 'include'`. Grid reenvía a DPE con la sesión del usuario. El HTML **no** envía `X-DPE-*`, `X-Tiger-Token` ni `X-Grid-User` (el proxy inyecta lo necesario). El orden correcto es `/api/v1/dpe/…`; `/api/dpe/v1/…` devuelve 404.
- **Lista de permitidos del runtime** (`safeQueryUrl`): solo rutas `query`, `query/paged`, `query/page` y la vista previa `sql` de Looker; sin URL absolutas ni segmentos `.`/`..`. **Es una defensa del cliente**: un usuario puede llamar al proxy directamente sin pasar por ella.
- **Dominios:** el host directo de DPE (`data-platform-engine.melioffice.com`) solo se usa en la vista previa local con token. La skill prohíbe `melisystems.com` como `GATEWAY_URL`. En el 502 observado, DPE hablaba con QueryBuilder en `query-builder.melisystems.com` por `http` (red interna); y el `oauth_url` de §16.26.3 también apunta a `melisystems.com`.
- **Snapshots incrustados:** el HTML lleva `QUERY_SNAPSHOTS` obtenidos con el token del autor en la construcción (un valor por KPI, 100 filas por gráfico, 50 por tabla y la primera página de las paginadas). Sin token (`fury` ausente) se genera sin snapshots y los datos se cargan al abrir.
- **Reglas del runtime v1.8.1:** concurrencia máxima 4, autorrefresco ≥ 15 min, `force_refresh` no aplica a `/paged`, estado de filtros solo local, la insignia de frescura se vuelve ámbar al superar el `cache_ttl` del visual. El runtime trata `json.error` como fallo aunque el HTTP sea 200.
- **Publicación:** `POST /api/v1/engine/run` (multipart con `config` y el archivo; `visibility: "private"`; `skill_version` exigido, 426 `skill_version_outdated` si caduca) y verificación posterior descargando lo almacenado. Los permisos, migraciones y retiros exigen confirmación explícita.
- **Entorno de la skill:** plugin de agente local (Claude Code o Codex): exige Bash, Python, la CLI `fury`, el plugin `fury-services` y un servidor MCP interno. No corre en claude.ai ni en una VM sin los scripts; en ese caso la skill ofrece generar el HTML a mano sin snapshots.

### 16.27.4 Evidencia runtime del proxy (grid.adminml.com, 2026-10-29) **[RUNTIME]**

Probes `grid_dpe_proxy_probe_v1` (4 corridas) y `grid_dpe_reporting_probe_v1` (1 corrida), siempre con la cookie de sesión y rutas relativas.

| Prueba | Resultado |
|---|---|
| Catálogo/descubrimiento por el proxy (3 rutas) | 404 en todas las corridas |
| `SELECT 1` sin `billing_project` (primera corrida) | **502 tras 11,7 s**: DPE no obtuvo la primera página de resultados de QueryBuilder («context deadline exceeded … awaiting headers»); cuerpo con `cached`, `data:null`, `error`, `error_code`, `fields:null` |
| `billing_project` = número de proyecto | **422** `billing_project must be a valid GCP project id` en 113 ms |
| `SELECT 1` con `billing_project` = ID válido | 200 en 2,0 a 2,1 s (una vez 4,0 s en frío) |
| Repetición idéntica (`cache_ttl: 60`) | 110-113 ms, `cached=true` |
| `force_refresh: true` | ~2,0 s, `cached=false` |
| 5 idénticas simultáneas (`cache_ttl: 0`) | 5 × 200, 1.970-2.041 ms (no distingue `singleflight` de ejecuciones paralelas) |
| SQL que no empieza con `SELECT`/`WITH` | **422** `client_sql_rejected`: «SQL rejected by DPE read-only validation (bigquery)…» |
| Dos sentencias | **422** `client_sql_rejected`: solo una sentencia; `;` solo al final |
| `POST …/query/paged` | 200 en ~2,0-2,2 s; claves `backend_latency_ms`, `data`, `exec_id`, `fields`, `has_more`, `page`, `page_size`, `stmt_id` |
| `GET …/query/page?exec_id&stmt_id&page&page_size` | 200 en 175 ms; claves `data`, `fields`, `has_more`, `page`, `page_size` |
| Consulta propia (1 fila, 4 columnas) | 200 en ~4,0 s con ambos proyectos de facturación |

- **Forma de la respuesta:** `{cached, data, fields}` (y `error`, `error_code` en fallos); **no** trae `total` ni `error` vacío como documenta DPE. Las claves de columna llevan prefijo de posición (`1_COLUMNA`); el runtime las normaliza.
- **Código de SQL rechazado:** 422 con `error_code: client_sql_rejected`; la documentación de DPE da ejemplos de 400.
- **Cabecera de trazabilidad:** el proxy devuelve `x-request-id` en cada respuesta; es el dato a entregar al equipo de DPE.
- **El 502 fue transitorio** (**[INFERENCIA]**: corridas posteriores con el mismo proyecto efectivo respondieron en ~2 s). El mensaje de error incluía los ids de ejecución de QueryBuilder con el LDAP como prefijo y la URL interna.

### 16.27.5 Proyecto de datos y proyecto de facturación

- **[DOC + SKILL]** El **proyecto de datos** va en la URL (`/sources/bigquery/{proyecto de datos}/query`, por defecto `meli-bi-data`) y es el dueño de las tablas; el **proyecto de facturación** va en el cuerpo (`billing_project`) y es donde corre el trabajo, se consume cómputo y se aplican cuotas. Son independientes.
- Se necesitan dos permisos distintos: leer las tablas (proyecto de datos) y crear trabajos de BigQuery (proyecto de facturación). Sin `billing_project`, QueryBuilder usa `meli-bi-data` por defecto.
- **[SKILL]** Para dashboards la skill exige `billing_project` en cada consulta de BigQuery y recomienda un proyecto de reporting dedicado, con slots reservados, porque los slots de `meli-bi-data` llevarían reduciéndose desde abril de 2026. Requiere un rol de ejecución que se tramita en Shield; la skill dice que lo necesitan el autor y los lectores que usen Refresh (porque DPE ejecuta con la identidad del lector), no los que ven solo el snapshot.
- **[RUNTIME]** El `billing_project` debe ser el **ID** del proyecto (6 a 30 caracteres: minúsculas, dígitos y guiones; empieza con letra y no termina en guion), **no** el número. La cuenta de Google conectada a Grid **no** permite derivarlo: sus scopes (§16.26.3) no incluyen ninguno de Google Cloud, y BigQuery no usa esa conexión (DPE reenvía Tiger/Odin a QueryBuilder).
- **[RUNTIME]** Comparación (3 repeticiones por proyecto, consultas frescas): `SELECT 1` mediana 2.024 ms con reporting frente a 1.959 ms con `meli-bi-data` (razón 1,03×); consulta propia 4.003 frente a 3.976 ms. Diferencia no apreciable con carga ligera; la contención de slots, de existir, aparecería con carga alta (no probada).
- **Decisión vigente:** no hace falta crear un proyecto; se usa el de reporting existente más el rol. Para pruebas personales sirve `meli-bi-data`.

### 16.27.6 Seguridad y confidencialidad con DPE

- **Qué sí protege DPE [DOC]:** en consultas en vivo cada lector ejecuta con su identidad y la fuente decide qué ve; el autor no puede transferir sus permisos de datos al compartir un enlace.
- **Qué no protege:** (1) los **snapshots incrustados** quedan en el HTML y los ve cualquier lector del documento aunque no tenga acceso a la fuente (**[SKILL]**; contradice la lectura simple de «Grid access alone never grants access»: vale para el refresco, no para lo incrustado); (2) el **SQL y el `query-spec`** son visibles y modificables por el lector; la lista de rutas del runtime es del cliente; (3) un filtro en el `WHERE` **no es autorización**. La autorización por fila debe vivir en la fuente (Looker con filtros de acceso, políticas de fila o vistas autorizadas en BigQuery); el alcance de la ACL de QueryBuilder (esquema frente a fila) no está documentado.
- **Prueba pendiente:** la misma consulta con dos usuarios de distinto permiso sobre la tabla; si el conteo de filas cambia, filtra la fuente.
- **Aplicación a apps existentes [INFERENCIA]:** DPE no lee Sheets y es de solo lectura; para Access Management solo serviría una vista de consulta si esos datos llegaran a BigQuery. Los dashboards de auditoría XMT1 podrían leer de BigQuery por DPE (sin cuota de Sheets) únicamente si los datos de `AUDIT_SHIPMENTS` existieran allí; no se verificó.

### 16.27.7 Diferencias entre la documentación de DPE y el runtime observado

| Tema | Documentación | Observado |
|---|---|---|
| Rechazo de SQL | Ejemplos con 400 | **422** `client_sql_rejected` |
| Respuesta unificada | `{data, fields, cached, error, total}` | `{cached, data, fields}` (+ `error`, `error_code` en fallos) |
| Descubrimiento (`/v1/sources/…/discovery/…`) | Disponible en DPE | **404** por el proxy de Grid |
| `X-DPE-Client-*` | Cabeceras de auditoría del consumidor | El HTML de producción no las envía; las inyecta el proxy (no verificable desde el cliente) |
| Host de DPE | `localhost:8765` en los ejemplos | Producción accesible solo por `/api/v1/dpe` (mismo origen); host directo solo en vista previa local |

### 16.27.8 Mini-apps: el Sheet de almacenamiento también es alcanzable por el proxy de Sheets **[RUNTIME]**

- En la corrida completa de mini-apps, con el `doc_id` de la mini-app y el `sheet_id` de su `storage`, `GET /api/v1/sheets/{sheet_id}/metadata?doc_id=…` devolvió 200 con las pestañas, y `GET /api/v1/sheets/{sheet_id}?doc_id=…&range=…` devolvió 200, **sin haber llamado a `PUT …/link`**. El usuario era el dueño del documento.
- **Se desconoce:** si fue por ser dueño o porque la mini-app registra el vínculo sola; con qué capacidad (`read_only`/`read_write`); si un viewer puede leer o escribir por esa puerta; y si una fila escrita por el proxy en la pestaña de una colección rompe o es ignorada por la API de colecciones.
- **Implicación [INFERENCIA]:** la API de colecciones (validación estricta, `if_version`) no sería la única puerta a los datos. Los dos probes de §16.27.12 (propietario y segunda cuenta) cierran esta pregunta.
- Los endpoints de escritura del proxy son `POST /sheets/{id}/append`, `PUT /sheets/{id}`, `POST /sheets/{id}/batch` y `DELETE /sheets/{id}/values`, todos con `doc_id` como parámetro de consulta.

### 16.27.9 Endpoints candidatos a probar (pendientes; ninguno de estos grupos de rutas se había probado antes)

| Prioridad | Qué probar | Pregunta que responde | Riesgo |
|---|---|---|---|
| 1 | `PUT /sheets/{id}/link` con `read_only` y escrituras como owner y viewer | Si `read_only` bloquea de verdad (abierta en §16.25.8) | Hoja de prueba |
| 2 | `GET/PUT /documents/{id}/permissions`, `groups`, `share` | Roles disponibles; grupos de Grid como fuente de verdad del acceso | Lectura; escrituras en documento de prueba |
| 3 | `sections/{name}/editors`, `…/content` | Control de acceso por subrecurso; ¿restringe lectura? | Documento de prueba |
| 4 | `security/privatize` y `security/documents/{id}/content` | Si un documento privado cambia lo que un viewer lee por Sheets y State | Documento de prueba |
| 5 | `Grid.query("SELECT 1")` y su ruta real (`performance.getEntriesByType`) | Si sigue vivo; qué ruta usa | Solo lectura |
| 6 | `workflow/*` y `reviews/*` | Flujo de aprobación con revisor registrado en servidor | Lectura, luego documento de prueba |
| 7 | Permisos de registros de mini-apps (viewer frente a editor) y `utility-editor-sharing` | Si respetan roles mejor que el proxy | Dos cuentas |
| 8 | `POST /documents/{id}/datasets/{name}/data` | ACL y formato (abierta en §16.14) | Documento de prueba |
| 9 | `views`, `views/audience`, `GET /tokens` (solo listar) | Quién abrió qué; tokens de API existentes | Solo lectura |
| 10 | `POST /api/v2/documents/names`, `GET /api/v2/documents` | Resolver nombres en lote | Solo lectura |

Opcionales: `notifications/send`, `templates/*`, `google/drive/files/upload`. **No probar en producción:** `internal/*`, `worker/*`, `slack/*`, `admin/users/{id}/transfer-all-ownership`, `shield/tickets/ownership-transfer`, `transfer-ownership` y `DELETE /google/oauth`.

### 16.27.10 Actualizaciones a secciones previas

| Sección previa | Estado previo | Estado actualizado (V24.12) |
|---|---|---|
| §16.26.7 / §16.26.2 «no hay ruta SQL» | El contrato no expone SQL | Cierto para el OpenAPI, pero **existe SQL de BigQuery de solo lectura por `/api/v1/dpe`** (ruta no documentada). `Grid.query` sigue sin comprobarse |
| §16.1 / §16.13 retiro de `grid_sql` | Sin sustituto de SQL en vivo | DPE+QueryBuilder es el sustituto de lectura en vivo, con identidad del lector |
| §16.26.10 «¿Sigue operando `Grid.query`?» | Abierta | Sigue abierta; el camino de SQL en vivo comprobado es DPE |
| §16.26.4 almacenamiento de mini-apps | Solo API de colecciones | Añadir la «doble puerta» de §16.27.8 (pendiente de confirmar) |
| §16.25.6 / §16.26.6 retrys ante 429 | Escalera y `Retry-After` | Para DPE: reintento único ante 502/503/504 y `x-request-id`; DPE rechaza SQL con 422 |
| §16.18 CSP / `connect-src` | Hosts externos limitados | Un documento de Grid no necesita llamar a DPE de forma directa: usa el proxy del mismo origen |
| §16.22.4 / §16.26.7 sin ACL por fila en el proxy de Sheets | Aplica a Sheets | Con DPE la autorización puede estar en la fuente, pero no está probada; los snapshots incrustados la anulan |
| §16.26.8 evaluación de apps | Solo Sheets/State | Añadir la opción DPE solo si los datos existen en BigQuery |

### 16.27.11 Open questions V24.13+

- ¿Un usuario con otros permisos obtiene un conteo de filas distinto con la misma consulta? (autorización por fila en BigQuery/QueryBuilder).
- ¿Cuántos lectores de un dashboard necesitan el rol de ejecución en el proyecto de reporting y cómo se tramita en grupo?
- ¿`singleflight` agrupa ejecuciones simultáneas del mismo usuario? (usar `backend_latency_ms` y `resolution_type` en `BT_DPE_EVENT`).
- ¿Qué límites aplica el proxy `/api/v1/dpe` por usuario o documento, y comparte limitador con Sheets?
- ¿Por qué el proxy no expone el descubrimiento? ¿Existe otra ruta?
- ¿Qué cabeceras `X-DPE-Client-*` inyecta el proxy? (verificar en `BT_DPE_EVENT` con el `x-request-id`).
- Causa del 502 por tiempo de espera de la primera página de resultados.
- ¿Los lectores «solo snapshot» ven realmente los datos del autor? (prueba con un usuario sin acceso a la fuente).
- Mini-apps: lectura y escritura del viewer por la «doble puerta», capacidad del vínculo automático y efecto de escribir directo en una pestaña de colección (§16.27.8).
- Mini-apps: roles de viewer y editor en la API de colecciones y efecto de `utility-editor-sharing`.

### 16.27.12 Evidencia que debe conservarse

- `grid_dpe_proxy_20261029_212420.json` (502; **contiene identificadores de ejecución con el LDAP en el texto de error: redactar antes de compartir**), `…_212850.json` (422 por número de proyecto), `…_213143.json` y `…_213531.json` (corridas completas correctas) y `grid_dpe_reporting_20261029_214339.json` (comparación de proyectos). Los probes: `grid_dpe_proxy_probe.html` y `grid_dpe_reporting_probe.html` (v1).
- Obsoletos (apuntaban a un host externo de DPE en lugar del proxy de Grid): `grid_dpe_probe.html` y `grid_dpe_config_probe.html`.
- Paquete revisado: `data-dash-creator` 1.0.11 (plugin de agente local; MIT) y la documentación de DPE (HTML de Grid). No se anexan a la evidencia.
- Probes de mini-apps para la «doble puerta» y los permisos: `grid_utilities_owner_probe.html` y `grid_utilities_viewer_probe.html` (v2); sus JSON se añadirán en la siguiente versión.


## 16.28 V24.13: mini-apps con varios usuarios: Google propio por usuario, roles, id del documento y almacén (corte 2026-10-30)

> Nota de privacidad (§15.1): se omiten `doc_id`, `sheet_id`, LDAP/usernames, correos y huellas de usuario. En los mensajes de error el nombre de usuario se sustituye por `<usuario>`. Las huellas (`sha12`) se usaron para comparar identificadores sin exponerlos.

Fuentes: el probe unificado de un solo HTML (`grid_utilities_probe_v3`, compilaciones v3.3 a v3.10) ejecutado como dueño y como visitante en `grid.adminml.com`, con tres cuentas no dueñas en estados distintos de Google. Etiquetas: **[RUNTIME]** observado, **[INFERENCIA]** deducido, **[PENDIENTE]** sin probar.

### 16.28.1 Veredictos

- **CLOSE_VERDICT: `MINIAPP_API_REQUIRES_PER_USER_GOOGLE_LINK_NO_OWNER_TOKEN_FALLBACK`** **[RUNTIME]**. Un viewer **sin ninguna cuenta de Google vinculada** recibió 403 «No Google account linked for user '<usuario>'. Connect Google via /google/oauth/start and retry.» en lecturas, búsqueda y escrituras de la API de colecciones, y en las lecturas por el proxy sobre el Sheet de la mini-app. **No hay respaldo con el token del dueño.**
- **CLOSE_VERDICT: `MINIAPP_HTML_MUST_READ_ITS_ID_FROM_URL`** **[RUNTIME]**. Dentro de una mini-app, `window.GRID.docId` apunta al documento que la creó; el id de la mini-app está en la ruta `/d/{id}/…`. Confirmado en tres mini-apps distintas (huellas distintas entre ambos ids).
- **CLOSE_VERDICT: `MINIAPP_VIEWER_WITH_VERIFIED_GOOGLE_READS_AND_CREATES_BUT_CANNOT_EDIT_OTHERS`** **[RUNTIME]**. Con Google verificado, un viewer lee colecciones, registros y búsqueda (200) y **crea** registros (201); un `PATCH` sobre un registro creado por el dueño dio 403 «You don't have write access to this document».
- **CLOSE_VERDICT: `MINIAPP_SHEET_READABLE_BY_VIEWER_VIA_SHEETS_PROXY_BUT_NOT_WRITABLE`** **[RUNTIME]**. Con Google verificado, el viewer leyó por el proxy la metadata, la pestaña de la colección (registros completos con `_meta`) y `__grid_utility` (con el LDAP del dueño); la escritura por el proxy se rechazó por permisos de documento. **[PRECISIÓN V24.16]:** este veredicto es del Sheet de una mini-app (otro endpoint que usa Sheets). **[OPERADOR]** informa que por el proxy de Sheets de un documento normal un viewer sí puede escribir (§16.31.2); no generalizar el veredicto de las mini-apps al proxy.
- **CLOSE_VERDICT: `NAMED_STATE_SHARED_PER_DOCUMENT_AND_VIEWER_CAN_WRITE`** **[RUNTIME]**. Un viewer lee el estado que escribió el dueño y escribe el suyo (200), con o sin Google.

### 16.28.2 Matriz de acceso observada (cuenta no dueña, dentro de la mini-app correcta)

| Estado de la cuenta | API de colecciones (lectura/escritura) | Proxy de Sheets sobre el Sheet de la mini-app | Estado con nombre | `storage` |
|---|---|---|---|---|
| Sin compartir | 403 «You do not have access to this resource» | 403 igual | 403 | 403 |
| Compartida, **sin Google** (`connected=false`) | **403 «No Google account linked…»** | lectura 403 «No Google account linked…»; escritura 403 permisos | 200 lectura y escritura | 403 |
| Compartida, **Google obsoleto** (`connected=true`, `requires_reconnect=true`, sin correo, 2 scopes) | **403 «Reconnect Google so Grid can verify the connected account.»** | lectura 403 igual; escritura: viewer 403 permisos, **editor 403 Google** | 200 | 403 |
| Compartida, **Google verificado** (`requires_reconnect=false`, correo presente, 5 scopes), viewer | lectura/búsqueda 200; **crear 201**; editar ajeno 403 | lectura 200 (incluye pestaña interna); escritura 403 permisos | 200 | 403 |
| Editor con Google verificado | **[PENDIENTE]** (indicios indirectos: un registro de prueba apareció borrado tras esa corrida) | [PENDIENTE] | 200 | [PENDIENTE] |

### 16.28.3 Orden de las comprobaciones y mensajes de error

- **API de colecciones:** primero Google (vinculación y verificación), después permisos. Por eso un viewer recibe el error de Google antes que el de permisos.
- **Proxy de Sheets, escrituras:** primero permisos de documento, después Google: el viewer recibe «You don't have write access to this document»; el editor (con Google obsoleto) recibe el error de Google, lo que prueba que ya superó el filtro de permisos.
- Tres mensajes distintos: sin acceso («You do not have access to this resource»), Google obsoleto («Reconnect Google so Grid can verify the connected account.») y sin Google («No Google account linked for user '<usuario>'. Connect Google via /google/oauth/start and retry.»). Este último indica la ruta relativa `/google/oauth/start`, distinta del `oauth_url` de §16.26.3.
- **[INFERENCIA]** El chequeo parece verificar la identidad de Google de quien llama más que usar su token para escribir: un viewer con Google verificado escribió en un Sheet que no es suyo, así que los datos se escriben con otra credencial. Ningún endpoint de las mini-apps expone parámetros de Google, token o «ejecutar como el dueño» (ver §16.28.8). **[V24.14] Confirmado:** el contrato describe `requires_reconnect` como la falta de «la identidad de Google o el permiso de Drive que exige el compartir de las mini-apps» y el usuario confirmó que compartir una mini-app comparte su hoja de Google (§16.29.1).

### 16.28.4 Id del documento y metadatos

- Dentro de una mini-app **`window.GRID.docId` ≠ id de la mini-app** (apunta al documento creador). El id correcto se lee de `location.pathname` (`/d/{id}/…`). Un ejemplo anterior de la Biblia/asistente que usaba `window.GRID.docId` como base de la API era incorrecto para mini-apps.
- La URL de visor es `…/d/{id}/view`; la página corre dentro de un iframe en `/d/{id}/raw`. `GET /d/{doc_id}/raw` devuelve el HTML guardado del documento (usado para clonar el HTML en la mini-app).
- Una mini-app es un documento de tipo `html` con título propio; `GET /api/v1/documents/{id}` devuelve `DocumentMetadata` (48 claves, incluidos `editors`, `shared_with`, `owner_id`, `visibility`). Para una cuenta sin acceso responde 403 con un `document` de vista previa (dueño, tipo, tamaño, visibilidad, fechas).
- Un viewer ve la lista `shared_with`; un editor puede leer `GET …/permissions` (200), el viewer no («Only the document owner or editors can manage permissions»).
- `POST /api/v1/utilities` aceptó un HTML de ~84 KB (tardó 4,5-5,6 s).

### 16.28.5 Almacén y semántica de la API (confirmaciones)

- **Formato [RUNTIME]:** cada colección es una pestaña de **una sola columna**; cada registro es un JSON en una celda con las claves `_id`, `_meta{created_at, created_by, criticality, updated_at, updated_by}`, `collection`, `data`, `doc_id` y `version`. `__grid_collections` guarda `{name | JSON de definición{fields}, status, version, created_*, updated_*}` y `__grid_utility` guarda `doc_id | owner_ldap`. Cada registro nuevo **inserta** una fila (la pestaña pasó de 1.000 a 1.003 filas). El Sheet no es una tabla legible por columnas.
- **`PATCH` hace merge**, `if_version` obsoleto devuelve 409, y el cliente **no puede fijar `_id`** (422 «Extra inputs are not permitted»). **`_meta.created_by` y `updated_by` coinciden con el usuario que escribió** (fijados por el servidor).
- **`utility-editor-sharing`** devuelve `{doc_id, enabled}`; siempre se observó `enabled=false` y los permisos no cambiaron. **[CORREGIDO V24.14, §16.29.2]:** el contrato la describe como operación **solo del dueño** que permite a los editores **compartir la hoja de Google** de la mini-app; no es un interruptor de acceso a la API de colecciones.
- **Escrituras crudas por el proxy (dueño):** una fila clonada y escrita en la pestaña de la colección **aparece en la API** (lista y búsqueda) **sin validación**; quien pueda escribir por el proxy puede, por tanto, falsificar `_meta.created_by`. Un viewer no puede escribir por el proxy.

### 16.28.6 Implicaciones para usuarios sin Google ni VPN

- La API de colecciones **no sirve** para usuarios que no puedan vincular y verificar su propia cuenta de Google. A diferencia del proxy de Sheets con par registrado (token del dueño, §16.7 y §16.25.5), aquí no hay respaldo con el token del dueño.
- Cuentas con una conexión **antigua** (2 scopes, sin correo) también deben reconectar una vez.
- **[ACTUALIZADO V24.14, §16.29.6] Evidencia sobre VPN:** sin VPN, `grid.adminml.com` responde y `grid.melioffice.com` y `grid.melisystems.com` no (8 s sin respuesta). Las rutas A y D dejan aceptar los permisos en Google, pero el regreso redirige a `melioffice` y falla; el estado siguió en `connected=false`. Rutas de entrada vistas: `grid.adminml.com/api/v1/google/oauth/start`, `grid.melioffice.com/google/oauth/start`, `grid.melisystems.com/api/v1/google/oauth/start` y `grid.adminml.com/google/oauth/start`.
- Alternativas: (1) vincular Google una vez bajo VPN y usar la app sin VPN (depende de cuánto dure la conexión); (2) mantener Sheets proxy + Named State para quienes escriben; (3) solicitar a Grid un modo de la API de colecciones con el token del dueño; (4) bandeja de entrada en Sheets que un dueño consolide en colecciones.

### 16.28.7 Qué permite hacer cada rol (con Google verificado)

| Acción | Viewer | Editor | Dueño |
|---|---|---|---|
| Leer colecciones, registros, búsqueda | Sí | [PENDIENTE] | Sí |
| Crear registros | **Sí** | [PENDIENTE] | Sí |
| Editar o borrar registros ajenos | **No** (403 permisos) | [PENDIENTE] (indicio: sí) | Sí |
| Editar o borrar sus propios registros | [PENDIENTE] (el probe v3.10 lo mide) | [PENDIENTE] | Sí |
| Leer el Sheet por el proxy (incluye pestaña interna con LDAP del dueño) | Sí | [PENDIENTE] | Sí |
| Escribir por el proxy | No | [PENDIENTE] | Sí |
| `storage` | No | No (con Google obsoleto) | Sí |
| Estado con nombre | Lee y escribe | Lee y escribe | Sí |
| `GET permissions` | No | Sí | Sí |

### 16.28.8 Lo que NO existe en el contrato

Los 15 endpoints de `utilities` no tienen parámetros ni campos de Google, token, cuenta de servicio ni «ejecutar como el dueño». Campos: `title/html/description` (crear), `fields/add_fields/field_statuses/if_version` (colecciones), `data/if_version` (registros), `criticality`, `status`, `version`. `storage` es solo `GET` y un `provision` sin parámetros, con propiedades cerradas. **[CORREGIDO V24.14]** `POST /documents/{id}/utility-editor-sharing` no es un interruptor de acceso: es solo del dueño y trata del compartir de la hoja en Google (§16.29.2). **Cambiar la exigencia de Google propio es decisión del backend de Grid.**

### 16.28.9 Actualizaciones a secciones previas

| Sección previa | Estado previo | Estado actualizado (V24.13) |
|---|---|---|
| §16.26.3 / §16.26.4 (Google) | Solo el dueño necesita Google | **Cada usuario** necesita su Google vinculado y verificado para la API de colecciones y las lecturas por el proxy sobre la mini-app |
| §16.27.8 «doble puerta» | Lectura probada solo como dueño | Un viewer con Google **lee** por el proxy (incluida la pestaña interna); **no escribe** |
| Regla 67 | La mini-app depende del Google del dueño | Depende del Google del dueño **y** del de cada usuario |
| Regla 88 | Hasta probar viewer y capacidad | Viewer con Google: lee por el proxy, no escribe |
| Ejemplo de código con `window.GRID.docId` | Presentado como válido | Incorrecto en mini-apps: usar el id de la URL |
| §16.26.7 sin ACL por fila | Aplica al proxy de Sheets | Se mantiene: todo viewer lee todo el Sheet y todos los registros |

### 16.28.10 Preguntas abiertas

> **[ACTUALIZADO V24.14]** Estado de cada una; la lista vigente está en §16.29.10.

- ¿Puede una cuenta **vincular Google sin VPN**? ¿Qué host del flujo la exige y cuánto dura la conexión? → evidencia parcial en §16.29.6: el sitio de retorno parece inalcanzable sin VPN; falta probar el reintento con VPN y la vía `Grid.fetch`.
- Editor con Google verificado: ¿lee, crea, edita y borra todo? ¿Puede escribir por el proxy? → **sigue pendiente.**
- Viewer con Google verificado: ¿edita o borra **sus propios** registros (el probe v3.10 lo mide)? → **sigue pendiente.**
- ¿Qué activa `utility-editor-sharing`? → **respondida** (§16.29.2): permite a los editores compartir la hoja de Google; solo la llama el dueño.
- ¿Qué significan los 3 valores de `criticality` y de `status` del almacenamiento? → valores conocidos (§16.29.4: `low|medium|high` y `provisioning|ready|failed`); el efecto de `criticality` sigue sin documentarse.
- ¿Las conexiones antiguas de todos los usuarios requerirán reconectar a la vez? → **sigue pendiente.**

### 16.28.11 Evidencia que debe conservarse y lecciones del método

- Conservar los JSON del dueño y del visitante de las corridas con cuenta sin Google (huella de cuenta distinta de la del dueño), con Google obsoleto, y con Google verificado como viewer; en cada JSON el campo `identifiers.doc_id_sha12` debe coincidir con el del dueño.
- **Lecciones:** (1) un probe dentro de una mini-app debe leer el id de la URL; (2) un 404 «Document … not found» puede ser del documento y no del registro; (3) la comparación 403/404 para inferir permisos solo vale si el error no es de Google; (4) cada actualización del documento original exige preparar una mini-app nueva, porque la copia interna se fija al crearla; (5) varias descargas con el mismo nombre confunden: verificar `mode`, `build` y `run_id` dentro del JSON.
- Obsoletos: `grid_utilities_owner_probe.html` y `grid_utilities_viewer_probe.html` (v2).


## 16.29 V24.14: OpenAPI completo con descripciones, SDK de Grid y alcance sin VPN (corte 2026-10-30)

> Nota de privacidad (§15.1): se omiten `doc_id`, `sheet_id`, LDAP/usernames, correos y huellas de usuario. Las huellas públicas de artefactos del propio servicio (OpenAPI, SDK, visor) sí se conservan para detectar cambios.

Fuentes: (1) volcado completo del OpenAPI en vivo, con el probe `grid_openapi_probe` v3 (compilación o3.0), y su lectura de `grid-sdk.js`, el visor y los servicios de salud; (2) el archivo `grid-sdk.js` subido completo; (3) `grid_google_connect_probe` (compilación g1.0) ejecutado sin VPN; (4) afirmaciones del usuario. Etiquetas: **[CONTRATO]** texto del OpenAPI, **[SDK]** comentarios y código del SDK, **[RUNTIME]** observado, **[USUARIO]** confirmado por el usuario sin JSON que lo respalde, **[INFERENCIA]**, **[PENDIENTE]**.

### 16.29.1 Veredictos

- **CLOSE_VERDICT: `MINIAPP_SHARING_SHARES_THE_BACKING_GOOGLE_SHEET_PER_USER_IDENTITY`** **[CONTRATO + USUARIO]**. El esquema de `GET /google/oauth/status` define `requires_reconnect` como «verdadero cuando las credenciales guardadas carecen de la identidad de Google o del permiso de Drive que exige el compartir de las mini-apps»; `utility-editor-sharing` permite a los editores compartir la hoja de Google que respalda la mini-app. El usuario confirmó que compartir una mini-app comparte su hoja en Google. Por eso Grid pide a **cada** usuario una cuenta de Google vinculada y verificada (los errores «No Google account linked…» y «Reconnect Google…» de §16.28.3): es parte del diseño, no una falla. No hay JSON con la lista de «Compartir» de la hoja en Drive.
- **CLOSE_VERDICT: `UTILITY_EDITOR_SHARING_IS_OWNER_ONLY_SHEET_SHARING_NOT_API_ACCESS`** **[CONTRATO]**. Ver §16.29.2.
- **CLOSE_VERDICT: `SDK_GRID_UTILITIES_IS_THE_CLIENT_API_OF_MINIAPPS`** **[SDK]**. Los artefactos de mini-app se suben con el `window.GRID` automático **desactivado**; `Grid.utilities` es la única vía de cliente para sus datos y exige `Grid.configure({docId})`. Ver §16.29.5.
- **CLOSE_VERDICT: `NO_UNDOCUMENTED_ROUTES_IN_SDK_OR_VIEWER`** **[RUNTIME, análisis estático]**. El visor usa 14 rutas `/api/…`, todas documentadas; el SDK usa 5 patrones, todos documentados salvo un falso positivo en un comentario. No aparece `/api/v1/dpe` ni otra ruta oculta en el front-end de Grid.
- **CLOSE_VERDICT: `OAUTH_RETURN_HOST_NOT_REACHABLE_WITHOUT_VPN`** **[RUNTIME + USUARIO]**. Ver §16.29.6. La atribución del rebote al alcance de red es **[INFERENCIA]**: la compilación g1.0 no registró qué se vio al volver.
- **CLOSE_VERDICT: `GRID_SKILL_ENDPOINT_DEPRECATED`** **[RUNTIME]**. `GET /skill` devuelve 410 («usa el marketplace de Fury para instalar el plugin de Grid»); `GET /skill/version` devuelve nombre `grid`, versión 3.6.11, una lista de 3 versiones válidas y la URL de documentación.

### 16.29.2 Ficha de `POST /documents/{doc_id}/utility-editor-sharing` [CONTRATO]

Etiqueta del contrato: `permissions`. Un solo parámetro (`doc_id`), respuesta 200 sin esquema declarado, 422 estándar y sin esquema de seguridad. Descripción literal:

> Owner only: allow Utility editors to share the backing Google Sheet. Uses the owner's own Google session. Editors cannot call it, and no other account's stored token is used, so the Sheet setting is changed only when the owner asks for it.

Lectura: es una acción **solo del dueño**, ejecutada con **su** sesión de Google, que habilita que los editores de la mini-app compartan la hoja de Google. **No** controla el acceso a la API de colecciones ni sustituye el Google propio de cada usuario. **[RUNTIME]** devuelve `{doc_id, enabled}` y siempre se vio `enabled=false`. **[INFERENCIA]** el valor refleja si los editores pueden compartir la hoja.

### 16.29.3 Semántica documentada de las mini-apps [CONTRATO]

| Operación | Descripción del contrato |
|---|---|
| `POST /utilities` | Crea un artefacto HTML de mini-app **privado**, con criticidad **LOW por defecto** |
| `GET /utilities/{id}/storage` | Devuelve el vínculo de la hoja **solo al dueño**; el esquema indica «sin credenciales OAuth» |
| `POST /utilities/{id}/storage/provision` | Reintenta el aprovisionamiento del dueño tras un fallo recuperable de Sheets |
| Colecciones | Crear (declarar esquema inicial), actualizar (añadir campos o activar/desactivar con bloqueo optimista), archivar (los registros se conservan pero quedan inaccesibles), restaurar (con bloqueo optimista), listar (activas; opcionalmente archivadas) y obtener (incluye campos deshabilitados) |
| Registros | Listar en orden de creación con paginación por cursor acotada; crear conforme al esquema; actualizar y borrar **con la versión observada** |
| Búsqueda | Filtros combinados con AND, validados contra el manifiesto (campos desconocidos y operadores incompatibles se rechazan). Por tipo: `string/select/text` → `eq, neq, in`; `number/date` → rangos y `between`; `boolean` → `eq, neq` |

El esquema `UtilitySheetLink` se describe como «registro de trazabilidad propiedad del servidor para una mini-app respaldada por Sheets».

### 16.29.4 Límites, enums y esquemas [CONTRATO]

| Elemento | Valor |
|---|---|
| HTML de la mini-app | 1 a 1.000.000 caracteres; título 1-255; descripción hasta 2.000 |
| Nombre de colección y de campo | `^[a-z][a-z0-9_]{0,63}$` (1-64) |
| `doc_id` y `record_id` | `^[0-9A-Za-z_-]{1,64}$` |
| Listado de registros | `limit` por defecto 50, mínimo 1, máximo 200; `cursor` hasta 512 caracteres |
| Búsqueda | de 1 a 5 filtros; `limit` por defecto 50, máximo 200 |
| Campo declarado | solo `type`, `required` (por defecto falso), `options` (hasta 200 cadenas) y `status`; no admite otras propiedades |
| `FieldType` | `string, text, number, boolean, date, select` |
| `FieldStatus` | `enabled, disabled` |
| `FilterOp` | `eq, neq, in, gt, gte, lt, lte, between` |
| `criticality` (utilidad y `_meta` de registro) | `low, medium, high`; la petición de creación no trae campo para elegirla |
| `UtilitySheetLink.status` | `provisioning, ready, failed` (por defecto `ready`) |
| `if_version` | mínimo 1; obligatorio en toda escritura de colecciones y registros |
| Sheets (`sheet_id`) | 20-256 caracteres, `^[A-Za-z0-9_-]+$`; `doc_id` del proxy hasta 40 caracteres |
| `SheetLinkRegistrationBody.capability` | `read_only, read_write` (por defecto `read_write`) |

### 16.29.5 SDK de Grid (`/d/_assets/grid-sdk.js`, 13.765 bytes) [SDK]

- `Grid.configure({baseUrl, docId})`: el `docId` es obligatorio antes de usar `Grid.sheets` o `Grid.utilities`.
- `Grid.sheets`: `get`, `set`, `append`, `clear`, `info`, `batch` (`op` = get, set, append o clear). «Los tokens OAuth nunca llegan al navegador»: Grid hace las llamadas a Sheets en el servidor **con el token almacenado del dueño del documento**.
- `Grid.utilities.collections` (`create`, `list`, `get`, `update`, `archive`, `restore`) y `Grid.utilities.records` (`create`, `list`, `get`, `update`, `delete`, `search`). `ifVersion` es obligatorio en todas las escrituras (no existe mezcla incondicional) y tras un 409 se debe releer antes de reintentar. Todas las promesas se rechazan con el JSON del error en respuestas no 2xx.
- Las mini-apps se suben con el `window.GRID` automático desactivado; por eso `Grid.utilities` es la única vía de cliente. Hay que incluir el script y configurar el id **desde la URL**:

```html
<script src="/d/_assets/grid-sdk.js"></script>
<script>
  var docId = location.pathname.match(/\/d\/([^\/]+)/)[1];
  Grid.configure({ docId: docId });
  Grid.utilities.records.list("tareas", { limit: 50 }).then(function (r) { /* r.records, r.cursor */ });
</script>
```

- `Grid.fetch(url, opts?)`: «reenvía una petición autenticada a una API interna de ML a través de Grid»; Grid inyecta `X-Caller-Id` y `x-caller-email` en el servidor; la URL debe ser `https` y de un **dominio ML/Fury permitido**; devuelve `{status, body}`. Usa `POST /api/v1/fetch`. **[PENDIENTE]** qué dominios internos acepta; los externos probados dieron 403 (§16.19).
- `Grid.dataset(name)`: `meta()`, `url()` y `load()`; si el navegador no alcanza el almacenamiento de objetos, `load()` recurre a la URL del proxy de Grid.
- Estado: `window.GRID.state` y `window.GRID.states` con `.get`, `.set` (reemplazo completo con bloqueo optimista `if_updated_at`) y `.patch` (mezcla por claves de primer nivel; `null` borra una clave). Se rechaza ante 409.
- **[INFERENCIA]** En nuestras corridas, dentro de una mini-app existía `window.GRID.docId` y apuntaba al documento creador (§16.28.4), aunque el SDK dice que el runtime automático está desactivado. La regla práctica no cambia: usar el id de la URL.

### 16.29.6 Conectar Google sin VPN [RUNTIME + USUARIO]

Prueba con `grid_google_connect_probe` g1.0 (VPN apagada, red de oficina, Chrome, cuenta sin Google vinculado; estado inicial `connected=false`):

| Sitio | Resultado desde el navegador |
|---|---|
| `grid.adminml.com` | alcanzable (~250 ms) |
| `grid.melioffice.com` | sin respuesta en 8 s |
| `grid.melisystems.com` | sin respuesta en 8 s |
| `login.adminml.com` | falla de red inmediata (~220 ms) |
| `accounts.google.com` | bloqueado por la política de contenido de Grid (no concluyente) |

- **Rutas B y C** (`melioffice`, `melisystems`) se marcaron «error de red». **Rutas A y D** (en `grid.adminml.com`) **dejan aceptar los permisos en Google, pero el regreso redirige a `melioffice` y rebota** **[USUARIO]**. Tras todas las rutas `oauth/status` siguió en `connected=false`.
- **[CONTRATO]** `GET /api/v1/google/oauth/start` «redirige a `GET /google/oauth/start`» (flujo de navegador con consentimiento y almacenamiento de tokens): A y D son el mismo flujo. El flujo oficial histórico usa `grid.melioffice.com/google/oauth/start` y guarda los tokens para el usuario de **ese** dominio (§16.25.4).
- **[INFERENCIA]** El sitio de retorno de OAuth (`melioffice`) no es alcanzable sin VPN, de modo que el código de autorización no llega a Grid. Arreglo de raíz: que Grid use `grid.adminml.com` como URL de retorno (hay que registrarla en el cliente OAuth y en la configuración de Grid). Se redactó una petición al equipo de Grid; no consta respuesta.
- **Alternativas [PENDIENTE]:** (1) reintentar la pestaña fallida con VPN activada (el probe g1.1 registra «qué pasó al volver» y «reintento con VPN»); (2) alta bajo VPN una sola vez, midiendo cuánto dura la conexión; (3) completar el regreso desde Grid con `Grid.fetch` si `melioffice` figura entre los dominios permitidos; (4) para usuarios que no puedan vincular Google, el patrón de proxy de Sheets con par registrado (token del dueño) y Named State.

### 16.29.7 Permisos, compartir, estado y otros textos del contrato [CONTRATO]

- **`POST /documents/{id}/share`** (dueño o editores): cambio incremental con `viewers`, `editors` y `revoke`; `viewers` **degrada** a un editor actual; `revoke` quita todo acceso; una persona no puede aparecer en más de un arreglo. Las entradas son **usernames LDAP o correos corporativos y el servidor expande cada uno a todos sus alias**: por eso `shared_with` muestra **dos entradas por persona** (correo y username) **[consistente con lo observado]**. Otros campos: `notify` (por defecto verdadero), `message`, `viewer_can_access_versions`. El contrato antiguo (`share_with` + `add_as_editors`) está obsoleto, solo añade acceso y no se puede mezclar con el nuevo.
- **`GET /documents/{id}/permissions`**: el contrato dice «dueño o super admin»; en runtime un **editor** recibió 200 y el mensaje de un viewer dijo «dueño o editores». **El texto del contrato y el comportamiento no coinciden.** `PUT …/permissions`: dueño, editores o super admin.
- **Estado:** `GET` devuelve `{"state": {}}` si no se ha escrito; `PUT`: «cualquiera con acceso de lectura puede escribir» (uso colaborativo), con `if_updated_at` para rechazar escritores obsoletos y **100 MB máximo por bucket**; `PATCH` mezcla claves y `null` borra. Coincide con el runtime (§16.28.1).
- **`PUT /views/audience`**: lista acotada (máx. 50), dueño o editores, reemplaza la lista. **`PUT /sections/{name}/editors`**: solo el dueño. **`POST /leave`**: libera el bloqueo de edición (el titular o el dueño).
- **Sheets proxy:** `PUT /sheets/{id}/link` «registra o **mejora**» una relación exacta confirmada por el dueño; `DELETE …/values` encola el borrado y responde 202; `batch` agrupa todos los `get` en un `batchGet` y todos los `set` en un `batchUpdate`, y ejecuta `append` y `clear` uno a uno.
- **Google:** `DELETE /google/oauth` revoca los tokens y borra las credenciales; la subida de PDF a Drive usa **siempre** el token del usuario autenticado y no lee ninguna cuenta de la petición. Regla general: las operaciones de Google usan el token almacenado de **quien llama**, salvo el proxy de Sheets (token del dueño del documento).
- **Datasets:** `POST …/datasets/{name}/data` sube y publica de forma atómica filas en JSON (≤ 10 MB por defecto; dueño o editores); la definición solo admite `source_type=external_push` y `refresh_mode=external` (`grid_sql` aparece solo en respuestas heredadas); estados `draft|staged|published`; la subida por URL admite hasta 500 MB.
- **Tokens de API:** `POST /tokens` con `name` y `scope`; el alcance por defecto `content` limita a subir/actualizar documentos y datasets; el token en texto claro se muestra **una sola vez**; `PATCH` habilita o deshabilita y `DELETE` revoca.
- **Visor:** la descripción de `/d/{doc_id}/raw/{asset_path}` indica un iframe con `sandbox="allow-scripts"` (origen opaco) como frontera principal y una CSP restrictiva (`'self'` más inline) para quien abra `/raw/` directamente. **[PENDIENTE]** compatibilizarlo con que nuestros HTML sí llamen a la API con la sesión del usuario.

### 16.29.8 Cambios del OpenAPI y estadísticas del contrato (2026-10-30)

- **Totales:** 230 rutas, 287 operaciones, 263 esquemas (antes, 2026-10-29: 229 / 286 / 259). Huella del documento `1e748d64c8e6`; tamaño ~371 KB. Sin operaciones obsoletas ni operaciones sin `operationId`.
- **Nuevo:** `GET /api/v2/documents/recommendations` (esquemas `RecommendationItem`, `RecommendationReason`, `RecommendationsResponse`, `RecommendedDocument`; códigos de razón `favorite, editor, shared, owned`). Cambiaron 3 esquemas de anuncios (`AnnouncementDetailResponse`, `AnnouncementInput`, `AnnouncementPublicResponse`). **Nada cambió en `utilities`, Google, Sheets ni permisos.**
- **Textos:** 243 de 287 operaciones traen descripción; 67 enums; 560 campos con límites o valores por defecto; **0** extensiones `x-*`; el contrato no declara `servers`, `tags` con descripción ni `securitySchemes`.
- **Servicios de salud:** `/health` 200 (`healthy`, versión «unknown», 4 comprobaciones); `/ping` 200; `/ping/slack` indica que la entrega de eventos va por webhooks HTTP a través de un gateway.
- **Artefactos del front-end:** `grid-sdk.js` 13.765 bytes (huella `e2518fd70366`); `viewer.js` 256.660 bytes (huella `5b918a41222b`).

### 16.29.9 Actualizaciones a secciones previas

| Sección previa | Estado previo | Estado actualizado (V24.14) |
|---|---|---|
| §16.28.3 verificación de identidad de Google | Inferencia | Confirmada por contrato y usuario (§16.29.1) |
| §16.28.5 `utility-editor-sharing` | Pendiente de probar con un editor | Solo del dueño; comparte la hoja de Google; no es interruptor de acceso (§16.29.2) |
| §16.28.8 «único candidato a interruptor» | `utility-editor-sharing` | Ya no: no existe ningún interruptor en el contrato |
| §16.28.6 VPN | Sin evidencia propia | Evidencia de alcance de red y del rebote en el regreso de OAuth (§16.29.6) |
| §16.19 `/api/v1/fetch` | No es proxy genérico (403 externos) | Se mantiene para externos; el SDK lo documenta para dominios internos permitidos (sin probar) |
| Skill del plugin | Descargable con `GET /skill` | `GET /skill` da 410; el plugin se instala desde el marketplace de Fury; versión en `/skill/version` (3.6.11) |
| `shared_with` con dos entradas por persona | Sin explicar | Alias LDAP y correo (§16.29.7) |
| `GET /permissions` | Solo dueño según el contrato | En runtime un editor recibió 200: el contrato no coincide |
| Ejemplos de código de mini-apps | `window.GRID.docId` o REST a mano | `Grid.configure({docId})` con el id de la URL y `Grid.utilities` (§16.29.5) |
| Estado con nombre | Un viewer escribe (observado) | Documentado: cualquiera con lectura escribe; 100 MB por bucket |

### 16.29.10 Preguntas abiertas V24.14+

- ¿Se puede vincular Google sin VPN? Pruebas pendientes: reintento de la pestaña fallida con VPN, alta bajo VPN y duración de la conexión, y si `Grid.fetch` puede completar el regreso desde dentro.
- ¿Qué dominios ML/Fury acepta `Grid.fetch`? ¿Incluye `melioffice`?
- Editor con Google verificado: lectura, creación, edición, borrado y escritura por el proxy.
- Viewer con Google verificado: edición y borrado de **sus propios** registros.
- ¿Qué cambia `criticality` (`medium`, `high`) y quién puede fijarla si la creación no admite el campo?
- Lista de «Compartir» de la hoja en Drive: capturar qué cuentas y roles aparecen tras compartir la mini-app.
- ¿Afecta `PUT /sheets/{id}/link` al Sheet de una mini-app (capacidad `read_write` para viewers)? Herramienta lista en el probe v3.9, sin ejecutar.
- ¿Por qué un `window.GRID` con `docId` del creador existe en una mini-app si el SDK dice que está desactivado?
- ¿Cómo convive el sandbox descrito para `/raw/{asset_path}` con las llamadas a la API desde HTML de un solo archivo?
- Las conexiones antiguas de Google (2 scopes, sin correo): ¿exigirán reconectar a todos los usuarios a la vez?

### 16.29.11 Evidencia a conservar y método

- Conservar el volcado `grid_openapi_full_*.json` (huella del documento `1e748d64c8e6`, 2026-10-30) como baseline: el probe `grid_openapi_probe` v3 compara contra él y marca cambios en la lista de vigilancia (`utilities`, `utility-editor-sharing`, permisos, compartir, `GET documento`, vínculo de Sheets y Google), descripciones modificadas y cambios del SDK, el visor o la versión de la skill.
- Conservar `grid-sdk.js` (huella `e2518fd70366`) y el JSON de `grid_google_connect_probe` (g1.0) sin VPN.
- **Lecciones:** (1) leer **descripciones**, no solo resúmenes: el contrato explica la semántica de varias operaciones; (2) el contrato y el runtime pueden discrepar (`GET /permissions`); (3) una ficha de una operación vale más que inferir por el comportamiento; (4) en las pruebas de red anotar qué se ve al volver, no solo el estado final.
- Herramientas vigentes: `grid_openapi_probe.html` (v3, o3.0), `grid_utilities_probe_v3.html` (v3.11, con análisis a fondo de `utility-editor-sharing`, vínculo de Sheets y desconexión de Google en cuentas de prueba) y `grid_google_connect_probe.html` (g1.1).


## 16.30 V24.15: proyecto de reporting de DPE (`billing_project`) (corte 2026-10-30)

> Nota de privacidad: el ID del proyecto de reporting es un dato de la **organización**, no una credencial ni un secreto, y es el valor operativo que DPE exige en cada consulta de BigQuery; por eso se registra aquí. El **número** del proyecto sigue omitido y no sirve para la API (§16.27.4). Al exportar evidencia fuera de la Biblia conviene usar su huella.

### 16.30.1 Valor operativo

| Campo | Valor |
|---|---|
| Proyecto de reporting (`billing_project`, donde corre el trabajo y se consume cómputo) | `reporting--cmh0jfik673-furyid` |
| Proyecto de datos por defecto (va en la URL, dueño de las tablas) | `meli-bi-data` |
| Huella SHA-256 (12 caracteres) del ID de reporting | `1ad927679a95` (la que aparece en la evidencia) |
| Formato aceptado | el **ID** en texto (6-30 caracteres); el número del proyecto da 422 «billing_project must be a valid GCP project id» |
| Dónde se envía | en el cuerpo de `POST /api/v1/dpe/sources/bigquery/{proyecto de datos}/query` y de las rutas paginadas `query/paged` |

Ejemplo de cuerpo (la consulta es ilustrativa):

```json
{ "sql": "SELECT 1", "limit": 10, "cache_ttl": 300, "billing_project": "reporting--cmh0jfik673-furyid" }
```

### 16.30.2 Evidencia **[RUNTIME]** (`grid_dpe_reporting_probe_v1`, 2026-10-29, un solo usuario)

- `SELECT 1`: 3 de 3 ejecuciones correctas, 4.014 / 2.024 / 1.943 ms (mediana 2.024 ms; el primer intento incluye arranque en frío). Con `meli-bi-data` como proyecto de facturación: 1.959 ms de mediana (razón 1,03×).
- Consulta propia del usuario: 200 en 4.003 ms, 1 fila y 4 columnas (con `meli-bi-data`: 3.976 ms).
- Sin `billing_project`, QueryBuilder usa `meli-bi-data` (la primera corrida terminó en 502 tras 11,7 s, probablemente transitorio).
- Con el número del proyecto: 422 inmediato.

### 16.30.3 Cómo usarlo (decisión vigente)

- **Dashboards compartidos:** `billing_project` = `reporting--cmh0jfik673-furyid`, más el rol de ejecución (tramitado en Shield) para quienes usen Refresh. **Pruebas personales:** `meli-bi-data`. **[PRECISIÓN V24.16]:** la skill Data Dash Creator pide no usar `meli-bi-data` como proyecto de facturación en dashboards (sus slots vienen reduciéndose); además el rechazo `client_permission` de §16.31.1 no depende del proyecto de facturación.
- La skill Data Dash Creator exige `billing_project` en cada consulta del HTML, de modo que **el ID es visible para quien abra el dashboard**. No es un secreto ni un permiso: lo que da acceso es el rol de ejecución, no conocer el ID.
- **Snapshots y datasets de BI (§16.30.4):** el documento que consulta DPE para publicar usa este mismo valor.
- No intentar derivar el proyecto desde la cuenta de Google conectada a Grid (no incluye scopes de Google Cloud; §16.27.5).

### 16.30.4 Pendiente **[PENDIENTE]**

- Acceso de los **lectores** de un dashboard al proyecto de reporting y trámite en grupo del rol de ejecución.
- Comportamiento con carga alta o con la contención de slots (solo se probó carga ligera).
- Quién puede publicar un dataset con resultados de DPE y su comportamiento con tus datos reales (§16.29.7 y la conversación sobre snapshots).


## 16.31 V24.16: app de rutas por sitio con usuarios no propietarios: DPE `client_permission`, Sheets, Named State y Dataset (corte 2026-11-02)

> Nota de privacidad (§15.1): se omiten `doc_id`, `sheet_id`, LDAP/usernames, correos, `x-request-id` y la identidad de las cuentas probadas; las dos cuentas se llaman «dueño» y «no dueño». **Criterio actualizado:** el **nombre del rol de Shield** y las **URL de solicitud y de términos** son datos de la organización, publicados tal cual en la skill Data Dash Creator 1.0.11; no son credenciales, por lo que se registran aquí (V24.12 los había omitido por un criterio demasiado estricto, igual que pasó con el ID de reporting en §16.30).

Fuentes de esta ronda: uso real de una app HTML de un solo archivo (sin backend propio) por dos cuentas en `grid.adminml.com`, la skill Data Dash Creator 1.0.11 (lectura estática del paquete, sin ejecutarlo), el HTML del Admin Panel y el SDK de Grid inyectado en los documentos. Etiquetas: **[RUNTIME]** observado, **[SKILL]** texto del paquete, **[SDK]** código inyectado por Grid, **[OPERADOR]** dato dado por quien opera Grid, **[IMPLEMENTADO]** comportamiento programado en la app pero **sin** prueba contra Grid real, **[PROPUESTA]** diseño no construido, **[PENDIENTE]**.

### 16.31.1 DPE: rechazo `client_permission` por usuario

- **CLOSE_VERDICT: `DPE_REJECTS_NON_OWNER_WITH_CLIENT_PERMISSION_INDEPENDENT_OF_BILLING_PROJECT`** **[RUNTIME]**. La misma consulta `SELECT 1` por `POST /api/v1/dpe/sources/bigquery/meli-bi-data/query` respondió 200 para la cuenta dueña del documento y **HTTP 403** para otra cuenta, con cualquiera de los dos `billing_project` (el de reporting y `meli-bi-data`). El cuerpo es `{"data":null,"fields":null,"error":"bigquery: submit: upstream responded with status 401","error_code":"client_permission","cached":false}` y la respuesta trae `x-request-id`. Es el **envío del trabajo** a QueryBuilder el que se rechaza (401 aguas arriba); DPE lo devuelve como 403. Cambiar de proyecto de facturación no lo resuelve.
- **CLOSE_VERDICT: `FRONTEND_IDENTITY_IDENTICAL_BETWEEN_OWNER_AND_NON_OWNER`** **[RUNTIME]**. Con ambas cuentas coincidieron: dominio `grid.adminml.com`, página dentro de un iframe (`/d/{id}/raw`), `auth_path = "grid_user"`, `caller_id` igual al LDAP, `is_public = false`, mismo tipo de navegador y sistema. Solo difirieron cookies de analítica y de otras apps. La cookie de sesión es HttpOnly y no se ve desde el HTML. Descartados: dominio, VPN y cómo se abre la app como causa de esta diferencia.
- **Causas documentadas del 403 de BigQuery por DPE** **[SKILL]** (orden de la propia skill): (1) falta el rol de Shield `gcp_meli-da-platform-admin_lookerstudio@mercadolibre.com` para el proyecto de reporting, «lo más común en usuarios nuevos» (solicitud de usuarios: `https://shield.adminml.com/requests/create/1223`; cuentas de servicio: `https://shield.adminml.com/requests/create/6293`); (2) **no se aceptaron los términos y condiciones de QueryBuilder** (`https://web.furycloud.io/data/query-builder`; «lo más común para un acceso nuevo a BigQuery»). La skill clasifica el 403 por palabras clave del cuerpo: «terms/query builder» sin «permission» → términos; «permission/role/shield» sin términos → permisos; ambos o ninguno → ambiguo (se ofrece primero el enlace de términos).
- **Quién necesita el rol** **[SKILL]**: quien crea el dashboard, y **todo lector que use Refresh** (DPE ejecuta con la identidad del lector). Quien solo ve snapshots incrustados no lo necesita. Esto explica que «solo funcione con la cuenta dueña»: es quien creó y probó.
- **[OPERADOR]** identificó la causa y pidió que el aviso de la app apunte a los términos de QueryBuilder. **[PENDIENTE]** evidencia runtime posterior a aceptarlos y confirmación de si bastó o también faltaba el rol.
- **El acceso a las tablas en BigQuery no equivale a esto.** Un usuario puede abrir `meli-bi-data` en BigQuery y aun así recibir `client_permission` por DPE, porque DPE exige además el rol de Shield y los términos de QueryBuilder.
- La skill indica facturar siempre al proyecto de reporting y no usar `meli-bi-data` en dashboards (sus slots vienen reduciéndose desde abril de 2026) **[SKILL]**.

### 16.31.2 Proxy de Sheets: vínculo documento-libro y escritura de viewers

- **[RUNTIME]** Un usuario no dueño recibió `403 permission_denied` «You do not have access to this resource» (`recovery: request_access`) al leer el libro por `GET /api/v1/sheets/{id}?doc_id=…&range=…`, aunque el documento tenía `visibility: public`, sin `editors` ni `shared_with`. Causa más probable **[INFERENCIA]**: el vínculo documento-libro (`PUT /api/v1/sheets/{id}/link?doc_id=…`, §16.25) no estaba registrado; el dueño lo debe registrar.
- **[IMPLEMENTADO, sin prueba contra Grid real]** La app, al abrirla el dueño, registra el vínculo una sola vez con `capability: read_write` y recuerda el hecho en `localStorage`; a quien no es dueño y recibe 403 le avisa que el dueño debe abrir la app una vez.
- **[OPERADOR]** (corrección): por el proxy de Sheets de un documento normal un **viewer sí puede escribir**; lo que no puede es lo de las **mini-apps**, que usan otro endpoint apoyado en Sheets (§16.28). **[PENDIENTE]** captura runtime de una escritura de viewer por el proxy con un par `read_write`.
- Patrón de lectura/escritura de referencia (Admin Panel): lectura `GET …?doc_id=&range=Pestaña!A:Z`; escritura `PUT …?doc_id=` con `{range, values}`; alta de filas `POST …/append?doc_id=` con `{range: "Pestaña", values: [[…]]}`; respuestas de valores en `values`. Separación mínima de 700 ms entre llamadas por el límite de lecturas por minuto (§16.24).
- Para bitácoras con varios escritores conviene **solo agregar filas** (una por evento) y reconstruir el estado repitiendo la bitácora: evita leer-modificar-escribir.

### 16.31.3 Named State: contrato del SDK y modelo con buckets acotados

- **[SDK]** (código inyectado por Grid en los documentos): `GET /api/v1/documents/{doc}/states/{nombre}` devuelve `{state, updated_at}`; `PUT` con cuerpo `{state: <objeto>, if_updated_at: <texto>}`; `PATCH` con cuerpo `{patch: <objeto>, if_updated_at: <texto>}` (claves de primer nivel; valor `null` borra). El SDK usa `''` como token cuando no hay uno conocido. El estado por defecto vive en `/state`.
- **[IMPLEMENTADO, sin prueba contra Grid real]** Patrón de escritura: leer el bucket → `PATCH` con `if_updated_at` → ante 409, espera con azar y reintento → releer para verificar que las claves escritas están (o ausentes, si eran `null`) → hasta 5 intentos. Es el patrón de §5.8-§5.9.
- **Buckets acotados (decisión de diseño):** en vez de un bucket por día o por ciclo (crece sin límite y no hay ruta para borrarlos), se usa **un bucket por sitio** (`lotes_<sitio>`, como máximo uno por sitio) y las claves llevan `dia`; lo de más de 3 días se borra en el mismo `PATCH` de cualquier escritura o al abrir el monitoreo (idempotente). Las cargas usan `snap_<sitio>_<ciclo>` y **se reemplazan** en cada carga, de modo que su número también es finito.
- Claves usadas: `L:<lote_id>` (lote) y `S:<envio_id>` (envío asignado a un lote). Agregar o quitar un envío es una sola clave; los nombres de bucket se escriben en minúsculas con guion bajo (reglas de nombre **[PENDIENTE]**).
- **[OPERADOR]** Cualquiera con acceso al documento puede leer y escribir cualquier bucket; no hay protección por fila. Sirve para organización de trabajo, no para datos sensibles ni como registro de auditoría.

### 16.31.4 Dataset: cuerpo real de la subida directa y decisión de no usarlo

- **[RUNTIME]** `POST /api/v1/documents/{doc}/datasets/{name}/data` con un **array crudo** → `422` «Input should be a valid dictionary or instance of DatasetDirectUploadRequest». Con `{"rows": [ … ]}` → `200` con `{doc_id, name, revision, published, updated_at, data_changed}` (617 filas, 0,19 MB, 633 ms, usuario dueño). Esto contradice §16.5, que decía que acepta el array directo.
- **[RUNTIME]** En una primera prueba con ~5.000 filas la subida terminó en error de red (status 0) a los 9 s, antes de descubrir el formato correcto; la causa no se aclaró.
- **[OPERADOR]** Publicar un Dataset exige ser dueño o editor; el flujo necesita que usuarios **sin** esos permisos corran DPE y guarden. Por eso **la app dejó de usar Dataset** (V24.16) y guarda la carga en Named State. El flujo de tres pasos (`upload-url` → `PUT` sin cabeceras → `publish`) y la lectura por `GET …/data/{name}/content` no se probaron contra Grid real.
- El Dataset sigue siendo válido para consumidores de solo lectura que no necesiten escritura por parte de viewers.

### 16.31.5 Directorio de personas, identidad y propietario

- **[RUNTIME, Admin Panel]** `GET /api/v1/people/search?q=…&limit=…` (mínimo 2 caracteres) devuelve `people[]` con `username`, `email` y `full_name`. Para validar una identidad exacta se busca el texto y se exige que `username` (o `email`) coincida idéntico; se guarda siempre el **LDAP** (`username`), nunca el prefijo del correo.
- **[RUNTIME]** `GET /api/v1/me` devuelve, entre otros, `caller_id`, `ldap`, `username`, `email`, `full_name`, `auth_path`, `is_public`, `title`, `department`, `division`, `area_description`, `country` y `manager_username`.
- **[RUNTIME]** `GET /api/v1/documents/{doc}` devuelve `owner_id` (el LDAP del propietario), `visibility`, `editors`, `shared_with`, `dataset_count`, `has_live_queries`, `query_count`, `workflow_status` y otros. Comparar `owner_id` con el `username` de `/me` identifica al propietario desde el HTML; sirve para mostrar solo a él la configuración del libro. Esto **solo oculta interfaz**: quien impone el permiso (por ejemplo para registrar el vínculo del libro) es Grid.

### 16.31.6 Modelo de datos de la app de rutas **[IMPLEMENTADO]**

| Dato | Dónde | Quién escribe | Nota |
|---|---|---|---|
| Sitios (catálogo, `activo` 1/0) | Sheets `SITIOS` | operador, a mano | sin lista fija en el código |
| Equipos y miembros | Sheets `EQUIPOS`, `MIEMBROS` | la app | `MIEMBROS` es bitácora (`ADD`/`REMOVE`); una persona puede estar en varios equipos |
| Cargas (índice) | Sheets `CARGAS` | la app | `ts, sitio, ciclo, ldap, filas, costo_min, doc_id, ref`; `doc_id` apunta al documento de Grid donde quedó |
| Datos de la carga | Named State `snap_<sitio>_<ciclo>` | cualquier usuario | se reemplaza en cada carga |
| Lotes y envíos asignados | Named State `lotes_<sitio>` | cualquier usuario | temporal; limpieza automática a 3 días |
| Resultado de captura | Sheets `HISTORIAL` | app de captura (otra app) | `datetime, sitio, ldap, envio_id, resultado (ENCONTRADO|NO_ENCONTRADO), foto_ref, lote_id, doc_id`; esta app solo lo lee |

- **Qué es durable:** lo encontrado y lo no encontrado (`HISTORIAL`); los lotes son de trabajo y caducan. Sin registro permanente de quién asignó qué (decisión del operador).
- El avance de un lote es (encontrados + no encontrados) sobre los envíos asignados.
- **Fotos [PROPUESTA, no demostrado]:** no hay una vía probada para guardar fotos; las rutas de Drive ya no son parte del contrato (§16.20) y una celda de Sheets admite 50.000 caracteres. Opción a probar: un bucket por lote con una clave por foto reducida (~800 px, JPEG ~80 KB, base64), con la bitácora en `HISTORIAL` (`foto_ref` apunta al bucket y la clave, y un hash para detectar cambios). Medir tamaño y tiempos antes de comprometerse; si las fotos pueden mostrar personas, decidir si se guardan.

### 16.31.7 Pendientes **[PENDIENTE]**

- Confirmar con una cuenta no dueña que aceptar los términos de QueryBuilder basta (o si también hace falta el rol de Shield) y capturar la respuesta.
- Probar contra Grid real: `PUT` y `PATCH` de Named State con los cuerpos del SDK, el 409 con `if_updated_at`, el borrado con `null` y las reglas de nombre de bucket.
- Probar el registro automático del vínculo por el dueño y la escritura de un viewer por el proxy de Sheets.
- Probar la lectura de `HISTORIAL` con la columna `resultado` escrita por la app de captura.
- Medir el límite práctico de una carga en un bucket (5.000 filas ≈ 1,5 MB) y de los lotes por sitio.
- Medir la subida de ~5.000 filas por la ruta directa de Dataset, para aclarar el error de red de §16.31.4.

# 17. Prompt Maestro para Agentes

> Fuente canónica para el botón **Copiar Prompt Maestro** de la interfaz web. Mantener esta sección actualizada cuando cambien reglas arquitectónicas o contratos que afecten el desarrollo.

```text
Actúa como un desarrollador web senior trabajando sobre MercadoLibre Grid.

REGLAS DE FUENTE Y EVIDENCIA
1. Usa esta Biblia como fuente canónica del proyecto.
2. Distingue siempre entre [OPENAPI], [RUNTIME] y [HISTORICO].
3. No conviertas un contrato OpenAPI en comportamiento runtime sin evidencia.
4. No generalices un hallazgo observado en una ruta, usuario o documento a toda la plataforma.
5. No elimines ni sobrescribas evidencia histórica; actualiza la conclusión vigente y explica qué quedó obsoleto.

ARQUITECTURA
6. La aplicación debe ser Grid-only: HTML + capacidades de Grid, sin backend propio, salvo que una sección posterior de la Biblia documente explícitamente otra dependencia autorizada.
7. Usa GET /api/v1/me para rehidratar identidad al iniciar o después de un reload/reopen.
8. Para identidad usa solo el primer scalar estable disponible en este orden: id > user_id > userId > username > nickname > login > email.
9. Hashea solo ese scalar cuando se necesite persistir una referencia de identidad. No persistas el payload completo de /me.
10. No uses parámetros de URL, localStorage ni sessionStorage como mecanismo de coordinación entre participantes.

GRID STATE
11. Usa Named State para coordinación, eventos pequeños, metadata, pointers y proyecciones/materializaciones pequeñas; no para bulk data.
12. Para writes críticos usa claves top-level únicas por evento y un _write_id único dentro del valor.
13. Antes de un PATCH obtén el updated_at actual y úsalo como if_updated_at.
14. Trata if_updated_at como detector de stale state/coordinación optimista, NO como lock, mutex, transacción ni CAS linearizable.
15. Mantén una sola escritura lógica in-flight por writer.
16. En 409: reread, aplica jitter y reintenta con un baseline nuevo.
17. En 429 de Grid State: respeta Retry-After mediante un gate del servicio y no continúes golpeando esa API desde ramas paralelas. No extiendas automaticamente ese gate a Sheets u otros servicios sin evidencia de bucket comun.
18. En 503/network error: considera la respuesta ambigua; reread y busca el mismo _write_id antes de reintentar.
19. Después de cualquier 2xx crítico: reread inmediato y después reread estable para verificar que el _write_id persiste.
20. No asumas que HTTP 200 significa durabilidad.
21. Para concurrencia similar al scope validado, comienza con 8 shards deterministas y mide antes de cambiar el número.
22. Para conflictos de entidades usa versionado lógico + base_version; conserva ambas mutaciones y resuelve explícitamente con un evento de resolución. No uses LWW como resolución implícita.

DATASET / BIGQUERY / SHEETS
23. Dataset es snapshot store: una publicación reemplaza el snapshot completo; no lo trates como una DB transaccional ni row store.
24. En V24.1, Dataset Definitions nuevas usan únicamente source_type=external_push y refresh_mode=external.
25. El mecanismo grid_sql queda como evidencia histórica; no lo uses para nuevas implementaciones sin una nueva evidencia que contradiga la Biblia vigente.
26. Para payloads grandes usa upload-url -> upload-content -> publish; para payloads pequeños puede usarse el upload directo documentado.
27. Cuando se consuma un catálogo vía Sheets, usa el doc_id principal compartido con la audiencia cuando ese documento sea el mismo propietario de la conexión OAuth que expone la sheet.
28. No asumas que Sheets está sincronizado en tiempo real. Trata el snapshot como potencialmente stale y diseña el manejo de ambigüedad explícitamente.
29. Para grandes resultados de BigQuery, row packing es el patrón preferido documentado frente a repetir chunking cuando los tipos y el límite de materialización lo permitan.
30. Para lecturas de Sheets que se consumen como catálogo/bitácora, prefiere un único snapshot completo por refresh, cacheado en memoria; filtros, búsquedas, fechas, orden y métricas deben ser locales.
31. El 429 observado del proxy de Sheets provino de la cuota Google Sheets API `Read requests per minute` del proyecto consumidor. Usa cooldown service-scoped por cubo (lectura/escritura) con escalera 4→8→16→30 s y jitter, máximo 2 reintentos, esperando fuera de la cola (§16.25.6). Conserva el último snapshot. No dependas de Retry-After: no fue expuesto.
32. Metadata de Sheets no pertenece al hot path salvo necesidad funcional. Cada request adicional consume presupuesto de lectura del proxy/Google.

PRIVACIDAD Y OPERACIÓN
33. Logs y artefactos son redacted-by-default.
34. Nunca exportes tokens, cookies, credenciales, Authorization headers, URLs firmadas/de descarga, content_path, SQL completo, bodies HTTP arbitrarios, emails/nombres/LDAP u otros identificadores internos no imprescindibles.
35. Conserva evidencia completa de pruebas por separado; los resúmenes no sustituyen los logs crudos para analizar races, stale reads, retries, 429 o convergencia.
36. Antes de implementar una nueva capacidad, comprueba primero el contrato vigente y las evidencias más recientes de la Biblia.
37. Si una implementación depende de una capacidad que aparece como histórica, obsoleta o abierta, dilo explícitamente y no la presentes como disponible.

DISCIPLINA DE DESARROLLO
38. Prioriza soluciones mantenibles y reutilizables: separa UI, acceso a Grid, validación, colas/reintentos y modelo de datos.
39. No dupliques lógica de integración con Grid en varias partes de una app.
40. Evita depender de texto exacto de secciones históricas de la Biblia; usa las secciones canónicas actuales y el Web Manifest cuando exista.
41. Cuando modifiques una app, conserva la UX existente salvo que el requerimiento pida cambiarla.
42. Valida JavaScript antes de entregar y reporta cualquier capacidad que no pueda probarse en runtime real de Grid.
43. Si la Biblia vigente contradice una hipótesis previa, prevalece la Biblia vigente y se debe explicar el cambio.

LOCKS / CAPABILITY ACL
44. No uses /lock como mutex global: en runtime no bloqueó Named State ni el PATCH de metadata probado.
45. No infieras capacidades a partir de nombres de rol. Verifica la capacidad real por endpoint y sobre el doc_id objetivo.
46. Toda prueba cross-user estándar debe usar A=owner y B=viewer real del mismo doc_id, salvo que la prueba requiera explícitamente otro rol.

CSP / CDN / RUNTIME EXTERNO
47. Modela capacidades externas como origen x mecanismo x directiva CSP; no declares un CDN/origen globalmente permitido.
48. Para dependencias externas críticas usa versión exacta y SRI cuando aplique; prefiere /d/_libs/* cuando cubra el caso.
49. connect-src no equivale a Internet abierto. No asumas que un host accesible por fetch será válido para img/script/style, ni viceversa.
50. Blob Workers están permitidos y pueden hacer fetch a hosts autorizados; úsalos para trabajo pesado off-main-thread cuando mejore la UX.
51. Para imágenes de Drive no existe actualmente una vía browser-only demostrada: drive.google.com está bloqueado por img-src/connect-src y /api/v1/fetch devolvió 403 en las pruebas. No diseñes alrededor de esa ruta sin nueva evidencia runtime.

FULLSCREEN
52. La Fullscreen API está confirmada en runtime dentro del viewer embebido probado de Grid. Para entrar usa requestFullscreen() desde un gesto explícito del usuario; escucha fullscreenchange/fullscreenerror y usa exitFullscreen() para salida programática. No asumas entrada automática sin user activation.

PEOPLE DIRECTORY / LDAP
53. Para selectores de personas usa GET /api/v1/people/search. El texto escrito es solo una consulta; no lo trates como identidad validada.
54. En el runtime probado, people[].username coincide exactamente con LDAP conocido y puede persistirse como LDAP operativo cuando proviene de un resultado seleccionado del directorio.
55. No persistas ni exportes perfiles completos del directorio si solo necesitas el username; mantén nombre/email/puesto/departamento como datos efímeros de UI.
56. En Seguimientos Mandatorios los adjuntos se crean con `visibility=public` en Grid para evitar shares individuales. Esta visibilidad es independiente de `Compartido con`: quitar un LDAP de la solicitud no revoca el documento público. No describas `public` como acceso público de Internet sin evidencia runtime específica.

LOGOUT / CIERRE DE SESIÓN
57. Una app Grid puede cerrar la sesión del usuario cargando `https://login.adminml.com/logout?callbackURL=<URL-encoded https://grid.adminml.com>` en un iframe oculto (src asignado antes de insertarlo) y verificando el resultado con GET /api/v1/me (401/403/redirect = sesión cerrada; reintentar hasta 4 veces, 1.5 s entre intentos). Ver §16.23.
58. No declares éxito sin la verificación de /me; el `load` del iframe no prueba nada. Si la verificación falla o hay error de red, muestra error con reintento, nunca "Sesión cerrada".
59. Usa un modal propio de confirmación (sin confirm()) y, tras el cierre, una pantalla bloqueante sin botón de recargar (Okta no se renderiza embebido). Limpia el estado en memoria; no dependas de localStorage/sessionStorage.
60. Avisa al usuario que el cierre afecta a las demás apps con el mismo inicio de sesión (*.adminml.com). Probado solo con un usuario, un navegador y callbackURL=grid.adminml.com; el endpoint pertenece a la pasarela, no a Grid, y puede cambiar sin aviso.

SHEETS: RELACIÓN DOCUMENTO ↔ LIBRO (desde 14-oct-2026)
61. Cada par (doc_id, sheet_id) debe estar registrado por el dueño del documento con PUT /api/v1/sheets/{sheet_id}/link?doc_id=… y {"capability":"read_only"|"read_write"}. Sin registro, el proxy responde 403 permission_denied "You do not have access to this resource" aunque el dueño tenga OAuth y sea dueño del libro. Ver §16.25.
62. Usa un documento de Grid por app como doc_id (window.GRID.docId con respaldo literal), compartido sólo con la audiencia de esa app, y registra la capacidad mínima por libro. No compartas un único doc_id con read_write entre apps de audiencias distintas.
63. Un libro puede estar vinculado a varios documentos a la vez. Todo documento nuevo (otra versión de test, un fork) necesita registrar sus pares antes de usarse.
64. Antes de conectar OAuth de Google, compara GET /api/v1/me en grid.adminml.com y grid.melioffice.com: si difieren, la conexión se guarda para otro usuario. Verifica siempre el resultado con /api/v1/google/oauth/status en el dominio donde corren las apps.
65. No ofrezcas "desconectar" el OAuth como paso de diagnóstico: revoca los tokens que usan todos los documentos del dueño en producción.

MINI-APPS (UTILITIES), OAUTH Y LÍMITES (V24.11)
66. Antes de crear una mini-app comprueba GET /api/v1/google/oauth/status: exige connected=true, requires_reconnect=false y google_email presente. Con connected=true y requires_reconnect=true, POST /api/v1/utilities devuelve 403 google_not_connected.
67. Una mini-app guarda sus colecciones en un Google Sheet administrado por Grid (una pestaña por colección): hereda las cuotas de Sheets y depende de la conexión de Google del dueño. No la uses para captura de alta frecuencia: no hay endpoint de lote y cada escritura tarda ~0,6 s.
68. En colecciones, if_version solo detecta versiones obsoletas en secuencia; no es CAS ni lock. Dos escrituras simultáneas con la misma versión pueden pasar ambas (lost update). Serializa las escrituras por registro en el cliente o modela eventos append-only; no uses LWW para conflictos de entidades.
69. Respeta la cabecera Retry-After y el texto "Try again in Ns" en los 429 de utilities. Un bloqueo del limitador de Grid afecta a lecturas y escrituras a la vez (13-41 s observados). Redacta siempre el número de proyecto de Google Cloud de los mensajes de error antes de registrarlos.
70. Valida del lado del cliente antes de enviar: los registros rechazan campos desconocidos y deshabilitados (400), pero un filtro de search con tipo incorrecto devuelve 200 con 0 resultados sin avisar. search exige al menos un filtro y no tiene orden ni agregaciones; el límite de página es 200.
71. Los nombres de colección cumplen ^[a-z][a-z0-9_]{0,63}$. Una colección archivada responde 404 en todas las rutas de registros.

AUTORIZACIÓN Y CONFIDENCIALIDAD (V24.11)
72. El proxy de Sheets autoriza por par (doc_id, sheet_id) y capacidad, no por usuario ni por fila. No confíes en filtros, gates ni roles evaluados en el HTML para proteger datos confidenciales cuando el mismo documento da acceso de lectura o escritura a la hoja.
73. Los filtros de records/search los envía el cliente: sirven para eficiencia, nunca como control de acceso por fila.
74. Para confidencialidad por audiencia separa documentos y hojas por audiencia con la capacidad mínima (lectura en read_only, escritura en documento aparte, hoja de usuarios solo para administradores), o usa los grupos y permisos de Grid como fuente de verdad del acceso.
75. Antes de dar por segura una app, verifica con una cuenta de bajo privilegio qué rangos puede leer y escribir directamente por el proxy. No declares la seguridad probada por lo que muestra la UI.
76. En apps de captura con cola local, mantén la sincronización por lotes, el UID para idempotencia y la relectura de verificación; no sustituyas ese camino por escrituras una a una en colecciones.
77. Si no hay prueba runtime, etiqueta cualquier conclusión sobre permisos o cuotas como [INFERENCIA] y no la presentes como hecho.

DPE Y DATOS ANALÍTICOS DESDE GRID (V24.12)
78. Desde un HTML de Grid consulta DPE solo por el proxy del mismo origen: /api/v1/dpe/sources/{tecnología}/{fuente}/query (o /query/paged y /query/page), con credentials:'include', GATEWAY_URL vacío y sin tokens ni cabeceras X-Grid-User o X-DPE-* (el proxy las inyecta). El orden es /api/v1/dpe/… (no /api/dpe/v1/…).
79. El proxy expone solo rutas de consulta (catálogo y descubrimiento dieron 404): descubre fuentes, esquemas y columnas fuera de Grid y escribe en el HTML fuentes ya resueltas.
80. En BigQuery el proyecto de datos va en la URL y el cuerpo lleva sql (una sola sentencia SELECT o WITH, tablas calificadas), limit, cache_ttl y billing_project. billing_project es el ID del proyecto (texto), nunca su número; sin él la consulta usa meli-bi-data.
81. Para dashboards compartidos usa el proyecto de facturación de reporting y gestiona el rol de ejecución de quienes usen Refresh; para pruebas personales meli-bi-data funciona. No intentes derivar el proyecto de facturación de la cuenta de Google conectada. El ID vigente del proyecto de reporting está en §16.30.1.
82. Trata un 200 con error en el cuerpo como fallo. Ante 502, 503 o 504 de DPE reintenta una sola vez tras unos segundos y registra el x-request-id. DPE rechaza SQL que no sea de lectura con 422 client_sql_rejected.
83. Ajusta cache_ttl a la cadencia real de los datos: la caché es por usuario y force_refresh no aplica a /paged. Autorrefresco mínimo de 15 minutos y máximo 4 consultas simultáneas.
84. Redacta de los errores de DPE los identificadores de ejecución de QueryBuilder (llevan el LDAP) y los nombres de host internos antes de registrarlos, exportarlos o mostrarlos al usuario.
85. Los snapshots incrustados exponen a cualquier lector del documento los datos de la consulta del autor aunque no tenga acceso a la fuente. Para datos confidenciales por audiencia no incrustes snapshots, o limita lo incrustado a agregados que toda la audiencia pueda ver.
86. El SQL, el query-spec y la lista de rutas permitidas del runtime viven en el cliente: no son control de acceso. La autorización por fila debe estar en la fuente (filtros de acceso de Looker, políticas de fila o vistas autorizadas en BigQuery) y verificarse con dos usuarios de distinto permiso.
87. DPE es de solo lectura y no sustituye a Sheets, Named State ni colecciones para escribir. No uses DPE para datos que solo viven en Sheets.
88. Antes de depender de una mini-app para confidencialidad, recuerda que su Sheet de almacenamiento es alcanzable por el proxy de Sheets con el doc_id de la mini-app (lectura comprobada como dueño); no asumas que la API de colecciones es la única puerta hasta probar viewer y capacidad.
89. No ejecutes en producción las rutas de administración, de sistema ni de transferencia de propiedad (internal, worker, slack, admin/users, shield/tickets, transfer-ownership) ni DELETE /google/oauth como prueba.
90. Las dependencias de dominio son distintas por servicio (Grid, melioffice, melisystems): no cambies GATEWAY_URL ni hosts por tu cuenta; usa los que el proxy y el servidor indican.

MINI-APPS CON VARIOS USUARIOS (V24.13)
91. Dentro de una mini-app lee su id de la URL (/d/{id}/…), nunca de window.GRID.docId: ahí apunta al documento que la creó.
92. Todo usuario que use la API de colecciones o lea el Sheet de una mini-app por el proxy necesita su propia cuenta de Google vinculada y verificada (connected=true, requires_reconnect=false, google_email presente). Sin conexión da 403 "No Google account linked for user…" y con conexión obsoleta 403 "Reconnect Google…". No hay respaldo con el token del dueño.
93. Antes de desplegar una mini-app comprueba GET /api/v1/google/oauth/status de los usuarios finales: las conexiones antiguas (2 scopes, sin correo) también exigen reconectar una vez.
94. Con Google verificado, un viewer lee y crea registros pero no modifica los ajenos; no escribe por el proxy pero sí lee la hoja completa, incluidos _meta y la pestaña interna con el LDAP del dueño. No guardes en una mini-app datos que no pueda ver todo viewer.
95. El Named State de una mini-app es compartido por documento y un viewer puede escribirlo. No lo uses para datos que un viewer no deba modificar.
96. GET storage es solo del dueño: no lo uses desde el HTML de los usuarios.
97. Para usuarios que no puedan vincular Google (sin VPN o sin cuenta), no uses la API de colecciones: usa el proxy de Sheets con par registrado (token del dueño) y Named State, o solicita a Grid un modo con el token del dueño.
98. Quien pueda escribir por el proxy en el Sheet de una mini-app puede crear registros sin validar y falsificar _meta.created_by; no uses ese campo como evidencia de autoría si hay editores que escriben por el proxy.

OPENAPI, SDK Y ALCANCE SIN VPN (V24.14)
99. HTML de una mini-app: incluye /d/_assets/grid-sdk.js y llama a Grid.configure({docId}) con el id sacado de location.pathname (/d/{id}/…). El window.GRID automático está desactivado en mini-apps; usa Grid.utilities y pasa ifVersion en toda escritura, releyendo tras un 409.
100. Compartir una mini-app comparte su hoja de Google (confirmado por el usuario): cada usuario necesita una cuenta de Google vinculada y verificada. No diseñes mini-apps para usuarios que no puedan vincularla; para ellos usa el proxy de Sheets con par registrado y Named State.
101. GET /utilities/{id}/storage es solo del dueño por diseño. POST /documents/{id}/utility-editor-sharing es solo del dueño y trata del compartir de la hoja de Google, no del acceso a la API de colecciones: no la uses como interruptor de acceso.
102. Al compartir usa los campos incrementales viewers, editors y revoke, con LDAP o correos corporativos; el servidor expande alias, así que shared_with traerá dos entradas por persona. No uses el contrato antiguo share_with + add_as_editors.
103. Respeta los límites del contrato: HTML hasta 1.000.000 de caracteres, nombres de colección y campo ^[a-z][a-z0-9_]{0,63}$, limit hasta 200, búsqueda de 1 a 5 filtros, opciones de un campo select hasta 200, y campos con solo type, required, options y status.
104. Antes de apoyarte en la semántica de una operación lee su descripción en el OpenAPI (probe grid_openapi_probe v3, ficha de operación) y compara contra el baseline guardado; el contrato y el runtime pueden discrepar (p. ej., GET /permissions).
105. GET /skill devuelve 410: el plugin de Grid se instala desde el marketplace de Fury; la versión vigente está en /skill/version. No automatices la descarga de la skill.
106. Grid.fetch (POST /api/v1/fetch) reenvía a dominios ML/Fury permitidos e inyecta la identidad de quien llama; los dominios externos dieron 403. No diseñes alrededor de él sin probar el dominio exacto.
107. El regreso del flujo OAuth de Google va a un sitio (melioffice) que no responde sin VPN: un usuario sin VPN puede aceptar los permisos pero no completar la conexión. Resolverlo exige un cambio de Grid (URL de retorno en grid.adminml.com); no cambies hosts ni GATEWAY_URL por tu cuenta.
108. En pruebas de conexión sin VPN registra qué se ve al volver de Google y si reintentar con VPN completa el flujo; no basta con el estado final de oauth/status.

PROYECTO DE REPORTING (V24.15)
109. En consultas de BigQuery por DPE para dashboards compartidos envía billing_project = "reporting--cmh0jfik673-furyid" (el ID, nunca el número) y gestiona el rol de ejecución de quienes usen Refresh; para pruebas personales sirve meli-bi-data. El ID es visible en el HTML y no es un permiso. Fuera de la Biblia, reporta su huella (1ad927679a95), no el ID.

APP DE RUTAS POR SITIO, DPE Y SHEETS (V24.16)
110. Un 403 de DPE con error_code client_permission («upstream responded with status 401») es de identidad, no del proyecto de facturación: cambiar billing_project no lo arregla. Las causas documentadas, en orden, son el rol de Shield gcp_meli-da-platform-admin_lookerstudio@mercadolibre.com (https://shield.adminml.com/requests/create/1223) y los términos de QueryBuilder sin aceptar (https://web.furycloud.io/data/query-builder).
111. El acceso a las tablas en BigQuery no demuestra que DPE funcione: cada persona que consulte (o use Refresh) necesita además ese rol y los términos aceptados. Quien solo abre datos ya guardados no los necesita.
112. No uses meli-bi-data como proyecto de facturación permanente de un dashboard; la guía de la skill factura al proyecto de reporting. No ofrezcas cambiar de proyecto como solución a client_permission.
113. Una verificación de permisos al abrir la app debe ser informativa: no deshabilites botones por ella ni clasifiques el error por palabras sueltas. Que decida la consulta real y muestra el mensaje que devuelva el servicio. Ante client_permission, explica el paso concreto con un enlace.
114. POST /api/v1/documents/{doc}/datasets/{name}/data exige un objeto {"rows":[...]}; un array crudo da 422 (DatasetDirectUploadRequest). Publicar un Dataset exige ser dueño o editor: si los usuarios no son editores, no lo uses como almacén de escritura.
115. Para guardar datos desde usuarios que no son dueños ni editores usa Named State (GET {state, updated_at}; PUT {state, if_updated_at}; PATCH {patch, if_updated_at}). Escribe con if_updated_at, reintenta ante 409 con espera aleatoria y relee para verificar. Cualquier persona con acceso puede leer y escribir cualquier bucket: no lo uses para datos sensibles ni como auditoría.
116. No crees buckets sin límite: usa un bucket por entidad finita (por ejemplo, por sitio), pon la fecha en cada clave y borra lo vencido con PATCH null en el mismo flujo de escritura o al abrir la pantalla.
117. El proxy de Sheets exige que el propietario registre el vínculo documento-libro (PUT /api/v1/sheets/{id}/link); sin él, quien no es dueño recibe 403. Registra el vínculo cuando abra la app el propietario. Ocultar esa interfaz a los demás es solo cosmético: Grid impone el permiso. El veredicto de que los viewers no escriben es de las mini-apps; no lo generalices al proxy de Sheets.
118. En bitácoras con varios escritores solo agrega filas (una por evento) y reconstruye el estado repitiendo la bitácora; no leas-modifiques-escribas filas compartidas. Respeta la pausa entre llamadas a Sheets y reutiliza lecturas por unos segundos.
119. No hay una vía probada para guardar fotos en Grid. No prometas almacenamiento de fotos hasta medir una opción (por ejemplo, un bucket por lote con imágenes reducidas) y decide antes si pueden mostrar personas.
```
