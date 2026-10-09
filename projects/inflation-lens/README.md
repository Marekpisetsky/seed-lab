# Horalis Inflación

**Misión:** que cualquiera vea, sin dar ningún dato, lo que valen hoy
sus euros de otro año en su país de la UE o en la zona euro, y al revés:
"100 € de 2010 compran hoy lo que ≈ 74 € entonces".

**Qué NO es:**
- No es una calculadora de inversiones ni de sueldos: solo cuenta cuánto
  subieron los precios.
- No da la inflación de este mes ni previsiones: usa años completos
  publicados por Eurostat.
- No dice qué hacer con tu dinero.
- No guarda ni envía nada: no hay cuentas, ni servidor propio, ni
  analítica.

Estado: **beta oculta** (`"status": "beta"`, `"listed": false` en
`packages/seed-kit/src/tools.json`), con **cifras provisionales** (ver
abajo). Mientras lo sean, un test impide mostrarla en el hub o en los
lanzadores.

## Qué hace

- Escribes una cantidad, eliges un año y un país de la UE, la zona euro o
  la Unión Europea, y el sentido: de ese año a hoy, o de hoy a ese año.
- Dice lo que vale (≈, en unidades enteras de la moneda de hoy del lugar:
  euros, złotys, coronas…), cuánto subieron los precios
  desde entonces y la frase para 100 €: "100 € de 2010 compran hoy lo que
  ≈ 74 € entonces".
- Una línea de tiempo sencilla: una barra por año con cuánto subieron los
  precios, los años desde el elegido en verde tras una línea discontinua
  (no solo por color: también la línea, en la leyenda y en el gráfico) y
  los anteriores en gris, ambos a 3:1 o más sobre la tarjeta; y la tabla
  año a año plegada debajo. Los descensos llevan el signo menos (−).
- "Hoy" es el último año completo de los datos.

## Datos

`src/data/hicp.json`: el IPCA (HICP) de Eurostat, todos los productos,
tasa de variación media anual, para la zona euro, la UE y sus 27 países,
con fuente, enlace, fecha y licencia (reutilización libre citando a
Eurostat, CC BY 4.0).

**Hoy son provisionales.** Eurostat (`ec.europa.eu`) no se podía alcanzar
desde el entorno que construyó esto, así que se escribieron a mano a
partir de las cifras publicadas, como pedía el plan:

- la zona euro, de 1997 a 2024; la UE y cada país, de 2016 a 2024;
- comprobadas contra una fuente publicada aquí: la serie de la UE
  (2016–2024) y Bélgica, Croacia, Rumanía e Italia en 2024;
- el resto puede diferir unas décimas al año de las cifras actuales de
  Eurostat, que revisó la serie en 2026 (ECOICOP versión 2).

Los tests de coherencia (`test/data.test.ts`) comprueban que cada año la
zona euro y la UE quedan cerca de la media ponderada de sus países (la
zona euro, a 0,15 puntos como mucho; hoy coincide a 0,05), que quedan
entre el mínimo y el máximo de sus países, que la media de la zona euro
de 1999 a 2019 es la que cita el BCE (1,7 %), y las cifras comprobadas.

**Para pasarlas a definitivas:** con acceso a `ec.europa.eu`, `npm run
data` descarga el conjunto `prc_hicp_aind` de Eurostat (1996 en adelante,
todos los años y países), escribe `src/data/hicp.json` sin la marca de
provisional, y `npm test` lo vuelve a comprobar. Después se puede pasar a
`"listed": true`.

## Cómo cumple los cinco principios

| Principio | Estado | Por qué |
| --- | --- | --- |
| Tus datos no salen de tu dispositivo | Cumple | Se calcula en tu navegador. No se guarda ni se envía nada. |
| Transparente | En parte | Gratis, con Eurostat como fuente y su licencia en la página. Por ahora sus cifras son provisionales. |
| Europeo de verdad | Pendiente | En inglés y español, pero alojado en EE. UU. Aún sin auditoría por personas. |
| Ligero | Cumple | Unos 16 KB por página, comprimida (límite del molde: 50 KB). |
| Para todos | En parte | Palabras sencillas, teclado y objetivos de 44 px. Aún sin probar con personas reales. |

## Cómo está hecha

Nació con [Forja](../../tools/forja/README.md) (molde `web-tool`) sobre
[seed-kit](../../packages/seed-kit/README.md): páginas estáticas, sin
framework, que Node 22 genera desde TypeScript. De seed-kit vienen los
colores, la cabecera y el pie de Horalis, la página de privacidad y
condiciones, el documento HTML, el script de idioma, los formatos de
números, los nombres de los países, el código para el navegador, la
medida del peso y las comprobaciones.

```
src/
  site.ts        id, nombre, dirección, límite de peso
  calc.ts        el cálculo, puro: nivel de precios encadenado, lo que vale hoy y entonces
  hicp.ts        los datos: validación, series por idioma, lectura del JSON-stat de Eurostat
  data/hicp.json los datos, con fuente, fecha y licencia
  view.ts        el resultado y la línea de tiempo en HTML: el build y el navegador
  i18n/          todas las palabras, un archivo por idioma (en, es, y nl: oculto
                 hasta que lo revise un nativo); index.ts las junta
  pages.ts       la herramienta, privacidad y condiciones, 404
  app.ts         el script del navegador: lee el formulario y redibuja
  styles.css     los estilos propios, después de los de seed-kit
  build.ts       genera dist/ (el del molde, sin cambios)
scripts/
  data.ts        npm run data: descarga los datos de Eurostat
test/
  calc.test.ts   el cálculo y sus casos límite
  data.test.ts   coherencia de los datos y lectura del JSON-stat
  site.test.ts   idiomas, cabecera y pie, sin peticiones ni almacenamiento,
                 peso por página, enlaces, fuente y licencia, palabras sencillas
```

## Comandos

```bash
npm ci              # solo herramientas de desarrollo: lint y tipos
npm run build       # genera dist/ e imprime el peso de cada página
npm test            # construye en una carpeta temporal y lo comprueba todo
npm run check       # lint, tipos y tests
npm run data        # descarga los datos de Eurostat (necesita ec.europa.eu)
npm run serve       # lo construye y lo sirve en local
```

## Publicarla

Un proyecto de Vercel con *Root Directory* `projects/inflation-lens`,
*Build Command* `npm run build`, *Output Directory* `dist` y la opción
*Include files outside the root directory in the Build Step* activada. La
dirección provisional, `https://seed-lab-inflation-lens.vercel.app`, está
en `src/site.ts` y en su entrada de `tools.json`; si Vercel da otra, se
cambia en los dos sitios (un test comprueba que coinciden).
