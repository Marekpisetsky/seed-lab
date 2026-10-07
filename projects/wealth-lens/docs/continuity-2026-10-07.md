# Handoff — 2026-10-07: wishes by country and Check your plan

Base: master at fcbd8ef (prices of 2026-10-07), with #26–#31 merged.
PR #17's hosting migration and its branch remain untouched.

Two branches, one PR each, to merge in this order:

1. `claude/wl-p5-wishes` (PR #32): "With this you could" under the big
   number, prices by country and the new headline. It merges master in.
2. `claude/wl-p6-check` (the phase 6 PR): "Check your plan". It comes out
   of the phase 5 branch and merges it in, so merging it alone brings both.

## Phase 5: wishes

- Up to three wishes under the big number, each with icon, price and when
  the plan gets there. Tapping one adds it to My goals as a priority (★).
- Rule (src/lib/wishes.ts, research/wealth-lens/deseos.md), following
  docs/direction.md and Marek's note of 2026-10-05: the person's own
  priorities first; then one example per open area (experiences, housing,
  time), the dearest the plan reaches within its own years, else the
  cheapest with its date; nothing beyond 60 years. No fixed short, medium
  or long. Living without working is master's `freedom` goal at the
  prices' country, rent included. No `stopWorking` field: the data file
  stays at version 10.
- Prices of: the region of the browser's language (seed-kit `regionOf`,
  `pricesCountry`), six countries (NL, ES, DE, FR, IT, PT), Netherlands
  otherwise. In memory only: not stored, not in the data file. It affects
  wishes and goals only, not inflation ("Rising prices in").
- Dataset: src/data/connections.json, each price with publisher, basis,
  date and "≈" for estimates.

## Phase 6: Check your plan

- 0 to 3 observations after What if (src/lib/plan-check.ts, words in
  src/i18n/check-text.ts, research/wealth-lens/chequeo.md):
  horizon (plan or a goal under 5 years, volatile money, from 1 in 10
  futures below what was put in), concentration (one stock over 20% of
  the mix or of My portfolio, index funds aside; replaces the 40% finding)
  and savings (savings account for 10 years or more, against what was put
  in and against world stocks).
- Every percent with its euros. The euros come from the percent and the
  euros as shown, and gaps from rounded figures, so sums can be checked
  by hand. Each links to its section of How it works and its research
  anchor. It never says what to buy, sell or weigh
  (research/legal/informar-no-aconsejar.md, item 4).

## Verification (phase 6 head, after merging phase 5 and master)

Wealth Lens lint, types, 826 unit tests, clean build (`rm -rf .next out`)
and 32 browser tests passed. Recalculation in the browser, 156 changes:
median 0.7 ms, p95 3.3 ms, max 10.0 ms. Lighthouse mobile performance:
/ 96, /es 98, /how-it-works 96, /es/how-it-works 99; 100 in the other
three categories. First-visit weight 214–241 KB. No requests outside the
site; no cookies or browser storage. Screenshots in docs/screenshots
(p5-*, p6-*).

## Open for Marek

- Price sources read through search engines or press (blocked sites):
  listed in research/wealth-lens/deseos.md, "Pendiente de comprobar".
  Japan's figure is the January 2026 preliminary one.
- The legal sheet (research/legal/informar-no-aconsejar.md) needs a
  professional's review, including the recital numbers it cites.
- The wishes rule replaces the phase request's fixed horizons because
  docs/direction.md says so; confirm or change it in src/lib/wishes.ts.
- The savings check compares with world stocks over their own period;
  confirm that this comparison reads as information, not advice.

Do not infer desired purchase dates, shared spending deductions, or advice
from the wishes or the checks.
