# Ficha educativa: por qué no simplemente maximizar el crecimiento (Kelly)

- **Para:** todas las apps de Horalis · **Revisada:** 3 de octubre de 2026
- **Tipo:** educativa. No describe un cálculo de ninguna app: explica por
  qué ninguna app de Horalis propone pesos ni "la mezcla que más crece".

## Qué dice el criterio de Kelly

John L. Kelly (1956) buscó cuánto apostar, de lo que tienes, para que tu
dinero crezca lo más rápido posible **a largo plazo**. Su respuesta: la
fracción que maximiza el crecimiento medio del logaritmo de la riqueza.
Apostar menos crece más despacio; apostar más, también, y además con
caídas mucho mayores. Apostar el doble de esa fracción deja el crecimiento
a cero (más exactamente, al del activo sin riesgo).

Para invertir, con un activo que rinde con media μ y oscilación σ y un
activo sin riesgo que rinde r (todo en tasas continuas), la versión de
Merton (1969) da:

  fracción de Kelly f* = (μ − r) / σ²

  crecimiento con una fracción f: G(f) = r + f·(μ − r) − f²·σ²/2

  crecimiento máximo: G(f*) = r + (μ − r)² / (2σ²)

Aquí μ = log(1 + g) + σ²/2, con g el crecimiento típico (el que usa
Horalis Crecimiento).

## Qué saldría con nuestros supuestos

Supuestos de Horalis Crecimiento (ver las fichas de [crecimiento](../wealth-lens/crecimiento.md)
y [valor inicial](../wealth-lens/valor-inicial.md)); el activo sin riesgo es la
cuenta de ahorro (1,5 % menos un 2 % de inflación: −0,49 % real) o, si
hay que pedir prestado, un préstamo al 2 % real (unos 4 % antes de
inflación):

| Activo | Tipo sin riesgo | f* | Crece al 100 % | Crece con f* | Con f*/2 | Con 2·f* |
| --- | --- | --- | --- | --- | --- | --- |
| Plan de partida (5 %, σ 17,82 %) | ahorro −0,49 % | **2,19** | 5,00 % | 7,39 % | 5,36 % | −0,49 % |
| Plan de partida | préstamo 2 % | **1,41** | 5,00 % | 5,28 % | 4,45 % | 2,00 % |
| Mundo 1988–2022 (4,45 %, σ 17,82 %) | ahorro | **2,03** | 4,45 % | 6,21 % | 4,49 % | −0,49 % |
| Mundo 1988–2022 | préstamo 2 % | **1,25** | 4,45 % | 4,55 % | 3,91 % | 2,00 % |
| S&P 500 1988–2022 (7,54 %, σ 16,39 %) | ahorro | **3,39** | 7,54 % | 16,11 % | 11,72 % | −0,49 % |
| S&P 500 1988–2022 | préstamo 2 % | **2,47** | 7,54 % | 10,70 % | 8,46 % | 2,00 % |

(Crecimientos anuales reales, como tasas efectivas.)

**Kelly pide apalancamiento.** Con nuestros datos, la fracción "óptima"
es poner entre 1,25 y 3,4 veces tu dinero en acciones, pidiendo prestado
el resto. Es lo que ocurre siempre que la prima de las acciones es grande
frente a su varianza.

## Por qué los profesionales usan fracciones prudentes, o no lo usan

1. **No conocemos μ.** Con 35 años de datos, el error típico de la media
   es σ/√35 ≈ 3 puntos al año, y f* hereda ese error dividido por σ²: ±0,95
   (una desviación típica). Con 125 años, ±0,5. Es decir: f* = 2,19 podría
   ser 0,3 o 4. Y pasarse es mucho peor que quedarse corto: con 2·f* el
   crecimiento cae al del activo sin riesgo, y más allá, a pérdidas.
