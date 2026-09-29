# wealth-lens

**Misión:** darle a Marek una vista propia y honesta de su situación
financiera personal — cuánto ganó realmente, cuánto le falta para una
meta, y qué tan lejos o cerca está de la independencia financiera en
distintos lugares del mundo — sin depender de lo que un broker decide
mostrar.

**Qué NO es:**
- No es un producto para vender ni para terceros — el único cliente es
  Marek mismo (uso propio, encaja en el criterio nuevo de
  `seed-lab/projects/README.md`: adopción orgánica o uso propio, no
  venta activa).
- No da consejo financiero ni recomienda qué comprar/vender — solo
  calcula y visualiza datos que el propio Marek ingresa o que vienen de
  fuentes públicas.
- No gestiona ni mueve dinero real, no se conecta a ninguna cuenta de
  bróker vía API/credenciales — la entrada de datos de cartera es
  manual o por archivo exportado, nunca automática contra una cuenta
  real.
- No promete que la regla del 4% o el 7% real sean garantías — son
  estimaciones históricas con riesgo de secuencia, moneda e inflación
  local, y la app lo dice explícitamente en la UI, no solo acá.

**Estado actual (2026-09-29):** los tres módulos funcionan de punta a
punta (Next.js 16 + TypeScript + Tailwind 4), exportados como sitio
estático. Un solo plan compartido alimenta las tres pantallas; nada se
guarda ni se envía, y la app no llama a ningún servicio mientras se usa.
La matemática vive en funciones puras con más de 300 tests unitarios
(Vitest). Todavía sin validar con uso propio sostenido.

- **Primer uso (y tras cada recarga):** 3 preguntas (cuánto tienes
  invertido, cuánto añades al mes, tu meta). Alternativas: importar el
  export de Trading 212 o "Load my data" (un archivo descargado antes).
