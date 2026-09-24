"""Molde 'cli': una utilidad de linea de comandos que cuenta palabras, lineas y caracteres."""

README = """# __NAME__

CLI generada por Forja. Cuenta palabras, lineas y caracteres de un archivo
de texto -- funcional desde el primer commit, sin dependencias externas.

```bash
python main.py archivo.txt
```
"""

MAIN = '''"""__NAME__ -- cuenta palabras, lineas y caracteres de un archivo."""
import argparse


def contar(texto):
    return {
        "lineas": len(texto.splitlines()),
        "palabras": len(texto.split()),
        "caracteres": len(texto),
    }


def main():
    parser = argparse.ArgumentParser(description="Cuenta palabras, lineas y caracteres.")
    parser.add_argument("archivo", help="Ruta al archivo de texto a analizar.")
    args = parser.parse_args()

    with open(args.archivo, "r", encoding="utf-8") as f:
        texto = f.read()

    for clave, valor in contar(texto).items():
        print(f"{clave}: {valor}")


if __name__ == "__main__":
    main()
'''

TEST_MAIN = '''"""Tests reales del molde cli: prueba que contar() funciona de verdad."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import contar


class TestContar(unittest.TestCase):
    def test_lineas_palabras_caracteres(self):
        texto = "hola mundo\\nsegunda linea"
        resultado = contar(texto)
        self.assertEqual(resultado["lineas"], 2)
        self.assertEqual(resultado["palabras"], 4)
        self.assertEqual(resultado["caracteres"], len(texto))

    def test_texto_vacio(self):
        resultado = contar("")
        self.assertEqual(resultado["lineas"], 0)
        self.assertEqual(resultado["palabras"], 0)
        self.assertEqual(resultado["caracteres"], 0)


if __name__ == "__main__":
    unittest.main()
'''


def files(nombre, pkg):
    return {
        "README.md": README.replace("__NAME__", nombre),
        "main.py": MAIN.replace("__NAME__", nombre),
        "tests/test_main.py": TEST_MAIN,
    }
