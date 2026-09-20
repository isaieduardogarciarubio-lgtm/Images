# Incidente: documentos "perdidos" en Grid (listado e índice incompletos)

**Contexto:** detectado al usar un gestor de archivos HTML propio (`gestor-archivos.html`) construido sobre la API pública de Grid, durante una sesión con carga masiva de fotos (~1000+ archivos subidos en poco más de una hora).

## 1. Síntoma

Varios documentos —incluyendo algunos marcados como favoritos— dejaron de aparecer:

- en el listado de la interfaz **nativa** de Grid,
- en la búsqueda de Grid,
- y en cualquier app propia que consuma `GET /api/v1/documents`.

Sin embargo, cada documento afectado:

- se abre sin problema por su link directo (`/d/{doc_id}`),
- sigue correctamente ligado a su carpeta,
- y sus permisos/ownership están intactos.

Es decir: **el dato real no se perdió.** Lo que falla es la capa que decide qué mostrar en listados y búsquedas.

## 2. Diagnóstico

### 2.1 Pista en el propio contrato de la API

El inventario OpenAPI de Grid (sección "Documents") expone varios endpoints de mantenimiento que no tendrían razón de existir si el listado fuera una simple consulta directa a los documentos:

- `POST /api/v1/documents/sync-owner-kvs-listing`
- `POST /api/v1/documents/backfill-owner-index`
- `POST /api/v1/documents/rebuild-owner-index-from-kvs`
- `POST /api/v1/documents/rebuild-owner-index-from-dump`
- `GET /api/v1/documents/read-owner-index`
- `GET /api/v1/documents/diagnose-kvs`

La existencia de herramientas para "resincronizar", "reconstruir" y "diagnosticar" un índice por owner indica que `GET /api/v1/documents` (y por transitividad la búsqueda, que filtra sobre esos mismos datos) **no lee los documentos directamente**, sino una vista derivada — un índice por usuario que se puede desincronizar del store real, especialmente bajo cargas masivas o ráfagas de escritura.

### 2.2 Evidencia en runtime

Con la consola de depuración integrada en la app se confirmó, request por request:

- **La paginación de `/api/v1/documents` funciona correctamente.** El `cursor` que devuelve es literalmente `base64(offset)` (`MjA=` → `"20"`, `NDAw` → `"400"`, etc.), avanza de a 20 en 20, y el cliente para solo cuando deja de recibir items nuevos.
- **El índice está genuinamente incompleto.** Tras paginar hasta agotarlo, el listado devolvió **465 documentos**, muy por debajo de los 1000+ subidos en la misma sesión. `has_more` sigue devolviendo `true` indefinidamente incluso después de agotado — hay que ignorarlo y confiar en "dejó de traer items nuevos" como señal de fin real.
- **`diagnose-kvs` y `read-owner-index` no son usables desde el browser.** Ambos devuelven siempre:
  ```json
  {"error":"validation_error","detail":"query → owner_id: Field required"}
  ```
  probando múltiples valores de `owner_id` (`caller_id`, `ldap`, `username`, `email` — todos los campos disponibles en `GET /api/v1/me`). El error es idéntico sin importar el valor enviado, lo que indica que el parámetro **nunca llega al validador** — muy probablemente filtrado por un proxy/gateway delante del servicio para rutas de mantenimiento, no un problema de qué valor usar.
- **Los documentos "perdidos" siguen vivos en fuentes independientes del índice roto:**
  - `GET /api/v1/me/starred` y `GET /api/v1/me/recently-viewed` devolvieron `doc_id`s que no estaban en el listado principal, y que al pedirlos directo (`GET /api/v1/documents/{id}`) respondieron `200 OK`.
  - **El hallazgo clave:** `GET /api/v1/folders/{folder_id}` de una carpeta puntual devolvió **16964 bytes**, muy por encima de las ~450 bytes típicas de las demás carpetas. Ese payload resultó ser un array de `doc_id` "pelados" (strings sueltos tipo ULID, sin envolver en objetos) embebido en la metadata de la carpeta — el vínculo carpeta↔documento sigue intacto y es una fuente de datos completamente distinta al índice general roto.
- **Rate limiting bajo validación masiva:** al confirmar cientos de candidatos uno por uno contra `GET /api/v1/documents/{id}`, Grid empezó a responder `429 rate_limit_exceeded` con `retry_after` (~29-30s). El primer intento de manejo lo trataba igual que cualquier error y **descartaba documentos reales como si no existieran** — un falso negativo que había que corregir.

## 3. Causa raíz (resumen)

