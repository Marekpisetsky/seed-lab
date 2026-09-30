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

**Estado actual (2026-09-30):** dos pantallas (Next.js 16 + TypeScript +
Tailwind 4), exportadas como sitio estático. La principal es una
**calculadora que funciona sola desde el primer segundo**; todo lo demás
son resultados en posiciones fijas, y las metas son opcionales. La app no
supone nada sobre la vida del usuario: no pregunta país, ni si alquila o
es propietario, ni qué quiere hacer con su dinero. Nada se guarda ni se
envía, y la app no llama a ningún servicio mientras se usa. La lógica
vive en funciones puras con unos 380 tests unitarios (Vitest). Todavía
sin validar con uso propio sostenido.

- **My money — `/`**, de arriba abajo:
  1. **La calculadora**: una tarjeta con cuatro campos: *You have* (€),
     *You add each month* (€), *Invested in* (S&P 500, World,
     Nasdaq-100 o mi cartera) y *For* (años, 1-60). Arranca con valores
     reales editables (€1.000, €200, S&P 500, 20 años), así que hay
     resultado desde el primer segundo. Se recalcula cuando el usuario
     termina de escribir (500 ms sin teclear, al salir del campo o con
     Enter), nunca con cada tecla; tras un cambio se marcan un momento
     solo las cifras que cambiaron y nada cambia de sitio.
  2. **El resultado**, siempre en el mismo sitio: "In 20 years you'll have
     €112,288" (grande); "It could pay you €374/month" con un selector
     pequeño de retiro (3/4/5 %) y cuántas historias aguantó 30 años
     ("93% of S&P 500 histories"); "You put in €49,000 · growth added
     €63,288"; y un gráfico anual: lo aportado y el crecimiento como
     áreas apiladas, con dos líneas discontinuas donde terminaron 8 de
     cada 10 historias del Monte Carlo (tooltip y tabla año a año).
  3. **My goals** (opcional, ninguna al empezar): solo un botón discreto
     "+ Add a goal". Cuatro tipos combinables, tantas como se quiera:
     *Live somewhere* (un país, con o sin vivienda), *Buy something* (de
     la lista o propia, con su precio), *Reach an amount* y *Monthly
     income*. Cada meta es una fila fija, en el orden en que se añadió y
     calculada por separado sobre el mismo plan: "✓ now", "in 12 years
     (2038)" o, a más de 60 años, "not at this pace — needs €327/month
     for 30 years". Se toca para ver el cálculo; × la quita.
  4. **What €374/month covers**: los 30 países del dataset, del más
     barato al más caro, con dos columnas a la vez (sin vivienda / con
     vivienda, una persona, al mes). Cada celda: ✓ si ese ingreso la
     paga, o "in N years" (redondeado hacia arriba) / "not at this pace".
     Por defecto los 5 más baratos + Perú + Países Bajos; "Show all 30"
     despliega. Cada fila tiene un "+" para añadirla a My goals (con o
     sin vivienda, lo elige el usuario).
  5. Plegados: **What you should know** (hasta 3 hallazgos sobre los años
     elegidos, sobre la primera meta si la hay; se calculan al abrir) y
     **Things you could buy** (las 19 compras con "✓ now" o "in N years",
     su fuente al tocarlas y un "+" para añadirlas a My goals).
