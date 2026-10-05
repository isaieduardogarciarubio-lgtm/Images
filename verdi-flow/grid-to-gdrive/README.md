# Verdi Flows: Hoja de Sheets → Grid → Google Drive → Hoja

Workflow importable (`grid-to-gdrive.workflow.json`) que toma los `doc_id` pendientes de un Google Sheet, sube cada archivo de Grid a Drive y escribe el enlace de Drive en la misma fila (así deja de ser pendiente).

- Instructivo nodo por nodo: [`INSTRUCTIVO.md`](INSTRUCTIVO.md)
- Importar: Verdi Flows → Create Workflow → `⋮` → *Import from file...*
- Tras importar: asignar credenciales (Grid Bearer Auth, Google Drive, Google Sheets), poner el ID del Sheet y pestaña en los 3 nodos de Sheets, y revisar `skill_version` (obligatoria, no se puede omitir; el flujo usa `3.6.5` con `skip_version_check: true`).
- Pendiente de verificar en la primera ejecución: ruta de `agent_download_url` en la respuesta de Grid y que el token tenga autorizados `/engine/run/json` y `/d/{doc_id}`.
