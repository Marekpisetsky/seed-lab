# projects/

Los productos de Horalis: herramientas digitales gratuitas y privadas,
útiles en cualquier país y hechas en Europa. Hoy hay uno publicado, [Horalis Crecimiento](wealth-lens/).
[Horalis Coste de vida](cost-lens/) y [Horalis Inflación](inflation-lens/) son betas
ocultas, hechas con Forja: funcionan, pero aún no están publicadas ni se
muestran en el hub (las cifras de Horalis Inflación son, además,
provisionales).

## Qué pide cada producto

Un producto entra aquí cuando cumple estas cuatro cosas:

1. **Funciona de punta a punta.** No es una demo: alguien puede usarlo
   hoy, gratis, en su web.
2. **Cumple el principio 1 desde el primer día.** Ningún dato personal
   sale del dispositivo: sin cuentas, sin cookies, sin analítica.
3. **Se mide contra los cinco principios.** Su fila en
   `packages/seed-kit/src/tools.json` dice, principio a principio, si cumple, si
   cumple en parte o si está pendiente, y por qué. Lo pendiente va a la
   hoja de ruta del hub, no se esconde.
4. **Nace de la plataforma de Horalis.** Se construye sobre seed-kit
   (`packages/seed-kit`), importado desde el código y no copiado: sus
   colores, la cabecera y el pie de Horalis (con EN/ES y el lanzador),
   la lista de herramientas y las comprobaciones de peso, privacidad y
   lenguaje sencillo.

## Cómo nace un producto

Con Forja: `python tools/forja/forja.py new <id> --tipo web-tool
--categoria money` (o `life`). El molde `web-tool` crea
`projects/<id>/`, una herramienta estática sin framework, como el hub, ya
conectada a seed-kit: EN y ES, cabecera y pie, una página de ejemplo con
un cálculo real, privacidad y condiciones, tests que pasan, un límite de
50 KB por página y su README. Forja ejecuta sus tests al crearla y avisa
si fallan, y la añade a la lista de herramientas como beta oculta. Ver
[`../tools/forja/README.md`](../tools/forja/README.md).

Un producto puede necesitar más (Horalis Crecimiento usa Next.js); entonces
importa seed-kit igual: sus colores, su cabecera y su pie (componente de
React) y su lista.

## Qué lleva su README

Abre con dos cosas, en este orden:

1. **Misión:** una frase que diga para quién existe y por qué importa.
2. **Qué NO es:** lo que el producto no va a intentar cubrir, aunque sea
   tentador añadirlo después.

Después: cómo cumple cada principio, cómo se construye y se comprueba, y
su estado.

## Reglas comunes

- Cero coste: nada depende de un servicio de pago para existir.
- Al menos en inglés y en español, con frases cortas y sin jerga.
- Cada página por debajo de 350 KB en la primera visita (comprimida); las
  herramientas del molde `web-tool`, por debajo de 50 KB. Y con 95 o más
  en Lighthouse para móvil.
- Código propietario (ver [`LICENSE`](../LICENSE)); uso gratuito.
