# Ficha: países, monedas y tipos de cambio

- **Para:** todas las herramientas de Horalis · **Revisada:** 9 de octubre
  de 2026 (fase A3 del plan Horalis)
- **Código** (en `packages/seed-kit/`):
  - `src/official/money-tables.ts`: hace las dos tablas en el build;
  - `scripts/money-tables.ts` (`npm run money-tables`): las escribe;
  - `src/data/currencies.json` y `src/data/exchange-rates.json`: las tablas
    que leen las páginas;
  - `src/money.ts`: la moneda de cada país, el tipo de un año y la
    conversión;
  - `src/format.ts`: cómo se escribe una cantidad en cada moneda e idioma
    (`formatsFor`, `roundMoney`);
  - `src/detect.ts`: el país que dice el idioma del navegador
    (`regionOf`, `countryFromLanguage`).
- **En cada herramienta:** Horalis Coste de vida
  (`projects/cost-lens/src/countries.ts`, `calc.ts`, `view.ts`), Horalis
  Inflación (`projects/inflation-lens/src/hicp.ts`) y Horalis Crecimiento
  (`projects/wealth-lens/src/lib/money.ts`, `app-store.ts`,
  `i18n/make.ts`).
- **Datos:** los del módulo A1 ([datos oficiales](datos-oficiales.md)).
- **Tests:** `packages/seed-kit/test/money.test.ts`, `format.test.ts`,
  `detect.test.ts`; `projects/cost-lens/test/calc.test.ts`;
  `projects/inflation-lens/test/*.test.ts`;
  `projects/wealth-lens/src/lib/money.test.ts`, `validation.test.ts`.

## Pregunta que responde

«¿Me sirve esto en mi país y en mi moneda?» Cada herramienta trabaja en la
moneda de quien la usa, escribe los números a su manera y, cuando pasa una
cifra de una moneda a otra, dice con qué tipo oficial y de qué año.

## En palabras sencillas

- **La moneda de cada país** es la que dice Unicode CLDR (código ISO 4217:
  EUR, PEN, MXN…). Una tabla de 215 países.
- **El tipo de cambio** es la media del año que publica el Banco Mundial
  (PA.NUS.FCRF), en unidades de cada moneda por dólar, de 2015 al último
  año. Nunca un tipo del día, nunca un tipo escrito a mano.
- **Convertir** es dividir por el tipo de la moneda de origen y multiplicar
  por el de la de destino, **del mismo año**. La página dice el año.
- **El país de partida** sale del idioma del navegador (es-MX → México;
  «en» → Estados Unidos), en el propio dispositivo. Nada se guarda ni se
  envía, y no se usa la ubicación. La persona lo cambia cuando quiera.
- **Los números** se escriben como los escribe el idioma de la página y,
  si el navegador dice una región en ese mismo idioma, como en esa región
  (es-MX: 1,234.5; es-ES: 1234,5).

Exacta:

- `r(c, a)` = unidades de la moneda `c` por dólar en el año `a`.
- `x` de `A` a `B` en el año `a` = `x × r(B, a) / r(A, a)`.
- Sin `a`: el último año con tipo para las dos. Con un `a` sin tipo para
  alguna: el año más cercano que tengan las dos, y la conversión devuelve
  ese año (`convert`).

## Cómo se hace la tabla de tipos

El Banco Mundial da los tipos **por país**, y varios países comparten
moneda. Para cada moneda:

1. Se toma un país fijo cuando hay uno claro (`RATE_COUNTRY`): el euro de
   Alemania, el dólar de EE. UU., el franco CFA de África Occidental de
   Senegal, el de África Central de Camerún, el dólar del Caribe Oriental
   de Santa Lucía, y la moneda propia de AU, CH, NZ, ZA, IN, IL, DK, NO y
   GB. Así el euro no toma los años de Croacia (kunas) ni de Bulgaria
   (levas).
2. Los años que le falten se completan con otros países de la misma
   moneda **solo si coinciden** con él (diferencia de menos del 1 % en los
   años comunes).
