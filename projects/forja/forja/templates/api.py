"""Molde 'api': un servidor HTTP minimo (stdlib) con un endpoint real /health."""

README = """# __NAME__

API generada por Forja usando solo la libreria estandar de Python -- sin
dependencias externas. Expone un endpoint /health que responde de verdad.

```bash
python server.py
curl http://localhost:8000/health
```
"""

SERVER = '''"""__NAME__ -- servidor HTTP minimo con /health, sin dependencias externas."""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            cuerpo = json.dumps({"status": "ok"}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


def run(port=8000):
    server = HTTPServer(("localhost", port), Handler)
    print(f"__NAME__ escuchando en http://localhost:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
'''

TEST_SERVER = '''"""Tests reales del molde api: levanta el servidor y le pega con una request real."""
import json
import sys
import threading
import unittest
import urllib.request
from http.server import HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server import Handler


class TestServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("localhost", 0), Handler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join()

    def test_health_responde_ok(self):
        with urllib.request.urlopen(f"http://localhost:{self.port}/health") as respuesta:
            cuerpo = json.loads(respuesta.read())
            self.assertEqual(respuesta.status, 200)
            self.assertEqual(cuerpo, {"status": "ok"})

    def test_ruta_desconocida_404(self):
        try:
            urllib.request.urlopen(f"http://localhost:{self.port}/nope")
            self.fail("deberia haber lanzado HTTPError 404")
        except Exception as e:
            self.assertEqual(getattr(e, "code", None), 404)


if __name__ == "__main__":
    unittest.main()
'''


def files(nombre, pkg):
    return {
        "README.md": README.replace("__NAME__", nombre),
        "server.py": SERVER.replace("__NAME__", nombre),
        "tests/test_server.py": TEST_SERVER,
    }
