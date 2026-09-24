"""Descubre e importa las células disponibles en cells/."""
import importlib
import pkgutil
from pathlib import Path

CELLS_PATH = Path(__file__).resolve().parent.parent / "cells"


def discover():
    cells = {}
    for _finder, name, _ispkg in pkgutil.iter_modules([str(CELLS_PATH)]):
        if name.startswith("_"):
            continue
        module = importlib.import_module(f"cells.{name}")
        if hasattr(module, "run"):
            cells[name] = module
    return cells


def describe(module):
    if not module.__doc__:
        return "(sin descripcion)"
    return module.__doc__.strip().splitlines()[0]
