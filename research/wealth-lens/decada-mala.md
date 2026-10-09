# Ficha: década mala histórica

- **App:** Horalis Crecimiento · **Revisada:** 3 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/lib/decade.ts`
  (`historicalDecade`, `decadeYears`, `FAMOUS_DECADE`, `DECADE_YEARS`),
  `src/lib/what-if.ts` (`badStartHead`), `src/lib/findings.ts`
  (`sequenceFinding`), `src/lib/calculator.ts` (`valueAt` con `head`)

## Pregunta que responde

"¿Y si empiezo justo antes de una mala racha?" Es el "¿Y si…?" "Si tus
primeros 10 años fueran como 2000–2009" y el hallazgo de la mala primera
década: cuánto menos habría al final si los primeros años fueran como una
década real mala.

## Fórmula, en palabras sencillas

Los primeros 10 años del plan (o todos, si son menos) crecen año a año
como creció de verdad ese activo en una década concreta; después, el
dinero vuelve a crecer a su media. Qué década:

- **2000–2009**, la que perdieron casi todas las bolsas, si para ese activo
  fue peor que su media de 1988–2022;
- si no lo fue (para él fue una buena década), **su peor década** dentro
  de 1988–2022, nombrada con sus años.

| Activo | Media 1988–2022 | 2000–2009 | Década que usa |
| --- | --- | --- | --- |
| Acciones de EE. UU. (S&P 500) | 7,54 % | −3,03 % al año (−26,5 % en total) | 2000–2009 |
| Bonos alemanes | 2,47 % | +3,97 % al año | 2013–2022 (−2,46 % al año) |
| Oro | 1,04 % | +12,07 % al año | 1988–1997 (−8,19 % al año) |

Exacta: con X lo de hoy y Y la aportación, para cada año k de la década,
saldo_k = valor de (saldo_{k−1}, Y, r_k, 1 año) con la fórmula del
[crecimiento](crecimiento.md) y r_k el rendimiento real de ese año; después
sigue la fórmula normal con la media g. De qué está hecha la década:

- un activo: sus propios años;
- una mezcla: los años de sus partes, con sus pesos (reequilibrados cada
  enero o dejándolos correr, como diga la mezcla);
- crecimiento propio: los años de las acciones de EE. UU.;
- crecimiento u oscilación escritos: los mismos años movidos a ese
  crecimiento y estirados a esa oscilación, para que la década conserve su
  forma: log(1 + r') = log(1 + g') + (σ'/σ)·(log(1 + r) − log(1 + g)).
- Sin oscilaciones (ahorro, crecimiento propio con oscilación 0) no hay
  década mala.

## Supuestos

- Una década real es una forma clara de imaginar una mala racha: "como
  2000–2009" se entiende mejor que "el percentil 10".
- Tras la década, todo vuelve a la media, sin rebote ni castigo.

## Fuentes (con fecha)

- Los datos anuales de 1988–2022 del [crecimiento](crecimiento.md).
- El riesgo de secuencia (*sequence-of-returns risk*): lo que importa no
  es solo la media sino el orden de los años; ver Bengen (1994) en la
  [tasa de retiro](tasa-de-retiro.md).

## Validación (tests)

La aportación necesaria para una meta lejana usa la misma década activa.
Se calcula el recorrido de esa década desde cero con 1 €/mes; por
linealidad, se separa lo que viene del capital inicial de lo que viene de
las aportaciones. Para el plazo T, si A es el valor del capital sin
aportes y B el valor de aportar 1 €/mes, el importe necesario es
`max(0, (meta − A) / B)`. Si B es cero y la meta no está cubierta,
no hay una aportación finita que la alcance. Sin década se conserva la
fórmula mensual original. Esto corrige la inversa del escenario, no cambia
su crecimiento ni selecciona otros años históricos.

`src/lib/what-if.test.ts` comprueba que aplicar la aportación propuesta,
con la década mala todavía seleccionada, alcanza exactamente la meta a
30 años, tanto desde cero aportes como desde una aportación ya existente.

- `src/lib/decade.test.ts` (8): 2000–2009 para las acciones de EE. UU.;
  la peor década, con sus años, donde 2000–2009 fue buena (bonos
  2013–2022, oro 1988–1997); los años del plan si son menos de diez; sin
  oscilaciones no hay década; los años reales de un activo, uno tras otro;
  lo propio, con los años de las acciones de EE. UU. movidos al
  crecimiento escrito; una oscilación mayor, una década peor; las partes
  de una mezcla el mismo año, con sus pesos.
- `src/lib/what-if.test.ts` (18, "A bad first decade"): el "¿Y si…?" igual
  a aplicarlo, sus efectos en metas y países, y que no existe sin
  altibajos.
- `src/lib/findings.test.ts`: el hallazgo usa la misma década y da la
  misma cifra que el "¿Y si…?".

## Límites

- Es un escenario, no una probabilidad: dice cuánto, no cuán probable.
- Solo una década; una racha más larga (Japón desde 1990) queda fuera de
  los datos.

## Lo discutible

1. **Elegir la peor década es elegir a dedo.** Para bonos y oro se busca la
   peor de 35 años; para las acciones, 2000–2009, aunque 1999–2008 fue algo
   peor (S&P 500: −4,41 % al año). Es una decisión de
   claridad ("2000–2009" es reconocible), pero no es "la peor" para todos.
   *Coste:* decir "una de las peores" o usar siempre la peor.
2. **Volver a la media tras la crisis.** Después de una década mala las
   valoraciones suelen ser bajas y los rendimientos posteriores, mejores
   (2010–2019 fue muy buena para las acciones). Volver a la media sin más
   puede exagerar el daño a largo plazo; tampoco hay garantía de rebote.
   *Coste:* ninguno inmediato; decirlo en *Cómo funciona*.
3. **Estirar a otra oscilación.** La transformación conserva la forma de
   la década, pero aplicar la secuencia de las acciones de EE. UU. a un
   crecimiento escrito cualquiera es una analogía, no un dato.

## Historial

- 2026-10-03: primera ficha (sin cambios en el cálculo).
- 2026-10-05: la aportación necesaria para metas fuera de alcance incorpora
  la misma década histórica que el plazo de llegada. Prueba de regresión:
  1.000 € iniciales y meta de un millón; antes la cifra propuesta dejaba
  unos 790.322 € en 30 años, ahora alcanza la meta bajo ese escenario.
- 2026-10-09 (fase A2): sin Mundo, Nasdaq-100, acciones sueltas ni Mi
  cartera. El crecimiento propio usa los años de las acciones de EE. UU.
  (antes, los del Mundo). El oro, de la Pink Sheet del Banco Mundial: la
  misma década, 1988–1997.
