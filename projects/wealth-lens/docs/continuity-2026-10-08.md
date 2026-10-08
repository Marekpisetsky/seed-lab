# Handoff — 2026-10-08: state after phases 5 and 6, and where context lives

Base: master at c2513bd (prices of 2026-10-08). No product code changed in
this session; it only reviewed state and fixed the project's entry points.

## State of master

- PRs #26–#33 are merged. Phase 5 (wishes and prices by country, #32) and
  phase 6 (Check your plan, #33) are on master; the handoff of 2026-10-07
  describes both and its "Open for Marek" list still stands.
- The daily "Update prices" workflow ran successfully every day from
  2026-10-04 to 2026-10-08.
- Wealth Lens is live on Vercel. Cost Lens and Inflation Lens remain hidden
  betas.

## PR #17: hosting migration (clarified by Marek, 2026-10-08)

PR #17 is the planned move from Vercel to a real European host
(statichost.eu, one static site: hub at `/`, Wealth Lens at
`/wealth-lens/`). It is **not discarded**: it waits until the pages are
polished. Marek decides when it starts. Until then do not touch the PR or
its branch. It now conflicts with master (opened 2026-10-01, before
phases 1–6), so it will need rebasing or redoing against current master
when it is resumed; docs/hosting.md has the steps.

## Entry points corrected

- The root `HANDOFF.md`, added on 2026-10-07 outside the dated-handoff
  rule, is removed: it duplicated docs/direction.md, listed #26–#29 as
  pending, phase 5 as not implemented and PR #17 as discarded, none of
  which is true. The rule in AGENTS.md stands: the current status is the
  `continuity-*.md` with the highest date in this folder.
- Order to read before working: AGENTS.md → docs/direction.md → the
  product README → the latest handoff here → the relevant sheets in
  research/.

## Public and private material

This repository is public. Everything committed (including docs/,
research/ and these handoffs) can be read by anyone, and stays in the git
history even if a file is later removed. Methods and sources are public by
principle (docs/direction.md, principle 2); the code is proprietary
(LICENSE). Internal reasoning that should not be published (business
thinking, personal context, unconfirmed ideas) belongs outside this
repository, in Marek's private notes, and must not be copied here.

## Open for Marek

- Everything under "Open for Marek" in the handoff of 2026-10-07.
- When to resume PR #17 and with which domain.
- Where the private project notes should live long-term (local notes only,
  or a separate private repository).
