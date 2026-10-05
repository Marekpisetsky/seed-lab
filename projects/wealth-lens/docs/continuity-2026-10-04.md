# Continuidad de Wealth Lens — 4 de octubre de 2026

Este documento recupera el contexto de las sesiones de Claude a partir de
las instrucciones que Marek compartió, los archivos del proyecto y los PR.
No sustituye el spec de `../README.md` ni las fichas de `research/`.

Actualizado el 5 de octubre: se corrigieron los hallazgos de consistencia
del escenario histórico y se verificó la base en Windows. La fase 5 sigue
pendiente de su encargo completo.

## Para qué existe seed-lab

Marek quiere construir una empresa europea con la ambición y disciplina de
producto de NVIDIA, Google o Microsoft. La dirección es que Europa tenga
tecnología propia y que las personas puedan usar herramientas gratuitas sin
entregar sus datos. La ambición describe el futuro; no afirma que hoy exista
una plataforma continental o una empresa de esa escala.

En esta conversación añadió una motivación: dar información y herramientas
para que las personas tengan más autonomía económica, en un futuro en que
trabajar para vivir pudiera dejar de ser necesario. Es una aspiración del
fundador, no una previsión económica ni una promesa de rentabilidad de la app.

La dirección vigente vive en `../../../docs/direction.md`. Hoy el primer
peldaño son herramientas personales; el uso sostenido aún no está demostrado.
Forja fabrica, seed-kit aporta las piezas y Research valida los métodos.
Las herramientas publicadas son gratuitas; el código sigue siendo propietario.

Wealth Lens permite entender cuánto podría crecer el dinero, qué ingreso
mensual podría dar y dónde alcanzaría. Informa de consecuencias y supuestos;
no recomienda inversiones, pesos de cartera ni decisiones personales.

## Estado recuperado y límites de acceso

- Repositorio: <https://github.com/Marekpisetsky/seed-lab>.
- La copia local original estaba en `9d21ade`, el merge del PR #1. Se hizo
  `git fetch`; no se cambió su rama ni su árbol de trabajo.
- `origin/master` observado: `149a6ba`, actualización de precios del
  4 de octubre de 2026. Último PR de producto fusionado: #25.
- Base de esta continuidad: `e1a5d7d`, cabeza de
  `claude/wl-p4-research`, en un worktree separado `seed-lab-codex`.
- Rama de continuación preparada: `codex/wl-p5-wishes`. El nombre de la rama
  no significa que la fase 5 esté implementada.
- El enlace compartido de Claude devolvió una página de acceso, sin mensajes.
  No se leyó la conversación completa ni se accedió a una sesión autenticada.
- La búsqueda del segundo cerebro local no encontró notas de seed-lab o
  Wealth Lens. Eso no demuestra que no existan en otra ubicación o sesión.
- El contexto copiado por Marek y los PR permiten reconstruir las decisiones
  publicadas; cambios sin commit en el entorno remoto de Claude no se pueden
  recuperar desde GitHub.

## PR pendientes: una cadena, no cuatro trabajos independientes

