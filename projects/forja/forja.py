#!/usr/bin/env python3
"""CLI de Forja: genera proyectos funcionales a partir de un molde, y verifica que funcionen."""
import argparse
import subprocess
from pathlib import Path

from forja.generator import render, escribir, verificar

MOLDES_DISPONIBLES = ["cli", "lib", "api"]


def main():
    parser = argparse.ArgumentParser(prog="forja", description="Genera proyectos funcionales desde un molde.")
    sub = parser.add_subparsers(dest="command", required=True)

    nuevo = sub.add_parser("new", help="Crea un proyecto nuevo.")
    nuevo.add_argument("nombre", help="Nombre del proyecto (y del directorio).")
    nuevo.add_argument("--tipo", choices=MOLDES_DISPONIBLES, default="cli", help="Molde a usar.")
    nuevo.add_argument("--destino", default=".", help="Directorio donde crear el proyecto.")
    nuevo.add_argument("--sin-git", action="store_true", help="No inicializar git en el proyecto generado.")

    args = parser.parse_args()

    if args.command == "new":
        destino = Path(args.destino) / args.nombre
        if destino.exists():
            parser.error(f"'{destino}' ya existe.")

        archivos = render(args.tipo, args.nombre)
        escribir(destino, archivos)

        ok, salida = verificar(destino)
        if not ok:
            print(f"Advertencia: los tests generados para '{args.nombre}' no pasaron:")
            print(salida)
        else:
            print(f"'{args.nombre}' generado en {destino} -- tests verificados OK.")

        if not args.sin_git:
            subprocess.run(["git", "init", "-q"], cwd=destino)
            subprocess.run(["git", "add", "-A"], cwd=destino)
            subprocess.run(
                ["git", "commit", "-q", "-m", f"Generado por Forja (molde: {args.tipo})"],
                cwd=destino,
            )


if __name__ == "__main__":
    main()
