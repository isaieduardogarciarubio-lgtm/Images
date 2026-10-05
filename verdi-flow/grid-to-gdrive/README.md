# Flujo Verdi Flow: Grid → Google Drive

Descarga un documento de Grid y lo sube a una carpeta de Google Drive.

- `grid_to_gdrive.py`: lógica del flujo (solo requiere `requests`).
- `flow.yaml`: definición del paso para Verdi Flow (ajustar a su esquema).
- `test_grid_to_gdrive.py`: prueba con servidores simulados (no usa red real).

## Uso

```bash
pip install -r requirements.txt
export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=...
python grid_to_gdrive.py --grid-doc "https://grid.adminml.com/d/<doc_id>/view" --folder-id <carpeta_drive>
```

Imprime en stdout un JSON con `id`, `name` y `webViewLink` del archivo en Drive.

## Requisitos

- **VPN corporativa activa**: Grid no usa tokens; la identidad se resuelve en el edge. Un 401 significa VPN caída.
- El usuario debe tener permiso de lectura sobre el documento de Grid (403 si no).
- Los bundles `site`/`live` se descargan como `.zip`.

## OAuth de Google (una sola vez)

1. En Google Cloud Console crea un cliente OAuth (tipo "Desktop app") y habilita la Drive API.
2. Obtén un refresh token con scope `https://www.googleapis.com/auth/drive.file`
   (solo permite acceder a archivos creados por esta app; si necesitas subir a una carpeta
   que ya existe y no creó la app, usa `https://www.googleapis.com/auth/drive`).
   Puedes usar el [OAuth Playground](https://developers.google.com/oauthplayground) con tu propio client_id/secret,
   marcando "Use your own OAuth credentials" y "access_type=offline".
3. Guarda los tres valores como secretos de Verdi Flow; nunca los pongas en el repositorio.
