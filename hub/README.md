# seed-lab hub

La portada de seed-lab: la misión, los cinco principios, las herramientas
que existen hoy y las herramientas para desarrolladores que vendrán. En
inglés y en español.

- Dirección, escalera y principios: [`../docs/direction.md`](../docs/direction.md).
- Plan para alojarlo en Europa: [`../docs/hosting.md`](../docs/hosting.md).

## Cómo está hecho

Páginas estáticas, sin framework de JavaScript. Un generador en
TypeScript, ejecutado directamente por Node 22
(`--experimental-strip-types`), escribe HTML con el CSS dentro. No hay
dependencias en tiempo de ejecución: las de `package.json` son solo para
lint, tipos y tests.

- Sin cookies, sin almacenamiento del navegador, sin analítica, sin
  fuentes ni scripts externos.
- Dos scripts mínimos, en línea, que no guardan nada:
  - solo en las páginas en inglés, el del idioma: la primera visita que
    llega desde fuera con un navegador en español va a la página en
    español; el selector EN/ES siempre gana;
  - solo donde aparece el correo (About), el del contacto (`src/email.ts`).
- **Contacto:** seedlab.eu (arroba) proton.me. En las páginas va en dos
  partes (`data-user` y `data-domain`, en `src/site.ts`): el CSS las
  muestra como una dirección y el script la convierte en un enlace de
  correo. El HTML nunca contiene la dirección entera ni un enlace
  `mailto`, para que no la recojan los bots. Un test lo comprueba.
- Claro y oscuro según el dispositivo. Tipografía del sistema, títulos en
  extra-negrita.
- **Colores:** `src/tokens.css`, el mismo archivo que Wealth Lens
  (`projects/wealth-lens/src/app/tokens.css`): blanco o #0A0A0A, grises
  neutros y un solo azul de marca (#0055FF en claro, #4D8DFF en oscuro).
  Los tests comprueban que los dos archivos son idénticos, que todo texto
  mantiene 4,5:1 (WCAG AA) en los dos modos y que los grises son neutros.
- **Peso visible:** el pie de cada página dice cuánto pesa (HTML con su
  CSS, más el icono), sin comprimir y con gzip. Se mide al construir y se
  vuelve a generar la página hasta que el número que muestra es el real
  (escribir el número cambia el peso). Un test lo comprueba.

```
hub/
  content/tools.json    herramientas (tarjetas de la portada)
  content/blocks.json   bloques para desarrolladores: "coming" hasta que se publiquen
  src/build.ts          genera dist/ (una carpeta por página e idioma)
  src/i18n/en.ts, es.ts todas las palabras, con el mismo formato
  src/pages/            portada, principles, about, 404
  src/layout.ts         cabecera, pie con el peso, metadatos, hreflang
  src/styles.ts         el CSS, en línea
  src/weight.ts         mide y fija el peso de cada página
  test/build.test.ts    peso, privacidad, enlaces y honestidad
```

## Comandos

```bash
npm ci
npm run build       # genera dist/ e imprime el peso de cada página
npm run lint
npm run typecheck
npm test            # construye y comprueba el resultado
npm run check       # los tres
```

Para verlo en local: `npx serve dist`.

## Añadir una herramienta o un bloque

- Herramienta: una entrada en `content/tools.json` con `name`, `status`
  (`live` o `coming`), `url` y `source` (https), `languages`, y `tagline`
  y `description` en cada idioma. El build falla si falta algo.
- Bloque: una entrada en `content/blocks.json`. Solo puede ser `live` con
  la dirección (`url`) donde está publicado; sin ella, es `coming`. No se
  anuncia nada que no exista.

## Añadir un idioma

Un diccionario en `src/i18n/` con la misma forma que `en.ts` (un test
compara la forma), su entrada en `LOCALES` y `LOCALE_SETTINGS`
(`src/i18n/locales.ts`) y el texto de cada herramienta y bloque en ese
idioma.

## Publicarlo en Vercel (provisional)

Hasta migrar a un alojamiento europeo (ver `docs/hosting.md`), el hub se
publica como un segundo proyecto de Vercel sobre este mismo repositorio:

1. Vercel → **Add New… → Project** → importar `Marekpisetsky/seed-lab`.
2. **Project Name:** `seed-lab-hub` (así queda en
   `https://seed-lab-hub.vercel.app`, la dirección que usan `src/site.ts`
   y el menú de Wealth Lens).
3. **Root Directory:** `hub`.
4. **Framework Preset:** Other.
5. **Build Command:** `npm run build` · **Output Directory:** `dist` ·
   **Install Command:** `npm ci`.
6. **Settings → General → Node.js Version:** 22.x.
7. No hace falta ninguna variable de entorno. Sin Vercel Analytics ni
   Speed Insights: dejarlos apagados.
8. Deploy. Las páginas quedan en `/`, `/principles/`, `/about/` y en
   `/es/…`; cualquier dirección que no exista sirve `404.html`.

Si el proyecto acaba con otro nombre, cambiar `SITE_URL` en `src/site.ts`
(canónicas, hreflang y sitemap) y `SEED_LAB_HUB_URL` en Wealth Lens.

## Licencia

Código propietario: © 2026 Marek Pisetsky, todos los derechos reservados.
Ver [`LICENSE`](../LICENSE) y [`TRADEMARKS.md`](../TRADEMARKS.md) en la raíz.
El sitio publicado es de uso gratuito.
