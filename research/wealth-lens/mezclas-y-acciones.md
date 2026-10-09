# Ficha: mezclas (y las acciones sueltas, pieza futura)

- **App:** Horalis Crecimiento · **Revisada:** 9 de octubre de 2026 (fase A2)
- **Código** (en `projects/wealth-lens/`): `src/lib/mix.ts` (`mixModel`,
  `mixPercentiles`, `mixSuccessRates`, `worstYear`, `TEMPLATES`),
  `src/lib/volatility.ts` (`logStats`, la oscilación de una serie)

## Pregunta que responde

"¿Y si no lo pongo todo en lo mismo?" Una mezcla de tipos de activo con
pesos (acciones de EE. UU., bonos alemanes, oro y ahorro) y las plantillas
100 %, 80/20 y 60/40.

## Fórmula, en palabras sencillas

- **Cuánto crece** (el número grande): la media de lo que crece cada
  parte, según su peso.
- **Cuánto se mueve** (la franja, "si va mal", la tasa de retiro): 1000
  caminos de 60 años en los que, cada año, se saca **un mismo año real
  para todas las partes**, así que se mueven juntas como lo hicieron (en
  2022 cayeron a la vez acciones y bonos).
- **Pesos en el tiempo**: o se dejan correr (lo que más sube pesa más; las
  aportaciones se reparten por los pesos) o se vuelven a los pesos cada
  año.

"Peor año en los datos": el peor año natural de la mezcla, reequilibrada
cada enero, sobre los años que tienen todas sus partes. Junto a la mezcla,
las mismas cifras de las acciones de EE. UU. solas, sobre los mismos años.

## Supuestos

- Las plantillas son los puntos de partida de los libros de texto, no una
  recomendación; la app nunca propone pesos (ver [Kelly](../educacion/kelly.md)).
- La relación entre activos de 1988 a 2022 (correlación acciones de
  EE. UU.–bonos alemanes, en logaritmos: 0,18) se mantiene.
- Una parte de ahorro rinde su interés menos la inflación, sin
  oscilación.

## Fuentes (con fecha)

- Los datos anuales de 1988–2022 del [crecimiento](crecimiento.md):
  acciones de EE. UU. (Shiller), bonos alemanes (OCDE, Bundesbank,
  Destatis) y oro (Pink Sheet del Banco Mundial).

## Validación (tests)

- `src/lib/mix.test.ts` (21): pesos que suman 100 %; plantillas; el
  crecimiento como media ponderada; 60/40 con menos franja y un peor año
  más suave que 100 % acciones; el mismo año para todas las partes; 2022
  como peor año del 60/40; correr frente a reequilibrar; Cholesky válido;
  una mezcla de un archivo anterior con Mundo o Nasdaq-100 leída como
  acciones de EE. UU.; recalcular en mucho menos de 16 ms.

## Límites

- Solo tipos de activo con una historia pública larga; nunca un fondo, un
  ticker ni una empresa concreta.
- Los cambios de divisa (acciones y oro en dólares) no se modelan: van
  deflactados con la inflación de EE. UU.

## Lo discutible

1. **La proyección de una mezcla reequilibrada se queda corta.** La media
   ponderada de medias geométricas ignora la ganancia de diversificar: con
   los mismos datos, un 60/40 acciones de EE. UU./bonos alemanes crece
   5,51 % en el número grande y 5,87 % de verdad reequilibrado cada año
   (0,36 puntos al año). Las simulaciones sí lo recogen, así que el número
   grande y la mediana de la franja divergen. *Coste:* proyectar con la
   media geométrica de la mezcla simulada.
2. **Correlaciones estables.** En las crisis, las correlaciones suben; el
   sorteo conjunto lo recoge para los años de la muestra (2008, 2022),
   pero no más allá.
3. **Plantillas.** Llamarlas "de libro de texto" es correcto, pero
   mostrarlas como botones puede leerse como sugerencia. Ver [informar, no
   aconsejar](../legal/informar-no-aconsejar.md). *Coste:* revisar textos.
4. **Una sola bolsa.** Las acciones son solo las de EE. UU., la única con
   una serie abierta larga y con dividendos. Una persona de otro país
   tiene sus acciones en otras bolsas. *Coste:* buscar series oficiales
   abiertas de otras bolsas con dividendos (ver abajo).

## Pieza futura: acciones sueltas y carteras

Hasta la fase A2 (9 de octubre de 2026) la app tenía 12 acciones y 3
fondos de una lista, *Mi cartera* (las posiciones de la persona, pesadas
por su valor) y el efecto de concentración (una acción con más del 20 % de
la mezcla). Se quitaron porque dependían de precios diarios de fuentes no
oficiales (Yahoo Finance, Stooq) cuyas condiciones no permiten publicar sus
datos, de una tarea diaria que había que mantener, y de nombres de
productos concretos.

El método queda anotado aquí por si una pieza futura lo recupera con datos
que la persona traiga ella misma (por ejemplo, un archivo de su bróker,
leído solo en su navegador):

- Una acción crece como su índice: su pasado propio nunca se proyecta
  (nadie puede prever una empresa).
- Se mueve como su índice multiplicado por su β, más un movimiento propio,
  menos un "lastre" que deja su crecimiento esperado igual al del índice:
  log(1 + r_acción) = μ_índice + β·(log(1 + r_índice,t) − μ_índice) + ε − lastre,
  con β = ρ·σ_acción / σ_índice y ε ~ Normal(0, σ_acción²·(1 − ρ²)).
- σ_acción de sus cierres diarios (al menos 3 años; si no, 2 × σ_índice) y
  ρ de la correlación semanal con su índice; los ε de varias acciones,
  correlacionados con un factor de Cholesky.
- Concentración: la misma mezcla con su índice en lugar de la acción,
  sobre los mismos sorteos; se dice con las cifras, nunca supuesto.
- Fuentes del modelo: Sharpe (1963), "A Simplified Model for Portfolio
  Analysis", *Management Science* 9(2); el lastre de la volatilidad
  (media geométrica ≈ aritmética − σ²/2).
- Lo discutible que tenía: "sin alfa, sea cual sea β" (la anomalía de baja
  volatilidad), estimaciones frágiles con pocos años, y el umbral del 20 %
  sin justificar con datos.

El código está en el historial de git (rama `master` antes de la fase A2:
`src/lib/mix.ts`, `portfolio.ts`, `volatility.ts`, `mix-stocks.test.ts`).

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-05: la descripción de concentración distingue media esperada
  y caso central. No cambia el cálculo.
- 2026-10-07: un solo umbral de concentración, el 20 %, en el [chequeo de
  tu plan](chequeo.md); se quita el hallazgo del 40 % de *Mi cartera*.
- 2026-10-09 (fase A2): se quitan las acciones sueltas, *Mi cartera* y el
  efecto de concentración (ver "Pieza futura"), y las acciones del mundo y
  el Nasdaq-100 (sus datos no son abiertos). Las plantillas usan acciones
  de EE. UU. en lugar del Mundo; la referencia junto a una mezcla son las
  acciones de EE. UU. solas. No cambia el cálculo de una mezcla de
  activos.
