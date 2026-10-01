# Alojamiento europeo: plan de migración

Hoy Wealth Lens (`seed-lab-omega.vercel.app`) y el hub (`seed-lab-hub.vercel.app`,
provisional) se sirven desde **Vercel, una empresa de EE. UU.**, y el
código y la tarea diaria de precios viven en **GitHub**, también de
EE. UU. Eso incumple el principio 3 ("Truly European: hosted in Europe"),
y la página *Principles* del hub lo dice y lo marca como pendiente.

Este documento compara opciones europeas para servir los dos sitios
estáticos gratis o casi gratis y termina con **una** recomendación.
**Todavía no se migra nada.**

> **Sobre las cifras.** Precios y límites de septiembre de 2026, tomados
> de las páginas públicas de cada proveedor a través de buscadores (el
> entorno de trabajo no pudo abrir esas páginas directamente). Cambian a
> menudo: **verificar cada cifra en la página oficial antes de migrar.**
> Las fuentes están al final.

## Qué hay que alojar

- **Dos sitios 100 % estáticos**, sin funciones de servidor:
  - Wealth Lens: `next build` con `output: "export"` escribe `out/`
    (HTML, CSS, JS y los datos en `public/data/`). Pocos MB.
  - Hub: `npm run build` escribe `hub/dist/`. Unos 100 KB.
- **Un repositorio privado.** El código es propietario (ver
  [`LICENSE`](../LICENSE)): el alojamiento tiene que poder leer un
  repositorio privado, o recibir el sitio ya construido.
- **Una tarea diaria** (`.github/workflows/update-prices.yml`): descarga
  precios, hace commit en `master` y ese push provoca el despliegue de
  Wealth Lens. Necesita un CI con salida a internet.
- Tráfico: bajo. No hay cifras porque no medimos visitas (principio 1).
- Regla del holding: **cero coste** para existir.

## Lo que hoy da Vercel (y habrá que suplir o aceptar perder)

| Hoy en Vercel | Importa para seed-lab |
| --- | --- |
| Despliegue automático en cada push a `master` | Sí: la tarea diaria depende de ello. |
| Vista previa por cada PR | Útil, no imprescindible: las capturas de cada PR se hacen en local. |
| CDN global (servidores cerca de cada visitante) | Poco: las páginas son pequeñas. Un único origen europeo basta para Europa. |
| Subdominios `*.vercel.app` con HTTPS | Sí: son las direcciones actuales. Cambiarán. |
| Deshacer un despliegue con un clic | Útil. Con git se puede volver a publicar un commit anterior. |
| Analytics, Speed Insights, funciones, imágenes | No se usan, y no se van a usar. |

## Descartada: Codeberg Pages

Codeberg (asociación sin ánimo de lucro, Berlín) ofrece páginas gratis,
pero **solo admite proyectos con licencia libre**. Con el código
propietario, no se puede usar ni para el código ni para los sitios.

## Opciones compatibles con un repositorio privado

### 1. statichost.eu (Suecia)

Empresa pequeña dedicada solo a sitios estáticos, sobre infraestructura
europea. Lee repositorios privados de GitHub (o de cualquier git) con una
*deploy key* que crea para cada sitio, y construye y publica en cada
push, como Vercel. También sirve HTML ya construido, sin paso de build
(se configura con un `statichost.yml`).

- **Coste:** plan Hobby gratis, sin tarjeta: **1 sitio**, 10 GB de
  tráfico y 100 minutos de build al mes. Starter: 9 €/mes (sitios
  ilimitados, 500 GB).
- **Límites:** dos sitios separados exigen el plan de pago. Una build
  diaria de Wealth Lens en su servidor (`npm ci` + `next build`, unos
  minutos) se acerca a los 100 minutos al mes.
- **Dirección gratuita:** subdominio de `statichost.page`; dominio propio
  con HTTPS incluido también en el plan gratuito.
- **Por verificar:** que el plan Hobby admita un proyecto propietario de
  uso gratuito (sus condiciones de uso).

### 2. Scaleway Object Storage + Edge Services (Francia)

Proveedor de nube de Iliad. Un *bucket* de Object Storage puede servir un
sitio estático ("Bucket Website"). Como recibe archivos ya construidos, la
privacidad del repositorio no le afecta.

- **Coste:** casi gratis, no gratis. El almacenamiento cuesta céntimos al
  mes para unos MB. La prueba gratuita actual es de 90 días (750 GB); el
  antiguo nivel gratuito permanente de 75 GB ya no se ofrece a cuentas
  nuevas. Con dominio propio y HTTPS hace falta Edge Services: plan
  Starter a 0,99 €/mes.
- **Límites:** cuenta con tarjeta y facturación. No construye: el CI
  construye y sube los archivos con `aws s3 sync` o `rclone`, con una
  clave de acceso guardada como secreto.
- **Dirección gratuita:** el punto de acceso del bucket en `scw.cloud`
  (verificar que sirve HTTPS y `index.html` en subcarpetas).

### 3. Hetzner (Alemania)

- **Coste:** no hay plan gratuito. Webhosting S desde unos 2 €/mes
  (hosting compartido clásico, subida por SFTP desde el CI). Object
  Storage desde unos 5-6,5 €/mes con 1 TB incluido: pensado para mucho
  más volumen que el nuestro.
- **Límites:** coste fijo sin ventaja para dos sitios pequeños.

### 4. Bunny.net (Eslovenia)

- **Coste:** almacenamiento + CDN con un mínimo de 1 $/mes.
- **Límites:** no construye; el CI sube los archivos por API o FTP. CDN
  global incluido: la opción si algún día hace falta servir rápido fuera
  de Europa.

### Descartadas en una línea

