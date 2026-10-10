# Horalis Coste de vida

**Misión:** que cualquiera vea, en un momento y sin dar ningún dato, lo
que vale su dinero en otro país: "Con 2.500 € al mes en Países Bajos, en
Perú necesitarías ≈ 800 € para vivir igual", y dónde rinde más y menos,
con y sin vivienda.

**Qué NO es:**
- No es un buscador de pisos, sueldos ni ofertas de trabajo.
- No da precios en directo ni de una ciudad concreta: son medias de país,
  redondeadas y aproximadas.
- No aconseja mudarse ni dice dónde vivir: compara números.
- No guarda ni envía nada: no hay cuentas, ni servidor propio, ni
  analítica.

Estado: **beta oculta** (`"status": "beta"`, `"listed": false` en
`packages/seed-kit/src/tools.json`). Funciona y se puede publicar, pero ni
el hub ni los lanzadores la muestran hasta que pase a `"listed": true`.

## Qué hace

- Escribes una cantidad al mes, dónde vives y con qué país comparas.
- Dice cuánto necesitarías allí para vivir igual: la cantidad por lo que
  cuesta vivir allí frente a donde vives. Con vivienda (el número grande)
  y sin contar la vivienda (debajo).
- Lista los cinco países donde esa cantidad rinde más y los cinco donde
  rinde menos, con y sin vivienda a la vez: "×2" quiere decir que compra
  el doble que donde vives.
- Los países estimados por su nivel de precios llevan "≈", y cada cifra
  dice de dónde sale y de cuándo.

## Datos

Los 172 países de seed-kit (`packages/seed-kit/src/cost-of-living.ts` y
`data/`), los mismos que usa Horalis Crecimiento: una sola fuente.

- 30 detallados: Numbeo (gastos sin alquiler) y Wise (alquiler de un piso
  de un dormitorio fuera del centro), en euros, redondeados a 10.
- 142 estimados (≈): los costes de Países Bajos ajustados al nivel de
  precios de cada país frente al suyo (Banco Mundial); el alquiler, con
  ese número al cuadrado.

Solo viajan a la página las cifras derivadas y redondeadas que ya publica
Horalis Crecimiento (ver "Licencias de los datos" en su README). La página las
lleva dentro, en JSON: el navegador no pide nada a nadie.

## Cómo cumple los cinco principios

| Principio | Estado | Por qué |
| --- | --- | --- |
| Tus datos no salen de tu dispositivo | Cumple | Se calcula en tu navegador. No se guarda ni se envía nada. |
| Transparente | En parte | Gratis, con sus fuentes y fechas en la página. Los cambios de método aún no se listan. |
| Europeo de verdad | Pendiente | En inglés y español, pero alojado en EE. UU. Aún sin auditoría por personas. |
| Ligero | Cumple | Unos 17 KB por página, comprimida (límite del molde: 50 KB). |
| Para todos | En parte | Palabras sencillas, teclado y objetivos de 44 px. Aún sin probar con personas reales. |

## Cómo está hecha

Nació con [Forja](../../tools/forja/README.md) (molde `web-tool`) sobre
[seed-kit](../../packages/seed-kit/README.md): páginas estáticas, sin
framework, que Node 22 genera desde TypeScript. De seed-kit vienen los
colores, la cabecera y el pie de Horalis, la página de privacidad y
condiciones, el documento HTML, el script de idioma, los formatos de
números, los datos de países y sus nombres, el código para el navegador,
la medida del peso y las comprobaciones.

```
src/
  site.ts        id, nombre, dirección, límite de peso
  calc.ts        el cálculo, puro: equivalente, cuánto rinde, los extremos
  countries.ts   los países de seed-kit tal como los lleva la página (al construir)
  view.ts        el resultado y las dos listas en HTML: el build y el navegador
  i18n.ts        todas las palabras, en inglés y en español
  pages.ts       la herramienta, privacidad y condiciones, 404
  app.ts         el script del navegador: lee el formulario y redibuja
  styles.css     los estilos propios, después de los de seed-kit
  build.ts       genera dist/ (el del molde, sin cambios)
test/
  calc.test.ts   el cálculo y sus casos límite, y los datos reales
  site.test.ts   idiomas, cabecera y pie, sin peticiones ni almacenamiento,
                 peso por página, enlaces, fuentes, palabras sencillas
```

## Comandos

```bash
npm ci              # solo herramientas de desarrollo: lint y tipos
npm run build       # genera dist/ e imprime el peso de cada página
npm test            # construye en una carpeta temporal y lo comprueba todo
npm run check       # lint, tipos y tests
npm run serve       # lo construye y lo sirve en local
```

## Publicarla

Un proyecto de Vercel con *Root Directory* `projects/cost-lens`, *Build
Command* `npm run build`, *Output Directory* `dist` y la opción *Include
files outside the root directory in the Build Step* activada. La
dirección provisional, `https://seed-lab-cost-lens.vercel.app`, está en
`src/site.ts` y en su entrada de `tools.json`; si Vercel da otra, se
cambia en los dos sitios (un test comprueba que coinciden).
