# wealth-lens

**Misión:** que cualquier persona en Europa vea, en palabras sencillas, qué
puede hacer su dinero —cuánto podría crecer, cuánto podría pagarle cada
mes y en qué lugares del mundo alcanza— sin darle sus datos a nadie. Es
la primera herramienta de seed-lab: gratuita y centrada en la privacidad.

**Qué NO es:**
- No da consejo financiero ni recomienda qué comprar o vender: solo
  calcula y muestra lo que la persona escribe o lo que viene de fuentes
  públicas.
- No gestiona ni mueve dinero real, ni se conecta a ninguna cuenta de
  bróker: la cartera se escribe a mano o se carga desde un archivo
  exportado.
- No promete que la regla del 4 % o el crecimiento del pasado sean
  garantías: son estimaciones históricas con riesgo de secuencia, moneda
  e inflación local, y la app lo dice en la propia pantalla.
- No guarda ni envía nada: no hay cuentas, ni servidor propio, ni
  analítica.

**Cómo cumple los cinco principios de seed-lab** (la misma fila que la
tabla de *Principles* del hub, `packages/seed-kit/src/tools.json`):

| Principio | Estado | Por qué |
| --- | --- | --- |
| Your data never leaves your device | Cumple | Todo se calcula en el navegador; nada se guarda ni se envía. |
| Transparent | En parte | Gratis, con método y fuentes públicos; los cambios del método aún no se publican. |
| Truly European | Pendiente | EN y ES, pero alojada en Vercel (EE. UU.) y sin auditoría de accesibilidad hecha por personas. |
| Light | Cumple | De 204 a 224 KB por página en la primera visita, por debajo del límite de 350 KB. |
| For everyone | En parte | Palabras sencillas, teclado y objetivos de 44 px; aún sin pruebas con personas reales. |

**Estado actual (2026-10-01):** dos pantallas (Next.js 16 + TypeScript +
Tailwind 4), exportadas como sitio estático. La principal empieza **solo
con las preguntas, vacías**; el resultado aparece al escribir los dos
importes, por niveles, y las metas son opcionales. La app no
supone nada sobre la vida del usuario: no pregunta país, ni si alquila o
es propietario, ni qué quiere hacer con su dinero. Nada se guarda ni se
envía, y la app no llama a ningún servicio mientras se usa. La lógica
vive en funciones puras con unos 650 tests unitarios (Vitest). El uso real
sostenido (la condición del peldaño 1 de seed-lab) todavía no está
demostrado. Solo se proyecta lo que tiene una
historia larga y un rango conocido; nada se presenta como predecible, y
todo supuesto viene relleno con un valor estándar documentado y se puede
cambiar. Todo lo visible está en palabras simples: "real", "nominal",
"volatility", "swings" y "percentile" solo aparecen en los "i" plegados
(un test lo comprueba).

