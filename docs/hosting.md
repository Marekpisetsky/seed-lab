# Alojamiento europeo: statichost.eu

**Estado (2026-10-01): preparado, todavía no activo.** Hoy Wealth Lens
(`seed-lab-omega.vercel.app`) y el hub (`seed-lab-hub.vercel.app`) se
sirven desde **Vercel, una empresa de EE. UU.**, y eso incumple el
principio 3 ("Truly European: hosted in Europe"); la tabla de *Principles*
del hub lo marca **en curso**. El código para pasar a **statichost.eu**
(Suecia, plan Hobby gratuito) ya está en `master`; la migración se activa
con los pasos de [más abajo](#pasos-para-activarla-en-orden), en orden.

El código y las tareas de GitHub Actions siguen en **GitHub** (EE. UU.):
un sitio europeo para un repositorio privado es otra decisión, con coste
(por ejemplo, un Forgejo propio en Hetzner), y queda pendiente aparte.

## Cómo queda

- **Un solo sitio estático**, porque el plan gratuito admite uno: el hub
  en la raíz (`/`, `/principles/`, `/es/…`) y Wealth Lens en
  `/wealth-lens/` (`/wealth-lens/stocks/`, `/wealth-lens/es/…`). Cada
  página es una carpeta con su `index.html`, que cualquier servidor
  estático sirve sin reglas.
- **La dirección, en un solo archivo: `deploy/site.json`.**
  - `origin`: hoy un marcador, `https://seed-lab.example` (`.example` es
    un dominio reservado que nunca existirá). Se cambia en el paso 6.
  - `wealthLensPath`: `/wealth-lens`.
  - Lo leen el hub (canónicas, hreflang, Open Graph, `robots.txt` y su
    sitemap), Wealth Lens (`next.config.ts`: `basePath`, metadatos y su
    sitemap) y los scripts de `deploy/`. Las redirecciones de Vercel se
    generan a partir de él con `node deploy/vercel.mjs`, y un test avisa
    si se quedan atrás.
- **Los enlaces entre el hub y Wealth Lens no llevan dominio**: son rutas
  del mismo sitio, en el idioma de la página (`/wealth-lens/es/` desde el
  hub en español, `/es/` desde Wealth Lens en español). Funcionan igual
  en local, en la dirección gratuita `<sitio>.statichost.page` y en el
  dominio.
- **GitHub construye, statichost.eu solo sirve.** El workflow
  `.github/workflows/deploy.yml` (acciones `checkout@v5` y
  `setup-node@v5`) se ejecuta en cada push a `master`, después de cada
  ejecución correcta de "Update prices" y a mano. Hace lint, tipos, tests
  y build de las dos apps; `deploy/combine.mjs` las junta y comprueba
  cada enlace, cada fuente, las canónicas, los sitemaps y que las
  redirecciones de Vercel llevan a páginas que existen. El resultado se
  publica en la rama **`deploy`**, como un único commit sin historia:
  - `public/`: el sitio;
  - `statichost.yml`: `public: public`, sin `image`, así que statichost.eu
    no construye nada y publica `public/` tal cual (no gasta sus 100
    minutos de build);
  - `README.md`: avisa de que la rama se genera sola.

  Si el sitio no cambió, no se publica nada. Si la variable del
  repositorio `STATICHOST_SITE` existe, el workflow llama después a
  `https://builder.statichost.eu/<sitio>` para que statichost.eu publique
  la rama nueva.
- **Coste:** 0 €. statichost.eu Hobby (1 sitio, 10 GB de tráfico y 100
  minutos de build al mes; aquí no hay build). GitHub Actions: unos
  minutos por ejecución, del cupo gratuito de los repositorios privados
  (verificar el cupo del plan en GitHub → Settings → Billing).

## Pasos para activarla, en orden

Lo que hay que hacer a mano, en este orden. Las direcciones actuales de
Vercel siguen funcionando hasta el paso 8.

### 1. Congelar Vercel antes de fusionar

Al fusionar, Vercel reconstruiría los dos proyectos con el código nuevo:
Wealth Lens pasaría a vivir en `/wealth-lens/` y su dirección actual
daría 404, y los enlaces del hub a Wealth Lens dejarían de funcionar en
Vercel. Para que Vercel siga sirviendo lo que sirve hoy, en **cada uno**
de los dos proyectos (`seed-lab-omega`, Wealth Lens, y `seed-lab-hub`):

1. Vercel → el proyecto → **Settings → Build and Deployment** (en
   versiones anteriores del panel, **Settings → Git**) → **Ignored Build
   Step**.
2. **Behavior:** *Don't build anything* (o *Run my Bash script* con el
   comando `exit 0`: en Vercel, salir con 0 significa "no construir").
