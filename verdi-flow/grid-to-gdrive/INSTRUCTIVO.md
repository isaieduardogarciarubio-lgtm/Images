# Instructivo: Hoja de Sheets → Grid → Google Drive → Hoja (nodo por nodo)

Lee de un Google Sheet los `doc_id` de Grid pendientes, sube cada archivo a Drive y escribe el enlace de Drive en la misma fila; con el enlace escrito la fila deja de ser pendiente.
Las expresiones se escriben **a mano** en modo *Expression* (no pegadas) y empiezan con `=` o `{{`.

## La hoja
Una pestaña con encabezados en la fila 1 (nombres exactos, en minúscula):

| doc_id | enlace_drive | estado |
|---|---|---|
| `https://grid.adminml.com/d/01J.../view` o `01J...` | (vacío) | (vacío) |

- **Pendiente** = `doc_id` lleno y `enlace_drive` **y** `estado` vacíos.
- Éxito: el flujo escribe el enlace en `enlace_drive` y `ok` en `estado`.
- Error: el flujo escribe `error` en `estado` (así no reintenta para siempre ni duplica subidas). Para reintentar, borra `estado`.
- Si tienes una pestaña con `FILTER` que ya calcula pendientes, léela en vez de filtrar en n8n y borra *Filtrar pendientes*.

## Orden final
```
[Ejecución manual] ─┐
                    ├→ Leer Hoja → Filtrar pendientes → Limitar lote → Parámetros → ¿Doc ID válido?
[Cada 5 minutos] ───┘
  ─sí→ Grid - Pedir descarga → Resolver URL de descarga → ¿Descarga lista? ─sí→ Grid - Descargar archivo
       → Drive - Subir archivo → Escribir enlace en Hoja
  Cualquier fallo (no válido, error de Grid/Drive, ok=false) → Marcar error en Hoja
```

## 1. Ejecución manual / 2. Cada 5 minutos (triggers)
1. **Trigger manually** (sin configuración, para probar).
2. **Schedule Trigger** → Interval: *Minutes*, cada `5`.
3. Ambos se conectan a *Leer Hoja*.

## 3. Leer Hoja (Google Sheets)
1. Nodo **Google Sheets** → Resource *Sheet Within Document* → Operation **Get Row(s)**.
2. Credencial de Google (Service Account con el Sheet compartido con su email, o Application Account OAuth2).
3. **Document:** By ID → ID del Sheet. **Sheet:** By Name → tu pestaña.
4. Sin filtros. Una sola lectura por ejecución evita el 429 de cuota (Bug 11); si aparece, activa *Retry On Fail* con espera ≥ 65000 ms.
5. Cada item trae además `row_number`, que usaremos para escribir de vuelta.

## 4. Filtrar pendientes (Filter)
Tres condiciones con **AND**, *Type Validation:* Loose:
1. `{{ $json.doc_id }}` → String → **is not empty**
2. `{{ $json.enlace_drive }}` → String → **is empty**
3. `{{ $json.estado }}` → String → **is empty**

## 5. Limitar lote (Limit)
**Max Items:** `20`. Evita que una corrida dure más que los 5 minutos y se solape con la siguiente duplicando subidas (Bug 10).

## 6. Parámetros (Edit Fields / Set)
**Include Other Input Fields** ON. Campos:

| Name | Type | Value |
|---|---|---|
| `grid_base_url` | String | `http://grid.melisystems.com` (el mismo host que usas en tu flujo de fotos) |
| `skill_version` | String | `3.6.5` |
| `drive_folder_id` | String | ID de la carpeta destino de Drive (vacío = raíz) |
| `row_number` | Number | `={{ $json.row_number }}` |
| `grid_doc` | String | `={{ $json.doc_id }}` |
| `doc_id` | String | `={{ (String($json.doc_id \|\| '').match(/[0-9A-Za-z]{26}/) \|\| [''])[0] }}` |

(`\|\|` es escape de Markdown; en n8n se escribe `||`.)

**Sobre `skill_version`:** el campo es obligatorio en cada llamada al motor de Grid; no se puede omitir. Como en tus otros flujos (`skill_version: '3.6.5'`), el body del nodo 8 lleva también `skip_version_check: true`, para que Grid no responda 426 cuando la versión de la skill cambie. Contrapartida: el flujo seguirá corriendo con una versión desactualizada sin avisar; si quieres que falle al desactualizarse, quita `skip_version_check` y mantén `skill_version` al día (`GET https://grid.melioffice.com/skill/version?current_version=3.6.5`).

## 7. ¿Doc ID válido? (If)
`{{ $json.doc_id }}` → String → **is not empty**. True → *Grid - Pedir descarga*; False → *Marcar error en Hoja*.

