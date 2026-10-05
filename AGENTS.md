# Working on seed-lab

Read [docs/direction.md](docs/direction.md) before planning or changing a
product. It is the canonical project vision, including Marek's clarification
of 2026-10-05. Read the relevant product README and nested AGENTS.md next.

## Product direction

- seed-lab is the home of free public tools; the financial suite aspires to
  be an "Office for finance". Forja develops the shared infrastructure.
  Microsoft and NVIDIA are ambition analogies, not claims about what exists.
- Start with Europe, with a worldwide ambition and common product direction.
  Users retain their own data and decisions.
- Explain through results, charts, comparisons and controls first. Keep
  visible text minimal and familiar. Put longer explanations behind details;
  keep material assumptions and limitations beside the result. Preserve
  keyboard and screen-reader access; never rely on colour or icons alone.
- Wishes belong to users. Research aspirations and offer locally relevant
  examples; users choose or enter their own. Time horizons follow their plan,
  not a fixed short/medium/long classification.
- Free use does not mean open-source code. Respect LICENSE and TRADEMARKS.md.

## Continuity and verification

- Current user instructions take precedence. Compare old conversations with
  current source, specs and GitHub branch/PR state before resuming work.
- For the interrupted Wealth Lens work, read
  [the handoff](projects/wealth-lens/docs/continuity-2026-10-04.md).
  Do not touch hosting migration PR #17 or its branch.
- Record settled direction here through docs/direction.md; record feature
  semantics in the product spec and methods in research/. Keep current task
  status in a dated handoff. Do not turn proposals into confirmed decisions.
- Use relevant installed agent-skills before substantial engineering; use
  test-driven-development for new logic/bugs, debugging-and-error-recovery
  for unexpected behaviour, and review before completing code changes.
- Use task-observer during substantial sessions when installed. Keep local
  observations outside temporary worktrees. Ask at closure whether there are
  recorded observations.
- Before each Wealth Lens commit run npm run lint, npm run typecheck,
  npm test and npm run build in projects/wealth-lens. Follow other packages'
  own checks when changing them. Do not claim measurements not performed.
- Preserve zero-cost, static export, no external runtime price APIs,
  in-browser personal data, EN/ES and accessible mobile use. Do not change
  financial methods or assumptions without the corresponding Research entry.