- **OVHcloud (Francia):** hosting Starter desde 1-3 €/mes (precio de
  entrada que sube al renovar). Coste fijo sin ventaja sobre Hetzner.
- **Clever Cloud (Francia):** PaaS sin nivel gratuito permanente (solo
  créditos de prueba); la instancia más pequeña, unos 5 €/mes.

## Comparación

| | statichost.eu | Scaleway | Hetzner | Bunny.net |
| --- | --- | --- | --- | --- |
| País | Suecia | Francia | Alemania | Eslovenia |
| Repositorio privado | Sí (deploy key) | No le afecta (recibe archivos) | No le afecta | No le afecta |
| Coste para los 2 sitios | **0 €** en un solo sitio · 9 €/mes separados | céntimos + 0,99 €/mes con dominio | ~2 €/mes o más | 1 $/mes mínimo |
| Sin tarjeta | Sí (Hobby) | No | No | No |
| Construye el sitio | Sí, o sirve HTML ya hecho | No | No | No |
| Dirección gratuita con HTTPS | `statichost.page` | `scw.cloud` (verificar) | No | `b-cdn.net` |
| Organización | Empresa pequeña | Gran proveedor | Gran proveedor | Empresa mediana |
| Garantía de servicio | Según plan | Sí | Sí | Sí |

## Recomendación: statichost.eu, plan Hobby, un solo sitio

Es la única opción que cumple a la vez **cero coste**, **Europa**, **sin
tarjeta** y **repositorio privado**. Para que los dos sitios quepan en el
plan gratuito, se publican **juntos en un solo sitio**: el hub en la
raíz y Wealth Lens en `/wealth-lens/`. Para no gastar sus minutos de
build, el sitio se construye en GitHub Actions y statichost.eu solo sirve
el resultado.

El riesgo es el tamaño del plan: 10 GB de tráfico al mes. Si se queda
corto, hay dos salidas sin cambiar nada del código: pasar a Starter
(9 €/mes) o mover los mismos archivos a **Scaleway** (céntimos al mes),
el plan B. Los dos sitios son carpetas estáticas que cualquier servidor
sirve tal cual.

### Pasos (cuando se decida migrar)

1. **Ruta de Wealth Lens.** Añadir `basePath: "/wealth-lens"` en
   `next.config.ts` (hoy asume la raíz) y revisar sus enlaces absolutos
   propios. El hub ya genera rutas desde la raíz, así que no cambia.
2. **Rama de publicación.** Un workflow de GitHub Actions construye el hub
   y Wealth Lens y deja el resultado en una rama `site` (hub en la raíz,
   Wealth Lens en `wealth-lens/`), con un `statichost.yml` sin paso de
   build. Los minutos salen del cupo gratuito de GitHub Actions para
   repositorios privados (verificar el cupo del plan).
3. **Sitio en statichost.eu.** Crear el sitio Hobby apuntando a la rama
   `site` por SSH y añadir su *deploy key* (solo lectura) al repositorio
   en GitHub.
4. **Tarea diaria de precios.** Tras su commit, el mismo workflow del
   paso 2 vuelve a construir y actualiza la rama `site`.
5. **Comprobar** en la nueva dirección: las páginas en EN y ES, `404.html`,
   que no hay peticiones a terceros, Lighthouse ≥ 95 y los enlaces
   cruzados (`SEED_LAB_HUB_URL` en Wealth Lens y `SITE_URL`, `tools.json`
   en el hub).
6. **Transición.** Dejar las direcciones `*.vercel.app` un tiempo con un
   aviso de la nueva dirección; después, borrar los proyectos de Vercel.
7. **Textos.** Actualizar la página *Privacy* de Wealth Lens (quién
   aloja y qué registra, con enlace a la política de statichost.eu), la
   página *Principles* del hub (quitar el pendiente) y este documento.

El código seguirá en GitHub (EE. UU.). Un sitio europeo para un
repositorio privado es otra decisión, con coste: por ejemplo, un Forgejo
propio en un servidor de Hetzner. Queda como pendiente aparte.

### Lo que se pierde frente a Vercel

- **Vistas previas por PR.** Se sustituyen por las capturas en local que
  ya acompañan cada PR.
- **CDN global.** Un único origen europeo. Para Europa no se nota; para
  visitantes lejanos, algo más de latencia en páginas pequeñas.
- **Dos direcciones separadas.** Los dos sitios comparten dirección
  (Wealth Lens bajo `/wealth-lens/`) mientras se use un solo sitio gratis.
- **Direcciones actuales.** Cambian; por eso el paso 6.
- **Comodidad.** Vercel construye y despliega solo; aquí hay que mantener
  el workflow que construye y publica la rama `site`.

## Fuentes (consultadas en septiembre de 2026)

- Codeberg, condiciones de uso (licencias libres):
  <https://codeberg.org/Codeberg/org/src/branch/main/TermsOfUse.md>,
  <https://docs.codeberg.org/getting-started/faq/>.
- statichost.eu: <https://www.statichost.eu/pricing/>,
  <https://www.statichost.eu/docs/domains/>,
  <https://www.statichost.eu/docs/git-providers/>,
  <https://www.statichost.eu/blog/statichost-hosting/> (repositorio
  privado de GitHub y HTML sin build).
- Scaleway: <https://www.scaleway.com/en/pricing/storage/>,
  <https://www.scaleway.com/en/edge-services/>,
  <https://www.scaleway.com/en/docs/object-storage/faq/>.
- Hetzner: <https://www.hetzner.com/news/object-storage/>.
- Bunny.net: <https://bunny.net/pricing/>.
- OVHcloud: <https://www.ovhcloud.com/en/web-hosting/>.
- Clever Cloud: <https://www.clever.cloud/pricing/>.