3. **Monedas nuevas.** Un país solo da años desde el primer año entero de
   su moneda de hoy, según la fecha de inicio de CLDR (`currencySince`:
   el bolívar soberano, 20 de agosto de 2018 → desde 2019; el euro en
   Croacia, 1 de enero de 2023 → desde 2023). El Banco Mundial a veces
   reexpresa los años viejos en la moneda nueva y a veces no (el VES de
   2015–2017 era bolívar fuerte, 100 000 veces mayor): ante la duda se
   pierden esos años antes que mezclar dos monedas. Además, si de un año
   al siguiente el tipo salta más de ×20, la moneda cambió aunque CLDR no
   lo diga (el dólar de Zimbabue…), y se cortan los años anteriores.
4. El dólar vale 1 todos los años.

Resultado (9 oct. 2026): 145 monedas con tipo, 2015–2025 (sin el VES ni el
florín del Caribe, XCG, nacido en 2025).

## Cada herramienta

- **Horalis Coste de vida.** Lo que se escribe está en la moneda del país
  donde vives; el resultado, en la del país con que comparas. Los costes de
  los países están en dólares de su año de precios (2024); se pasan a cada
  moneda con el tipo de **ese mismo año**. Un país cuya moneda no tiene
  tipo ese año sale en dólares, y la página lo dice junto al resultado
  («Irán: en dólares de EE. UU., sin tipo oficial de 2024»): un tipo de otro año mezclaría precios de dos años. Hoy son
  8 países (CD, GN, IR, LK, MM, MR, MW, SL). Junto al resultado: «Con los
  tipos oficiales de 2024: 1 € = 4,06 PEN». La cantidad de partida es lo
  que vive al mes una persona media del país de partida, en su moneda. Al
  cambiar «Dónde vives», lo escrito pasa a la nueva moneda con el mismo
  tipo (sigue siendo el mismo dinero); si no se había tocado, pasa a lo
  que vive una persona media allí.
- **Formato de números.** En las tres herramientas, como los escribe la
  región del lector si su navegador habla el idioma de la página (es-MX en
  `/es`: 1,234.5; en-IN: 1,50,000). Crecimiento lee además los lakhs de la
  India y el apóstrofo suizo (150’000) al escribir.
- **Horalis Inflación.** Cada lugar en su moneda de hoy (zona euro y UE:
  euro). La inflación cambia lo que compra el dinero, no su moneda: no hay
  conversión.
- **Horalis Crecimiento.** El plan tiene moneda («Tus importes están en»,
  en Más opciones), cualquiera con tipo en el año de precios de los países.
  - Los importes que escribes están en ella, y su símbolo va dentro del
    campo; cambiarla no los convierte. Los ejemplos en gris son la misma
    cantidad de dinero en ella (1000 € → 20 000 MX$).
  - El crecimiento es el de cada inversión después de la subida de precios,
    en su propia moneda: **no cuenta los cambios entre monedas** (Cómo
    funciona lo dice).
  - El coste de cada país sale en esa moneda: dólares de 2024 × tipo de
    2024, redondeado como todo coste (`roundMoney`).
  - Los pasos de la app («+50 € al mes», «+100 € al mes» de las
    observaciones) y los umbrales de las observaciones («desde 1000 €»)
    son **la misma cantidad de dinero** en la moneda del plan: 50 € al tipo
    de 2024, redondeado a 1, 2 o 5 por una potencia de diez (50 $, 200 S/,
    10 000 ¥). Con euros, exactamente los de antes.
  - Al cambiar «Subida de precios en», la moneda sigue al país si era la
    del país anterior; si la persona eligió otra, se queda.
  - Una primera visita empieza en el país y la moneda que dice el idioma
    del navegador, si la app tiene sus cifras; un plan ya tocado no
    cambia.
  - El archivo de datos pasa a la versión 12 y guarda la moneda; los
    archivos anteriores eran en euros y se leen en euros. Un archivo con
    una moneda que tiene tipo en algún año la conserva (si la
    actualización anual le quita el del año de precios, los costes usan el
    año más cercano); con una moneda desconocida se lee en euros, y lo
    dice.
  - El tope de una cantidad sube de 10⁹ a 10¹⁵: mil millones de euros en
    la moneda del plan con más unidades por euro (la libra libanesa, unos
    9,7 × 10¹³ en 2024).

