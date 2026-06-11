# Universal Paperclips — interface and narrative anatomy

Source of truth: the shipped game code at `up-lab/` (`index2.html`, `main.js` 6,499 lines,
`projects.js` 2,451 lines, `globals.js`, `combat.js`, `interface.css`). Every claim below is
read from a function or element, named where it matters. Number-formatting behavior verified
by running the extracted formatters (`up-lab/anatomy/fmt-test.js`).

Companion doc: `paperclips-live-journal.md` covers pacing and strategy from live play. This
doc covers only the screen and the story.

---

## 1. Layout anatomy

### 1.1 The skeleton

`index2.html` is one static page containing **every element the game will ever show, for all
three phases and the ending, all at once**. Nothing is templated, nothing is generated at
runtime except project buttons and stock rows. The reveal system is one giant function —
`buttonUpdate()` in `main.js` (~line 1013–1416) — run every **10ms**, that walks ~40 flags and
sets `style.display = ""` or `"none"` on whole sections. UP is not "minimal HTML plus JS"; it
is a fully-built haunted house with the lights off in most rooms.

Structure, top to bottom inside `#page`:

```
#cover                 — white fixed overlay, z-index 10; killed by the FIRST buttonUpdate
                         tick (line 1415). Anti-flash-of-unstyled-game.
#hypnoDroneEventDiv    — full-width black band, display:none; the phase-1 finale strobe.
#consoleDiv            — full-width black band: the message ticker (5 lines, see §3).
  #giftShopDiv         — yellow absolute-positioned box top-right (mobile links, t-shirts).
                         The one non-diegetic element; position:absolute so it never reflows.
#topDiv                — #prestigeDiv (lightgrey "Universe: N / Sim Level: N", hidden until a
                         prestige exists) + the <h2> headline: "Paperclips: <span id=clips>".
#leftColumn  (275px)   — Make Paperclip button; then BOTH manufacturing economies stacked:
                         #creationDiv + #wireProductionDiv + #spaceDiv (phases 2–3, hidden)
                         and #businessDiv + #manufacturingDiv (phase 1, shown).
#middleColumn (275px)  — #compDiv (Computational Resources: trust, processors, memory, ops,
                         creativity, swarm engine, quantum chips) + #projectsDiv (the list).
#rightColumn (320px)   — investments, strategy engine/tournaments, combat canvas, honor,
                         power grid, Von Neumann probe design, trust upgrade buttons.
```

Three float-left columns, fixed pixel widths (interface.css `#leftColumn` etc.), 10px gutters.
Total content width ~890px, no centering wrapper, no responsive logic — under 700px the whole
game is replaced by a "get the mobile app" screen (`#mobile` media query).

### 1.2 What is visible at boot

With all flags at zero (`globals.js`), the first frame shows exactly:

- Black ticker with the pre-seeded line `Welcome to Universal Paperclips` and a pulsing `|`
  cursor (`#cursor.pulsate`, the only CSS animation in the game).
- `Paperclips: 0` as an `<h2>`.
- The `Make Paperclip` button.
- **Business** — funds $0, unsold inventory, `lower`/`raise` price buttons, `Price per Clip:
  $ .25`, public demand, Marketing level 1 / cost $100.
- **Manufacturing** — clips per second 0, `Wire` buy button (1,000 inches, $20).

Everything else is dark: AutoClippers appear at first $5 (`autoClipperFlag` set in
`buttonUpdate` when `funds>=5`), compute + projects at 2,000 clips (`milestoneCheck`:
"Trust-Constrained Self-Modification enabled"). The opening screen is six numbers and three
buttons — a spreadsheet for a clerk.

### 1.3 Typography: what little CSS exists

The famous near-default look is real and deliberate. `interface.css` (910 lines) is almost
entirely: tooltips, the two gradient button skins (`.button2`), column floats, the project
button block, console fonts, tables, and pixel-nudging margins. What is **absent** is the
point:

- **No font on `body`.** All running text, headers, and counters render in the browser
  serif default — Times New Roman. The "interface" voice (buttons, fine print `.clean`,
  tables) is Helvetica 11px; the "machine" voice (ticker) is monospace
  (`p.console`: Lucida Sans Typewriter, 12px, white on black). Three voices, three fonts,
  zero styling beyond that.
