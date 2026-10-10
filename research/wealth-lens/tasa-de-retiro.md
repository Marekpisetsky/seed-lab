# Ficha: tasa de retiro

- **App:** Horalis Crecimiento (y Horalis Coste de vida, fase B3) ·
  **Revisada:** 9 de octubre de 2026 (fase A4 del plan Horalis)
- **Motor (A4):** `packages/seed-kit/src/withdrawal-rate.ts` (`maxRate`,
  `safeRate`, `steadyRate`, `withEarlyCrash`) y su test
  `packages/seed-kit/test/withdrawal-rate.test.ts`; en Crecimiento,
  `src/lib/safe-rate.ts` (`safeRateFor`, `planWithdrawalRate`,
  `similarAsset`, `worstFall`) y `src/components/money/pay-details.tsx`;
  la frase de una línea, en `packages/seed-kit/src/words/` (`withdrawal.why`).
- **Código** (en `projects/wealth-lens/`): `src/lib/monte-carlo.ts`
  (`survives`, `successRates`, `yearsLasting`), `src/lib/withdrawal.ts`
  (pasos del deslizador y zonas), `src/lib/success-table.ts` (tasas
  precalculadas), `src/lib/finance.ts` (`monthlyWithdrawal`,
  `requiredCapital`), `src/lib/mix.ts` (`mixSuccessRates`)

## Pregunta que responde

"Cuando termine de ahorrar, ¿cuánto podría sacar al mes, y cuánto
duraría?" Es "Te pagaría al mes", el deslizador del 2 % al 7 %, "duró 30
años en N de cada 100 futuros" y su zona (prudente, arriesgado, muy
arriesgado). La misma tasa decide qué países y metas mensuales "alcanzan".

## La tasa que respaldan los datos (fase A4)

**Pregunta:** «¿Cuánto podría sacar cada año sin que se acabe, según lo que
ya pasó?» Antes, la tasa de partida era un 4 % fijo para todo. Ahora es,
para cada inversión, **la mayor tasa anual, fija después de la subida de
precios, que habría aguantado 30 años empezando en cualquier año de sus
datos, el peor incluido** (el método de Bengen, 1994).

En palabras sencillas: se prueba empezar el retiro en cada año de la
historia (1928, 1929, 1930…). Para cada comienzo se busca la tasa más alta
con la que el dinero llega a pagar los 30 años. La tasa de la inversión es
la más baja de todas esas: la del peor comienzo.

Exacta, para un comienzo con rentabilidades reales r₁…r_N (retiro al
principio de cada año, luego el resto crece):

- dura N retiros de w si `w × (1 + 1/(1+r₁) + 1/((1+r₁)(1+r₂)) + … +
  1/((1+r₁)…(1+r_{N−1}))) ≤ 1`;
- la mayor tasa de ese comienzo es 1 dividido por esa suma (`maxRate`);
  como la suma solo crece, todos los saldos intermedios quedan por encima
  de cero;
- la tasa de la inversión es el mínimo sobre todos los comienzos con N
  años completos (`safeRate`), y se guarda qué año fue el peor y cuántos
  comienzos («periodos») hay detrás.

Cada inversión:

| Inversión | Años de datos | Tasa a 30 años | Peor comienzo | Periodos |
| --- | --- | --- | --- | --- |
| Acciones de EE. UU. (Shiller) | 1928–2022 | 3,78 % | 1929 | 66 |
| Bonos alemanes | 1988–2024 | 5,56 % | 1994 | 8 (pocos) |
| Oro (Banco Mundial) | 1988–2024 | 2,22 % | 1988 | 8 (pocos) |
| Mezcla 60/40 acciones y bonos, al peso cada año | 1988–2022 | 7,58 % | 1990 | 6 (pocos) |
| Cuenta de ahorro (1,5 % − 2 % de inflación) | crece igual cada año | 3,10 % | — | — |

- **Se usan todos los años de cada activo**, no solo los comunes
  (1988–2022): para buscar el peor comienzo, más años solo pueden
  encontrar uno peor. Por eso las acciones de EE. UU. incluyen 1929 y
  1966.
