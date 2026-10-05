# Verdi Flows: Hoja de Sheets → Grid → Google Drive → Hoja

Workflow importable (`grid-to-gdrive.workflow.json`) que toma los `doc_id` pendientes de un Google Sheet, sube cada archivo de Grid a Drive y escribe el enlace de Drive en la misma fila (así deja de ser pendiente).

- Instructivo nodo por nodo: [`INSTRUCTIVO.md`](INSTRUCTIVO.md)
- Importar: Verdi Flows → Create Workflow → `⋮` → *Import from file...*
- Tras importar: asignar credenciales (Grid Bearer Auth, Google Drive, Google Sheets), poner el ID del Sheet y pestaña en los 3 nodos de Sheets.
- Pendiente de verificar en la primera ejecución: que el token de Grid tenga autorizada la ruta `GET /d/{doc_id}` en el gateway. El flujo ya no usa `/engine/run` ni `skill_version`.
