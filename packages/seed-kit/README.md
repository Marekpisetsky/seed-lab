# seed-kit

La base común de todas las herramientas de seed-lab: lo que cada app
reconstruía por su cuenta (cabecera, pie, idiomas, colores, privacidad,
tests) vive aquí una sola vez. Las apps lo **importan desde el código**,
no lo copian: un cambio aquí llega a todas en su siguiente build.

Es infraestructura interna, no un producto publicado: no tiene versión en
npm ni se anuncia como bloque en el *Roadmap* del hub (eso sería el
peldaño 2 de [`docs/direction.md`](../../docs/direction.md)). Junto con
el molde `web-tool` de [Forja](../../tools/forja/README.md) forma la
**plataforma**: cada producto nuevo nace de ella.

## Qué hay

```
src/
  tokens.css         los colores y la fuente de seed-lab: el único archivo de colores
  chrome.css         estilos de la cabecera y el pie (solo tokens; clases sk-*)
  base.css           la base de una herramienta web: página, formulario, resultado, prosa
  css.ts             lee esas hojas de estilo y las minimiza, para ponerlas en línea
  chrome.ts          el modelo de cabecera y pie: palabras EN/ES, enlaces, lanzador
  chrome-html.ts     cabecera y pie en HTML estático (hub, herramientas de Forja)
  react/chrome.tsx   cabecera y pie en React (Wealth Lens): el mismo marcado
  tools.json         la lista de herramientas: la leen el hub y todos los lanzadores
  tools.ts           la lee, la valida y dice cuáles se muestran
  locales.ts         EN y ES, sus formatos (Intl) y direcciones por idioma
  detect.ts          el script de idioma: no guarda nada
  format.ts          números, dinero, porcentajes y fechas en cada idioma
  plain-language.ts  el test anti-jerga y de frases cortas, reutilizable
  checks.ts          peso por página, peticiones a otros sitios, almacenamiento
  html.ts            plantillas HTML que escapan todo por defecto
  page.ts            el documento de una página estática: head, cabecera, página, pie
  legal.ts           la página de privacidad y condiciones de cada herramienta, EN/ES
  browser.ts         el código de una herramienta para el navegador, sin bundler
  icons.ts           la semilla, el favicon, el lanzador y los iconos de principios
  site.ts            la dirección del hub y el contacto
test/                los tests del kit (node --test)
```

Reglas del kit:

- **Sin dependencias en tiempo de ejecución.** Cada módulo importa solo
  módulos de Node (`node:zlib`) o archivos del propio kit, con su
  extensión `.ts`, para que Node 22 lo ejecute tal cual
  (`--experimental-strip-types`) y cualquier bundler lo resuelva desde
  fuera de su carpeta. `react/chrome.tsx` importa solo `react`, que pone
  la app.
- **Una cabecera, dos dibujos.** `chrome-html.ts` y `react/chrome.tsx`
  pintan el mismo modelo con el mismo marcado; un test de Wealth Lens
  compara los dos.
- **Sin cookies ni almacenamiento.** El script de idioma no guarda nada;
  `checks.ts` da a cada app los tests para comprobarlo en sus páginas.
- **Sin bundler.** `browser.ts` toma el script de una página y todo lo
  que importa (de la herramienta y del kit), le quita los tipos con el
  propio Node (`stripTypeScriptTypes`) y lo escribe como módulos `.js`
  con la misma estructura, así que el navegador corre el mismo código
  que los tests.

## La lista de herramientas

`src/tools.json` es la única lista: el hub la muestra por categorías y
cada app la pone en su lanzador. Cada herramienta tiene `id`, `name`,
`status`, `category`, `url` (https), `languages`, `tagline` y
`description` en cada idioma, y cómo cumple cada principio.

- `status`: `live` (se puede usar, se muestra siempre), `beta` (publicada,
  pero solo se muestra con `"listed": true`; por defecto, no) o `coming`.
- `category`: `money` ("Dinero") o `life` ("Vida y países").

El kit falla al leerla si falta algo, así que un error no llega a
publicarse.

## Cómo lo usa cada app

- **Apps estáticas** (el hub, las que crea Forja): importan los módulos
  por ruta relativa (`../../packages/seed-kit/src/chrome-html.ts`) y
  ponen en línea `tokens.css`, `chrome.css` y, las herramientas,
  `base.css` (`kitCss` y `minifyCss`). Las de Forja usan además
  `page.ts`, `legal.ts` y `browser.ts`.
- **Wealth Lens** (Next.js): el alias `@seed-kit/*` de `tsconfig.json`,
  `turbopack.root` en la raíz del repo, y `globals.css` importa
  `tokens.css` y `chrome.css`. Los tipos se comprueban con
  `tsconfig.typecheck.json` (`npm run typecheck`, parte de `npm run
  build`), que le dice a `tsc` dónde están los tipos de React para el
  componente del kit.

En Vercel, un proyecto cuyo *Root Directory* es la carpeta de la app
necesita la opción *Include files outside the root directory in the Build
Step* activada, para que el build vea `packages/`.

## Comandos

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run check   # los tres
```