- **My stocks — `/stocks`** (antes Charts): ganancia, holdings (añadir,
  editar, importar CSV), cómo se movió cada uno, y los 3 ETFs (VUAA,
  VWCE, EQQQ) y 12 acciones grandes con su gráfico, su pasado ("past, not
  a forecast") y "Use as my investment". `/charts` y `/fire` redirigen.

Limitaciones conocidas: no convierte entre monedas (la meta, el ingreso
y la cartera ponderada solo cuentan holdings en EUR); las ganancias
realizadas (ventas) no se muestran; el costo de vida es por país (las
ciudades varían mucho); Yahoo y Stooq son fuentes no
oficiales que pueden fallar (el Action conserva los datos anteriores);
los retornos de los índices están en dólares y se comparan en 1988–2022,
porque el S&P 500 de Shiller llega a 2022; el Nasdaq-100 es solo precio.

## Arquitectura

- Next.js (App Router) + TypeScript con `output: "export"`: `next build`
  genera HTML/CSS/JS estático en `out/`, servido por la CDN de Vercel sin
  funciones ni rutas de servidor.
- **Sin backend, sin base de datos, sin almacenamiento.** El estado (el
  plan, los holdings y los CSV de precios subidos) vive en memoria
  (`src/lib/app-store.ts`): nada va a `localStorage`, cookies ni a un
  servidor, y recargar vuelve a la calculadora con los valores de ejemplo. "Download my data"
  genera un JSON local y "Load my data" lo lee en el navegador, sin
  subirlo. Si una versión anterior dejó datos en `localStorage`, la app
  ofrece una vez cargarlos o borrarlos, y los borra en ambos casos.
- **Cero llamadas en tiempo de uso.** Los precios llegan como archivos
  estáticos del propio sitio (ver "Precios diarios"); los retornos de
  los índices y el costo de vida son JSON dentro del bundle.
- Un solo plan (`Plan` en `src/lib/types.ts`): dos importes, la
  inversión, los años, la tasa de retiro, la inflación y las metas (una
  lista, vacía al empezar). `src/lib/calculator.ts` deriva de él todo lo
  que se ve (resultado, metas, tabla de países, compras) y
  `src/hooks/use-calculation.ts` lo calcula una vez por cambio para todas
  las secciones (medido como `performance.measure("wealth-lens:report")`:
  0,3 ms por cambio tras el primero). El archivo de datos va por la
  versión 4 y lee las anteriores: la misión guardada (v3), la conexión
  fijada (v2) o la meta en euros (v1) pasan a ser la primera meta de My
  goals, y los elementos propios las siguientes. "Stop working" se
  convierte en vivir en el país que aquella versión preguntaba, con
  vivienda si alquilaba; lo que no se puede decir sin suponer un país
  propio (4 días, media jornada, "la app elegía") se omite.
- En qué crece el plan (`src/lib/investment.ts`): S&P 500, World o
  Nasdaq-100 (su promedio real en el periodo común, ver abajo), la cartera real (cada holding
  cuenta hacia el índice que sigue —o el más cercano— ponderado por su
  valor en EUR), una acción (proyectada con su índice más cercano, nunca
  con su propio pasado) o un % propio. La misma historia alimenta el
  Monte Carlo.
- Velocidad: las dos pantallas se prerenderizan con sus valores de
  llegada (la calculadora con su resultado, la lista de acciones), así
  que se ven antes de que corra el JavaScript. Las tasas de éxito de
  3/4/5 % de cada índice están precalculadas (`src/lib/success-table.ts`,
  un test las recalcula exactas), así que la primera pantalla no simula
  nada; el gráfico calcula su banda (~7 ms) después de hidratar, en una
  caja de la misma altura. Los hallazgos y las compras se calculan al
  abrirlos. Los parsers de CSV se cargan al elegir un archivo, y la
  librería de gráficos y el historial de precios al abrir un gráfico. El
  Monte Carlo guarda las trayectorias aleatorias por historia (el saldo es
  lineal en el capital y el aporte), así que teclear no vuelve a simular.
- Sin credenciales de bróker ni APIs de pago — respeta la regla de
  costo cero de seed-lab.

## Resultados: metas, países, hallazgos

**Metas** (`goalStatuses` en `src/lib/calculator.ts`). Cada una se
calcula sola sobre el mismo plan: vivir en un país o un ingreso mensual
necesitan el capital cuyo retiro lo paga (coste × 12 ÷ tasa de retiro);
una compra o un importe, esa cifra. **Tope de 60 años** (`MAX_YEARS`):
más allá, "not at this pace" con el aporte mensual que la lograría en 30
años, y ninguna cifra cita una fecha más lejana. Una compra que un
archivo nombra pero la lista ya no tiene se muestra como "Not in the list
any more" y se puede quitar. Las entradas extremas (€1, €0, €0 al mes,
€10.000.000, €1.000.000 al mes, 0 % o −2 % de crecimiento, 1 y 60 años)
tienen sus tests en `src/lib/edge-cases.test.ts`: "under €1/month" en
vez de €0, sin "-€0", sin años de más de 60.

