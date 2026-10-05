# Instructivo: armar el flujo Grid → Google Drive nodo por nodo

Sirve para construir el workflow a mano en Verdi Flows (o para corregir un nodo si el import falla).
Todas las expresiones se escriben **a mano** en el campo con modo *Expression* (no pegadas), y siempre empiezan con `=` o `{{`.

**Antes de empezar:** Verdi Flows → *Create Workflow* → ponle nombre `Grid → Google Drive` (al guardar el nombre queda bloqueado para ti si es un proyecto de equipo).

Orden final:
```
[Ejecución manual] ─┐
                    ├→ Parámetros → ¿Doc ID válido? ─sí→ Grid - Pedir descarga → Resolver URL de descarga
[Webhook] ──────────┘                       └no→ Error: Doc ID inválido
  → ¿Descarga lista? ─sí→ Grid - Descargar archivo → Drive - Subir archivo → Resultado
                     └no→ Error: Grid no devolvió descarga
```

---

## 1. Ejecución manual (trigger)
1. *+Add first step* → buscar **Trigger manually**.
2. Sin configuración. Sirve para probar con *Test workflow*.

## 2. Webhook (trigger)
1. Botón `+` → buscar **Webhook**.
2. **HTTP Method:** `POST`. **Path:** `grid-a-drive`. **Respond:** por defecto.
3. Body esperado (todo opcional salvo `grid_doc`):
   ```json
   {"grid_doc": "https://grid.adminml.com/d/<id>/view", "drive_folder_id": "<carpeta>", "file_name": "reporte.csv"}
   ```
4. Los dos triggers se conectan al mismo nodo *Parámetros*.

## 3. Parámetros (Edit Fields / Set)
1. Agregar nodo **Edit Fields (Set)**; renombrar a `Parámetros`.
2. **Mode:** Manual Mapping. Activar **Include Other Input Fields** (si no, se pierden los demás campos — Bug 2).
3. Agregar 6 campos, todos tipo *String*:

| Name | Value |
|---|---|
| `grid_base_url` | `https://grid.melioffice.com` |
| `skill_version` | `3.6.3` |
| `grid_doc` | `={{ ($json.body && $json.body.grid_doc) \|\| 'PEGAR_URL_O_DOC_ID_DE_GRID' }}` |
| `doc_id` | `={{ (String(($json.body && $json.body.grid_doc) \|\| 'PEGAR_URL_O_DOC_ID_DE_GRID').match(/[0-9A-Za-z]{26}/) \|\| [''])[0] }}` |
| `drive_folder_id` | `={{ ($json.body && $json.body.drive_folder_id) \|\| '' }}` |
| `file_name` | `={{ ($json.body && $json.body.file_name) \|\| '' }}` |

(En la tabla `\|\|` es solo escape de Markdown: en n8n se escribe `||`.)

Para pruebas manuales, reemplaza `PEGAR_URL_O_DOC_ID_DE_GRID` por la URL o doc_id real. El `doc_id` es el ULID de 26 caracteres de la URL `/d/<id>/view`.

## 4. ¿Doc ID válido? (If)
1. Nodo **If**. Condición: valor `{{ $json.doc_id }}` → tipo *String* → **is not empty**.
2. Salida **true** → *Grid - Pedir descarga*. Salida **false** → *Error: Doc ID inválido*.

## 5. Error: Doc ID inválido (Stop and Error)
1. Nodo **Stop and Error**, *Error Type:* Error Message.
2. Mensaje: `={{ 'No pude extraer un doc_id de Grid (26 caracteres) de: ' + $json.grid_doc }}`

## 6. Grid - Pedir descarga (HTTP Request)
1. Nodo **HTTP Request**.
2. **Method:** `POST`. **URL:** `={{ $json.grid_base_url }}/api/v1/engine/run/json`
3. **Authentication:** *Generic Credential Type* → *Header Auth* → crear/seleccionar la credencial con el token de Grid.
4. **Send Body:** ON. **Body Content Type:** JSON. **Specify Body:** Using JSON.
5. **JSON** (tipéalo a mano, con el `=` antes de las llaves dobles — Bug 6):
   ```
   ={{ { "skill_version": $json.skill_version, "download_doc_id": $json.doc_id } }}
   ```
