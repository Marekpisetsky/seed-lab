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

## Opciones

### 1. Codeberg Pages (Codeberg e.V., Berlín, Alemania)

Asociación sin ánimo de lucro que aloja código libre. Su servicio de
páginas se renovó en diciembre de 2025: el nuevo servidor, **git-pages**,
recibe el sitio ya construido (desde una Forgejo Action o un webhook) y
lo sirve. El servidor anterior sigue funcionando en modo mantenimiento.

- **Coste:** 0 €. Financiado con donaciones y cuotas de socios.
- **Límites:** solo proyectos con licencia libre (Wealth Lens y el hub
  son MIT: cumplen). Sin SLA: lo mantiene una asociación con voluntarios.
  CI propio limitado: runners de 2, 5 o 10 minutos como máximo y colas
  que pueden durar horas.
- **Dirección gratuita:** `marekpisetsky.codeberg.page` (un repositorio
  llamado `pages` va a la raíz; los demás, a `/<repositorio>/`). Dominio
  propio con HTTPS automático, si algún día se quiere.
- **Encaja con "Open":** el propio servicio es software libre (Forgejo,
  git-pages), y permite llevar allí también el código.

### 2. statichost.eu (Suecia)

Empresa pequeña dedicada solo a sitios estáticos, sobre infraestructura
europea. Construye el sitio desde cualquier repositorio git (Codeberg,
GitHub…), como Vercel.

- **Coste:** plan Hobby gratis, sin tarjeta: **1 sitio**, 10 GB de
  tráfico y 100 minutos de build al mes. Starter: 9 €/mes (sitios
  ilimitados, 500 GB).
- **Límites:** con dos sitios, el segundo ya exige pagar. Una build diaria
  de Wealth Lens (`npm ci` + `next build`, unos minutos) se acerca a los
  100 minutos al mes.
- **Dirección gratuita:** subdominio `statichost.page`; dominio propio con
  HTTPS incluido también en el plan gratuito.
- **Lo más parecido a Vercel** (build y despliegue automáticos).

### 3. Scaleway Object Storage + Edge Services (Francia)

Proveedor de nube de Iliad. Un *bucket* de Object Storage puede servir un
sitio estático ("Bucket Website").

- **Coste:** casi gratis, no gratis. El almacenamiento cuesta céntimos al
  mes para unos MB. La prueba gratuita actual es de 90 días (750 GB); el
  antiguo nivel gratuito permanente de 75 GB ya no se ofrece a cuentas
  nuevas. Para servirlo con dominio propio y HTTPS hace falta Edge
  Services: plan Starter a 0,99 €/mes.
- **Límites:** cuenta con tarjeta y facturación. No construye: el CI
  construye y sube `out/` con `aws s3 sync` o `rclone`, con una clave de
  acceso guardada como secreto.
- **Dirección gratuita:** el punto de acceso del bucket en `scw.cloud`
  (verificar que sirve HTTPS y `index.html` en subcarpetas).

### 4. Hetzner (Alemania)

- **Coste:** no hay plan gratuito. Webhosting S desde unos 2 €/mes
  (hosting compartido clásico, subida por SFTP). Object Storage desde
  unos 5-6,5 €/mes con 1 TB incluido: pensado para mucho más volumen que
  el nuestro.
- **Límites:** sube el coste fijo sin ventaja para dos sitios pequeños.

### Descartadas en una línea

- **OVHcloud (Francia):** hosting Starter desde 1-3 €/mes (precio de
  entrada que sube al renovar). Coste fijo sin ventaja sobre Hetzner.
- **Clever Cloud (Francia):** PaaS sin nivel gratuito permanente (solo
  créditos de prueba); la instancia más pequeña, unos 5 €/mes.
- **Bunny.net (Eslovenia):** CDN + almacenamiento con un mínimo de
  1 $/mes. Buena opción si algún día hace falta CDN; hoy, coste sin
  necesidad.

## Comparación

| | Codeberg Pages | statichost.eu | Scaleway | Hetzner |
| --- | --- | --- | --- | --- |
| País | Alemania | Suecia | Francia | Alemania |
| Coste para los 2 sitios | **0 €** | 0 € + 9 €/mes | céntimos + 0,99 €/mes | ~2 €/mes o más |
| Sin tarjeta | Sí | Sí (Hobby) | No | No |
| Construye el sitio | Con su CI (limitado) o desde fuera | Sí | No | No |
| Dirección gratuita con HTTPS | `codeberg.page` | `statichost.page` | `scw.cloud` (verificar) | No |
| Organización | Asociación sin ánimo de lucro | Empresa pequeña | Gran proveedor | Gran proveedor |
| Software del servicio | Libre | Propio | Propio | Propio |
| Garantía de servicio | Ninguna | Según plan | Sí | Sí |

## Recomendación: Codeberg Pages

