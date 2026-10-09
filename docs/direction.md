# Dirección de Horalis

## El Norte (aclaración de Marek, 9 de octubre de 2026)

**Horalis. Own your hours. / Tus horas, tuyas.** Horalis (antes seed-lab)
hace herramientas digitales gratuitas y privadas, útiles en cualquier
país, construidas en Europa y sin depender de servidores de EE. UU. Deben
funcionar durante años sin que nadie las toque, como un programa de
escritorio. La visión de fondo: que la información deje de estar
centralizada y rastreada; cada cálculo ocurre en el dispositivo de la
persona, y ninguna herramienta depende de un servidor central para
funcionar.

El nombre cambia en lo que ve la gente y en la documentación. El
repositorio, las carpetas y los proyectos de Vercel conservan el nombre
antiguo hasta que Marek los cambie. Forja y seed-kit son internos y
conservan el suyo. El símbolo sigue siendo la semilla verde.

Antes de escribir código, cada herramienta se define por **una pregunta**.
Si un dato no cambia la respuesta, no se pide. Si una pantalla no ayuda a
responder la pregunta, sobra.

| Herramienta | Pregunta | Datos que pide | Respuesta, en una frase |
| --- | --- | --- | --- |
| Horalis Crecimiento (1) (EN: Growth; antes Wealth Lens) | ¿Cuánto crecerá mi dinero? | lo que tengo, lo que añado al mes, dónde lo invierto, años | «En N años tendrás ≈ X (hoy valen ≈ Y)» |
| Horalis Crecimiento (2) | ¿Cuánto me genera hoy al mes? | lo que tengo, dónde lo invierto | «Hoy puedes retirar ≈ X al mes de forma sostenible» |
| Horalis Coste de vida (EN: Cost of Living; antes Cost Lens) | ¿Cuánto necesito para vivir en un país? | país (nada personal) | «Vivir en P cuesta ≈ X al mes; para vivir de tus inversiones allí necesitas ≈ Y» |
| Horalis Inflación (EN: Inflation; antes Inflation Lens) | ¿Cuánto vale hoy un importe de otro año? | importe, año, país | «100 de 2010 compran hoy lo que N entonces» |

Reglas para todo:

1. **Sin mantenimiento.** Nada se actualiza a diario ni depende de webs
   que cambian. Solo datos de organismos oficiales (Banco Mundial, OCDE,
   Eurostat, bancos centrales) o series históricas cerradas. Lo demás lo
   escribe el usuario.
2. **Global.** Cualquier país y cualquier moneda. Ningún texto supone que
   el usuario vive en Europa, salvo donde el dato sea europeo y lo diga.
3. **Nada sale del navegador.** Cero llamadas a servidores al usar las
   herramientas, cero cookies, cero analítica. Todos los datos van dentro
   del build.
4. **Honestidad.** Cada cifra muestra su fuente y su año. Las limitaciones
   se dicen en la propia pantalla.
5. **Se construye como NVIDIA:** lo que use más de una herramienta vive en
   `packages/seed-kit`, nunca copiado. Las herramientas nuevas salen de
   Forja.
6. **Menos dependencias = menos mantenimiento.** No se añaden paquetes npm
   salvo que sea imprescindible, y se justifica.
7. **Calidad en cada cambio:** EN y ES, contraste AA en claro y oscuro,
   móvil primero (360 px), Lighthouse ≥ 95, lint, tipos, tests y build.

Esta aclaración prevalece sobre lo que sigue donde choque: el alcance ya
no es «para Europa» sino útil en cualquier país, hecho en Europa. Lo que
sigue (modelo, escalera, principios) sigue vigente en lo demás.

## Punto de partida (antes del 9 de octubre de 2026)

Horalis construía herramientas digitales gratuitas y respetuosas con la
privacidad para Europa. No vendemos a gobiernos: publicamos herramientas
gratuitas que ciudadanos, desarrolladores e instituciones adoptan por su
cuenta. Horalis Crecimiento es la primera herramienta y la prueba de estos
principios.

