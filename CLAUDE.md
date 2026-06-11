# CLAUDE.md — tithe

A single-file survival incremental that curdles into a god game. A cozy village
whose economy is slowly revealed to run on something underneath it. The player's
optimizer brain is the antagonist.

`index.html` is the whole game. `docs/DESIGN.md` is the design contract — §9
(the visual-layer amendment) is binding and outranks any instinct to dramatize.

## Commands

```
npm install        # once; jsdom is the only devDependency (the game has zero)
npm test           # headless playtest (must stay green before any commit)
npm run pace       # pure-math pacing sim — keep in sync with game constants
```

To play: open `index.html` directly in a browser. No server, no build step.

## The screen contract

One page, ALWAYS one screen — `overflow:hidden` on body; nothing may ever
scroll. Two regions, both reserved from boot:

- **Top ⅔ — the work.** Three columns: c1 you (actions, stores), c2 the
  village (population line, jobs table, buildings), c3 undertakings (projects,
  the shrine, miracles). Zones fill left → down → right; lists append in
  unlock order.
- **Bottom ⅓ — the field.** Flat-poster canvas of the settlement:
  seed-deterministic meadow, treeline left, quarry hill right. **The field IS
  the log — there is no text log.** Buildings appear at fixed anchors.
  Villagers are figures that walk between the huts and their job sites.

## Architecture invariants (family law; do not break)

1. **Single file.** All CSS and JS inline. Must remain double-clickable.
2. **Content/logic separation.** All content lives in def tables
   (`JOBS`/`BLD`/`PROJ`/`MIR`/`NAMES`/`LEX`/`SPRITES`/`ANCHORS`). Logic never
   contains content strings.
3. **Wall-clock time, never tick counts.** 100ms tick computes
   `dt = (Date.now() − state.last)/1000`. Throttle-immune by construction.
4. **Targeted DOM updates.** Cached nodes, textContent diffs. The canvas
   repaints only when its paint key changes, not on every tick.
5. **Saves are versioned and defensive.** `SAVE_VER` int; field-by-field
   `migrate()`; any state-shape change ⇒ bump version + extend migration.
   Autosave + `visibilitychange` + `beforeunload`. Export/import = base64 JSON.
6. **Offline progress on load**, linear `rate × delta`, capped (1h for now;
   the granary will raise it). Summarized by the field, never in prose.
7. **Reveal engine is the reward system.** Everything starts hidden; condition
   predicates un-hide once, persisted in `seen`, ~0.7s fade. First appearance
   is an event — protect it. **Carve-out (v3):** content may hide; mechanics
   the player is actively waiting on may not — every stallable gate gets a
   named threshold line. **The carrot rule:** from 0:30 to the last star each
   active column holds exactly ONE visible-but-unaffordable priced row
   (reveal at 60% affordability; 2 rungs early on exponential ladders) plus
   at most one `horizon` row. If it costs, it forecasts; if it changes the
   world for free, it may ambush.
8. **Accessibility floor:** real `<button>`s, ≥44px targets, visible focus,
   `prefers-reduced-motion` kills all ambient motion (user-initiated frame
   advances stay), single column degrades gracefully — but the one-screen law
   wins: content must fit.
9. `window.__tithe` exposes state + key functions for tests. Extend it with
   every new mechanic.
10. **Nothing placed ever moves** (UI): rows are built detached and placed at
    reveal; anything that appears or vanishes amid content gets a reserved
    ghost slot. On the field, buildings obey the same law at fixed anchors.

## Tithe's own laws

- **The actors law:** buildings never move; villagers always may. Figures walk
  between huts and job sites; how many walk where IS the jobs readout. Figure
  positions are a pure function of (job, index, walkPhase) — deterministic,
  nothing stored. Reduced motion parks every figure at its site. User clicks
  still advance a frame.
- **The tone law:** the UI never acknowledges the horror. No gore words, no
  exclamation marks. "stock", "yield", "throughput" — applied to people. The
  dread lives in the gap between clean numbers and what they mean.
- **The field is the log.** Log lines become absences: an offering is a figure
  that is no longer there. The offering button carries the victim's name
  (`an offering — mara`) in the same type as `12 wood`.
- **The picture remembers:** every offering adds one permanent red fleck at
  the shrine's base. Never animated, never mentioned, never removed.
