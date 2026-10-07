# Ficha: inflación

- **App:** Wealth Lens · **Revisada:** 3 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/investment.ts`
  (`inflationFor`, `toNominal`, `toReal`), `src/lib/assets.ts`
  (`SAVINGS_RATE`, `savingsRealReturn`), `src/lib/assumptions.ts`
  (`quotedGrowth`); la inflación de referencia de cada país en
  `packages/seed-kit/src/data/` (`inflation` de cada país)

## Pregunta que responde

"¿Cuánto valdrá ese dinero de verdad, con los precios subiendo?" La app
responde en **euros de hoy**: cada cifra es lo que se podría comprar hoy
con ella. La inflación decide además cuánto rinde de verdad una cuenta de
ahorro y cómo se dice el crecimiento "como lo dan los bancos".

## Fórmula, en palabras sencillas

Todo se calcula ya descontada la subida de precios, así que las cifras
salen en euros de hoy sin tener que convertir nada. Solo hace falta la
inflación en tres sitios:

1. **El ahorro**: rinde su interés (1,5 % al año) menos la inflación.
2. **La línea "como lo dan los bancos"** bajo los ejemplos: el crecimiento
   antes de inflación, el que suele anunciarse.
3. **Lo que la persona escribe**: si cambia la inflación en *Más
   opciones*, cambian 1 y 2.

Exacta (ecuación de Fisher, sin aproximar):

- real = (1 + nominal) / (1 + inflación) − 1
- nominal = (1 + real) × (1 + inflación) − 1
- Ahorro: (1,015 / 1,02) − 1 = −0,49 % al año con el 2 % del euro.

La inflación de partida es la de "Subida de precios en" (Más opciones; Países Bajos por defecto): el **objetivo de su banco central**
(el 2 % del BCE para los países del euro), comprobado en septiembre de
2026; donde no hay objetivo numérico, la media de 2015 a 2024.

## Supuestos

- Las aportaciones mensuales suben exactamente con los precios.
- La inflación futura será la del objetivo del banco central.
- Los índices en dólares ya vienen en términos reales de EE. UU. (IPC de
  EE. UU.); los bonos del euro, en términos reales alemanes (IPC de
  Destatis). La inflación de "Subida de precios en" no los toca.
- El interés del ahorro es fijo: 1,5 % antes de inflación.

## Fuentes (con fecha)

- BCE, estrategia de política monetaria de julio de 2021: objetivo del 2 %
  simétrico a medio plazo. Comprobado en septiembre de 2026.
- Objetivos de los demás bancos centrales, uno por país, con su base y
  fecha en el conjunto de datos (`inflation.basis`, `asOf`).
- Banco Mundial, FP.CPI.TOTL.ZG, medias de 2015 a 2024 donde no hay
  objetivo, y para marcar los países con más de un 10 % al año.
- IPC de EE. UU.: Shiller (hasta 2022) y BLS (2023: 306,746; 2024:
  315,605). IPC de Alemania: Destatis.

## Validación (tests)

- `src/lib/investment.test.ts` (17): de real a nominal y vuelta; el
  ahorro, su interés menos la inflación del país (puede ser negativo); la
  inflación de "Subida de precios en" o la escrita; escribir solo la inflación no
  cambia el crecimiento de un activo.
- `src/lib/cost-of-living.test.ts` ("reference inflation"): cada país con
  su referencia, su base y su fecha.
- `src/lib/assumptions.test.ts` (9): cómo se dice la inflación y la línea
  "como lo dan los bancos".
- `src/lib/finance.test.ts`: `nominalReturn`.

## Límites

- Un objetivo no es una previsión: la zona euro estuvo por encima del 2 %
  en 2021–2023 (con picos cercanos al 10 %) y por debajo en buena parte de
  2013–2020.
- "Euros de hoy" no son los euros de un país concreto: la subida de
  precios de cada persona depende de lo que compra.

## Lo discutible

1. **Mezcla de deflactores.** Un plan en el S&P 500 crece en términos
   reales de EE. UU., pero la persona vive con la inflación del euro. La
   diferencia entre ambas inflaciones, unida al tipo de cambio, no está
   en el modelo (ver [crecimiento](crecimiento.md), punto 3).
2. **Objetivo frente a inflación esperada.** El objetivo es una referencia
   razonable a largo plazo (las previsiones a 5 años del FMI convergen a
   él), pero para el ahorro, que depende de la diferencia entre interés e
   inflación, un punto de error cambia el signo. *Coste:* mostrar la
   sensibilidad (±1 punto) en la ficha de ahorro.
3. **El 1,5 % del ahorro es fijo.** Los depósitos pagan muy distinto según
   el año y el país; la media real del ahorro ha sido negativa o cercana a
   cero en la zona euro. *Coste:* fechar el 1,5 % y revisarlo cada año, o
   pedirlo.
4. **Aportaciones indexadas.** Suponer que la aportación sube con los
   precios es una hipótesis optimista para muchos sueldos. *Coste:* un
   texto que lo diga junto a la aportación.

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-07: el ajuste se nombra por su etiqueta, "Subida de precios en",
  para no confundirlo con "Precios de" de los deseos
  ([deseos](deseos.md)). Sin cambios en el cálculo.