El código es propietario: © 2026 Marek Pisetsky, todos los derechos
reservados ([`LICENSE`](../LICENSE)). Usar las herramientas publicadas es
gratis; los nombres y logotipos están protegidos
([`TRADEMARKS.md`](../TRADEMARKS.md)).

## Visión (largo plazo)

> "Give Europe its own technology stack, so its citizens, companies and
> governments don't have to depend on anyone else's."

Que Europa tenga su propia pila tecnológica, para que sus ciudadanos,
empresas y gobiernos no tengan que depender de la de nadie más. Es una
dirección a largo plazo, no algo que exista hoy.

## Modelo

Marek aclaró la dirección el **5 de octubre de 2026**: Horalis es la casa
de las herramientas públicas, como Microsoft reúne productos; la ambición
para las herramientas financieras es ser un **«Office de las finanzas»**:
una familia conectada de herramientas cotidianas, gratuitas y comprensibles.
**Forja** es el centro de desarrollo de la infraestructura que las hace
posibles, con NVIDIA como referencia de ambición técnica. Son analogías
para orientar el proyecto, no afirmaciones de escala, capacidad o afiliación.

Europa es el punto de partida y la prioridad. La ambición es poder servir
a personas de todo el mundo, con una dirección común del proyecto y una
base compartida. El control central se refiere a los productos, sus métodos
y su infraestructura; los datos y las decisiones personales pertenecen
a quienes usan las herramientas.

El objetivo es dar a las personas información y medios para ganar autonomía,
incluida la posibilidad de depender menos del trabajo para vivir. La visión
de un futuro en el que trabajar no sea necesario para subsistir inspira la
dirección; las herramientas no prometen que ese futuro exista ni que una
inversión permita alcanzarlo.

Hoy esa capa son herramientas personales que funcionan en el dispositivo
de quien las usa. No hay ingresos ni pagos: todo es gratis, y mantenerlo
cuesta cero (regla de Horalis). Si algún día hay financiación, vendrá de
los usuarios, nunca de vender sus datos ni de contratos con gobiernos.

## Cómo se entiende una herramienta

**Una imagen vale más que mil palabras.** La pantalla muestra primero el
resultado y cómo cambia al mover un control: gráficos, progreso, comparaciones
y ejemplos concretos. El texto visible se limita a lo necesario para entender
qué se ve, qué se puede hacer y qué supuesto afecta al resultado.

- Una pregunta principal por pantalla y una acción principal clara.
- Frases cortas y palabras de uso cotidiano; evitar jerga financiera.
- Mostrar visualmente la relación entre una acción y su consecuencia.
- Fuentes, métodos y explicaciones extensas se abren al pedir detalles.
- Los supuestos y límites que cambian la interpretación permanecen junto al
  resultado. Reducir texto no significa ocultarlos.
- Los gráficos tienen etiquetas y una alternativa accesible. El color y los
  iconos no son el único medio para comunicar una cifra o una acción.

La prueba es que una persona nueva entienda el propósito y su siguiente paso
en unos cinco segundos, también en móvil. No añadir párrafos para explicar
una interacción que se puede hacer más clara.

## Deseos y autonomía financiera

Horalis Crecimiento conecta el ahorro con cosas que una persona desea conseguir:
tranquilidad, experiencias, vivienda, aprendizaje, proyectos propios o tiempo.
Estas son áreas a investigar, no una clasificación demostrada de los deseos
de los europeos. La investigación debe distinguir necesidades observadas,
aspiraciones expresadas y propuestas de diseño, con fuentes y fecha.

La persona elige su deseo o escribe uno propio. Los ejemplos sirven para
descubrir posibilidades, con costes estimados relevantes para su país, y ver
cuánto falta y cuándo podría alcanzarlas con su ahorro. Por ejemplo,
100 €/mes desde cero permiten reunir 600 € en seis meses sin rendimiento
ni cambios de precio. No recomendar compras, inversiones ni pesos.