3. **Save.**

El último despliegue de producción sigue publicado tal cual. Mientras
tanto, los precios diarios de Wealth Lens en Vercel dejan de
actualizarse; en el sitio nuevo sí se actualizan.

### 2. Fusionar el PR

El workflow **Deploy** se ejecuta y crea la rama `deploy`. Comprobarlo en
GitHub → **Actions → Deploy** (verde) y en la lista de ramas (`deploy`,
con `public/`, `statichost.yml` y `README.md`).

### 3. Crear el sitio en statichost.eu (sin comando de build)

1. Crear una cuenta en <https://www.statichost.eu> con el plan
   **Hobby** (gratuito, sin tarjeta).
2. **Add site** (nuevo sitio):
   - **Nombre del sitio:** por ejemplo `seed-lab`. Será la dirección
     gratuita `https://seed-lab.statichost.page` y el nombre que se usa en
     el paso 4 (abajo, `<sitio>`).
   - **Repository URL:** la dirección **SSH**, porque el repositorio es
     privado: `git@github.com:Marekpisetsky/seed-lab.git`.
   - **Branch:** `deploy`.
   - **Framework / build command / image:** ninguno, en blanco. La rama
     ya trae `statichost.yml` con `public: public` y sin `image`:
     statichost.eu no construye, solo publica `public/`.
   - **Publish directory:** si lo pide, `public` (es lo mismo que dice
     `statichost.yml`).
3. En los ajustes del sitio, copiar su **clave pública** (*deploy key*).
4. GitHub → `Marekpisetsky/seed-lab` → **Settings → Deploy keys → Add
   deploy key**:
   - **Title:** `statichost.eu`;
   - **Key:** pegar la clave;
   - **Allow write access:** sin marcar (solo lectura);
   - **Add key**.
5. En statichost.eu, lanzar la primera publicación (botón de *build* o
   *deploy* del sitio).

### 4. Que cada publicación llegue a statichost.eu

statichost.eu publica cuando se llama a su dirección de build. El
workflow lo hace solo, si sabe el nombre del sitio:

1. GitHub → **Settings → Secrets and variables → Actions → Variables →
   New repository variable**.
2. **Name:** `STATICHOST_SITE` · **Value:** el nombre del paso 3 (por
   ejemplo `seed-lab`).
3. Desde ahí, cada vez que la rama `deploy` cambia (un push a `master`
   o los precios del día), el último paso del workflow, *Ask
   statichost.eu to publish it*, avisa a statichost.eu. Si la rama no
   cambia, no hay nada que publicar y el paso no se ejecuta. La primera
   publicación es la del paso 3.5.

No hace falta un *webhook* en GitHub: un webhook de push haría que
statichost.eu publicara en cada push a cualquier rama.

### 5. Comprobar en `https://<sitio>.statichost.page`

- `/` y `/es/`: el hub; *Principles*, *About* y *Roadmap* en los dos
  idiomas.
- El botón de Wealth Lens del hub lleva a `/wealth-lens/` (en español, a
  `/wealth-lens/es/`), y desde Wealth Lens "Part of seed-lab" vuelve a
  `/` (o `/es/`).
- En Wealth Lens: las siete páginas en los dos idiomas, un cálculo, abrir
  una fila de *My stocks* (carga `/wealth-lens/data/lines/…`).
- Una dirección que no existe, `/no-existe` y `/wealth-lens/no-existe`:
  la página 404. statichost.eu debería servir el `404.html` de la raíz
  (el del hub, en los dos idiomas); si sirve otra cosa, mirar su página
  de *routing*.
- `/wealth-lens` (sin barra final) debería llevar a `/wealth-lens/`. Si
  no, añadir en `hub/static/` un archivo `_redirects` con la línea
  `/wealth-lens /wealth-lens/ 301` (statichost.eu lee `_redirects` en la
  raíz de lo publicado).
- Las canónicas y `og:url` todavía dicen `seed-lab.example`: es lo
  esperado hasta el paso 6.

### 6. El dominio

1. En el repositorio, en una rama y con un PR a `master`:
   - `deploy/site.json` → `"origin": "https://<dominio>"` (sin barra
     final; por ejemplo `https://seedlab.eu`);
   - `node deploy/vercel.mjs` (reescribe las dos redirecciones de Vercel
     con el dominio);
   - lint, tests y build de las dos apps (o dejar que el workflow lo
     haga) y fusionar. **Deploy** vuelve a publicar con el dominio.