- **Portfolio & goal — `/`:** "You've gained +€X", la meta activa
  ("Goal reached in ~N years (mes año)" o "Live in India: €99,000 needed
  · ~N years (año) · ≈ €330/month") con barra de progreso, en qué crece
  el plan ("Grows like the S&P 500: 6.6% a year after inflation" +
  "Change"), y el ingreso mensual: "Today your portfolio would pay ≈ €X/month"
  / "At your goal you could withdraw ≈ €Y/month". Holdings con editar/eliminar
  en "⋯"; el precio se rellena solo desde los precios diarios si el ticker
  está en la lista curada ("price from DD/MM"), si no, precio a mano o CSV.
  En "Advanced": escenarios 3/5/7/10 %, inflación y fecha objetivo.
- **Charts — `/charts`:** tus holdings y, debajo, los 3 ETFs (VUAA,
  VWCE, EQQQ) y 12 acciones grandes, con mini-gráfico SVG y % de 12
  meses. Al tocar uno se abre el gráfico (lightweight-charts, cargado
  solo entonces), su crecimiento pasado ("past, not a forecast") y
  "Use as my investment". Una línea: "Prices updated DD/MM".
- **FIRE by country — `/fire`:** probabilidad de que el dinero dure 30
  años según la tasa de retiro (3/4/5/7 %), simulada con la historia de
  lo que el plan invierte; ingreso mensual a la meta; capital necesario,
  años y ≈ €/mes por país. Tocar un país lo convierte en la meta activa
  (Portfolio y la barra de progreso pasan a esa meta; un botón vuelve a
  la meta en euros).

Limitaciones conocidas: no convierte entre monedas (la meta, el ingreso
y la cartera ponderada solo cuentan holdings en EUR); las ganancias
realizadas (ventas) no se muestran; Yahoo y Stooq son fuentes no
oficiales que pueden fallar (el Action conserva los datos anteriores);
los retornos de los índices están en dólares y el S&P 500 llega a 2022.

## Arquitectura

- Next.js (App Router) + TypeScript con `output: "export"`: `next build`
  genera HTML/CSS/JS estático en `out/`, servido por la CDN de Vercel sin
  funciones ni rutas de servidor.
- **Sin backend, sin base de datos, sin almacenamiento.** El estado (el
  plan, los holdings y los CSV de precios subidos) vive en memoria
  (`src/lib/app-store.ts`): nada va a `localStorage`, cookies ni a un
  servidor, y recargar vuelve a las 3 preguntas. "Download my data"
  genera un JSON local y "Load my data" lo lee en el navegador, sin
  subirlo. Si una versión anterior dejó datos en `localStorage`, la app
  ofrece una vez cargarlos o borrarlos, y los borra en ambos casos.
- **Cero llamadas en tiempo de uso.** Los precios llegan como archivos
  estáticos del propio sitio (ver "Precios diarios"); los retornos de
  los índices y el costo de vida son JSON dentro del bundle.
- Un solo plan: `src/lib/plan-view.ts` deriva de él capital, crecimiento,
  meta activa, proyección e ingreso mensual, y todas las pantallas lo
  leen, así que cambiar un dato actualiza todo a la vez.
- En qué crece el plan (`src/lib/investment.ts`): S&P 500, World o
  Nasdaq-100 (su promedio real histórico), la cartera real (cada holding
  cuenta hacia el índice que sigue —o el más cercano— ponderado por su
  valor en EUR), una acción (proyectada con su índice más cercano, nunca
  con su propio pasado) o un % propio. La misma historia alimenta el
  Monte Carlo.
- Velocidad: la primera pantalla solo carga lo necesario para las 3
  preguntas; el resto de cada pantalla se carga aparte (y se precarga al
  primer toque), los parsers de CSV al elegir un archivo, y la librería
  de gráficos y el historial de precios al abrir un gráfico.
- Sin credenciales de bróker ni APIs de pago — respeta la regla de
  costo cero de seed-lab.

## Módulo 1 — Tracker de ganancia + tiempo a la meta

- Entrada: cartera actual (holdings + costo base, ingresado a mano o
  importado de un CSV tipo Trading212/Trade Republic) y una meta en
  euros.
- Calcula: ganancia/pérdida real (no solo % del broker), y con un
  retorno esperado configurable (hoy: el promedio histórico real del
  índice en el que invierte, o el que escriba el usuario) + aporte mensual
  opcional, proyecta en cuántos años se llega a la meta (fórmula de
  valor futuro con aportes periódicos, no una regla de tres simple).
- Mostrar siempre el supuesto de retorno usado al lado del número — un
  cambio de 5%→9% cambia mucho el resultado, no ocultarlo.

## Módulo 2 — Gráficos de acciones por separado

- Por cada holding de la cartera, un gráfico de precio propio (no todo
  amontonado en una sola curva de "valor total" como hacen la mayoría
  de los brokers).
- Fuente de datos: **Stooq** (`https://stooq.com/q/d/l/?s=TICKER&i=d`,
  CSV histórico diario, sin API key) como fuente gratuita por defecto.
  Documentar en el código que es una fuente no oficial de terceros —
  aceptable para uso personal, no para un producto que se vende.
  *(Actualización: Stooq rechaza las peticiones desde Vercel, así que la
  fuente principal pasó a ser Yahoo Finance —endpoint público de
  gráficos, sin key— y Stooq quedó como respaldo.)*
  *(Actualización 2: la app ya no pide precios mientras se usa. Un
  GitHub Action diario descarga Yahoo/Stooq y commitea archivos
  estáticos; ver "Precios diarios".)*

## Módulo 3 — Simulador FIRE / costo de vida

- Entrada: capital actual, retorno real esperado (default 7%), tasa de
  retiro seguro (default 4%, editable).
- Calcula: ingreso anual/mensual sostenible = capital × tasa de retiro.
- Compara ese ingreso contra un **dataset propio y curado** de costo de
  vida mensual aproximado (persona sola, sin alquiler y con alquiler)
  para ~30-40 países — construido a mano con fuentes públicas (Numbeo,
  informes de costo de vida de bancos, Eurostat/World Bank), etiquetado
  claramente como estimación aproximada con fecha de referencia, no
  dato en vivo.
- La UI tiene que mostrar las advertencias de la sección "Qué NO es"
  (riesgo de secuencia, moneda, inflación local) cerca del resultado,
  no en un footer que nadie lee.

## Plan de construcción

Los tres módulos se buildean en paralelo dentro del mismo scaffold ya
creado (decisión de Marek, 2026-09-29: no secuenciar MVP por módulo).
Orden sugerido de implementación técnica (no de prioridad de producto):
1. Estructura de datos compartida (holding, transacción, meta,
   supuestos) + persistencia en `localStorage` *(reemplazada: hoy no se
   guarda nada, ver "Arquitectura")*.
2. Módulo 1 (el cálculo es el más simple y no depende de red).
3. Módulo 3 (dataset estático, sin dependencia de red tampoco).
4. Módulo 2 (el único que depende de una fuente de datos externa,
   Stooq — dejarlo último por si hay que lidiar con CORS/rate limits).

## Precios diarios (GitHub Action)

La app nunca llama a Yahoo ni a Stooq. Un job diario
(`scripts/update-prices.mts`, Node 22 sin dependencias) descarga 10 años
de cierres diarios de la lista curada `src/data/instruments.json` —Yahoo
Finance primero (dos hosts) y Stooq como respaldo— y escribe:

- `public/data/prices.json`: último cierre, fecha, moneda, mini-serie de
  12 meses, cambio a 1 año y crecimiento pasado por instrumento (una línea
  por instrumento). Se importa en el build, así que va dentro de la página.
- `public/data/history/<ID>.json`: la serie diaria compacta (desplazamiento
  en días + cierre), que la app pide a su propio sitio solo al abrir el
  gráfico.

Si un instrumento falla o la respuesta es rara (otra moneda, datos viejos,
un salto ×5), se conserva lo anterior; los archivos solo se reescriben si
cambian, y el job nunca falla porque una fuente esté caída. El commit a
`master` hace que Vercel redespliegue.

**Instalarlo (una vez).** GitHub solo ejecuta workflows que estén en
`.github/workflows/` en la raíz del repo. Copiar
`projects/wealth-lens/scripts/update-prices.workflow.yml` a
`.github/workflows/update-prices.yml` (en GitHub: Add file → Create new
file, pegar el contenido y commitear en `master`).

**Primera ejecución a mano.** En GitHub: Actions → "Update prices" → Run
workflow (rama `master`). Tarda menos de un minuto; el resumen del run
dice qué instrumentos se descargaron y el commit "Update prices (fecha)"
dispara el redeploy. Después corre solo cada día a las 22:40 UTC. En
repos públicos GitHub pausa los workflows programados tras 60 días sin
actividad; si pasa, se reactiva desde la pestaña Actions.

A mano en local (necesita salida a internet): `npm run update-prices`.

**Añadir un instrumento.** Agregar una entrada a
`src/data/instruments.json`:

```json
{ "id": "SXR8", "name": "iShares Core S&P 500", "kind": "etf", "index": "sp500",
  "symbol": "SXR8.DE", "stooq": "sxr8.de", "currency": "EUR" }
```

- `id`: el ticker como lo conoce el usuario (el que escribe en sus holdings).
- `symbol`: símbolo de Yahoo (`AAPL` para EE. UU.; `.DE` Xetra, `.AS`
  Ámsterdam, `.PA` París, `.L` Londres).
- `stooq`: símbolo de Stooq (`aapl.us`, `sxr8.de`) o `null` si no lo tiene.
- `currency`: moneda en la que cotiza ese listado (si Yahoo informa otra,
  el job lo rechaza).
- `kind` + `index`: un ETF indica el índice que sigue; una acción, el
  índice más cercano con el que se proyecta (`sp500`, `world` o `nasdaq100`).

Los tests (`src/lib/market-data.test.ts`) validan la lista; el próximo
run del Action descarga el nuevo instrumento. Para que la cartera
ponderada reconozca otro ETF sin descargar sus precios, basta con añadir
su ticker a `trackers` en el mismo archivo.

**Retornos de los índices** (`src/data/*-real-returns.json`, con fuente y
fecha): S&P 500 1928–2022 (Robert Shiller, retorno total real), MSCI World
1988–2024 (retorno neto en USD de las fichas de MSCI) y Nasdaq-100
1986–2024 (cierres anuales, solo precio: sin dividendos, ~1 % anual), estos
dos deflactados con el IPC de EE. UU. de diciembre a diciembre. Los de
MSCI World y Nasdaq-100 se introdujeron a mano desde las tablas publicadas
y se verificaron contra los retornos anualizados a 3/5/10 años de las
fichas de MSCI y contra los % anuales publicados; los tests recalculan
cada retorno real desde las cifras nominales guardadas.

## Cómo correrlo

Requisitos: Node.js 22.18 o más nuevo (el job de precios ejecuta
TypeScript directamente) y npm.

```bash
cd projects/wealth-lens
npm install       # o `npm ci` para instalar exactamente el lockfile
npm run dev       # servidor de desarrollo en http://localhost:3000
```

Build de producción local (sitio estático en `out/`):

```bash
npm run build
npm start         # sirve out/ en http://localhost:3000 (npx serve)
```

Para probarlo en el móvil, servir el build (`npm run build` + `npm start`)
y abrir `http://<IP-de-la-máquina>:3000` desde la misma red.

## Tests y chequeos

```bash
npm test          # tests unitarios (Vitest), una sola pasada
npm run test:watch
npm run lint      # ESLint (config de Next.js)
npm run build     # también verifica los tipos de TypeScript
```

Los tests cubren la lógica, que vive separada de la UI en `src/lib/` y
`scripts/lib/`: matemática financiera con casos verificados a mano (€1000
al 7 % por 10 años = €1967.15, 4 % de €1000 = €40/año, €300.000 al 4 % =
€1000/mes), el plan compartido (un cambio actualiza todas las cifras), la
conversión país → meta (India con alquiler: €330/mes → €99.000 al 4 %),
la ponderación de la cartera por índice, la mezcla de series y el
crecimiento propio escalado, los datasets de índices (cada retorno real
recalculado; MSCI contra sus fichas), el archivo de datos (ida y vuelta,
archivos dañados o ajenos), la limpieza de datos antiguos, el importador
de Trading 212, el parser de CSV, el precio automático desde datos
estáticos o CSV (nunca pisa un precio escrito a mano), el Monte Carlo
(semilla fija) y el costo de vida. Del job de precios: parsers de Yahoo y
Stooq contra fixtures, la cadena de respaldo con `fetch` simulado, la
codificación del historial (ida y vuelta con el lector de la app) y las
reglas para conservar los datos anteriores.

## Mapa del código

```
scripts/
  update-prices.mts            job diario: descarga y escribe public/data/
  update-prices.workflow.yml   el GitHub Action (copiar a .github/workflows/)
  lib/                         yahoo, stooq, cadena de respaldo, armado de archivos
public/data/                   precios generados por el job (no editar a mano)
src/
  app/                         rutas: / (módulo 1), /charts (2), /fire (3)
  components/                  UI por módulo (portfolio/, charts/, fire/),
                               plan/ (inversión, meta país), onboarding/, ui/
  hooks/                       use-app (estado), use-plan (plan derivado),
                               use-history (historial al abrir un gráfico)
  lib/
    app-store.ts        estado en memoria (plan, holdings, CSV subidos)
    plan-view.ts        todo lo derivado del plan: meta activa, proyección, ingreso
    investment.ts       en qué crece el plan: índice, cartera ponderada, acción, % propio
    indexes.ts          datasets de retornos reales de los 3 índices
    market-data.ts      lista curada + precios estáticos (formato en market-format.ts)
    auto-price.ts       precio actual de un holding desde datos estáticos o CSV
    data-file.ts        "Download my data" / "Load my data"
    legacy-storage.ts   limpieza de datos que dejaron versiones anteriores
    finance.ts          matemática financiera (funciones puras)
    goal-projection.ts  proyección hacia la meta
    fire.ts             cobertura y capital necesario por país
    monte-carlo.ts      probabilidad de que una tasa de retiro dure 30 años
    validation.ts       validación de todo lo que se carga desde un archivo
    import/             importadores CSV (Trading 212, CSV simple)
  data/
    instruments.json            lista curada de ETFs y acciones
    sp500-real-returns.json     S&P 500 (Shiller)
    msci-world-real-returns.json, nasdaq100-real-returns.json
    cost-of-living.json         dataset curado (30 países, EUR, con/sin alquiler)
```

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.
