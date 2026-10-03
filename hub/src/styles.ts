import { kitCss, minifyCss } from "../../packages/seed-kit/src/css.ts";

/**
 * All the hub's styles, inlined in every page: one request less, and no
 * flash. The colours come from seed-kit's tokens.css, the one file every
 * app uses: white or near-black, neutral greys, one seed green. The header
 * and footer are seed-kit's too (chrome.css). Pages alternate
 * near-black and white bands (.theme-dark and .theme-light), the same
 * whatever the device's mode, so a page is never one dark block. The
 * system's own font, big strong headings, lots of space; nothing is stored.
 */


const CSS = /* css */ `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; background: #0a0a0a; }
body {
  margin: 0; background: var(--background); color: var(--foreground);
  font: 1.0625rem/1.65 var(--font-system);
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: .2em; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
p, ul, ol { margin: 0 0 1rem; }
strong { font-weight: 700; }
.wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.25rem; }
.narrow { max-width: 42rem; }
main:focus { outline: none; }
.muted { color: var(--muted); }

/* Bands: always dark or always light, whatever the device's mode (tokens.css). */
.band { background: var(--background); color: var(--foreground); padding: clamp(4.5rem, 11vw, 8.5rem) 0; }
.sk-header + main > .band:first-child { padding-top: clamp(3.5rem, 9vw, 7rem); }


h1, h2, h3 { margin: 0 0 1rem; line-height: 1.1; }
h1 { font-size: clamp(2.75rem, 1.4rem + 5.6vw, 5.5rem); font-weight: 800; letter-spacing: -.045em; line-height: 1.02; max-width: 15ch; }
h2 { font-size: clamp(2rem, 1.2rem + 3.2vw, 3.5rem); font-weight: 800; letter-spacing: -.035em; line-height: 1.05; }
h3 { font-size: 1.25rem; font-weight: 700; letter-spacing: -.01em; }
.lead { font-size: clamp(1.1875rem, 1rem + .7vw, 1.5rem); line-height: 1.5; color: var(--muted); max-width: 44rem; }
.hero .lead { margin-top: 1.5rem; }
.kicker { margin: 0 0 1rem; color: var(--accent); font-size: .875rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.section-head { max-width: 46rem; margin-bottom: 2.5rem; }
.section-head p { color: var(--muted); font-size: 1.125rem; }
.actions { margin-top: 2.25rem; }
.button { display: inline-flex; align-items: center; min-height: 52px; padding: 0 1.75rem; border-radius: 6px; background: var(--brand); color: var(--brand-foreground); font-weight: 800; font-size: 1.0625rem; text-decoration: none; }
.button:hover { filter: brightness(1.08); }
.link { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; }



.commitments { margin: 0; padding: 0; list-style: none; }
.commitment { padding: 3rem 0; border-top: 1px solid var(--border); }
.commitment:first-child { border-top: 0; padding-top: 0; }
.commitment:last-child { padding-bottom: 0; }
.commitment-title { display: flex; align-items: flex-start; gap: 1rem; }
.commitment-title h2 { font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem); }
.commitment-title span { color: var(--muted); }
.commitment-text { font-size: 1.1875rem; max-width: 44rem; }
.label { font-size: .8125rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-top: 1.5rem; }
.rules { margin: 0; padding-left: 1.25rem; max-width: 46rem; }
.rules li { margin-bottom: .5rem; }
.rules li::marker { color: var(--brand); }

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; }
table { width: 100%; min-width: 52rem; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
thead th { font-size: .8125rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 700; }
tbody th { position: sticky; left: 0; background: var(--card); font-size: 1.125rem; font-weight: 800; white-space: nowrap; }
tbody th a { display: inline-flex; align-items: center; min-height: 44px; margin-top: -.625rem; }
td { background: var(--card); }
.note { display: block; margin-top: .5rem; font-size: .9375rem; color: var(--muted); line-height: 1.45; }

.state { display: inline-block; padding: .125rem .625rem; border-radius: 999px; font-size: .8125rem; font-weight: 800; line-height: 1.6; white-space: nowrap; }
.state.meets { color: var(--accent); background: var(--accent-soft); }
.state.partly { color: var(--foreground); background: var(--subtle); border: 1px solid var(--border); }
.state.pending { color: var(--muted); border: 1px dashed currentColor; }

.ladder { margin: 0; padding: 0; list-style: none; display: grid; gap: 1rem; max-width: 52rem; }
.step { display: flex; gap: 1.25rem; align-items: flex-start; padding: 1.5rem; border: 1px solid var(--border); border-radius: 10px; background: var(--card); }
.step.current { border-color: var(--brand); border-width: 2px; }
.step p { margin: 0 0 .25rem; }
.step-number { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 999px; background: var(--subtle); font-weight: 800; }
.step.current .step-number { background: var(--brand); color: var(--brand-foreground); }
.step-what { font-size: 1.1875rem; font-weight: 800; letter-spacing: -.01em; }
.missing { margin: 0 0 3.5rem; padding-left: 1.25rem; max-width: 48rem; font-size: 1.125rem; }
.missing li { margin-bottom: .625rem; }
.missing li::marker { color: var(--brand); }
.subhead { font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem); font-weight: 800; letter-spacing: -.025em; }
.blocks { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
.blocks li { padding: 1.5rem; border: 1px dashed var(--border); border-radius: 10px; }
.blocks p { margin: 0; }
.block-name { font-weight: 800; margin-bottom: .5rem !important; }

.prose section + section { margin-top: 3.5rem; }
/* The kit's footer, on the grey it has always had here, so it never merges with a white band. */
.sk-footer { background: var(--subtle); }

.prose h2 { font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem); }

.email::before { content: attr(data-user) "\\40" attr(data-domain); }

/* Bands next to each other, both light: a line between them. */
.band.ruled { border-top: 1px solid var(--border); }
/* A mode picked in the header makes every band that mode (tokens.css): a line keeps them apart. */
:root[data-theme="light"] .band + .band, :root[data-theme="dark"] .band + .band { border-top: 1px solid var(--border); }
.kicker { margin: 0 0 .75rem; }
.section-head h2 { max-width: 30ch; }
.button-secondary { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1.25rem; border: 2px solid var(--foreground); border-radius: 6px; color: var(--foreground); font-weight: 800; text-decoration: none; }
.button-secondary:hover { background: var(--foreground); color: var(--background); }

/* Front page: the opening, with the real screenshot. */
.hero-home h1 { max-width: 14ch; }
.hero-shot { margin: clamp(2.5rem, 7vw, 4.5rem) 0 0; }
.shot { display: block; width: 100%; height: auto; border: 1px solid var(--border); border-radius: 12px; background: var(--subtle); }
.hero-shot .shot { border-radius: 14px; box-shadow: 0 24px 80px rgb(0 0 0 / .55); }

/* The principles, each with a rule anyone can check. */
.principle-icon, .commitment-title .principle-icon { color: var(--brand); }
.principle-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12.5rem), 1fr)); gap: 1rem; margin: 0 0 2rem; padding: 0; list-style: none; }
.principle-grid li { display: flex; flex-direction: column; gap: .75rem; padding: 1.5rem 1.25rem; border: 1px solid var(--border); border-radius: 12px; background: var(--card); }
.principle-grid h3 { margin: 0; font-size: 1.125rem; line-height: 1.25; }
.principle-grid p { margin: 0; color: var(--muted); font-size: .9375rem; line-height: 1.5; }

/* The tools, by shelf, each a card with its screenshot. */
.shelf + .shelf { margin-top: 3rem; }
.shelf h3 { margin: 0 0 1rem; color: var(--muted); font-size: .875rem; letter-spacing: .1em; text-transform: uppercase; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 26rem), 1fr)); gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
.card { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: var(--card); }
.card .shot { border: 0; border-bottom: 1px solid var(--border); border-radius: 0; }
.card-body { display: flex; flex: 1; flex-direction: column; gap: .625rem; padding: 1.25rem 1.25rem 1.5rem; }
.card-body p { margin: 0; }
.card-title { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; }
.card-text { font-size: 1.0625rem; }
.card-meta { font-size: .875rem; }
.card-body .button-secondary { align-self: flex-start; margin-top: .5rem; }
.badge { padding: .125rem .5rem; border-radius: 999px; font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.badge.live { color: var(--accent); background: var(--accent-soft); }
.badge.beta { color: var(--foreground); border: 1px solid var(--border); }

/* How we build: three steps and the picture of the base. */
.build { display: grid; gap: 2.5rem; align-items: center; }
.build-steps { display: grid; gap: 1.75rem; margin: 0; padding: 0; list-style: none; }
.build-steps li { display: flex; gap: 1rem; align-items: flex-start; }
.build-steps .step-number { background: var(--brand); color: var(--brand-foreground); }
.build-name { margin: 0; color: var(--accent); font-size: .8125rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.build-steps h3 { margin: .125rem 0 .25rem; }
.build-steps p:last-child { margin: 0; color: var(--muted); }
.diagram { display: grid; gap: .75rem; margin: 0; }
.diagram-tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr)); gap: .5rem; margin: 0; padding: 0; list-style: none; }
.diagram-tools li { padding: .75rem .5rem; font-size: .9375rem; line-height: 1.3; border: 1px solid var(--border); border-radius: 10px; background: var(--card); font-weight: 700; text-align: center; }
.diagram-tools .diagram-next { border-style: dashed; background: transparent; color: var(--muted); }
.diagram-mould { margin: 0; color: var(--muted); font-weight: 700; text-align: center; }
.diagram-base { padding: 1.25rem; border-radius: 12px; background: var(--brand); color: var(--brand-foreground); }
.diagram-base p { margin: 0 0 .625rem; font-size: 1.25rem; font-weight: 800; }
.diagram-base ul { display: flex; flex-wrap: wrap; gap: .375rem; margin: 0; padding: 0; list-style: none; }
.diagram-base li { padding: .25rem .625rem; border-radius: 999px; background: rgb(0 0 0 / .12); font-size: .875rem; font-weight: 600; }
.closing { max-width: 36ch; margin: 3rem 0 0; font-size: clamp(1.375rem, 1.1rem + 1.1vw, 1.875rem); font-weight: 800; letter-spacing: -.02em; line-height: 1.25; }

/* What makes us different: a typical app next to seed-lab. */
.compare table { min-width: 0; table-layout: fixed; }
.compare th, .compare td { padding: .75rem .5rem; font-size: .875rem; line-height: 1.4; hyphens: auto; overflow-wrap: break-word; }
.compare tbody th { position: static; width: 26%; white-space: normal; }
.compare thead th { font-size: .6875rem; }
.compare thead td { background: var(--card); border-bottom: 1px solid var(--border); }
.compare .ours { font-weight: 700; }
.compare thead .ours { color: var(--accent); }
.yes { color: var(--positive); font-weight: 800; }
.no { color: var(--negative); font-weight: 800; }
.source { margin-top: 1rem; font-size: .875rem; }

/* The figures, measured when the site is built. */
.figures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 1.5rem; margin: 0; }
.figures div { display: flex; flex-direction: column-reverse; justify-content: flex-end; gap: .375rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.figures dd { margin: 0; color: var(--brand); font-size: clamp(2.5rem, 1.6rem + 3vw, 4rem); font-weight: 800; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }
.figures dt { color: var(--muted); font-size: .9375rem; line-height: 1.35; }

/* Principles, About, Roadmap: the same bands, denser. */
.commitment { display: grid; gap: 1rem 3rem; }
.commitment .label { margin-top: 0; }
.prose section + section { margin-top: 0; }
.prose section { display: grid; gap: .5rem 3rem; padding: 2.5rem 0; border-top: 1px solid var(--border); }
.prose section:first-child { padding-top: 0; border-top: 0; }
.prose section > :last-child { margin-bottom: 0; }

@media (min-width: 48rem) {
  .compare th, .compare td { padding: 1rem; font-size: 1rem; }
  .compare thead th { font-size: .8125rem; }
  .figures { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cards:has(> .card:only-child) { grid-template-columns: 1fr; }
  .card:only-child { display: grid; grid-template-columns: 3fr 2fr; }
  .card:only-child .shot { height: 100%; object-fit: cover; object-position: top left; border-right: 1px solid var(--border); border-bottom: 0; }
  .card:only-child .card-body { justify-content: center; padding: 2rem; }
}
@media (min-width: 60rem) {
  .build { grid-template-columns: 1fr 1fr; gap: 4rem; }
  .commitment { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .commitment-title, .commitment-text { grid-column: 1; }
  .commitment .label, .commitment .rules { grid-column: 2; }
  .commitment .label { grid-row: 1; }
  .commitment .rules { grid-row: 2 / span 2; }
  .prose { max-width: none; }
  .prose section { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
  .prose section > * { grid-column: 2; }
  .prose section > h2 { grid-column: 1; grid-row: 1 / span 9; }
  .ladder { grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: none; }
  .ladder .step { flex-direction: column; }
  .missing { columns: 2; column-gap: 3rem; max-width: none; }
  .missing li { break-inside: avoid; }
}
@media (min-width: 72rem) { .figures { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (forced-colors: active) { .state, .button { border: 1px solid; } }
`;

/** seed-kit's tokens and header/footer styles, then the hub's, without comments and spare spaces. */
export const STYLES = minifyCss(kitCss("tokens.css", "chrome.css") + CSS);