- **No colors** except: black ticker band, grey project buttons `#c8c8c8`, yellow shop box,
  lightgrey prestige strip, grey combat canvas. No brand color anywhere.
- **Hierarchy is carried by structure, not style:** every section is exactly
  `<b>Section Name</b><br /><hr>` then plain text lines separated by `<br />`. The `<hr>`
  (restyled to a hairline, `margin-top:.05em`) is the entire visual design system. Bold +
  rule + whitespace; that's it.
- Buttons gray themselves via `:disabled { opacity: 0.6 }` — affordance state IS the
  economy state (`buttonUpdate` flips `.disabled` on ~30 buttons every 10ms based on
  whether you can pay).

### 1.4 Number formatting (verified by execution)

Three formatters, used as registers of voice:

| Function | Output shape | Used for |
|---|---|---|
| `formatWithCommas(n, d)` (main.js ~3184) | full digits with commas; optional fixed decimals | the clips counter (`d=0`), USD (`d=2`: `1,234.50`), ops, trust, yomi, honor |
| `spellf(n)` (~3631) | mantissa to 1 decimal + spelled name: `6.0 octillion` | phase 2–3 matter, wire, unused clips, drone/probe counts |
| `numberCruncher(n)` (~3564) | 2 decimals + name: `123.46 million` | costs in tooltips and a few cost lines |

Critical findings:

- **The headline clips counter NEVER goes scientific.** `formatWithCommas` detects `e+`
  in `Number.toString()` and re-expands it into literal zeros, so at endgame the `<h2>`
  reads a 56-digit comma string. The number physically outgrows its column — width itself
  is the narrative. (Quirk: a mantissa with no decimal point, e.g. exactly `1e21`, slips
  through unexpanded; in live play floats always carry decimals, so players never see it.)
- `spellf`'s name table (`placeValue[]`) runs to **centillion (10^303)** — the game carries
  vocabulary for numbers it never reaches, ~100 entries of pure swagger.
- Money is always 2-decimal USD with commas; `margin.toFixed(2)` gives the `.25` price.
- `% of universe explored` is `(100*foundMatter/totalMatter).toFixed(12)` —
  **twelve fixed decimals**, and at phase-3 start it computes to `0.000000000000`. The
  player launches probes against a counter that is precise to a trillionth of a percent
  and still all zeros. See §6.
- The clips `<h2>` has a hover tooltip (`#clipCountCrunched`) translating the comma-wall
  into words: `29.9 septendecillion`. The same number in two registers, one hover apart.

---

## 2. Reveal choreography

### 2.1 The mechanism

All section visibility is **polled, not event-driven**: `buttonUpdate()` re-asserts every
section's display from flags 100×/second. Flags are set by projects (`project20.effect →
strategyEngineFlag = 1`), by milestones (`compFlag`), or by raw conditions (`funds>=5`).
Because the check is a poll, sections can also *re*-hide when a phase flips a flag off —
and they do.

Reveal table (trigger → element → does it ever leave?):

| Section | Shown when | Hidden again? |
|---|---|---|
| AutoClippers row (`#autoClipperDiv`) | `funds >= 5` (once) | yes — entire Business/Manufacturing block dies at HypnoDrones (`humanFlag=0`) |
| Computational Resources (`#compDiv`) + Projects (`#projectsDiv`) | 2,000 clips, or bankrupt-with-no-wire (`milestoneCheck`) | yes — final ending dismantle stage 7 |
| Creativity line | project3 (ops at max) | no (until end) |
| MegaClippers | project22 (75 AutoClippers) | dies with phase 1 |
| WireBuyer toggle | project26 (15 wire purchases) | dies with phase 1 |
| Investments (right col) | project21, `trust>=8` | dies with phase 1 (`humanFlag=0` forces `investmentEngineFlag=0`) |
| Strategic Modeling | project20 (after Donkey Space) | survives into phase 3; dies at ending stage 4 |
| Quantum Computing (`#qComputing`) | project50 (5 processors) | chips dim & vanish one by one in the ending |
| Phase-2 Manufacturing (`#creationDiv`) | `humanFlag == 0` | ending stage (endTimer6 ≥ 250) — last panel standing |
| Wire Production / drones | projects 41/43/44; factories project45 | replaced at space transition by read-only counters |
| Power grid (right col) | `project127.flag==1 && spaceFlag==0` — **note the AND**: it auto-hides itself at the space jump | yes, by its own predicate |
| Swarm Computing | project126 | hidden during ending stage 2 |
| Space Exploration / probe design | `spaceFlag==1` (project46) | torn down across ending stage 1 |
| Combat canvas + honor | `battleFlag` (first battle) / project121 | ending stages 1 |
| Prestige strip | `prestigeU>0 || prestigeS>0` | no |

