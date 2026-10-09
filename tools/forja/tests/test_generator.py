"""Tests de Forja: prueba que cada molde genera un proyecto que realmente funciona."""
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from forja.generator import render, escribir, verificar
from forja.templates import web_tool


class TestMoldes(unittest.TestCase):
    def _generar_y_verificar(self, molde, nombre):
        tmp = Path(tempfile.mkdtemp())
        try:
            destino = tmp / nombre
            archivos = render(molde, nombre, destino)
            escribir(destino, archivos)
            ok, salida = verificar(destino, molde)
            self.assertTrue(ok, f"molde '{molde}' genero un proyecto cuyos tests fallan:\n{salida}")
            return archivos
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_molde_cli_funciona(self):
        self._generar_y_verificar("cli", "proyecto_cli")

    def test_molde_lib_funciona(self):
        self._generar_y_verificar("lib", "proyecto_lib")

    def test_molde_api_funciona(self):
        self._generar_y_verificar("api", "proyecto_api")

    @unittest.skipIf(shutil.which("node") is None, "web-tool se verifica con Node 22")
    def test_molde_web_tool_funciona(self):
        archivos = self._generar_y_verificar("web-tool", "demo-lens")
        # Una herramienta de seed-lab: bilingue, sobre seed-kit, con su cabecera y pie, con tests y README.
        for ruta in ["package.json", "README.md", "src/calc.ts", "src/i18n.ts", "src/build.ts", "test/site.test.ts", ".gitignore"]:
            self.assertIn(ruta, archivos)
        self.assertIn('export const NAME = { en: "Horalis Demo Lens", es: "Horalis Demo Lens" } as const;', archivos["src/site.ts"])
        self.assertIn("LIMIT_KB = 50", archivos["src/site.ts"])
        self.assertIn("seed-kit/src/chrome-html.ts", archivos["src/build.ts"])
        self.assertNotIn("__", "".join(archivos.values()).replace("__dirname", ""), "quedo una marca sin sustituir")


class TestWebTool(unittest.TestCase):
    def test_importa_seed_kit_desde_su_sitio(self):
        archivos = web_tool.files("cost-lens", "cost_lens", web_tool.RAIZ_REPO / "projects" / "cost-lens")
        self.assertIn('from "../../../packages/seed-kit/src/html.ts"', archivos["src/view.ts"])
        self.assertIn('from "../../../packages/seed-kit/src/checks.ts"', archivos["test/site.test.ts"])

    def test_rechaza_un_id_que_no_sirve(self):
        for nombre in ["Cost Lens", "cost_lens", "-lens", "lens-", "2lens"]:
            with self.assertRaises(ValueError, msg=nombre):
                web_tool.files(nombre, "x", Path("/tmp") / "x")

    def test_registra_una_beta_oculta_una_sola_vez(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            lista = tmp / "tools.json"
            shutil.copy(web_tool.TOOLS_JSON, lista)
            antes = json.loads(lista.read_text(encoding="utf-8"))
            self.assertTrue(web_tool.registrar("demo-lens", "life", lista))
            despues = json.loads(lista.read_text(encoding="utf-8"))
            self.assertEqual(despues[:-1], antes)
            nueva = despues[-1]
            self.assertEqual((nueva["id"], nueva["name"], nueva["status"], nueva["listed"], nueva["category"]), ("demo-lens", {"en": "Horalis Demo Lens", "es": "Horalis Demo Lens"}, "beta", False, "life"))
            self.assertEqual(nueva["url"], "https://seed-lab-demo-lens.vercel.app")
            self.assertFalse(web_tool.registrar("demo-lens", "life", lista))
            self.assertEqual(len(json.loads(lista.read_text(encoding="utf-8"))), len(despues))
            with self.assertRaises(ValueError):
                web_tool.registrar("otra", "sports", lista)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
