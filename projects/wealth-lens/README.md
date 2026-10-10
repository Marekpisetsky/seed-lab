# Horalis Crecimiento (carpeta `wealth-lens`)

**Misión:** que cualquier persona, en cualquier país, vea, en palabras sencillas, qué
puede hacer su dinero —cuánto podría crecer, cuánto podría pagarle cada
mes y en qué lugares del mundo alcanza— sin darle sus datos a nadie. Es
la primera herramienta de Horalis: gratuita y centrada en la privacidad.

**Qué NO es:**
- No da consejo financiero ni recomienda qué comprar o vender: solo
  calcula y muestra lo que la persona escribe o lo que viene de fuentes
  públicas.
- No gestiona ni mueve dinero real, ni se conecta a ninguna cuenta de
  bróker, ni muestra productos concretos (fondos, acciones, tickers):
  solo tipos de activo con una historia pública larga.
- No promete que la regla del 4 % o el crecimiento del pasado sean
  garantías: son estimaciones históricas con riesgo de secuencia, moneda
  e inflación local, y la app lo dice en la propia pantalla.
- No guarda ni envía nada: no hay cuentas, ni servidor propio, ni
  analítica.

**Cómo cumple los cinco principios de Horalis** (la misma fila que la
tabla de *Principles* del hub, `packages/seed-kit/src/tools.json`):

| Principio | Estado | Por qué |
| --- | --- | --- |
| Your data never leaves your device | Cumple | Todo se calcula en el navegador; nada se guarda ni se envía. |
| Transparent | En parte | Gratis, con método y fuentes públicos; los cambios del método aún no se publican. |
| Truly European | Pendiente | EN y ES, pero alojada en Vercel (EE. UU.) y sin auditoría de accesibilidad hecha por personas. |
| Light | Cumple | De 208 a 237 KB por página en la primera visita, por debajo del límite de 350 KB. |
| For everyone | En parte | Palabras sencillas, teclado y objetivos de 44 px; aún sin pruebas con personas reales. |

