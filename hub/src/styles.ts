import { readFileSync } from "node:fs";

/**
 * All the hub's styles, inlined in every page: one request less, and no
 * flash. The colours come from seed-kit's tokens.css, the one file every
 * app uses: white or near-black, neutral greys, one seed green. The header
 * and footer are seed-kit's too (chrome.css). Pages alternate
 * near-black and white bands (.theme-dark and .theme-light), the same
 * whatever the device's mode, so a page is never one dark block. The
 * system's own font, big strong headings, lots of space; nothing is stored.
 */

const KIT = new URL("../../packages/seed-kit/src/", import.meta.url);
const TOKENS = readFileSync(new URL("tokens.css", KIT), "utf8");
const CHROME = readFileSync(new URL("chrome.css", KIT), "utf8");

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

.principles { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); gap: 1rem; margin: 0 0 2rem; padding: 0; list-style: none; }
.principles li { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; font-weight: 800; font-size: 1.0625rem; line-height: 1.3; letter-spacing: -.01em; }
.principles svg, .principle-icon { color: var(--brand); }

.product .tagline { font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem); font-weight: 800; letter-spacing: -.025em; line-height: 1.2; max-width: 32ch; margin-bottom: 1.25rem; }
.product .muted { max-width: 42rem; font-size: 1.125rem; }

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

@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (forced-colors: active) { .state, .button { border: 1px solid; } }
`;

/** The tokens and the styles, without comments and spare spaces. */
export const STYLES = (TOKENS + CHROME + CSS)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};:,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();