- **Pocos periodos.** Con menos de 10 comienzos (`FEW_PERIODS`), o si los
  datos tienen menos años de los pedidos (entonces se usan todos sus años:
  un solo periodo), la página dice «Pocos periodos: tómalo como una guía
  aproximada» (y, si hace falta, «Los datos solo tienen N años, no 30»).
  Los bonos y la mezcla 60/40 salen altos precisamente por eso: sus datos
  solo cubren un periodo de tipos de interés bajando.
- **Una mezcla** usa los años que tienen todas sus partes, al peso de cada
  parte cada año (aunque el plan deje derivar los pesos: es una
  aproximación).
- **Ahorro, o crecimiento sin altibajos:** crece igual cada año, así que
  hay una sola respuesta (`steadyRate`).
- **«Mi %» (crecimiento propio):** no tiene historia. La tasa la elige la
  persona; la de partida es la del activo más parecido (el de oscilación
  más cercana; empate: el de crecimiento más cercano). La página muestra
  qué pasaría con **una caída como el peor año de ese activo al
  empezar** y luego su propio crecimiento cada año (`withEarlyCrash`):
  «Primero, una caída como el peor año de las acciones de EE. UU. (−38 %,
  1931): un 5 %, … € al mes, se acaba a los 17 años» (con un 5 % de
  crecimiento propio).
- **Debajo, siempre, la frase de una línea** (reutilizable por cualquier
  herramienta): «Más rentabilidad suele traer caídas más fuertes. Una
  caída al principio del retiro obliga a vender barato. Por eso la tasa
  segura no sube igual.» (La del encargo, partida en tres frases cortas
  por la regla de 12 palabras.)
- **La tasa del plan:** `withdrawalRate: null` significa «la de los
  datos», y sigue a la inversión si cambia. El deslizador ofrece del 2 %
  al 7 % cada 0,5 % más la tasa de los datos, esté donde esté; cualquier
  otro paso es elección de la persona («Elegiste un 5 %» y «Usar la tasa
  de los datos»). Un «¿Y si…?» cambia la vista, no la tasa de los datos.
- **Archivos:** versión 13. Antes, todo plan empezaba en 4 %, que no se
  distingue de una elección: un 4 % de un archivo anterior pasa a la tasa
  de los datos; cualquier otra tasa se conserva.

### Casos límite (tests)

- Sin crecimiento: 1 ÷ años (25 años → 4 %); un solo año → 100 %.
- Crecimiento fijo: la renta prepagable exacta.
- La tasa hallada aguanta jugando año a año, y un 0,1 % más ya no.
- La misma serie con la caída al principio da menos que con la caída al
  final.
- Todo perdido antes del final → 0; perdido en el último año → los
  retiros anteriores sí se pagaron.
- Datos más cortos que el plazo → se usan todos, un periodo, y lo dice.
- 6 periodos → «pocos»; 10 → no.
- Más años → tasa más baja.
- Entradas rotas (sin años, huecos, años no enteros) → error.
- Caída al empezar: aguanta con una tasa baja; se acaba antes que sin
  caída; tras acabarse no paga más.

### Fuentes

- Bengen, W. P. (1994), "Determining Withdrawal Rates Using Historical
  Data", *Journal of Financial Planning* 7(4): la mayor tasa fija real que
  aguantó 30 años desde cada comienzo de 1926–1976 en EE. UU., unos 4 %
  (el peor, 1966). Con los datos de Shiller hasta 2022 sale 3,78 % (el
  peor, 1929, que Bengen no tenía en su muestra de comienzos).
- Cooley, Hubbard y Walz (1998), "Retirement Savings: Choosing a Withdrawal
  Rate That Is Sustainable", *AAII Journal* 20(2) (*Trinity study*):
  periodos solapados de EE. UU. 1926–1995; con 50 % o más en acciones, el
  4 % aguantó 30 años en el 95 % o más de los periodos.
- Pfau (2010), fuera de EE. UU.: el 4 % falló a menudo. Por eso la tasa
  sale de los datos de cada activo y nunca de una regla fija.

## Fórmula, en palabras sencillas

Cada año sacas el mismo dinero (en euros de hoy): un porcentaje de lo que
tenías al empezar. Al mes, la doceava parte. Para saber si dura, se
prueban 5000 secuencias de 30 años sacadas al azar de los años reales: si
en una de ellas el dinero se acaba antes de terminar, esa cuenta como
fallo.

