# wealth-lens

**Misión:** darle a Marek una vista propia y honesta de su situación
financiera personal — cuánto ganó realmente, cuánto le falta para una
meta, y qué tan lejos o cerca está de la independencia financiera en
distintos lugares del mundo — sin depender de lo que un broker decide
mostrar.

**Qué NO es:**
- No es un producto para vender ni para terceros — el único cliente es
  Marek mismo (uso propio, encaja en el criterio nuevo de
  `seed-lab/projects/README.md`: adopción orgánica o uso propio, no
  venta activa).
- No da consejo financiero ni recomienda qué comprar/vender — solo
  calcula y visualiza datos que el propio Marek ingresa o que vienen de
  fuentes públicas.
- No gestiona ni mueve dinero real, no se conecta a ninguna cuenta de
  bróker vía API/credenciales — la entrada de datos de cartera es
  manual o por archivo exportado, nunca automática contra una cuenta
  real.
- No promete que la regla del 4% o el 7% real sean garantías — son
  estimaciones históricas con riesgo de secuencia, moneda e inflación
  local, y la app lo dice explícitamente en la UI, no solo acá.

**Estado actual (2026-09-29):** los tres módulos funcionan de punta a
punta (Next.js 16 + TypeScript + Tailwind 4), simplificados para que
cada pantalla se entienda en segundos: una idea por pantalla, un número
grande por sección y lo avanzado plegado. La matemática vive en funciones
puras con más de 230 tests unitarios (Vitest). Todavía sin desplegar y
sin validar con uso propio sostenido.

- **Primer uso:** sin datos guardados, cualquier pestaña muestra 3
  preguntas (cuánto tienes invertido, cuánto añades al mes, tu meta) y
  con eso las tres pestañas ya dan resultados. Botón secundario para
  importar el export de Trading 212. Los holdings detallados son
  opcionales.