`GET /api/v1/documents` (y la búsqueda) se alimentan de un **índice por owner derivado**, no del store real de documentos. Bajo escritura masiva en poco tiempo, ese índice no se actualiza para todos los documentos — algunos quedan indexados solo en estructuras separadas (favoritos, recientes, o el vínculo directo con su carpeta) pero no en el índice general que alimenta listado y búsqueda. Es un problema del lado de Grid, no de permisos, no de la app, y no de los links de los documentos.

## 4. Solución implementada

No hay forma de arreglar el índice de Grid desde el cliente (los endpoints de reparación no son usables desde el browser, ver 2.2). En su lugar se construyó una herramienta de **recuperación por cruce de fuentes**: `gestor-archivos.html`.

### 4.1 Qué hace

1. **Carga el índice actual** (`/api/v1/documents` + `/api/v1/folders`, paginado) como línea base de "lo que Grid sí muestra hoy".
2. **Consulta fuentes alternativas** que no dependen del mismo índice:
   - Favoritos (`/me/starred`)
   - Recientes (`/me/recently-viewed`)
   - Metadata de cada carpeta (`/folders/{id}`) — la fuente que más aportó
   - Búsqueda de texto opcional (`/api/v1/search`)
   - `diagnose-kvs` / `read-owner-index` (se intentan, aunque en la práctica no responden)
3. **Extrae candidatos a `doc_id`** de esas respuestas con un escáner genérico que reconoce tanto objetos con clave `id`/`doc_id` como strings sueltos con forma de ULID dentro de arrays (necesario porque la metadata de carpeta guarda los vínculos así).
4. **Descarta los que ya están en el índice actual** y valida cada candidato restante contra `GET /api/v1/documents/{id}` — si Grid responde con la metadata real, es un documento recuperado de verdad; si no, se descarta.
5. **Lista cada documento recuperado** con su nombre, carpeta real y un link directo para abrirlo en Grid (`/d/{doc_id}`).
6. **Exporta todo a CSV** (`doc_id`, `título`, `carpeta_id`, `carpeta`) para tener un registro descargable de la corrida.

### 4.2 Salvaguardas agregadas en el camino

- **Timeout duro por request** (20s): antes, si Grid nunca respondía, la app se quedaba cargando para siempre.
- **Gate global de rate limit:** al recibir `429`, se lee el `retry_after` real que manda Grid (del header o del body JSON) y se usa como pausa global para *todas* las requests siguientes; la request que disparó el límite se reintenta sola en vez de descartarse como inexistente.
- **Consola de depuración visible en la app** (🐞): loguea cada request con método, URL, duración y resultado, y el detalle página por página de la paginación — imprescindible para llegar a este diagnóstico sin acceso a los logs del backend de Grid.

## 5. Resultado

Usando esta herramienta se recuperaron exitosamente múltiples documentos que no aparecían ni en la interfaz nativa de Grid ni en la búsqueda, confirmando la hipótesis de la sección 3.

## 6. Limitaciones y qué sigue sin arreglarse

- **No arregla la interfaz nativa de Grid ni su índice real.** Los documentos siguen sin aparecer ahí; esta herramienta es un rodeo (workaround) del lado del cliente, no un fix del backend.
- **La recuperación es por sesión.** Si se recarga la página, hay que volver a correr el análisis — lo único que persiste es el CSV que se descargue.
- **`diagnose-kvs` y `read-owner-index` quedan sin uso real** hasta que alguien con acceso server-side (o el equipo de Grid) confirme el mecanismo correcto para pasarles `owner_id`, o hasta que se habilite ese parámetro para sesiones de browser.
- **Cobertura no garantizada al 100%.** Solo se recuperan documentos que aparecen en alguna de las fuentes consultadas (favoritos, recientes, metadata de carpetas propias, o texto buscado). Un documento perdido que además no esté en ninguna de esas fuentes seguiría sin poder detectarse por este método.

## 7. Recomendación

Reportar al equipo de plataforma de Grid, adjuntando esta evidencia:

1. El índice que alimenta `GET /api/v1/documents` (y la búsqueda) se desincroniza bajo cargas masivas de escritura en poco tiempo.
2. Los endpoints de reparación (`sync-owner-kvs-listing`, `backfill-owner-index`, `rebuild-owner-index-from-*`, `diagnose-kvs`, `read-owner-index`) no son accesibles/funcionales desde una sesión de browser normal — si están pensados como self-service, algo en el camino (gateway/proxy) está bloqueando el parámetro `owner_id`.
3. `GET /api/v1/folders/{folder_id}` es, hoy, la fuente más confiable para reconstruir qué documentos pertenecen realmente a una carpeta — más confiable que el índice general.
