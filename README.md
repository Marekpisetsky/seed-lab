# seed-lab

seed-lab builds free, privacy-first digital tools that Europeans —
citizens, developers and public bodies — can use without giving up their
data.

seed-lab construye herramientas digitales gratuitas y centradas en la
privacidad para Europa. No vende a gobiernos: publica herramientas
gratuitas que ciudadanos, desarrolladores e instituciones adoptan por su
cuenta. **Wealth Lens** (`projects/wealth-lens/`) es la primera
herramienta y la prueba de los principios.

- **Dirección:** visión, modelo, escalera, misión, los cinco principios
  (con *Transparent*), ODS y "Qué NO somos", en
  [`docs/direction.md`](docs/direction.md).
- **Dónde estamos:** peldaño 1 de la escalera, herramientas que la gente
  usa. Los peldaños siguientes todavía no existen; la web los muestra solo
  en su página *Roadmap*.
- **Web de seed-lab:** [`hub/`](hub/README.md), estática, en EN y ES, sin
  cookies.
- **Alojamiento:** hoy en Vercel (EE. UU.). El paso a **statichost.eu**
  (Suecia) está preparado y aún no activo: un solo sitio con el hub en la
  raíz y Wealth Lens en `/wealth-lens/`, construido por GitHub Actions y
  publicado en la rama `deploy`. Los pasos para activarlo, en orden, en
  [`docs/hosting.md`](docs/hosting.md#pasos-para-activarla-en-orden).
- **Licencia:** código propietario, © 2026 Marek Pisetsky, todos los
  derechos reservados ([`LICENSE`](LICENSE)). Las aplicaciones publicadas
  son de uso gratuito. Nombres y logotipos:
  [`TRADEMARKS.md`](TRADEMARKS.md).
- **Contacto:** seedlab.eu (arroba) proton.me.

## Reglas de trabajo

- **Cero coste:** nada depende de un servicio de pago para existir.
- **Verificación antes que promesa:** nada se da por terminado sin
  pruebas de que funciona (tests, build, Lighthouse, accesibilidad).
- **Solo lo que existe:** ningún texto presenta como hecho algo que aún
  no lo está; lo pendiente va a la hoja de ruta.
- **Un solo sistema visual:** los colores viven en `tokens.css`, el mismo
  archivo en el hub y en cada producto.

## Estructura

- `hub/` — la web de seed-lab: misión, principios, productos y hoja de
  ruta. Ver `hub/README.md`.
- `projects/` — los productos. Hoy, uno: `projects/wealth-lens/`. Ver
  `projects/README.md` para lo que pide cada producto.
- `deploy/` — la dirección del sitio (`site.json`, el único lugar donde
  se cambia el dominio), el script que junta el hub y Wealth Lens en un
  solo sitio y comprueba sus enlaces (`combine.mjs`) y las redirecciones
  301 preparadas para las direcciones de Vercel (`vercel/`, escritas por
  `vercel.mjs`). El workflow que publica, `deploy.workflow.yml`, se copia
  una vez a `.github/workflows/deploy.yml`.
- `docs/` — dirección (`direction.md`), alojamiento (`hosting.md`),
  historia (`history.md`: cómo se definía seed-lab antes
  de septiembre de 2026) y capturas.
- `tools/forja/` — herramienta interna: genera proyectos de Python que
  nacen con tests que pasan. No es un producto.
- `cells/`, `core/` y `seed.py` — banco de pruebas: ideas rápidas en un
  archivo de Python cada una, que `seed.py` descubre y ejecuta.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Añadir un producto

1. Crear `projects/<nombre>/` con su `README.md`: qué es, qué no es, cómo
   cumple los cinco principios y en qué estado está.
2. Usar el `tokens.css` compartido y la familia de iconos de seed-lab.
3. Añadirlo a `hub/content/tools.json`, con su fila de "Cómo lo cumple
   cada producto" (cumple / en parte / pendiente por principio).

## Añadir una idea rápida

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una línea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.
