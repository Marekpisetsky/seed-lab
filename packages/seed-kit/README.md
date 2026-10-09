# seed-kit

La base común de todas las herramientas de Horalis: lo que cada app
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
  tokens.css         los colores y la fuente de Horalis: el único archivo de colores, claro y oscuro
  chrome.css         estilos de la cabecera y el pie (solo tokens; clases sk-*)
  base.css           la base de una herramienta web: página, formulario, resultado, prosa
  css.ts             lee esas hojas de estilo y las minimiza, para ponerlas en línea
  chrome.ts          el modelo de cabecera y pie: palabras EN/ES, enlaces, tema, lanzador
  chrome-html.ts     cabecera y pie en HTML estático (hub, herramientas de Forja)
  react/chrome.tsx   cabecera y pie en React (Horalis Crecimiento): el mismo marcado
  react/trend.tsx    ▲/▼ junto a una ganancia o una pérdida, en React
  theme.ts           claro / oscuro / automático: el script de la cabecera y la elección de la pestaña
  tools.json         la lista de herramientas: la leen el hub y todos los lanzadores
  tools.ts           la lee, la valida y dice cuáles se muestran
  locales.ts         EN y ES, sus formatos (Intl) y direcciones por idioma
  detect.ts          el script de idioma y el país del idioma del navegador: no guardan nada
  format.ts          números, dinero, porcentajes y fechas en cada idioma (con el signo menos −)
  plain-language.ts  el test de lenguaje sencillo: frases cortas, sin jerga, sin consejos (research/legal)
  checks.ts          peso por página, peticiones a otros sitios, almacenamiento
  vision.ts          para las pruebas en navegador: daltonismo emulado, distancia de color, contraste AA
  serve.ts           para las pruebas en navegador: sirve una web compilada desde esta máquina
  html.ts            plantillas HTML que escapan todo por defecto
  page.ts            el documento de una página estática: head, cabecera, página, pie
  legal.ts           la página de privacidad y condiciones de cada herramienta, EN/ES
  browser.ts         el código de una herramienta para el navegador, sin bundler
  icons.ts           la semilla, el favicon, el lanzador, el tema, ▲/▼ y los iconos de principios
  site.ts            la dirección del hub y el contacto
  cost-of-living.ts  el coste de vida de 172 países (data/): precios, alquiler e inflación
  inflation-rates.ts solo la inflación de referencia de cada país (3 KB), para una primera pantalla ligera
  country-names.ts   los nombres de los 172 países, EN/ES, en tabla y en frase
  official/          los datos oficiales: forma, lista de series y comprobaciones (series.ts),
                     lectores del Banco Mundial, Eurostat y CLDR, y el acceso en el build (data.ts)
  data/official/     las series oficiales, cada una con fuente, URL, licencia, fecha de descarga
                     y año de los datos, y REPORT.md (el informe de la última descarga)
scripts/             official-data.ts descarga y comprueba los datos oficiales (una vez al año);
                     official-data.workflow.yml es su workflow, para copiar a .github/workflows/;
                     inflation-rates.ts escribe data/inflation-rates.json desde el coste de vida
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
  pintan el mismo modelo con el mismo marcado; un test de Horalis Crecimiento
  compara los dos.
- **Sin cookies ni almacenamiento, salvo el tema de la pestaña.** El
  script de idioma no guarda nada. El tema elegido en la cabecera (claro u
  oscuro) es lo único que una app guarda en el navegador: una clave
  (`sk-theme`) en `sessionStorage`, que el navegador borra al cerrar la
  pestaña; "Automático" la borra al momento y nunca se envía. `checks.ts`
  da a cada app los tests para comprobarlo en sus páginas, y solo deja
  pasar esa clave escrita tal cual; las páginas de privacidad lo explican
  (`legal.ts`).
- **Nada solo por color.** Una ganancia lleva signo y ▲, una pérdida, el
  signo menos (−, no el guion) y ▼ (`icons.ts`, `react/trend.tsx`); los
  verdes y rojos de `tokens.css` se distinguen también con deuteranopía,
  protanopía y tritanopía, y cada app lo comprueba en sus pruebas de
  navegador con la emulación del propio navegador (`vision.ts`).
- **Sin bundler.** `browser.ts` toma el script de una página y todo lo
  que importa (de la herramienta y del kit), le quita los tipos con el
  propio Node (`stripTypeScriptTypes`) y lo escribe como módulos `.js`
  con la misma estructura, así que el navegador corre el mismo código
  que los tests.