«Corto, medio y largo» fue una propuesta de Claude, no una regla de Marek.
El plazo resulta del deseo y del plan de cada persona. Europa es el alcance
de la investigación; los seis países de la sesión interrumpida son una
selección inicial, no un límite permanente de la visión.

Esta dirección no decide por sí sola cómo modelar una fecha deseada o
descontar un gasto del capital: esas reglas pertenecen al spec de la función
y a su ficha de Research.

## Cómo construimos: la plataforma

Como NVIDIA, que levanta cada producto sobre su propia infraestructura en
vez de empezar de cero, cada herramienta de Horalis nace de una base
común, interna, con tres papeles: **Forja fabrica, seed-kit son las
piezas y Research decide y valida los métodos**.

- **seed-kit** ([`packages/seed-kit`](../packages/seed-kit/README.md)):
  los colores (`tokens.css`), la cabecera y el pie de Horalis (con el
  selector EN/ES y el lanzador de herramientas), la lista única de
  herramientas, los idiomas y los formatos de números, la página de
  privacidad y condiciones, y las comprobaciones que toda página pasa:
  peso, nada de otros sitios, nada guardado en el navegador, lenguaje
  sencillo. Las apps lo importan desde el código, no lo copian: un
  arreglo en la base llega a todas.
- **Forja** ([`tools/forja`](../tools/forja/README.md)), con su molde
  `web-tool`: crea una herramienta nueva ya conectada a seed-kit, en
  inglés y en español, con un cálculo real de ejemplo, tests que pasan y
  un límite de 50 KB por página, y la añade a la lista como beta oculta.
- **Research** ([`research/`](../research/README.md)): decide y valida
  los métodos. Cada modelo y cada supuesto de una app tiene su ficha: la
  pregunta que responde, la fórmula en palabras sencillas, los supuestos,
  las fuentes con fecha, los tests que lo comprueban, sus límites y lo
  discutible. También están ahí las fichas que valen para todas las apps,
  como la legal "Informar, no aconsejar". **Ningún modelo ni supuesto de
  una app cambia sin su ficha en `research/`.**

Así, cada herramienta es privada, ligera y bilingüe desde el primer día,
sus cifras se pueden defender, y hacer una nueva cuesta horas, no semanas. **Todo producto nuevo nace de
esta plataforma.** El hub y Horalis Crecimiento ya están construidos sobre ella.

La plataforma es infraestructura interna, no un producto: no se publica
por separado ni es el peldaño 2 de la escalera (herramientas para
desarrolladores que otros adoptan), y mucho menos el 3. Si alguna de sus
piezas se publica algún día, será al subir ese peldaño y con su condición.

## Escalera

Cada peldaño se sube solo cuando se cumple su condición. **Hoy estamos en
el peldaño 1.** Los peldaños 2, 3 y 4 no existen todavía, y nada en Horalis
debe presentarlos como existentes.

| Peldaño | Qué es | Condición para pasar al siguiente | Estado |
| --- | --- | --- | --- |
| 1 | Herramientas que la gente usa. Hoy: Horalis Crecimiento. | Uso real sostenido. | **Estamos aquí** |
| 2 | Herramientas gratuitas para desarrolladores que otros adoptan: las piezas con las que se hizo Horalis Crecimiento, publicadas por separado. | Que terceros construyan sobre ellas sin que se lo pidamos. | Todavía no existe |
| 3 | Plataforma de la que dependen terceros: alojamiento, datos e identidad europeos. | — | Todavía no existe |
| 4 | Infraestructura a escala continental. | — | Todavía no existe |

Como no recogemos datos, el "uso real sostenido" del peldaño 1 no se mide
con analítica. Se ve en señales que no piden nada a nadie: correos que
llegan a la dirección de contacto, menciones, personas que la recomiendan.

## Misión

