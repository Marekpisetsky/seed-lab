# Ficha: coste de vida por países

- **App:** Wealth Lens (y Cost Lens, que usa los mismos datos) ·
  **Revisada:** 3 de octubre de 2026
- **Código:** `packages/seed-kit/src/cost-of-living.ts` y
  `packages/seed-kit/src/data/` (`cost-of-living.json`,
  `estimated-countries.json`); `projects/wealth-lens/scripts/estimate-countries.mts`
  (la estimación); en Wealth Lens, `src/lib/calculator.ts`
  (`countryRows`, `dearestCovered`, `featuredRows`, metas de un país) y
  `pricedItems` (meses de vida en un país); `src/lib/wishes.ts` (vivir sin trabajar,
  ver [deseos](deseos.md))

## Pregunta que responde

"¿Dónde me alcanzaría para vivir lo que mi dinero paga al mes?" Es "Alcanza
para vivir en", la tabla de países (sin vivienda y con vivienda, con ✓ y
desde qué año) y las metas de "vivir en un país".

## Fórmula, en palabras sencillas

Cada país tiene un coste al mes para una persona, con y sin alquiler. Un
país "alcanza" cuando lo que el dinero paga al mes (con la tasa de retiro
elegida) llega a ese coste. La app dice desde qué año, o cuántos años
faltan.

Exacta:

- Capital que paga un país: 12 × coste mensual / tasa de retiro (ver
  [tasa de retiro](tasa-de-retiro.md)).
- ✓ si el total al final de los años del plan llega a ese capital; el año
  es el primero en que lo alcanza, según el [crecimiento](crecimiento.md).
- **30 países detallados**: coste sin alquiler de Numbeo (persona sola) +
  alquiler de un piso de un dormitorio fuera del centro según Wise;
  convertidos a euros y redondeados a 10.
- **142 países estimados** (marcados "≈"): los costes de Países Bajos ×
  cuánto más caro o barato es el país (nivel de precios del Banco Mundial
  respecto al de Países Bajos); el alquiler, × ese número al cuadrado,
  porque el alquiler varía más entre países que lo demás:
  - sin alquiler = 1020 € × q; alquiler = 1170 € × q², con q el cociente
    de niveles de precios.
  - El exponente 2 es el redondeo del que mejor se ajusta a los 29 países
    detallados (2,03).

## Supuestos

- Una persona, con el nivel de vida medio que reflejan las fuentes.
- La media de un país vale para todas sus ciudades.
- Los precios de cada país suben al ritmo de los del euro: en euros de
  hoy, el coste de un país no cambia con los años.
- Pagar la vida en otro país con dinero en euros no tiene coste de cambio
  ni impuestos distintos.

## Fuentes (con fecha)

- Numbeo, coste de vida por país sin alquiler, persona sola: septiembre
  de 2026. Solo se publican cifras derivadas y redondeadas.
- Wise, alquiler medio de un piso de un dormitorio fuera del centro:
  septiembre de 2026.
- Banco Mundial, World Development Indicators, PA.NUS.PPPC.RF (nivel de
  precios: factor PPA del PIB / tipo de cambio), referencia ICP 2021
  extrapolada; CC BY 4.0.
- Banco Mundial, FP.CPI.TOTL.ZG (inflación), para dejar fuera los países
  con precios subiendo más del 30 % al año.
- Tipos fijos del 28 de septiembre de 2026: 1,1378 USD y 0,8564 GBP por
  euro.
- Compilado el 29 de septiembre de 2026.

## Validación (tests)

- `packages/seed-kit/test/cost-of-living.test.ts` (5): 172 países (30
  detallados y 142 estimados, una vez cada uno); fuente, fecha y marca de
  estimación en cada cifra; nombre en inglés y español; con vivienda
  siempre más que sin vivienda; un dato mal editado hace fallar la carga
  (el conjunto se valida al cargar: códigos ISO, importes positivos, la
  cesta de Países Bajos en los estimados, tipos de cambio).
- `projects/wealth-lens/src/lib/cost-of-living.test.ts` (11): el conjunto
  y la inflación de referencia de cada país.
- `projects/wealth-lens/src/lib/calculator.test.ts` (tabla de países): 30
  filas ordenadas, ✓ si y solo si el ingreso lo paga, filas destacadas.
- Error de la estimación, medido sobre los países detallados (en el
  propio conjunto): en el caso del medio, 9 % sin vivienda y 15 % con
  vivienda; 1 de cada 10 se desvía un 26 % o un 41 % o más.

## Límites

- Estimaciones, no datos en directo. Las ciudades caras (capitales) cuestan
  bastante más que la media del país.
- "Sin vivienda" no es "gratis vivir": es para quien ya tiene casa.
- Los países estimados heredan la cesta de Países Bajos: un país se
  diferencia de Países Bajos en más cosas que su nivel de precios.

## Lo discutible

1. **Numbeo es colaborativo.** Sus cifras salen de lo que aportan sus
   usuarios, con sesgo hacia ciudades y expatriados. Es la fuente gratuita
   más completa, pero no es estadística oficial. *Coste:* contrastar los
   30 países con Eurostat (HICP/PPP) u OCDE donde existan.
2. **Nivel de precios del PIB, no del consumo.** El cociente PPA/tipo de
   cambio del PIB incluye inversión y gasto público; el de consumo de los
   hogares sería más fiel. *Coste:* cambiar de serie del Banco Mundial y
   volver a medir el error.
3. **Exponente 2 ajustado con 29 puntos.** Es un ajuste pequeño; el error
   con vivienda (1 de cada 10, un 41 % o más) es grande. *Coste:* mostrar
   un rango en los países estimados.
4. **Tipos reales de cambio constantes.** Suponer que los precios de cada
   país suben como los del euro ignora décadas de cambios reales (y ya se
   excluyen los de inflación >30 %). *Coste:* advertirlo en las metas a más
   de 10 años.
5. **El ✓ depende de la tasa de retiro elegida.** Con la tasa más alta
   "alcanzan" más países, aunque sea "muy arriesgado". La tabla ya enseña
   la tasa, pero conviene que la marca lleve la zona. *Coste:* un texto.
6. **Impuestos y sanidad.** Vivir en otro país cambia los impuestos sobre
   el dinero y el coste de la sanidad, que la cesta no recoge.

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-07: los mismos costes con alquiler ponen precio a cuatro deseos
  (un año sin trabajar, un año de universidad, un mes por el Sudeste
  Asiático, vivir sin trabajar): ver
  [deseos](deseos.md). Sin cambios en estos datos.