## Redondeo

Un coste se muestra a la unidad por debajo de 95, a la decena por debajo
de 10 000 y a tres cifras por encima (`roundMoney`): 246 000 ¥, no
245 678 ¥. Un paso más fino diría una precisión que los datos no tienen.
Por debajo de 95 era antes «a 1 € por debajo de 100 €»; el cambio solo
afecta a cifras entre 95 y 99, que ahora van a la decena.

## Supuestos

- La media anual sirve para pasar de una moneda a otra cifras del mismo
  año.
- La moneda de hoy de un país vale para todos sus importes de hoy.
- El idioma del navegador dice dónde vive la persona con bastante
  frecuencia; cuando no, lo cambia ella.
- 50 € al tipo oficial son «la misma cantidad de dinero» en otra moneda.
  En poder de compra no lo son (eso lo mide la PPA); para un paso de un
  botón basta.

## Fuentes, con fecha

- Banco Mundial, PA.NUS.FCRF, tipo de cambio oficial (media del año),
  CC BY 4.0. Descarga del 9 de octubre de 2026, **provisional** (espejo
  público del Banco Mundial en GitHub, actualización del 1 de julio de
  2026); la descarga anual de A1 la sustituye.
- Unicode CLDR 48.2.0, `supplemental/currencyData.json`, Unicode License
  v3: la moneda de cada país.

## Validación (tests)

- Las tablas son lo que dan los datos oficiales (si no,
  `npm run money-tables`).
- Cada país tiene su moneda ISO 4217; el euro sale de Alemania y es menor
  que 1 dólar en todos los años; ninguna moneda salta más de ×20 de un año
  a otro.
- Una conversión usa el mismo año para las dos monedas, ida y vuelta da la
  misma cantidad, y sin tipo devuelve el año más cercano o nada.
- Formatos: dólar en EE. UU., peso en México, sol en Perú, euro en España
  y Países Bajos, libra en palabras, yen en potencias de diez.
- Coste de vida: euros a soles y vuelta; la frase con el tipo y el año; el
  país de partida según el idioma.
- Crecimiento: el resultado no cambia con la moneda; el coste de Perú en
  soles; el paso de 200 S/; la moneda que sigue al país; la primera visita
  según el idioma y un plan tocado que no cambia; archivos sin moneda en
  euros.

## Límites

- Un tipo medio anual no es el tipo del banco ni el de hoy.
- Monedas con varios tipos (oficial y paralelo): se usa el oficial, que
  puede estar lejos del que se paga en la calle (Argentina, Irán, Nigeria
  en algunos años).
- Crecimiento no cuenta lo que gana o pierde quien invierte en una moneda
  y vive en otra.
- El idioma del navegador no es la ubicación: alguien en Alemania con el
  navegador en inglés empieza en EE. UU. y dólares.

## Lo discutible

1. **Países sin tipo del año de precios, en dólares.** Se podría usar el
   año más cercano con la inflación del país entre medias. *Coste:* un
   supuesto más; hoy afecta a 8 países.
2. **El paso por tipo de cambio y no por PPA.** Con PPA, «+50 € al mes» en
   la India sería más rupias de las que da el tipo. *Coste:* poco; pero
   cambia la cifra que la persona ve en el botón.
3. **El formato numérico de la región del navegador.** Solo si el idioma
   coincide con el de la página: «en-NL» mezcla dos maneras de escribir
   (1.234,5 en números y €1,234.50 en dinero), así que no se usa.

## Historial

- 2026-10-09 (fase A3, tras la revisión independiente): fecha de inicio de
  cada moneda (CLDR) para no mezclar el bolívar fuerte con el soberano;
  la cantidad de Coste de vida sigue al país; formato del lector en las
  tres herramientas; archivos con monedas que pierdan su tipo del año.
- 2026-10-09 (fase A3): ficha nueva. Moneda por país, tipos oficiales por
  año, conversiones con año visible, formatos por región, país de partida
  según el idioma. Coste de vida y Crecimiento dejan de ser solo en euros.
