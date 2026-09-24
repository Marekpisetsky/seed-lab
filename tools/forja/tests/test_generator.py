"""Tests de Forja: prueba que cada molde genera un proyecto que realmente funciona."""
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from forja.generator import render, escribir, verificar


class TestMoldes(unittest.TestCase):
    def _generar_y_verificar(self, molde, nombre):
        tmp = Path(tempfile.mkdtemp())
        try:
            destino = tmp / nombre
            archivos = render(molde, nombre)
            escribir(destino, archivos)
            ok, salida = verificar(destino)
            self.assertTrue(ok, f"molde '{molde}' genero un proyecto cuyos tests fallan:\n{salida}")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_molde_cli_funciona(self):
        self._generar_y_verificar("cli", "proyecto_cli")

    def test_molde_lib_funciona(self):
        self._generar_y_verificar("lib", "proyecto_lib")

    def test_molde_api_funciona(self):
        self._generar_y_verificar("api", "proyecto_api")


if __name__ == "__main__":
    unittest.main()
