# tithe — DESIGN v3 (the machine)

This document revises DESIGN-V2 after the owner's playtest of the completed game
(`64fb8e5`). The verdict, verbatim core: **"the systems of progression themselves
weren't satisfying enough."** Too much clicking (clicking was in fact the optimal
strategy — verified: a 2/s hand out-produces the village's theoretical maximum
wood corps forever); confusing what to do (every purchase was a blind buy; the
post-molt spine had no visible mechanics); the field went static (structurally
complete at 28% elapsed); systems didn't interconnect (one cross-system
multiplier in the whole game); the voice told the player how to feel (9 lines,
all parked on the emotional peaks).

V3 is one structural move applied everywhere, plus a contract that enforces it:

> **every system, once born, must permanently pump an older system** —
> and the player's finger must lose to the village by minute four.

The fiction (village → congregation → god game), the three acts, the molts, and
the ending are unchanged. Where this document conflicts with DESIGN.md §9 or
CLAUDE.md as amended, those win. Four law amendments are itemized in §0 and
mirrored in CLAUDE.md.

---

## 0. law amendments

**A1 — the anchor law gains a vertical dimension.** Anchor COUNT stays capped
forever (hut 5, farm 3, quarry 1, sawpit 1, granary 1). Each anchor may DEEPEN
in level; the sprite must show the level (silhouette elaboration at the same
anchor — nothing placed ever moves). The ledger still never outgrows the
picture; the picture gains depth instead of sprawl.

**A2 — the flavor-tease law becomes the effect-tease law.** For any row with a
mechanical effect, the effect line IS the tease, shown from reveal — spec
before purchase, rate after. Flavor survives only on rows without effects
(story beats). If it costs, it forecasts; if it changes the world for free,
it may ambush.

**A3 — hidden > greyed-out gains a carve-out.** Content may hide; mechanics
the player is actively waiting on may not. Every gate the player can be
stalled on gets a named threshold line (§5).

**A4 — arrivals walk.** Every arrival walks in from the treeline (6s);
`pop++` lands when the walk ends. An offering's 20s gap stays unique.
Starvation departures walk out. The field is the log; comings and goings
are its sentences.

---

## 1. act 1 — retire the hand

### 1.1 clicks go flat
- `clickPower()` → constant `1`, forever. The tools ×2 click bonus and the NG+
  click scaling die. Clicking is a bootstrap, not a career.
- The verbs stay (obsolescence, not amputation) and still die at their molts.
  Clicking returns exactly twice as ceremony: the turn's manual offerings, and
  the §8 gather.

### 1.2 jobs worth staffing
| job | base | was |
|---|---|---|
| forager | 0.5 | 0.5 |
| woodcutter | **0.5** | 0.35 |
| mason | **0.4** | 0.25 |
| priest | **0.25** | 0.2 |

### 1.3 anchor levels (A1) — the generator ladder that lasts to the molt
New state `S.lvl = {hut,farm,quarry,sawpit,granary}` (ints, SAVE_VER 10).
Upgrade rows live in the works column, born hidden, revealed by the carrot
rule (§5). Each purchase deepens the building at its anchor.

| row | levels (cap) | per level | costs (ladder) |
|---|---|---|---|
| `longhouse` | 5 (= huts owned) | cap +2 | 45 wood + 12 stone, ×1.25 each |
| `terraces` | 6 (= farms × 2) | foragers +25% | 55 wood, ×1.6 each; L4+ adds 20 stone |
| `long saw` | 3 (sawpit) | woodcutters +60% | 110w+30s · 242w+66s · 530w+90s+40 favor |
| `deep adit` | 3 (quarry) | masons +60% | 130w · 280w+40s · 600w+60 favor |
| `high loft` | 1 (granary) | offline ×16; enables the fed flock (§3.4) | 160w+80s |

Favor in the late rungs is the act-2 currency reaching back into the act-1
catalog. ~29 generator purchases now span boot→molt 2 instead of 11 by 6:05.

Job multiplier: `mult(job) = 1 + anchors·per + lvl·per'` per the table
(farm anchors keep +25% each; terraces stack on top).

### 1.4 population
CAP_HUT 2 unchanged; each longhouse +2 → cap 20 at full build.
`ARRIVE.rate` 1.3 → **1.2** (the bar at pop 19 stays reachable).

### 1.5 the overtake contract & the felt moment
- contract: automated wood ≥ the 4/s motivated hand by ~3:30; ~5× by long saw L3.
- `pp:outgrown` (one-time reveal): fires when wood production holds ≥8/s for
  10s AND lifetime job-sourced wood ≥ 3× click-sourced wood. Effect: both verb
  rows' tease becomes that currency's village rate, permanently — the verb's
  own row displays the number that beat it. New counters
  `S.clickWood/S.jobWood/S.clickFood/S.jobFood`.

