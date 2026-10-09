# Ficha: mezclas y volatilidad de acciones

- **App:** Horalis Crecimiento · **Revisada:** 3 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/mix.ts` (`mixModel`,
  `mixPercentiles`, `mixSuccessRates`, `worstYear`, `concentration`,
  `TEMPLATES`, `CONCENTRATION_LIMIT`), `src/lib/volatility.ts`
  (`stockVolatility`, `MIN_DATA_YEARS`, `FALLBACK_FACTOR`),
  `src/lib/portfolio.ts` (de las posiciones a los pesos),
  `scripts/lib/stats.mts` (oscilación y correlación desde los precios)

## Pregunta que responde

"¿Y si no lo pongo todo en lo mismo?" Una mezcla de activos con pesos
(acciones, bonos, oro, ahorro y acciones de la lista), las plantillas
100 %, 80/20 y 60/40, y *Mi cartera*, que pesa cada posición por su valor.
Y, dentro de ellas, "¿qué añade una sola empresa?": el efecto de
concentración.

## Fórmula, en palabras sencillas

- **Cuánto crece** (el número grande): la media de lo que crece cada
  parte, según su peso. Una acción crece como su índice: su pasado propio
  nunca se proyecta.
- **Cuánto se mueve** (la franja, "si va mal", la tasa de retiro): 1000
  caminos de 60 años en los que, cada año, se saca **un mismo año real
  para todas las partes**, así que se mueven juntas como lo hicieron (en
  2022 cayeron a la vez acciones y bonos).
- **Una acción** se mueve como su índice multiplicado por su β, más un
  movimiento propio, menos un pequeño "lastre" que deja su crecimiento
  esperado igual al del índice.
- **Pesos en el tiempo**: o se dejan correr (lo que más sube pesa más; las
  aportaciones se reparten por los pesos) o se vuelven a los pesos cada
  año.
- **Concentración**: si una acción pesa más del 20 % de la mezcla, se
  compara con la misma mezcla poniendo su índice en su lugar, sobre los
  mismos sorteos. La media esperada se iguala al índice; los altibajos
  mayores pueden reducir tanto el caso del medio como los malos. El texto
  de la app describe la comparación calculada, sin prometer su dirección.

Exacta (una acción, en logaritmos, cada año sorteado t):

  log(1 + r_acción) = μ_índice + β·(log(1 + r_índice,t) − μ_índice) + ε − lastre

con β = ρ·σ_acción / σ_índice, ε ~ Normal(0, σ_acción²·(1 − ρ²)) y el
lastre elegido para que la media de (1 + r_acción) sea la del índice en
los años sorteados. σ_acción sale de los cierres diarios (al menos 3 años;
si no, 2 × σ_índice) y ρ de la correlación semanal con el ETF de su
índice (si no hay datos, la mediana de las acciones que sí tienen; si no
hay ninguna, 0,6). Los ε de varias acciones se correlacionan para que dos
acciones se muevan juntas tanto como lo hicieron sus rendimientos
semanales (factor de Cholesky).

"Peor año en los datos": el peor año natural de la mezcla, reequilibrada
cada enero, sobre los años que tienen todas sus partes.

## Supuestos

- Las plantillas son los puntos de partida de los libros de texto, no una
  recomendación; la app nunca propone pesos (ver [Kelly](../educacion/kelly.md)).
- Ninguna acción tiene ventaja esperada sobre su índice (sin *alfa*), sea
  cual sea su β.
- La relación entre activos de 1988 a 2022 (correlación Mundo–Bonos del
  euro: 0,10) se mantiene.
- Una parte de ahorro rinde su interés menos la inflación, sin
  oscilación.

## Fuentes (con fecha)

- Activos: los datos anuales de 1988–2022 del [crecimiento](crecimiento.md).
- Acciones: cierres diarios descargados una vez al día por el sitio (Yahoo
  Finance; Stooq si falla), de los que se publican solo cifras derivadas;
  la oscilación y la correlación se calculan en `scripts/lib/stats.mts`.
- Modelo de un índice: Sharpe (1963), "A Simplified Model for Portfolio
  Analysis", *Management Science* 9(2).
- El "lastre" de la volatilidad (*volatility drag*): la media geométrica ≈
  la aritmética − σ²/2.

## Validación (tests)

- `src/lib/mix.test.ts` (24): pesos que suman 100 %; plantillas; el
  crecimiento como media ponderada; 60/40 con menos franja y un peor año
  más suave que 100 % acciones; el mismo año para todas las partes; 2022
  como peor año del 60/40; correr frente a reequilibrar; Cholesky válido;
  recalcular en mucho menos de 16 ms.
- `src/lib/mix-stocks.test.ts` (15): una acción proyecta igual que su
  índice; en las simulaciones tiene el crecimiento esperado de su índice y
  más oscilación; el efecto de concentración aparece por encima de 1/5 y
  no por debajo; NVIDIA empeora los casos malos; se dice con las cifras,
  nunca supuesto.
- `src/lib/volatility.test.ts` (5) y `scripts/lib/stats.test.mts`: la
  oscilación de una acción y el respaldo con pocos datos.

## Límites

- Una acción no se proyecta sola: nadie puede prever una empresa.
- La correlación y la oscilación de una acción salen de pocos años de
  precios diarios (y semanales), que cambian mucho de un periodo a otro.
- Los cambios de divisa de las acciones fuera del euro no se modelan
  (solo cuentan las posiciones en euros).

## Lo discutible

1. **La proyección de una mezcla reequilibrada se queda corta.** La media
   ponderada de medias geométricas ignora la ganancia de diversificar: con
   los mismos datos, un 60/40 Mundo/Bonos crece 3,66 % en el número grande
   y 4,09 % de verdad reequilibrado cada año (0,43 puntos al año; en 30
   años, ~13 % más dinero). Las simulaciones sí lo recogen, así que el
   número grande y la mediana de la franja divergen. *Coste:* proyectar con
   la media geométrica de la mezcla simulada.
2. **"Sin alfa, sea cual sea β."** Según el CAPM, una acción de β alto
   debería esperar más que su índice; empíricamente, las de β bajo han
   rendido igual o más (anomalía de baja volatilidad). Dar a todas la media
   del índice es una postura neutral y prudente, pero es una postura.
   *Coste:* una frase en *Cómo funciona*.
3. **Estimaciones frágiles.** σ con 3 años de cierres diarios y ρ con
   rendimientos semanales: ruido grande, y el respaldo (2 × el índice, ρ =
   0,6) es un número de criterio. *Coste:* intervalos o más años de datos.
4. **Dos umbrales de concentración** (resuelto el 7 de octubre de 2026).
   El efecto de concentración en una mezcla aparecía por encima del 20 %
   y el hallazgo de *Mi cartera* (`findings.ts`), por encima del 40 %.
   Ahora hay uno: el 20 %, en el [chequeo de tu plan](chequeo.md), para la
   mezcla y para *Mi cartera*; el hallazgo del 40 % ya no existe. Queda
   por justificar el 20 % con datos (ver el chequeo, punto 2 de lo
   discutible).
5. **Correlaciones estables.** En las crisis, las correlaciones suben; el
   sorteo conjunto lo recoge para los años de la muestra (2008, 2022),
   pero no más allá.
6. **Plantillas.** Llamarlas "de libro de texto" es correcto, pero
   mostrarlas como botones puede leerse como sugerencia. Ver [informar, no
   aconsejar](../legal/informar-no-aconsejar.md). *Coste:* revisar textos.

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-05: la descripción de concentración distingue media esperada
  y caso central, según el modelo y sus tests actuales. No cambia el cálculo.
- 2026-10-07: un solo umbral de concentración, el 20 %, en el [chequeo de
  tu plan](chequeo.md); se quita el hallazgo del 40 % de *Mi cartera*. Sin
  cambios en los cálculos de las mezclas.