2. **Las caídas son enormes.** Con Kelly completo, la probabilidad de que
   tu dinero baje alguna vez a la mitad es del 50 %; con medio Kelly, del
   12,5 % (con una fracción c de Kelly, la probabilidad de caer alguna vez
   a una fracción x de lo inicial, frente a lo que daría el activo sin
   riesgo, es x^(2/c − 1)). Con f* = 2,19, un año como 2008 en el
   Mundo (−40,8 %) se lleva un 89 % del dinero.
3. **El modelo no es el mundo.** Kelly supone rendimientos lognormales,
   reequilibrio continuo y préstamos ilimitados al tipo sin riesgo. En la
   realidad hay colas gruesas, saltos, llamadas de margen que obligan a
   vender en el peor momento, costes de préstamo e impuestos.
4. **No todo el mundo quiere maximizar el logaritmo.** Kelly es lo óptimo
   para quien tiene aversión al riesgo logarítmica y un horizonte
   infinito. Samuelson (1979) lo criticó para horizontes finitos; quien
   necesita el dinero en una fecha, o no soporta perder la mitad, prefiere
   menos.
5. **Por eso**, quienes lo usan (Thorp, por ejemplo) apuestan **una
   fracción** de Kelly (la mitad o menos), que pierde poco crecimiento y
   reduce mucho las caídas: con medio Kelly, del 7,39 % al 5,36 % en el
   plan de partida, y la probabilidad de caer a la mitad, del 50 % al
   12,5 %. Muchos gestores no lo usan en absoluto y trabajan con
   presupuestos de riesgo, pasivos y horizontes concretos.

## Por qué Horalis no recomienda pesos

- **Sería asesoramiento.** Proponer a una persona cuánto poner en qué,
  según sus cifras, se acerca a una recomendación personalizada, que en la
  UE está reservada a empresas autorizadas (ver [informar, no
  aconsejar](../legal/informar-no-aconsejar.md)).
- **Nuestros parámetros no dan para tanto.** Como muestra la tabla, un
  "óptimo" calculado con 35 años de datos es casi ruido, y el mismo
  método que lo produce pide endeudarse.
- **Lo que sí hacemos:** enseñar consecuencias con datos. Una mezcla
  muestra cuánto podría crecer, cuánto se movió y su peor año; el "¿Y
  si…?" enseña el efecto de cambiar algo; las plantillas (100 %, 80/20,
  60/40) son puntos de partida de los libros de texto, nunca "la mejor
  para ti". La decisión es siempre de quien usa la app.

## Fuentes

- Kelly, J. L. (1956), "A New Interpretation of Information Rate", *Bell
  System Technical Journal* 35(4): 917–926.
- Merton, R. C. (1969), "Lifetime Portfolio Selection under Uncertainty:
  The Continuous-Time Case", *Review of Economics and Statistics* 51(3).
- Samuelson, P. A. (1979), "Why We Should Not Make Mean Log of Wealth Big
  Though Years to Act Are Long", *Journal of Banking & Finance* 3(4).
- Thorp, E. O. (2006), "The Kelly Criterion in Blackjack, Sports Betting
  and the Stock Market", en *Handbook of Asset and Liability Management*,
  vol. 1, Elsevier.
- MacLean, L. C., Thorp, E. O. y Ziemba, W. T. (2010), "Long-term capital
  growth: the good and bad properties of the Kelly and fractional Kelly
  capital growth criteria", *Quantitative Finance* 10(7): 681–687
  (doi:10.1080/14697688.2010.506108); y (eds., 2011) *The Kelly Capital
  Growth Investment Criterion: Theory and Practice*, World Scientific.
- Los datos y supuestos, de las fichas de Horalis Crecimiento (3 de octubre de
  2026).

## Validación

No hay un cálculo de app que validar. Las cifras de la tabla salen de las
fórmulas de arriba con las medias y oscilaciones de
`projects/wealth-lens/src/data/` (periodo 1988–2022) y el plan de partida;
cualquiera puede rehacerlas con una calculadora.

## Historial

- 2026-10-03: primera ficha.
- 2026-10-08: título y revista correctos del artículo de MacLean, Thorp y
  Ziemba (2010); "Good and bad properties of the Kelly criterion" es el
  título del capítulo del libro de 2011.