**Países** (`countryRows`): una fila por país del dataset de costo de
vida, ordenadas por coste sin vivienda; "con vivienda" suma el alquiler
de un 1 dormitorio fuera del centro. ✓ cuando el ingreso al cabo de los
años elegidos lo paga; si no, cuándo llega el plan. Los estados se
redondean hacia arriba a años enteros, así que una celda sin ✓ a 20 años
nunca dice "in 20 years".

**Hallazgos** (`src/lib/findings.ts`, una función pura por regla, cada
una con su regla de relevancia; se muestran los 3 primeros que aplican,
en el orden fijo de `ORDER`, y ninguno dice "deberías"). Hablan de los
años elegidos; los de "llegar" hablan de la primera meta cuando está a
2+ años (palanca) o 5+ años (secuencia), y si no, del resultado:

| Hallazgo | Aparece cuando | Número |
| --- | --- | --- |
| Concentración | una acción individual > 40 % de la cartera en EUR | su peso, su caída máxima y su cambio a 1 año |
| Moneda | hay holdings en otra moneda (no se convierten) | el importe que queda fuera del cálculo, o cuántas monedas |
| Palanca más fuerte | +€100/mes vs +1 % de crecimiento vs haber empezado un año antes: gana 6+ meses en la primera meta, o ≥ €1.000 y ≥ 5 % al final | años antes, o € de más |
| Riesgo de secuencia | una mala primera década (percentil 10 del Monte Carlo) retrasa la primera meta 1+ año, o deja ≥ €1.000 y ≥ 5 % menos al final | años de retraso o € de menos |
| Inflación | 5+ años y un resultado de €1.000 o más | lo que mostrará la cuenta en euros de ese año (la app cuenta en euros de hoy) |
| Coste de esperar | 2+ años y empezar un año más tarde cuesta ≥ €500 y ≥ 2 % | € de menos al final |
| Comisiones | 5+ años y la diferencia ≥ €1.000 | fondo al 1 % vs al 0,2 % |
| Pasado de una acción | se invierte en una acción | su crecimiento pasado vs su índice |
| Duplicación | crecimiento ≥ 2 % al año | cada cuántos años se duplica |

**Compras** (`src/data/connections.json` + `src/lib/connections.ts`): 19
compras con fuente y fecha, marcadas como estimación, ninguna calculada
desde un "país propio" (el colchón de 6 meses y el sabático se quitaron).
Las estancias (tres meses en Japón, un año por el sudeste asiático, seis
meses en Portugal, un máster en NL) se calculan con el costo de vida de
ese país, con vivienda. Importes en euros de hoy; los de USD se
convierten con el tipo guardado en el archivo.

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

