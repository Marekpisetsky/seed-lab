# Ficha: futuros simulados

- **App:** Wealth Lens · **Revisada:** 3 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/simulation.ts`
  (`wealthPercentiles`, `wealthSamples`), `src/lib/normal.ts`
  (`normalReturns`), `src/lib/projections.ts` (`bandsFor`, `samplesFor`,
  `FUTURES`), `src/lib/mix.ts` (mezclas), `src/lib/monte-carlo.ts`
  (`mulberry32`)

## Pregunta que responde

"¿Y si los años no salen como la media?" Es "Si va mal" (en 1 de cada 10
futuros posibles terminas por debajo de X €), "Si va bien" (en 1 de cada
10, por encima de Y €), la franja sombreada de 8 de cada 10 en el gráfico
y la vista "¿De dónde salen estos futuros?".

## Fórmula, en palabras sencillas

Se escriben 1000 futuros posibles. Cada futuro se arma año a año sacando
al azar un año real de los datos (1988–2022) y aplicando lo que creció ese
año; un año puede salir varias veces. Después se ordenan los 1000
resultados de cada año: el que queda en el puesto 100 es "si va mal", el
del 500 es el del medio y el del 900 es "si va bien".

Exacta:

- Pasos anuales. Cada año, la mitad de las aportaciones del año entra al
  principio y la otra mitad al final:
  saldo ← (saldo + 6·Y)·(1 + r) + 6·Y, con r el rendimiento real sorteado.
- 1000 caminos, sorteo con reemplazo e independiente cada año (*bootstrap*
  i.i.d.), generador con semilla fija (Mulberry32, semilla 20260929): los
  mismos datos dan siempre los mismos futuros.
- Percentiles 10, 50 y 90 de los 1000 saldos de cada año, interpolando
  entre vecinos.
- Qué se sortea:
  - **un índice**: sus 35 años reales;
  - **una mezcla o Mi cartera**: un mismo año para todas sus partes a la
    vez, así que se mueven juntas como lo hicieron (ver
    [mezclas](mezclas-y-acciones.md));
  - **un crecimiento o unas oscilaciones propias**: no hay historia, así
    que cada año sale de una distribución lognormal,
    log(1 + r) ~ Normal(log(1 + g), σ²), representada por 2000 cuantiles
    equiespaciados (del 0,025 % al 99,975 %, ±3,5 σ). El año mediano crece
    exactamente g;
  - **el crecimiento propio de partida**: g = 5 % y σ = 17,82 % (la
    oscilación de las acciones del mundo de 1988 a 2022).
- La vista de futuros dibuja 50 de esos 1000 caminos, repartidos por igual
  entre ellos.

## Supuestos

- Cada año es independiente del anterior: no hay rachas, ni rebotes tras
  una caída, ni ciclos.
- Los 35 años de 1988 a 2022 contienen todo lo que puede pasar: nunca sale
  un año peor que el peor de los datos (Mundo: −40,8 % en 2008).
- La media y la oscilación se conocen sin error.
- Para lo propio: rendimientos lognormales (colas finas), con la
  oscilación de las acciones del mundo si no se escribe otra.

## Fuentes (con fecha)

- Los mismos datos anuales que el [crecimiento](crecimiento.md) (periodo
  común 1988–2022, compilados el 29 de septiembre de 2026).
- Método: *bootstrap* de Efron (1979), aplicado a carteras de jubilación
  desde Bengen (1994) y Cooley, Hubbard y Walz (1998, *Trinity study*),
  que usan secuencias históricas o remuestreadas.
- Inversa de la normal: aproximación de Acklam (error relativo < 1,2·10⁻⁹).

## Validación (tests)

- `src/lib/simulation.test.ts` (6): los percentiles interpolan entre
  vecinos; si todos los años rinden igual, coinciden con la fórmula del
  [crecimiento](crecimiento.md); con historia real se abren (bajo < medio
  < alto); misma semilla, mismo resultado; la caché da lo mismo con
  cualquier importe.
- `src/lib/normal.test.ts` (5): la inversa de la normal contra cuantiles
  conocidos; el año típico del grupo propio es g y su dispersión σ; nunca
  se pierde más de todo; a igual crecimiento, más oscilación dura menos.
- `src/lib/monte-carlo.test.ts` (17): el generador, reproducible y en
  [0, 1).
- `src/lib/mix.test.ts` (24): el sorteo conjunto de una mezcla (2022, con
  acciones y bonos cayendo a la vez).
- `src/lib/findings.test.ts` y `src/components/plain-language.test.ts`:
  cómo se dice ("en 1 de cada 10 futuros posibles…"), sin porcentajes sin
  euros.

## Límites

- Es una forma de imaginar la incertidumbre, no la incertidumbre real. Las
  probabilidades valen solo dentro del modelo.
- Con 1000 caminos, el percentil 10 tiene un error de muestreo de algunos
  puntos porcentuales; la semilla fija lo hace estable, no exacto.
- La franja no incluye lo que no está en los datos: guerras largas,
  hiperinflación, la Gran Depresión (1929–1932 está fuera del periodo).

## Lo discutible

1. **Independencia año a año.** El *bootstrap* i.i.d. borra la
   reversión a la media y las rachas. Hay debate: Siegel defiende que a
   largo plazo las acciones son menos arriesgadas por la reversión;
   Pástor y Stambaugh (2012, *Journal of Finance*, "Are stocks really less
   volatile in the long run?") concluyen que, contando la incertidumbre
   de los parámetros, son **más** arriesgadas. *Coste:* un *block
   bootstrap* (sortear tramos de 3–5 años) y comparar.
2. **La media se trata como conocida.** No sumar la incertidumbre de la
   media estrecha la franja, más cuanto más largo es el plazo: con 35
   años, el error de la media es de ~3 puntos al año. *Coste:* sortear
   también la media en cada camino (enfoque bayesiano sencillo).
3. **Muestra corta y truncada.** Nada peor que el peor año de 1988–2022.
   Para el S&P 500, la serie desde 1928 existe y tiene años peores
   (1931: −38,0 % real). *Coste:* va unido a la decisión de periodo de
   la ficha de [crecimiento](crecimiento.md).
4. **Colas finas en lo propio.** La lognormal subestima los extremos
   frente a los datos reales (curtosis). *Coste:* una t de Student o
   remuestrear residuos históricos.
5. **"1 de cada 10" suena a probabilidad objetiva.** Es una frecuencia
   dentro del modelo. La app lo explica en la vista de futuros, pero la
   frase del resultado no lo dice. *Coste:* un texto.
6. **Dos pasos de tiempo.** Las simulaciones van por años y el número
   grande por meses (ver [crecimiento](crecimiento.md), punto 6).

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