6. Requiere VPN/red de MeLi. Un 426 significa que `skill_version` está desactualizada.

## 7. Resolver URL de descarga (Set)
1. Nodo **Edit Fields (Set)**, **Include Other Input Fields** ON.
2. Un campo *String* `download_url`:
   ```
   ={{ (function(){ var d = $json.data || {}; var u = (d.download && d.download.agent_download_url) || d.agent_download_url || $json.agent_download_url || ''; if (!u) return ''; return u.indexOf('http') === 0 ? u : $('Parámetros').item.json.grid_base_url + u; })() }}
   ```
   Prueba varias rutas porque no está confirmado dónde viene `agent_download_url`. Si la primera ejecución falla aquí, abre *Executions*, mira la respuesta de *Grid - Pedir descarga* y ajusta la ruta.

## 8. ¿Descarga lista? (If)
Dos condiciones con **AND** (Grid responde HTTP 200 aunque `ok` sea false — Bug 17):
1. `{{ $json.ok }}` → tipo *Boolean* → **is true**.
2. `{{ $json.download_url }}` → *String* → **is not empty**.

True → *Grid - Descargar archivo*. False → *Error: Grid no devolvió descarga*.

## 9. Error: Grid no devolvió descarga (Stop and Error)
Mensaje: `={{ 'Grid respondió sin URL de descarga o con ok=false: ' + JSON.stringify($('Grid - Pedir descarga').item.json) }}`

## 10. Grid - Descargar archivo (HTTP Request)
1. **Method:** `GET`. **URL:** `={{ $json.download_url }}`
2. **Authentication:** la misma credencial Header Auth de Grid.
3. **Options → Add option → Response** → **Response Format:** `File`, **Put Output in Field:** `data`.
4. No actives *Batching* (Bug 16).

## 11. Drive - Subir archivo (Google Drive)
1. Nodo **Google Drive** → Resource **File** → Operation **Upload**.
2. **Credential:** Service Account (compartir antes la carpeta destino con el email de la SA) o Application Account OAuth2. En proyectos de equipo no uses credenciales nominales.
3. **Input Data Field Name:** `data`.
4. **File Name:**
   ```
   ={{ $('Parámetros').item.json.file_name || $binary.data.fileName || $('Parámetros').item.json.doc_id }}
   ```
5. **Drive:** My Drive. **Parent Folder:** modo *By ID* →
   `={{ $('Parámetros').item.json.drive_folder_id || 'root' }}`
6. Si el nombre debe llevar extensión y Grid no la manda, ponla en `file_name` (Drive no la deduce del contenido — Bug 21).

## 12. Resultado (Set)
1. Nodo **Edit Fields (Set)**, **Include Other Input Fields** OFF (solo queremos la salida limpia).
2. Campos *String*:

| Name | Value |
|---|---|
| `drive_file_id` | `={{ $json.id }}` |
| `drive_file_name` | `={{ $json.name }}` |
| `drive_url` | `={{ 'https://drive.google.com/file/d/' + $json.id + '/view' }}` |
| `grid_doc_id` | `={{ $('Parámetros').item.json.doc_id }}` |

---

## Probar y publicar
1. Pon una URL/doc_id real en *Parámetros* y pulsa **Test workflow**.
2. Si algo falla, revisa *Executions* nodo por nodo (inputs/outputs).
3. Crea una versión (*Version → Create Version*) y publica con el **Publish wizard**: crea las credenciales de producción en el paso 2 y, en team, pide a un project admin distinto de ti que apruebe.

## Errores frecuentes
| Síntoma | Causa probable |
|---|---|
| 401 en nodos Grid | Sin VPN o credencial mal asignada |
| 403 | No tienes permiso de lectura sobre el doc, o el gateway no autoriza esa ruta para tu token |
| 426 | `skill_version` desactualizada |
| `body: Field required` | Falta el `=` al inicio del JSON o `doc_id` quedó `undefined` (Bugs 6-7) |
| Drive: 404 / "File not found" con carpeta válida | Carpeta no compartida con la Service Account, o espacio de más en la expresión (Bug 3) |
| Campo vacío sin error | Revisar mayúsculas/minúsculas del nombre (Bug 9) |
