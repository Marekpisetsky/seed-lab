# Ficha legal: informar, no aconsejar

- **Para:** todas las apps de Horalis · **Revisada:** 3 de octubre de 2026

> **Esto no es asesoramiento legal.** Es el criterio de trabajo de
> Horalis, escrito a partir de los textos públicos de la normativa
> europea. Antes de lanzar, conviene que lo revise un profesional (un
> abogado especializado en regulación de servicios financieros de la UE y
> de cada país donde se publique), y que lo vuelva a revisar cuando cambie
> la normativa o lo que hacen las apps.

## La pregunta

¿Dónde está el límite entre **dar información general** (lo que hace
Horalis) y **asesorar sobre inversiones**, un servicio reservado en la UE
a empresas autorizadas?

## El límite, según MiFID II

- **Asesoramiento en materia de inversión** es "la prestación de
  recomendaciones personalizadas a un cliente, sea a petición de este o
  por iniciativa de la empresa de servicios de inversión, con respecto a
  una o más operaciones relativas a instrumentos financieros"
  (Directiva 2014/65/UE, MiFID II, artículo 4, apartado 1, punto 4). Es un
  servicio de inversión (anexo I, sección A, punto 5) y exige
  autorización.
- **Una recomendación es personalizada** cuando se hace a alguien como
  inversor, se **presenta como adecuada para esa persona o se basa en sus
  circunstancias**, y **recomienda una operación sobre un instrumento
  financiero concreto**: comprar, vender, suscribir, canjear, reembolsar,
  mantener o suscribir en firme, o ejercer o no un derecho de ese
  instrumento (Reglamento Delegado (UE) 2017/565, artículo 9). **No es
  personalizada si se difunde exclusivamente al público.**
- Que se difunda por internet no basta para que sea "al público": una
  recomendación dirigida a una persona por un canal en línea puede ser
  personalizada (considerandos del Reglamento Delegado 2017/565,
  alrededor del 14 y el 15; *por verificar el número exacto*).
