# Horalis Research

El departamento que **decide y valida los métodos** de Horalis: qué
modelo responde a cada pregunta, con qué supuestos y datos, cómo se
comprueba y dónde deja de valer. Cada app tiene aquí sus fichas, y las
fichas que no son de una sola app (lo educativo y lo legal) también.

## Tres piezas, tres papeles

| Pieza | Papel | Dónde |
| --- | --- | --- |
| **Forja** | **Fabrica**: crea cada herramienta nueva, ya conectada a lo común. | [`tools/forja`](../tools/forja/README.md) |
| **seed-kit** | **Son las piezas**: colores, cabecera y pie, idiomas, formatos, privacidad y las comprobaciones que toda página pasa. | [`packages/seed-kit`](../packages/seed-kit/README.md) |
| **Research** | **Decide y valida los métodos**: los modelos y supuestos de cada app, sus fuentes, sus tests y sus límites. | esta carpeta |

Forja y seed-kit garantizan que una herramienta sea privada, ligera y
bilingüe. Research garantiza que lo que calcula sea defendible y que se
diga con honestidad lo que no sabe.

## La regla

> **Ningún modelo ni supuesto de una app cambia sin su ficha en
> `research/`.**

- Un cálculo nuevo, o un cambio en uno existente (una fórmula, un dato,
  una fuente, un umbral, una cifra de partida), llega con su ficha nueva o
  actualizada **en el mismo cambio**.
- La ficha dice qué cambia, por qué y qué tests lo comprueban, y lo anota
  en su *Historial*.
- Si la ficha y el código no dicen lo mismo, el código está mal hasta que
  se demuestre lo contrario.
- Un texto de la app que explica un método (la página *Cómo funciona*, una
  ayuda) no puede decir más de lo que dice su ficha.

## Qué tiene cada ficha

1. **Pregunta que responde**, en las palabras de quien usa la app.
2. **Fórmula en palabras sencillas**, y luego la fórmula exacta.
3. **Supuestos**: lo que se da por hecho.
4. **Fuentes con fecha**: de dónde sale cada dato y hasta cuándo llega.
5. **Validación**: qué tests lo comprueban (archivo y qué miran).
6. **Límites**: cuándo no vale y qué deja fuera.
7. **Lo discutible**: lo que un profesor de finanzas exigente le
   objetaría, sin cambiar todavía ningún cálculo. Cada punto, con lo que
   costaría resolverlo.
8. **Historial**: fecha y cambio.

## Fichas

### Horalis Crecimiento

Las rutas de código son de `projects/wealth-lens/` salvo que digan otra cosa.

| Ficha | Modelo | Código |
| --- | --- | --- |
| [Crecimiento](wealth-lens/crecimiento.md) | El número grande: cuánto tendrás. | `src/lib/finance.ts`, `calculator.ts`, `investment.ts` |
| [Futuros simulados](wealth-lens/futuros-simulados.md) | "Si va mal / si va bien", la franja de 8 de cada 10. | `src/lib/simulation.ts`, `normal.ts`, `projections.ts` |
| [Tasa de retiro](wealth-lens/tasa-de-retiro.md) | "Te pagaría al mes" y "duró 30 años". | `src/lib/monte-carlo.ts`, `withdrawal.ts`, `success-table.ts` |
| [Mezclas](wealth-lens/mezclas-y-acciones.md) | Una mezcla de tipos de activo; las acciones sueltas, como pieza futura. | `src/lib/mix.ts`, `volatility.ts` |
| [Coste de vida por países](wealth-lens/coste-de-vida.md) | "Alcanza para vivir en", la tabla de países y las metas de un país (también Horalis Coste de vida). | `packages/seed-kit/src/official/living-costs.ts`, `cost-of-living.ts` |
| [Inflación](wealth-lens/inflacion.md) | Todo en euros de hoy; el ahorro; "Subida de precios en". | `src/lib/investment.ts`, `assets.ts`, seed-kit `cost-of-living.ts` |
| [Valor inicial del 5 %](wealth-lens/valor-inicial.md) | Con qué crecimiento empieza la calculadora. | `src/lib/validation.ts` (`STARTING_GROWTH`) |
| [Década mala histórica](wealth-lens/decada-mala.md) | "Si tus primeros 10 años fueran como 2000–2009". | `src/lib/decade.ts`, `what-if.ts`, `findings.ts` |
| [Chequeo de tu plan](wealth-lens/chequeo.md) | Las 0 a 2 observaciones: horizonte frente a riesgo y ahorro a largo plazo. | `src/lib/plan-check.ts`, `src/i18n/check-text.ts` |
| [Deseos y precios por país](wealth-lens/deseos.md) | Retirada en la fase A2: historia del método. | — |