- **The glow law, inverted at the turn:** the sky warms with total production
  until the first offering; after it, the warming stops and red creeps in with
  total favor. Light = narrative; then favor = narrative.
- **The red spread:** one accent, dried-blood red `#a14034`, meaning favor and
  everything favor touches. At sacrifice thresholds more UI text nodes pick up
  the accent class. Corruption is the only decoration the game gets.
- **Names:** ~48 curated lowercase names, consumed in seed-shuffled order
  (`nameIdx` persists). Names appear ONLY at moments of choice; counters use
  numbers. The dissonance is the design.
- **Determinism:** the field is generated from `state.seed`; crises and any
  future RNG use the seeded PRNG stored in the save. Tests stay deterministic.

## Aesthetic constraints (non-negotiable)

- Forbidden: cards, boxes, drop shadows, gradients, border-radius, icon packs,
  emoji in UI, particle effects, dashboard palettes, scrollbars.
- Monospace, all-lowercase, hairline rules, whitespace for hierarchy.
  Hidden > greyed-out > decorated.
- Text sparingly: names, numbers, the picture. **The effect-tease law (v3):**
  for any row with a mechanical effect, the effect line IS the tease — spec
  before purchase, rate after. Flavor survives only on rows without effects
  (story beats). No exclamation marks, no jokes. No second person outside
  button verbs. Word budget: act 1 ≤ 50, act 2 ≤ 35, act 3 ≤ 16, ending ≤ 14.
  The category-B atmosphere lines inventoried in DESIGN-V3 §8 are protected
  from punch-up. When in doubt, cut words.

## Balance reference

- `cost = ceil(base × rate^owned)`, rate 1.12–1.25 (see DESIGN §4).
- Plain JS numbers only; no big-number libs, ever.
- Benchmarks (`npm run pace` after any constant change — keep the sim in sync):
  first villager < 60s; first building < 45s; the Hunger Wall is the ONLY
  allowed >3min flat stretch, with the offering visible the whole time; first
  offering by bot < 8 min. If a benchmark needs grinding to pass, the game is
  wrong, not the bot.
- **Pace-sim v2 matrix (v3, binding):** three bots — Z (zero clicks after the
  first offering; must COMPLETE the game), R (0.8 c/s, reference timings),
  F (2.0 c/s, banded windows). Checks: zero-click completion; click share
  ≤ 12% of lifetime food+wood; overtake (wood prod ≥ 8/s before 4:30, hand
  ≤ 25% of automated rate from 4:00); policy spread ±20%; R90 (no ring gap
  > 90s from 0:30 to the LAST STAR, Wall exempt); decision density ≥ 4/300s
  pre-ascension, ≥ 2/300s after, never 0; carrot invariant; dial fairness
  ±15%; broke-ascend probe; field-event density (a scene quantum changes
  ≤ every 20s through ascension, ≤ every 30s in act 3). XFAIL ledger may
  shrink only.
- **The anchor law, amended (v3):** anchor COUNT capped forever (hut 5,
  farm 3, quarry 1, sawpit 1, granary 1); each anchor may DEEPEN in level
  (`S.lvl`), and the sprite must show the level at the same anchor. The
  ledger never outgrows the picture; the picture gains depth, not sprawl.
- **Arrivals walk (v3):** every arrival walks in from the treeline (6s);
  `pop++` lands when the walk ends. ONLY an offering leaves a 20s gap on the
  road. Starvation departures walk out. Comings and goings are the field's
  sentences.

## Testing discipline

- `npm test` green before any commit. Add assertions for every new mechanic.
- jsdom has no canvas 2d context — the scene stays testable as DATA:
  `villageScene()` returns figures/builds/flecks; tests assert on it, never
  pixels. Null ctx must be tolerated everywhere.
- Field tests assert: builds at anchors, figures count = pop, figures park at
  sites under reduced motion, flecks = offerings, seed determinism.

## State of the build

- v2 complete (all 11 DESIGN-V2 milestones, `64fb8e5`). Owner playtest
  verdict: the progression systems weren't satisfying — too much clicking,
  blind buys, static field, disconnected systems. v3 (the machine) is the
  revision: `docs/DESIGN-V3.md` is the contract; build order in its §9.
