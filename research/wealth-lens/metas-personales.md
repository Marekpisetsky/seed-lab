# Ficha: metas personales y vivir sin trabajar

- **App:** Horalis Crecimiento · **Revisada:** 5 de octubre de 2026.
- **Código:** `src/lib/calculator.ts`, `src/lib/types.ts`,
  `src/components/money/goals-section.tsx`, `src/i18n/goal-text.ts`.

## Pregunta

¿Cuánto capital me falta y cuándo podría cubrir mis gastos sin un sueldo?
La persona escribe sus gastos mensuales completos, incluida la vivienda,
en euros de hoy. Puede partir de lo que vive una persona media en un país
(datos oficiales del Banco Mundial, vivienda incluida) y ajustar la cifra;
al editarla pasa a ser un gasto propio.

## Método y fuentes

No se introduce otra teoría ni se proyecta una independencia garantizada.
Se reutilizan la [tasa de retiro](tasa-de-retiro.md), el
[crecimiento](crecimiento.md), el [coste de vida](coste-de-vida.md) y la
[década mala](decada-mala.md) elegidos en el mismo cálculo de todas las metas.

- Capital necesario = gasto mensual × 12 / tasa anual de retiro.
- Capital que falta hoy = máximo entre cero y capital necesario − capital
  actual. La barra muestra capital actual / capital necesario, entre 0 y 1.
- La fecha se calcula con los aportes mensuales y el crecimiento del plan,
  incluida una década mala seleccionada. No modifica el capital ni lo gasta.
- Ejemplo verificable: 1.200 €/mes al 4 % requieren 360.000 €; al 3 %,
  480.000 €. Con 60.000 € faltan 300.000 € en el primer caso.
- No hay una tasa universalmente correcta: el usuario mantiene el
  deslizador del 2–7 % y el modelo muestra cuándo se agotó el dinero.

## Límites visibles

La fila muestra la tasa y que el modelo de retiro cubre 30 años, sin garantía.
Los detalles explican que el dinero puede agotarse. Para quien deja de
trabajar joven, 30 años pueden ser insuficientes. No calcula impuestos,
comisiones, pensiones ni otros ingresos; la persona debe ajustar su gasto.
La estimación de un país no equivale a su presupuesto personal.

Elegir un país como meta añade directamente lo que vive allí una persona
media, vivienda incluida (una sola cifra oficial; ver
[coste de vida](coste-de-vida.md)). No significa que sepamos si la persona
alquila o es propietaria.

"Comprar algo" pide el nombre y el precio a la persona, con un ejemplo en
gris del tipo de cifra ("p. ej. 15.000"). No hay lista de precios.

Las prioridades son elegidas por la persona, no recomendaciones. Las metas
se calculan por separado; cubrir varias no significa poder pagarlas todas
a la vez. Marcar una estrella no cambia el dinero ni el cálculo.

## Validación

`personal-goals.test.ts`: capital al 4 % y 3 %, meta cubierta y fuera de
alcance, nombres EN/ES, archivo local con prioridades y nombre propio,
validación de importes. `e2e/money.test.mts`: país sin segundo paso, con
la fuente y los años de su cifra; "Comprar algo" con el precio de la
persona y su ejemplo en gris; barra de progreso, desmarcar prioridad y editar sin que
vuelva a marcarse. Los tests de las versiones anteriores siguen pasando.

## Historial

- 2026-10-05 — Solicitud de Marek: metas importantes propias, vivir sin
  trabajar relacionado con gastos propios o país, menos pasos y texto.
  Archivo local versión 10; se siguen leyendo las versiones 1–9.
- 2026-10-09 (fase A2): la meta de un país es una sola cifra oficial,
  vivienda incluida (ya no se puede quitar el alquiler); "Comprar algo" ya
  no tiene lista de precios. Archivo local versión 11; lee las versiones
  1–10 y avisa de lo que ya no existe.
