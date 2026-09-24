"""Nucleo de Forja: renderiza un molde y escribe/verifica el proyecto resultante."""
import importlib
import re
import subprocess
import sys
from pathlib import Path

TEMPLATES_PKG = "forja.templates"


def _nombre_paquete(nombre: str) -> str:
    pkg = re.sub(r"[^0-9a-zA-Z_]", "_", nombre)
    if pkg and pkg[0].isdigit():
        pkg = f"_{pkg}"
    return pkg


def render(molde: str, nombre: str) -> dict:
    module = importlib.import_module(f"{TEMPLATES_PKG}.{molde}")
    return module.files(nombre, _nombre_paquete(nombre))


def escribir(destino: Path, archivos: dict) -> None:
    for ruta_relativa, contenido in archivos.items():
        ruta = destino / ruta_relativa
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(contenido, encoding="utf-8")


def verificar(destino: Path):
    """Corre los tests del proyecto generado. Devuelve (ok, salida)."""
    resultado = subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", "tests"],
        cwd=destino,
        capture_output=True,
        text=True,
    )
    return resultado.returncode == 0, resultado.stdout + resultado.stderr
