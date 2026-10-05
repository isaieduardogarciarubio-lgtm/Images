"""Prueba end-to-end con un servidor local que simula Grid y Google (sin red real)."""
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import grid_to_gdrive as g

DOC_ID = "01JXYZABCDEFGHJKMNPQRSTVWX"
PAYLOAD = b"col1,col2\n1,2\n" * 1000
uploaded = {}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, obj, code=200, headers=None):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == f"/api/v1/documents/{DOC_ID}/download":
            self._json({"agent_download_url": f"/d/{DOC_ID}?dl=1", "package_type": "single_file"})
        elif self.path.startswith(f"/d/{DOC_ID}"):
            self.send_response(200)
            self.send_header("Content-Type", "text/csv")
            self.send_header("Content-Disposition", "attachment; filename=\"reporte.csv\"")
            self.send_header("Content-Length", str(len(PAYLOAD)))
            self.end_headers()
            self.wfile.write(PAYLOAD)
        else:
            self._json({"error": "nf"}, 404)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n)
        if self.path == "/token":
            assert b"refresh_token=RT" in body
            self._json({"access_token": "AT"})
        elif self.path.startswith("/upload/drive/v3/files"):
            assert self.headers["Authorization"] == "Bearer AT"
            uploaded["meta"] = json.loads(body)
            port = self.server.server_port
            self._json({}, headers={"Location": f"http://127.0.0.1:{port}/session/1"})

    def do_PUT(self):
        n = int(self.headers.get("Content-Length", 0))
        uploaded["bytes"] = self.rfile.read(n)
        self._json({"id": "DRIVE123", "name": uploaded["meta"]["name"], "webViewLink": "https://drive/x"})


def test_flow(tmp_path, capsys):
    srv = HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}"
    g.GRID_API = base
    g.GOOGLE_TOKEN_URL = f"{base}/token"
    g.DRIVE_UPLOAD_URL = f"{base}/upload/drive/v3/files"
    os.environ.update(GOOGLE_CLIENT_ID="c", GOOGLE_CLIENT_SECRET="s", GOOGLE_REFRESH_TOKEN="RT")

    assert g.extract_doc_id(f"https://grid.adminml.com/d/{DOC_ID}/view") == DOC_ID
    assert g.extract_doc_id(DOC_ID) == DOC_ID

    path, name, mime = g.grid_download(DOC_ID, str(tmp_path))
    assert (name, mime) == ("reporte.csv", "text/csv")
    res = g.drive_upload(path, name, mime, folder_id="FOLDER1")
    assert res["webViewLink"] == "https://drive/x"
    assert uploaded["meta"] == {"name": "reporte.csv", "parents": ["FOLDER1"]}
    assert uploaded["bytes"] == PAYLOAD
    srv.shutdown()
