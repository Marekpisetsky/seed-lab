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

## Follow-up requested before merging #33 (same day)

- Savings check: both sides, what savings give up against world stocks
  and world stocks' worst fall in the data (2000–2002, −46%) on the money
  they typically reach. Last round: two short sentences, "With savings you
  would end with €219,239 less than with world stocks." and "But stocks
  can fall: from 2000 to 2002 they fell at least 46% (−€170,390)." "At
  least" because the data are yearly; How it works says that within a year
  the fall may have been deeper.
- AGENTS.md sends to the handoff with the highest date, never a fixed
  file; a test (src/lib/handoff.test.ts) keeps it so.
- Step 3 takes −50% to 500% a year (GROWTH_LIMITS; 500% is a technical
  limit, documented in research/wealth-lens/crecimiento.md). Over 50%, a
  stronger warning with euros; its first sentence is checked against the
  data (lib/realism.ts keptRecords): NVDA kept 64% a year in 2016–2026,
  so the app names it instead of saying no company did. The requested
  sentence had 13 words; reordered to 12 for the plain-language test.
- Huge amounts in words or powers of ten (seed-kit format.ts: "€1.23
  billion", "1230 millones de euros", "€4.02 × 10¹⁸"); big number, cards
  and What if shrink or stack on a phone so nothing is cut. A negative
  custom growth reads "losing 50% a year".
- Performance, last round: the first screen only asks, so the
  calculation's code arrives when the person starts using the page
  (src/hooks/use-lazy-calculation.ts, guarded by a test in entry.test.ts);
  steps take reference inflation from seed-kit inflation-rates.ts (3 KB,
  generated from the cost-of-living data and checked by a test) instead of
  the whole country data; seed-kit builds its date formats and the euro's
  position on first use. Scripts on the first screen: 226 to 206 KB gzip.

## Verification (phase 6 head, after merging phase 5 and master)

Wealth Lens lint, types, 841 unit tests, clean build (`rm -rf .next out`)
and 34 browser tests passed; seed-kit 66, hub 34 + 8, Cost Lens 24,
Inflation Lens 31, Forja 7. Recalculation in the browser, 156 changes
including typing 500%, 70% and −50%: median 0.7 ms, p95 2.2 ms, max
11.0 ms. Lighthouse mobile performance, machine at rest: / 98 in six runs
in a row, /es 98 in three; /how-it-works 98, /es/how-it-works 99; 100 in
the other three categories. Measured right after another heavy run, / gave
95 or 96 once; the series at rest is the reference. First-visit weight
208–237 KB (/ 222.6 KB, was 242.6). No requests outside the site; no
cookies or browser storage. Screenshots in docs/screenshots (p5-*, p6-*,
r3-*).

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
- The step 3 warning over 50%: the request's sentence reordered to 12
  words, and a company of the data named when it did keep the rate.

Do not infer desired purchase dates, shared spending deductions, or advice
from the wishes or the checks.
