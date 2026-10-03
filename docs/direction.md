# Dirección de seed-lab

seed-lab construye herramientas digitales gratuitas y respetuosas con la
privacidad para Europa. No vendemos a gobiernos: publicamos herramientas
gratuitas que ciudadanos, desarrolladores e instituciones adoptan por su
cuenta. Wealth Lens es la primera herramienta y la prueba de estos
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

Como NVIDIA y ASML, seed-lab busca ser imprescindible en una capa antes de
ampliarse a la siguiente. Y lo hace con los valores de Proton (privacidad,
transparencia, financiación por los propios usuarios), no con el modelo de
las grandes tecnológicas de EE. UU., que viven de los datos de quien las
usa.

Hoy esa capa son herramientas personales que funcionan en el dispositivo
de quien las usa. No hay ingresos ni pagos: todo es gratis, y mantenerlo
cuesta cero (regla de seed-lab). Si algún día hay financiación, vendrá de
los usuarios, nunca de vender sus datos ni de contratos con gobiernos.

## Cómo construimos: la plataforma

Como NVIDIA, que levanta cada producto sobre su propia infraestructura en
vez de empezar de cero, cada herramienta de seed-lab nace de una base
común, interna, con tres papeles: **Forja fabrica, seed-kit son las
piezas y Research decide y valida los métodos**.

- **seed-kit** ([`packages/seed-kit`](../packages/seed-kit/README.md)):
  los colores (`tokens.css`), la cabecera y el pie de seed-lab (con el
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
esta plataforma.** El hub y Wealth Lens ya están construidos sobre ella.

La plataforma es infraestructura interna, no un producto: no se publica
por separado ni es el peldaño 2 de la escalera (herramientas para
desarrolladores que otros adoptan), y mucho menos el 3. Si alguna de sus
piezas se publica algún día, será al subir ese peldaño y con su condición.

## Escalera

Cada peldaño se sube solo cuando se cumple su condición. **Hoy estamos en
el peldaño 1.** Los peldaños 2, 3 y 4 no existen todavía, y nada en seed-lab
debe presentarlos como existentes.

| Peldaño | Qué es | Condición para pasar al siguiente | Estado |
| --- | --- | --- | --- |
| 1 | Herramientas que la gente usa. Hoy: Wealth Lens. | Uso real sostenido. | **Estamos aquí** |
| 2 | Herramientas gratuitas para desarrolladores que otros adoptan: las piezas con las que se hizo Wealth Lens, publicadas por separado. | Que terceros construyan sobre ellas sin que se lo pidamos. | Todavía no existe |
| 3 | Plataforma de la que dependen terceros: alojamiento, datos e identidad europeos. | — | Todavía no existe |
| 4 | Infraestructura a escala continental. | — | Todavía no existe |

Como no recogemos datos, el "uso real sostenido" del peldaño 1 no se mide
con analítica. Se ve en señales que no piden nada a nadie: correos que
llegan a la dirección de contacto, menciones, personas que la recomiendan.

## Misión

> "seed-lab builds free, privacy-first digital tools that Europeans —
> citizens, developers and public bodies — can use without giving up their
> data."

seed-lab construye herramientas digitales gratuitas y centradas en la
privacidad que los europeos (ciudadanos, desarrolladores y organismos
públicos) pueden usar sin renunciar a sus datos.

## Principios

1. **Your data never leaves your device.** Todo se calcula en el
   dispositivo. Sin cuentas, sin cookies, sin analítica, sin servidores
   que guarden nada del usuario.
2. **Transparent: free to use for everyone; our methods and data sources
   are public, our code is ours.** Cualquiera puede usar las herramientas
   gratis. Cómo se calcula cada cifra y de dónde salen los datos se
   publica, con su origen y su fecha. El código es de seed-lab.
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

Son compromisos de seed-lab, no de un producto: valen para cualquier
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
  y las fuentes son públicos, pero el código es de seed-lab: no se puede
  copiar ni usar para otros productos sin permiso escrito.
- **No somos todavía una plataforma ni una infraestructura.** Esos son los
  peldaños 3 y 4, y no existen.

## Reglas de trabajo

Las del [README](../README.md): cero coste, verificación antes que
promesa, solo lo que existe (lo pendiente va a la hoja de ruta), un solo
sistema visual para todo seed-lab y nada empieza de cero: cada producto
nace de la plataforma.

## Contacto

seedlab.eu (arroba) proton.me. En las webs la dirección se escribe de
forma que los bots no la recojan fácilmente.
