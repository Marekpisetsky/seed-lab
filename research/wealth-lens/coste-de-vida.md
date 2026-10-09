# Ficha: coste de vida por países

- **App:** Horalis Crecimiento y Horalis Coste de vida (los mismos datos) ·
  **Revisada:** 9 de octubre de 2026 (fase A2 del plan Horalis)
- **Código:** `packages/seed-kit/src/official/living-costs.ts` (el método,
  en el build), `packages/seed-kit/scripts/living-costs.ts` (escribe la
  tabla), `packages/seed-kit/src/data/living-costs.json` (la tabla que leen
  las páginas) y `packages/seed-kit/src/cost-of-living.ts` (su lectura); en
  Horalis Crecimiento, `src/lib/calculator.ts` (`countryRows`,
  `dearestCovered`, `featuredRows`, metas de un país); en Horalis Coste de
  vida, `projects/cost-lens/src/calc.ts`.
- **Datos:** las series oficiales del módulo A1
  ([datos oficiales](../datos-oficiales.md)).

## Pregunta que responde

"¿Cuánto necesita al mes una persona para vivir en un país?" En Horalis
Crecimiento es "Alcanza para vivir en", la tabla de países (con ✓ y desde
qué año) y las metas de "vivir en un país". En Horalis Coste de vida, lo
que vale una cantidad de un país en otro.

## Fórmula, en palabras sencillas

Las encuestas de hogares del Banco Mundial dicen con cuánto vive al día
una persona media de cada país, en dólares internacionales de 2021. Se
llevan a los precios del último año con la inflación de EE. UU., se pasan
a los dólares que compran lo mismo allí con el nivel de precios del país,
se multiplican por los días de un mes y se pasan a euros al tipo oficial
de ese año.

Exacta, para un país:

- `m` = media de consumo o ingreso por persona y día de su última encuesta
  (SI.SPR.PCAP), en dólares PPA de 2021.
- `t` = el último año con nivel de precios del país; `q` = ese nivel de
  precios (PA.NUS.PPPC.RF: PPA del PIB / tipo de cambio de mercado; EE. UU.
  = 1).
- `U(t)` = ∏ (1 + inflación de EE. UU. del año k), de 2022 a `t`
  (FP.CPI.TOTL.ZG de EE. UU.).
- Coste al mes en dólares de `t` = `m × U(t) × q × 365,25 / 12`.
- En euros = dólares × euros por dólar en `t` (PA.NUS.FCRF de Alemania, el
  mismo para toda la zona euro), redondeado a 10 €, o a 1 € por debajo de
  100 € (`roundEuros`; nunca menos de 1 €): con pasos de 10 €, los países
  más pobres (20–40 € al mes) daban razones demasiado gruesas.

En Horalis Crecimiento, un país "alcanza" cuando lo que el dinero paga al
mes llega a ese coste:

- Capital que lo paga: 12 × coste mensual / tasa de retiro (ver
  [tasa de retiro](tasa-de-retiro.md)).
- ✓ si el total al final de los años del plan llega a ese capital; el año
  es el primero en que lo alcanza, según el [crecimiento](crecimiento.md).

Un país sin encuesta o sin nivel de precios no aparece. No se inventa
ninguna cifra.

## Supuestos

- La media de la encuesta describe a "una persona media". Incluye la
  vivienda (alquiler o lo que se gasta en ella), porque es todo su consumo
  o ingreso.
- El nivel de vida real no cambia desde la encuesta hasta `t`: solo se
  ajustan los precios.
- Un dólar internacional de 2021 sube con la inflación de EE. UU. (es la
  definición de la PPA: un dólar a precios de EE. UU.).
- El nivel de precios del PIB representa los precios del consumo.
- En euros de hoy, el coste de un país no cambia con los años (los precios
  de cada país suben al ritmo de su moneda).

## Fuentes (con fecha)

Todas del Banco Mundial, licencia CC BY 4.0, comprobada en los metadatos
de cada indicador (ver [datos oficiales](../datos-oficiales.md)):

- SI.SPR.PCAP, Poverty and Inequality Platform: media de consumo o ingreso
  por persona y día, dólares PPA de 2021; encuestas de 2010 a 2025 (cada
  país, la última).