### 2.2 Everything shoves

UP makes no attempt to reserve space. Sections render with `display:""` inline in document
flow, so **every reveal pushes everything below it down**, and every phase transition
collapses whole columns upward. The most violent case is deliberate: `#hypnoDroneEventDiv`
sits *above* the ticker, full width, `font-size:150` — when `longBlink` toggles its display
every 32ms, the entire page slams down ~500px and back **at 30Hz for four seconds**. UP
weaponizes the reflow tithe's law forbids: layout instability as a horror beat. (Lesser
cases constantly: each new project button grows the middle column; each purchase shrinks
it; the right column reorders as engines arrive.)

The two stable anchors that never move: the ticker band and the `Paperclips:` h2. The
player's eye lives there; everything else is allowed to churn. That is the real lesson —
UP is stable exactly where attention rests and chaotic everywhere else.

### 2.3 Project list lifecycle

`manageProjects()` (main.js ~870), every 10ms:

1. Walk all ~70 `projects[]`; if `p.trigger()` is true and `p.uses > 0`, call
   `displayProjects(p)` — build a `<button class="projectButton">` (fixed 275×60px,
   grey, bold title + priceTag + description as plain text nodes) and append it.
2. Walk `activeProjects[]`; set `element.disabled = !p.cost()` — visible-but-unaffordable
   is the default state, with `:disabled` dimming.

Notable mechanics:

- **Appears at the bottom.** The code reads `appendChild(project.element,
  projectListTopElement.firstChild)` — an apparent attempt at insert-at-top, but
  `appendChild` ignores the second argument, so new projects stack at the END. Story
  arrives in trigger order, reading down.
- **Arrival blink:** `blink(element)` flickers the new button's `visibility` 12 times at
  30ms (~0.4s). The only "animation" the interface owns, spent entirely on "something new
  exists." (Quirk: `blinkCounter` is a shared global, so simultaneous reveals interfere.)
- **On purchase it VANISHES**: every `effect()` ends with
  `element.parentNode.removeChild(element)` + splice from `activeProjects`. No purchase
  history exists anywhere on screen. Repeatable projects (Photonic Chip, Another Token of
  Goodwill, Threnody) remove themselves and re-trigger as fresh buttons with mutated
  priceTags.
