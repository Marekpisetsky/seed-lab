# seed-lab hub

La web de seed-lab, en inglés y en español. La portada muestra solo lo que
existe: la misión, los cinco principios y Wealth Lens. *Principles*
describe los compromisos de seed-lab con reglas comprobables y una tabla
de cómo los cumple cada producto. *Roadmap* (enlazada desde el pie)
guarda la escalera de peldaños y todo lo pendiente. *About* cuenta qué es
seed-lab y quién lo hace.

- Dirección, escalera y principios: [`../docs/direction.md`](../docs/direction.md).
- Alojamiento en Europa (statichost.eu, un solo sitio con Wealth Lens):
  [`../docs/hosting.md`](../docs/hosting.md) y "Publicarlo", abajo.

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

Para verlo en local: `npx serve dist` (solo el hub; con Wealth Lens, ver
"Ver el sitio completo en local").

## Añadir un producto o un bloque

- Producto: una entrada en `content/tools.json` con `name`, `status`
  (`live` o `coming`; la portada solo muestra los `live`), `url` (https,
  o su carpeta en este mismo sitio, como `/wealth-lens/`: entonces el
  enlace abre en el idioma de la página, `/wealth-lens/es/`, y
  `robots.txt` apunta a su `sitemap.xml`),
  `languages`, `tagline` y `description` en cada idioma, y `principles`:
  para cada uno de los cinco principios, `status` (`meets`, `progress`
  —en curso: el cambio está listo y en marcha, aún sin efecto—, `partly`
  o `pending`) y una nota corta en cada idioma. Es su fila en la tabla de
  *Principles*. El build falla si falta algo.
- Bloque: una entrada en `content/blocks.json`; aparece en *Roadmap* como
  previsto. Solo puede ser `live` con la dirección (`url`) donde está
  publicado. No se anuncia nada que no exista.

## Añadir un idioma

Un diccionario en `src/i18n/` con la misma forma que `en.ts` (un test
compara la forma), su entrada en `LOCALES` y `LOCALE_SETTINGS`
(`src/i18n/locales.ts`) y el texto de cada herramienta y bloque en ese
idioma.

## Publicarlo (statichost.eu)

El hub y Wealth Lens se publican **juntos, como un solo sitio**: el hub en
la raíz y Wealth Lens en `/wealth-lens/`. La dirección del sitio está en
un solo archivo, [`../deploy/site.json`](../deploy/site.json) (`origin`,
hoy el marcador `https://seed-lab.example`); `src/site.ts` la lee para
las canónicas, el hreflang, Open Graph, `robots.txt` y el sitemap. Los
enlaces a Wealth Lens no llevan dominio (`/wealth-lens/`,
`/wealth-lens/es/`).

GitHub Actions (`.github/workflows/deploy.yml`, copia de
`deploy/deploy.workflow.yml`) construye y comprueba las
dos apps en cada push a `master` y tras los precios diarios, las junta
con `deploy/combine.mjs` y publica el resultado en la rama **`deploy`**:
solo archivos estáticos (`public/`) y un `statichost.yml` sin build.
statichost.eu sirve esa rama tal cual. La guía completa, con el orden de
todos los pasos (congelar Vercel antes de fusionar, comprobar, redirigir
las direcciones antiguas), está en
[`../docs/hosting.md`](../docs/hosting.md#pasos-para-activarla-en-orden).
Los dos pasos de configuración, aquí:

### Conectar la rama `deploy` en statichost.eu (sin comando de build)

1. Cuenta en <https://www.statichost.eu>, plan **Hobby** (gratis, sin
   tarjeta).
2. **Add site:**
   - **Nombre:** por ejemplo `seed-lab` (dirección gratuita
     `https://seed-lab.statichost.page`).
   - **Repository URL** (SSH, el repositorio es privado):
     `git@github.com:Marekpisetsky/seed-lab.git`.
   - **Branch:** `deploy`.
   - **Framework / build command / image:** en blanco. La rama trae
     `statichost.yml` con `public: public` y sin `image`, así que no se
     construye nada: se publica `public/` tal cual. **Publish
     directory**, si lo pide: `public`.
3. Copiar la clave pública del sitio (*deploy key*) y añadirla en GitHub →
   **Settings → Deploy keys → Add deploy key** (título `statichost.eu`,
   **sin** *Allow write access*).
4. Lanzar la primera publicación desde statichost.eu.
5. GitHub → **Settings → Secrets and variables → Actions → Variables →
   New repository variable:** `STATICHOST_SITE` = el nombre del sitio. Con
   ella, el workflow avisa a statichost.eu
   (`https://builder.statichost.eu/<sitio>`) cada vez que la rama
   `deploy` cambia.

### El dominio y su DNS

1. `../deploy/site.json` → `"origin": "https://<dominio>"` (sin barra
   final), `node deploy/vercel.mjs` desde la raíz del repositorio (las
   redirecciones de Vercel usan el mismo dominio), y fusionar en
   `master`.
2. statichost.eu → el sitio → **Domains:** añadir `<dominio>` (y
   `www.<dominio>` si se quiere).
3. En el registrador del dominio:

   | Nombre | Tipo | Valor |
   | --- | --- | --- |
   | `@` (raíz) | `ALIAS` o `ANAME` | `<sitio>.statichost.page` |
   | `www` (opcional) | `CNAME` | `<sitio>.statichost.page` |

   Sin `ALIAS`/`ANAME`, registros `A` y `AAAA` con las IP de
   <https://www.statichost.eu/docs/domains/>. Borrar los registros que ya
   hubiera para esos nombres. El certificado HTTPS lo emite statichost.eu
   solo cuando el DNS apunta a él.

### Ver el sitio completo en local

```bash
npm ci && npm run build                              # el hub, en hub/dist
(cd ../projects/wealth-lens && npm ci && npm run build)   # Wealth Lens, en out/
node ../deploy/combine.mjs ../_site                  # los junta y comprueba los enlaces
npx serve ../_site/public                            # http://localhost:3000/ y /wealth-lens/
```

Hasta que la migración esté activa, el hub de Vercel
(`seed-lab-hub.vercel.app`) sigue publicado tal cual estaba antes de este
cambio, con sus despliegues automáticos detenidos (paso 1 de la guía).

## Licencia

Código propietario: © 2026 Marek Pisetsky, todos los derechos reservados.
Ver [`LICENSE`](../LICENSE) y [`TRADEMARKS.md`](../TRADEMARKS.md) en la raíz.
El sitio publicado es de uso gratuito.