## El tema: claro, oscuro o automático

La cabecera de todas las apps tiene un menú con tres opciones;
"Automático" (el modo del dispositivo) es la de partida. La elección se
guarda solo para la pestaña y viaja en `<html data-theme>`, que
`tokens.css` pinta: un modo elegido gana también a las franjas fijas del
hub (`.theme-dark`, `.theme-light`), que vuelven a alternar en
"Automático".

- **Antes de pintar.** `themeScript()` va el primero en el `<head>`: lee
  la pestaña y pone el atributo, así que nada parpadea en el otro modo.
  Con `{ menu: true }` (apps sin framework, lo pone `page.ts`) también
  lleva el menú: cada copia de los botones y el color de la barra del
  navegador siguen la elección, y los menús de la cabecera se cierran con
  Escape o al tocar fuera. En React lo hace `react/chrome.tsx`.
- **En un móvil estrecho** (hasta 424 px) no cabe junto a EN/ES con el
  nombre más largo (Horalis Cost of Living): las opciones pasan al pie del panel
  del lanzador. Solo se ve una copia.
- **Sin scripts** no hay menú, y la página sigue al dispositivo.

## Los datos oficiales

Todas las herramientas leen los datos de aquí: un solo módulo, nunca una
copia. Cada serie es un archivo de `src/data/official/` con sus cifras
por país y año y, junto a ellas, de dónde salen (`meta`: fuente, códigos,
URL, licencia, fecha de descarga, año de los datos y, si lo es, por qué es
provisional). `src/official/data.ts` las lee y las comprueba al compilar:
un archivo que no pasa sus comprobaciones para el build.

| Serie | Fuente | Para qué |
| --- | --- | --- |
| `wb-inflation` | Banco Mundial, FP.CPI.TOTL.ZG | inflación anual de cualquier país |
| `eurostat-hicp` | Eurostat, prc_hicp_aind (IPCA) | inflación anual de la UE, la zona euro y sus 27 países |
| `wb-fx` | Banco Mundial, PA.NUS.FCRF | tipo de cambio oficial, media del año (moneda local por dólar) |
| `wb-ppp` | Banco Mundial, PA.NUS.PPP (PCI) | paridad de poder adquisitivo |
| `wb-price-level` | Banco Mundial, PA.NUS.PPPC.RF (PCI) | nivel de precios (1 = EE. UU.) |
| `wb-survey-mean` | Banco Mundial, SI.SPR.PCAP | gasto o ingreso medio por persona y día, de las encuestas de hogares |
| `countries.json` | Banco Mundial y Unicode CLDR | los países, y la moneda de cada uno (ISO 4217) |

**Licencias.**
- Solo series que permiten uso comercial y redistribución. El Banco Mundial
  publica estas series con CC BY 4.0, y la descarga lee la licencia de cada
  una en sus metadatos.
- De Eurostat solo se usan los países de la UE: sus cifras de otros países no
  permiten uso comercial.
- El FMI no se usa: pide permiso para el uso comercial y para descargas
  automáticas.

**Una vez al año.** `npm run official-data` lo descarga todo y lo comprueba
antes de escribir nada:
- valores en su rango;
- suficientes países, y no menos que los que había;
- un año de datos reciente, nunca más antiguo que el que había;
- sin saltos absurdos de un año a otro (los cambios de moneda y la
  hiperinflación que ya estaban se reconocen).

Si algo falla, no cambia ningún dato y lo explica en `REPORT.md`. El
workflow `scripts/official-data.workflow.yml` lo ejecuta el 1 de julio,
pasa los tests y abre una pull request con el informe; hay que copiarlo
una vez a `.github/workflows/` (ver su cabecera). Método y límites:
[research/datos-oficiales.md](../../research/datos-oficiales.md).

**Hoy los datos son provisionales.** La sesión que hizo este módulo no
llegaba al Banco Mundial ni a Eurostat:
- Las series del Banco Mundial salen de su espejo público
  (github.com/datasets/world-development-indicators, actualización
  automática del 1 de julio de 2026).
- Las de Eurostat salen de las cifras tecleadas a mano de Inflation Lens.

Cada archivo lo dice en `meta.provisional` y las páginas lo muestran. La
primera ejecución del workflow los sustituye por los de la fuente.

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
- **Horalis Crecimiento** (Next.js): el alias `@seed-kit/*` de `tsconfig.json`,
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
