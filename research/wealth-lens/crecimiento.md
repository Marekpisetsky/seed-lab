# Ficha: crecimiento

- **App:** Horalis Crecimiento · **Revisada:** 3 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/finance.ts`
  (`futureValueWithContributions`, `monthlyRate`), `src/lib/calculator.ts`
  (`valueAt`, `resultOf`, `yearlyPath`), `src/lib/investment.ts`
  (`resolveInvestment`), `src/lib/indexes.ts` (medias de los datos)

## Pregunta que responde

"Si tengo X € hoy y añado Y € al mes durante N años, ¿cuánto tendré?" Es el
número grande del resultado, la curva del gráfico, "Lo que pones" y "Lo
que crece".

## Fórmula, en palabras sencillas

Cada año el dinero crece un porcentaje fijo, y lo crecido vuelve a crecer.
Cada aportación entra al final de su mes y crece desde entonces. Todo va
en euros de hoy: el porcentaje es el crecimiento **después de la subida de
precios**, y la aportación sube con los precios.

Exacta: con g el crecimiento anual real, i = (1 + g)^(1/12) − 1 el tipo
mensual equivalente y m = 12·N meses,

  total = X·(1 + g)^N + Y·((1 + i)^m − 1) / i

"Lo que pones" = X + 12·N·Y; "Lo que crece" = total − lo que pones.

De dónde sale g:

| Elección | g | Cómo |
| --- | --- | --- |
| Un índice (S&P 500, Mundo, Nasdaq-100, bonos, oro) | 7,54 %, 4,45 %, 9,90 %, 2,47 %, 1,06 % | Media geométrica de sus rendimientos reales anuales de 1988 a 2022 (los mismos años para todos) |
| Ahorro | (1 + 1,5 %) / (1 + inflación) − 1: −0,49 % con el 2 % del euro | Interés fijo de 1,5 % menos la inflación de "Subida de precios en" |
| Una mezcla o Mi cartera | Media ponderada de las g de sus partes | Ver [mezclas](mezclas-y-acciones.md) |
| Crecimiento propio ("Mi %") | El que se escribe; 5 % al empezar | Ver [valor inicial](valor-inicial.md) |

Un "¿Y si…?" de +1 % o −1 % suma o resta un punto a g. "Una mala primera
década" sustituye los diez primeros años por los de una década real (ver
[década mala](decada-mala.md)); después, g otra vez.

## Supuestos

- El crecimiento es constante: un año típico, todos los años. Los
  altibajos los cuentan aparte los [futuros simulados](futuros-simulados.md).
- g es una media **geométrica**: el crecimiento que, repetido, da lo que
  dieron los datos de punta a punta. Por eso el número grande es un
  resultado "típico" (cercano a la mediana de los futuros, algo por debajo:
  ver el punto 6 de lo discutible), no la media
  aritmética de los resultados, que sería mayor.
- Las aportaciones suben exactamente con la inflación y entran al final de
  cada mes.
- Sin impuestos, sin comisiones de fondos o de compra y venta, sin efecto
  del cambio de divisa (los índices en dólares van deflactados con la
  inflación de EE. UU.).
- Los años de 1988 a 2022 representan lo que puede venir.

## Fuentes (con fecha)

- S&P 500: Robert J. Shiller, Yale, *Online Data* (`ie_data.xls`), datos
  hasta junio de 2023, rendimiento total real de enero a enero.
- MSCI World: fichas de MSCI, rendimiento neto en USD por año natural,
  hasta diciembre de 2024, deflactado con el IPC de EE. UU. (Shiller hasta
  2022, BLS después).
- Nasdaq-100: cierres de fin de año de Nasdaq, **solo precio** (sin
  dividendos, ~1 % al año), hasta diciembre de 2024.
- Bonos del euro: Bund alemán a 10 años con vencimiento constante (OCDE /
  Bundesbank y Destatis), hasta diciembre de 2024.
- Oro: LBMA, precio de fin de año en USD, deflactado con el IPC de EE. UU.,
  hasta diciembre de 2024.
- Datos compilados el 29 de septiembre de 2026 (`src/data/*.json`, campo
  `compiledOn`). Periodo común 1988–2022: el más largo que cubren todos.

## Validación (tests)

- `src/lib/finance.test.ts` (40): casos calculados a mano (1000 € al 7 %
  10 años = 1967,15 €), tipo mensual equivalente, aportaciones, casos
  límite.
- `src/lib/properties.test.ts` (22): propiedades que valen para cualquier
  cifra (las fórmulas se deshacen entre sí; más años o más crecimiento
  nunca dan menos).
- `src/lib/calculator.test.ts` (24): el resultado, el gráfico que acaba en
  el resultado, "lo que pones" y "lo que crece".
- `src/lib/indexes.test.ts` (25): cada rendimiento real recalculado desde
  las cifras de origen, el periodo común, las medias geométricas.
- `src/lib/investment.test.ts` (17): de la elección a g, la inflación y las
  conversiones.
- `src/lib/edge-cases.test.ts`: importes en cero, crecimientos negativos,
  60 años, y el crecimiento en −50 %, 0 %, 70 % y 500 % a 1, 20 y 60 años:
  todo finito, cuentas comprobables (0 %: lo puesto; −50 %: la mitad cada
  año; 70 % y 500 %: 1,7²⁰ y 6²⁰ veces) y ninguna cifra de más de doce
  dígitos seguidos.
- `src/lib/realism.test.ts`: cuándo sale cada aviso, los récords de los
  datos y su redacción en inglés y en español.
- `src/lib/validation.test.ts`: un archivo con crecimiento de −50 % a
  500 % se lee; fuera de ese rango, no.
- `e2e/money.test.mts`: a 360 px, 500 % se acepta y 501 % no, el aviso
  con sus euros y nada cortado ni fuera de la pantalla.

## Límites

- No es una previsión: es lo que pasaría si cada año fuera el año típico
  de los datos.
- 35 años de datos son pocos para estimar una media: el error típico de la
  media del S&P 500 es de unos 2,8 puntos (16,4 % / √35).
- Un inversor en euros no recibe el rendimiento real en dólares: la
  diferencia es el cambio real euro/dólar, que la app no modela.
- La comparación entre activos usa los mismos años, pero esos años no son
  "neutrales": incluyen la gran subida de los noventa y dos crisis
  bursátiles.

## El crecimiento que escribe la persona

La casilla del paso 3 acepta de **−50 % a 500 % al año**, después de la
subida de precios (`GROWTH_LIMITS` en `src/lib/validation.ts`; también al
leer un archivo). Es el número de la persona: la app no lo corrige, pero
dice lo que los datos han visto.

- **500 % es un límite técnico, no un juicio.** Con 500 % durante 60 años
  las cifras llegan a unos 10⁴⁷ €, muy lejos de lo que guarda un número del
  navegador (unos 10³⁰⁸), también en los futuros más altos. Por encima,
  nada se rompería enseguida, pero tampoco tendría sentido mostrarlo.
- **Las cifras enormes** se escriben en palabras desde mil millones, con
  tres cifras ("€1.23 billion", "1230 millones de euros", "4,4 billones de
  euros", como la prensa española), y como potencia de diez desde 10¹⁸
  ("€4.02 × 10¹⁸"), en `packages/seed-kit/src/format.ts`. En el móvil, el
  número grande, las tarjetas y "¿Y si…?" se hacen un tamaño más pequeños o
  pasan a una columna para que nada se corte.
- **Más del mejor tramo de 20 años de los datos** (13 %, S&P 500
  1980–1999): "Muy raro: los mejores 20 años de los datos dieron un 13 %."
- **Más del 50 %** (`strongGrowthWarning` en `src/lib/assumptions.ts`): un
  aviso más fuerte, entero y con euros: "Ningún índice ni gran empresa ha
  mantenido esto: un 70 % de media durante 20 años. A ese ritmo, tus
  1100 € serían 44.706.545 €." Los euros son el dinero de hoy crecido a ese
  ritmo durante los años del plan (1100 × 1,7²⁰), en euros de hoy, para que
  la cuenta se pueda hacer a mano; sin dinero hoy, la aportación mensual.

**Nunca una afirmación que los datos desmientan.** La primera frase se
comprueba con los datos de la app (`keptRecords` en `src/lib/realism.ts`):
la mejor media de cada índice (sus años reales, después de la subida de
precios) y de cada gran empresa de los precios guardados (sus años de
calendario o, si el plan es más largo, su crecimiento desde 2016, antes de
la subida de precios, que lo sobrestima un poco) sobre los años del plan, o
sobre todos sus datos si tiene menos. Si alguna lo superó, el aviso la
nombra: Nvidia subió un 64 % al año de 2016 a 2026, así que con un 60 % a
20 años dice "solo NVDA lo logró, y solo durante 10 años (2016–2026)", y a
3 años "muy pocos lo han logrado, como TSLA (2019–2021)". La frase de la
petición ("Ningún índice ni gran empresa ha mantenido X % de media durante
N años") tiene 13 palabras; se reordenó para cumplir las 12 por frase del
test de lenguaje sencillo, con las mismas palabras.

## Lo discutible

1. **"Media" puede leerse como esperanza.** La app dice "crece a su media";
   la media geométrica (S&P 500: 7,54 %) es menor que la aritmética
   (8,87 %). Mostrar la geométrica es lo prudente y lo que acerca el número
   grande a la mediana, pero la palabra debería ser "típico" o explicar la
   diferencia en *Cómo funciona*. *Coste:* un texto.
2. **Un periodo corto y favorable para EE. UU.** El S&P 500 de 1988–2022
   (7,54 %) supera su propia media de 1928–2022 (6,58 %) y la de 1900–2025
   (6,6 % según UBS 2026). Con el chip "S&P 500", el resultado hereda una
   época especialmente buena. *Coste:* decidir si los activos con historia
   larga usan toda su historia (rompería "los mismos años para todos").
3. **Divisa.** Los índices en dólares van en términos reales de EE. UU.;
   para quien ahorra en euros falta el efecto del cambio (ni cubierto ni
   sin cubrir). *Coste:* una serie EUR/USD y una decisión de método.
4. **Ventanas distintas.** El S&P 500 se mide de enero a enero (datos
   mensuales de Shiller) y los demás de diciembre a diciembre: un mes de
   desfase entre activos que la app compara y mezcla. *Coste:* rehacer la
   serie del S&P 500 por años naturales.
5. **Sin costes.** Un ETF barato cuesta 0,07–0,20 % al año, y los
   impuestos sobre dividendos y plusvalías pueden restar más. La app lo
   dice ("deja fuera impuestos y la mayoría de comisiones"), pero el número
   grande no lo descuenta. *Coste:* un supuesto de comisión visible y
   editable.
6. **Dos modelos para lo mismo.** El número grande usa meses y aportaciones
   al final de cada mes; las simulaciones, años con media aportación al
   principio y media al final. Y la mediana de una suma de aportaciones que
   oscilan es mayor que la suma de sus medianas. Resultado: con 1.100 € y
   100 € al mes durante 20 años al 5 %, el número grande es 43.499 € y la
   mediana de los 1000 futuros, 46.410 € (un 6,7 % más). El número grande
   es el más prudente de los dos, pero la app no lo explica. *Coste:*
   decidir cuál es "el" resultado y unificar el paso.
7. **Mezclas que se reequilibran.** La media ponderada de medias
   geométricas subestima el crecimiento de una mezcla reequilibrada: un
   60/40 Mundo/Bonos crece 3,66 % en la proyección y 4,09 % reequilibrado
   año a año con los mismos datos (ver [mezclas](mezclas-y-acciones.md)).

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-07: "Subida de precios en" en lugar de "Precios de" para el
  país de la inflación. Sin cambios en el cálculo.
- 2026-10-07 (2): el crecimiento del paso 3 va de −50 % a 500 % (antes,
  hasta 50 %), con un aviso más fuerte y en euros por encima del 50 %, y
  las cifras enormes en palabras o potencias de diez. Sin cambios en el
  cálculo.
