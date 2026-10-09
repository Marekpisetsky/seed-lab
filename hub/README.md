# Horalis hub

La web de Horalis, en inglés y en español. La portada, en franjas
negras y blancas como la web de un fabricante, muestra solo lo que
existe:

1. **Apertura oscura:** el titular, la misión en una frase, un botón verde
   y una captura grande y real de Horalis Crecimiento.
2. **Principios**, en blanco: cada uno con su icono, su título y una regla
   que cualquiera puede comprobar.
3. **Herramientas**, en blanco, por estantes ("Dinero", "Vida y países"):
   una tarjeta por herramienta, con su captura, una frase, su estado
   (*Live* o *Beta*) y un botón. Una beta solo aparece con `"listed":
   true`, y un estante vacío no se muestra.
4. **Cómo construimos**, en oscuro: la plataforma (seed-kit y Forja) en
   tres pasos y un esquema.
5. **Qué nos hace distintos**, en blanco: una app típica frente a
   Horalis (cuenta, rastreo, datos, anuncios y peso), sin nombrar a nadie.
6. **En cifras**, en oscuro, calculadas al construir: 0 cookies, 0
   rastreadores, los KB de la página más pesada, idiomas, países en los
   datos y herramientas hechas sobre la plataforma que se pueden usar (solo
   las que se muestran: una beta oculta no cuenta; un test lo impide).
7. **Pie claro.**

*Principles*
describe los compromisos de Horalis con reglas comprobables y una tabla
de cómo los cumple cada producto. *Roadmap* (enlazada desde el pie)
guarda la escalera de peldaños y todo lo pendiente. *About* cuenta qué es
Horalis y quién lo hace.

- Dirección, escalera y principios: [`../docs/direction.md`](../docs/direction.md).
- Plan para alojarlo en Europa: [`../docs/hosting.md`](../docs/hosting.md).

## Cómo está hecho

Páginas estáticas, sin framework de JavaScript. Un generador en
TypeScript, ejecutado directamente por Node 22
(`--experimental-strip-types`), escribe HTML con el CSS dentro. No hay
dependencias en tiempo de ejecución: las de `package.json` son solo para
lint, tipos y tests.

Lo que comparte con las demás herramientas viene de **seed-kit**
([`../packages/seed-kit`](../packages/seed-kit/README.md)), importado
desde el código, no copiado: los colores (`tokens.css`), la cabecera y el
pie de Horalis (con el lanzador de herramientas y EN/ES), la lista de
herramientas (`tools.json`), el script de idioma, los iconos, la medida
del peso y las comprobaciones de privacidad y de lenguaje sencillo.

- Sin cookies, sin analítica, sin fuentes ni scripts externos. Del
  almacenamiento del navegador, solo el tema elegido, para la pestaña.
- Tres scripts mínimos, en línea:
  - en todas las páginas, el primero del `<head>`, el del tema (el de
    seed-kit, `theme.ts`): claro, oscuro o automático, elegido en la
    cabecera y guardado solo en la pestaña (`sessionStorage`, que el
    navegador borra al cerrarla); también abre y cierra los menús;
  - solo en las páginas en inglés, el del idioma (el de seed-kit): la primera visita que
    llega desde fuera con un navegador en español va a la página en
    español; el selector EN/ES siempre gana; no guarda nada;
  - solo donde aparece el correo (About), el del contacto (`src/email.ts`).
- **Contacto:** horalis (arroba) proton.me. En las páginas va en dos
  partes (`data-user` y `data-domain`, en `src/site.ts`): el CSS las
  muestra como una dirección y el script la convierte en un enlace de
  correo. El HTML nunca contiene la dirección entera ni un enlace
  `mailto`, para que no la recojan los bots. Un test lo comprueba.
- **Franjas:** cada página alterna bandas casi negras y blancas
  (`band()` en `src/layout.ts`, con `.theme-dark` y `.theme-light` de
  `tokens.css`): cabecera e introducción oscuras, contenido claro,
  producto oscuro, pie claro. Son iguales con el dispositivo en modo claro
  u oscuro, así que la página nunca es un bloque oscuro continuo. Si se
  elige claro u oscuro en el menú de tema, todas las franjas toman ese
  modo, con una línea entre ellas. Títulos
  grandes, mucho aire y un solo botón destacado por franja (un test lo
  comprueba).
