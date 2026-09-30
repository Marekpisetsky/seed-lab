/**
 * All the hub's styles, inlined in every page: one request less, and no
 * flash. Warm and sober: paper and ink colours, the system's own font,
 * lots of space. Light or dark follows the device; nothing is stored.
 *
 * Text colours keep at least 7:1 on their background, badges 4.5:1.
 */

const CSS = /* css */ `
:root {
  color-scheme: light dark;
  --bg: #fbf8f3; --surface: #ffffff; --ink: #1f1b16; --muted: #5b5349; --line: #e6dfd4;
  --accent: #8a3b12; --accent-soft: #f4e8dd; --on-accent: #fbf8f3;
  --live-ink: #2f5a34; --live-bg: #e3eee0; --pending-ink: #6b4700; --pending-bg: #f7ebc8;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #171412; --surface: #211d19; --ink: #f2ede6; --muted: #b8ad9f; --line: #3a332c;
    --accent: #f0a36b; --accent-soft: #2e231b; --on-accent: #171412;
    --live-ink: #a9d7ae; --live-bg: #1f2b21; --pending-ink: #f1d08a; --pending-bg: #30281a;
  }
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 1.0625rem/1.65 system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
}
a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: .2em; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
p, ul, ol { margin: 0 0 1rem; }
strong { font-weight: 650; }
.wrap { max-width: 68rem; margin: 0 auto; padding: 0 1.25rem; }
.narrow { max-width: 42rem; }
.skip { position: absolute; left: -999rem; top: .75rem; padding: .75rem 1rem; background: var(--surface); color: var(--ink); border-radius: 8px; z-index: 1; }
.skip:focus { left: .75rem; }
.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
main:focus { outline: none; }

.top { border-bottom: 1px solid var(--line); }
.bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .25rem 1rem; padding-top: .5rem; padding-bottom: .5rem; }
.mark { display: inline-flex; align-items: center; gap: .5rem; min-height: 44px; color: var(--ink); font-weight: 700; font-size: 1.125rem; letter-spacing: -.01em; text-decoration: none; }
.mark svg { color: var(--accent); }
.menu { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; margin: 0 -.5rem; padding: 0; list-style: none; }
.menu a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; justify-content: center; padding: 0 .75rem; border-radius: 8px; color: var(--ink); text-decoration: none; }
.menu a:hover { background: var(--accent-soft); }
.menu a[aria-current="page"] { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .35em; }
.langs { display: inline-flex; margin-left: .25rem; border: 1px solid var(--line); border-radius: 10px; padding: 0; list-style: none; }
.langs a { font-size: .9375rem; font-weight: 600; }
.langs a[aria-current="true"] { background: var(--ink); color: var(--bg); }

main { padding: clamp(2.5rem, 6vw, 5rem) 0 5rem; }
h1, h2, h3 { line-height: 1.2; letter-spacing: -.015em; margin: 0 0 1rem; }
h1 { font-size: clamp(2rem, 1.3rem + 3.2vw, 3.25rem); line-height: 1.1; letter-spacing: -.025em; max-width: 21ch; }
h2 { font-size: clamp(1.5rem, 1.25rem + 1vw, 1.875rem); }
h3 { font-size: 1.1875rem; }
.lead { font-size: clamp(1.125rem, 1.05rem + .4vw, 1.3125rem); color: var(--muted); max-width: 40rem; }
.section { margin-top: clamp(4rem, 9vw, 6.5rem); }
.section-head { max-width: 42rem; margin-bottom: 2rem; }
.section-head p { color: var(--muted); }

.principles { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1rem; margin: 0 0 1.5rem; padding: 0; list-style: none; }
.principles li { display: flex; flex-direction: column; gap: .75rem; padding: 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; font-weight: 600; line-height: 1.35; }
.principles svg, .principle-icon { color: var(--accent); }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr)); gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
.card { display: flex; flex-direction: column; gap: .5rem; padding: clamp(1.25rem, 3vw, 2rem); background: var(--surface); border: 1px solid var(--line); border-radius: 16px; }
.card h3 { margin: 0; }
.card p { margin: 0; }
.card .tagline { font-size: 1.1875rem; font-weight: 600; line-height: 1.35; }
.card .muted, .muted { color: var(--muted); }
.card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1.25rem; margin-top: 1rem; }
.cards.quiet { grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); }
.cards.quiet .card { background: transparent; border-style: dashed; }

.badge { display: inline-block; padding: .125rem .625rem; border-radius: 999px; font-size: .8125rem; font-weight: 650; line-height: 1.5; white-space: nowrap; }
.badge.live { color: var(--live-ink); background: var(--live-bg); }
.badge.coming { color: var(--muted); border: 1px dashed currentColor; }
.badge.pending { color: var(--pending-ink); background: var(--pending-bg); }

.button { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1.125rem; border-radius: 10px; background: var(--accent); color: var(--on-accent); font-weight: 650; text-decoration: none; }
.button:hover { filter: brightness(1.08); }
.link { display: inline-flex; align-items: center; min-height: 44px; }

.principle { padding-top: 2.5rem; margin-top: 2.5rem; border-top: 1px solid var(--line); }
.principle-title { display: flex; align-items: flex-start; gap: .875rem; }
.principle-title span { color: var(--muted); font-variant-numeric: tabular-nums; }
.columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
.columns h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.columns ul { margin: 0; padding-left: 1.125rem; }
.columns li { margin-bottom: .625rem; }
.columns li .badge { margin-right: .375rem; }

.prose section { margin-top: 3rem; }

.foot { border-top: 1px solid var(--line); color: var(--muted); font-size: .9375rem; }
.foot .wrap { display: grid; gap: .75rem; padding-top: 2rem; padding-bottom: 2.5rem; }
.foot p { margin: 0; }
.foot ul { display: flex; flex-wrap: wrap; gap: 0 1.25rem; margin: 0; padding: 0; list-style: none; }
.foot a { display: inline-flex; align-items: center; min-height: 44px; }
.weight { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (forced-colors: active) { .badge { border: 1px solid; } }
`;

/** The same CSS, without comments and spare spaces. */
export const STYLES = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();
