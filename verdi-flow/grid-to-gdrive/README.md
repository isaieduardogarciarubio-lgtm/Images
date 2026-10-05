# Verdi Flows: Grid → Google Drive

Workflow importable (`grid-to-gdrive.workflow.json`) que descarga un documento de Grid y lo sube a Google Drive.

**Importar:** Verdi Flows → Create Workflow → menú `⋮` → *Import from file...*

```
Ejecución manual / Webhook → Parámetros → ¿Doc ID válido? → Grid - Pedir descarga
  → Resolver URL de descarga → ¿Descarga lista? → Grid - Descargar archivo
  → Drive - Subir archivo → Resultado (drive_url)
```

## Configuración tras importar
1. **Credencial de Grid** (Header Auth) en los nodos *Grid - Pedir descarga* y *Grid - Descargar archivo*.
2. **Credencial de Google Drive** en *Drive - Subir archivo*: Service Account (compartir la carpeta destino con el email de la SA) o Application Account OAuth2. En team projects no uses credenciales nominales.
3. En *Parámetros*: revisar `grid_base_url` y `skill_version` (Grid responde 426 si la versión está desactualizada).
4. Probar con *Ejecución manual* (pegar la URL o doc_id en `grid_doc`) y revisar *Executions*.

Webhook (POST): `{"grid_doc": "<url o doc_id>", "drive_folder_id": "<opcional>", "file_name": "<opcional>"}`

## Decisiones basadas en la Biblia
- Los Set llevan *Include Other Input Fields* (Bug 2); las expresiones empiezan con `=` (Bug 6).
- Se valida `ok == true` con un If, porque Grid responde HTTP 200 con `ok:false` (Bug 17).
- Referencias a `Parámetros` por nombre, porque el HTTP Request reemplaza `$json` (Bug 8).
- Sin Code node (algunas instancias solo tienen Python, Bug 14).
- Si un nodo se comporta raro tras importar, apagar/prender el Body y retipear la expresión a mano (Bug 7).

## Pendiente de verificar en la primera ejecución
- La ruta exacta de `agent_download_url` en la respuesta de `download_doc_id` (el nodo *Resolver URL de descarga* prueba varias rutas).
- Que el token de Grid tenga autorizado el endpoint `/engine/run/json` y la ruta `/d/{doc_id}`.
