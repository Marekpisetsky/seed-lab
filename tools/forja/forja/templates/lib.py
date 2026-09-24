"""Molde 'lib': una libreria minima con una funcion real (slugify) y tests."""

README = """# __NAME__

Libreria generada por Forja. Incluye `slugify`, una funcion real para
convertir texto en slugs de URL -- utilidad genuina, no un stub.

```python
from __PKG__ import slugify
slugify("Hola Mundo!")  # "hola-mundo"
```
"""

INIT = '''"""__PKG__ -- utilidades minimas, empezando por slugify."""
import re


def slugify(texto):
    texto = texto.strip().lower()
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    return texto.strip("-")
'''

TEST_INIT = '''"""Tests reales del molde lib: prueba que slugify funciona de verdad."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from __PKG__ import slugify


class TestSlugify(unittest.TestCase):
    def test_espacios_y_mayusculas(self):
        self.assertEqual(slugify("Hola Mundo!"), "hola-mundo")

    def test_simbolos(self):
        self.assertEqual(slugify("  Cafe con leche??  "), "cafe-con-leche")

    def test_ya_es_slug(self):
        self.assertEqual(slugify("ya-es-un-slug"), "ya-es-un-slug")


if __name__ == "__main__":
    unittest.main()
'''


def files(nombre, pkg):
    return {
        "README.md": README.replace("__NAME__", nombre).replace("__PKG__", pkg),
        f"{pkg}/__init__.py": INIT.replace("__PKG__", pkg),
        "tests/test_lib.py": TEST_INIT.replace("__PKG__", pkg),
    }
