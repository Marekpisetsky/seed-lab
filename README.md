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
- **Cómo construimos:** cada producto nace de una plataforma interna,
  [seed-kit](packages/seed-kit/README.md) (colores, cabecera y pie,
  idiomas, privacidad, comprobaciones) más el molde `web-tool` de
  [Forja](tools/forja/README.md). Ver "Cómo construimos" en
  [`docs/direction.md`](docs/direction.md).
- **Alojamiento:** hoy en Vercel (EE. UU.). El plan para pasar a Europa,
  sin migrar todavía, está en [`docs/hosting.md`](docs/hosting.md).
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
- **Un solo sistema visual:** los colores viven en el `tokens.css` de
  seed-kit, que importan el hub y cada producto; la cabecera y el pie
  también son los de seed-kit.
- **Nada empieza de cero:** cada producto nuevo nace de la plataforma
  (seed-kit y Forja) y la usa desde el código, sin copiarla.

## Estructura

- `hub/` — la web de seed-lab: misión, principios, productos y hoja de
  ruta. Ver `hub/README.md`.
- `projects/` — los productos. Hoy, uno: `projects/wealth-lens/`. Ver
  `projects/README.md` para lo que pide cada producto.
- `packages/seed-kit/` — la base común que importan el hub y cada
  producto: colores, cabecera y pie, lista de herramientas, idiomas,
  privacidad y comprobaciones. Interna, no es un producto. Ver
  `packages/seed-kit/README.md`.
- `docs/` — dirección (`direction.md`), plan de alojamiento
  (`hosting.md`), historia (`history.md`: cómo se definía seed-lab antes
  de septiembre de 2026) y capturas.
- `tools/forja/` — herramienta interna: genera herramientas web de
  seed-lab sobre seed-kit (molde `web-tool`) y proyectos de Python, todos
  con tests que pasan al nacer. No es un producto.
- `cells/`, `core/` y `seed.py` — banco de pruebas: ideas rápidas en un
  archivo de Python cada una, que `seed.py` descubre y ejecuta.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Añadir un producto

1. Crearlo con Forja:
   `python tools/forja/forja.py new <id> --tipo web-tool --categoria money`
   (o `life`). Nace en `projects/<id>/`, sobre seed-kit, en EN y ES, con
   tests que pasan, y entra en `packages/seed-kit/src/tools.json` como
   beta oculta (`"listed": false`).
2. Cambiar el ejemplo por lo suyo y escribir en su `README.md` qué es, qué
   no es, cómo cumple los cinco principios y en qué estado está.
3. Completar su entrada en `tools.json`, con su fila de "Cómo lo cumple
   cada producto" (cumple / en parte / pendiente por principio). Se
   muestra en el hub y en los lanzadores cuando pasa a `"listed": true` o
   a `live`.

## Añadir una idea rápida

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una línea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.
