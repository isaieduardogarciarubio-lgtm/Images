# QA Harness — Permisos de Carpetas en Grid (Folders API)

Herramienta HTML autocontenida para validar empíricamente el manejo de permisos
sobre carpetas nativas de Grid (`/api/v1/folders/*`), siguiendo el patrón de
"QA Harness dedicado" descrito en la Biblia de Desarrollo en Grid V11.4
(Sección 13 y Ronda 6).

## Qué prueba

**Suite A — Dueño (automática, un solo usuario):**

1. Crear carpeta (`POST /folders`) y leer su detalle (`GET /folders/{id}`).
2. Compartir como **viewer** y verificar que el ACL lo refleja (`shared_with`
   sin aparecer en `editors`).
3. Chequeo informativo del bug conocido de no-deduplicación de
   `shared_with`/`editors` cuando se comparte con un email que Grid resuelve
   a LDAP (Sección 13, V11.3).
4. Promover ese mismo usuario a **editor** (solo el owner puede) y verificar
   que el ACL se actualiza.
5. Renombrar la carpeta como owner (`PATCH`).
6. Reemplazar el ACL completo (`PUT /permissions`, owner only).
7. Límite de nesting: crea carpetas anidadas hasta que el servidor rechace el
   6º nivel, y valida el contrato exacto del error
   (`HTTP 422 {"error":"folder_depth_limit","limit":5}`).
8. Asociación documento↔carpeta (opcional, requiere un `doc_id` descartable):
   agregar documento, verificar `folder_id` en su metadata, moverlo a una
   segunda carpeta y confirmar que se desvincula automáticamente de la
   primera (un doc pertenece a una sola carpeta a la vez).

**Suite B — Colaborador (permisos negativos, requiere una segunda cuenta
LDAP):** la persona con quien se compartió la carpeta en la Suite A abre este
mismo HTML en **su propia sesión** de Grid, pega el `folder_id` que le pasó
el dueño, indica su rol (`viewer` o `editor`) y corre la suite. Se espera
`HTTP 403` en toda operación que su rol no permite (leer ACL, renombrar,
compartir, promover, reemplazar ACL, borrar la carpeta) — esto es lo único
que confirma que las restricciones de rol se aplican de verdad y no solo que
el owner puede hacer todo.

## Cómo correrlo

Grid impone origen único por cookies/CORS (`grid.adminml.com` y
`grid.melioffice.com` son orígenes distintos — ver Reglas de Oro de la
Biblia), así que **el harness debe correr servido desde el propio dominio de
Grid**, no abierto localmente desde `file://`.

1. Subí `grid_folder_permissions_harness.html` a Grid como cualquier otro
   documento HTML (Grid Uploader / `POST /api/v1/engine/run`).
2. Abrí el documento resultante en el viewer de Grid — el campo "Base URL"
   se autocompleta con `location.origin`, no hace falta tocarlo.
3. (Opcional) Completá un `doc_id` propio y descartable si querés correr los
   tests de asociación documento↔carpeta.
4. Completá el LDAP o email de un segundo usuario si querés correr los tests
   de sharing/roles de la Suite A.
5. Click en **"Correr Suite A completa"**.
6. Pasale el `folder_id` que aparece en el resultado del test A1 a la persona
   que vas a usar para la Suite B (por Slack, por ejemplo). Esa persona sube
   el mismo HTML (o usa la misma copia ya subida) y corre la Suite B desde su
   propia sesión.
7. Click en **"Limpiar carpetas de prueba"** al terminar — desvincula
   documentos y borra (soft-delete) todas las carpetas `QA_HARNESS_*`
   creadas durante la corrida.
8. Descargá el reporte (Markdown o JSON) para adjuntarlo o para actualizar la
   Biblia con una nueva ronda de validación.

## Advertencias de seguridad

- El borrado de una carpeta en Grid es **recursivo y también soft-elimina
  los documentos que contiene** (`DELETE /folders/{id}` → "carpeta +
  subcarpetas + documentos"). Por eso el harness siempre desvincula el
  documento de prueba (`DELETE /folders/{id}/documents/{doc_id}`) antes de
  borrar la carpeta — nunca uses un documento importante como `doc_id` de
  prueba, usá siempre uno descartable.
- Los objetos creados llevan el prefijo `QA_HARNESS_` para poder
  identificarlos y limpiarlos fácilmente si algo falla a mitad de corrida.
- No usa `localStorage`/`sessionStorage`/`document.cookie` ni CDNs externos,
  y evita `alert`/`confirm` nativos (reemplazados por un modal propio), en
  línea con las reglas de despliegue de HTMLs en Grid.

## Alcance no cubierto en esta ronda

Por decisión explícita del pedido inicial, esta ronda se enfocó en CRUD +
roles básicos de carpetas. Quedan fuera (se pueden agregar en una siguiente
iteración si hace falta):

- Límite de 500 documentos por carpeta.
- `POST /folders/{id}/move` y su protección *cycle-safe*.
- Interacción de permisos de carpeta con Workspaces (Sección 18) o con
  Checkout Lock (Sección 19) sobre documentos dentro de una carpeta.