Es la única opción que cumple a la vez **cero coste**, **Europa**, **dos
sitios** y **software libre**, sin tarjeta ni claves de un proveedor de
nube. Además resuelve el otro pendiente del principio 2: llevar el código
a Codeberg, primero como copia y después como repositorio principal.

El riesgo es real: no hay SLA y el CI de Codeberg es limitado. Se asume
porque la salida es sencilla: los dos sitios son carpetas estáticas que
cualquier servidor sirve tal cual. Si Codeberg falla, **statichost.eu** es
el plan B, y ya está probado que ambos sitios no necesitan nada más que
servir archivos.

### Pasos (cuando se decida migrar)

1. **Copia del código.** Crear `seed-lab` en Codeberg y mantenerlo al día
   desde GitHub (un paso del workflow que hace `git push` a Codeberg en
   cada push a `master`). Nada cambia todavía para quien visita los
   sitios.
2. **Rutas.** Decidir direcciones con el dominio gratuito:
   - hub en la raíz: `https://marekpisetsky.codeberg.page/` (repositorio
     `pages`);
   - Wealth Lens en `https://marekpisetsky.codeberg.page/wealth-lens/`.
   Wealth Lens necesita `basePath: "/wealth-lens"` en `next.config.ts`
   (hoy asume la raíz) y revisar sus enlaces absolutos propios. El hub ya
   genera rutas desde la raíz, así que no cambia. Si se prefiere que ambos estén en la raíz, hará falta un
   dominio propio (unos 10 €/año): decisión aparte, porque rompe el cero
   coste.
3. **Build y despliegue.** Mientras el CI de Codeberg sea limitado, seguir
   construyendo en GitHub Actions y publicar el resultado en Codeberg con
   git-pages (o subiendo `out/` y `dist/` a la rama de páginas). Probar
   después la acción de git-pages en los runners de Codeberg: el hub
   construye en segundos; Wealth Lens, en unos minutos.
4. **Tarea diaria de precios.** Hoy es una GitHub Action que hace commit
   y dispara Vercel. En la migración: que el mismo workflow, tras el
   commit, construya y publique en Codeberg. Moverla a Codeberg CI queda
   para cuando sus runners permitan una tarea diaria fiable.
5. **Comprobar** en la nueva dirección: las páginas en EN y ES, `404.html`,
   que no hay peticiones a terceros, Lighthouse ≥ 95 y los enlaces
   cruzados (`SEED_LAB_HUB_URL` en Wealth Lens y `SITE_URL`, `tools.json`
   en el hub).
6. **Transición.** Dejar las direcciones `*.vercel.app` un tiempo con un
   aviso de la nueva dirección; después, borrar los proyectos de Vercel.
7. **Textos.** Actualizar la página *Privacy* de Wealth Lens (quién
   aloja y qué registra, con enlace a la política de Codeberg), la página
   *Principles* del hub (quitar el pendiente) y este documento.

### Lo que se pierde frente a Vercel

- **Vistas previas por PR.** Se sustituyen por las capturas en local que
  ya acompañan cada PR.
- **CDN global.** Un único origen en Alemania. Para Europa no se nota;
  para visitantes lejanos, algo más de latencia en páginas de pocos KB.
- **Garantía de servicio.** Codeberg es una asociación con voluntarios.
  Mitigación: el plan B de arriba.
- **Direcciones actuales.** Cambian; por eso el paso 6.
- **Comodidad.** Vercel construye y despliega solo; con Codeberg hay que
  mantener un pequeño paso de publicación en el workflow.

## Fuentes (consultadas en septiembre de 2026)

- Codeberg Pages: <https://codeberg.page/>,
  <https://docs.codeberg.org/codeberg-pages/>,
  <https://docs.codeberg.org/codeberg-pages/forgejo-actions/>,
  <https://codeberg.org/Codeberg/pages-server> (modo mantenimiento, a
  favor de git-pages).
- Codeberg CI: <https://docs.codeberg.org/ci/actions/>,
  <https://codeberg.org/actions/meta>.
- Codeberg, condiciones de uso (licencias libres):
  <https://codeberg.org/Codeberg/org/src/branch/main/TermsOfUse.md>,
  <https://docs.codeberg.org/getting-started/faq/>.
- statichost.eu: <https://www.statichost.eu/pricing/>,
  <https://www.statichost.eu/docs/domains/>.
- Scaleway: <https://www.scaleway.com/en/pricing/storage/>,
  <https://www.scaleway.com/en/edge-services/>,
  <https://www.scaleway.com/en/docs/object-storage/faq/>.
- Hetzner: <https://www.hetzner.com/news/object-storage/>.
- OVHcloud: <https://www.ovhcloud.com/en/web-hosting/>.
- Clever Cloud: <https://www.clever.cloud/pricing/>.
- Bunny.net: <https://bunny.net/pricing/>.
