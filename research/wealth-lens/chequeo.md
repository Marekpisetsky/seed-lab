# Ficha: chequeo de tu plan

- **App:** Horalis Crecimiento · **Revisada:** 9 de octubre de 2026 (fase A2)
- **Código** (en `projects/wealth-lens/`): `src/lib/plan-check.ts` (cuándo
  aparece cada observación y sus cifras), `src/i18n/check-text.ts` (sus
  palabras), `src/components/money/plan-check.tsx` (la sección),
  `src/hooks/use-calculation.ts` (se calcula con el plan tal cual, sin
  "¿Y si…?")

## Pregunta que responde

"¿Qué destaca de mi plan?" Es la sección "Chequeo de tu
plan" del resultado: de 0 a 2 observaciones, solo las que aplican, cada
una con su cifra en euros. **Informa, no aconseja**: dice lo que hay y
sus consecuencias en euros, nunca qué comprar, qué vender ni qué pesos
poner (ver [informar, no aconsejar](../legal/informar-no-aconsejar.md)).

| Observación | Cuándo aparece | Su cifra en euros |
| --- | --- | --- |
| [Horizonte frente a riesgo](#horizonte-frente-a-riesgo) | Los años del plan, o una meta, a menos de 5 años, con dinero que sube y baja, y al menos 1 de cada 10 futuros por debajo de lo puesto | Lo puesto hasta entonces y cuánto por debajo en el peor 1 de cada 10 |
| [Ahorro a largo plazo](#ahorro-a-largo-plazo) | El plan en Ahorro durante 10 años o más | Lo que vale en euros de hoy, frente a lo puesto y frente a las acciones de EE. UU. |

Salen en ese orden (lo de los próximos años primero) y como mucho una de
cada clase. Si no aplica ninguna, la sección no aparece.

## Horizonte frente a riesgo

**En palabras:** con pocos años por delante, una caída puede no tener
tiempo de recuperarse. La app cuenta, de los 1000 futuros posibles de los
[futuros simulados](futuros-simulados.md), cuántos acaban por debajo de
lo que se ha puesto hasta entonces.

**Cuándo:**

- los años del plan son menos de 5; o, si no, hay en *Mis metas* una meta
  que el plan alcanza más adelante, pero en menos de 5 años (la más
  próxima): entonces se mira a los años enteros hasta ella (redondeando
  hacia arriba);
- el dinero sube y baja (oscilación mayor que cero: no el Ahorro, ni un
  crecimiento propio sin altibajos);
- al menos 100 de los 1000 futuros acaban por debajo de lo puesto: el
  mismo "1 de cada 10" que "Si va mal". Por debajo de eso, el caso malo ya
  queda por encima de lo puesto y no se dice nada.

**Exacta:** con C el capital de hoy, A la aportación al mes y N los años,
lo puesto es C + 12·A·N; los futuros son las 1000 trayectorias de
`samplesFor` (las mismas de la franja del gráfico); se cuentan las que
acaban en el año N por debajo de lo puesto, y se da el percentil 10 de
ese año (`bad`).

**Ejemplo** (calculado con la app): 10.000 € y 200 € al mes en el S&P 500
durante 3 años: "En 3 años pones 17.200 €. 20 de cada 100 futuros
posibles acaban por debajo. En el peor 1 de cada 10, 1951 € o más por
debajo." Con bonos, también: 23 de cada 100 (los bonos del euro tuvieron
años malos, como 2022).

## Concentración (retirada)

Hasta la fase A2 (9 de octubre de 2026) había una tercera observación: una
acción con más del 20 % de la mezcla o de *Mi cartera*. Se quitó con las
acciones sueltas y *Mi cartera* (dependían de precios diarios de fuentes
no oficiales). El método está en la pieza futura de
[mezclas](mezclas-y-acciones.md).

## Ahorro a largo plazo

**En palabras:** una cuenta de ahorro no sube ni baja, pero con los años
los precios suben más que su interés. La app dice cuánto vale lo ahorrado
en euros de hoy, frente a lo puesto y frente a lo que habrían dado las
acciones de EE. UU. con las mismas cantidades. Las dos caras van seguidas,
una frase corta cada una: lo que el ahorro deja de ganar, y la peor caída
de las acciones en los datos sobre ese dinero. Después, su caso malo.

**Cuándo:** el plan invierte en Ahorro y mira 10 años o más.

**Exacta:** lo que vale es el número grande del plan (interés del 1,5 %
menos la inflación de "Subida de precios en", ver
[inflación](inflacion.md)); la referencia son las acciones de EE. UU.
(S&P 500, 1988–2022) con sus cifras de siempre y la misma inflación, con
el mismo cálculo del número grande (típico) y su percentil 10 de los
futuros simulados (malo). La peor caída es la mayor de las crisis de
*Probar mi plan* en sus datos: 1929–1931, −53 % después de la subida de
precios. Se
aplica a lo que dan típicamente al final, cuando más dinero hay: lo más
que puede quitar una caída así. Como en todo el chequeo, los euros salen
del porcentaje y de la cifra tal como se ven (53 % de 347.353 €). Los
datos son anuales (de fin de año a fin de año): dentro de cada año la
caída pudo ser mayor, y por eso la frase dice "al menos".

**Ejemplo:** 10.000 € y 200 € al mes durante 30 años: "En 30 años, el
ahorro vale 75.587 € de hoy. Son 6413 € menos de lo que pones. Las
acciones de EE. UU. (1988–2022) suelen dar 347.353 €. Con Ahorro
terminarías con 271.766 € menos que con acciones de EE. UU. Pero las
acciones pueden caer: entre 1929 y 1931 cayeron al menos un 53 %
(−184.097 €). Suben y bajan: 1 de cada 10 futuros acaba por debajo de
153.841 €."

## Cómo se redacta

Las reglas de la [ficha legal](../legal/informar-no-aconsejar.md), con
test:

- Siempre un hecho del plan y su cifra en euros; cada porcentaje con sus
  euros.
- Nunca "deberías", "te recomendamos", ni "compra", "vende", "mantén",
  "cambia a", "reduce", "aumenta" (`src/lib/plan-check.test.ts`).
- Las frecuencias como conteos ("20 de cada 100"), nunca como porcentaje.
- La sección empieza diciendo que la decisión es de la persona: "Lo que
  destaca de tu plan, con sus euros. Qué hacer lo decides tú."
- Ningún producto: la referencia del ahorro es un tipo de activo ("las
  acciones de EE. UU."), no un fondo.

## Supuestos

- Los 1000 futuros simulados (ver [futuros simulados](futuros-simulados.md))
  representan lo que puede pasar en pocos años.
- Las acciones de EE. UU. de 1988–2022 son una referencia razonable para
  comparar un ahorro a largo plazo. Su peor caída en los datos
  (1929–1931) es una referencia, no un límite.

## Fuentes

Las de los modelos que usa: [crecimiento](crecimiento.md),
[futuros simulados](futuros-simulados.md), [inflación](inflacion.md) y
[mezclas](mezclas-y-acciones.md).

## Validación (tests)

- `src/lib/plan-check.test.ts`: cuándo aparece y cuándo no cada
  observación (menos de 5 años frente a 5; sin oscilación; menos de 1 de
  cada 10 por debajo; una meta próxima; Ahorro a 9 años frente a 10); que la
  cuenta coincide con los futuros del gráfico; el orden; y la redacción,
  en inglés y en español: euros en lo que destaca, ningún porcentaje sin
  euros, sin palabras de consejo ni de compra o venta, frases cortas.
- `src/components/money/entry.test.ts`: la sección no sale si nada
  destaca, sale tras "¿Y si…?" y antes de *Mis metas*, con su enlace a
  *Cómo funciona*.
- `src/components/plain-language.test.ts`: el resultado de un plan a 3
  años, de una mezcla y de un ahorro pasa la regla de los euros.

## Límites

- Una observación por clase y solo dos clases: no es una revisión
  completa del plan (no mira comisiones, impuestos ni divisas).
- El horizonte de una meta se mira en años enteros.

## Lo discutible

1. **"1 de cada 10" como umbral.** Con 8 de cada 100 futuros por debajo
   no se dice nada, aunque no es poco. *Coste:* decidir otro umbral o
   decirlo siempre que haya años cortos.
2. **La referencia del ahorro.** Se compara con las acciones de EE. UU.
   1988–2022 (7,54 % al año después de la inflación), no con el 5 % de
   partida de la calculadora, y con su peor caída (1929–1931), que es de
   antes de esos años. Comparar con acciones puede leerse como una
   sugerencia; por eso va con su caso malo y su peor caída. *Coste:*
   revisarlo con el profesional de la ficha legal.
3. **El plan tal cual.** El chequeo no mira el "¿Y si…?" aplicado, para
   hablar del plan de la persona y no de un escenario. *Coste:* ninguno;
   anotarlo.

## Historial

- 2026-10-07: primera ficha. El chequeo nuevo, con tres observaciones; el
  hallazgo de concentración de *Mi cartera* (40 %) deja *Para tener en
  cuenta* y un solo umbral, el 20 %, vale para la mezcla y para *Mi
  cartera*.
- 2026-10-07 (2): a petición de Marek, la observación del Ahorro dice en
  una sola frase sus dos caras: lo que el ahorro deja de ganar frente a
  las acciones del mundo y la peor caída de estas (2000–2002) sobre ese
  dinero. Después, a petición de Marek, en dos frases cortas, con "al
  menos" porque los datos son anuales.
- 2026-10-09 (fase A2): sin la observación de concentración (se quitaron
  las acciones sueltas y *Mi cartera*). La referencia del ahorro pasa de
  las acciones del mundo (MSCI World, sus datos no son abiertos) a las de
  EE. UU.: suelen dar más (7,54 % frente a 4,45 %) y su peor caída en los
  datos es mayor (1929–1931, −53 %, frente a 2000–2002, −46 %).
