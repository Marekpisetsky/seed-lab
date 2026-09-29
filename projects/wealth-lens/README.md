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

**Estado actual (2026-09-29):** recién scaffoldeado (Next.js 15 +
TypeScript + Tailwind, `create-next-app`). Sin código de producto
todavía — este README es el spec para construir los tres módulos.

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

## Getting Started (dev)

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

**Nota para quien retome esto en una sesión nueva (incluida una sesión
en la nube):** este Next.js es una versión reciente con cambios
respecto al conocimiento de entrenamiento de un modelo — leer
`AGENTS.md` en esta misma carpeta antes de escribir código.