- **Cabecera y pie:** los de seed-kit (`headerHtml` y `footerHtml`),
  los mismos que lleva cada herramienta: la semilla y el nombre, las
  páginas, EN/ES, el menú de tema y el lanzador (un `<details>`) con las
  herramientas visibles. Aquí la cabecera es oscura y el pie claro
  (salvo con un modo elegido), y el pie no dice "Parte de Horalis" (es
  Horalis).
- **Colores:** el `tokens.css` de seed-kit, el único archivo de colores
  de todas las apps: blanco o #0A0A0A, grises
  neutros y un solo verde de marca, el de la semilla: `--brand` #00A36C
  (#1FCB86 sobre oscuro) para botones, logo e iconos, y `--accent`
  #00774C (#3DDC97 sobre oscuro) para texto y enlaces. Los tests de
  seed-kit comprueban que todo texto mantiene 4,5:1 (WCAG AA) en los dos
  modos, que los grises son neutros y que el verde queda lejos del de
  NVIDIA (#76B900).
- **Iconos:** la semilla con brote (`icons.ts` de seed-kit), en formas rellenas
  para que se lea a 16 px. `npm run images` dibuja
  `static/apple-touch-icon.png`, `static/og.png` y los iconos raster de
  Horalis Crecimiento a partir de los SVG, con el Chromium de Playwright
  (dependencia de desarrollo, fijada en 1.56.1: la versión cuyo navegador
  ya traen los entornos en la nube de Claude Code; en otra máquina el
  comando lo instala primero si falta).
- **Capturas:** `npm run shots` fotografía cada herramienta visible desde
  su build real (`projects/<id>/out` o `dist`, servido en local), en
  inglés y en español, con datos escritos (y, en Horalis Crecimiento, "See my
  result" pulsado) para que se vea un resultado;
  las guarda en WebP a varios anchos en `static/shots/` y las anota en
  `content/shots.json`. Se cargan solo al acercarse a la pantalla
  (`loading="lazy"`), con su tamaño fijado para que nada salte. Hay que
  repetirlo cuando cambia el aspecto de una herramienta.
- **Cifras medidas:** el build cuenta en las páginas construidas lo que
  guardarían en el navegador (cookies) y lo que pedirían a otros sitios
  (rastreadores), pesa la página más pesada, y vuelve a construir hasta
  que la portada dice exactamente eso (`src/figures.ts`).
- **Peso visible:** el pie de cada página dice cuánto pesa (HTML con su
  CSS, más el icono), sin comprimir y con gzip. Se mide al construir y se
  vuelve a generar la página hasta que el número que muestra es el real
  (escribir el número cambia el peso; `renderWithWeight` de seed-kit). Un
  test lo comprueba.

```
hub/
  content/blocks.json   herramientas para desarrolladores previstas (Roadmap)
  src/build.ts          genera dist/ (una carpeta por página e idioma)
  src/i18n/en.ts, es.ts todas las palabras, con el mismo formato
  src/pages/            portada, principles, about, roadmap, 404
  src/layout.ts         la página: cabecera y pie de seed-kit, franjas, metadatos
  src/content.ts        las herramientas (de seed-kit) y los bloques
  src/styles.ts         el CSS, en línea (tokens y cabecera/pie de seed-kit, y el del hub)
  src/figures.ts        las cifras de la portada, calculadas al construir
  src/shots.ts          las capturas de las herramientas (content/shots.json)
  scripts/shots.ts      toma esas capturas desde el build real de cada herramienta
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
npm run shots       # vuelve a tomar las capturas (antes: npm run build en cada herramienta)
npm run test:browser  # tras compilar el hub, Horalis Coste de vida e Horalis Inflación: el menú de tema,
                      # el contraste AA en claro y oscuro y el daltonismo emulado (e2e/)
```

Para verlo en local: `npx serve dist`.

## Añadir un producto o un bloque

- Producto: una entrada en `packages/seed-kit/src/tools.json` (la misma
  lista que leen los lanzadores de todas las apps) con `name`, `status`
  (`live`, `beta` o `coming`; se muestran los `live` y las `beta` con
  `"listed": true`), `category` (`money` o `life`), `url` (https),
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
   y el menú de Horalis Crecimiento).
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
(canónicas, hreflang y sitemap) y `SEED_LAB_HUB_URL` en Horalis Crecimiento.

## Licencia

Código propietario: © 2026 Marek Pisetsky, todos los derechos reservados.
Ver [`LICENSE`](../LICENSE) y [`TRADEMARKS.md`](../TRADEMARKS.md) en la raíz.
El sitio publicado es de uso gratuito.
