import { readFileSync } from "node:fs";

/**
 * All the hub's styles, inlined in every page: one request less, and no
 * flash. The colours come from tokens.css, the same file Wealth Lens uses:
 * white or near-black, neutral greys, one electric blue. The system's own
 * font, strong headings, lots of space. Light or dark follows the device;
 * nothing is stored.
 */

const TOKENS = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

const CSS = /* css */ `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
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
.wrap { max-width: 70rem; margin: 0 auto; padding: 0 1.25rem; }
.narrow { max-width: 42rem; }
.skip { position: absolute; left: -999rem; top: .75rem; padding: .75rem 1rem; background: var(--card); color: var(--foreground); border-radius: 8px; z-index: 1; }
.skip:focus { left: .75rem; }
.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
main:focus { outline: none; }

.top { border-bottom: 1px solid var(--border); background: var(--background); }
.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .25rem 1rem; padding-top: .5rem; padding-bottom: .5rem; }
.mark { display: inline-flex; align-items: center; gap: .5rem; min-height: 44px; color: var(--foreground); font-weight: 800; font-size: 1.125rem; letter-spacing: -.02em; text-decoration: none; }
.mark svg { color: var(--accent); }
.menu { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; margin: 0 -.5rem; padding: 0; list-style: none; }
.menu a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; justify-content: center; padding: 0 .75rem; border-radius: 8px; color: var(--foreground); font-weight: 500; text-decoration: none; }
.menu a:hover { background: var(--subtle); }
.menu a[aria-current="page"] { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .35em; }
.langs { display: inline-flex; margin-left: .25rem; border: 1px solid var(--border); border-radius: 10px; padding: 0; list-style: none; }
.langs a { font-size: .9375rem; font-weight: 700; }
.langs a[aria-current="true"] { background: var(--foreground); color: var(--background); }

main { padding: clamp(3rem, 8vw, 6rem) 0 6rem; }
h1, h2, h3 { line-height: 1.15; letter-spacing: -.02em; margin: 0 0 1rem; font-weight: 750; }
h1 { font-size: clamp(2.25rem, 1.4rem + 3.8vw, 3.75rem); line-height: 1.05; letter-spacing: -.035em; font-weight: 800; max-width: 20ch; }
h2 { font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem); letter-spacing: -.025em; font-weight: 800; }
h3 { font-size: 1.1875rem; font-weight: 700; }
.lead { font-size: clamp(1.125rem, 1.05rem + .45vw, 1.375rem); color: var(--muted); max-width: 40rem; }
.section { margin-top: clamp(4.5rem, 10vw, 7.5rem); }
.section-head { max-width: 42rem; margin-bottom: 2rem; }
.section-head p { color: var(--muted); }

.principles { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1rem; margin: 0 0 1.5rem; padding: 0; list-style: none; }
.principles li { display: flex; flex-direction: column; gap: .875rem; padding: 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: 14px; font-weight: 700; line-height: 1.35; }
.principles svg, .principle-icon { color: var(--accent); }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr)); gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
.card { display: flex; flex-direction: column; gap: .5rem; padding: clamp(1.25rem, 3vw, 2rem); background: var(--card); border: 1px solid var(--border); border-radius: 16px; }
.card h3 { margin: 0; }
.card p { margin: 0; }
.card .tagline { font-size: 1.25rem; font-weight: 700; line-height: 1.3; letter-spacing: -.01em; }
.card .muted, .muted { color: var(--muted); }
.card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1.25rem; margin-top: 1rem; }
.cards.quiet { grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); }
.cards.quiet .card { background: transparent; border-style: dashed; }

.badge { display: inline-block; padding: .125rem .625rem; border-radius: 999px; font-size: .8125rem; font-weight: 700; line-height: 1.5; white-space: nowrap; }
.badge.live { color: var(--accent); background: var(--accent-soft); }
.badge.coming { color: var(--muted); border: 1px dashed currentColor; }
.badge.pending { color: var(--foreground); background: var(--subtle); border: 1px solid var(--border); }

.button { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1.25rem; border-radius: 10px; background: var(--accent); color: var(--accent-foreground); font-weight: 700; text-decoration: none; }
.button:hover { filter: brightness(1.1); }
.link { display: inline-flex; align-items: center; min-height: 44px; font-weight: 600; }

.principle { padding-top: 3rem; margin-top: 3rem; border-top: 1px solid var(--border); }
.principle-title { display: flex; align-items: flex-start; gap: .875rem; }
.principle-title span { color: var(--muted); font-variant-numeric: tabular-nums; }
.columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
.columns h3 { font-size: .875rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.columns ul { margin: 0; padding-left: 1.125rem; }
.columns li { margin-bottom: .625rem; }
.columns li .badge { margin-right: .375rem; }

.prose section { margin-top: 3.5rem; }

.foot { border-top: 1px solid var(--border); color: var(--muted); font-size: .9375rem; }
.foot .wrap { display: grid; gap: .75rem; padding-top: 2.5rem; padding-bottom: 3rem; }
.foot p { margin: 0; }
.foot ul { display: flex; flex-wrap: wrap; gap: 0 1.25rem; margin: 0; padding: 0; list-style: none; }
.foot a { display: inline-flex; align-items: center; min-height: 44px; }
.weight { font-variant-numeric: tabular-nums; }
.email::before { content: attr(data-user) "\\40" attr(data-domain); }
.copyright { color: var(--foreground); font-weight: 600; }

@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (forced-colors: active) { .badge { border: 1px solid; } }
`;

/** The tokens and the styles, without comments and spare spaces. */
export const STYLES = (TOKENS + CSS)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};:,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();
