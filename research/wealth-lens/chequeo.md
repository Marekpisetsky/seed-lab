# Ficha: chequeo de tu plan

- **App:** Horalis Crecimiento · **Revisada:** 7 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/plan-check.ts` (cuándo
  aparece cada observación y sus cifras), `src/i18n/check-text.ts` (sus
  palabras), `src/components/money/plan-check.tsx` (la sección),
  `src/hooks/use-calculation.ts` (se calcula con el plan tal cual, sin
  "¿Y si…?")

## Pregunta que responde

"¿Qué destaca de mi plan?" Es la sección "Chequeo de tu
plan" del resultado: de 0 a 3 observaciones, solo las que aplican, cada
una con su cifra en euros. **Informa, no aconseja**: dice lo que hay y
sus consecuencias en euros, nunca qué comprar, qué vender ni qué pesos
poner (ver [informar, no aconsejar](../legal/informar-no-aconsejar.md)).

| Observación | Cuándo aparece | Su cifra en euros |
| --- | --- | --- |
| [Horizonte frente a riesgo](#horizonte-frente-a-riesgo) | Los años del plan, o una meta, a menos de 5 años, con dinero que sube y baja, y al menos 1 de cada 10 futuros por debajo de lo puesto | Lo puesto hasta entonces y cuánto por debajo en el peor 1 de cada 10 |
| [Concentración](#concentración) | Una acción con más del 20 % de la mezcla del plan o de *Mi cartera* (sin contar fondos indexados) | Sus euros y su peor caída sobre ellos |
| [Ahorro a largo plazo](#ahorro-a-largo-plazo) | El plan en Ahorro durante 10 años o más | Lo que vale en euros de hoy, frente a lo puesto y frente a las acciones del mundo |

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

## Concentración

**En palabras:** una sola empresa puede caer mucho más que un índice. Si
una acción pesa más de un quinto, la app dice cuántos euros son y qué les
haría una caída como la peor que tuvo.

**Cuándo:**

- si el plan invierte en una mezcla: la acción de la mezcla con más peso,
  si pasa del 20 % (`CONCENTRATION_LIMIT`, el mismo umbral que ya usaba
  la mezcla para su efecto de concentración);
- si no: la posición de *Mi cartera* en euros con más valor que no sea un
  fondo indexado, si pasa del 20 % del valor de las posiciones en euros.

**Sus euros:** en una mezcla, el peso × el dinero de hoy (o, si no hay
dinero hoy, × el total al final, y lo dice); en *Mi cartera*, su valor.
**Su peor caída** es la mayor caída desde un máximo en los precios
guardados (`drawdown` de `public/data/prices.json`, desde el inicio de su
historia guardada), aplicada a esos euros; también el cambio de los
últimos 12 meses, como de dónde vienen esos euros: "+25 %, de 4800 € a
6000 €" (con "+25 % (+1200 €)" al lado de "6000 €", el lector calcula el
25 % de 6000 € y cree ver un error).

**Ejemplo:** una mezcla 75 % Mundo y 25 % NVDA con 10.000 €: "NVDA es el
25 % de tu mezcla: 2500 €. Una caída como su peor desde 2016 (−66 %) =
−1650 € de tus 2500 €." Es la forma del principio de toda la app: ningún
porcentaje sin sus euros. Los euros salen del porcentaje y los euros tal
como se muestran (66 % de 2500 €), no de la cifra exacta (−66,37 % daría
−1659 €): así la cuenta se puede comprobar a mano. Por lo mismo, cada
diferencia entre dos cifras se calcula con las cifras redondeadas que se
ven.

**Cambio respecto a antes:** *Para tener en cuenta* tenía su propio
hallazgo de concentración para *Mi cartera* con un umbral del 40 %, y la
mezcla avisaba por encima del 20 % (ver el punto 4 de lo discutible de
[mezclas](mezclas-y-acciones.md)). Ahora hay un solo umbral, el 20 %, y
lo dice una sola sección: el chequeo. La tabla de la mezcla con la acción
y con su índice en su lugar sigue en *Para tener en cuenta*.

## Ahorro a largo plazo

**En palabras:** una cuenta de ahorro no sube ni baja, pero con los años
los precios suben más que su interés. La app dice cuánto vale lo ahorrado
en euros de hoy, frente a lo puesto y frente a lo que habrían dado las
acciones del mundo con las mismas cantidades. Las dos caras van seguidas,
una frase corta cada una: lo que el ahorro deja de ganar, y la peor caída
de las acciones en los datos sobre ese dinero. Después, su caso malo.

**Cuándo:** el plan invierte en Ahorro y mira 10 años o más.

**Exacta:** lo que vale es el número grande del plan (interés del 1,5 %
menos la inflación de "Subida de precios en", ver
[inflación](inflacion.md)); la referencia es el índice Mundo (MSCI World,
1988–2022) con sus cifras de siempre y la misma inflación, con el mismo
cálculo del número grande (típico) y su percentil 10 de los futuros
simulados (malo). La peor caída es la mayor de las crisis de *Probar mi
plan* que cubren los datos del Mundo: 2000–2002, −46 % después de la
subida de precios (de fin de 1999 a fin de 2002; 2008 fue −41 %). Se
aplica a lo que dan típicamente al final, cuando más dinero hay: lo más
que puede quitar una caída así. Como en todo el chequeo, los euros salen
del porcentaje y de la cifra tal como se ven (46 % de 185.207 €). Los
datos son anuales (de fin de año a fin de año): dentro de cada año la
caída pudo ser mayor, y por eso la frase dice "al menos".

**Ejemplo:** 10.000 € y 200 € al mes durante 30 años: "En 30 años, el
ahorro vale 75.587 € de hoy. Son 6413 € menos de lo que pones. Las
acciones del mundo (1988–2022) suelen dar 185.207 €. Con Ahorro
terminarías con 109.620 € menos que con acciones del mundo. Pero las
acciones pueden caer: entre 2000 y 2002 cayeron al menos un 46 %
(−85.195 €). Suben y bajan: 1 de cada 10 futuros acaba por debajo de
84.709 €."

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
- Ningún producto: la referencia del ahorro es un índice ("las acciones
  del mundo"), no un fondo.

## Supuestos

- Los 1000 futuros simulados (ver [futuros simulados](futuros-simulados.md))
  representan lo que puede pasar en pocos años.
- La peor caída guardada de una acción es una referencia de lo que puede
  caer, no un límite: puede caer más.
- Las acciones del mundo de 1988–2022 son una referencia razonable para
  comparar un ahorro a largo plazo. Su peor caída en esos datos
  (2000–2002) es una referencia, no un límite: puede haber caídas
  mayores, como la de 1929–1931 en el S&P 500.

## Fuentes

Las de los modelos que usa: [crecimiento](crecimiento.md),
[futuros simulados](futuros-simulados.md), [inflación](inflacion.md) y
[mezclas](mezclas-y-acciones.md); para las acciones, los precios diarios
de Yahoo Finance o Stooq resumidos en `public/data/prices.json` (peor
caída y cambio de 12 meses).

## Validación (tests)

- `src/lib/plan-check.test.ts`: cuándo aparece y cuándo no cada
  observación (menos de 5 años frente a 5; sin oscilación; menos de 1 de
  cada 10 por debajo; una meta próxima; una acción al 20 % frente al
  25 %; fondos indexados fuera; Ahorro a 9 años frente a 10); que la
  cuenta coincide con los futuros del gráfico; el orden; y la redacción,
  en inglés y en español: euros en lo que destaca, ningún porcentaje sin
  euros, sin palabras de consejo ni de compra o venta, frases cortas.
- `src/lib/findings.test.ts`: la concentración ya no es un hallazgo de
  *Para tener en cuenta*.
- `src/components/money/entry.test.ts`: la sección no sale si nada
  destaca, sale tras "¿Y si…?" y antes de *Mis metas*, con su enlace a
  *Cómo funciona*.
- `src/components/plain-language.test.ts`: el resultado de un plan a 3
  años, de una mezcla con una acción y de un ahorro pasa la regla de los
  euros.

## Límites

- Una observación por clase y solo tres clases: no es una revisión
  completa del plan (no mira comisiones, impuestos ni divisas).
- El horizonte de una meta se mira en años enteros.
- *Mi cartera* solo cuenta las posiciones en euros.

## Lo discutible

1. **"1 de cada 10" como umbral.** Con 8 de cada 100 futuros por debajo
   no se dice nada, aunque no es poco. *Coste:* decidir otro umbral o
   decirlo siempre que haya años cortos.
2. **El 20 % para una acción.** Es una convención (un quinto), no un
   resultado de los datos. *Coste:* justificarlo con la oscilación de
   cada acción frente a su índice.
3. **La referencia del ahorro.** Se compara con las acciones del mundo
   1988–2022 (4,45 % al año después de la inflación), no con el 5 % de
   partida de la calculadora: son cifras distintas para cosas parecidas
   (ver [valor inicial](valor-inicial.md), punto 4). Comparar con acciones
   puede leerse como una sugerencia; por eso va con su caso malo.
   *Coste:* revisarlo con el profesional de la ficha legal.
4. **El plan tal cual.** El chequeo no mira el "¿Y si…?" aplicado, para
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