| PR | Rama | Qué contiene | Estado observado |
| --- | --- | --- | --- |
| [#26](https://github.com/Marekpisetsky/seed-lab/pull/26) | `claude/wl-p1-money` | Fase 1: Mi dinero, animación FLIP, futuros explicados, década histórica, retiro 2–7 %, fechas y euros junto a porcentajes. | Abierto |
| [#27](https://github.com/Marekpisetsky/seed-lab/pull/27) | `claude/wl-p2-test` | Fase 2: Probar mi plan, tarjetas por crisis, una cifra en euros y detalle. | Abierto; incluye #26 |
| [#28](https://github.com/Marekpisetsky/seed-lab/pull/28) | `claude/wl-p3-theme` | Fase 3: claro, oscuro y automático; accesibilidad y daltonismo en la base común. | Abierto; incluye #27 |
| [#29](https://github.com/Marekpisetsky/seed-lab/pull/29) | `claude/wl-p4-research` | Fase 4: Research, fichas de modelos, Kelly educativo y reglas de informar sin aconsejar. | Abierto; incluye #28 |

La ascendencia de las tres parejas de ramas se comprobó con
`git merge-base --is-ancestor`. Los PR describen el orden #26 → #27 → #28 → #29
y que Marek los revisa antes de fusionar. Esta recuperación no autoriza a
fusionarlos ni a publicar cambios en producción.

**No tocar el [PR #17](https://github.com/Marekpisetsky/seed-lab/pull/17)**,
ni su rama `claude/compassionate-keller-0k3yrm`: es la migración a
statichost.eu que Marek ha descartado para esta continuación. No hacer
cherry-pick, merge, rebase, cierre ni cambios en esa rama.

## Decisiones posteriores que sustituyen los encargos iniciales

- El tracker de tres módulos del primer prompt evolucionó hacia My money,
  My stocks y Test my plan. No restaurar los módulos antiguos.
- El precio en vivo y `localStorage` se quitaron en el PR #3. La app es
  estática; no consulta APIs externas durante el uso. Los archivos propios
  del sitio, incluido un gráfico al abrirlo, sí se pueden solicitar.
- La interfaz y las explicaciones son EN/ES. El inglés solo del primer
  prompt quedó superado. Todo texto visible usa los diccionarios tipados.
- La ronda de crecimiento, etiqueta Custom, líneas y acciones en mezclas
  ya se fusionó en el [PR #13](https://github.com/Marekpisetsky/seed-lab/pull/13).
- La entrada volvió a evolucionar: ahora se escribe crecimiento después
  de inflación (5 % al comenzar), con el equivalente antes de inflación
  debajo. No aplicar otra vez el campo nominal del encargo antiguo.
- Para una acción en una mezcla o cartera se iguala la **media esperada**
  de su índice, no la mediana. Sus altibajos mayores reducen el resultado
  típico. El texto de concentración debe describir las cifras calculadas;
  no prometer que el resultado central apenas cambia.
- Las líneas publicadas son semanales y normalizadas, no cierres diarios
  redistribuidos. El README documenta la decisión y su riesgo residual;
  esta recuperación no verifica jurídicamente las licencias.
- Nada personal se almacena: plan, holdings y archivos viven en memoria.
  La fase 3 añade una excepción explícita, solo para el tema elegido:
  `sessionStorage`, clave `sk-theme`, durante la pestaña.
- Cada meta se calcula por separado contra el mismo plan. Hoy comprar
  algo no reduce el capital de otra meta: cambiar ese contrato requiere
  una decisión y su ficha de Research.

## Punto donde se interrumpió Claude

La última frase recuperada sitúa el trabajo en la **fase 5: deseos con
fecha y precios por país**, para Países Bajos, España, Alemania, Francia,
Italia y Portugal. Claude anunciaba ejemplos de horizonte corto, medio y
largo, y búsqueda de cifras con fuente y fecha, empezando por España.

No hay rama de fase 5 publicada ni cambios de esa fase en la cabeza de #29.
Lo confirmado en el código:

- `Goal` no admite una fecha objetivo nueva; `LegacyGoal.targetDate` es de
  los archivos antiguos y no equivale a soporte actual de deseos con fecha.
- `connections.json` contiene 19 compras con fuentes. No tiene una tabla
  de precios por los seis destinos.
- `goalStatuses` calcula cuándo se alcanzaría cada meta y limita a 60 años;
  una fecha calculada no es una fecha deseada introducida por la persona.
- La versión exportada del archivo del plan es la 8.

## Hallazgos de la revisión independiente

Revisión de solo lectura con GPT-6 Astra, razonamiento alto, seguida de
correcciones con tests de regresión y fichas actualizadas el 5 de octubre:

1. **Aportación necesaria y década mala.** En `src/lib/calculator.ts`,
   `goalStatuses` incorpora la década mala al calcular cuándo se alcanza
   una meta, pero no al calcular la aportación necesaria para una meta
   fuera de alcance. Caso reproducido por el revisor con los datos del
   S&P 500: 1.000 € iniciales, cero aporte y meta de un millón. Propone
   766,21 €/mes para 30 años, que con la década 2000–2009 seleccionada
   producen unos 790.322 €. Ya existía en master. **Corregido:** la
   inversión de la fórmula incorpora la misma década. Tests aplican la
   aportación propuesta al mismo escenario y comprueban la meta a 30 años;
   incluyen aportes existentes, cero capital y mezclas con/sin reequilibrio.
2. **Explicación de los futuros y década mala.** `futures-view.tsx`
   dibuja la línea gruesa desde `yearlyPath(scenario)`, incluyendo la
   década mala activa, pero obtiene líneas finas y banda sin esa década.
   Su leyenda llamaba a la gruesa resultado con crecimiento medio.
   **Corregido:** leyenda y explicación distinguen la curva histórica
   de los futuros sin esa década impuesta. No cambian las simulaciones.
3. **Ficha de concentración.** `research/wealth-lens/mezclas-y-acciones.md`
   decía que el caso del medio «apenas cambia». El modelo actual
   iguala la media aritmética esperada; sus tests comprueban que el caso
   central de una acción más volátil puede bajar. **Corregido:** la ficha
   y el comentario en `mix.ts` describen ese contrato, como ya hacía la UI.

La diferencia entre proyección mensual y simulación anual, las divisas y
los dos umbrales de concentración son limitaciones ya documentadas por
Research; no se presentan como nuevos bugs de esta recuperación.

Falta el encargo completo de las fases 5 y 6. Antes de implementarlas hay
que recuperar, al menos, qué significa la fecha deseada, cómo se aplica el
país a cada compra y si gastar debe descontarse del plan. No inventar esas
reglas a partir de la última frase de Claude.

La fase 6 solo aparece mencionada en Research como «Chequeo de tu plan»,
con el umbral de concentración del 20 %. Esa mención no es su spec completo.

## Archivos por los que retomar

Rutas relativas a `projects/wealth-lens/` salvo indicación:

| Área | Archivos |
| --- | --- |
| Reglas y producto | `AGENTS.md`, `README.md`, raíz `docs/direction.md` |
| Plan y tipos | `src/lib/types.ts`, `app-store.ts`, `validation.ts`, `data-file.ts` |
| Metas y compras | `src/lib/calculator.ts`, `connections.ts`, `src/data/connections.json` |
| Interfaz de metas | `src/components/money/goals-section.tsx`, `things-section.tsx`, `where-details.tsx` |
| Idiomas | `src/i18n/messages/en.ts`, `es.ts`, `src/components/plain-language.test.ts` |
| Modelos | `src/lib/finance.ts`, `investment.ts`, `mix.ts`, `simulation.ts`, raíz `research/wealth-lens/` |
| Países compartidos | raíz `packages/seed-kit/src/cost-of-living.ts`, `src/data/` |
| Navegador | `e2e/money.test.mts`, `colours.test.mts` |

Antes de escribir código de Next.js, leer la guía aplicable en
`node_modules/next/dist/docs/`: la versión fijada es 16.3.7.
Para lógica nueva o bugs: test que falla primero, cambio mínimo y revisión.
Cada método o supuesto nuevo necesita su ficha en Research en el mismo cambio.
Antes de cada commit: lint, tipos, tests y build.

`public/data/` es generado por el Action y su único escritor es ese job.
No commitear una regeneración local ni reemplazar los datos de master con
los más antiguos de una rama. Al integrar, conservar los datos de master.

## Verificación de esta recuperación

Sobre `e1a5d7d`, sin cambios en la lógica:

- `npm ci --no-audit --no-fund` con el lockfile del proyecto.
- `npm test -- --reporter=dot`: 59 archivos, 781 tests pasan.
- `npm run build`: tipos pasan y exportación estática completa.
- `npm run lint`: pasa.
- seed-kit `npm run check`: lint, tipos y 54 tests pasan tras corregir
  la ruta del archivo TypeScript generado por un test en Windows. La ruta
  del import debe llevar `/`, no las barras invertidas del sistema.
- Las pruebas de navegador especifican ahora su idioma: las de My money
  usan el del caso EN/ES y las de tema/contraste usan `en-GB`. Sin ello,
  Chromium en este Windows prefería español, el sitio redirigía a `/es`
  y los selectores ingleses agotaban su espera. El comportamiento de la
  app era correcto; faltaba fijar el entorno del test.
- El test del espacio bajo crecimiento comprueba las líneas reservadas
  por el diseño (dos en móvil, una en pantalla ancha), que el texto cabe
  y el espacio entre filas. No supone que todas las fuentes del sistema
  partan las mismas palabras exactamente en el mismo número de líneas.

Sobre la continuación, después de las correcciones:

- Wealth Lens: 785 tests unitarios; lint, tipos y build pasan.
- Navegador: 25/25 pasan, sin pruebas omitidas; incluye EN/ES,
  360/1366/1920 px, temas, contraste, daltonismo, animación y CLS.
- seed-kit: 54/54 pasan con lint y tipos.
- Revisión final local de las correcciones: inversión de la fórmula,
  escenarios y fronteras, diccionarios, privacidad y tamaño del cambio.
  El segundo pase del revisor remoto no terminó por falta de créditos;
  no se presenta como una segunda aprobación independiente.

Entorno local: Windows, Node 24.19.0 y npm 11.12.1. seed-kit declara
Node 22.x; los resultados locales no sustituyen una comprobación con esa
versión si se requiere comparar exactamente con las sesiones anteriores.
No se han vuelto a medir Lighthouse ni los tiempos de recálculo; las cifras
históricas del README siguen siendo mediciones de aquellas sesiones.