---

## 2. the interconnection matrix

Checklist enforced on every def-table entry: anything that comes online puts
at least one permanent edge into a system older than itself.

| newborn system | older system it pumps | edge |
|---|---|---|
| tools | all field jobs | ×1.5 (kept) |
| anchor levels | jobs | per-level mults, continuous to molt 2 |
| **faith** | **all field jobs** | **the blessing: ×(1 + 0.04·faith) — every gate crossing jumps every rate on the village panel** |
| offerings (all kinds) | field jobs | the surge, retuned ×3/45s, now fired by manual, auto (dial), and deeper offerings — the back-edge survives molt 2 |
| temple chain | favor + jobs + arrivals | temple ×2 favor; bells ×1.5 favor + all jobs ×1.1; gilding ×1.5 favor + arrivals ×0.8 |
| **legend** | **the fields** | the rotation (110): foragers ×1.3; the count (180): foragers ×1.25 + the decimal |
| doubt/sign | favor flow | risk knob, cadence-coupled (§3.2) |
| **food, post-molt** | **favor** | the fed flock: congregation ×(1 + 0.5·min(1, food/500)) with high loft |
| **ascension** | **act 3 rates** | the village echo: reap base = 3 × (1 + totalProd_at_molt/25), stamped at ascend |
| **miracles** | **act 3 rates** | echoes: goodyear → conversion ×1.15; quickening → herald grow 0.02→0.025; obedience → vigil cost ×0.75. Rows persist post-molt showing the echo line |
| worlds | heralds | +5% conversion per world tithed |
| **souls** | **reap** | name a star: repeatable, 5e8 × 4^k souls, max 5 per sky, reap ×1.10 each |

---

## 3. act 2 — shapes, not trickles