- **La información genérica** sobre tipos de instrumentos ("las acciones
  se mueven más que los bonos") no es asesoramiento en materia de
  inversión. Las "recomendaciones generales" sobre operaciones en
  instrumentos pueden ser un servicio auxiliar (anexo I, sección B, punto
  5) cuando las presta una empresa de inversión.
- **Otra norma a tener en cuenta:** el Reglamento sobre abuso de mercado
  (UE) 596/2014 (artículos 3.1.35 y 20) y su Reglamento Delegado (UE)
  2016/958 regulan las "recomendaciones de inversión": información que
  recomienda o sugiere, explícita o implícitamente, una estrategia de
  inversión sobre instrumentos o emisores concretos, destinada al público.
  Quien las publica debe presentarlas con objetividad y revelar sus
  conflictos de interés.
- **Guías:** CESR, *Understanding the definition of advice under MiFID*
  (CESR/10-293, 2010), con ejemplos de herramientas en sitios web; ESMA,
  Directrices sobre determinados aspectos de los requisitos de idoneidad
  de MiFID II (ESMA35-43-3172, 2023).

## Dónde está Horalis Crecimiento

**Lo que hace (información):** calcula, con las cifras que escribe la
persona, consecuencias de un plan (cuánto podría tener, cómo se movió,
cuánto duró un retiro) a partir de datos públicos y con métodos públicos
(las fichas de `research/`). No pregunta por la situación de la persona
más allá de esas cifras, no evalúa su idoneidad y **nunca recomienda una
operación sobre un instrumento concreto**. Dice que no es asesoramiento
(página *Acerca de*, condiciones, pie).

**Lo que hay que vigilar (de más a menos riesgo):**

1. **Nombres de fondos junto a un índice.** El selector muestra "p. ej.
   VUAA" junto al S&P 500, "VWCE" junto al Mundo, etc. No dice "compra",
   pero pone un instrumento concreto al lado de un resultado calculado con
   las cifras de la persona: es lo más cercano al límite que tiene la app
   y, según el Reglamento de abuso de mercado, podría leerse como una
   sugerencia implícita. *Opciones:* nombrar varios fondos, o el índice y
   su proveedor, o explicar que es solo un ejemplo de lo que sigue el
   índice. **Para revisar con el profesional.**
2. **Zonas del retiro ("prudente", "arriesgado").** Son etiquetas de los
   datos, no de la persona, pero suenan a juicio. Siempre van con su dato
   ("duró en 79 de cada 100"); ver la [tasa de
   retiro](../wealth-lens/tasa-de-retiro.md).
3. **Plantillas de mezcla (100 %, 80/20, 60/40).** Son las mismas para
   todos y se llaman ejemplos de libro de texto: información genérica. No
   deben decir nunca "para ti".
4. **"Chequeo de tu plan".** Las observaciones describen un hecho del
   plan con su cifra en euros; nunca dicen qué comprar, qué vender ni qué
   pesos poner, y la sección empieza diciendo que qué hacer lo decide la
   persona. La referencia del ahorro son "las acciones del mundo", un
   índice, nunca un fondo, y va con su caso malo. Ver el [chequeo de tu
   plan](../wealth-lens/chequeo.md); un test comprueba su redacción.
   **Para revisar con el profesional:** si comparar un ahorro con las
   acciones del mundo, con las cifras de la persona, puede leerse como
   una sugerencia.
5. **Mi cartera.** Lee las posiciones que la persona ya tiene y dice cómo
   se movieron y cuánto pesan; nunca qué hacer con ellas.

## Reglas de redacción para todas las apps

Comprobables (el test de lenguaje sencillo de seed-kit falla si aparecen,
en cualquier texto de cualquier app, también en las explicaciones):

1. Nunca "deberías", "debes", "tienes que", "te recomendamos", "te
   aconsejamos", "te sugerimos", "recomendado", "lo mejor para ti"; en
   inglés, "you should", "you must", "we recommend/suggest/advise",
   "recommended", "best for you" (`ADVICE` en
   `packages/seed-kit/src/plain-language.ts`).

De criterio (las revisa quien escribe y quien revisa):

2. Nunca "compra", "vende", "mantén", "cambia a" ni "invierte en" seguido
   de un instrumento, una empresa, un fondo o un activo.
3. Nunca ordenar productos para la persona ni elegir "el mejor".
4. **Siempre consecuencias y datos:** "Con 1.100 € y 100 € al mes, en 20
   años tendrías unos 43.500 €; en 1 de cada 10 futuros posibles, menos de
   23.500 €." (Plan de partida, calculado con los métodos de las fichas.) Cada porcentaje, con su equivalente en euros del dinero de la
   persona.
5. Siempre con su fuente y su periodo; lo pasado se llama pasado ("no es
   una promesa").
6. Las mismas opciones y ejemplos para todos; la elección es siempre de
   quien usa la app.
7. Un fondo o una empresa se nombran para identificarlos (lo que la
   persona ya tiene, o qué sigue un índice), nunca como sugerencia; mejor
   varios que uno.
8. Nunca "garantizado", "seguro" o "sin riesgo" para un rendimiento.
9. En cada app, visible: "No es asesoramiento financiero" (pie y
   condiciones) y un enlace a cómo se calcula.

## Fuentes

- Directiva 2014/65/UE (MiFID II), artículo 4.1.4 y anexo I.
- Reglamento Delegado (UE) 2017/565, artículo 9 y considerandos.
- Reglamento (UE) 596/2014 (abuso de mercado), artículos 3.1.35 y 20;
  Reglamento Delegado (UE) 2016/958.
- CESR/10-293 (2010); ESMA35-43-3172 (2023).
- Textos consultados en su versión pública (EUR-Lex y ESMA), octubre de
  2026. **Cada cita debe comprobarla el profesional.**

## Validación

- `packages/seed-kit/test/plain-language.test.ts`: el test de las
  palabras de consejo (EN y ES), que también deja pasar los avisos ("no
  te dice qué comprar ni qué vender").
- Cada app pasa su texto entero por ese test: Horalis Crecimiento
  (`src/components/plain-language.test.ts`), el hub (`test/build.test.ts`),
  Horalis Coste de vida y Horalis Inflación (`test/site.test.ts`).
- Al aplicarlo, el único texto que incumplía era el título "What you
  should know" de Horalis Crecimiento: ahora "Good to know" ("Para tener en
  cuenta").
- El chequeo de tu plan tiene además su propio test de redacción
  (`projects/wealth-lens/src/lib/plan-check.test.ts`): sin palabras de
  compra, venta o pesos ("compra", "vende", "mantén", "cambia", "reduce",
  "aumenta" y sus equivalentes en inglés), cada porcentaje con sus euros.

## Historial

- 2026-10-03: primera ficha; la regla 1 pasa a ser un test de seed-kit.
- 2026-10-07: el chequeo de tu plan, hecho y con su test de redacción;
  un punto más para el profesional (comparar el ahorro con las acciones
  del mundo).