**Estado actual (2026-10-09, fase A2 del plan Horalis):** dos pantallas (Next.js 16 + TypeScript +
Tailwind 4), exportadas como sitio estático. La principal empieza con
**cuatro pasos numerados**, con los importes vacíos y el crecimiento en
5 %; el resultado llega al pulsar *See my result* (solo la primera vez),
por niveles, colocado según el ancho de la ventana, y las metas son
opcionales. El móvil es el diseño principal. La app no
supone nada sobre la vida del usuario: no pregunta país, ni si alquila o
es propietario, ni qué quiere hacer con su dinero. Nada se guarda ni se
envía, y la app no llama a ningún servicio mientras se usa. La lógica
vive en funciones puras con 587 tests unitarios (Vitest). El uso real
sostenido (la condición del peldaño 1 de Horalis) todavía no está
demostrado. Solo se proyecta lo que tiene una
historia larga y un rango conocido; nada se presenta como predecible, y
todo supuesto viene relleno con un valor estándar documentado y se puede
cambiar. Todo lo visible está en palabras simples: "real", "nominal",
"volatility", "swings" y "percentile" solo aparecen en los "i" plegados
(un test lo comprueba). Y ningún porcentaje del resultado va sin su
equivalente en euros del dinero del usuario ("−37 % (2008) = −407 € de
tus 1.100 €"): el mismo test lo comprueba sobre lo que se ve, en los dos
idiomas y con planes de todo tipo (`percentWithoutMoney` de seed-kit).

- **My money — `/`**, para cualquiera, de quien tiene prisa a quien no se
  maneja con la tecnología: poco texto suelto, cada cosa se explica por su
  forma, y el móvil primero (el 55 % de las visitas en Europa):
  1. **Cuatro pasos iguales**: número, pregunta corta y una sola casilla.
     *How much do you have now?* (€), *How much do you add each month?*
     (€, con − / + de €50), *How much does it grow each year?* (%) y *For
     how many years?* (1-60, empieza en 20, con − / +). Sin líneas de ayuda
     salvo en el paso 3. Columnas de ancho fijo y cada pregunta en una caja
     de altura fija (dos líneas en el móvil y junto al resultado, una en
     pantalla ancha): la tarjeta mide lo mismo en inglés y en español a
     360, 1366 y 1920 px (lo comprueba `npm run test:browser`). Antes del
     primer resultado, el titular, la tarjeta, *More options* y la fila de
     confianza forman una sola columna centrada, del ancho de la tarjeta.
     Las cuatro casillas alinean el texto y el ejemplo a la izquierda. Los
     importes empiezan vacíos, con un ejemplo gris y en cursiva que no
     parece un dato. Casillas de 16 px (el iPhone
     no amplía al tocarlas), teclado numérico, y Enter pasa al paso
     siguiente y del último al botón. Debajo de los pasos, **See my
     result**, lo único destacado de la tarjeta: funciona con los dos
     importes escritos (0 es una respuesta; vacío, no) y, si se pulsa
     antes, lleva al campo vacío. Se usa solo para el primer resultado:
     después desaparece y todo se actualiza en vivo (cuando el usuario
     termina de escribir: 500 ms sin teclear, al salir del campo o con
     Enter). **More options** sale de la tarjeta: un enlace discreto
     debajo, con su propio panel.
  2. **El paso 3, una casilla de %**, con 5 ya escrito: las acciones del
     mundo crecieron un 5,2 % al año tras la inflación de 1900 a 2024
     (UBS Global Investment Returns Yearbook 2025; la fuente está en *How
     it works*). Bajo la casilla, una línea, "World average over the long
     run, after inflation" (o de dónde sale la cifra elegida, o "Your own
     number, after inflation"); debajo, en pequeño, "≈ 7.1% before
     inflation", sin hueco antes de los ejemplos; y
     **Examples:** *US stocks 7.5%*, *60/40*, *Bonds*, *Gold* y
     *Savings*, enlaces que rellenan la casilla y marcan cuál coincide. La
     cifra de un ejemplo usa sus propios años pasados; cualquier otra es
     Custom growth, que sube y baja como las acciones de EE. UU. Acepta de
     −50 % a 500 % al año (500 % es un límite técnico). Si supera el mejor
     promedio de 20 años seguidos de los datos (13 %), la línea avisa en su
     mismo sitio y tamaño: "Very rare: the best 20 years in the data gave
     13%." Por encima del 50 %, un aviso entero y con euros: "No asset in
     the data has kept this up: 70% on average for 20 years. At that
     pace, your €1,100 would be €44,706,545.", o, si un activo de los
     datos lo logró, cuál y cuántos años (ficha de
     [crecimiento](../../research/wealth-lens/crecimiento.md)). Las cifras
     enormes van en palabras ("€1.23 billion", "1230 millones de euros") o
     como potencia de diez ("€4.02 × 10¹⁸"). **More options**, cargado al abrirlo: cualquier
     otra inversión (bonos, oro, ahorro, "A mix…"), *How much it
     can go up or down in a normal year*, *Rising prices in* y *Prices rise
     per year*, con *Reset to standard* (que deja el número del paso 3).
     Un cambio ahí marca *More options* como **Custom**.
  3. **El resultado, por niveles**, al pulsar *See my result*: la tarjeta
     se desplaza y se encoge hasta ser la columna de la derecha (FLIP:
     solo transformaciones, 350 ms, con el texto nítido), el titular y la
     cabecera la acompañan, y el resultado entra por partes (número,
     cuadrícula, gráfico, 60 ms entre cada una: 340 ms en total). Sin
     animación con *prefers-reduced-motion*; CLS 0 (lo comprueba
     `npm run test:browser` a 360, 1366 y 1920 px):
     - Primero, lo que dijo el usuario: "With €1,100 today and €100 monthly
       in US stocks, in 20 years you could have…", y el total en grande,
       con su "?".
     - Justo debajo, siempre, **seis datos clave** en euros (dos columnas
       en el móvil, tres en pantalla ancha): *What you put in*, *Growth*
       ("×2.3 what you put in", nunca un % que crece sin límite), *Could
       pay you each month*, *If it goes badly* y *If it goes well* (donde
       termina 1 de cada 10 futuros posibles por debajo y por encima: los
       percentiles 10 y 90 de las simulaciones, o el total sin altibajos)
       y *Enough to live in* (el país más caro que paga, vivienda incluida,
       o "none yet"). Cada uno es un botón: al tocarlo, una línea bajo la
       cuadrícula dice de dónde sale ("In 1 of 10 possible futures, you
       end up below €110,188."). *Could pay you* abre un **deslizador de
       retiro del 2 % al 7 %** (pasos de 0,5): en vivo, lo que paga al mes,
       en cuántos de cada 100 futuros posibles duró 30 años y su zona en
       palabras y con icono (*Prudent* desde 90 de 100, *Risky* desde 75,
       *Very risky* por debajo). Las once tasas están precalculadas para
       cada activo y para el plan inicial (`src/lib/success-table.ts`).
     - **El gráfico, protagonista**: en su tarjeta con aire, 260 px de alto
       en ordenador (1,7 veces el de antes) y 210 en el móvil, con **Show:
       5 years · 10 years · 20 years · All** encima; las pestañas tan
       largas como el plan o más no aparecen. Lo aportado y el crecimiento
       como áreas apiladas, con "×2.3 what you put in" al final de la
       curva; al tocar un año, "2036: €48,200" con lo puesto y lo crecido.
       Debajo, juntos y en pequeño: "In 1 of 10 possible futures, you end
       up below €X. And in 1 of 10, above €Y.", **Where do these futures
       come from?** (una vista con 50 de los 1000 futuros en líneas finas,
       la franja de 8 de cada 10 sombreada, el resultado en grueso y tres
       frases: de qué sale cada futuro, cuántos hay y qué quiere decir "1
       de cada 10", con un enlace a Test my plan), los supuestos y la tabla
       año a año, plegada.
     - Secciones con su título siempre a la vista, en este orden; solo su
       detalle largo espera tras *See more*:
       - **What if…?** (en el móvil, bajo el gráfico; en pantalla ancha, al
         lado, ver abajo): *Grows 1% more / less*, *+€50 a month*, *5 more
         years* y **First 10 years like 2000–2009**: los diez primeros años
         con el crecimiento real, año a año, de 2000–2009 del activo
         elegido (o de su peor década en los datos, con sus años: bonos
         2013–2022, oro 1988–1997), luego la media (`src/lib/decade.ts`).
         Cada uno con lo que cambia en euros; tocar uno lo aplica a toda la
         pantalla, con "What if: 5 more years (+€87,000) ×" junto al total
         para quitarlo. No se guarda en el archivo.
       - **Check your plan** / **Chequeo de tu plan**, solo si algo
         destaca (`src/lib/plan-check.ts`): de 0 a 3 observaciones, cada
         una con sus euros y un enlace a *How it works*: pocos años (menos
         de 5, o una meta a menos de 5) con dinero que sube y baja, cuántos
         de los 1000 futuros acaban por debajo de lo puesto (desde 1 de
         cada 10); y Ahorro durante 10 años o más, lo que vale frente a lo
         puesto y frente a las acciones de EE. UU. (con su peor caída). Informa, nunca aconseja; método en
         [research/wealth-lens/chequeo.md](../../research/wealth-lens/chequeo.md).
       - **My goals**: cinco tipos combinables (*Live without working*, *Live somewhere*, *Buy
         something*, *My own goal* y *A monthly amount*), cada uno
         calculado por separado sobre el mismo plan. *Buy something* pide
         el nombre y el precio a la persona, con un ejemplo en gris; no hay
         lista de precios. Siempre con su fecha:
         "✓ from 2031, in 5 years" si llega dentro de los años del plan,
         "in 25 years (2051)" si después, o, a más de 60 años, "not at
         this pace — needs €327/month for 30 years".
       - **Where it reaches**: la tabla de países con una columna (lo que
         vive una persona media al mes, vivienda incluida, de los datos
         oficiales del Banco Mundial), 7 filas: primero los países ya
         cubiertos, incluido el que nombra *Enough to live in*, luego
         los más cercanos a cubrirse, y Perú y Países Bajos para comparar.
         Cada celda dice cuándo, en dos líneas cortas: "✓ from 2041 / in 15
         years", "in 21 years / (2046)" o "not at this pace"; nunca un ✓
         sin fecha. Buscador, "Show all" y un "+" para añadir a My
         goals.
       - **Good to know**: una línea ("What could go wrong, and
         what helps most"); tras *See more*, la línea de
         supuestos con sus euros ("Grows 5% a year after rising prices:
         +€1,109 the first year · can move ±18% in a year: ±€3,564 on
         €20,000"), dónde terminan 8 de cada 10 futuros posibles (en una
         mezcla, su rango y su peor año en euros, "−37 % (2008) = −407 € de
         tus 1.100 €", junto a las acciones de EE. UU. solas) y hasta 3 hallazgos.

     Los "?" quedan junto al total y a cuántas historias aguantó el
     retiro; el resto de ayudas son una frase dentro de su sección.
  4. **Tras el primer resultado, según el ancho de la ventana**:
     - 1440 px o más: tres columnas. A la izquierda, estrecha y a la vista
       al desplazar, *What if…?* como lista; en el centro, la más ancha
       (752 px a 1440), el resultado; a la derecha, estrecha y a la vista,
       los cuatro pasos en versión reducida y *More options*. La cabecera
       y el pie se ensanchan con ellas.
     - De 1024 a 1439 px: dos columnas, el resultado a la izquierda y, a la
       derecha y a la vista, los pasos y debajo *What if…?*.
     - Menos de 1024 px (móvil): una columna, y abajo, donde llega el
       pulgar, una barra con el plan ("€1,100 · €100/month · 5% · 20
       years") y **Edit**, que abre los pasos desde abajo en como mucho la
       mitad de la pantalla y mueve la página para que el número grande
       quede encima, cambiando en vivo mientras se edita.
     - Los pasos son siempre el mismo elemento y se deslizan a su sitio
       (FLIP, ver arriba); sin animación con *prefers-reduced-motion*.
     - La cabecera de Horalis (seed-kit) queda fija arriba en todas las
       páginas y se compacta al desplazar, solo con CSS: sube lo que mide
       su margen (en el móvil, su primera fila, y queda la de las
       páginas); las columnas fijas del resultado van justo debajo.
     - Todo control mide al menos 44 × 44 px, ningún texto del resultado
       baja de 14 px, y nada importante aparece solo al pasar el ratón.
- **My stocks — `/stocks`** se retiró en la fase A2 (2026-10-09): dependía
  de precios diarios de fuentes no oficiales (Yahoo Finance, Stooq) y
  mostraba productos concretos. Su dirección da la página 404, como
  `/charts` y `/fire` de versiones anteriores.

**La tasa de retiro que respaldan los datos (fase A4).** «Te pagaría al
mes» empieza en la mayor tasa fija, después de la subida de precios, que
duró 30 años desde cualquier comienzo de los datos de la inversión, el
peor incluido (Bengen): acciones de EE. UU. 3,78 % (1928–2022, peor
comienzo 1929, 66 periodos); bonos y oro, con solo 8 periodos, «guía
aproximada». El ahorro, una sola respuesta; «Mi %», la tasa de la persona
y qué haría una caída como el peor año del activo más parecido. Motor en
`packages/seed-kit/src/withdrawal-rate.ts`, uso en `src/lib/safe-rate.ts`;
archivo de datos versión 13 (un 4 % de archivos anteriores, el viejo valor
por defecto, pasa a la tasa de los datos). Método:
[research/wealth-lens/tasa-de-retiro.md](../../research/wealth-lens/tasa-de-retiro.md).

**Cualquier país y moneda (fase A3).** El plan tiene moneda (Más
opciones, «Tus importes están en»), cualquiera con tipo oficial del Banco
Mundial en el año de precios de los países. Los importes escritos están en
ella; el coste de cada país sale en ella al tipo oficial de ese año; los
pasos («+50 € al mes») y los umbrales de las observaciones son la misma
cantidad de dinero en ella, redondeada (`src/lib/money.ts`). La primera
visita empieza en el país y la moneda que dice el idioma del navegador
(es-MX: México y pesos), en el dispositivo; los números se escriben como
en la región del lector si su navegador habla el idioma de la página. El
archivo de datos pasa a la versión 12 (guarda la moneda; los anteriores se
leen en euros). Neerlandés construido en `/nl` pero oculto (ni en el
selector, ni en hreflang, `noindex`) hasta que lo revise un nativo.
Método: [research/monedas.md](../../research/monedas.md).

Limitaciones conocidas: el crecimiento no cuenta los cambios entre monedas
(cada inversión crece en la suya, después de su inflación); el coste de vida es una media nacional (las ciudades
varían mucho); los retornos de las acciones de EE. UU. y del oro están en
dólares (después de la inflación de EE. UU.) y los bonos en euros (después
de la alemana), y todo se compara en 1988–2022, porque el S&P 500 de
Shiller llega a 2022. Las acciones del mundo (MSCI World) y el Nasdaq-100
se quitaron: sus datos no son abiertos y no hay una serie oficial abierta
que los sustituya (ver la ficha de
[crecimiento](../../research/wealth-lens/crecimiento.md)).

## Arquitectura

**Continuidad tras la interrupción (2026-10-05).** El contexto recuperado,
la cadena de PR #26–#29 y lo pendiente de las fases 5 y 6 están en
[`docs/continuity-2026-10-04.md`](docs/continuity-2026-10-04.md). El
traspaso vigente es siempre el `docs/continuity-AAAA-MM-DD.md` de fecha más
alta.
La aportación necesaria para una meta lejana incorpora ahora la década
mala seleccionada; la vista de futuros distingue esa curva de los futuros
sin esa década impuesta. Las fichas de Research acompañan las correcciones.
Lint, tipos, build, 790 tests unitarios y 28 pruebas de navegador pasan.
El PR #17 de migración no forma parte de esta continuación.

- Next.js (App Router) + TypeScript con `output: "export"`: `next build`
  genera HTML/CSS/JS estático en `out/`, servido por la CDN de Vercel sin
  funciones ni rutas de servidor.
- **Sin backend, sin base de datos, nada que dure más que la pestaña.** El
  estado (el plan y el *What if…?* puesto) vive en memoria
  (`src/lib/app-store.ts`), y el plan se guarda además **solo en la
  pestaña** (`sessionStorage`, clave `horalis-growth:plan`,
  `src/lib/tab-memory.ts`, fase B1): una carga nueva de la página (una
  versión nueva del sitio, un toque antes de que llegue el código, una
  recarga, un móvil que durmió la pestaña) lo recupera, otras pestañas no
  lo ven y el navegador lo borra al cerrarla. Nada va a `localStorage`,
  cookies ni a un servidor. El tema elegido en la cabecera (claro u
  oscuro) también dura lo que la pestaña (seed-kit, `theme.ts`). Lo
  explica la página de privacidad. "Download my data"
  genera un JSON local y "Load my data" lo lee en el navegador, sin
  subirlo. Si una versión anterior dejó datos en `localStorage`, la app
  ofrece una vez cargarlos o borrarlos, y los borra en ambos casos.
- **Cero llamadas en tiempo de uso, y nada que caduque.** Los retornos
  históricos y el coste de vida son JSON dentro del bundle, de series
  cerradas o de los datos oficiales anuales de seed-kit (ver "Datos").
  No hay precios diarios ni tareas programadas.
- Un solo plan (`Plan` en `src/lib/types.ts`): dos importes (`null`
  hasta que se escriben; `planReady` en `src/lib/plan.ts` decide cuándo
  hay resultado), la inversión, los años, la tasa de retiro, *Rising
  prices in* (`pricesOf`), lo que el usuario cambió de los supuestos
  (crecimiento después de inflación, el número de *My %*; oscilación;
  inflación; `null` = estándar) y las metas (una lista, vacía al empezar). `src/lib/calculator.ts` deriva de él todo lo
  que se ve (resultado, metas, tabla de países) y
  `src/hooks/use-calculation.ts` lo calcula una vez por cambio para todas
  las secciones (su código llega al empezar a usar la página:
  `src/hooks/use-lazy-calculation.ts`) (medido como `performance.measure("wealth-lens:report")`:
  por debajo de 16 ms al escribir, usar − / +, cambiar la inversión o
  tocar un *What if…?*, con los efectos de los cinco incluidos; ver
  "Velocidad"). El archivo de datos va por la
  versión 11: solo el plan (los importes, vacíos si no se escribieron,
  *Rising prices in*, los supuestos cambiados, con el crecimiento como el
  único número de *My %*, después de inflación, y las metas). Lee las
  anteriores, y dice en una línea bajo "Load my data" lo que ya no existe:
  las acciones del mundo y el Nasdaq-100 pasan a acciones de EE. UU.; una
  acción, en la inversión o en una mezcla, y My portfolio, también; los
  holdings y los precios subidos se ignoran; una meta de la antigua lista
  de compras se quita; las metas de un país pasan a la cifra oficial. El
  crecimiento propio de las versiones 9 y 10 conserva la oscilación de las
  acciones del mundo que tenía (`WORLD_CUSTOM_VOLATILITY`), así que su
  resultado no cambia. Además: el crecimiento de la
  v7 (antes de inflación) y el de la v6 (antes o después) pasan al número
  después de inflación con la inflación del archivo (la suya o la de su
  país); un crecimiento cambiado sobre un índice o una mezcla pasa a *My
  %* con los altibajos de esa inversión, así que el resultado no cambia;
  un importe que falta en un archivo anterior a la v8 sigue siendo 0; un
  índice (v1-v5) es ese activo; un % propio pasa a *My %*; una inflación
  distinta del antiguo 2 % queda como inflación escrita. Las metas
  mensuales "income" de la v4 pasan a *A monthly amount* con su nombre
  como etiqueta; la misión guardada (v3), la conexión
  fijada (v2) o la meta en euros (v1) pasan a ser la primera meta de My
  goals, y los elementos propios las siguientes. "Stop working" se
  convierte en vivir en el país que aquella versión preguntaba; lo que no se puede decir sin suponer un país
  propio (4 días, media jornada, "la app elegía") se omite.
- En qué crece el plan (`src/lib/assets.ts`, `src/lib/investment.ts`).
  Solo activos con historia larga y un rango conocido; los supuestos
  estándar salen de los datos y siempre se pueden cambiar:
  - **Acciones de EE. UU., bonos alemanes o el oro**: su crecimiento medio después de
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
    80/20, 60/40: acciones de EE. UU. y bonos alemanes, puntos de partida
    de manual, no consejo) y *Let weights drift* / *Rebalance every year*.
    Crecimiento: la media ponderada. Incertidumbre: 1.000 caminos de 60
    años; cada año se sortea un año histórico común a todos los activos
    (acciones, bonos y oro se mueven juntos como lo hicieron; en 2022
    cayeron acciones y bonos a la vez). Junto al resultado: "Range (8 in
    10)" y "Worst year in the data", con las mismas cifras de las acciones
    de EE. UU. solas, sobre los mismos años. Ninguna optimización ni
    sugerencia de pesos. Las acciones sueltas y My portfolio se quitaron
    en la fase A2 (ficha de [mezclas](../../research/wealth-lens/mezclas-y-acciones.md)).
  - **Custom growth**: el % anual y la oscilación que escriba el usuario,
    sin ningún activo detrás; si no escribe oscilación, la de las acciones
    de EE. UU. (hasta la fase A2, la de las acciones del mundo).
  - **Supuestos cambiados**: con el crecimiento o la oscilación del
    usuario la historia ya no los describe, así que cada año se sortea de
    una normal en logaritmos, log(1 + r) ~ N(log(1 + g), σ²) (el año típico
    crece exactamente g; `src/lib/normal.ts`, 2.000 cuantiles
    equiespaciados); con oscilación 0, todos los años iguales. Cambiar solo
    la inflación no toca las simulaciones: solo convierte nominal ↔ real.
- **What if…?** (`src/lib/what-if.ts`; `calculate(plan, today, whatIf)` y `whatIfEffects` en `src/lib/calculator.ts`). Cada escenario
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
- **Palabras simples, en inglés y español (y neerlandés, oculto hasta que
  lo revise un nativo)**: todo texto visible vive en los diccionarios
  (`src/i18n/messages/en.ts`, `es.ts` y `nl.ts`, del mismo tipo: una clave
  que falte en otro idioma no compila); la lógica devuelve números
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
- **Inflación por país** (`packages/seed-kit/src/data/inflation-reference.json`):
  cada país lleva una inflación de referencia con su base y fecha
  (septiembre de 2026, escrita a mano): el objetivo de su banco central
  (el 2 % del BCE en la zona euro, Bulgaria incluida desde enero de 2026;
  el centro del rango cuando es un rango), que es hacia donde convergen
  las previsiones a largo plazo; sin objetivo confirmado, su media
  2015–2024. **Inflación alta**: `recentAverage` marca los países cuyos
  precios subieron un 10 % al año o más de media en 2015–2024; donde hay
  objetivo se usa igualmente el objetivo. Es la única cifra escrita a mano
  que queda; la fase A3 decidirá cómo sacarla de los datos oficiales.
- **Velocidad.** Las dos pantallas se prerenderizan con sus valores de
  llegada, así que se ven antes de que corra el JavaScript. Las tasas de
  éxito de los once pasos del deslizador (2–7 %) de los activos con
  historia y del plan inicial están precalculadas
  (`src/lib/success-table.ts`, un test las recalcula exactas). Los
  retornos simulados de una mezcla se guardan por parte, la simulación de
  éxito reutiliza los mismos índices sorteados para cualquier conjunto de
  cifras propias, y en ratos libres (pasos de menos de 50 ms) se
  precalculan los sorteos, los años simulados de cada activo y una
  primera pasada de cada plantilla de mezcla y de cifras propias
  (`src/lib/warm.ts`). La portada solo pregunta: el código del cálculo
  llega al empezar a usar la página (`src/hooks/use-lazy-calculation.ts`).
  Las mediciones de cada ronda (peso, recálculo, Lighthouse) están en las
  pull requests y en el historial de este archivo.
- Sin credenciales de bróker ni APIs de pago — respeta la regla de
  costo cero de Horalis.

## Resultados: metas, países, hallazgos

**Metas** (`goalStatuses` en `src/lib/calculator.ts`). Cada una se
calcula sola sobre el mismo plan: vivir en un país o un ingreso mensual
necesitan el capital cuyo retiro lo paga (coste × 12 ÷ tasa de retiro);
una compra o un importe, esa cifra. **Tope de 60 años** (`MAX_YEARS`):
más allá, "not at this pace" con el aporte mensual que la lograría en 30
años, y ninguna cifra cita una fecha más lejana. Un país que un archivo
nombra pero los datos oficiales ya no tienen se muestra como "No longer
on the list" y se puede quitar. Las entradas extremas (€1, €0, €0 al mes,
€10.000.000, €1.000.000 al mes, 0 % o −2 % de crecimiento, 1 y 60 años)
tienen sus tests en `src/lib/edge-cases.test.ts`: "under €1/month" en
vez de €0, sin "-€0", sin años de más de 60.

**Países** (`countryRows`): una fila por país con datos oficiales,
ordenadas por coste: lo que vive al mes una persona media allí, vivienda
incluida. Por defecto se ven 7 (los ya cubiertos, los más cercanos, Perú y
Países Bajos); un buscador (en la tabla y al añadir la meta "vivir en…")
encuentra cualquiera por su nombre en el idioma de la página o en inglés,
sin importar tildes. ✓ cuando el ingreso al cabo de los años elegidos lo
paga; si no, cuándo llega el plan. Los estados se redondean hacia arriba a
años enteros, así que una celda sin ✓ a 20 años nunca dice "in 20 years".

Los datos de países son de seed-kit (`packages/seed-kit/src/cost-of-living.ts`
y `data/living-costs.json`), la única fuente que comparten Horalis
Crecimiento y Horalis Coste de vida: la media de la encuesta de hogares
del Banco Mundial (SI.SPR.PCAP, dólares PPA de 2021 al día, cada país su
última encuesta), llevada a precios del último nivel de precios
(PA.NUS.PPPC.RF) con la inflación de EE. UU., en dólares y en euros al tipo
oficial de ese año. Los países sin esos datos no aparecen: no se inventa
ninguna cifra. Método y límites:
[research/wealth-lens/coste-de-vida.md](../../research/wealth-lens/coste-de-vida.md).
Hasta la fase A2 eran 30 países de Numbeo y Wise y 142 estimados con el
nivel de precios; esas fuentes no permitían copiar sus datos.

**Hallazgos** (`src/lib/findings.ts`, una función pura por regla, cada
una con su regla de relevancia; se muestran los 3 primeros que aplican,
en el orden fijo de `ORDER`, y ninguno dice "deberías"). Hablan de los
años elegidos; los de "llegar" hablan de la primera meta cuando está a
2+ años (palanca) o 5+ años (secuencia), y si no, del resultado:

| Hallazgo | Aparece cuando | Número |
| --- | --- | --- |
| Palanca más fuerte | +€100/mes vs +1 % de crecimiento vs haber empezado un año antes: gana 6+ meses en la primera meta, o ≥ €1.000 y ≥ 5 % al final | años antes, o € de más |
| Riesgo de secuencia | los primeros 10 años como 2000–2009 (o la peor década del activo en los datos) retrasan la primera meta 1+ año, o dejan ≥ €1.000 y ≥ 5 % menos al final | años de retraso o € de menos |
| Inflación | 5+ años y un resultado de €1.000 o más | lo que mostrará la cuenta en euros de ese año (la app cuenta en euros de hoy) |
| Coste de esperar | 2+ años y empezar un año más tarde cuesta ≥ €500 y ≥ 2 % | € de menos al final |
| Comisiones | 5+ años y la diferencia ≥ €1.000 | fondo al 1 % vs al 0,2 % |
| Duplicación | crecimiento ≥ 2 % al año | cada cuántos años se duplica |

**Compras, deseos y "Prices of"** se quitaron en la fase A2: dependían de
una tabla de precios por país que había que mantener a mano. Las metas son
de la persona: pone el nombre y el precio de lo que quiere, con un ejemplo
en gris del tipo de cifra.

## La primera pantalla de *My money*

Arriba, antes de la calculadora, un titular corto que habla a la persona
y a lo que quiere ("What could you do with your money?" / "¿Qué podrías
hacer con tu dinero?") y una frase de apoyo ("Un viaje, una casa, vivir sin
trabajar: mira cuándo llegas.")
(`money.headline` y `money.support`). Debajo del aviso "Write your
numbers to see your result", tres puntos de confianza en línea, con su
icono: sin cuentas, solo en esta pestaña y los años de los datos ("Data
from 1988–2022", sacados de `COMMON_PERIOD`, así que no se desactualizan).
Se ven mientras no hay resultado; con el resultado, su sitio lo ocupa él.
Los cálculos y el flujo por niveles no cambian.

## Páginas del sitio

About, How it works, Privacy y Terms (`/about`, `/how-it-works`,
`/privacy`, `/terms` y sus versiones `/es/…`), más una 404 en los dos
idiomas (`src/app/not-found.tsx`, HTML sin código propio). Sus textos viven en los diccionarios
(`about`, `howItWorks`, `privacy`, `terms`, `notFound`), con frases de hasta
unas 22 palabras; *How it works* cita cifras sacadas de los datos (países, años de las
encuestas y de los precios, inflación alta), así que no se desactualiza. El pie enlaza las cuatro y "Part of Horalis", y termina con
"© 2026 Horalis. Free to use." Contacto: horalis (arroba) proton.me,
en About y Privacy. `[email](email)` en los diccionarios lo inserta
(`src/components/ui/email.tsx`): el HTML estático solo lleva sus dos partes
(`CONTACT` en `src/lib/site.ts`), que el CSS muestra como una dirección, y
el navegador la convierte en un enlace de correo; ni la dirección entera
ni `mailto` aparecen en el HTML, para que no la recojan los bots. Sin
enlaces a GitHub en la web. Código propietario: ver `LICENSE` y `TRADEMARKS.md` en la raíz
del repositorio. Icono: la semilla verde de Horalis, la misma en toda la familia
(`src/app/icon.svg`;
`favicon.ico` y `apple-icon.png` los dibuja `npm run images` a
partir de él). La imagen para compartir, de 1200×630, se genera en el
build (`src/app/og.png/route.tsx`, estática, la misma para todas las
páginas y los dos idiomas): fondo casi negro, el icono y el lema.

## Identidad visual

Los colores viven en el `tokens.css` de seed-kit
(`packages/seed-kit/src/tokens.css`), el único archivo de colores de todas
las apps de Horalis, para que se vean como una familia: blanco puro o casi negro (#0A0A0A), grises neutros sin tinte
cálido y un único color de marca, el verde de la semilla. `--brand`
(#00A36C; #1FCB86 sobre oscuro) rellena lo grande: logo, iconos y el área
de crecimiento del gráfico; `--accent` (#00774C; #3DDC97 sobre oscuro) es
el de texto, enlaces y botones de la app, para mantener AA. En el gráfico,
*Growth* va en el verde de marca y *Put in* en un azul secundario
(#4A6CF7; #5B7CFA sobre oscuro); la pareja pasa las comprobaciones de
daltonismo y contraste. Todo texto mantiene al menos 4,5:1 sobre el
fondo, la tarjeta, el relleno sutil y su propio tinte.

**Claro, oscuro y daltonismo (fase 3).** El menú de tema de la cabecera
(claro / oscuro / automático, el del dispositivo por defecto) es el de
seed-kit: la elección dura lo que la pestaña (`sessionStorage`), el
script de `src/i18n/detect.ts` la aplica antes de pintar. Nada se dice solo con color: cada ganancia
lleva "+" y ▲ y cada pérdida "−" (el signo menos de verdad, que los
lectores de pantalla leen "menos") y ▼ (`Trend` de seed-kit en los *What if…?* y las tarjetas de *Test my plan*); las zonas del retiro llevan su icono y su palabra; los
años marcados de *Every start year* llevan una forma propia (▼ el peor,
◆ el del medio, ▲ el mejor). El verde de ganancia pasó a #00796B (#5CE6B8
sobre oscuro): con el anterior, ganancia y pérdida casi se confundían con
deuteranopía (ΔE 9,8 en claro y 5,3 en oscuro; ahora 27,3 y 16,8).
`e2e/colours.test.mts` lo comprueba con la emulación del navegador.
`globals.css` solo los importa y los nombra para Tailwind. Tipografía del
sistema (sin fuentes descargadas), títulos en extra-negrita.
`src/app/tokens.test.ts` comprueba que el icono y la imagen para compartir
usan sus valores (el contraste lo comprueban los tests de seed-kit).

**Marca Horalis (2026-10-09).** La herramienta se llama Horalis Crecimiento
(EN: Horalis Growth; antes Wealth Lens). Su icono, su imagen para compartir
y su cabecera llevan la semilla verde de Horalis, como el resto de la
familia (antes, una lupa con tres barras). En la cabecera se lee «Horalis»
y, después, «Crecimiento»; en el móvil, debajo.

## Cabecera y pie de Horalis

La cabecera y el pie son los de seed-kit (`packages/seed-kit`), los mismos
que llevan el hub y cada herramienta: la semilla con "Horalis Crecimiento", las
páginas, EN/ES y el lanzador de Horalis; en el pie, los controles de
datos, los enlaces, "Parte de Horalis", la nota y el copyright.
Junto a EN/ES está el menú de tema de seed-kit (en un móvil de hasta 424
px, al pie del panel del lanzador).
`src/components/site/site-shell.tsx` solo dice lo propio de Horalis Crecimiento
(su nombre, páginas, enlaces y nota) y pasa `IntentLink`, para que
cambiar de página o de idioma no pierda lo escrito.

El lanzador es un botón de rejilla junto a EN/ES que abre un panel
pequeño: "Horalis" (enlace al hub) y las herramientas visibles de la
lista común (`packages/seed-kit/src/tools.json`), con Horalis Crecimiento marcado
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

Desde la fase A2 todas las fuentes permiten reutilizar sus datos citándolas:

| Fuente | Condiciones | Qué se publica |
| --- | --- | --- |
| Robert Shiller (Yale) | Libre con atribución | Rentabilidad real anual derivada del S&P 500 |
| OCDE, Bundesbank, Destatis | CC BY 4.0 / uso libre con atribución / dl-de/by-2-0 | Rendimientos del Bund y precios alemanes, con atribución |
| US BLS | Dominio público | IPC de EE. UU. 2023–2024 |
| Banco Mundial (Pink Sheet) | CC BY 4.0 | Precio medio del oro en diciembre y su rentabilidad real |
| Banco Mundial (PIP, WDI) | CC BY 4.0 | Coste de vida por país, niveles de precios e inflación, con atribución |
| UBS Global Investment Returns Yearbook 2025 | Cita de una cifra publicada | Solo el 5,2 % del arranque del paso 3 |
| Unicode CLDR | Licencia Unicode | Nombres de países |

Las fuentes que no permitían copiar sus datos (Yahoo Finance, Stooq,
Numbeo, Wise, MSCI, Nasdaq, LBMA) se quitaron con todo lo que dependía de
ellas. La cifra de UBS es la única que no es de un organismo oficial: la
fase B2 quita el crecimiento preseleccionado (y con él esa cita).

## Test my plan (`/test`, `/es/test`)

El plan tal cual está en My money (mismo activo o mezcla, mismos importes,
sin *What if…?*) pasado por la historia real de los datos, año a año, sin
simulación (`src/lib/history-test.ts`, tests en `history-test.test.ts`).
Se lee como My money: un titular de una línea, "What would the real crises
have done to your plan?" (en una línea desde 1024 px; lo comprueba
`npm run test:browser`), **tarjetas grandes por crisis** (una por fila en
el móvil, dos en tableta, tres en ordenador) con su año, una línea pequeña
de lo que hizo 1 € durante la crisis y **una sola cifra en euros del
usuario**: "−€971 and 6 years to get it back", "−€586, not back by 2024" o
"No fall at year ends". Al tocar una, su detalle: lo que pasó en el mundo
en una frase, la cifra, el gráfico grande y, tras *See more*, todo lo
demás (la caída en detalle, el final del plan, el crecimiento medio y la
comparación con el S&P 500). Ningún porcentaje sin sus euros (lo comprueba
`src/components/test/test-module.test.ts`).

- **Seis crisis** (`CRISES`): Great Depression (1929, 1929–1931), Oil
  crisis (1973, 1973–1974), Dot-com crash (2000, 2000–2002), Financial
  crisis (2008), Covid (2020) e Inflation shock (2022). Cada una empieza el
  año anterior ("If you had started in 2007"). Solo se activan las que el
  activo o todas las partes de la mezcla tienen en sus datos: las acciones
  de EE. UU. llegan a 1928, bonos y oro a 1988, así que 1929 y 1973 son
  solo de las acciones; las demás tarjetas dicen "no data for this". El
  crecimiento propio (el 5 % del paso 3, entre otros) se mueve como las
  acciones de EE. UU., así que se prueba con sus años reales (y lo dice). Una cuenta de
  ahorro, o un crecimiento sin altibajos, no tiene historia que probar.
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
- **Mezclas**: cada parte sigue su propia historia
  (reequilibrada cada año si la mezcla se reequilibra), y se muestra al
  lado lo que hicieron las acciones de EE. UU. solas: su caída en cada crisis, sobre el mismo dinero en lo más alto, y
  su peor año de inicio. Sin sugerir pesos.
- Aportes como en las simulaciones: la mitad de los del año al empezarlo y
  la mitad al acabarlo. Cifras a final de año, en euros de hoy.

## Datos

**Sin precios diarios.** Hasta la fase A2 un job diario descargaba cierres
de Yahoo Finance y Stooq. Se retiró: `scripts/update-prices.mts` solo
imprime un aviso, y `.github/workflows/update-prices.yml` (que la sesión de
A2 no podía borrar) hay que borrarlo a mano, junto con ese script.

**Acciones de EE. UU.** (`src/data/sp500-real-returns.json`): S&P Composite
1928–2022, retorno total real (Robert Shiller, enero a enero).

**Bonos y oro** (cada archivo guarda las cifras de origen y los tests
recalculan cada año):

- `euro-bonds-real-returns.json`, **bonos alemanes**, 1988–2024: un Bund alemán a 10 años, la referencia de la zona.
  Retorno total por el método de vencimiento constante (el de Shiller y
  Damodaran para el Tesoro de EE. UU.): se compra a la par al rendimiento
  medio de diciembre y se valora un año después, con 9 años por delante,
  al rendimiento del diciembre siguiente, más el cupón. Rendimientos de la
  OCDE (serie IRLTLT01DEM156N, datos del Bundesbank); inflación alemana de
  diciembre a diciembre (Destatis; Alemania Occidental hasta 1991). Las
  medias de diciembre suavizan el cierre del año (2022: −19,8 % nominal
  aquí, unos −22 % de cierre a cierre).
- `gold-real-returns.json`, **oro**, 1988–2024: la media de diciembre de
  cada año del precio en dólares de la Pink Sheet del Banco Mundial (CC BY
  4.0), después de la inflación de EE. UU. Guarda los precios de diciembre
  usados, y un test recalcula cada año. La media de diciembre suaviza el
  cierre del año: un año puede diferir unos puntos de las cifras de cierre a
  cierre. Hasta la fase A2 era la fijación LBMA de fin de año, cuyas
  condiciones no permiten redistribuirla.


**Periodo común.** Los tres activos se comparan sobre los mismos años, el
periodo más largo que cubren todos: hoy **1988–2022** (35 años;
`COMMON_PERIOD` en `src/lib/indexes.ts`, calculado de los datos). Esas
rentabilidades alimentan todo: palancas, proyecciones, mezclas y Monte
Carlo, y la app muestra el periodo junto a cada cifra. Promedio real anual
en 1988–2022: acciones de EE. UU. 7,5 % (±16 %), bonos alemanes 2,5 %
(±8 %; peor año 2022, −26 % después de inflación) y oro cerca del 1 %
(peor año 2013). Los
datasets completos se conservan y se validan igual. Para alargar el periodo hace falta el S&P 500 de 2023 en adelante
con el mismo método (enero a enero, de los datos de Shiller).

## Cómo correrlo

Requisitos: Node.js 22.18 o más nuevo y npm.

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
npm run test:browser  # tras npm run build: la página en un navegador real (Playwright): e2e/money y e2e/colours
npm run test:watch
npm run lint      # ESLint (config de Next.js)
npm run typecheck # tipos de TypeScript, también los de seed-kit
npm run build     # primero los tipos, luego el sitio estático en out/
```

Los tests cubren la lógica, que vive separada de la UI en `src/lib/`:
matemática financiera con casos verificados a mano (€1000 al 7 % por 10
años = €1967.15, 4 % de €1000 = €40/año, €300.000 al 4 % = €1000/mes), la
calculadora, el gráfico, los cinco *What if…?*, la ausencia de jerga y de
porcentajes sin euros en lo que se ve, la entrada en EN y ES, los ejemplos
del paso 3, la tabla de países (orden, ✓ si y solo si el ingreso lo paga,
filas por defecto), las metas, los hallazgos, el chequeo, las tasas de
éxito precalculadas, los avisos de realismo, el archivo de datos (ida y
vuelta, versiones 1 a 10, archivos dañados o ajenos, lo que ya no existe
con su aviso), la limpieza de datos antiguos, los datasets (cada retorno
recalculado desde las cifras de origen), los supuestos editables, las
mezclas y el Monte Carlo (semilla fija). `npm run test:browser`, tras el
build, lo comprueba en un navegador real (EN y ES, 360 a 1920 px,
contraste AA en claro y oscuro, daltonismo, 44 × 44 px, sin
almacenamiento).

## Mapa del código

```
scripts/
  images.mts                   favicon e icono de Apple desde icon.svg
  update-prices.mts            retirado: solo un aviso (borrar con .github/workflows/update-prices.yml)
src/
  app/                         rutas: (en)/ las páginas en inglés, con el layout
                               que les da sus palabras; [lang]/ las demás (/es/…);
                               / (My money), /test, /about, /how-it-works,
                               /privacy, /terms; not-found.tsx, HTML sin código
                               propio; icon.svg (los colores y la cabecera: seed-kit)
  components/                  money/ (money-module: la página y sus tres
                               disposiciones, la barra y el panel del móvil;
                               calculator-card: los cuatro pasos, See my result
                               y More options; growth-field: el paso 3;
                               more-options, cargado al abrirlo; results: el
                               resultado por niveles; key-facts; mezcla, gráfico,
                               metas, países, hallazgos, chequeo; entry.test.ts),
                               test/ (Test my plan), pages/, site/, ui/;
                               money/explainers.tsx (los "i" plegados) y
                               plain-language.test.ts (sin jerga)
  hooks/                       use-app (estado), use-calculation (todo por cambio),
                               use-lazy-calculation (su código, al empezar a usar la página),
                               calculation-details (lo que calculan las secciones
                               y See more), use-plan
  lib/
    app-store.ts        estado en memoria (plan y What if…?)
    calculator.ts       resultado, metas, tabla de países, tope de 60 años
    settle.ts           aplica un número cuando se termina de escribir (500 ms)
    findings.ts         "Good to know": una regla por hallazgo
    plan-check.ts       "Check your plan": horizonte y ahorro, con sus euros
    simulation.ts       bandas de Monte Carlo y cachés de simulación
    success-table.ts    tasas de éxito del 2 al 7 % precalculadas por activo
    withdrawal.ts       los pasos del deslizador de retiro y sus zonas
    decade.ts           la mala década real: 2000–2009 o la peor de los datos
    assets.ts           lo que se puede proyectar: acciones de EE. UU., bonos, oro, ahorro
    investment.ts       supuestos estándar y cambiados: crecimiento, oscilación, simulación
    assumptions.ts      la línea del crecimiento, la de supuestos y las pistas de More options
    examples.ts         el paso 3: sus ejemplos, qué invierte cada uno y la casilla de %
    growth.ts           "Grows about 7.5% a year", ×Z y +P %, etiqueta y tooltip del gráfico
    realism.ts          el mejor promedio de 20 años de los datos y el activo de crecimiento más cercano
    what-if.ts          los cinco "What if…?": qué cambia cada uno
    normal.ts           años sorteados de una normal para cifras propias
    mix.ts              mezclas con pesos: modelo conjunto, deriva/reequilibrio, peor año
    volatility.ts       la oscilación de una serie de retornos
    projections.ts      una sola entrada a bandas y tasas de éxito
    warm.ts             lo que se precalcula en ratos libres
    step.ts             los botones − / + (pasos de €50 y de un año)
    number.ts           leer un número escrito a mano
    index-ids.ts        las series que se pueden usar, y las retiradas
    indexes.ts          datasets de retornos reales: acciones de EE. UU., bonos alemanes, oro
    data-file.ts        "Download my data" / "Load my data"
    legacy-storage.ts   limpieza de datos que dejaron versiones anteriores
    finance.ts          matemática financiera (funciones puras)
    monte-carlo.ts      probabilidad de que una tasa de retiro dure 30 años
    validation.ts       validación de todo lo que se carga desde un archivo
  data/
    sp500-real-returns.json     acciones de EE. UU. (Shiller)
    euro-bonds-real-returns.json, gold-real-returns.json
                                (los países: packages/seed-kit/src/data/, de los datos oficiales)
```

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.

## Metas personales y lectura (2026-10-05)

«Mis prioridades» reúne las metas marcadas con la estrella y muestra una
barra con el capital actual y cuánto falta. Las metas se calculan por separado;
no descuentan dinero ni prometen financiar todas a la vez. «Vivir sin trabajar»
parte de los gastos mensuales propios, incluido alojamiento. Opcionalmente se
puede cargar y ajustar la estimación de un país. El capital necesario es
`gastos × 12 / tasa de retiro`; junto al resultado se muestra la tasa y que
el modelo de 30 años no es garantía. Método y límites:
[Research: metas personales](../../research/wealth-lens/metas-personales.md).

Elegir un país añade directamente la meta, sin un paso obligatorio
adicional. Desde la fase A2 es una sola cifra oficial, vivienda incluida
(antes se podía quitar el alquiler). Las metas de cantidad aceptan un
nombre propio.

La letra de apoyo pasa a 15 px y el peso base a 500, con controles de 16 px.
Se sigue la recomendación de [Apple Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
de evitar pesos demasiado finos; los puntos nativos de iOS no se consideran una
regla universal de píxeles CSS. Se comprueba el texto al 200% en móvil; la tabla
de países puede desplazarse horizontalmente con teclado sin ensanchar la página.
Las capturas EN/ES a 360 y 1366 px están en
[docs/screenshots/personal-goals](docs/screenshots/personal-goals).

Validación de esta ronda: 790 tests unitarios, 54 de seed-kit y 28 de navegador,
sin fallos. Capturas EN/ES a 360 y 1366 px, modo oscuro y texto al 200%;
sin peticiones a otros sitios ni errores de página en esos recorridos.
Lighthouse 13.5.0 móvil, export estático servido localmente: `/es` obtuvo
96 y 99 en dos pasadas (FCP 0,77–1,06 s; LCP 1,97–2,56 s; TBT 41–99 ms;
CLS 0). La petición a `/` de la segunda pasada fue redirigida a `/es`
por el idioma del navegador; no es una medición independiente de EN ni de
Vercel. Estos números no acreditan una carga inferior a un segundo en todos
los dispositivos.
