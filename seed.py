#!/usr/bin/env python3
"""CLI del nucleo: lista y ejecuta celulas desde cells/."""
import argparse
import sys

from core.registry import discover, describe


def main():
    parser = argparse.ArgumentParser(prog="seed", description="Motor de celulas expandible.")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="Lista las celulas disponibles.")

    run_parser = sub.add_parser("run", help="Ejecuta una celula.")
    run_parser.add_argument("cell", help="Nombre de la celula (archivo en cells/, sin .py).")
    run_parser.add_argument("args", nargs="*", help="Argumentos para la celula.")

    args = parser.parse_args()
    cells = discover()

    if args.command == "list":
        if not cells:
            print("No hay celulas todavia. Agrega un archivo .py en cells/.")
            return
        for name, module in sorted(cells.items()):
            print(f"  {name:<15} {describe(module)}")
        return

    if args.command == "run":
        module = cells.get(args.cell)
        if module is None:
            print(f"No existe la celula '{args.cell}'. Usa 'seed list' para ver las disponibles.", file=sys.stderr)
            sys.exit(1)
        module.run(*args.args)


if __name__ == "__main__":
    main()
