# deploy

Cómo se publica seed-lab como un solo sitio: el hub en la raíz y Wealth
Lens en `/wealth-lens/`. La guía completa, con los pasos para activarlo,
está en [`../docs/hosting.md`](../docs/hosting.md).

- `site.json`: la dirección del sitio (`origin`, hoy el marcador
  `https://seed-lab.example`) y la carpeta de Wealth Lens
  (`wealthLensPath`). **El único lugar donde se cambia el dominio.** Lo
  leen el hub (`hub/src/site.ts`), Wealth Lens (`next.config.ts`,
  `vitest.config.mts`) y estos scripts.
- `combine.mjs`: junta `hub/dist` y `projects/wealth-lens/out` en
  `_site/public/`, escribe `statichost.yml` (sin build) y comprueba cada
  enlace, las canónicas, los sitemaps y los destinos de las redirecciones.
  `node deploy/combine.mjs [carpeta]`.
- `vercel.mjs` y `vercel/`: las redirecciones 301 de las direcciones de
  Vercel a las nuevas, listas pero sin usar. Tras cambiar el dominio:
  `node deploy/vercel.mjs`. `--check` comprueba que siguen al día.
- Tests: `node --test deploy/*.test.mjs` (los ejecuta también el
  workflow `.github/workflows/deploy.yml`).