> "Horalis builds free, privacy-first digital tools that Europeans —
> citizens, developers and public bodies — can use without giving up their
> data."

Horalis construye herramientas digitales gratuitas y centradas en la
privacidad que los europeos (ciudadanos, desarrolladores y organismos
públicos) pueden usar sin renunciar a sus datos.

## Principios

1. **Your data never leaves your device.** Todo se calcula en el
   dispositivo. Sin cuentas, sin cookies, sin analítica, sin servidores
   que guarden nada del usuario.
2. **Transparent: free to use for everyone; our methods and data sources
   are public, our code is ours.** Cualquiera puede usar las herramientas
   gratis. Cómo se calcula cada cifra y de dónde salen los datos se
   publica, con su origen y su fecha. El código es de Horalis.
3. **Truly European: hosted in Europe, in Europe's languages, GDPR and
   European Accessibility Act compliant by design.** Alojado en Europa, en
   las lenguas de Europa, y cumpliendo el RGPD y la Ley Europea de
   Accesibilidad desde el diseño, no como parche.
4. **Light: small static pages, less energy, less cost.** Páginas
   estáticas y pequeñas: menos energía, menos coste, más rápidas en
   cualquier conexión.
5. **For everyone: clear enough for a child and their grandparent.** Lo
   bastante claro para un niño y para su abuelo: frases cortas, sin jerga,
   accesible con teclado y lector de pantalla.

Son compromisos de Horalis, no de un producto: valen para cualquier
herramienta que publiquemos. La página *Principles* del hub los concreta
en reglas que cualquiera puede comprobar (por ejemplo, ninguna app envía
datos personales a un servidor; cada página pesa menos de 350 KB en la
primera visita; todo está al menos en inglés y en español) y tiene una
tabla con cómo los cumple cada producto: cumple, en parte o pendiente.

Lo que falta, como el alojamiento actual en Vercel (EE. UU.), no se
esconde: está en esa tabla, en la página *Roadmap* del hub y en
[`hosting.md`](hosting.md).

## Objetivos de Desarrollo Sostenible relevantes

- **ODS 9 (Industria, innovación e infraestructura):** herramientas
  europeas gratuitas, también para desarrolladores, son una pieza de
  infraestructura digital que no depende de proveedores de fuera.
- **ODS 16 (Paz, justicia e instituciones sólidas):** herramientas que no
  recogen datos protegen la privacidad (meta 16.10), y publicar métodos y
  fuentes permite comprobar de dónde sale cada cifra.
- **ODS 12 (Producción y consumo responsables):** páginas pequeñas y
  estáticas gastan menos energía y menos hardware por visita. Es una
  contribución modesta, y por eso la medimos y la publicamos.

## Qué NO somos

- **No vendemos a gobiernos ni hacemos consultoría.** No hay contratos,
  licitaciones ni proyectos a medida. Una institución puede usar gratis lo
  que publicamos, por su cuenta, como cualquier otra persona.
- **No recogemos datos.** Ni cuentas, ni cookies, ni analítica. Lo que
  alguien escribe en una herramienta se queda en su dispositivo.
- **No somos una institución de la UE.** Ni la representamos ni hablamos
  en su nombre, y no usamos sus símbolos. "Europeo" describe para quién y
  dónde construimos, no una afiliación.
- **No regalamos el código.** Las herramientas son gratuitas y los métodos
  y las fuentes son públicos, pero el código es de Horalis: no se puede
  copiar ni usar para otros productos sin permiso escrito.
- **No somos todavía una plataforma ni una infraestructura.** Esos son los
  peldaños 3 y 4, y no existen.

## Reglas de trabajo

Las del [README](../README.md): cero coste, verificación antes que
promesa, solo lo que existe (lo pendiente va a la hoja de ruta), un solo
sistema visual para todo Horalis y nada empieza de cero: cada producto
nace de la plataforma.

## Contacto

horalis (arroba) proton.me. En las webs la dirección se escribe de
forma que los bots no la recojan fácilmente.