- **Portfolio & goal — `/`:** arriba, "You've gained +€X (+Y%)" y "Goal
  reached in ~N years (mes año)", con barra de progreso hacia la meta y
  el supuesto de crecimiento (después de inflación) al lado. Lista
  compacta de holdings (valor y ganancia) con editar/eliminar en un menú
  "⋯". El precio actual se rellena solo con el último cierre ("price
  from DD/MM") salvo que lo escribas a mano. Slider de crecimiento,
  inflación, escenarios 3/5/7/10 % y fecha objetivo en "Advanced".
- **Charts — `/charts`:** lista con mini-gráfico y % de los últimos 12
  meses por acción; al tocar se abre el gráfico grande
  (lightweight-charts) con la línea de lo que pagaste. Precios de Stooq
  vía `/api/prices` (proxy propio con caché); ETFs y acciones europeas se
  buscan primero en su cotización en EUR (Xetra). Si Stooq falla, se
  puede subir un CSV propio de precios.
- **FIRE by country — `/fire`:** una frase grande con la probabilidad de
  que el dinero dure 30 años según la tasa de retiro (3/4/5/7 %),
  calculada con 5.000 simulaciones sobre los retornos reales históricos
  del S&P 500 1928–2022 (Robert Shiller, `src/data/sp500-real-returns.json`).
  Debajo, capital necesario y años para llegar en 6 países (los 5 más
  baratos + tu país "home"), con los 30 plegados. Costo de vida propio
  en `src/data/cost-of-living.json` (Numbeo + Wise, sep 2026).

Limitaciones conocidas: no convierte entre monedas (la meta y FIRE solo
cuentan holdings en EUR); las ganancias realizadas (ventas) no se
muestran; Stooq es una fuente no oficial que puede fallar.

## Arquitectura

- Next.js (App Router) + TypeScript, desplegado en Vercel (cuenta ya
  usada por Marek en otros proyectos, plan gratuito).
- **Sin backend ni base de datos.** Todo el estado personal (cartera,
  meta, moneda) vive en `localStorage` del navegador — es una app de un
  solo usuario, no hay nada que sincronizar entre dispositivos por
  ahora.
- Sin credenciales de bróker ni APIs de pago — respeta la regla de
  costo cero de seed-lab.
- Librería de gráficos: **lightweight-charts** (TradingView, open
  source) para velas/series de precio; para las curvas de
  proyección/costo de vida alcanza con SVG simple o `recharts`.

## Módulo 1 — Tracker de ganancia + tiempo a la meta

- Entrada: cartera actual (holdings + costo base, ingresado a mano o
  importado de un CSV tipo Trading212/Trade Republic) y una meta en
  euros.
- Calcula: ganancia/pérdida real (no solo % del broker), y con un
  retorno esperado configurable (default 7% real) + aporte mensual
  opcional, proyecta en cuántos años se llega a la meta (fórmula de
  valor futuro con aportes periódicos, no una regla de tres simple).
- Mostrar siempre el supuesto de retorno usado al lado del número — un
  cambio de 5%→9% cambia mucho el resultado, no ocultarlo.

## Módulo 2 — Gráficos de acciones por separado

- Por cada holding de la cartera, un gráfico de precio propio (no todo
  amontonado en una sola curva de "valor total" como hacen la mayoría
  de los brokers).
- Fuente de datos: **Stooq** (`https://stooq.com/q/d/l/?s=TICKER&i=d`,
  CSV histórico diario, sin API key) como fuente gratuita por defecto.
  Documentar en el código que es una fuente no oficial de terceros —
  aceptable para uso personal, no para un producto que se vende.

## Módulo 3 — Simulador FIRE / costo de vida

- Entrada: capital actual, retorno real esperado (default 7%), tasa de
  retiro seguro (default 4%, editable).
- Calcula: ingreso anual/mensual sostenible = capital × tasa de retiro.
- Compara ese ingreso contra un **dataset propio y curado** de costo de
  vida mensual aproximado (persona sola, sin alquiler y con alquiler)
  para ~30-40 países — construido a mano con fuentes públicas (Numbeo,
  informes de costo de vida de bancos, Eurostat/World Bank), etiquetado
  claramente como estimación aproximada con fecha de referencia, no
  dato en vivo.
- La UI tiene que mostrar las advertencias de la sección "Qué NO es"
  (riesgo de secuencia, moneda, inflación local) cerca del resultado,
  no en un footer que nadie lee.

## Plan de construcción

Los tres módulos se buildean en paralelo dentro del mismo scaffold ya
creado (decisión de Marek, 2026-09-29: no secuenciar MVP por módulo).
Orden sugerido de implementación técnica (no de prioridad de producto):
1. Estructura de datos compartida (holding, transacción, meta,
   supuestos) + persistencia en `localStorage`.
2. Módulo 1 (el cálculo es el más simple y no depende de red).
3. Módulo 3 (dataset estático, sin dependencia de red tampoco).
4. Módulo 2 (el único que depende de una fuente de datos externa,
   Stooq — dejarlo último por si hay que lidiar con CORS/rate limits).

## Cómo correrlo

Requisitos: Node.js 22 (o más nuevo) y npm.

```bash
cd projects/wealth-lens
npm install       # o `npm ci` para instalar exactamente el lockfile
npm run dev       # servidor de desarrollo en http://localhost:3000
```

Build de producción local:

```bash
npm run build
npm start         # sirve el build en http://localhost:3000
```

Para probarlo en el móvil, usar el build de producción (`npm run build`
+ `npm start`) y abrir `http://<IP-de-la-máquina>:3000` desde la misma
red; `npm run dev` bloquea por defecto los recursos de desarrollo
pedidos desde otro host (ver `allowedDevOrigins` en la documentación de
Next.js). Sin backend: los datos quedan en el `localStorage` de cada
navegador.

Los gráficos piden precios a Stooq a través de `/api/prices`; hace
falta que el servidor tenga salida a internet hacia `stooq.com`. Si no
la tiene (o Stooq falla), cada gráfico lo explica y permite subir un CSV
propio con columnas de fecha y cierre.

## Tests y chequeos

```bash
npm test          # tests unitarios (Vitest), una sola pasada
npm run test:watch
npm run lint      # ESLint (config de Next.js)
npm run build     # también verifica los tipos de TypeScript
```

Los tests cubren la lógica, que vive separada de la UI en `src/lib/`:
matemática financiera con casos verificados a mano (€1000 al 7 % por 10
años = €1967.15, 4 % de €1000 = €40/año, años hasta la meta contrastados
con una simulación mes a mes), el importador de Trading 212, el parser
de CSV, la persistencia (storage vacío, bloqueado, lleno o corrupto), el
proxy de Stooq con `fetch` simulado, el mapeo de símbolos europeos, el
precio automático (nunca pisa un precio escrito a mano), la simulación
Monte Carlo (semilla fija: con retorno constante del 7 % y retiro del
4 % el éxito es 100 %; con 15 %, bajo) y la integridad del dataset de
costo de vida (cada cifra en EUR se recalcula desde el valor citado en
su fuente).

## Mapa del código

```
src/
  app/                  rutas: / (módulo 1), /charts (2), /fire (3), api/prices
  components/           UI por módulo (portfolio/, charts/, fire/) y ui/ compartido
  hooks/                estado persistente, carga de precios, tema claro/oscuro
  lib/
    finance.ts          toda la matemática financiera (funciones puras)
    goal-projection.ts  módulo 1: proyección hacia la meta
    fire.ts             módulo 3: cobertura y capital necesario por país
    monte-carlo.ts      probabilidad de que una tasa de retiro dure 30 años
    plan.ts             capital de partida, progreso, países destacados
    import/             importadores CSV (Trading 212, CSV simple)
    prices.ts           parser de precios y lectura de respuestas de Stooq
    symbols.ts          ticker → símbolo de Stooq (mapa europeo + moneda)
    auto-price.ts       precio actual automático desde el último cierre
    price-proxy.ts      lógica del route handler /api/prices (caché, errores)
    storage.ts          localStorage con validación y valores por defecto
  data/
    cost-of-living.json dataset curado (30 países, EUR, con/sin alquiler)
    sp500-real-returns.json retornos reales anuales del S&P 500 (Shiller)
```

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.
