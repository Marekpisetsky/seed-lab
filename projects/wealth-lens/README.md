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
vive en funciones puras con unos 500 tests unitarios (Vitest). Todavía
sin validar con uso propio sostenido. Solo se proyecta lo que tiene una
historia larga y un rango conocido; nada se presenta como predecible, y
todo supuesto viene relleno con un valor estándar documentado y se puede
cambiar. Todo lo visible está en palabras simples: "real", "nominal",
"volatility", "swings" y "percentile" solo aparecen en los "i" plegados
(un test lo comprueba).

- **My money — `/`**, de arriba abajo:
  1. **La calculadora**: una tarjeta con cuatro campos: *You have* (€),
     *You add each month* (€, con − / + de €50), *Invested in* y *For
     (years)* (1-60, con − / + de un año; los botones se aplican al
     instante). *Invested in* abre la lista, agrupada y con buscador por
     nombre o ticker de fondo: Indexes (S&P 500, World, Nasdaq-100), Bonds
     (bonos gubernamentales de la zona euro), Gold ("Low long-term growth,
     big ups and downs: protection, not growth"), Savings (cuenta de ahorro),
     Custom growth, My portfolio (si hay holdings) y "A mix…" (con
     plantillas 100% stocks, 80/20 y 60/40). Las acciones sueltas no se
     proyectan. Arranca con valores reales editables (€1.000, €200, S&P
     500, 20 años), así que hay resultado desde el primer segundo. Se
     recalcula cuando el usuario termina de escribir (500 ms sin teclear,
     al salir del campo o con Enter), nunca con cada tecla; tras un cambio
     se marcan un momento solo las cifras que cambiaron y nada cambia de
     sitio. Debajo, los supuestos en una línea ("Grows 7.5% a year after
     rising prices · can move ±16% in a year · data 1988–2022") con
     **Edit**: *How much it grows a year* (con conmutador *After rising
     prices* / *Before rising prices* y la ayuda "After rising prices =
     what your money can really buy."), *How much it can go up or down in
     a normal year* (con un ejemplo que cambia con la cifra: "e.g. a
     €10,000 year could end between €9,200 and €10,800"), *Rising prices
     in* (país, Países Bajos por defecto) y *Prices rise per year*, cada
     uno con su estándar al lado. Un cambio marca la línea como **Custom**
     y aparece *Reset to standard*; un "i" plegado explica cómo usan las
     simulaciones esas cifras, con sus nombres técnicos.
  2. **El resultado**, siempre en el mismo sitio: "In 20 years you'll have
     €112,288" (grande) y justo debajo, también grande, "Grows about 7.5%
     a year" con "(≈9.7% before inflation)" al lado; "Your money: ×2.3 ·
     growth added +€63,288 (+129%) · put in €49,000" (×Z = total final ÷
     lo aportado; P % = crecimiento ÷ lo aportado); "It could pay you
     €374/month" con un selector pequeño de retiro (3/4/5 %) y cuántas
     historias aguantó 30 años ("93% of S&P 500 histories").
     **What if…?**: cinco escenarios rápidos en fila fija, cada uno con su
     efecto en euros sobre el plan tal como está: *Grows 1% more* / *Grows
     1% less*, *+€50 a month*, *5 more years* y *A bad first decade* (los
     diez primeros años siguen el percentil 10 del Monte Carlo, con los
     supuestos Custom también; luego crece a la media). Tocar uno lo aplica
     a toda la pantalla (resultado, gráfico, metas y países) con "What if:
     5 more years ×" junto al total para quitarlo; otro lo cambia y el
     mismo lo quita. Los efectos se recalculan con el plan; la fila nunca
     cambia de orden ni de tamaño (en el móvil se desliza de lado), y un
     escenario que no aplica lo dice ("60 years at most", "No ups and
     downs here"). No se guarda en el archivo de datos. Y un gráfico
     anual: lo aportado y el crecimiento como áreas apiladas, con el % ganado
     al final de la curva ("+129%") y dos líneas discontinuas donde
     terminaron 8 de cada 10 historias del Monte Carlo; al pasar el ratón
     o tocar un año, "Year 2036: €48,200 · +37% so far" (y tabla año a
     año).
  3. **My goals** (opcional, ninguna al empezar): solo un botón discreto
     "+ Add a goal". Cuatro tipos combinables, tantas como se quiera:
     *Live somewhere* (un país, con o sin vivienda), *Buy something* (de
     la lista o propia, con su precio), *Reach an amount* y *A monthly
     amount* (un importe y una etiqueta opcional: "my expenses", "my
     mortgage"). Cada meta es una fila fija, en el orden en que se añadió y
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
  VWCE, EQQQ) y 12 acciones grandes con su gráfico y su pasado ("past, not
  a forecast"). Un ETF puede ser la inversión ("Use as my investment");
  una acción no se proyecta sola, y su fila dice cómo cuenta en My
  portfolio. `/charts` y `/fire` redirigen.

Limitaciones conocidas: no convierte entre monedas (la meta, el ingreso
y la cartera ponderada solo cuentan holdings en EUR); las ganancias
realizadas (ventas) no se muestran; el costo de vida es por país (las
ciudades varían mucho); Yahoo y Stooq son fuentes no
oficiales que pueden fallar (el Action conserva los datos anteriores);
los retornos de los índices y el oro están en dólares (después de la
inflación de EE. UU.) y los bonos en euros (después de la alemana), y todo
se compara en 1988–2022, porque el S&P 500 de Shiller llega a 2022; el
Nasdaq-100 es solo precio. Las series de bonos y oro se introdujeron a
mano desde las cifras publicadas (ver "Retornos").

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
  inversión, los años, la tasa de retiro, *Rising prices in* (`pricesOf`), lo que el usuario
  cambió de los supuestos (crecimiento real o nominal, oscilación,
  inflación; `null` = estándar) y las metas (una lista, vacía al empezar). `src/lib/calculator.ts` deriva de él todo lo
  que se ve (resultado, metas, tabla de países, compras) y
  `src/hooks/use-calculation.ts` lo calcula una vez por cambio para todas
  las secciones (medido como `performance.measure("wealth-lens:report")`:
  por debajo de 16 ms al escribir, usar − / +, cambiar la inversión o
  tocar un *What if…?*, con los efectos de los cinco incluidos; cargar un
  archivo con cartera tras una sesión larga llegó a 23-34 ms; ver
  "Velocidad"). El archivo de datos va por la
  versión 6: lleva *Rising prices in*, los supuestos cambiados y, en cada holding,
  a qué activo se asignó si el usuario lo cambió. Lee las anteriores: un
  índice (v1-v5) es ese activo; una acción proyectada sola (v5) pasa a My
  portfolio si el archivo la tiene, si no a su índice, y las acciones de
  una mezcla cuentan como su índice, cada cambio con un aviso de una línea
  bajo "Load my data"; un % propio pasa a Custom growth; una inflación
  distinta del antiguo 2 % queda como inflación escrita. Las metas
  mensuales "income" de la v4 pasan a *A monthly amount* con su nombre
  como etiqueta; la misión guardada (v3), la conexión
  fijada (v2) o la meta en euros (v1) pasan a ser la primera meta de My
  goals, y los elementos propios las siguientes. "Stop working" se
  convierte en vivir en el país que aquella versión preguntaba, con
  vivienda si alquilaba; lo que no se puede decir sin suponer un país
  propio (4 días, media jornada, "la app elegía") se omite.
- En qué crece el plan (`src/lib/assets.ts`, `src/lib/investment.ts`).
  Solo activos con historia larga y un rango conocido; los supuestos
  estándar salen de los datos y siempre se pueden cambiar:
  - **Un índice, bonos o el oro**: su crecimiento medio después de
    inflación en 1988–2022 y su oscilación (desviación de los retornos
    anuales en logaritmos); el Monte Carlo sortea sus años históricos.
  - **Cuenta de ahorro**: un tipo típico de 1,5 % (cifra redonda para
    cuentas de ahorro a la vista en euros en 2025–2026, por debajo del 2 %
    de depósito del BCE desde junio de 2025; editable) menos la inflación
    de *Rising prices in*: −0,5 % al año con la de Países Bajos. Sin oscilación:
    el resultado dice cuántos años dura el retiro ("it runs out after 23
    years") y el gráfico no dibuja banda.
  - **Una mezcla** (`src/lib/mix.ts`, documentado arriba del archivo y en
    un "i" plegado): hasta 10 de esos activos con % que suman 100,
    indicador del total, "Split evenly", plantillas (100 % acciones,
    80/20, 60/40: World y bonos euro, puntos de partida de manual, no
    consejo) y *Let weights drift* / *Rebalance every year*. Crecimiento:
    la media ponderada. Incertidumbre: 1.000 caminos de 60 años; cada año
    se sortea un año histórico común a todos los activos (acciones, bonos y
    oro se mueven juntos como lo hicieron; en 2022 cayeron acciones y
    bonos a la vez). Junto al resultado: "Range (8 in 10)" y "Worst year
    in the data", con las mismas cifras del S&P 500 solo, sobre los mismos
    años. Ninguna optimización ni sugerencia de pesos.
  - **My portfolio** (`src/lib/portfolio.ts`): "Simple projection: each
    stock grows like its index. Stocks can't be predicted." Cada holding
    en EUR crece como un activo: una acción de la lista, el índice de su
    mercado (tecnológicas de EE. UU. el Nasdaq-100, otras de EE. UU. el
    S&P 500, europeas World); un fondo, lo que tiene (índice, bonos, oro,
    por `trackers`); otro ticker, World marcado como suposición. El
    usuario lo cambia en la calculadora y queda guardado en el holding. Se
    pondera por valor y se simula con el motor de mezclas; una acción de
    la lista conserva sus propios altibajos (volatilidad de sus cierres
    diarios, correlación semanal con el ETF de su índice).
  - **Custom growth**: el % anual y la oscilación que escriba el usuario
    (arranca en los del S&P 500), sin ningún activo detrás.
  - **Supuestos cambiados**: con el crecimiento o la oscilación del
    usuario la historia ya no los describe, así que cada año se sortea de
    una normal en logaritmos, log(1 + r) ~ N(log(1 + g), σ²) (el año típico
    crece exactamente g; `src/lib/normal.ts`, 2.000 cuantiles
    equiespaciados); con oscilación 0, todos los años iguales. Cambiar solo
    la inflación no toca las simulaciones: solo convierte nominal ↔ real.
- **What if…?** (`src/lib/what-if.ts`; `calculate(plan, holdings, today,
  whatIf)` y `whatIfEffects` en `src/lib/calculator.ts`). Cada escenario
  cambia una sola entrada: el crecimiento ±1 % al año después de
  inflación (cada año simulado se multiplica por (1 + g ± 1 %) / (1 + g),
  así que las simulaciones y las tasas de éxito se mueven con él), el
  aporte + €50, los años + 5 (hasta 60) o un arranque fijo de diez años
  (el percentil 10 de las bandas del plan, año a año) seguido del
  crecimiento medio. El efecto de cada ficha y el escenario aplicado usan
  las mismas funciones, así que "+€64,000" es exactamente la diferencia
  que se ve al tocarla. El escenario activo vive en el estado en memoria,
  sigue puesto mientras cambia el plan y nunca se guarda. Los hallazgos
  siempre hablan del plan sin escenario.
- **Palabras simples, en inglés y español**: todo texto visible vive en
  los diccionarios (`src/i18n/messages/en.ts` y `es.ts`, del mismo tipo:
  una clave que falte en español no compila); la lógica devuelve números
  y códigos de problema (`src/lib/problems.ts`) y cada idioma los
  redacta. `src/components/plain-language.test.ts` lee los dos
  diccionarios con el parser de TypeScript y falla si hay jerga ("real",
  "nominal", "volatility"… y "real", "volatilidad", "percentil"… en
  español) fuera de `explain` (los "i" plegados), si una frase pasa de
  unas 12 palabras (22 en las páginas largas; las citas de fuentes no
  cuentan), o si un componente escribe texto visible por su cuenta.
  Añadir un idioma: un archivo más en `src/i18n/messages`, su entrada en
  `src/i18n/locales.ts` y sus nombres de país en
  `scripts/country-names.mts`; ningún componente cambia.
- **Inflación por país**: cada país lleva una inflación de referencia con
  su base y fecha (septiembre de 2026): el objetivo de su banco central
  (el 2 % del BCE en la zona euro, Bulgaria incluida desde enero de 2026;
  el centro del rango cuando es un rango), que es hacia donde convergen
  las previsiones a largo plazo como las del FMI; sin objetivo (o sin uno
  que hayamos podido confirmar, en los estimados), su media 2015–2024
  (FMI para los detallados, Banco Mundial para los estimados).
  **Inflación alta**: `recentAverage` marca los países cuyos precios
  subieron un 10 % al año o más de media en 2015–2024 (Irán 27 %, Angola
  21,5 %, Haití, Sierra Leona, Etiopía, Malaui, Nigeria, Liberia, Burundi,
  Santo Tomé); donde hay objetivo se usa igualmente el objetivo, aunque
  quede lejos de la media reciente (Turquía 5 % frente a 25,6 %, Ghana,
  Ucrania, Uzbekistán, Pakistán, Zambia). Los que superan el 30 % anual
  de media (Argentina, Zimbabue, Sudán, Sudán del Sur, Líbano, Surinam)
  quedan fuera: un coste en euros calculado con un nivel de precios no
  aguantaría.
- Velocidad: las dos pantallas se prerenderizan con sus valores de
  llegada, así que se ven antes de que corra el JavaScript. Las tasas de
  éxito de 3/4/5 % de los cinco activos con historia están precalculadas
  (`src/lib/success-table.ts`, un test las recalcula exactas). Los
  retornos simulados de una mezcla se guardan por parte (cambiar un peso o
  a qué crece un holding reutiliza el resto), la simulación de éxito
  reutiliza los mismos índices sorteados para cualquier conjunto de
  cifras propias, y en cuanto el usuario empieza a usar la página, en
  ratos libres y en pasos de menos de 50 ms, se precalculan los sorteos,
  los años simulados de cada activo y una primera pasada de cada plantilla
  de mezcla (100 % acciones, 80/20, 60/40, con y sin reequilibrio), de una
  cartera con una acción y de cifras propias (`src/lib/warm.ts`). La banda
  del S&P 500 que acompaña a una mezcla y los peores años se guardan
  mientras no cambien los importes o la mezcla (cachés acotadas en
  `src/lib/projections.ts`). Medido en el navegador en la ronda 10 (108
  recálculos, EN y ES: aportes, años, activos, plantillas, los cinco
  *What if…?* y cargar un archivo con cartera, dos veces cada uno):
  mediana 4,0 ms, p90 7,8 ms, máximo 13,9 ms (la primera carga de una
  cartera nueva, que simula sus posiciones).
  Con los cinco *What if…?* (sus efectos se calculan en cada cambio, con
  fórmulas cerradas salvo *A bad first decade*, que lee las bandas ya
  calculadas) el recálculo medido en el navegador al tocar cada uno, con
  un activo y con una mezcla 60/40, se quedó por debajo de 15 ms; el más lento es la primera vez que se aplica
  *Grows 1% more / less*, porque sus simulaciones son nuevas.
  Los hallazgos y las compras se calculan al abrirlos; los parsers de CSV,
  la librería de gráficos, al usarla (solo para los precios que sube el usuario).
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

**Países** (`countryRows`): una fila por país, 172 en total, ordenadas
por coste sin vivienda; "con vivienda" suma el alquiler de un 1
dormitorio fuera del centro. Por defecto se ven 7 (los cinco detallados
más baratos, Perú y Países Bajos); un buscador (en la tabla y al añadir
la meta "vivir en…") encuentra cualquiera por su nombre en el idioma de
la página o en inglés, sin importar tildes.

- **30 detallados** (`src/data/cost-of-living.json`), compilados a mano:
  Numbeo (sin alquiler) + Wise (1 dormitorio fuera del centro),
  convertidos a euros y redondeados a 10. Solo se publican esas cifras
  derivadas, nunca las de las fuentes (ver licencias en *How it works*).
- **142 estimados por nivel de precios** (`src/data/estimated-countries.json`,
  marcados con "≈"): la cesta de Países Bajos × el *price level ratio*
  del país frente al de Países Bajos (Banco Mundial, WDI
  `PA.NUS.PPPC.RF`: PPP del PIB entre el tipo de cambio de mercado;
  referencia ICP 2021, extrapolada por el Banco Mundial hasta 2024, el
  último año disponible) sin vivienda, y el alquiler de Países Bajos × ese
  ratio **al cuadrado** con vivienda: el alquiler varía más que el resto
  de precios entre países ricos y pobres, y el exponente que mejor ajusta
  sobre los 29 detallados (sin contar Países Bajos) es 2,03. Contra esos
  29, la estimación se desvía una mediana del 9 % sin vivienda y del 15 %
  con vivienda; uno de cada diez, un 26 % / 41 % o más. Se elige Países
  Bajos como cesta porque es el país por defecto de la app y un país de
  precios medios-altos con datos completos en ambas fuentes.
  Regenerar: descargar en una carpeta
  `https://raw.githubusercontent.com/datasets/world-development-indicators/main/indicators/pa.nus.pppc.rf/data.csv`
  (como `pa.nus.pppc.rf.csv`), `…/indicators/fp.cpi.totl.zg/data.csv`
  (como `fp.cpi.totl.zg.csv`) y
  `https://raw.githubusercontent.com/datasets/country-codes/main/data/country-codes.csv`,
  y correr `node scripts/estimate-countries.mts <carpeta>` y luego
  `node scripts/country-names.mts` (nombres en cada idioma, con CLDR). ✓ cuando el ingreso al cabo de los
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
| Duplicación | crecimiento ≥ 2 % al año | cada cuántos años se duplica |

**Compras** (`src/data/connections.json` + `src/lib/connections.ts`): 19
compras con fuente y fecha, marcadas como estimación, ninguna calculada
desde un "país propio" (el colchón de 6 meses y el sabático se quitaron).
Las estancias (tres meses en Japón, un año por el sudeste asiático, seis
meses en Portugal, un máster en NL) se calculan con el costo de vida de
ese país, con vivienda. Importes en euros de hoy; los de USD se
convierten con el tipo guardado en el archivo.

## Páginas del sitio

About, How it works, Privacy y Terms (`/about`, `/how-it-works`,
`/privacy`, `/terms` y sus versiones `/es/…`), más una 404 en los dos
idiomas (`src/app/not-found.tsx`). Sus textos viven en los diccionarios
(`about`, `howItWorks`, `privacy`, `terms`, `notFound`), con frases de hasta
unas 22 palabras; *How it works* cita cifras sacadas de los datos (países,
errores de la estimación, países excluidos, inflación alta), así que no se
desactualiza. El pie enlaza las cuatro y "Part of seed-lab", y termina con
"© 2026 seed-lab. Free to use." Contacto: seedlab.eu (arroba) proton.me,
en About y Privacy. `[email](email)` en los diccionarios lo inserta
(`src/components/ui/email.tsx`): el HTML estático solo lleva sus dos partes
(`CONTACT` en `src/lib/site.ts`), que el CSS muestra como una dirección, y
el navegador la convierte en un enlace de correo; ni la dirección entera
ni `mailto` aparecen en el HTML, para que no la recojan los bots. Sin
enlaces a GitHub en la web. Código propietario: ver `LICENSE` y `TRADEMARKS.md` en la raíz
del repositorio. Icono propio (`src/app/icon.svg`, y `favicon.ico` y
`apple-icon.png` dibujados a partir de él) e imagen para compartir de
1200×630 generada en el build (`src/app/og.png/route.tsx`, estática, la
misma para todas las páginas y los dos idiomas).

## Identidad visual

Los colores viven en `src/app/tokens.css`, el mismo archivo, byte a byte,
que usa el hub (`hub/src/tokens.css`), para que las dos webs se vean como
una familia: blanco puro o casi negro (#0A0A0A), grises neutros sin tinte
cálido y un único color de marca, azul eléctrico (#0055FF en claro,
#4D8DFF en oscuro, el mismo tono un paso más claro para mantener AA sobre
negro). Todo texto mantiene al menos 4,5:1 sobre el fondo, la tarjeta, el
relleno sutil y su propio tinte del 10 %; los dos colores del gráfico
pasan las comprobaciones de daltonismo y contraste como pareja.
`globals.css` solo los importa y los nombra para Tailwind. Tipografía del
sistema (sin fuentes descargadas), títulos en extra-negrita.
`src/app/tokens.test.ts` comprueba que el archivo es idéntico al del hub y
que el icono y la imagen para compartir usan sus valores.

## Lanzador de seed-lab

En la cabecera, junto a EN/ES, un botón de rejilla abre un panel pequeño:
"seed-lab" (enlace al hub) y la lista de proyectos, con Wealth Lens
marcado como actual. La URL del hub es una constante única
(`SEED_LAB_HUB_URL` en `src/lib/seed-lab.ts`, hoy
`https://seed-lab-hub.vercel.app`, provisional) y la lista sale de
`src/data/seed-lab-projects.json` (`id`, `name`, `url`, `current`): para
añadir un proyecto o cambiar el hub no hace falta tocar componentes. Se
cierra con Escape (el foco vuelve al botón) o tocando fuera.

## Licencias de los datos

Revisión fuente por fuente (las páginas de condiciones de cada una no se
pudieron abrir desde el entorno que compiló esto; la conclusión se basa en
sus condiciones publicadas conocidas y se aplica la opción más prudente):

| Fuente | Condiciones | Qué se publica |
| --- | --- | --- |
| Yahoo Finance, Stooq | No permiten redistribuir sus datos | Solo cifras derivadas en `prices.json` (último cierre por fondo, cambio a 1 año, crecimiento anual, peor caída, cambio de cada año, volatilidad, correlaciones); nunca el historial de cierres |
| Numbeo, Wise | No permiten copiar sus datos | Solo el coste mensual en euros, combinado y redondeado a 10, con atribución; se quitaron las cifras originales que citaba `cost-of-living.json` |
| MSCI, Nasdaq, LBMA | Datos propietarios | Solo la rentabilidad anual real derivada y la inflación usada; se quitaron las rentabilidades nominales de MSCI, los cierres del Nasdaq-100 y los precios del oro |
| Robert Shiller (Yale) | Libre con atribución | Rentabilidad real anual derivada del S&P 500 |
| OCDE, Bundesbank, Destatis | CC BY 4.0 / uso libre con atribución / dl-de/by-2-0 | Rendimientos del Bund y precios alemanes, con atribución |
| US BLS | Dominio público | IPC de EE. UU. 2023–2024 |
| Banco Mundial (WDI) | CC BY 4.0 | Ratios de nivel de precios e inflación, derivados y con atribución |
| Unicode CLDR | Licencia Unicode | Nombres de países |

Riesgo residual: el último cierre de cada fondo es una cotización tal cual
(como la de cualquier web de noticias); hace falta para valorar las
posiciones. Si una fuente lo objetara, el job puede dejar de publicarlo y
pedir el precio al usuario. *How it works* explica todo esto en lenguaje
llano.

## Test my plan (`/test`, `/es/test`)

El plan tal cual está en My money (mismo activo o mezcla, mismos importes,
sin *What if…?*) pasado por la historia real de los datos, año a año, sin
simulación (`src/lib/history-test.ts`, tests en `history-test.test.ts`):

- **Seis crisis** (`CRISES`): Great Depression (1929, 1929–1931), Oil
  crisis (1973, 1973–1974), Dot-com crash (2000, 2000–2002), Financial
  crisis (2008), Covid (2020) e Inflation shock (2022). Cada una empieza el
  año anterior ("If you had started in 2007"). Solo se activan las que el
  activo o todas las partes de la mezcla tienen en sus datos: el S&P 500
  llega a 1928, el resto a 1986/1988, así que 1929 y 1973 son solo del
  S&P 500; las demás tarjetas dicen "no data for this". Una cuenta de
  ahorro o un crecimiento propio no tienen historia que probar.
- **La caída** se mide sobre el dinero que había en lo más alto, sin los
  aportes que llegan después (que la esconderían): "de 1.000 € a 608 €
  (−39 %)", y "tardó N años en volver" es lo que tardó ese dinero en
  recuperarse. El resultado a N años sí incluye los aportes, y se compara
  en pequeño con el crecimiento medio del plan. Los datos son anuales: una
  caída que se recupera dentro del año (Covid en 2020) no aparece, y se
  dice así.
- **Cada año de inicio**: los años del plan empezando en cada año posible
  de los datos (o tramos más cortos si los datos no dan para dos), con el
  peor, el del medio y el mejor marcados, y la línea del crecimiento medio.
- **Mezclas y cartera**: cada parte sigue su propia historia
  (reequilibrada cada año si la mezcla se reequilibra; las acciones de la
  cartera siguen a su índice), y se muestra al lado lo que hizo el S&P 500
  solo: su caída en cada crisis y su peor año de inicio. Sin sugerir pesos.
- Aportes como en las simulaciones: la mitad de los del año al empezarlo y
  la mitad al acabarlo. Cifras a final de año, en euros de hoy.

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
Finance primero (dos hosts) y Stooq como respaldo— y publica **solo cifras
derivadas** en `public/data/prices.json`, nunca los cierres (las
condiciones de esas fuentes no permiten redistribuir sus datos; ver
"Licencias de los datos"): último cierre, fecha y moneda, cambio a 1 año,
crecimiento anual pasado, peor caída desde un máximo y cómo se mueve
(`scripts/lib/stats.mts`, calculado de la descarga del día): volatilidad
anual (desviación de los retornos logarítmicos diarios × √ retornos al
año), el cambio de cada año natural completo y, al final, las
correlaciones de retornos semanales entre instrumentos (semanales porque
las bolsas cierran a horas distintas; `null` con menos de 3 años
compartidos; si un instrumento falla ese día, se conservan las del día
anterior). Una línea por instrumento. Se importa en el build, así que va
dentro de la página. La carpeta `public/data/history/` que publicaban
versiones anteriores la borra el primer run tras el merge.

Si un instrumento falla o la respuesta es rara (otra moneda, datos viejos,
un salto ×5), se conserva lo anterior; los archivos solo se reescriben si
cambian, y el job nunca falla porque una fuente esté caída. El commit a
`master` hace que Vercel redespliegue.

**Formato estable y conflictos.** `public/data/` es generado y el Action es
su único escritor. El texto no depende de cómo se construyó cada entrada:
una línea por instrumento, en el orden de `instruments.json`, con las
claves de cada entrada en orden alfabético (`canonical` en
`scripts/lib/price-files.mts`, con test), y `updatedAt` solo cambia si
cambió algún número. Así el diff diario muestra solo lo que se movió.
`.gitattributes` lo marca como generado para que GitHub lo pliegue en las
PRs.

- Una rama nunca debe commitear `public/data/` (tampoco tras un
  `npm run update-prices` local): si cambia el código del job, el Action
  reescribe los archivos en su primer run tras el merge.
- Si aun así una rama choca con el commit diario, se resuelve quedándose
  con la copia de `master`, que es la más reciente:

  ```bash
  git fetch origin master
  git merge origin/master            # el conflicto aparece en public/data
  git checkout origin/master -- projects/wealth-lens/public/data
  git commit                         # cierra el merge con los datos de master
  ```

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
  índice de su mercado, con el que crece en My portfolio (`sp500`,
  `world` o `nasdaq100`). Una acción nunca se proyecta sola.

Los tests (`src/lib/market-data.test.ts`) validan la lista; el próximo
run del Action descarga el nuevo instrumento. Para que My portfolio
reconozca otro fondo sin descargar sus precios, basta con añadir su
ticker a `trackers` en el mismo archivo (índices, `bonds` o `gold`).

**Retornos de los índices** (`src/data/*-real-returns.json`, con fuente y
fecha): S&P 500 1928–2022 (Robert Shiller, retorno total real), MSCI World
1988–2024 (retorno neto en USD de las fichas de MSCI) y Nasdaq-100
1986–2024 (cierres anuales, solo precio: sin dividendos, ~1 % anual), estos
dos deflactados con el IPC de EE. UU. de diciembre a diciembre. Los de
MSCI World y Nasdaq-100 se introdujeron a mano desde las tablas publicadas
y se verificaron contra los retornos anualizados a 3/5/10 años de las
fichas de MSCI y contra los % anuales publicados; los tests recalculan
cada retorno real desde las cifras nominales guardadas.

**Bonos y oro** (introducidos a mano desde las cifras publicadas: sus
fuentes no se podían descargar desde el entorno que los compiló; cada
archivo guarda las cifras de origen y los tests recalculan cada año):

- `euro-bonds-real-returns.json`, **bonos gubernamentales de la zona
  euro**, 1988–2024: un Bund alemán a 10 años, la referencia de la zona.
  Retorno total por el método de vencimiento constante (el de Shiller y
  Damodaran para el Tesoro de EE. UU.): se compra a la par al rendimiento
  medio de diciembre y se valora un año después, con 9 años por delante,
  al rendimiento del diciembre siguiente, más el cupón. Rendimientos de la
  OCDE (serie IRLTLT01DEM156N, datos del Bundesbank); inflación alemana de
  diciembre a diciembre (Destatis; Alemania Occidental hasta 1991). Las
  medias de diciembre suavizan el cierre del año (2022: −19,8 % nominal
  aquí, unos −22 % de cierre a cierre).
- `gold-real-returns.json`, **oro**, 1988–2024: el precio LBMA de la
  última fijación de cada año en dólares (publicado por la LBMA y tabulado
  por el World Gold Council), después de la misma inflación de EE. UU. que
  los índices. Un año en que la fijación de la mañana y la de la tarde
  difieren puede desviarse un 1 %.


**Periodo común.** Los cinco activos se comparan sobre los mismos años, el
periodo más largo que cubren todos: hoy **1988–2022** (35 años;
`COMMON_PERIOD` en `src/lib/indexes.ts`, calculado de los datos). Esas
rentabilidades alimentan todo: palancas, proyecciones, mezclas, cartera
y Monte Carlo, y la app muestra el periodo junto a cada cifra. Promedio
real anual y oscilación en 1988–2022: S&P 500 7,5 % (±16 %), World 4,5 %,
Nasdaq-100 9,9 % (solo precio: la tarjeta lo dice; los dividendos
sumarían aproximadamente un 1 % anual), bonos euro 2,5 % (±8 %; peor año
2022, −26 % después de inflación) y oro 1,1 % (±14 %; peor año 2013). Los
datasets completos se conservan y se validan igual. Para alargar el periodo hace falta el S&P 500 de 2023 en adelante
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
línea de crecimiento (×Z y P % para el plan por defecto: ×2.3 y +129 %),
el tooltip del gráfico ("Year 2046: €112,xxx · +129% so far") y su
etiqueta final, los cinco *What if…?* (cada efecto igual a aplicarlo;
activar, cambiar y quitar; sigue con el plan; no se guarda; ±1 % mueve
también las mezclas; *A bad first decade* sigue el percentil 10, retrasa
metas y países, usa la oscilación escrita y no existe sin altibajos), la
ausencia de jerga en los textos visibles, la
tabla de países (30 filas ordenadas, dos columnas, ✓ si y solo si el
ingreso lo paga, filas por defecto), las metas (cada tipo, varias,
independientes, orden estable al añadir y quitar, tope de 60 años con el
aporte para 30), las compras, el motor de hallazgos (cada regla: cuándo
aparece, cuándo no y su número, con y sin metas), las tasas de éxito
precalculadas (recalculadas exactas), el plan v6 y la conversión de
archivos v1 a v5 (metas; una acción proyectada sola que pasa a My
portfolio o a su índice con su aviso; un % propio y una inflación), los
datasets (cada retorno real recalculado desde las cifras de origen: MSCI
contra sus fichas, bonos desde los rendimientos y el IPC, oro desde los
precios LBMA; la inflación de referencia de cada país), los supuestos
editables (real/nominal con la inflación de cada país, oscilación, solo
inflación, reset, Custom growth, la normal: mediana y dispersión), las
plantillas 60/40 y 80/20, las mezclas con bonos, oro y ahorro (el mismo
año sorteado para todos, peor año 2022 para 60/40, efecto de
diversificar), la asignación de holdings a activos, el archivo de datos
(ida y vuelta, archivos dañados o ajenos),
la limpieza de datos antiguos, el importador de Trading 212, el parser de
CSV, el precio automático desde datos estáticos o CSV (nunca pisa un
precio escrito a mano), el Monte Carlo (semilla fija) y el costo de vida.
Del job de precios: parsers de Yahoo y Stooq contra fixtures, la cadena
de respaldo con `fetch` simulado, las cifras derivadas (y que ningún
cierre se publica) y las reglas para conservar los datos anteriores.

## Mapa del código

```
scripts/
  update-prices.mts            job diario: descarga y escribe public/data/prices.json (solo cifras derivadas)
  update-prices.workflow.yml   el GitHub Action (copiar a .github/workflows/)
  lib/                         yahoo, stooq, cadena de respaldo, armado de archivos
public/data/                   precios generados por el job (no editar a mano)
src/
  app/                         rutas: / (My money), /stocks (My stocks);
                               /charts y /fire redirigen
  components/                  money/ (calculadora, selector, supuestos, mezcla,
                               cartera, resultado, gráfico, metas, países,
                               hallazgos, compras), stocks/, charts/,
                               portfolio/ (holdings, CSV), ui/ (changed: marca
                               lo que cambió); money/explainers.tsx (los "i"
                               plegados) y plain-language.test.ts (sin jerga)
  hooks/                       use-app (estado), use-calculation (todo por cambio),
                               use-plan
  lib/
    app-store.ts        estado en memoria (plan, holdings, CSV subidos)
    calculator.ts       resultado, metas, tabla de países, compras, tope de 60 años
    settle.ts           aplica un número cuando se termina de escribir (500 ms)
    findings.ts         "What you should know": una regla por hallazgo
    connections.ts      la lista de compras, con fuentes
    simulation.ts       bandas de Monte Carlo y cachés de simulación
    success-table.ts    tasas de éxito de 3/4/5 % precalculadas por activo
    assets.ts           lo que se puede proyectar: índices, bonos, oro, ahorro
    investment.ts       supuestos estándar y cambiados: crecimiento, oscilación, simulación
    assumptions.ts      la línea de supuestos y lo que muestra el panel Edit
    growth.ts           "Grows about 7.5% a year", ×Z y +P %, etiqueta y tooltip del gráfico
    what-if.ts          los cinco "What if…?": qué cambia cada uno
    normal.ts           años sorteados de una normal para cifras propias
    portfolio.ts        a qué activo crece cada holding, ponderado por valor
    mix.ts              mezclas con pesos: modelo conjunto, deriva/reequilibrio, peor año
    volatility.ts       la volatilidad propia de una acción (en My portfolio)
    projections.ts      una sola entrada a bandas y tasas de éxito
    warm.ts             lo que se precalcula en ratos libres
    step.ts             los botones − / + (pasos de €50 y de un año)
    indexes.ts          datasets de retornos reales: 3 índices, bonos euro, oro
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
    euro-bonds-real-returns.json, gold-real-returns.json
    cost-of-living.json         30 países detallados (EUR, con/sin alquiler, inflación de referencia)
    estimated-countries.json    142 países estimados por nivel de precios (scripts/estimate-countries.mts)
    country-names.json          nombres de los 172 países en cada idioma (scripts/country-names.mts)
    connections.json            las compras, con fuente y fecha
```

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.
