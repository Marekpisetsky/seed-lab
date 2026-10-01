# seed-lab hub

La web de seed-lab, en inglés y en español. La portada muestra solo lo que
existe: la misión, los cinco principios y Wealth Lens. *Principles*
describe los compromisos de seed-lab con reglas comprobables y una tabla
de cómo los cumple cada producto. *Roadmap* (enlazada desde el pie)
guarda la escalera de peldaños y todo lo pendiente. *About* cuenta qué es
seed-lab y quién lo hace.

- Dirección, escalera y principios: [`../docs/direction.md`](../docs/direction.md).
- Plan para alojarlo en Europa: [`../docs/hosting.md`](../docs/hosting.md).

## Cómo está hecho

Páginas estáticas, sin framework de JavaScript. Un generador en
TypeScript, ejecutado directamente por Node 22
(`--experimental-strip-types`), escribe HTML con el CSS dentro. No hay
dependencias en tiempo de ejecución: las de `package.json` son solo para
lint, tipos y tests.

- Sin cookies, sin almacenamiento del navegador, sin analítica, sin
  fuentes ni scripts externos.
- Dos scripts mínimos, en línea, que no guardan nada:
  - solo en las páginas en inglés, el del idioma: la primera visita que
    llega desde fuera con un navegador en español va a la página en
    español; el selector EN/ES siempre gana;
  - solo donde aparece el correo (About), el del contacto (`src/email.ts`).
- **Contacto:** seedlab.eu (arroba) proton.me. En las páginas va en dos
  partes (`data-user` y `data-domain`, en `src/site.ts`): el CSS las
  muestra como una dirección y el script la convierte en un enlace de
  correo. El HTML nunca contiene la dirección entera ni un enlace
  `mailto`, para que no la recojan los bots. Un test lo comprueba.
- **Franjas:** cada página alterna bandas casi negras y blancas
  (`band()` en `src/layout.ts`, con `.theme-dark` y `.theme-light` de
  `tokens.css`): cabecera e introducción oscuras, contenido claro,
  producto oscuro, pie claro. Son iguales con el dispositivo en modo claro
  u oscuro, así que la página nunca es un bloque oscuro continuo. Títulos
  grandes, mucho aire y un solo botón destacado por franja (un test lo
  comprueba).
- **Colores:** `src/tokens.css`, el mismo archivo que Wealth Lens
  (`projects/wealth-lens/src/app/tokens.css`): blanco o #0A0A0A, grises
  neutros y un solo verde de marca, el de la semilla: `--brand` #00A36C
  (#1FCB86 sobre oscuro) para botones, logo e iconos, y `--accent`
  #00774C (#3DDC97 sobre oscuro) para texto y enlaces. Los tests
  comprueban que los dos archivos son idénticos, que todo texto mantiene
  4,5:1 (WCAG AA) en los dos modos, que los grises son neutros y que el
  verde queda lejos del de NVIDIA (#76B900).
- **Iconos:** la semilla con brote (`src/icons.ts`), en formas rellenas
  para que se lea a 16 px. `npm run images` dibuja
  `static/apple-touch-icon.png`, `static/og.png` y los iconos raster de
  Wealth Lens a partir de los SVG, con el Chromium de Playwright
  (dependencia de desarrollo, fijada en 1.56.1: la versión cuyo navegador
  ya traen los entornos en la nube de Claude Code; en otra máquina el
  comando lo instala primero si falta).
- **Peso visible:** el pie de cada página dice cuánto pesa (HTML con su
  CSS, más el icono), sin comprimir y con gzip. Se mide al construir y se
  vuelve a generar la página hasta que el número que muestra es el real
  (escribir el número cambia el peso). Un test lo comprueba.

```
hub/
  content/tools.json    productos y cómo cumplen cada principio (la tabla)
  content/blocks.json   herramientas para desarrolladores previstas (Roadmap)
  src/build.ts          genera dist/ (una carpeta por página e idioma)
  src/i18n/en.ts, es.ts todas las palabras, con el mismo formato
  src/pages/            portada, principles, about, roadmap, 404
  src/layout.ts         cabecera, franjas, pie con el peso, metadatos
  src/styles.ts         el CSS, en línea
  src/tokens.css        los colores, compartidos con Wealth Lens
  src/icons.ts          la semilla, el favicon y los iconos de principios
  src/weight.ts         mide y fija el peso de cada página
  scripts/images.ts     dibuja el icono táctil y la imagen para compartir
  static/               archivos que se sirven tal cual
  test/build.test.ts    peso, privacidad, franjas, enlaces y honestidad
```

## Comandos

```bash
npm ci
npm run build       # genera dist/ e imprime el peso de cada página
npm run lint
npm run typecheck
npm test            # construye y comprueba el resultado
npm run check       # los tres
```

Para verlo en local: `npx serve dist`.

## Añadir un producto o un bloque

- Producto: una entrada en `content/tools.json` con `name`, `status`
  (`live` o `coming`; la portada solo muestra los `live`), `url` (https),
  `languages`, `tagline` y `description` en cada idioma, y `principles`:
  para cada uno de los cinco principios, `status` (`meets`, `partly` o
  `pending`) y una nota corta en cada idioma. Es su fila en la tabla de
  *Principles*. El build falla si falta algo.
- Bloque: una entrada en `content/blocks.json`; aparece en *Roadmap* como
  previsto. Solo puede ser `live` con la dirección (`url`) donde está
  publicado. No se anuncia nada que no exista.

## Añadir un idioma

Un diccionario en `src/i18n/` con la misma forma que `en.ts` (un test
compara la forma), su entrada en `LOCALES` y `LOCALE_SETTINGS`
(`src/i18n/locales.ts`) y el texto de cada herramienta y bloque en ese
idioma.

## Publicarlo en Vercel (provisional)

Hasta migrar a un alojamiento europeo (ver `docs/hosting.md`), el hub se
publica como un segundo proyecto de Vercel sobre este mismo repositorio:

1. Vercel → **Add New… → Project** → importar `Marekpisetsky/seed-lab`.
2. **Project Name:** `seed-lab-hub` (así queda en
   `https://seed-lab-hub.vercel.app`, la dirección que usan `src/site.ts`
   y el menú de Wealth Lens).
3. **Root Directory:** `hub`.
4. **Framework Preset:** Other.
5. **Build Command:** `npm run build` · **Output Directory:** `dist` ·
   **Install Command:** `npm ci`.
6. **Settings → General → Node.js Version:** 22.x.
7. No hace falta ninguna variable de entorno. Sin Vercel Analytics ni
   Speed Insights: dejarlos apagados.
8. Deploy. Las páginas quedan en `/`, `/principles/`, `/about/`,
   `/roadmap/` y en `/es/…`; cualquier dirección que no exista sirve
   `404.html`.

Si el proyecto acaba con otro nombre, cambiar `SITE_URL` en `src/site.ts`
(canónicas, hreflang y sitemap) y `SEED_LAB_HUB_URL` en Wealth Lens.

## Licencia

Código propietario: © 2026 Marek Pisetsky, todos los derechos reservados.
Ver [`LICENSE`](../LICENSE) y [`TRADEMARKS.md`](../TRADEMARKS.md) en la raíz.
El sitio publicado es de uso gratuito.
