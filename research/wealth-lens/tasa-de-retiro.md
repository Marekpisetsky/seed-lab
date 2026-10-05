# Ficha: tasa de retiro

- **App:** Wealth Lens · **Revisada:** 3 de octubre de 2026
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
| S&P 500 | 99,6 | 92,9 | 62,1 |
| Mundo | 96,1 | 76,6 | 33,4 |
| Nasdaq-100 | 96,3 | 85,8 | 63,6 |
| Bonos del euro | 99,7 | 74,5 | 1,3 |
| Oro | 91,6 | 44,6 | 4,9 |
| Plan de partida (5 %, oscilación del Mundo) | 97,8 | 79,5 | 36,9 |

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

## Lo discutible

1. **Depende mucho del periodo.** Con 1988–2022, el S&P 500 da 92,9 % al
   4 %; el Mundo, 76,6 %. El *Trinity study* (EE. UU., 1926–1995) da un 95 %
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

- 2026-10-03: primera ficha (sin cambios en el cálculo; dos comentarios
  del código alineados con lo que hace).