**Periodo común.** Los tres índices se comparan sobre los mismos años, el
periodo más largo que cubren los tres: hoy **1988–2022** (35 años;
`COMMON_PERIOD` en `src/lib/indexes.ts`, calculado de los datos). Esas
rentabilidades alimentan todo: palancas, proyecciones, cartera
ponderada, % propio y Monte Carlo, y la app muestra el periodo junto a
cada cifra. Promedio real anual en 1988–2022: S&P 500 7,5 %, World
4,5 %, Nasdaq-100 9,9 % (solo precio: la tarjeta dice "no dividends";
los dividendos sumarían aproximadamente un 1 % anual). Los datasets
completos (1928–2022, 1988–2024, 1986–2024) se conservan y se validan
igual. Para alargar el periodo hace falta el S&P 500 de 2023 en adelante
con el mismo método (enero a enero, de los datos de Shiller).

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
€1000/mes), la calculadora (resultado de €1.000 + €200/mes a 20 años, lo
aportado y el crecimiento, el gráfico que termina en el resultado), la
tabla de países (30 filas ordenadas, dos columnas, ✓ si y solo si el
ingreso lo paga, filas por defecto), las metas (cada tipo, varias,
independientes, orden estable al añadir y quitar, tope de 60 años con el
aporte para 30), las compras, el motor de hallazgos (cada regla: cuándo
aparece, cuándo no y su número, con y sin metas), las tasas de éxito
precalculadas (recalculadas exactas), el plan v4 y la conversión de
archivos v1, v2 y v3 a metas, la ponderación de la cartera por índice,
los datasets de índices (cada retorno real recalculado; MSCI contra sus
fichas), el archivo de datos (ida y vuelta, archivos dañados o ajenos),
la limpieza de datos antiguos, el importador de Trading 212, el parser de
CSV, el precio automático desde datos estáticos o CSV (nunca pisa un
precio escrito a mano), el Monte Carlo (semilla fija) y el costo de vida.
Del job de precios: parsers de Yahoo y Stooq contra fixtures, la cadena
de respaldo con `fetch` simulado, la codificación del historial (ida y
vuelta con el lector de la app) y las reglas para conservar los datos
anteriores.

## Mapa del código

```
scripts/
  update-prices.mts            job diario: descarga y escribe public/data/
  update-prices.workflow.yml   el GitHub Action (copiar a .github/workflows/)
  lib/                         yahoo, stooq, cadena de respaldo, armado de archivos
public/data/                   precios generados por el job (no editar a mano)
src/
  app/                         rutas: / (My money), /stocks (My stocks);
                               /charts y /fire redirigen
  components/                  money/ (calculadora, resultado, gráfico, metas,
                               países, hallazgos, compras), stocks/, charts/,
                               portfolio/ (holdings, CSV), ui/ (changed: marca
                               lo que cambió)
  hooks/                       use-app (estado), use-calculation (todo por cambio),
                               use-plan, use-history (historial al abrir un gráfico)
  lib/
    app-store.ts        estado en memoria (plan, holdings, CSV subidos)
    calculator.ts       resultado, metas, tabla de países, compras, tope de 60 años
    settle.ts           aplica un número cuando se termina de escribir (500 ms)
    findings.ts         "What you should know": una regla por hallazgo
    connections.ts      la lista de compras, con fuentes
    simulation.ts       bandas de Monte Carlo y cachés de simulación
    success-table.ts    tasas de éxito de 3/4/5 % precalculadas por índice
    investment.ts       en qué crece el plan: índice, cartera ponderada, acción, % propio
    indexes.ts          datasets de retornos reales de los 3 índices
    market-data.ts      lista curada + precios estáticos (formato en market-format.ts)
    auto-price.ts       precio actual de un holding desde datos estáticos o CSV
    data-file.ts        "Download my data" / "Load my data"
    legacy-storage.ts   limpieza de datos que dejaron versiones anteriores
    finance.ts          matemática financiera (funciones puras)
    monte-carlo.ts      probabilidad de que una tasa de retiro dure 30 años
    validation.ts       validación de todo lo que se carga desde un archivo
    import/             importadores CSV (Trading 212, CSV simple)
  data/
    instruments.json            lista curada de ETFs y acciones
    sp500-real-returns.json     S&P 500 (Shiller)
    msci-world-real-returns.json, nasdaq100-real-returns.json
    cost-of-living.json         dataset curado (30 países, EUR, con/sin alquiler)
    connections.json            las compras, con fuente y fecha
```

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.
