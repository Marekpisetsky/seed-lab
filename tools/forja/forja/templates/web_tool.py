"""Molde 'web-tool': una herramienta web estatica de Horalis, sin framework, sobre seed-kit.

A diferencia de los moldes de Python, genera dentro del repositorio
(projects/<nombre>/), importa seed-kit desde el codigo (packages/seed-kit)
y se verifica con Node 22: `node --test`. Sus archivos viven en
web_tool_files/ (cada uno con .tmpl, para que ninguna herramienta los tome
por codigo), con cuatro marcas que se sustituyen al generar:

  __NAME__  el nombre visible ("Horalis Demo Lens" para demo-lens)
  __ID__    el id en la lista de herramientas ("cost-lens")
  __KIT__   la ruta de src/ y test/ a packages/seed-kit/src
  __URL__   la direccion provisional donde se publicara
"""
import json
import os
import re
from pathlib import Path

# Recibe el destino (para la ruta a seed-kit) y se verifica con Node.
WEB = True

ARCHIVOS = Path(__file__).with_name("web_tool_files")
RAIZ_REPO = Path(__file__).resolve().parents[4]
KIT = RAIZ_REPO / "packages" / "seed-kit" / "src"
TOOLS_JSON = KIT / "tools.json"
CATEGORIAS = ("money", "life")

ID_VALIDO = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


def nombre_visible(nombre: str) -> str:
    """'cost-lens' -> 'Horalis Cost Lens': la marca primero, como toda herramienta de la lista."""
    return "Horalis " + " ".join(parte.capitalize() for parte in nombre.split("-"))


def url_provisional(nombre: str) -> str:
    return f"https://seed-lab-{nombre}.vercel.app"


def files(nombre: str, pkg: str, destino: Path) -> dict:
    if not ID_VALIDO.match(nombre):
        raise ValueError(f"'{nombre}' no sirve como id de herramienta: minusculas, numeros y guiones (cost-lens).")
    kit = os.path.relpath(KIT, Path(destino).resolve() / "src").replace(os.sep, "/")
    marcas = {"__NAME__": nombre_visible(nombre), "__ID__": nombre, "__KIT__": kit, "__URL__": url_provisional(nombre)}
    archivos = {}
    for plantilla in sorted(ARCHIVOS.rglob("*.tmpl")):
        ruta = plantilla.relative_to(ARCHIVOS).as_posix()[: -len(".tmpl")]
        if ruta == "gitignore":
            ruta = ".gitignore"
        contenido = plantilla.read_text(encoding="utf-8")
        for marca, valor in marcas.items():
            contenido = contenido.replace(marca, valor)
        archivos[ruta] = contenido
    return archivos


def registrar(nombre: str, categoria: str, tools_json: Path = TOOLS_JSON) -> bool:
    """Anade la herramienta a la lista de seed-kit como beta oculta. False si ya estaba."""
    if categoria not in CATEGORIAS:
        raise ValueError(f"categoria '{categoria}': debe ser {' o '.join(CATEGORIAS)}")
    herramientas = json.loads(tools_json.read_text(encoding="utf-8"))
    if any(herramienta["id"] == nombre for herramienta in herramientas):
        return False
    visible = nombre_visible(nombre)
    pendiente = {"status": "pending", "note": {"en": "Not checked yet.", "es": "Aún sin comprobar."}}
    herramientas.append(
        {
            "id": nombre,
            "name": {"en": visible, "es": visible},
            "status": "beta",
            "listed": False,
            "category": categoria,
            "url": url_provisional(nombre),
            "languages": ["en", "es"],
            "tagline": {"en": f"{visible}, a new Horalis tool.", "es": f"{visible}, una herramienta nueva de Horalis."},
            "description": {
                "en": f"{visible} is being built. It runs in your browser: nothing is saved or sent.",
                "es": f"{visible} está en construcción. Funciona en tu navegador: no se guarda ni se envía nada.",
            },
            "principles": {principio: pendiente for principio in ("device", "transparent", "europe", "light", "everyone")},
        }
    )
    tools_json.write_text(json.dumps(herramientas, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return True