## 8. Grid - Pedir descarga (HTTP Request)
1. **POST**, URL `={{ $json.grid_base_url }}/api/v1/engine/run/json`. Sin archivo, Grid exige la ruta `/json`; `/engine/run` (multipart) responde **422 "Invalid JSON body"** si no hay `file`.
2. Authentication: *Generic Credential Type* → **Bearer Auth** (la misma credencial que usa *Subir a Grid*).
3. **Send Body** ON → Body Content Type **JSON** → Specify Body **Using JSON**, tipeado a mano (con `=` antes de las llaves dobles — Bug 6):
   `={{ { "skill_version": $json.skill_version, "skip_version_check": true, "download_doc_id": $json.doc_id } }}`
4. **Settings → On Error: Continue (using error output)**. Éxito → Resolver URL; error → Marcar error en Hoja.
5. Si responde 403/404 en esa ruta, el gateway no la tiene autorizada para tu token (Bug 23): hay que pedir que habiliten `/api/v1/engine/run/json`.
6. Si ves 422 "body: Field required", suele ser `doc_id` `undefined` (JSON.stringify elimina la clave, Bug 6).

## 9. Resolver URL de descarga (Set)
**Include Other Input Fields** ON. Campo String `download_url`:
```
={{ (function(){ var d = $json.data || {}; var u = (d.download && d.download.agent_download_url) || d.agent_download_url || $json.agent_download_url || ''; if (!u) return ''; return u.indexOf('http') === 0 ? u : $('Parámetros').item.json.grid_base_url + u; })() }}
```
Pendiente de confirmar dónde viene `agent_download_url` en la respuesta; en la primera prueba míralo en *Executions*.

## 10. ¿Descarga lista? (If)
AND: `{{ $json.ok }}` Boolean **is true** (Grid responde 200 aunque `ok` sea false — Bug 17) y `{{ $json.download_url }}` String **is not empty**. True → *Grid - Descargar archivo*; False → *Marcar error en Hoja*.

## 11. Grid - Descargar archivo (HTTP Request)
**GET**, URL `={{ $json.download_url }}`, misma credencial **Bearer Auth**. Options → Response → Format **File**, Put Output in Field `data`. Sin Batching (Bug 16). **On Error: Continue (using error output)**; error → *Marcar error en Hoja*.

## 12. Drive - Subir archivo (Google Drive)
1. **File → Upload**. Credencial Service Account (carpeta compartida con su email) o Application Account OAuth2.
2. **Input Data Field Name:** `data`.
3. **File Name:** `={{ $binary.data.fileName || $('Parámetros').item.json.doc_id }}`
4. **Drive:** My Drive. **Parent Folder:** By ID → `={{ $('Parámetros').item.json.drive_folder_id || 'root' }}`
5. **On Error: Continue (using error output)**; error → *Marcar error en Hoja*.

## 13. Escribir enlace en Hoja (Google Sheets)
Este es el paso que saca la fila de pendientes.
1. **Google Sheets → Update Row**, mismo Document y Sheet que *Leer Hoja*.
2. **Column to match on:** `row_number`.
3. **Values to Send** (Map Each Column Manually):

| Columna | Valor |
|---|---|
| `row_number` | `={{ $('Parámetros').item.json.row_number }}` |
| `enlace_drive` | `={{ 'https://drive.google.com/file/d/' + $json.id + '/view' }}` |
| `estado` | `ok` |

Se usa `$json.id` porque aquí `$json` es la respuesta de Drive; los datos anteriores se leen por nombre de nodo (Bug 8).

## 14. Marcar error en Hoja (Google Sheets)
Igual que el 13 pero solo dos columnas: `row_number` = `={{ $('Parámetros').item.json.row_number }}` y `estado` = `error`. Recibe las salidas de error de los nodos 7, 8, 10, 11 y 12.

---

## Probar y publicar
1. Agrega 1–2 filas de prueba con `doc_id` reales y corre **Test workflow**.
2. Verifica en la hoja que aparezca el enlace y `ok`, y que al correr otra vez esa fila ya no se procese.
3. Crea una versión y publica con el Publish wizard (crea las credenciales de producción en el paso 2; en team lo aprueba un project admin distinto de ti).

## Errores frecuentes
| Síntoma | Causa probable |
|---|---|
| Todas las filas terminan en `error` | Revisa *Executions*: 401 (VPN/credencial), 426 (`skill_version`), o ruta de `agent_download_url` |
| Una fila queda en `error` | Doc sin permiso, doc_id mal escrito o archivo corrupto; corrige y borra `estado` |
| No lee ninguna fila | Encabezados distintos a `doc_id`/`enlace_drive`/`estado` (distingue mayúsculas, Bug 9) |
| Update no escribe | Credencial de Sheets sin permiso de edición sobre el Sheet |
| `body: Field required` | Falta `=` en el JSON o `doc_id` es `undefined` (Bugs 6-7) |
