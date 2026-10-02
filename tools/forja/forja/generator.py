"""Nucleo de Forja: renderiza un molde y escribe/verifica el proyecto resultante."""
import importlib
import re
import shutil
import subprocess
import sys
from pathlib import Path

TEMPLATES_PKG = "forja.templates"


def _nombre_paquete(nombre: str) -> str:
    pkg = re.sub(r"[^0-9a-zA-Z_]", "_", nombre)
    if pkg and pkg[0].isdigit():
        pkg = f"_{pkg}"
    return pkg


def _molde(molde: str):
    return importlib.import_module(f"{TEMPLATES_PKG}.{molde.replace('-', '_')}")


def es_web(molde: str) -> bool:
    """Los moldes web viven en el repo, usan seed-kit y se verifican con Node."""
    return getattr(_molde(molde), "WEB", False)


def render(molde: str, nombre: str, destino: Path = None) -> dict:
    module = _molde(molde)
    if getattr(module, "WEB", False):
        return module.files(nombre, _nombre_paquete(nombre), Path(destino) if destino else Path(nombre))
    return module.files(nombre, _nombre_paquete(nombre))


def escribir(destino: Path, archivos: dict) -> None:
    for ruta_relativa, contenido in archivos.items():
        ruta = destino / ruta_relativa
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(contenido, encoding="utf-8")


def verificar(destino: Path, molde: str = "cli"):
    """Corre los tests del proyecto generado. Devuelve (ok, salida)."""
    if es_web(molde):
        if shutil.which("node") is None:
            return False, "Node 22 no esta instalado: no se pudieron correr los tests (node --test)."
        comando = ["node", "--experimental-strip-types", "--test", "test/*.test.ts"]
    else:
        comando = [sys.executable, "-m", "unittest", "discover", "-s", "tests"]
    resultado = subprocess.run(comando, cwd=destino, capture_output=True, text=True)
    return resultado.returncode == 0, resultado.stdout + resultado.stderr
