# DESIGN — "tithe"

### a survival incremental that curdles into a god game

Third sibling in the station-signal family. Same engine DNA, same invariants
(CLAUDE.md applies in full: single file, vanilla JS, definition tables, wall-clock
tick, versioned saves, reveal engine, lowercase microcopy).

> **Owner's doc, recorded verbatim below. The visual-layer addendum (§9) is the
> binding amendment: this family's law is that the picture is the log, so every
> log line in §1–§8 is reinterpreted as something the field shows instead.**

-----

## 1. Concept and tone

A cozy text survival-colony game (RimWorld energy: named villagers, jobs, weather,
small crises) whose economy is slowly revealed to run on something underneath it.
The player's optimizer brain is the antagonist: every dark step is opt-in,
mathematically irresistible, and labeled in cheerful bureaucratic copy.

Tone law: **the UI never acknowledges the horror.** Comedy and dread both come from
the gap between clean numbers and what they mean. No gore words, no exclamation
marks. "throughput," "yield," "stock" — applied to people.

## 2. The twist (two-stage, do not announce either)

**Turn 1 — the shrine (mid-game identity reveal).** Act 1 reads as "you are the
village chief." After the first offering, copy quietly shifts: section header
"actions" becomes "answers"; the gather button's tooltip was a prayer all along;
a beat lands it: *"they were never your hands."* The player is not the chief —
the player is the thing the villagers dug up on day one. Every click was the
village asking, and you answering. Retroactively recontextualizes the whole
opening (A Dark Room's trick).

**Turn 2 — the cycle (endgame reveal).** When the last star is consumed, the
ending screen shows a stat that has been silently tracked since first install:
`universes: N`. The prestige loop ("begin again") was never a meta-mechanic —
it is canon. The god has done this before; resets are the god forgetting.
Final choice, Paperclips-style: **hunger on** (consume → NG+ with multiplier,
counter increments, the cycle is the villain and you are keeping it) or
**starve** (refuse; the god gutters out; a one-screen epilogue written from a
villager descendant's view; the true ending). Sacrifice along the way is
unavoidable — the only refusal the game offers is the last one.

## 3. Structure — three acts, Paperclips-style economy turnover

Each act *replaces* most of the previous act's surface. Old panels collapse into
a single summary line; new systems take the screen. Depth comes from turnover,
not accumulation.

### ACT 1 — the settlement (target: first ~30 min)

*Plays as honest survival. Earn the cozy before you spend it.*

- **Resources:** food, wood, stone. **Population:** villagers (named).
- **Manual verb:** `gather` (+1 food or wood, toggled).
- **Villagers arrive** when food surplus crosses thresholds (Kittens pattern);
  each eats **0.5 food/s** (upkeep = survival pressure; if food hits 0, one named
  villager leaves — never dies yet — log: *"aldo walked into the treeline."*).
- **Jobs allocation table** (the RimWorld organ): forager / woodcutter / mason /
  healer. +/- buttons per row; idle pool. Production = workers × base × milestones.
- **Buildings (generators):** hut (pop cap +2), farm, sawpit, quarry, granary
  (offline cap +), and **the shrine** — found, not built: revealed by a beat at
  ~400 total stone: *"the quarry breaks into a hollow. something is already there."*
- **Projects panel** (Paperclips' narrative organ): one-time purchases —
  fire, tools, salt, medicine, deeper wells… and `excavate the shrine`.
- **Crises:** deterministic, threshold-triggered (cold snap at day N, rats in the
  granary at food > X). Each costs resources and introduces a named villager doing
  something brave. Purpose: attachment. RNG allowed only with a seeded PRNG stored
  in save (tests must stay deterministic).
- **The Hunger Wall (intentional, the only allowed >3min wall):** after the shrine
  is excavated, tune costs so growth goes nearly flat. The shrine panel sits there
  with one button: `an offering — 1 villager`. Yield: ×8 to all production for a
  while + first **favor**. The math tempts; the player chooses. The log names the
  villager taken: *"the shrine takes mara. the harvest doubles."*

### ACT 2 — the congregation (target: ~30–90 min)

*The economy inverts: people stop being the point and become the pipe.*

- **New currency: favor** (god power). Sources: worship (priests: 0.2 favor/s
  each), offerings (manual, named, escalating yield), then **the tithe** —
  automation that converts population/s into favor/s via a slider. The core gag:
  a readout that eventually says `tithe: 4,210 souls/s` in the same calm type
  as `food: +12/s`.
- **Jobs table mutates:** healer→**cultivator** (breeds population faster — the
  chain becomes food → villagers → favor), new **priest**, new **zealot**.
  Population panel renames to **stock** after turn 1. Birth rate vs tithe rate is
  the act's optimization problem (herd management — RimWorld inverted).
- **Miracles (spend favor):** global multipliers with euphemism names
  (`a good year ×2 food`, `obedience ×2 worship`, `the quickening ×2 births`).
- **Conquest opens:** scouts find *other lights* — neighboring villages.
  Sub-system: raise a **host** (allocate favor across strength / speed / fervor),
  send vs a defense score, win% = fervor-weighted formula, deterministic roll from
  seeded PRNG. Victory: village absorbed → permanent favor/s + population influx.
  Loss: host consumed, log mourns nobody.
- **Prestige layer 1 — ascension:** consume your own settlement entirely.
  Resets acts 1–2; grants **divinity** = `floor((totalFavor / 1e6) ^ 0.5)`
  (Heavenly-Chips shape), each point = +10% all production, permanent.
  Gate Act 3 behind divinity ≥ 3 (forces ≥1 ascension; the cradle must be eaten).
  Copy: *"begin again. the village will not remember. you will."*

### ACT 3 — the hunger (target: ~90–150 min)

*Scope snap: planets are the new villagers.*

- **Units:** worlds, souls (scientific notation — population of conquered space),
  favor continues. Earth-village UI collapses to one line: `the first world: tithed`.
- **Heralds** (Paperclips probes): self-replicating missionaries. Sliders allocate
  herald-favor across `replicate / convert / war`. Opposition force: **the silence**
  (rival nothing-god; the Drift analog) erodes worlds if war is underfunded —
  the act's tension knob.
- **Galaxy ladder = built-in prestige 2:** each galaxy consumed re-rolls the world
  board harder/faster with a stacking multiplier. Numbers run to ~1e60–1e80
  (atoms-in-universe scale). **Still plain JS numbers — no big-number library.**
- **Endgame:** project `the last star`. Then turn 2 (the cycle reveal) and the
  final choice (hunger on / starve).

## 4. Balance reference (start here, then pace-sim)

- Costs: `ceil(base × rate^owned)`; rate **1.10–1.12** (act 1), **1.13–1.15**
  (act 2 structures), conquest targets **×1.35** per village.
- Milestones 10/25/50 owned ⇒ ×2 (buildings and job headcounts both).
- Offering favor yield: `5 × 1.5^offerings` (manual, named).
  Tithe: `0.1 souls/s` per tithe-engine level, level cost ×1.3.
- Upkeep: 0.5 food/villager/s; priests and zealots eat double (flavor + tradeoff).
- First villager < 60s. First building < 45s. The Hunger Wall: 3–4 min max with
  the offering button visible the whole time. No other wall > 3 min.
- Bot completion target (extend tools/pace-sim.js with act modeling):
  **30–45 min** ≈ 2–4 h human. Re-verify after every balance change.

## 5. Presentation

- House style: dark warm monochrome, lowercase mono, hairlines, fade reveals,
  44px targets, reduced-motion support. **No cards/shadows/gradients/icons.**
- **One accent: dried-blood red (`#a14034` family), meaning = favor and
  everything favor touches.** Diegetic signature (Gnorp inverted): the red
  *spreads* — at total-sacrifice thresholds, more UI text nodes pick up the
  accent class, until by Act 3 the page is mostly red-on-dark. Corruption as
  the only animation the game needs.
- Names: small curated list (~60), consumed in order from a seeded shuffle;
  every sacrifice log uses a name while counters use numbers. The dissonance
  is the design.
- Retroactive renames at turn 1 via a `LEXICON` table the renderer reads
  (`villagers→stock`, `actions→answers`, `chief→shepherd`) — one mechanism,
  many knife-twists.

## 6. Engineering (inherit the family skeleton)

- Definition tables: `RESOURCES, JOBS, BUILDINGS, PROJECTS, MIRACLES, BEATS, NAMES, LEXICON, HOSTS, HERALD_CONFIG, ENDINGS`. Logic never holds content.
- 100ms wall-clock tick; targeted DOM updates; act panels are sections the
  reveal engine shows/collapses.
- Save: `SAVE_VER`, migrate(), autosave + visibilitychange + beforeunload,
  base64 export/import, offline cap 8h (tithe continues offline — say so:
  *"while you were away the tithe kept on. +N favor."*).
- Seeded PRNG (mulberry32) stored in save → crises/combat reproducible in tests.
- `window.__tithe` debug handle from day one (state + tick + buy fns) — tests
  are not optional; port the jsdom harness, target ≥40 assertions including:
  the Hunger Wall tempts (flat growth measured), offering fires turn-1 renames,
  ascension grants correct divinity, herald war vs the silence converges,
  both endings reachable, `universes` counter survives prestige AND export/import.

## 7. Build order (one tested commit per stage)

1. Act 1 economy: gather, food/wood/stone, villagers+upkeep, jobs table, 3 buildings, saves, tests.
2. Projects panel + crises + names + shrine reveal + the Hunger Wall (pace-sim proves the wall).
3. The offering, turn-1 beats, LEXICON renames, favor, priests, miracles.
4. The tithe automation + stock management + conquest hosts.
5. Ascension/divinity prestige; pace-sim act-1+2 loop verified.
6. Act 3: worlds, souls, heralds vs the silence, galaxy ladder.
7. The last star, turn 2, both endings, `universes` counter, full-arc test.
8. Tune to benchmarks; corruption-spread polish; a11y pass; ROADMAP/README updates.

-----

## 9. The visual-layer amendment (owner + agent, June 2026 — binding)

This family has no text log. **The field is the log.** The bottom third of the
screen is a flat-poster canvas of the settlement — meadow, treeline, quarry
hill — and everything §1–§8 wants to *say*, the field *shows*:

- **The actors law (new, tithe's own):** buildings never move; villagers always
  may. Figures are the moving part of the economy — they walk between the huts
  and their job sites, and how many walk where IS the jobs readout. Figure
  positions are a pure function of (job, index, phase): deterministic, nothing
  stored, reduced-motion parks every figure at its site. This is the layer that
  makes the game stand out; protect it.
- **Log lines become absences.** *"the shrine takes mara"* is not printed —
  mara's figure is gone and the count is one fewer. The offering button itself
  carries the name (`an offering — mara`), so the choice is named at the moment
  of choice, in the same calm type as `12 wood`.
- **The picture remembers.** Every offering adds one permanent red fleck at the
  shrine's base. The flecks never leave, never animate, and are never mentioned.
  By act 2 the hillside is speckled. This is the sacrifice counter.
- **The shrine is found, visually.** The hollow appears on the quarry hill the
  moment the beat fires — a dark opening that was "always there" (it is drawn
  from the seed; the player just couldn't see it yet).
- **Turn 1 lands in the picture too:** the village keeps working when you stop
  clicking; after the first offering the sky's glow stops warming and the red
  begins creeping in (glow law inverted — light was narrative, now favor is).
- The red-spread (§5) stays as written: UI text nodes pick up the accent class
  at sacrifice thresholds. The canvas and the type corrupt together.

Prototype scope (current): act 1 complete + turn 1 + first taste of act 2
(priests, two miracles), ending on a teased `the tithe` marked to be continued.
Acts 2 (full) and 3 follow the owner's playtest verdict.