- **My money — `/`**, de arriba abajo (ronda 12: una entrada tranquila,
  paso a paso):
  1. **Las preguntas, solas**: una tarjeta con *How much do you have
     now?* (€), *How much will you add each month?* (€, con − / + de €50),
     *How much does it grow a year?* y *For how many years?* (1-60, empieza
     en 20, con − / + de un año). Los importes empiezan vacíos, con un
     ejemplo gris y en cursiva ("e.g. 1,000", "p. ej. 1.000") que no parece
     un dato. Hasta que los dos importes están escritos no hay resultado,
     gráfico, tabla ni aviso: solo una línea, "Write your numbers to see
     your result" (0 es una respuesta; un campo vacío, no). Se recalcula
     cuando el usuario termina de escribir (500 ms sin teclear, al salir
     del campo o con Enter), nunca con cada tecla; tras un cambio se marcan
     un momento solo las cifras que cambiaron y nada cambia de sitio.
  2. **El crecimiento, en un toque**: chips dentro de la calculadora,
     *S&P 500 ~7.5%*, *World ~4.5%*, *60/40*, *Bonds*, *Savings* y *My %*
     (el S&P 500 viene elegido). Sin lista que abrir, sin panel *Edit*, sin
     conmutador antes/después: se ve una sola cifra, "Grows 7.5% a year
     after rising prices", y debajo, pequeña y de solo lectura, "≈ 9.7%
     before inflation". *My %* abre un campo para escribir ese número
     (crecimiento después de inflación), empezando por el que se veía. Si
     supera el mejor promedio de 20 años seguidos de cualquier activo de
     los datos (`src/lib/realism.ts`: hoy el S&P 500 en 1980–1999, 13 %),
     debajo: "Very rare: no broad index kept this for 20 years. The best
     was 13% (S&P 500, 1980–1999)." **More options**, plegado y cargado al
     abrirlo: cualquier otra inversión (la lista agrupada con buscador por
     nombre o ticker: Nasdaq-100, oro, "A mix…" con plantillas 100% stocks,
     80/20 y 60/40 y acciones de la lista, My portfolio si hay holdings),
     *How much it can go up or down in a normal year* (con su ejemplo en
     euros y "Historically, assets growing about 7.5% moved about ±16% a
     year"), *Rising prices in* (país, Países Bajos por defecto) y *Prices
     rise per year*, cada uno con su estándar al lado, *Reset to standard*
     y el "i" que explica cómo usan las simulaciones esas cifras. Un cambio
     ahí marca *More options* como **Custom**, y la línea del crecimiento
     nombra lo elegido cuando ningún chip lo es ("Nasdaq-100: Grows 9.9% a
     year after rising prices").
  3. **El resultado, por niveles**, al escribir los dos importes:
     - Nivel 1, siempre: "In 20 years you'll have €112,288" en grande, con
       su "?", y debajo, en una línea, "Grows about 7.5% a year · +129% on
       what you put in".
     - Nivel 2, siempre: el gráfico anual, más bajo y simple: lo aportado y
       el crecimiento como áreas apiladas, con el % ganado al final de la
       curva; al pasar el ratón o tocar un año, "Year 2036: €48,200 · +37%
       so far"; debajo, "Your money: ×2.3 · growth added +€63,288 (+129%) ·
       put in €49,000" y la tabla año a año, plegada. Las líneas de 8 de
       cada 10 simulaciones pasan a *What you should know*.
     - Nivel 3: tarjetas plegadas de una línea, cada una con su frase y una
       flecha; al abrirlas cargan y calculan lo que antes estaba suelto en
       la página:
       - **It could pay you €374/month**: el selector de retiro (3/4/5 %) y
         cuántas historias aguantó 30 años ("93% of S&P 500 histories").
       - **What if…?** "+€50 a month: +€27,000": los cinco escenarios
         (*Grows 1% more / less*, *+€50 a month*, *5 more years* y *A bad
         first decade*, con los diez primeros años en el percentil 10 del
         Monte Carlo); tocar uno lo aplica a toda la pantalla, con "What if:
         5 more years ×" junto al total para quitarlo, y la frase de la
         tarjeta dice cuál está aplicado. No se guarda en el archivo.
       - **Where it reaches** "27 of 172 countries, without housing": la
         tabla de países con dos columnas (sin / con vivienda, una persona,
         al mes), buscador, "Show all 172" y un "+" para añadir a My goals;
         debajo, *Things you could buy* (las 19 compras con "✓ now" o "in N
         years" y su fuente al tocarlas).
       - **My goals** "Add a country, a purchase or an amount": cuatro tipos
         combinables (*Live somewhere*, *Buy something*, *Reach an amount*
         y *A monthly amount*), cada uno calculado por separado sobre el
         mismo plan: "✓ now", "in 12 years (2038)" o, a más de 60 años,
         "not at this pace — needs €327/month for 30 years".
       - **What you should know** "What could go wrong, and what helps
         most": la línea de supuestos ("Grows 7.5% a year after rising
         prices · can move ±16% in a year · data 1988–2022"), dónde
         terminaron 8 de cada 10 simulaciones (en una mezcla, su rango y su
         peor año junto al S&P 500 solo) y hasta 3 hallazgos. Si una acción
         pesa más del 20 % de una mezcla, la frase de la tarjeta lo dice, en
         tono de aviso.

     Nada más aparece si no se pide. Los "?" quedan junto al total y a
     cuántas historias aguantó el retiro; el resto de ayudas son una frase
     dentro de su tarjeta.
- **My stocks — `/stocks`**: ganancia, holdings (añadir,
  editar, importar CSV), cómo se movió cada uno, y los 3 ETFs (VUAA,
  VWCE, EQQQ) y 12 acciones grandes. Cada fila lleva una línea pequeña del
  último año y su cambio; al abrirla, una línea semanal con selector de
  periodo **1Y · 3Y · 5Y · Max** (los que los datos no alcanzan, desactivados)
  y el % del periodo al lado, en verde o rojo. En una acción, en fino, la
  línea del fondo de su índice (EQQQ, VUAA o VWCE) sobre las mismas semanas y
  desde el mismo 100, con una nota si cotizan en monedas distintas o si el
  fondo no llega a ese periodo. Las barras de cambio anual se quitaron. Un
  ETF puede ser la inversión ("Use as my investment"); una acción no se
  proyecta: "History only. One stock's future can't be predicted.", y su
  fila dice cómo cuenta en una mezcla o en My portfolio. Los precios de un
  CSV propio siguen con su gráfico diario. Las direcciones de versiones
  anteriores (`/charts`, `/fire`) ya no existen: dan la página 404.

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
  servidor, y recargar vuelve a la calculadora vacía. "Download my data"
  genera un JSON local y "Load my data" lo lee en el navegador, sin
  subirlo. Si una versión anterior dejó datos en `localStorage`, la app
  ofrece una vez cargarlos o borrarlos, y los borra en ambos casos.
- **Cero llamadas en tiempo de uso.** Los precios llegan como archivos
  estáticos del propio sitio (ver "Precios diarios"); los retornos de
  los índices y el costo de vida son JSON dentro del bundle.
- Un solo plan (`Plan` en `src/lib/types.ts`): dos importes (`null`
  hasta que se escriben; `planReady` en `src/lib/plan.ts` decide cuándo
  hay resultado), la inversión, los años, la tasa de retiro, *Rising
  prices in* (`pricesOf`), lo que el usuario cambió de los supuestos
  (crecimiento después de inflación, el número de *My %*; oscilación;
  inflación; `null` = estándar) y las metas (una lista, vacía al empezar). `src/lib/calculator.ts` deriva de él todo lo
  que se ve (resultado, metas, tabla de países, compras) y
  `src/hooks/use-calculation.ts` lo calcula una vez por cambio para todas
  las secciones (medido como `performance.measure("wealth-lens:report")`:
  por debajo de 16 ms al escribir, usar − / +, cambiar la inversión o
  tocar un *What if…?*, con los efectos de los cinco incluidos; cargar un
  archivo con cartera tras una sesión larga llegó a 23-34 ms; ver
  "Velocidad"). El archivo de datos va por la
  versión 8: lleva los importes (vacíos si no se escribieron), *Rising
  prices in*, los supuestos cambiados (el crecimiento como el único número
  de *My %*, después de inflación) y, en cada holding, a qué activo se
  asignó si el usuario lo cambió. Lee las anteriores: el crecimiento de la
  v7 (antes de inflación) y el de la v6 (antes o después) pasan al número
  después de inflación con la inflación del archivo (la suya o la de su
  país); un crecimiento cambiado sobre un índice o una mezcla pasa a *My
  %* con los altibajos de esa inversión, así que el resultado no cambia;
  un importe que falta en un archivo anterior a la v8 sigue siendo 0; un
  índice (v1-v5) es ese activo; una acción proyectada sola (v5) pasa a My
  portfolio si el archivo la tiene, si no a su índice, y las acciones de
  una mezcla cuentan como su índice, cada cambio con un aviso de una línea
  bajo "Load my data"; un % propio pasa a *My %*; una inflación
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
    un "i" plegado): hasta 10 de esos activos o de las 12 acciones de la
    lista (en *Add*, grupo *Stocks*) con % que suman 100,
    indicador del total, "Split evenly", plantillas (100 % acciones,
    80/20, 60/40: World y bonos euro, puntos de partida de manual, no
    consejo) y *Let weights drift* / *Rebalance every year*. Crecimiento:
    la media ponderada. Incertidumbre: 1.000 caminos de 60 años; cada año
    se sortea un año histórico común a todos los activos (acciones, bonos y
    oro se mueven juntos como lo hicieron; en 2022 cayeron acciones y
    bonos a la vez). Junto al resultado: "Range (8 in 10)" y "Worst year
    in the data", con las mismas cifras del S&P 500 solo, sobre los mismos
    años. Una acción crece como su índice y oscila con su propia volatilidad
    y sus correlaciones (el motor de My portfolio); a su lado, en pequeño,
    "grows like the Nasdaq-100 · moves ±50% a year". Si una acción pesa más
    del 20 %, una línea con el efecto de concentración: la misma mezcla con
    su índice en su lugar, sobre los mismos años simulados, y el percentil
    10 y la mediana de cada una ("One stock is 40% of your mix: the middle
    result drops, the bad cases get much worse."; la frase sale de las
    cifras: 60 % World + 40 % NVIDIA a 20 años con €1.000 y €200/mes da,
    con los precios del 1 de octubre de 2026, €37.012 frente a €48.190 en
    los casos malos y €91.624 frente a €121.719 en el medio). Con crecimiento u oscilación propios no se muestra: los
    altibajos de la acción ya no se simulan. Ninguna optimización ni
    sugerencia de pesos.
  - **My portfolio** (`src/lib/portfolio.ts`): "Simple projection: each
    stock grows like its index. Stocks can't be predicted." Cada holding
    en EUR crece como un activo: una acción de la lista, el índice de su
    mercado (tecnológicas de EE. UU. el Nasdaq-100, otras de EE. UU. el
    S&P 500, europeas World); un fondo, lo que tiene (índice, bonos, oro,
    por `trackers`); otro ticker, World marcado como suposición. El
    usuario lo cambia en la calculadora y queda guardado en el holding. Se
    pondera por valor y se simula con el motor de mezclas; una acción de
    la lista conserva sus propios altibajos (volatilidad de sus cierres
    diarios, correlación semanal con el ETF de su índice). En las
    simulaciones una acción tiene el crecimiento **medio** esperado de su
    índice, no su crecimiento típico: sus altibajos mayores bajan su
    resultado típico (con ±50 % al año, NVIDIA queda en torno al 2 % al año
    después de inflación en la mediana, frente al 10 % del Nasdaq-100),
    como pasa con la mayoría de acciones sueltas. Igualar el crecimiento
    típico, como hacía la ronda 7, prometía de media un 24 % al año. La
    proyección principal no cambia: sigue usando la media del índice.
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
  `src/lib/projections.ts`). Desde la ronda 11 también se precalculan en
  ratos libres los años simulados de las 12 acciones de la lista y una
  mezcla de tres partes con una acción; el efecto de concentración solo
  ordena la columna del último año; las columnas de la simulación de una
  mezcla se reservan una vez y se reutilizan (cada recálculo dejaba ~0,2 MB
  al recolector, y sus pausas se veían como recálculos lentos), y el
  recálculo solo simula la tasa de retiro del plan: las otras dos se
  calculan en el siguiente rato libre, así que cambiar de tasa sigue
  siendo inmediato. Medido en el navegador en la ronda 11 (272 recálculos
  en cuatro pasadas, EN y ES: aportes, años, activos, el crecimiento
  propio con el aviso, plantillas, añadir NVIDIA, Tesla, Apple y SAP a una
  mezcla, cambiar sus pesos y quitarlas, y las tres tasas de retiro):
  mediana 1,5-2,0 ms, p90 8,5-9,8 ms, máximo 15,2 ms (el primer peso de
  una acción en una mezcla). Medido en el navegador en la ronda 10 (108
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
  **Peso (ronda 12).** JavaScript propio de la portada (los scripts que
  pide su HTML): de 782 KB / 231 KB con gzip a 676 KB / 199 KB; lo que
  descarga hasta quedar en reposo: de 293,5 KB a 217,1 KB. El resultado y
  More options se cargan al necesitarse (12,7 KB al escribir los dos
  importes, 9,7 KB al abrir More options) y cada tarjeta al abrirla (2-3
  KB); cada página lleva solo su idioma (las páginas en inglés en el grupo
  de rutas `src/app/(en)`, con su layout; las demás en `[lang]`; la 404 es
  HTML sin código propio, porque está bajo todas las páginas); los
  hallazgos y las cifras de mezcla viven en
  `src/hooks/calculation-details.ts`, que solo importan las tarjetas; y los
  enlaces ya no descargan las otras páginas al verse, solo al pasar el
  ratón, enfocarlos o tocarlos (`src/components/ui/intent-link.tsx`, como
  en la guía de prefetch de Next.js). Lo que queda es sobre todo el
  framework (~440 KB sin comprimir) y los datos de países, que llevan la
  inflación de cada país que usa la calculadora. Recálculo medido en el
  navegador en la ronda 12 (88 recálculos, EN y ES a 360 px: importes,
  años, cada chip, *My %*, oro, una mezcla 60/40 con NVIDIA, Tesla, Apple
  y SAP, sus pesos, y las tres tasas de retiro): mediana 0,4 ms, p90 5,0
  ms, máximo 14,1 ms. Lighthouse (rendimiento, móvil): `/` 95-99 (98 de
  mediana en cuatro pasadas), `/es/` 99, `/stocks` 97, `/test` 98.
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

## La primera pantalla de *My money*

Arriba, antes de la calculadora, un titular corto ("How much will your
money grow?" / "¿Cuánto crecerá tu dinero?") y una frase de apoyo
(`money.headline` y `money.support`). Debajo del aviso "Write your
numbers to see your result", tres puntos de confianza en línea, con su
icono: sin cuentas, no se guarda nada y los años de los datos ("Data
from 1988–2022", sacados de `COMMON_PERIOD`, así que no se desactualizan).
Se ven mientras no hay resultado; con el resultado, su sitio lo ocupa él.
Los cálculos y el flujo por niveles no cambian.

## Páginas del sitio

About, How it works, Privacy y Terms (`/about`, `/how-it-works`,
`/privacy`, `/terms` y sus versiones `/es/…`), más una 404 en los dos
idiomas (`src/app/not-found.tsx`, HTML sin código propio). Sus textos viven en los diccionarios
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
del repositorio. Icono de la familia de seed-lab: la semilla con brote
del hub, que aquí lleva una línea que sube (`src/app/icon.svg`;
`favicon.ico` y `apple-icon.png` los dibuja `hub/scripts/images.ts` a
partir de él). La imagen para compartir, de 1200×630, se genera en el
build (`src/app/og.png/route.tsx`, estática, la misma para todas las
páginas y los dos idiomas): fondo casi negro, el icono y el lema.

## Identidad visual

Los colores viven en el `tokens.css` de seed-kit
(`packages/seed-kit/src/tokens.css`), el único archivo de colores de todas
las apps de seed-lab, para que se vean como una familia: blanco puro o casi negro (#0A0A0A), grises neutros sin tinte
cálido y un único color de marca, el verde de la semilla. `--brand`
(#00A36C; #1FCB86 sobre oscuro) rellena lo grande: logo, iconos y el área
de crecimiento del gráfico; `--accent` (#00774C; #3DDC97 sobre oscuro) es
el de texto, enlaces y botones de la app, para mantener AA. En el gráfico,
*Growth* va en el verde de marca y *Put in* en un azul secundario
(#4A6CF7; #5B7CFA sobre oscuro); la pareja pasa las comprobaciones de
daltonismo y contraste. Todo texto mantiene al menos 4,5:1 sobre el
fondo, la tarjeta, el relleno sutil y su propio tinte.
`globals.css` solo los importa y los nombra para Tailwind. Tipografía del
sistema (sin fuentes descargadas), títulos en extra-negrita.
`src/app/tokens.test.ts` comprueba que el icono y la imagen para compartir
usan sus valores (el contraste lo comprueban los tests de seed-kit).

## Cabecera y pie de seed-lab

La cabecera y el pie son los de seed-kit (`packages/seed-kit`), los mismos
que llevan el hub y cada herramienta: la semilla con "Wealth Lens", las
páginas, EN/ES y el lanzador de seed-lab; en el pie, los controles de
datos, los enlaces, "Parte de seed-lab", la nota y el copyright.
`src/components/site/site-shell.tsx` solo dice lo propio de Wealth Lens
(su nombre, páginas, enlaces y nota) y pasa `IntentLink`, para que
cambiar de página o de idioma no pierda lo escrito.

El lanzador es un botón de rejilla junto a EN/ES que abre un panel
pequeño: "seed-lab" (enlace al hub) y las herramientas visibles de la
lista común (`packages/seed-kit/src/tools.json`), con Wealth Lens marcado
como actual. Se cierra con Escape (el foco vuelve al botón), tocando fuera
o al elegir una herramienta. La URL del hub es una constante del kit
(`HUB_URL` en `packages/seed-kit/src/site.ts`, hoy
`https://seed-lab-hub.vercel.app`, provisional; `src/lib/seed-lab.ts` la
reexporta). `src/components/site/chrome.test.ts` comprueba que el
componente de React dibuja lo mismo que la versión HTML del kit.

Para usar el kit desde fuera de su carpeta: el alias `@seed-kit/*` de
`tsconfig.json`, `turbopack.root` en la raíz del repo (`next.config.ts`) y
`npm run typecheck` (`tsconfig.typecheck.json`, que `npm run build` ejecuta
antes de `next build`).

## Licencias de los datos

Revisión fuente por fuente (las páginas de condiciones de cada una no se
pudieron abrir desde el entorno que compiló esto; la conclusión se basa en
sus condiciones publicadas conocidas y se aplica la opción más prudente):

| Fuente | Condiciones | Qué se publica |
| --- | --- | --- |
| Yahoo Finance, Stooq | No permiten redistribuir sus datos | Solo cifras derivadas en `prices.json` (último cierre por fondo, cambio a 1 año, crecimiento anual, peor caída, cambio de cada año, volatilidad, correlaciones) y series derivadas y normalizadas en `lines/` (un punto por semana, cierre del viernes, como índice base 100 al inicio de cada periodo, es decir, % de cambio acumulado, a una décima); nunca el historial de cierres ni un precio en esas series |
| Numbeo, Wise | No permiten copiar sus datos | Solo el coste mensual en euros, combinado y redondeado a 10, con atribución; se quitaron las cifras originales que citaba `cost-of-living.json` |
| MSCI, Nasdaq, LBMA | Datos propietarios | Solo la rentabilidad anual real derivada y la inflación usada; se quitaron las rentabilidades nominales de MSCI, los cierres del Nasdaq-100 y los precios del oro |
| Robert Shiller (Yale) | Libre con atribución | Rentabilidad real anual derivada del S&P 500 |
| OCDE, Bundesbank, Destatis | CC BY 4.0 / uso libre con atribución / dl-de/by-2-0 | Rendimientos del Bund y precios alemanes, con atribución |
| US BLS | Dominio público | IPC de EE. UU. 2023–2024 |
| Banco Mundial (WDI) | CC BY 4.0 | Ratios de nivel de precios e inflación, derivados y con atribución |
| Unicode CLDR | Licencia Unicode | Nombres de países |

Riesgo residual: el último cierre de cada fondo es una cotización tal cual
(como la de cualquier web de noticias); hace falta para valorar las
posiciones. Las series semanales normalizadas no llevan precios, pero
siguen la forma del precio semana a semana: junto con ese último cierre
permitirían reconstruir cierres semanales aproximados (a una décima de
punto). Es menos que lo que muestra cualquier gráfico de una web de
noticias y nunca son los cierres diarios, pero no es cero. Si una fuente
lo objetara, el job puede dejar de publicar el último cierre (y pedir el
precio al usuario) o las series (`public/data/lines/`), y My stocks
vuelve a las cifras sin gráfico. *How it works* explica todo esto en
lenguaje llano.

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
dentro de la página. Cada entrada lleva además `line1y`, la línea del
último año (semanal, base 100) para el dibujo pequeño de su fila.

Para los gráficos de My stocks escribe `public/data/lines/<id>.json`
(`scripts/lib/lines.mts`): un punto por semana (el último cierre del
viernes o antes, y el último cierre de la semana en curso), por periodo
(1, 3 y 5 años y todo lo descargado, solo los que la historia cubre),
cada periodo como índice base 100 en su primera semana, a una décima; en
una acción, el fondo de su índice sobre las mismas semanas y desde el
mismo 100 (sin él si el fondo empieza después). Nunca un precio. La app lo
lee del propio sitio al abrir la fila. Si un instrumento falla ese día se
conserva su archivo, y también el de una acción cuyo fondo falló; se
borran los de instrumentos que salen de la lista. Hasta el primer run del
Action tras el merge no existen, y la fila dice "No chart yet: it comes
with the next daily price update." La carpeta `public/data/history/` que
publicaban versiones anteriores la borra el primer run tras el merge.

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
npm run typecheck # tipos de TypeScript, también los de seed-kit
npm run build     # primero los tipos, luego el sitio estático en out/
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
ausencia de jerga en los textos visibles, la entrada nueva (renderizada en
EN y ES: las cuatro preguntas con solo los años rellenos, los ejemplos
como placeholder, una línea tranquila con los tres puntos de confianza y ningún resultado, gráfico,
tarjeta, aviso ni "?"; los seis chips con el S&P 500 elegido; *My %* con
su campo y su equivalente antes de inflación; el resultado con su número,
un gráfico y cinco tarjetas plegadas cuyo contenido no está hasta
abrirlas; y que el resultado, las tarjetas y More options se cargan al
pedirlos), elegir un chip y *My %* sobre el estado, `planReady`, la
tabla de países (30 filas ordenadas, dos columnas, ✓ si y solo si el
ingreso lo paga, filas por defecto), las metas (cada tipo, varias,
independientes, orden estable al añadir y quitar, tope de 60 años con el
aporte para 30), las compras, el motor de hallazgos (cada regla: cuándo
aparece, cuándo no y su número, con y sin metas), las tasas de éxito
precalculadas (recalculadas exactas), el plan v8 (importes vacíos), el
crecimiento de la v7 y la v6 (antes o después de inflación, mismo
resultado tras cargarlo, también sobre un índice o con otra inflación), el aviso de
realismo (el mejor promedio de 20 años recalculado a mano, solo por encima
de él, comparado después de inflación) y la conversión de
archivos v1 a v5 (metas; una acción proyectada sola que pasa a My
portfolio o a su índice con su aviso; un % propio y una inflación), los
datasets (cada retorno real recalculado desde las cifras de origen: MSCI
contra sus fichas, bonos desde los rendimientos y el IPC, oro desde los
precios LBMA; la inflación de referencia de cada país), los supuestos
editables (el % de *My %* igual con cualquier inflación, oscilación, solo
inflación, reset, Custom growth, la normal: mediana y dispersión), las
plantillas 60/40 y 80/20, las mezclas con bonos, oro y ahorro (el mismo
año sorteado para todos, peor año 2022 para 60/40, efecto de
diversificar), las mezclas con acciones (crecen como su índice en la
proyección, la misma media esperada y menos crecimiento típico en las
simulaciones, rango más ancho, efecto de concentración solo por encima del
20 % y contado desde las cifras, archivo de datos), la asignación de holdings a activos, el archivo de datos
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
  lib/                         yahoo, stooq, cadena de respaldo, armado de archivos, líneas semanales
public/data/                   precios generados por el job (no editar a mano)
src/
  app/                         rutas: (en)/ las páginas en inglés, con el layout
                               que les da sus palabras; [lang]/ las demás (/es/…);
                               / (My money), /stocks (My stocks), /test;
                               not-found.tsx, HTML sin código propio;
                               icon.svg (los colores y la cabecera: seed-kit)
  components/                  money/ (calculator-card: las preguntas; growth-chips;
                               more-options, cargado al abrirlo; results y
                               result-card: el resultado por niveles y sus
                               tarjetas, cargadas al abrirlas; mezcla, cartera,
                               gráfico, metas, países, hallazgos, compras;
                               entry.test.ts), stocks/, charts/, portfolio/
                               (holdings, CSV), ui/ (changed: marca lo que
                               cambió; intent-link: prefetch al mostrar
                               intención); i18n-en.tsx / i18n-es.tsx (las
                               palabras de cada idioma); money/explainers.tsx
                               (los "i" plegados) y plain-language.test.ts (sin jerga)
  hooks/                       use-app (estado), use-calculation (todo por cambio),
                               calculation-details (lo que calcula cada tarjeta
                               al abrirla), use-plan
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
    assumptions.ts      la línea del crecimiento, la de supuestos y las pistas de More options
    chips.ts            los chips del crecimiento: qué invierte cada uno, My %
    growth.ts           "Grows about 7.5% a year", ×Z y +P %, etiqueta y tooltip del gráfico
    realism.ts          el mejor promedio de 20 años de los datos y el activo de crecimiento más cercano
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
    lines.ts            las líneas semanales de My stocks: carga al abrir la fila, periodos, eje
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