### Para todas las apps

| Ficha | Qué es |
| --- | --- |
| [Por qué no simplemente maximizar el crecimiento (Kelly)](educacion/kelly.md) | Educativa: qué dice Kelly, qué saldría con nuestros datos y por qué Horalis no recomienda pesos. |
| [Datos oficiales](datos-oficiales.md) | Las series que usan todas las herramientas (Banco Mundial, Eurostat, CLDR): fuentes, licencias, la descarga anual y sus comprobaciones. |
| [Monedas](monedas.md) | La moneda de cada país, los tipos de cambio oficiales por año, cómo se convierte y se escribe una cantidad en cada herramienta, y el país de partida según el idioma del navegador. |
| [Informar, no aconsejar](legal/informar-no-aconsejar.md) | Legal: el límite entre información general y asesoramiento personalizado (MiFID II) y las reglas de redacción de todas las apps. **No es asesoramiento legal.** |

## Estado

Primera versión: 3 de octubre de 2026. Fichas escritas a partir del
código tal como está en esa fecha (Horalis Crecimiento tras las fases 1 a 3), sin
cambiar ningún cálculo. Lo discutible queda anotado en cada ficha para
decidirlo después, cada cosa con su propia ficha actualizada.

Lo único que cambió al escribirlas, sin tocar ningún resultado:

- tres comentarios del código que ya no decían lo que el código hace
  (`investment.ts`, `monte-carlo.ts`, `simulation.ts`);
- la regla 1 de la [ficha legal](legal/informar-no-aconsejar.md) es ahora
  un test de seed-kit para todas las apps, y el único texto que la
  incumplía, el título "What you should know" de Horalis Crecimiento, pasa a ser
  "Good to know" ("Para tener en cuenta").

Fase 5 (7 de octubre de 2026): nueva ficha de [deseos y precios por
país](wealth-lens/deseos.md), con su regla de elección y sus fuentes, en
el mismo cambio que el código; la de inflación y la de crecimiento llaman
al ajuste de la inflación por su etiqueta, "Subida de precios en", para
no confundirlo con "Precios de" de los deseos.

Fase 6 (7 de octubre de 2026): nueva ficha del [chequeo de tu
plan](wealth-lens/chequeo.md); un solo umbral de concentración, el 20 %
(se resuelve el punto 4 de lo discutible de las mezclas); la ficha legal
anota el chequeo y su test.

Las cifras que las fichas citan de los datos (medias, oscilaciones, tasas
de éxito) salen de los mismos archivos que usa la app
(`projects/wealth-lens/src/data/`, `src/lib/success-table.ts`); si los
datos cambian, los tests fallan y la ficha se actualiza con ellos.

Fase A2 del plan Horalis (9 de octubre de 2026): se quita todo lo que
caduca o no se puede publicar. Fichas actualizadas en el mismo cambio:
[coste de vida](wealth-lens/coste-de-vida.md) (método nuevo, solo datos
oficiales), [crecimiento](wealth-lens/crecimiento.md) (sin Mundo ni
Nasdaq-100; oro del Banco Mundial), [mezclas](wealth-lens/mezclas-y-acciones.md)
(sin acciones sueltas ni Mi cartera, que quedan como pieza futura),
[chequeo](wealth-lens/chequeo.md), [década mala](wealth-lens/decada-mala.md),
[futuros simulados](wealth-lens/futuros-simulados.md),
[tasa de retiro](wealth-lens/tasa-de-retiro.md),
[valor inicial](wealth-lens/valor-inicial.md),
[inflación](wealth-lens/inflacion.md),
[metas personales](wealth-lens/metas-personales.md) y
[deseos](wealth-lens/deseos.md) (retirada).
