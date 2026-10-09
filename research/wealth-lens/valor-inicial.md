# Ficha: valor inicial del 5 %

- **App:** Horalis Crecimiento · **Revisada:** 9 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/validation.ts`
  (`STARTING_GROWTH = 0.05`, el plan vacío), `src/lib/investment.ts`
  (`CUSTOM_BASE = "sp500"`), `src/i18n/investment-text.ts`
  (`isStartingGrowth`: lo llama "la media mundial a largo plazo (UBS)")

## Pregunta que responde

"Si no sé cuánto crece mi dinero, ¿con qué empiezo?" Es el 5 % del paso 3
al abrir la calculadora, con el que se calcula el primer resultado de
quien no toca nada.

## Fórmula, en palabras sencillas

La calculadora empieza con un crecimiento propio del **5 % al año después
de la subida de precios**, que se mueve como las acciones de EE. UU. (su
oscilación de 1988 a 2022: 16,39 % al año; hasta la fase A2, la de las
acciones del mundo, 17,82 %). El 5 % es el redondeo hacia
abajo del 5,2 % al año que crecieron las acciones del mundo de 1900 a 2024
según el anuario de UBS de 2025.

## Supuestos

- Una media de 125 años es mejor punto de partida que cualquier década
  concreta.
- Redondear hacia abajo (5 % en lugar de 5,2 %) es más prudente y más fácil
  de recordar.
- Quien empieza no ha elegido aún dónde invierte: "las acciones del
  mundo" es la referencia más neutral.

## Fuentes (con fecha)

Verificado para esta ficha (3 de octubre de 2026):

- **UBS Global Investment Returns Yearbook 2025** (Dimson, Marsh y
  Staunton), publicado el 4 de marzo de 2025: las acciones del mundo
  rindieron un **5,2 % real anual de 1900 a 2024** (frente a 1,7 % los
  bonos y 0,5 % las letras). Es la cifra que usa la app.
  - Cita de las cifras (la que enlaza *Cómo funciona*): Cambridge Judge
    Business School, "Report: stocks have far outperformed over the past
    125 years" (7 de marzo de 2025):
    <https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/>
  - Nota de prensa de UBS (confirma la edición y la fecha, pero **no**
    publica el 5,2 %, el 1,7 % ni el 0,5 %):
    <https://www.ubs.com/global/en/media/display-page-ndp/en-20250304-global-investment-returns-yearbook-2025.html>
- **UBS Global Investment Returns Yearbook 2026**, publicado el 3 de marzo
  de 2026: da un **6,6 % real anual para las acciones de EE. UU. de 1900 a
  2025**, y **su resumen público no publica una cifra real para las
  acciones del mundo**. Por eso la app sigue usando el 5,2 % mundial de la
  edición de 2025 hasta que haya una cifra mundial real más reciente.
  - Nota de prensa:
    <https://www.ubs.com/global/en/media/display-page-ndp/en-20260303-global-investment-returns-yearbook-2026.html>
  - Resumen público (PDF):
    <https://www.ubs.com/content/dam/assets/wm/static/cio/documents/giry2026-summary-public.pdf>
- La oscilación: acciones de EE. UU. (S&P 500 de Shiller), 1988–2022 (ver
  [crecimiento](crecimiento.md)). Hasta la fase A2, MSCI World, retirado
  porque sus condiciones no permiten publicar sus datos.

> Desde el entorno donde se escribió esta ficha, ubs.com no se pudo abrir
> (red bloqueada); las cifras se contrastaron con la nota de Cambridge
> Judge y con prensa financiera que cita el anuario. **Marek debe abrir los
> dos documentos de UBS y confirmarlas a mano.**

## Validación (tests)

- `src/lib/examples.test.ts` ("step 3's starting value"): el plan vacío
  empieza en el 5 % (`STARTING_GROWTH`), como crecimiento propio, y se
  mueve como las acciones de EE. UU.
- `src/lib/investment.test.ts` ("Custom growth"): un crecimiento propio se
  mueve con la oscilación de las acciones de EE. UU.
- `src/lib/success-table.test.ts`: las tasas de retiro precalculadas del
  plan de partida (`normal:0.050000:0.163877`).
- `src/lib/findings.test.ts`: el 5 % de partida se nombra "la media
  mundial a largo plazo (UBS)", no "tu crecimiento".
- La página *Cómo funciona* cita la fuente, su edición y su cifra.

## Límites

- Es una media del pasado, no una promesa (la app lo dice bajo el
  gráfico).
- Es la media de un índice mundial medido en dólares y deflactado con la
  inflación de EE. UU.: no es exactamente lo que vería quien ahorra en
  euros.

## Lo discutible

1. **Media mundial de 125 años, oscilación de EE. UU. de 35.** El 5 % sale
   de las acciones del mundo en 1900–2024 y la oscilación (16,39 %), de las
   de EE. UU. en 1988–2022: mezcla dos periodos y dos mercados. Para el
   índice mundial de Dimson, Marsh y Staunton, la desviación típica a
   largo plazo ronda el 17 %, así que la cifra es parecida. *Coste:* la
   fase B2 quita el crecimiento preseleccionado.
2. **El propio anuario espera menos.** Dimson, Marsh y Staunton estiman
   desde hace años una prima de riesgo futura menor que la histórica.
   Partir del pasado sin rebajarlo puede ser optimista. *Coste:* decidir si
   el valor inicial es "el pasado" (como ahora) o "una expectativa", y
   decirlo.
3. **Supervivencia y país.** El índice mundial de 1900 incluye mercados
   que se hundieron (Rusia, China), lo que es una virtud frente a usar solo
   EE. UU. (6,6 %); aun así, el 5,2 % es en dólares. *Coste:* ninguno ahora;
   es la mejor cifra pública disponible.
4. **Una cifra que no es de un organismo oficial.** El 5,2 % es de un
   anuario privado (UBS), citado por una universidad. Es la única cifra de
   Horalis Crecimiento que no sale de un organismo oficial ni de una serie
   cerrada con licencia abierta. *Coste:* la fase B2 lo resuelve (sin
   crecimiento preseleccionado).

## Historial

- 2026-10-03: primera ficha. Registrado lo que dicen las ediciones 2025 y
  2026 del anuario; la app no cambia.
- 2026-10-08: comprobadas las fuentes. El 5,2 % (y 1,7 % y 0,5 %) está en
  la nota de Cambridge Judge, no en la nota de prensa de UBS: *Cómo
  funciona* enlaza ahora la de Cambridge Judge. El 6,6 % de EE. UU. y la
  ausencia de una cifra real mundial en el resumen público de 2026 se
  confirman. La cifra y el cálculo no cambian.
- 2026-10-09 (fase A2): el crecimiento propio se mueve como las acciones
  de EE. UU. (las del mundo se retiraron: sus datos no son abiertos).
  Cambian las tasas precalculadas del plan de partida: al 4 % dura en 81,8
  de cada 100 (antes 79,5). El chip "Mundo" desaparece.
- 2026-10-09 (revisión independiente de A2): un archivo de las versiones 9
  y 10 con crecimiento propio y sin oscilación escrita conserva la
  oscilación que tenía, la de las acciones del mundo (0,178217, guardada
  como número: `WORLD_CUSTOM_VOLATILITY` en `src/lib/validation.ts`), así
  que su resultado no cambia. Test: `data-file.test.ts`.