- PA.NUS.PPPC.RF, nivel de precios (PCI 2021, extrapolado por el Banco
  Mundial): 2024.
- FP.CPI.TOTL.ZG, inflación de EE. UU.: 2022 a 2024.
- PA.NUS.FCRF, tipo de cambio oficial, media del año: 2024.
- Descarga: 9 de octubre de 2026, **provisional**, desde el espejo público
  del Banco Mundial en GitHub (actualización del 1 de julio de 2026). La
  descarga anual de A1 la sustituye por la oficial.

Resultado hoy: 122 países, precios de 2024. Ejemplos: Perú 210 €, España
1090 €, Países Bajos 1950 €, Suiza 3070 €, EE. UU. 3110 € al mes.

## Validación (tests)

- `packages/seed-kit/test/cost-of-living.test.ts`:
  - la tabla que leen las páginas es igual a lo que dan los datos
    oficiales (si no, `npm run living-costs`);
  - están todos los países con encuesta y nivel de precios, una vez cada
    uno, y ninguno más;
  - un país calculado a mano, paso a paso;
  - cifras con sentido: más caro en países ricos, más barato en pobres;
  - fuente y año en cada cifra; nombre en cada idioma;
  - un país sin datos queda fuera.
- `projects/wealth-lens/src/lib/calculator.test.ts` (tabla de países):
  orden, ✓ si y solo si el ingreso lo paga, filas destacadas, Perú a 210 €.
- `projects/cost-lens/test/calc.test.ts`: la equivalencia entre dos
  países, ida y vuelta, y los cinco países donde rinde más y menos.

## Límites

- Una media nacional: las ciudades caras cuestan bastante más.
- Cada país tiene su año de encuesta (de 2010 a 2025). Una encuesta vieja
  no recoge lo que la vida mejoró después.
- Unos países miden el consumo y otros el ingreso; el ingreso suele ser
  algo mayor.
- Es una media, no la mediana: la suben los que más tienen.
- Faltan países sin encuesta reciente en la plataforma (India, entre
  otros) o sin nivel de precios. Antes salían estimados; ahora no salen.
- No incluye impuestos ni el coste de la sanidad de quien llega de fuera.

## Lo discutible

1. **Media y no mediana.** La mediana describiría mejor a "una persona
   típica", y la plataforma la publica (SI.SPR.MDIM, si su licencia lo
   permite). *Coste:* añadir la serie a A1 y comparar.
2. **El nivel de precios del PIB, no el del consumo.** El de consumo de los
   hogares sería más fiel. *Coste:* buscar una serie abierta del PCI para
   el consumo.
3. **Encuestas viejas.** Un país con encuesta de 2010 queda en el nivel de
   vida de entonces. *Coste:* llevarla al año `t` con el crecimiento del
   consumo por persona (NE.CON.PRVT.PC.KD), con su propio supuesto.
4. **El ✓ depende de la tasa de retiro elegida.** Con la tasa más alta
   "alcanzan" más países, aunque sea "muy arriesgado". La fase A4 cambia la
   tasa por defecto.

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-07: los mismos costes con alquiler ponían precio a cuatro deseos.
- 2026-10-09 (fase A2): **método nuevo, solo con datos oficiales.**
  - Antes: 30 países de Numbeo (sin alquiler) y Wise (alquiler), y 142
    estimados con la cesta de Países Bajos por el nivel de precios (el
    alquiler, al cuadrado). Numbeo y Wise no permiten copiar sus datos ni
    son estadística oficial, y había que actualizarlos a mano.
  - Ahora: la media de las encuestas del Banco Mundial, una sola cifra por
    país (vivienda incluida). Se quitan "sin vivienda", la marca "≈" y la
    exclusión por inflación de más del 30 % (ya no hace falta: cada país
    sale de su propia encuesta y su propio nivel de precios).
  - Cambian las cifras: Perú pasa de 700 € (con vivienda) a 210 €, Países
    Bajos de 2190 € a 1950 €. La lista pasa de 172 a 122 países.
  - Las metas "vivir en un país" de archivos anteriores (con o sin
    vivienda) pasan a esta cifra.