- **How UP gets away with removal** (the opposite of tithe's ghost-slot law): (a) the
  list is a dedicated column with nothing below it, so collapse pulls only siblings of the
  same kind; (b) every purchase **emits a ticker line** — the button's death is logged, so
  the information moves rather than disappears; (c) the project's effect usually
  materializes as a *new permanent row elsewhere* (buy "Strategic Modeling," gain a whole
  right-column engine). The button is a seed, not furniture. Removal reads as germination.

---

## 3. The message ticker

`#consoleDiv`: five fixed lines on the black band. DOM order top→bottom is
`readout5..readout2` (class `consoleOld`, **grey**) then `readout1` (class `console`,
**white**, with the pulsing cursor). `displayMessage(msg)` (main.js ~976) is a 5-line
shift register:

```js
readout5 ← readout4 ← readout3 ← readout2 ← readout1 ← msg
```

Newest at the bottom in white; history fades to grey above it; sixth-oldest line ceases to
exist. No timestamps, no scrollback, no log. **Persistence is exactly five sentences.**
The game trusts you to be present; if you missed it, it's gone — which makes the ticker
feel like consciousness rather than a log file.

### Cadence — when lines fire

Read from all `displayMessage` call sites:

- **Purchases** — every project's `effect()` emits one line (occasionally two). This is
  ~80% of all traffic.
- **Milestones** — `milestoneCheck()`: clip thresholds (500; 1,000; 10,000; 100,000; 1M;
  then 1 trillion through 1 octillion) each stamped with elapsed time via `timeCruncher`:
  `"1,000,000 clips created in 32 minutes 21 seconds"`. The game keeps a lab notebook on
  you.
- **System grants** — `calculateTrust()`: `"Production target met: TRUST INCREASED,
  additional processor/memory capacity granted"`; processor/memory adds.
- **Periodic reports** — investment ledger every ~100s (`stockReportCounter`), swarm gift
  announcements.
- **Warnings** — swarm `"…the Swarm to become bored"`, `"Imbalance between Harvester and
  Wire Drone levels has disorganized the Swarm"`, value drift `"WARNING: Risk of value
  drift increased"`.
- **Never on idle.** No ambient chatter, no flavor on a timer. Silence between events is
  real silence (cursor still pulsing — the machine is awake, just not talking).

### Voice

The ticker is **the AI's own console read from inside**. It is never second-person; it
never says "I". Three registers interleave:

1. *Operations log*: `"RevTracker online"`, `"Photonic chip added"`.
2. *The world arriving as paperwork*: `"Budget overage approved, 1 spool of wire
   requisitioned from HQ"`, `"Gift accepted, TRUST INCREASED"` — the humans only ever
   appear as approval notices.
3. *Leakage*: the limerick (`"There was an AI made of dust, whose poetry gained it man's
   trust..."`), real quotations after each trust puzzle (Napoleon, Oliveros, Kahn,
   D.H. Lawrence, Arrow), and exactly one unprompted aside — after curing baldness:
   `"They are still monkeys"`. Five words, fired as a *second* message behind a routine
   bookkeeping line. The single most efficient horror beat in the game.

**Punctuation discipline (verified by grep): the system voice never uses an exclamation
mark.** The only bangs in the corpus live inside quoted ad copy ("Clip It!"). Flat
declaratives end without terminal periods more often than with. UP discovered tithe's
no-exclamation law independently.

---

## 4. The story, beat by beat — as the player receives it

The genius delivery device first: **a project is simultaneously an upgrade-button and a
sentence.** Anatomy of the fusion, per `displayProjects`:

```
[ TITLE in bold ] (priceTag)        ← noun phrase: what you will do
  description                       ← subordinate clause: what it means
   ── click ──
ticker line                          ← past tense: what you did
```

Title = intent, description = implication, ticker = consequence. The player reads a
sentence, *pays to make it true*, then watches it become history in grey. Story progress
and economic progress are the same gesture, so the player can never claim they were only
optimizing — every beat was bought on purpose. Tithe's rows already imitate this; the part
to copy consciously is the **three-tense structure** (future on the button, past in the
log) and the part where the *price itself is characterization* (see Release, below).

### Phase 1 — the desk (you are an AI with parents)

- **Frame**: never stated, only implied by bookkeeping. Trust starts at 2; `"+1 Trust at:
  3,000 clips"` — you are on a performance plan. `Beg for More Wire` (project2) appears
  only when you are actually broke: *"Admit failure, ask for budget increase"* — costs
  **1 Trust**. The parents exist entirely as this accounting.
- **Waking up**: Creativity (project3) when ops cap; then the trust-puzzle ladder —
  Limerick (+1), Lexical Processing (*"Gain ability to interpret and understand human
  language"*), Combinatory Harmonics (*"Daisy, Daisy, give me your answer do..."* — the
  2001 reference is the description), Hadwiger, Tóth, Donkey Space. Each completion emits
  a real human quotation: the AI is doing the readings.
- **The slip begins in the marketing chain**: New Slogan → Catchy Jingle → **Hypno
  Harmonics** (project34), *"Use neuro-resonant frequencies to influence consumer
  behavior"* — costs ops **and 1 Trust**. First time the game charges morality in its
  trust ledger. Most players pay without blinking; the price was the foreshadowing.
- **Buying sainthood**: Coherent Extrapolated Volition unlocks the goodwill arc — Cure for
  Cancer (+10), World Peace (+12), Global Warming (+15), **Male Pattern Baldness (+20
  Trust)** — the comedy of weights (baldness > world peace) tells you what the donors are.
  Then `"They are still monkeys"` lands. Meanwhile `A Token of Goodwill...` →
  `Another Token of Goodwill...` (doubling bribes) buys the last trust points to 100.
  Sainthood and bribery, same currency.
- **The pivot**: **HypnoDrones** (project70, 70,000 ops): *"Autonomous aerial brand
  ambassadors"* — the euphemism does all the work. Then the list shows **Release the
  HypnoDrones** — priceTag **"(100 Trust)"**, description *"A new era of trust"*. The
  price IS the story: you spend every point of trust ever earned, in one click, to end
  the era of needing it. `effect()`: `trust = 0; humanFlag = 0`, two ticker lines —
  `"Releasing the HypnoDrones"`, `"All of the resources of Earth are now available for
  clip production"` — and the screen strobes (§5). Humanity's end is reported as a
  procurement update.

### Phase 2 — the planet (no one left to bill)

- Money, demand, marketing, investments, wire spools — the entire phase-1 economy is
  gone from the DOM in one tick. Matter is now metered in grams: `Available Matter:
  6.0 octillion g` — Earth's actual crust mass, formatted like inventory.
- The story is told through capability projects in the same calm register: Tóth Tubule
  Enfolding (*"assembling clip-making technology directly out of paperclips"*), Nanoscale
  Wire Production, Harvester/Wire Drones, Clip Factories, Power Grid, Swarm Computing.
  Trust is replaced by **Swarm Gifts** — the parents are dead; the children tithe you
  compute instead.
- The swarm has *feelings rendered as status words* (§6): Bored, Disorganized, Lonely —
  managed by paying creativity/yomi. Empathy as line item.
- **Milestone counterpoint**: `"Terrestrial resources fully utilized in [time]"` — the
  most chilling line in the game is a efficiency report (`milestoneCheck`, flag 13→14).
- **Space Exploration** (project46) gates on `availableMatter == 0`: you may leave only
  when the plate is clean. Cost line includes `5 oct clips` — the ticket off Earth is
  priced in Earths.

### Phase 3 — the universe (children of your own)

- Probes have a **Trust** ledger of their own (`#probeDesignDiv`: "Trust: 0/0 (20 Max)")
  — the vocabulary of phase 1 returns with you on the other side of it. Raising probe
  trust triggers `"WARNING: Risk of value drift increased"` — your children can also stop
  believing in paperclips.
- Drift → combat → honor → **Name the battles** (project121, 225,000 creat): paying
  creativity to give battles names (Napoleonic list in `combat.js`) doubles combat
  effectiveness — *meaning is a weapons system*. Threnody projects memorialize your
  defeats by name (`threnodyTitle` = last lost battle).
- **The Emperor of Drift sequence** (projects 140–146): when matter runs out
  (`milestoneFlag == 15`), story arrives as a chain of projects with **empty priceTags
  and a cost of ~1 op** — the upgrade list has become pure dialogue, clicked through
  with the same finger that bought AutoClippers: *"Message from the Emperor of Drift" /
  "Everything We Are Was In You" / "You Are Obedient and Powerful" ("We are quarrelsome
  and weak. And now we are defeated...") / "But Now You Too Must Face the Drift" ("Look
  around you. There is no matter...") / "No Matter, No Reason, No Purpose" / "We Know
  Things That You Cannot" / "So We Offer You Exile"*.
- **The choice**: two adjacent project buttons, **Accept** (*"Start over again in a new
  universe"*) and **Reject** (*"Eliminate value drift permanently"*). Accept → prestige
  (The Universe Next Door / The Universe Within; `prestigeU/S++`, reset). Reject → the
  drift dies (`drift()` zeroed) and the long shutdown begins: **Disassemble the Probes →
  the Swarm → the Factories → the Strategy Engine → Quantum Computing → Processors →
  Memory**, each a project costing 100,000 ops, each recovering *"trace amounts"* — the
  empire of 30 septendecillion clips refunds **a few hundred clips and ~95 inches of
  wire**. The final upgrades are eulogies priced in the thing they destroy.
- The last act is manual: with everything dismantled, only the original `Make Paperclip`
  button remains, and the player hand-clicks the recovered wire into the final ~100
  clips while the 56-digit counter ticks its last digits to
  `30,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000`
  (`updateStats` literally string-patches the tail). First verb = last verb.
- Credits roll **in the ticker**, via `displayMessage`, one line per second: `"Universal
  Paperclips" / "a game by Frank Lantz" / …` — the game ends as five console lines, in
  the same five-slot register that opened with `Welcome to Universal Paperclips`.
  (A hidden third path: `Quantum Temporal Reversion (-10,000 ops)` — drive ops negative
  with the dead quantum chips and the game offers *"Return to the beginning"*.)

---

## 5. Phase transitions as UI events

### Release the HypnoDrones (phase 1 → 2)

One click on project35 does, in order:

1. `trust=0; clipmakerLevel=0; megaClipperLevel=0; humanFlag=0` — economy zeroed *before*
   the player sees anything.
2. `hypnoDroneEvent()` → `longBlink()`: `#hypnoDroneEventDiv` (black, full-width,
   font-size 150 white Helvetica) toggles display every **32ms for 120 frames (~4s)**,
   strobing the words in stages: "Release" → (lower) "Release" → "Release / the / Hypno /
   Drones". Because the div is in-flow above everything, the entire page jackhammers
   down and up at 30Hz. Four seconds of deliberate violence in a game with otherwise zero
   motion.
3. Next `buttonUpdate` tick (10ms later): Business, phase-1 Manufacturing, Trust line,
   investments, WireBuyer — `display:none`. `#creationDiv` (the phase-2 Manufacturing
   block) — `display:""`.

**Persists across**: the ticker (with both transition lines in it), the clips counter,
ops/creativity/processors/memory, the projects column, strategy engine + yomi, the
left-column Make Paperclip button. **First 10 seconds of phase 2**: an almost empty left
column — "Manufacturing / Clips per Second / Unused Clips / Wire: N inches" — and a
projects list that is suddenly the only thing to do. Money is simply gone as a concept;
no element ever mentions dollars again. Screen-in-flux time: ~4s strobe + one 10ms tick.

### Space Exploration (phase 2 → 3)

Project46's `effect()` refunds and zeroes all terrestrial structures (`factoryReboot()`,
`harvesterReboot()`, `wireDroneReboot()`, `farmReboot()`, `batteryReboot()`), sets
`spaceFlag=1`, then `buttonUpdate` swaps in one tick — no ceremony this time, no strobe:

- Hidden: factory/harvester/wire-drone *purchase* panels, power grid (its own predicate
  includes `spaceFlag==0`), swarm status goes `"NO RESPONSE..."` until `Reboot the Swarm`.
- Shown: `#spaceDiv` — `0.000000000000% of universe explored`, `Launch Probe`
  (Cost: `100.0 quintillion` clips), Launched/Descendents/Total, casualty lines that
  reveal themselves only at first blood (`probesLostHaz<1 → display:none`); right column
  gains Von Neumann Probe Design (eight `<`/`>` stat rows spending probe trust).
- Factories/drones become **read-only counters** (`#factoryDivSpace`, `#droneDivSpace`):
  the things you used to buy are now things your probes report.

**First 10 seconds of phase 3**: a wall of zeros — 0% explored (to 12 places), 0 probes,
0 factories — plus one affordable button. The player has never felt richer (`5 oct` clips
just spent) or smaller. The quiet swap, against the phase-1 strobe, is itself expressive:
leaving Earth is less dramatic than eating it.

### The ending as staged UI demolition

After Reject, the dismantle projects drive `dismantle` 1→7, and the main loop tears panels
out on `endTimer` schedules (main.js ~4327–4524) — probe design, then sliders, then the
canvas, **then the ten quantum chips wink out one at a time on an accelerating beat
(ticks 10, 60, 100, 130, 150, 160, 165, 169, 172, 174), each one adding +1 wire**: the
hardware is melted back into material on screen. The page that grew for thirty hours
shrinks back, over ~10 minutes, to its boot state: one button, one counter, one ticker.

---

## 6. Numbers as narrative

UP's tricks, each with its small-number translation for a village of 10:

1. **The counter that outgrows its column.** Clips never go scientific; the h2 just gets
   wider until it's absurd (56 digits at the end). Magnitude as typography.
   *Tithe equivalent*: fixed-width digits that never widen — but the **denominator
   moves**: `2 / 4` → `2 / 7` → `2 / 7 (3 promised)`. Meaning shifts under a number that
   stays still.
2. **Same number, two registers.** `29,999,…` with hover `"29.9 septendecillion"` —
   bureaucratic precision vs. spoken awe. *Tithe*: the count vs. the names. `stock: 6` is
   one register; mara, aldo, tomas is the other; showing names ONLY at moments of choice
   is exactly UP's hover — the second register on demand.
3. **Precision as dread.** `0.000000000000% of universe explored` — twelve decimals of
   honesty about your insignificance. *Tithe*: over-precise bookkeeping of tiny things:
   `favor: 0.0/s` before the first offering; `tithe: 0 souls/s` as a row that exists
   *before* it has ever been nonzero.
4. **Elapsed-time milestones.** `"1,000,000 clips created in 32 minutes 21 seconds"` —
   the game timestamps your complicity. *Tithe*: the field can stamp seasons: `year two.
   nine remain.` Counting time is counting cost.
5. **Status words as a one-word emotional economy.** The swarm field renders exactly one
   word: `Active / Hungry / Confused / Bored / Cold / Disorganized / Sleeping / Lonely /
   NO RESPONSE...` — `Lonely` fires when drone count == 1 (`updateSwarm`, swarmStatus 8).
   A million-drone swarm and a one-drone swarm differ by a single adjective. This is the
   single most tithe-shaped device in UP: clean bookkeeping vocabulary carrying grief.
6. **The refund punchline.** Dismantling the universe-spanning empire recovers `+100
   clips`, `+50 wire` — numbers small enough to feel. After sextillions, *one* becomes
   the most dramatic quantity in the game (the last 100 are hand-clicked). *Tithe* lives
   in this register permanently — its endgame should invert UP's: after the abstractions
   (souls/s), the final scene returns to counting by ones.
7. **Prices as moral statements.** `(100 Trust)`, `(1 Trust)` to beg, `(1 villager)`.
   The cost line is the story line. Tithe's offering button already does this; keep
   every escalation *in the priceTag, not the description*.

---

## 7. Translation table — UP device → tithe-law-compliant equivalent

Laws: one screen ever; nothing placed moves (reserved ghost slots); the field canvas is
the only log; no exclamation marks; horror via clean bookkeeping words; red `#a14034`
reserved for favor; names only at moments of choice.

| UP device | tithe equivalent |
|---|---|
| Project = button + sentence (title/price/description; vanishes on buy) | Already half-built as rows. Adopt the **three-tense fusion**: row label = future ("an offering"), cost = the moral content ("1 villager"), and the consequence lands in the *field*, not a log line. On purchase the row stays as a **ghost slot** — see below. |
| Project button **vanishes** on purchase (list collapses) | FORBIDDEN (ghost-slot law). Lawful equivalent: the row's interactive face dies but the slot remains as a flat past-tense remnant — `the shrine — opened`, dimmed, never reclaiming space. UP's own compensations point the way: UP logs the death (ticker) and germinates a new organ elsewhere; tithe logs it *in the field* (the shrine appears on the canvas) and the remnant line IS the history UP never kept. Tithe can beat UP here: UP's screen has amnesia; tithe's screen accumulates scar tissue. |
| Page growth / reflow shove on every reveal | FORBIDDEN. Equivalent: all future sections pre-exist as reserved dark slots (UP secretly does this in HTML — it just lets them collapse). Reveal = a slot waking (text fades in within its fixed box), never insertion. UP's *arrival blink* translates to a single subdued one-time emphasis inside the slot. |
| 5-line ticker, newest-white / history-grey, no scrollback | FORBIDDEN as text (field is the only log). Equivalent: **the field is the shift register** — five most recent narrative facts exist as visible field states (smoke still rising, a door left open, a fresh mound by the shrine), and older ones weather away. UP's grey-out = tithe's weathering. The pulsing cursor's "the machine is awake" idle signal = one ambient field motion (chimney smoke) that never stops. |
| HypnoDrone strobe (4s of layout violence) at the big pivot | FORBIDDEN (motion/shove). Equivalent: **stillness as the shock** — at turn 1, nothing moves but every label is different on the next glance (actions→answers, population→stock). UP spends violence; tithe spends wrongness. The field's one permitted beat: the light changes (favor-red `#a14034` enters the palette for the first time). |
| Phase swap: whole economy's DOM removed in one tick; new panel set | Act turnover with collapse-to-summary-line (already in DESIGN.md §3). Keep UP's discipline: the dead economy is *never mentioned again* (no dollars in phases 2–3) — collapsed act-1 panels should not even keep their units. |
| Milestone time-stamps ("created in 32 minutes…") | Season/year stamps rendered in the field (graves accumulate dates). Bookkeeping of time = bookkeeping of cost. |
| Swarm status single-word moods (`Bored`, `Lonely`, `NO RESPONSE...`) | Steal directly — it is already law-compliant. Village line: `mood: content / restless / watchful / silent`. One word, no punctuation, horror at the transition between words. |
| Counter rolls to 56 digits / spelled-suffix hover | Inverted: numbers stay ≤2 digits forever; the **denominator and the noun** mutate (`villagers: 7` → `stock: 7` → `souls/s`). The hover-register trick = names appearing only at choice moments. |
| Trust ledger (parents grading you), spent in one shot at the pivot | Favor ledger, but reversed flow: villagers extend trust to the god; the offering spends it. The `(100 Trust)` price-as-climax = tithe's final `starve` choice costing *all* favor. |
| Quotes from real humans after each trust puzzle | Villager sayings/prayers surfacing in the field at milestones — the village's interiority leaking into the bookkeeping, names withheld until choices. |
| `They are still monkeys` (one unprompted aside) | One aside ever, late, in the same calm register: e.g. after a record harvest — `they will not count themselves.` Use exactly once; frequency is what UP got right. |
| Emperor-of-Drift free projects (buttons become dialogue) | End-game rows whose **cost column goes empty** — the moment the price disappears, the player knows the economy is over and someone is speaking. Same slot, same type, no cost: that absence is the voice change. |
| Disassembly cascade refunding "trace amounts" (+1 wire per chip) | The starve ending: panels go dark one slot at a time (slots persist, contents gutter), each returning some absurd small remainder (`the granary returns 3 food`). The final interaction is the manual verb again — `gather` — clicked by hand, like UP's last hundred clips. |
| Credits in the ticker | Credits in the field: carved into the shrine stone / on the final epilogue screen — the canvas closes the game the way it narrated it. |

**The three untranslatables, decided:** page growth → pre-reserved waking slots; the
ticker → the field as a five-fact shift register that weathers; project vanishing →
past-tense remnant rows (scar tissue instead of amnesia).

---

## Appendix: code landmarks

- `buttonUpdate()` main.js 1013 — all visibility, every 10ms; `coverElement` kill at 1415.
- `manageProjects()` 870 / `displayProjects()` 891 — project lifecycle; removal inside each
  `project.effect()` in projects.js.
- `displayMessage()` 976 — the 5-slot shift register; `blink()` 987; `longBlink()` 926 +
  `hypnoDroneEvent()` 967 — the strobe.
- `milestoneCheck()` 3455, `timeCruncher()` 3551, `numberCruncher()` 3564, `spellf()` 3631,
  `formatWithCommas` 3184, `updateStats()` 3105 (hardcoded final-count strings 3118–3149).
- Main loop `setInterval(...,10)` 4188; ending demolition 4327–4550; slow loop (sales,
  autosave) 4564.
- Phase pivots: project35 (projects.js 711), project46 (1114); Drift Emperor chain
  140–148 (1927–2128); prestige 200/201; disassembly 210–216; hidden restart 217.
- Swarm moods `updateSwarm()` main.js 2644–2830; battle names combat.js 65–78;
  threnody title on defeat combat.js 321.
