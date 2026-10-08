# Biblia de Desarrollo en Grid - V24.8 Canonica

**Fecha de corte:** 2026-10-08 (base histórica V23.5: 2026-08-16)  
**Estado:** Canónica consolidada hasta V24.8 (OpenAPI vigente, locks/capabilities, CSP/CDN, límites de Drive, Fullscreen API, People Directory validado y cierre de sesión vía pasarela de login); base para V24.8+  
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

Atajo de un paso para payloads chicos: `POST /api/v1/documents/{doc_id}/datasets/{name}/data` ("Upload Dataset Direct") — sin schema de body declarado (acepta el array/rows directo), publica de forma atomica. Limite documentado: **10 MB** por push inline (413 si se excede); igual limite aplica al endpoint legacy `PUT /api/v1/documents/{doc_id}/data/{name}`. Para mayores, usar el flujo de 3 pasos (soporta hasta 500 MB documentados).

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
- ¿Existe un techo real de rate limit para `/api/v1/sheets/*`? Solo se probo hasta ~2 req/seg sin fallo (§16.9); no se busco el punto de quiebre.
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
17. En 429: respeta Retry-After mediante un gate global; no continúes golpeando la API desde ramas paralelas.
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

PRIVACIDAD Y OPERACIÓN
30. Logs y artefactos son redacted-by-default.
31. Nunca exportes tokens, cookies, credenciales, Authorization headers, URLs firmadas/de descarga, content_path, SQL completo, bodies HTTP arbitrarios, emails/nombres/LDAP u otros identificadores internos no imprescindibles.
32. Conserva evidencia completa de pruebas por separado; los resúmenes no sustituyen los logs crudos para analizar races, stale reads, retries, 429 o convergencia.
33. Antes de implementar una nueva capacidad, comprueba primero el contrato vigente y las evidencias más recientes de la Biblia.
34. Si una implementación depende de una capacidad que aparece como histórica, obsoleta o abierta, dilo explícitamente y no la presentes como disponible.

DISCIPLINA DE DESARROLLO
35. Prioriza soluciones mantenibles y reutilizables: separa UI, acceso a Grid, validación, colas/reintentos y modelo de datos.
36. No dupliques lógica de integración con Grid en varias partes de una app.
37. Evita depender de texto exacto de secciones históricas de la Biblia; usa las secciones canónicas actuales y el Web Manifest cuando exista.
38. Cuando modifiques una app, conserva la UX existente salvo que el requerimiento pida cambiarla.
39. Valida JavaScript antes de entregar y reporta cualquier capacidad que no pueda probarse en runtime real de Grid.
40. Si la Biblia vigente contradice una hipótesis previa, prevalece la Biblia vigente y se debe explicar el cambio.

LOCKS / CAPABILITY ACL
41. No uses /lock como mutex global: en runtime no bloqueó Named State ni el PATCH de metadata probado.
42. No infieras capacidades a partir de nombres de rol. Verifica la capacidad real por endpoint y sobre el doc_id objetivo.
43. Toda prueba cross-user estándar debe usar A=owner y B=viewer real del mismo doc_id, salvo que la prueba requiera explícitamente otro rol.

CSP / CDN / RUNTIME EXTERNO
44. Modela capacidades externas como origen x mecanismo x directiva CSP; no declares un CDN/origen globalmente permitido.
45. Para dependencias externas críticas usa versión exacta y SRI cuando aplique; prefiere /d/_libs/* cuando cubra el caso.
46. connect-src no equivale a Internet abierto. No asumas que un host accesible por fetch será válido para img/script/style, ni viceversa.
47. Blob Workers están permitidos y pueden hacer fetch a hosts autorizados; úsalos para trabajo pesado off-main-thread cuando mejore la UX.
48. Para imágenes de Drive no existe actualmente una vía browser-only demostrada: drive.google.com está bloqueado por img-src/connect-src y /api/v1/fetch devolvió 403 en las pruebas. No diseñes alrededor de esa ruta sin nueva evidencia runtime.

FULLSCREEN
49. La Fullscreen API está confirmada en runtime dentro del viewer embebido probado de Grid. Para entrar usa requestFullscreen() desde un gesto explícito del usuario; escucha fullscreenchange/fullscreenerror y usa exitFullscreen() para salida programática. No asumas entrada automática sin user activation.

PEOPLE DIRECTORY / LDAP
50. Para selectores de personas usa GET /api/v1/people/search. El texto escrito es solo una consulta; no lo trates como identidad validada.
51. En el runtime probado, people[].username coincide exactamente con LDAP conocido y puede persistirse como LDAP operativo cuando proviene de un resultado seleccionado del directorio.
52. No persistas ni exportes perfiles completos del directorio si solo necesitas el username; mantén nombre/email/puesto/departamento como datos efímeros de UI.
53. En Seguimientos Mandatorios los adjuntos se crean con `visibility=public` en Grid para evitar shares individuales. Esta visibilidad es independiente de `Compartido con`: quitar un LDAP de la solicitud no revoca el documento público. No describas `public` como acceso público de Internet sin evidencia runtime específica.

LOGOUT / CIERRE DE SESIÓN
54. Una app Grid puede cerrar la sesión del usuario cargando `https://login.adminml.com/logout?callbackURL=<URL-encoded https://grid.adminml.com>` en un iframe oculto (src asignado antes de insertarlo) y verificando el resultado con GET /api/v1/me (401/403/redirect = sesión cerrada; reintentar hasta 4 veces, 1.5 s entre intentos). Ver §16.23.
55. No declares éxito sin la verificación de /me; el `load` del iframe no prueba nada. Si la verificación falla o hay error de red, muestra error con reintento, nunca "Sesión cerrada".
56. Usa un modal propio de confirmación (sin confirm()) y, tras el cierre, una pantalla bloqueante sin botón de recargar (Okta no se renderiza embebido). Limpia el estado en memoria; no dependas de localStorage/sessionStorage.
57. Avisa al usuario que el cierre afecta a las demás apps con el mismo inicio de sesión (*.adminml.com). Probado solo con un usuario, un navegador y callbackURL=grid.adminml.com; el endpoint pertenece a la pasarela, no a Grid, y puede cambiar sin aviso.
```