Exacta:

- Al mes: total × tasa / 12, con el total al final de los años del plan.
- Capital que paga un gasto mensual G: 12·G / tasa.
- Prueba de una secuencia: saldo = 1; cada año, saldo ← saldo − tasa (al
  principio del año); si saldo ≤ 0, falla; si no, saldo ← saldo·(1 + r).
  Dura si llega con dinero tras el último retiro.
- 5000 secuencias de 30 años, *bootstrap* i.i.d. de los años reales del
  activo (semilla 20260929). Una mezcla, con su sorteo conjunto (1000
  caminos). Sin oscilaciones (ahorro, o lo propio con oscilación 0): dura
  o no dura, y la app dice cuándo se acaba.
- Zonas: **prudente** si duró en 90 o más de cada 100; **arriesgado** si en
  75 o más; **muy arriesgado** por debajo.

Lo que dan los datos (duró 30 años en N de cada 100, según la tasa):

| Activo | 2 % | 4 % | 7 % |
| --- | --- | --- | --- |
| Acciones de EE. UU. (S&P 500) | 99,6 | 92,9 | 62,1 |
| Bonos alemanes | 99,7 | 74,5 | 1,3 |
| Oro | 91,5 | 44,3 | 4,9 |
| Plan de partida (5 %, oscilación de las acciones de EE. UU.) | 98,6 | 81,8 | 36,2 |

Con el plan de partida, el 4 % cae en "arriesgado".

## Supuestos

- Retiros fijos en términos reales, sin ajustar nunca a cómo va el
  mercado.
- 30 años de retiro, empiece cuando empiece.
- Todo el dinero sigue invertido en lo mismo que durante el ahorro.
- Sin impuestos ni comisiones.
- Cada año es independiente (como en los [futuros
  simulados](futuros-simulados.md)).

## Fuentes (con fecha)

- Los datos anuales de 1988 a 2022 del [crecimiento](crecimiento.md).
- La "regla del 4 %": Bengen, W. P. (1994), "Determining Withdrawal Rates
  Using Historical Data", *Journal of Financial Planning* 7(4); Cooley,
  Hubbard y Walz (1998), "Retirement Savings: Choosing a Withdrawal Rate
  That Is Sustainable", *AAII Journal* 20(2) (*Trinity study*).
- Fuera de EE. UU.: Pfau, W. D. (2010), "An International Perspective on
  Safe Withdrawal Rates: The Demise of the 4 Percent Rule?", *Journal of
  Financial Planning* 23(12).
- Retiros flexibles: Guyton y Klinger (2006), "Decision Rules and Maximum
  Initial Withdrawal Rates", *Journal of Financial Planning* 19(3).

## Validación (tests)

- `src/lib/monte-carlo.test.ts` (17): 100 % de éxito con un 7 % fijo y
  retiros del 4 %; 0 % con retiros del 15 %; alto pero no seguro al 4 % con
  la historia; baja al subir la tasa; reproducible; varias tasas a la vez
  dan lo mismo que una a una; años que dura sin oscilaciones (1 ÷ tasa sin
  crecimiento).
- `src/lib/success-table.test.ts` (2): recalcula las 66 tasas
  precalculadas y falla si los datos cambian.
- `src/lib/withdrawal.test.ts` (3): los 11 pasos del deslizador, el
  ajuste de una tasa cualquiera a un paso y las tres zonas.
- `src/lib/calculator.test.ts`: lo que paga al mes y los países que
  alcanza.
- `e2e/money.test.mts` y `e2e/colours.test.mts`: el deslizador, sus zonas
  con icono y palabra, y que se distinguen con daltonismo.

## Límites

- Dice cuántas veces duró en el modelo, no la probabilidad de que dure.
- No dice cuánto queda: un camino que acaba con 1 € y otro con el doble de
  lo inicial cuentan igual.
- Para quien deja de trabajar joven, 30 años pueden ser pocos.

## Lo discutible (A4)