2. statichost.eu → el sitio → **Domains** (dominios propios): añadir
   `<dominio>` y, si se quiere, `www.<dominio>`.
3. En el **registrador del dominio**, en su zona DNS:

   | Nombre | Tipo | Valor |
   | --- | --- | --- |
   | `@` (el dominio raíz) | `ALIAS` o `ANAME` | `<sitio>.statichost.page` |
   | `www` (opcional) | `CNAME` | `<sitio>.statichost.page` |

   - La raíz no admite `CNAME`. Si el registrador no tiene `ALIAS` ni
     `ANAME`, crear registros `A` y `AAAA` con las direcciones IP que da
     <https://www.statichost.eu/docs/domains/> (no copiarlas de otro
     sitio: pueden cambiar).
   - Borrar los registros `A`, `AAAA` o `CNAME` que ya existan para esos
     mismos nombres (por ejemplo, los de una página de aparcamiento del
     registrador).
   - TTL: el que venga por defecto.
4. Esperar a que el DNS se propague (de minutos a unas horas).
   statichost.eu emite el certificado HTTPS solo, también en el plan
   gratuito.

### 7. Comprobar en `https://<dominio>`

Lo mismo que en el paso 5, y además:

- `curl -sI https://<dominio>/` → `HTTP/2 200`, con certificado válido.
- La canónica de cada página y `og:url` dicen `https://<dominio>/…`;
  `https://<dominio>/robots.txt` lista los dos sitemaps
  (`/sitemap.xml` y `/wealth-lens/sitemap.xml`) y los dos abren.
- Ninguna petición a terceros (pestaña *Network* del navegador) y
  Lighthouse ≥ 95 en `/`, `/wealth-lens/` y `/wealth-lens/es/`.

### 8. Redirigir las direcciones antiguas (301)

Las configuraciones están listas en `deploy/vercel/`: cada proyecto de
Vercel pasa a servir solo un `vercel.json` que lo redirige todo con
**301** (`statusCode: 301`; `permanent: true` daría 308).

| Proyecto de Vercel | Root Directory | Redirige |
| --- | --- | --- |
| `seed-lab-hub` | `deploy/vercel/hub` | `/…` → `https://<dominio>/…` |
| `seed-lab-omega` (Wealth Lens) | `deploy/vercel/wealth-lens` | cada página (`/es/stocks`) → `https://<dominio>/wealth-lens/es/stocks/`; cualquier otra dirección → la misma dentro de `/wealth-lens/` |

En cada uno:

1. **Settings → Build and Deployment**:
   - **Root Directory:** el de la tabla;
   - **Framework Preset:** *Other*;
   - **Build Command**, **Output Directory** e **Install Command:**
     activar *Override* y dejarlos vacíos (no hay nada que construir);
   - **Ignored Build Step:** volver a *Automatic*.
2. **Deployments** → el último → **⋯ → Redeploy** (o hacer un push a
   `master`).
3. Comprobar: `curl -sI https://seed-lab-omega.vercel.app/es/stocks` →
   `HTTP/2 301` y `location: https://<dominio>/wealth-lens/es/stocks/`;
   `curl -sI https://seed-lab-hub.vercel.app/es/principles/` → `301` a
   `https://<dominio>/es/principles/`.

No borrar los proyectos de Vercel: mientras existan, los enlaces antiguos
siguen llevando a las páginas nuevas.

### 9. Marcarlo como cumplido

Con el sitio nuevo activo, en un PR:

- `hub/content/tools.json` → Wealth Lens → `europe`: `status: "meets"` y
  una nota que lo diga (alojado en statichost.eu, Suecia).
- `hub/src/i18n/en.ts` y `es.ts`: el paso del *Roadmap* sobre el
  alojamiento y la frase de *About* (hoy dicen "en traslado").
- Wealth Lens, página *Privacy* (`projects/wealth-lens/src/i18n/messages/`,
  la sección del alojamiento): quién aloja ahora y qué registra, con el
  enlace a la política de privacidad de statichost.eu en lugar de la de
  Vercel.
- La fila *Truly European* de `projects/wealth-lens/README.md`, la línea
  de alojamiento del `README.md` raíz y el estado al principio de este
  documento.

## Lo que se pierde frente a Vercel

- **Vistas previas por PR.** Se sustituyen por las capturas en local que
  ya acompañan cada PR.
- **CDN global.** Un único origen europeo. Para Europa no se nota; para
  visitantes lejanos, algo más de latencia en páginas pequeñas.
