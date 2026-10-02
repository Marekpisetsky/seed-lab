#!/usr/bin/env python3
"""CLI de Forja: genera proyectos funcionales a partir de un molde, y verifica que funcionen."""
import argparse
import subprocess
from pathlib import Path

from forja.generator import render, escribir, verificar, es_web
from forja.templates import web_tool

MOLDES_DISPONIBLES = ["cli", "lib", "api", "web-tool"]

# Las herramientas web nacen dentro del repositorio, junto a las demas.
PROYECTOS = web_tool.RAIZ_REPO / "projects"


def main():
    parser = argparse.ArgumentParser(prog="forja", description="Genera proyectos funcionales desde un molde.")
    sub = parser.add_subparsers(dest="command", required=True)

    nuevo = sub.add_parser("new", help="Crea un proyecto nuevo.")
    nuevo.add_argument("nombre", help="Nombre del proyecto (y del directorio). En web-tool, su id: cost-lens.")
    nuevo.add_argument("--tipo", choices=MOLDES_DISPONIBLES, default="cli", help="Molde a usar.")
    nuevo.add_argument("--destino", default=None, help="Directorio donde crear el proyecto (web-tool: projects/ del repo; los demas: el actual).")
    nuevo.add_argument("--sin-git", action="store_true", help="No inicializar git en el proyecto generado (web-tool nunca lo hace: vive en el repo).")
    nuevo.add_argument("--categoria", choices=web_tool.CATEGORIAS, default="money", help="web-tool: su estante en el hub (money: Dinero; life: Vida y paises).")
    nuevo.add_argument("--sin-registro", action="store_true", help="web-tool: no anadirla a la lista de herramientas de seed-kit.")

    args = parser.parse_args()

    if args.command == "new":
        web = es_web(args.tipo)
        base = Path(args.destino) if args.destino else (PROYECTOS if web else Path("."))
        destino = base / args.nombre
        if destino.exists():
            parser.error(f"'{destino}' ya existe.")

        try:
            archivos = render(args.tipo, args.nombre, destino)
        except ValueError as error:
            parser.error(str(error))
        escribir(destino, archivos)

        if web and not args.sin_registro:
            if web_tool.registrar(args.nombre, args.categoria):
                print(f"'{args.nombre}' anadida a packages/seed-kit/src/tools.json como beta oculta (\"listed\": false).")

        ok, salida = verificar(destino, args.tipo)
        if not ok:
            print(f"Advertencia: los tests generados para '{args.nombre}' no pasaron:")
            print(salida)
        else:
            print(f"'{args.nombre}' generado en {destino} -- tests verificados OK.")

        if not args.sin_git and not web:
            subprocess.run(["git", "init", "-q"], cwd=destino)
            subprocess.run(["git", "add", "-A"], cwd=destino)
            subprocess.run(
                ["git", "commit", "-q", "-m", f"Generado por Forja (molde: {args.tipo})"],
                cwd=destino,
            )


if __name__ == "__main__":
    main()