1. **Dos respuestas distintas a dos preguntas.** La tasa de los datos
   mira los comienzos reales (1928–2022 para las acciones); la zona
   (prudente, arriesgado) mira 5000 futuros con los años de 1988–2022 en
   orden al azar. Con las acciones de EE. UU. coinciden (3,78 %: duró
   desde cualquier año real y dura en 94 de cada 100 futuros,
   «prudente»). Con pocos periodos no: los bonos a 5,56 % duran en 20 de
   cada 100 futuros y la mezcla 60/40 a 7,58 % en 35 («muy arriesgado»).
   Las dos son ciertas; la página las muestra juntas.
2. **Pocos periodos dan tasas altas.** Bonos (5,56 %) y la mezcla 60/40
   (7,58 %) salen de 6–8 comienzos en años de tipos bajando. La página
   dice «guía aproximada» y la zona suele decir «muy arriesgado». Otra
   opción sería no dar nunca más que la tasa de las acciones con historia
   larga; no se hace porque mezclaría activos. *Coste:* poco.
3. **30 años para todos.** Se mantiene el plazo de Bengen y Trinity; B2
   explica el valor junto al resultado.

## Lo discutible

1. **Depende mucho del periodo.** Con 1988–2022, el S&P 500 da 92,9 % al
   4 %; las acciones del mundo (MSCI World, retiradas en la fase A2) daban
   76,6 %. El *Trinity study* (EE. UU., 1926–1995) da un 95 %
   o más para 30 años al 4 % con la mitad o más en acciones; Pfau (2010) muestra que fuera
   de EE. UU. el 4 % falló a menudo. Las cifras de la app son coherentes
   con eso, pero muy sensibles al activo y a los años. *Coste:* va con la
   decisión de periodo del [crecimiento](crecimiento.md).
2. **30 años fijos.** Un retiro a los 45 puede durar 45 años. *Coste:* un
   control de duración y precalcular más tablas.
3. **Éxito binario.** No distingue fallar en el año 10 o en el 29, ni
   cuánto sobra. *Coste:* mostrar también lo que queda en el caso típico y
   en el malo.
4. **Retiros rígidos.** Quien recorta en los años malos (reglas de
   Guyton–Klinger) puede empezar con más. La app no lo modela. *Coste:* una
   variante "flexible", con su ficha.
5. **"Prudente", "arriesgado".** Son etiquetas de los datos (90 y 75 de
   cada 100, umbrales convencionales, no estándar), pero suenan a juicio
   sobre la persona. Ver [informar, no aconsejar](../legal/informar-no-aconsejar.md):
   la frase siempre debe ir con su dato ("duró en 79 de cada 100").
   *Coste:* revisar la redacción con la ficha legal.
6. **El retiro empieza con el total del final.** El riesgo de secuencia
   justo al jubilarse (una caída el primer año) está en la prueba de 30
   años, pero "Te pagaría al mes" se calcula sobre el total típico, no
   sobre el malo. *Coste:* mostrar el pago con "si va mal".
7. **Comentarios desfasados en el código** (corregidos en este cambio,
   sin tocar el cálculo): `monte-carlo.ts` decía "100 % acciones" (es el
   activo del plan) y `simulation.ts` hablaba de las tasas 3, 4 y 5 %
   precalculadas (son 11, del 2 % al 7 %).

## Historial

- 2026-10-09 (fase A4): **la tasa de partida deja de ser un 4 % fijo**:
  es la que respaldan los datos de cada inversión (ver arriba), con el
  peor comienzo, los periodos y la advertencia si son pocos; «Mi %» muestra
  una caída como la del activo más parecido. Archivo de datos versión 13.

- 2026-10-03: primera ficha (sin cambios en el cálculo; dos comentarios
  del código alineados con lo que hace).
- 2026-10-09 (fase A2): sin las acciones del mundo ni el Nasdaq-100 (sus
  datos no son abiertos). El plan de partida se mueve ahora con la
  oscilación de las acciones de EE. UU. (16,4 % en lugar de 17,8 %): al
  4 % dura en 81,8 de cada 100 (antes 79,5), sigue en "arriesgado". El oro
  sale de la Pink Sheet del Banco Mundial (medias de diciembre): 44,3 al
  4 % (antes 44,6). La tabla precalculada se recalculó
  (`src/lib/success-table.ts`, test `success-table.test.ts`).