### 3.1 legend becomes overflow
`grantFavor(y)` rewrite: below cap, as today. At cap: `totalFavor += y` (it was
still given — faith gates progress at cap; the faith-12 wall and the
sign-refill trick die) and `legend += y × LEGEND_CONV`. **LEGEND_CONV = 0.05**
(sim-tuned; the bot's songs/calendar windows must hold). The flat LEGEND_RATE
dies. Building priests/temple/songs now pays even at cap; the recurring act-2
decision is born: spend favor down (miracles, tiers, signs) or ride the cap
(mint legend).

Legend prices: songs 20→**25**, calendar 45→**60**, NEW `the rotation` **110**
(foragers ×1.3), count 90→**180** (keeps the decimal, adds foragers ×1.25).

`FAITH_GATES` last gate 2900 → **2400**.

### 3.2 the tithe becomes a cadence dial
`the tithe` still molts the economy; it now also installs automated offerings
on a player-set cadence. Ghost-slot row under the shrine:
`the tithe — every T s · next: <name>`, T ∈ TITHE_DIAL = {180, 120, 80, 50, 30}
(def table; S.dial index, default 2). Each auto-offering: pop −1, fleck,
road-gap walker, favor pulse, surge ×3/45s.
- offering yield ladder caps: `5 × 1.5^min(n, 12)` (≈432) — pulses stop
  exploding; priests + pulses share the load.
- doubt couples to cadence: doubt interval = DOUBT_S × (T/60). At T=30 a doubt
  every 45s — the risk knob: run hot toward the stall, buy signs to reset.
- total favor per offering is cadence-independent (the ladder caps), so fast
  buys surge uptime + gate speed at the price of workforce + doubt tax. The
  sim enforces no-dominant-strategy (§6).
- the manual offering button remains pre-tithe only: the turn stays hand-made.

### 3.3 surge retune
`SURGE {x:8, s:90}` → **{x:3, s:45}**. Still never favor. The one-big-bank
exploit (6k food at the molt) dies; the new→old edge becomes a heartbeat.

### 3.4 food gets a permanent job
With the high loft: congregation voice × (1 + 0.5 × min(1, S.food/500)).
`deriveJobs`: `f = min(fields, need × 2)` — the slider can deliberately
overfeed. Post-molt foragers beyond upkeep now buy favor throughput.

### 3.5 kills
- rats: the drain runs only while the row is visible and unbought, pre-molt;
  it resolves itself at molt 2. The permanent invisible 0.5/s tax dies.
- any project still priced in dead currencies at molt 2 folds (hides) instead
  of rendering dead.

---

## 4. act 3 — reassignment, not amputation

- **the first herald is free**: at ascend, heralds = 1 ("one was already
  walking"). The ascend-broke softlock dies. Herald row sells seeds 2+ at
  400 × 1.25^n.
- **the village echo**: `S.echo = 1 + totalProdAtMolt/25` stamped at ascend;
  reap base = REAP_RATE 4 → **3 × echo** (typical ×1.6–1.8). Acts 1–2 skill
  permanently prices act 3.
- **miracle echoes**: MIR entries gain `echo:{...}`; their rows persist
  post-molt showing the echo line instead of blanking.
- **worlds → heralds**: +5% conversion per world tithed — the back half of
  each sky accelerates instead of freezing.
- **name a star**: new PROJ, repeatable, souls 5e8 × 4^k (k within sky),
  max 5/sky, reap ×1.10 each. Souls have a carrot from world 2 on.
- `SKY_DOOR` 2.0e12 → **1.6e12** (second door ×1000 as before). The door
  reveals at worlds ≥ 5 (rung-lead rule, §5) — souls tear toward a named
  number for nine worlds instead of zero.
- `WORLD.rate` 1.55 and `HERALD.rate` 1.25 drop as far as R90-through-dark
  demands (start 1.45 / 1.20; the sim decides).

---

## 5. the goal line

### the carrot rule (L1)
From 0:30 to the last star, every column with future content holds exactly
ONE visible-but-unaffordable priced row (the carrot) + at most one `horizon`
row (a standing threat: ascension, another sky). Never zero, never three.
- linear costs: reveal when prerequisite bought AND slowest cost term ≥ 60%
  of price (`nearCost`, REVEAL_FRAC 0.6).
- exponential ladders: reveal RUNG_LEAD = 2 rungs before affordability.
- def fields: `after:"<rowId>"`, `horizon:true`. Predicates stay in tables.
- secrets (unpriced story beats) still ambush, exactly as today.

### the effect-tease (A2)
Rows with `eff` show `effLine` from reveal (`farm — foragers +25%`,
`obedience — favor ×2`, sign gains `doubt → 0`). Flavor only on no-eff rows.

### forecast lines (L2) — three shapes, existing slots only
`N / cap` · `next at N` · `next · N`
| wait | line | slot |
|---|---|---|
| favor cap | `1,420 / 1,800` | favorVal (cap shown from turn 1; jumps at faith ticks) |
| faith gate | `faith 6 · next at 680 given` | faithLine ("given" = totalFavor; /13 still withheld until lights) |
| legend trigger | rate slot: `at full favor` below cap, `+0.42/s` at cap | legendRate; legend row ghost-wakes at faith ≥ 3 |
| doubt | popLine gains `· 3 at the trees` while doubt > 0 | popLine |
| world fill | `worlds 3 / 14 · next 62% · souls 4.0e7` | popLine, act-3 branch |
| next payout | `next · 8.1e8` | soulsRate |

---

## 6. pace-sim v2 — the binding contract

Three bots, all checks on all bots unless noted:
- **Z** — zero-click after the first offering (clicks 2/s before it). Must
  COMPLETE the game.
- **R** — 0.8 clicks/s (the relaxed human, reference timings).
- **F** — 2.0 clicks/s (the motivated hand; windows must hold in bands).

Instrumented events: `ring` (a row becomes affordable, a reveal, a forecast
line crossing its named target, a faith tick, an arrival, a star flip) and
`decision` (a buy while ≥1 other priced row was simultaneously affordable; a
job reallocation changing a binding rate; a dial/slider move; an offering or
sign fired while an alternative spend was affordable).

Binding checks (failures are red; XFAIL list shrinks per milestone):
1. zero-click completion (bot Z reaches the last star).
2. click share ≤ 12% of lifetime food+wood at 0.8 c/s.
3. overtake: wood production ≥ 8/s before 4:30; hand ≤ 25% of automated rate
   for every clickable currency from 4:00 on.
4. policy spread: food-first / wood-first / balanced reach molt 2 within ±20%.
5. R90: no ring gap > 90s from 0:30 to the LAST STAR (Hunger Wall exempt,
   offering visible throughout). Holds at 0.8 and 2.0 c/s.
6. decision density: ≥4 per sliding 300s pre-ascension; ≥2 post; never 0.
7. carrot invariant: each active column holds exactly 1 unaffordable priced
   row + ≤1 horizon, every step after 0:30.
8. dial fairness: T=30 and T=120 runs ascend within ±15%; fast run shows ≥2×
   doubt events and ≤80% mean pop.
9. broke-ascend probe: ascend at exactly 2,000 favor → first world tithed
   < 120s.
10. field-event density: some scene quantum changes ≤ every 20s through
    ascension, ≤ every 30s in act 3.

Existing v1 benchmarks (first villager < 60s, first building < 45s, first
offering < 8 min, the Wall) remain binding.

---

## 7. the picture (field as dashboard)

All channels: quantized ints, pure functions of S, fixed anchors, existing
palette, members of the paint key. `villageScene()` returns each as data.

- **stockpiles**: woodpile by the sawpit (1 course = 12 wood, max 8), stone
  cairn below the adit (15/tier, max 6), food sacks by the fire (full row of
  5 = next villager at the bar), granary fill (4 quanta = minutes of upkeep).
  Post-molt the piles freeze in buildLo — ruins of the early economy.
- **carriers**: per-job figure speed = 0.07 + 0.05·min(2.5, perHead/base);
  cargo pixel on the homeward leg. Buying upgrades visibly quickens that
  job's figures. Reduced motion: parked, cargo iff rate > 0.
- **arrivals walk** (A4): 6s walk-in per arrival; starvation walk-outs.
- **act-2 gauges**: favor fill column in the shrine/temple (8 quanta — pinned
  at cap is an image), legend arc dots (1 per 7.5 legend), one 1px ledge per
  faith level, deeper-offering processions (hut→shrine over the cd window).
- **act-3 board**: spread walker stepping star→star (1/20th quanta), herald
  ridge marks (3 rows × 12), soul windows — one doorway re-lights per order
  of magnitude of souls (the harvest comes home), door lintel fill (10
  quanta), the watcher at the temple steps while the vigil is held.
- **smoke**: rate = 0.5 + 0.25 × min(8, floor(totalProd/2)) — perceptible steps.

---

## 8. the voice

Principle, made law: the game takes actions; the player feels. Lexicon swaps,
names-at-choice, the price column, and the mood word stay. Performed menace
dies. The nine cuts:

| line | fate |
|---|---|
| "begin again. the village will not remember. you will." (ascend) | "" — the costLine stands alone |
| same line (hunger) | "" — costLine becomes `universe N+1` |
| "you have done this before." (cnt) | row deleted — the universe strip says it |
| "it was here before the first light." (sil) | row deleted — the star-dim said it |
| "it can begin again. or it can stop." (offer2) | row deleted — the two buttons side by side ARE the offer |
| "no one wonders anymore." (obedience) | "" (effect-tease: `favor ×2`) |
| "they were never your hands." (surge tease) | `×3 · 42s` countdown |
| "it was waiting." (pre-turn shrine tease) | `yield · 5 favor` — names the reward before the pivotal choice |
| "the dark is not empty yet." (sky) | "" — the lintel + costLine carry it |
| "they sing what they cannot say." / "they remember why they kneel." | "" / "" — sign's cure moves to the popLine doubt count |

Word budget (authored flavor, enforced at review): act 1 ≤ 50, act 2 ≤ 35,
act 3 ≤ 16, ending ≤ 14, total ≤ 115. No line over 8 words. Second person
banned outside button verbs. The ~35 category-B atmosphere lines
("the winter gets smaller.", "they do not count themselves.", "the scouts
come back quiet." …) are protected from punch-up.

---

## 9. build order

| milestone | contents | gate |
|---|---|---|
| V3-M0 | this doc; CLAUDE.md amendments; pace-sim v2 harness (3 bots, instrumentation, checks; XFAIL where the old economy fails) | suite + sim green (with XFAIL ledger) |
| V3-M1 | clicks flat; job bases; anchor levels; pop 20; outgrown reveal; SAVE_VER 10 | checks 1–4 leave XFAIL |
| V3-M2 | blessing; legend overflow + sinks; temple tiers; fed flock; surge retune; rats fix; gates retune | plateau R90 leaves XFAIL |
| V3-M3 | the cadence dial; auto-offerings; doubt coupling; yield cap | check 8 leaves XFAIL |
| V3-M4 | herald=1; village echo; miracle echoes; name a star; worlds→heralds; door retune | checks 5 (act 3), 9 leave XFAIL |
| V3-M5 | carrot rule; effect-tease; forecast lines | checks 6, 7 leave XFAIL |
| V3-M6 | all field channels; scene-data tests | check 10 leaves XFAIL |
| V3-M7 | the voice cuts; word budget | review gate |
| V3-M8 | three-bot matrix green end-to-end; shotlab browser pass; push live | zero XFAIL |

Every milestone: npm test + npm run pace green before commit. Pushing
publishes. Sim-tuned constants in this doc are starting values; the sim
decides finals — if a benchmark needs grinding, the game is wrong.