- **Dos direcciones separadas.** Los dos sitios comparten dirección
  (Wealth Lens en `/wealth-lens/`) mientras se use un solo sitio gratis.
- **Comodidad.** Vercel construye y despliega solo; aquí hay que mantener
  el workflow que construye y publica la rama `deploy`.

## Plan B

Si los 10 GB de tráfico al mes se quedan cortos: pasar a Starter (9 €/mes)
o servir los mismos archivos (la carpeta `public/` de la rama `deploy`)
desde **Scaleway** Object Storage, céntimos al mes. No cambia nada del
código: es una carpeta estática que cualquier servidor sirve tal cual.

## Por qué statichost.eu: las opciones comparadas (septiembre de 2026)

> **Sobre las cifras.** Precios y límites de septiembre de 2026, tomados
> de las páginas públicas de cada proveedor a través de buscadores (el
> entorno de trabajo no pudo abrir esas páginas directamente). Cambian a
> menudo: verificarlas en la página oficial.

Es la única opción que cumple a la vez **cero coste**, **Europa**, **sin
tarjeta** y **repositorio privado**.

### Descartada: Codeberg Pages

Codeberg (asociación sin ánimo de lucro, Berlín) ofrece páginas gratis,
pero **solo admite proyectos con licencia libre**. Con el código
propietario, no se puede usar ni para el código ni para los sitios.

### Opciones compatibles con un repositorio privado

#### 1. statichost.eu (Suecia)

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

#### 2. Scaleway Object Storage + Edge Services (Francia)

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

#### 3. Hetzner (Alemania)

- **Coste:** no hay plan gratuito. Webhosting S desde unos 2 €/mes
  (hosting compartido clásico, subida por SFTP desde el CI). Object
  Storage desde unos 5-6,5 €/mes con 1 TB incluido: pensado para mucho
  más volumen que el nuestro.
- **Límites:** coste fijo sin ventaja para dos sitios pequeños.

#### 4. Bunny.net (Eslovenia)

- **Coste:** almacenamiento + CDN con un mínimo de 1 $/mes.
- **Límites:** no construye; el CI sube los archivos por API o FTP. CDN
  global incluido: la opción si algún día hace falta servir rápido fuera
  de Europa.

#### Descartadas en una línea

- **OVHcloud (Francia):** hosting Starter desde 1-3 €/mes (precio de
  entrada que sube al renovar). Coste fijo sin ventaja sobre Hetzner.
- **Clever Cloud (Francia):** PaaS sin nivel gratuito permanente (solo
  créditos de prueba); la instancia más pequeña, unos 5 €/mes.

### Comparación

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

## Fuentes

- Codeberg, condiciones de uso (licencias libres):
  <https://codeberg.org/Codeberg/org/src/branch/main/TermsOfUse.md>,
  <https://docs.codeberg.org/getting-started/faq/>.
- statichost.eu: <https://www.statichost.eu/pricing/>,
  <https://www.statichost.eu/docs/domains/> (registros DNS: CNAME, o
  ALIAS/ANAME en la raíz, hacia `<sitio>.statichost.page`),
  <https://www.statichost.eu/docs/build-config/> (`statichost.yml`: sin
  `image` no hay build y se publica `public` tal cual),
  <https://www.statichost.eu/docs/git/> y
  <https://www.statichost.eu/docs/git-providers/> (rama, URL SSH y
  *deploy key*), <https://www.statichost.eu/docs/webhooks/> (publicar con
  un POST a `https://builder.statichost.eu/<sitio>`),
  <https://www.statichost.eu/docs/routing/> (`_redirects`),
  <https://www.statichost.eu/blog/statichost-hosting/> (repositorio
  privado de GitHub y HTML sin build). En octubre de 2026 el entorno de
  trabajo seguía sin poder abrir estas páginas: lo de arriba sale de los
  extractos que dan los buscadores. Revisar cada paso en ellas.
- Vercel: redirecciones con `statusCode` en `vercel.json`
  (<https://vercel.com/docs/project-configuration/vercel-json>) e
  *Ignored Build Step*
  (<https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel>).
- Scaleway: <https://www.scaleway.com/en/pricing/storage/>,
  <https://www.scaleway.com/en/edge-services/>,
  <https://www.scaleway.com/en/docs/object-storage/faq/>.
- Hetzner: <https://www.hetzner.com/news/object-storage/>.
- Bunny.net: <https://bunny.net/pricing/>.
- OVHcloud: <https://www.ovhcloud.com/en/web-hosting/>.
- Clever Cloud: <https://www.clever.cloud/pricing/>.
