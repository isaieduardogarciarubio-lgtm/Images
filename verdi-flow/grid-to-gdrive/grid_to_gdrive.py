#!/usr/bin/env python3
"""Descarga un archivo de Grid (MercadoLibre) y lo sube a Google Drive.

Entradas (argumentos o variables de entorno):
  --grid-doc / GRID_DOC          URL (/d/<id>/view) o doc_id de Grid
  --folder-id / DRIVE_FOLDER_ID  Carpeta de Drive destino (opcional, por defecto "Mi unidad")
  --name / DRIVE_FILE_NAME       Nombre del archivo en Drive (opcional)

Secretos (solo variables de entorno):
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN

Salida: JSON en stdout con id, name y webViewLink del archivo creado en Drive.
Requiere estar en la VPN corporativa (Grid no usa headers de autenticación).
"""
import argparse
import json
import os
import re
import sys
import tempfile
from urllib.parse import unquote, urljoin

import requests

GRID_API = os.environ.get("GRID_API", "https://grid.melioffice.com")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"
ULID_RE = re.compile(r"\b([0-9A-HJKMNP-TV-Z]{26})\b", re.I)
TIMEOUT = 60


def log(msg):
    print(f"[grid-to-gdrive] {msg}", file=sys.stderr)


def extract_doc_id(value):
    """Acepta un doc_id (ULID) o una URL tipo https://grid.adminml.com/d/<id>/view."""
    m = re.search(r"/d/([0-9A-Za-z]+)", value) or ULID_RE.search(value)
    if not m:
        raise SystemExit(f"No pude extraer el doc_id de Grid de: {value!r}")
    return m.group(1)


def grid_get_json(path):
    r = requests.get(urljoin(GRID_API, path), timeout=TIMEOUT)
    if r.status_code == 401:
        raise SystemExit("Grid respondió 401: verifica que la VPN corporativa esté activa.")
    if r.status_code == 403:
        raise SystemExit("Grid respondió 403: no tienes permiso de lectura sobre ese documento.")
    r.raise_for_status()
    return r.json()


def filename_from_headers(resp):
    cd = resp.headers.get("Content-Disposition", "")
    m = re.search(r"filename\*=UTF-8''([^;]+)", cd, re.I)
    if m:
        return unquote(m.group(1))
    m = re.search(r'filename="?([^";]+)"?', cd, re.I)
    return m.group(1) if m else None


def grid_download(doc_id, dest_dir):
    """Descarga el documento de Grid a dest_dir. Devuelve (ruta, nombre, mimetype)."""
    info = grid_get_json(f"/api/v1/documents/{doc_id}/download")
    # Para archivos grandes Grid da una URL firmada de corta vida; si no, usa agent_download_url.
    url = info.get("object_storage_signed_url") or info.get("agent_download_url")
    if not url:
        raise SystemExit(f"Grid no devolvió URL de descarga: {info}")
    url = urljoin(GRID_API, url)
    if info.get("package_type") == "bundle_zip":
        log("El documento es un bundle (site/live): se subirá como .zip")

    tmp_path = os.path.join(dest_dir, "download.bin")
    with requests.get(url, stream=True, timeout=TIMEOUT) as r:
        r.raise_for_status()
        name = filename_from_headers(r)
        mimetype = r.headers.get("Content-Type", "application/octet-stream").split(";")[0]
        with open(tmp_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)
    if not name:
        meta = grid_get_json(f"/api/v1/documents/{doc_id}")
        name = meta.get("title") or meta.get("filename") or doc_id
    log(f"Descargado de Grid: {name} ({os.path.getsize(tmp_path)} bytes)")
    return tmp_path, name, mimetype


def google_access_token():
    missing = [k for k in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN")
               if not os.environ.get(k)]
    if missing:
        raise SystemExit(f"Faltan variables de entorno: {', '.join(missing)}")
    r = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "refresh_token": os.environ["GOOGLE_REFRESH_TOKEN"],
            "grant_type": "refresh_token",
        },
        timeout=TIMEOUT,
    )
    if not r.ok:
        raise SystemExit(f"No pude renovar el token de Google ({r.status_code}): {r.text}")
    return r.json()["access_token"]


def drive_upload(path, name, mimetype, folder_id=None):
    """Sube el archivo con carga reanudable (soporta archivos grandes)."""
    token = google_access_token()
    headers = {"Authorization": f"Bearer {token}"}
    metadata = {"name": name}
    if folder_id:
        metadata["parents"] = [folder_id]
    size = os.path.getsize(path)

    start = requests.post(
        DRIVE_UPLOAD_URL,
        params={"uploadType": "resumable", "supportsAllDrives": "true",
                "fields": "id,name,webViewLink,parents"},
        headers={**headers, "Content-Type": "application/json; charset=UTF-8",
                 "X-Upload-Content-Type": mimetype, "X-Upload-Content-Length": str(size)},
        data=json.dumps(metadata),
        timeout=TIMEOUT,
    )
    if not start.ok:
        raise SystemExit(f"Drive rechazó el inicio de la carga ({start.status_code}): {start.text}")
    session_url = start.headers["Location"]

    with open(path, "rb") as f:
        up = requests.put(session_url, data=f,
                          headers={"Content-Type": mimetype, "Content-Length": str(size)},
                          timeout=None)
    if not up.ok:
        raise SystemExit(f"Falló la carga a Drive ({up.status_code}): {up.text}")
    return up.json()


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--grid-doc", default=os.environ.get("GRID_DOC"))
    p.add_argument("--folder-id", default=os.environ.get("DRIVE_FOLDER_ID"))
    p.add_argument("--name", default=os.environ.get("DRIVE_FILE_NAME"))
    args = p.parse_args()
    if not args.grid_doc:
        p.error("Falta --grid-doc (o GRID_DOC)")

    doc_id = extract_doc_id(args.grid_doc)
    with tempfile.TemporaryDirectory() as tmp:
        path, name, mimetype = grid_download(doc_id, tmp)
        result = drive_upload(path, args.name or name, mimetype, args.folder_id)

    log(f"Subido a Drive: {result.get('webViewLink')}")
    print(json.dumps({"grid_doc_id": doc_id, **result}, ensure_ascii=False))


if __name__ == "__main__":
    main()
