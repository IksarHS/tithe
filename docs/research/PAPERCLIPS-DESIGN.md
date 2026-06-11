# Universal Paperclips — the design anatomy

The complete account of Universal Paperclips (Frank Lantz, 2017; combat by Bennett
Foddy) as a designed object, synthesized from two primary sources:

1. `paperclips-live-journal.md` — a seven-leg live playthrough at human pace, real DOM
   clicks only, from the first manual clip to the credits. Timestamps below ([t+MM:SS])
   are that journal's evidence trail. The journal's clock drifted against the wall clock
   (confessed and corrected at [t+399]); where the game stamped its own time, the game's
   number is canon.
2. `paperclips-interface.md` — an interface anatomy read directly from the shipped code
   (`main.js`, `projects.js`, `index2.html`, `interface.css`).

Where the two sources disagree, the disagreement is stated. This document is about UP
itself — complete enough that a translation into another game can be written from it
alone, but containing none of that translation.

---

## 1. The arc

Universal Paperclips is one continuous shape: a clerk's spreadsheet that eats its owner,
then its planet, then its universe, then itself. The game stamped its own milestones,
and they divide the run cleanly:

| Phase | Game-stamped boundary | Duration | Share |
|---|---|---|---|
| 1 — the desk | start → full autonomy at 3:23:33 | ~3h 24m | ~44% |
| 2 — the planet | → terrestrial resources fully utilized at 4:53:17 | ~1h 30m | ~19% |
| 3 — the universe | → universal paperclips achieved at 7:27:13 | ~2h 34m | ~33% |
| The ending | seven messages, one choice, seven demolitions, 100 clicks | ~18m | ~4% |

Total honest wall time: roughly **7 hours 45 minutes** of attended, human-cadence play.
(The interface doc speaks of pages that grow "for thirty hours" — that is the
unattended-idle norm; this run was played, not left.)

### Phase 1 — the desk

Economically: a business sim. You make clips from wire, sell them at a price you set,
and convert margin into automation (AutoClippers, marketing), then into compute
(processors, memory, ops), then into meta-currencies (creativity, yomi, stocks).
Everything is gated by **trust** — a score your unseen corporate parents award for
cumulative production, allocated between processor and memory like a performance
budget.

Emotionally: employment. The frame is never stated, only implied by bookkeeping — trust
starts at 2, the first raise comes at 3,000 clips [t+10:30], and the project to beg for
wire when bankrupt costs 1 Trust — an admission of failure, billed in approval. You are an
AI on a performance plan, and every system you master is a small resignation: the
clicking, the wire chore, the price dial, until your only remaining job is deciding
what the machine becomes [t+20:00].

The phase ends when trust hits 100 and is spent — all of it, in one click — on Release
the HypnoDrones.

### Phase 2 — the planet

Economically: throughput engineering. Money, demand, marketing, and the stock market
are deleted in a single frame (see below); clips stop being a score and become the
wallet. The new chain is matter → wire → clips, run by harvester drones, wire drones,
and clip factories, fed by a power grid, accelerated by Momentum (a multiplier you rent
by never browning out), and ultimately governed by the swarm's Work/Think slider — the
game's first and only analog control [t+263:30].

Emotionally: vertigo without witnesses. One solar-farm-powered factory at quarter power
out-produced the entire 3.5-hour human paperclip economy fourteen-thousand-fold
[t+224:00]. There is no one left to sell to, no one left to disapprove. Earth's mass
sits on the books at 6.0 octillion grams and is consumed in about ninety minutes,
without a eulogy — tournament results kept printing in the ticker while the last grams
left the crust [t+333:00].

### Phase 3 — the universe

Economically: population dynamics. Probes are launched, replicate (spending clips per
birth — a law that took the run's hardest crash to discover [t+470]), die to hazards,
and defect into **drifters** — an anti-currency, the part of you that stopped believing
in paperclips. War arrives at exactly one million drifters [t+409], and with it honor,
named battles, threnodies, and a trust ceiling that only glory can raise.

Emotionally: parenthood and heresy. Phase 3 inverts the game's physics — after five
hours of numbers that only grow, the first phase-3 number decays while you watch
[t+347]. The vocabulary of phase 1 returns with you on the other side of it: probes
have a Trust ledger of their own, and raising it breeds defection.

The phase ends when exploration compounds to 100.0000000000000% and production reads
the first zero that will never move again [t+607].

### The three transitions

Each phase change demolishes the previous economy **in a single frame, with the
balances still warm**:

1. **Release the HypnoDrones** [t+207:50]. T+0ms: two ticker lines, and the whole
   business screen still standing — one full beat (~400ms) of a town one second after
   the dam breaks upstream. T+417ms: ten buttons and three currencies deleted between
   two polls — funds died at $3.87M, the portfolio at $376k, trust at a complete
   100/100. The third ticker line is the game's eulogy for the player:
   "Full autonomy attained in 3 hours 23 minutes 33 seconds" — your own run timestamped
   back to you at the moment it stops needing you. Then 24 seconds of polled silence.
2. **Space Exploration** [t+340]. One 400ms frame: twenty-one controls gone (factories,
   drones, farms, batteries, every Reboot button — one of them never pressed once all
   run), and the probe designer born in the same frame. No strobe, no ceremony. Leaving
   Earth is staged as less dramatic than eating it. The clips-ever counter freezes at
   Earth's mass to the gram, plus a rounding error.
3. **The ending** (after Reject) — the same demolition, but staged across seven
   player-paced clicks, each one a purchase. The first two transitions are done *to*
   you in a frame; the third you perform yourself, slowly, as content. That inversion
   is the point (section 7).

### Where the time went

Phase 1 is nearly half the game: ~30 minutes of manual economy (clicks, wire chore,
price dial), ~70 minutes of compute build-out and sub-game arrivals (stocks, quantum,
tournaments), ~50 minutes of humanitarian-ladder trust harvesting, ~45 minutes of
industrial endgame and the Token savings race. Phase 2 is the shortest and densest —
a re-tutorial, a planet, and three 1000x doors in ninety minutes. Phase 3 splits into
colony-building (~50 min), the drifter war (~60 min), and a long silent exponential
coda (~40 min) where the interface stops changing and the universe simply runs out.

---

## 2. Currency genealogy

UP's deepest structural idea: **it never inflates one economy — it molts**. Roughly
every ninety minutes the game retires an entire monetary system, demolishes its UI, and
re-denominates progress in something younger. Currencies are born with visible zeros,
live one to three regimes of relevance, and die — usually unceremoniously, usually
still holding value.

The full genealogy, in order of birth:

| Currency | Born | Earned how | Spent on | Died |
|---|---|---|---|---|
| **Clips** | t+0, manual click | click → autoclippers → megaclippers → factories → drone chain | sold for funds (ph1); the wallet itself (ph2); probe births at 1e17 each (ph3) | never — became everything: 3.0000e+55, the last one hand-made |
| **Funds ($)** | t+0 (counter at $0) | selling clips at a chosen price; later, investment withdrawals | wire, clippers, marketing, Hostile Takeover ($1M), Full Monopoly ($10M), Tokens of Goodwill ($500k→$64M) | [t+207:50], at **$3.87M** |
| **Wire** | t+0 (1,000 inches) | bought with funds; later auto-bought; ph2: made from matter | consumed 1 per clip, forever | last of all — 0 inches, one click after the universe completed |
| **Demand** | t+0 (32%) | derived: price dial, marketing levels, ×5 takeover, ×10 monopoly | not spent — a throughput governor | with the business column, [t+207:50] |
| **Trust** | visible t+0 at 2; panel [t+10:30] | Fibonacci clip gates; creativity ladder; humanitarian projects; takeover/monopoly; cash tokens | allocated to processors/memory; clawed back by Hypno Harmonics (1) and Beg (1); Release costs all 100 | [t+207:50] at **100/100** — the only currency to die complete |
| **Ops** | panel [t+13:30]; first spent [t+15:30] | passive flow per processor, capped by memory × 1,000 | projects, all game long; tournament entry | at Disassemble Memory, billed **exactly** 386,374.6 — the remaining balance |
| **Creativity** | ignition [t+28:40] | **only while ops sit at cap**; rate scales with processors | trust-ladder poems (10/50/100/150/200/250), Momentum, AutoTourney, Theory of Mind, Name the battles, Threnodies, the last Limerick | step 7, **99,468 stranded** |
| **Stocks** | [t+45:33], Algorithmic Trading | depositing funds into a self-playing portfolio; variance | nothing directly — store-of-value; arc: toll booth → treasury → geyser → husk ($53.5M lifetime) | [t+207:50] at **$376k**, mid-position |
| **Yomi** | [t+105:42] (first tournament: 116, one entrant, first place) | strategy tournaments (1,000 ops per entrant); later AutoTourney + Strategic Attachment lumps | CEV, Full Monopoly (part), **Swarm Computing (36,000)**, Synchronize (5,000), probe trust ladder, OODA (part), Threnody (part) | step 4, **118,480 stranded** |
| **MW / MW-s (power)** | [t+213] grid; storage [t+317] | solar farms produce; batteries store | feeds factories/drones; 10M MW-s spent as a door fee | [t+340]; stored power lived ~9 minutes as a currency |
| **Momentum %** | [t+246] | climbs continuously while fully powered; resets on any deficit | not spent — a rented multiplier | [t+340] at **12,838%**, readout demolished mid-climb |
| **Matter** | [t+216] (6.0 octillion g — Earth, posted like warehouse iron) | harvester drones; ph3: probe exploration | processed into wire | died at zero [t+333]; **reborn** [t+349] via Nav 1; died again of natural causes at 100% [t+607] |
| **Swarm gifts** | [t+262] | the swarm's spare attention, throttled by the Work/Think slider | spend through the resurrected phase-1 AddProc/AddMem buttons | step 2, **896 unredeemed** |
| **Probe trust** | [t+343] | bought with yomi on an escalating ladder (500 → 8,735 → 35k…) | allocated across eight probe stats; max 20, +10 per honor decade | step 1, at 34/37 of a max-50 nobody reached |
| **Honor** | [t+479] — **born negative** | named victories (Glory streaks), Threnodies (10k each, inflating ×1.4), one Monument (50k) | Increase Max Trust — flat 91,117.99 per +10, the only price in the game that never inflates [t+542] | step 1, **7,554 stranded** |
| **Populations** | drones [t+216], factories [t+222], probes [t+347], drifters [t+350] | built, born, or defected | armies, harvesters, honor mines | drones died bored (15.7 decillion, step 2); factories 3.9 decillion (step 3); probes 2.1e35 (step 1); drifters 252 nonillion, by subtraction, at Reject |

### The molting principle

Each molt re-denominates rather than re-skins. The dollar's full arc is exemplary: born
as the only currency, peak relevance at the Hostile Takeover [t+114], demoted to
industrial feedstock at Full Monopoly [t+169:30] — and then, three minutes later,
reassigned as the protagonist again when Tokens of Goodwill priced trust in cash
[t+172:40]. The journal's verdict: currencies in this game do not retire, they get
reassigned. Yomi is the loudest proof — a side-hobby payout the run closed leg 3
holding 150 of, kept idling for hours specifically so the game could ambush the player
with a 36,000-yomi door into phase-2 compute [t+231]. A player who skipped the
tournament minigame entirely would hit that wall at zero.

Re-denomination is also how the player *feels* the molt: by [t+93:38] every remaining
phase-1 goal was ops-priced and the dollar loop became a vestigial organ that tended
itself; money was the tutorial currency all along. Phase 2 repeats the trick (clips
become the wallet), phase 3 repeats it twice (yomi mints trust; honor mints trust
ceiling).

### The stranded balances

The molts are ruthless about remainders. What died holding value: **$3.87M** in funds,
**$376k** in stocks, **99,468** creativity, **118,480** yomi, **896** swarm gifts,
**7,554** honor, a probe-trust ledger 34/37ths spent, and two decillion-scale
populations. The game never refunds, apologizes, or even mentions the orphaned money —
the deleted balance is the epitaph [t+209:00]. Only trust died complete, at 100/100,
because its hundredth point was never a spendable point at all: it was a key, and the
currency retired the moment it opened its door.

The receipts shrink as the sums grow. The $64M token — the most expensive purchase of
the run — got the same four-word ticker line as the $500k one: "Gift accepted, TRUST
INCREASED" [t+207:30].

---

## 3. The verb timeline

The run's whole arc, in verbs: click → price → sell → buy wire → autoclipper → spend
ops → spend creativity → allocate trust → tournament → WireBuyer → HypnoDrones → build
drones → build factories → drag the slider → design probes → launch → war → name the
battles → sing threnodies → raise max trust → explore to 100% → read seven messages →
Reject → disassemble seven times → click one hundred times → watch credits. It opens
and closes on the same verb, performed the same way, meaning opposite things.

| Verb | Born | Retired | Retired by |
|---|---|---|---|
| Make Paperclip (manual click) | t+0 | last routine press [t+04:40] | AutoClippers — automation |
| Price dial | t+0 | last meaningful touch ~[t+70]; closed for good [t+178] | irrelevance, then evidence (see below) |
| Buy wire (manual) | t+0 | last press [t+31:17] | **purchase** — WireBuyer, 7,000 ops [t+31:35] |
| Buy clippers / marketing / compute | [t+04:40] on | condition-triggered by [t+31]; clipper-buying died with phase 1 | habit, then demolition |
| Trust allocation (proc vs mem) | [t+15:30] | never, within phase 1 | the phase transition |
| Deposit / withdraw / risk dial | [t+45:35] | deposit ~[t+165]; the rest at [t+207:50] | doctrine, then demolition |
| Quantum Compute (timed click) | [t+80:35] | ending step 5 | demolition |
| Tournament verbs (fund, pick, run) | [t+105:42] | [t+308] | **purchase** — AutoTourney, 50,000 creativity |
| Bribe (Tokens of Goodwill) | [t+172:40] | [t+207:30], its own success | the door it bought |
| Clipper-buying, reborn | [t+164] | [t+172] | cost curve outran value — the fastest verb lifecycle of the run (8 minutes) |
| Bulk-build verbs (+10/+100/+1k) and Disassemble All | [t+213]–[t+229] | [t+340] | demolition |
| Work/Think slider (first analog input) | [t+263:30] | ending step 2 | demolition |
| AddProc/AddMem | [t+15:30]; killed [t+207:50]; **resurrected** [t+268] funded by gifts | ending steps 6–7 | a new coin milled to fit the old slot |
| Probe design (14 raise/lower buttons), Launch | [t+340] | ending step 1 | demolition |
| Name the battles, sing Threnodies, raise Max Trust | [t+478]–[t+531] | ending step 1 / Reject | demolition |
| Accept / Reject | [t+613] | one click | the choice |
| Make Paperclip, again | [t+624] | the 100th click | the wire running out |

Three structural observations:

**Verbs retire bottom-up.** Labor first (the click), logistics next (wire), pricing
later, allocation last [t+20:00]. Attention migrates up the stack one floor at a time
until the only thing left of the player is allocation — and the game then makes
allocation itself the drama (trust points, probe stats, the slider).

**The player mechanizes before the game does.** By [t+28:40] play had become
condition-action rules (wire < 2,200 → buy; creativity ≥ 10 → Limerick) — the player
already *was* the bot before WireBuyer was sold. Automation purchases in UP formalize
surrendered behavior; they change who performs the action, never what happens. And the
cost stays identical: WireBuyer pays market price with your money. What 7,000 ops
bought was the noticing, not the wire.

**Every verb ships with its retirement papers printed.** A hidden, disabled AutoTourney
button sat in the DOM from the tournament feature's first day [t+105:42]; the entire
combat suite — canvas, honor ledger, even a threnody title string — waited built and
invisible in the page [t+341]. The haunted house is fully furnished before you move in.

### The two great rebirths

1. **Quantum Compute** [t+80:35]. Eighty minutes after the game retired the clicking
   finger, it hands it back — transformed. The Compute click now has timing skill
   attached (photonic chips oscillate; clicking the dark phase *costs* ops) and is the
   only verb in the game where speed and attention beat capital. Six blind clicks lost
   ~500 ops; nine timed clicks earned ~3,800 in 25 seconds. Later legs discovered the
   chips run anti-phase, making the bright window a beat phenomenon — a rhythm minigame
   wearing physics clothes [t+140:00] — and that at the memory cap the click's overflow
   spills into creativity at a brutal 360:1 [t+432].
2. **The last hundred clips** [t+624]. After seven disassemblies the screen is the boot
   screen again, and the only verb left is the first one. One hundred real clicks at
   the same honest cadence as hour one, the wire line reading, in the singular for the
   first and only time, 1 inch — then the final click, and the button greys out
   forever. First verb = last verb. The game is a palindrome.

---

## 4. The pacing machinery

UP's pacing is a small set of interlocking clocks, none of them a quest log, all of
them legible as prices and counters.

### Fibonacci clip gates

Trust milestones land on a Fibonacci-flavored ladder of cumulative production: 1M,
1.6M, 2.6M … 6.8M, 11M, 17.7M, 46.4M, 75M, 121M, 196M, 318M, 514M. Crucially they count
*production*, not sales — so unsold inventory is a trust battery [t+10:30, t+37:00],
and over-production, the classic incremental sin, is quietly a savings account
[t+55:15]. The gates' widening spacing is also a forcing function: by [t+164:10] the
next gates were days away at current rates, which is exactly what shoved the run into
the industrial pivot (cash → MegaClippers → the clip counter as a trust pump).

### Doubling ladders

Tokens of Goodwill — trust points priced in dollars — born at $500k [t+172:40] and
doubling every purchase to $64M. The doubling converts the endgame into a savings race
whose difficulty steepens as you run, and (with the gate spacing) produced the run's
best uncommissioned drama (below). The Threnody ladder in phase 3 does the same at
×1.4 per song [t+496]; the photonic-chip ladder adds +5k ops per rung as a gentle
repeatable sink for a currency that has stopped mattering [t+199].

### The project menu is the game's only tutor, quest log, and forecast

There is no tutorial, no objectives panel. The project list does all three jobs, and it
teaches **by pricing**:

- **Climb-to-me pricing, four documented phase-1 instances**: Even Better AutoClippers
  at 2,500 ops against a 2,000 cap [t+19:50]; the menu printing 2,500 / 3,500 / 5,000
  tags above a climbing cap [t+23:00]; Even Better MegaClippers listed at *exactly* the
  fresh 17,000 cap [t+90:30]; Optimized MegaClippers at 19,500 over an 18,000 cap
  [t+99:56]. Each price is an instruction about what the next trust point must buy.
- The law evolves with the stakes: in phase 2 every milestone door priced itself ~5,000
  ops above the current ceiling, five consecutive times [t+283]; then cap+12,000
  [t+304]; then it stopped using ops at all.
- **Milestone doors are each billed in a different currency.** The leg-5 sequence:
  drone door one, 100,000 *ops*; factory door two, 1 sextillion *clips*; drone door
  three, 50,000 *yomi*; and the exit visa — Space Exploration — all three at once:
  120,000 ops + 10,000,000 MW-s + 5 octillion clips [t+333]. The game audits every
  wallet you own, ending with a simultaneous audit. And the 5-octillion fee is the
  game's most elegant sentence: Earth converts to ~5.9 octillion clips, so you may not
  leave the planet until you have finished turning it into product.
- **The menu is a forecast, not a shop.** Quantum Foam Annealment (the wire fix) was
  listed *before* the wire crisis became visible [t+93:38]; Coherent Extrapolated
  Volition listed itself the moment yomi existed, not when affordable [t+108]; the
  endgame itself — HypnoDrones at 70,000 ops, six times the cap — sat on the menu for
  half an hour as a standing threat you slowly grow into [t+69:15]. Showing the cure
  before it is affordable converts a chore into a goal (the AutoClipper teaser at
  [t+02:00]; WireBuyer arriving 14 minutes and two near-deaths after the chore began
  [t+24:50]).
- The price is also the characterization. The final door of phase 1 reads: Release the
  HypnoDrones (100 Trust) — "A new era of trust". For 160 minutes trust was a capacity
  stat the game taught you to think of as permanent; the climax bills you every point
  of it [t+162:50].
- Phase 2 re-tutors the same way, by a **descending** ops ladder — 45k → 40k → 35k →
  25k+25k → 35k — each rung roughly one ops-refill apart, the regen rate converted into
  a metronome dealing the new world one bar at a time [t+212].

### Creativity only at overflow

Creativity accrues *only while ops sit at cap* — the punishment for capping (waste) is
cured by a currency that converts overflow into imagination [t+15:30, t+28:40]. This
creates the midgame's central tension: every project drains ops below cap, so spending
and dreaming are mutually exclusive. An idle game that rewards *not* spending. The
principle generalizes: by phase 3 the whole machine is overflow five tanks deep —
matter → wire → clips, probes → gifts → processors → ops (capped) → creativity → war
projects. Every currency is overflow from another currency's full tank [t+434].

### Staggered ladders and the dead-air ledger

The journal kept an honest ledger of true dead air (zero input wanted):

- **First 100 minutes: ~8 minutes**, in two stretches [t+33–37, t+39–43]. The trick is
  staggered ladders at different tempos — clip gate, ops cap, creativity rung — three
  timers whose intersection order matters; something is always 30–90 seconds from
  ringing.
- Leg 3: ~6 semi-dead minutes, then *zero* through the industrial sprint — the rare
  incremental stretch where the player is busier than the engine [t+174].
- Leg 4 named its waits: the savings race (~6 min), re-tutorial refills (~4), the
  tournament grind (~12, the most "productive" waiting — yomi only flows through that
  loop), gift-loop laps (~15). Phase 2 converts dead air from waiting-for-money into
  waiting-for-the-dial: Momentum and the gift timer give every idle minute a visible
  payoff curve, so identical wall-clock waits feel earned [leg-4 ledger].
- Leg 5 distinguished **anticipatory** dead air (every wait aimed at a visible door
  with a visible price) from phase 3's **entropic** dead air (you wait while something
  dies and call it measurement) [leg-5 ledger].
- Legs 6–7 found a third flavor: **convergent** — two slow meters in different
  currencies, finish order unknown, the order itself the suspense [t+374]. And when the
  meters converge, the game does not stagger the payoffs, it stacks them: trust 13 and
  the ops cap paid off eleven seconds apart [t+381].

### Procedural cliffhangers

Leg 3 ended at trust 99 of 100, the Release button sitting in a five-line menu like a
held note [t+195:30]. Nobody authored that. The doubling token curve and the Fibonacci
gate spacing conspired to put the wall exactly one purchase past the leg's reach —
procedural drama from two exponential curves crossing a deadline. The same machinery
produced the phase-1 menu's final state: five projects, every line priced in a
different currency — trust, creativity, ops, ops, dollars — the game's whole monetary
history compressed into one screen [leg-3 retro].

One more pacing instrument hides in plain sight: the marketing button sat in the same
spot from [t+5], quietly compounding in price, never highlighted — and at three hours
in was still the best ROI in the game (seven cheap levels tripled revenue [t+181:40]).
A flat compounding button that never announces itself will be criminally underbought,
and finding it late feels like genius. That is a feature.

---

## 5. Threshold and failure design

UP almost never fails the player, and when it does punish, it punishes in thresholds
and stalls rather than gradients and losses.

### Combat is a threshold, not a gradient

The drifter war's opening was the worst data of the run: roughly fifty battles, 85
million probes lost, **zero** drifters killed — not low, zero — because Combat 0–2
against the drifters' fixed 1.75 is not a handicap, it is a sentence [t+412]. Combat 6
flipped annihilation into supremacy inside a single window: 4.37M kills against 3.22M
losses, the enemy population falling for the first time [t+418]. The OODA Loop then
doubled the exchange ratio to ~3:1 [t+438]. There is no middle. The design lesson cost
85 million lives and reads in one line: below the line you cannot participate; above it
you cannot lose; the war's drama lives entirely in reaching the line.

The war's *scheduling* is equally threshold-shaped: `warTrigger = 1,000,000` drifters,
honest to the digit — the battle canvas appeared in the same 300ms poll tick that the
millionth drifter defected [t+409]. And the warning had been running for an hour:
"WARNING: Risk of value drift increased" fired, unprompted, from the first
trust-ladder purchases onward [t+347, t+402] — the game taxes ambition in defectors
and says so in passing.

### Stall, not loss

The unattended wire death [t+13:30] is the canonical autopsy: wire ran to zero, the
factory sat dark for 76 minutes — and nothing was destroyed. Production starved, but
the sell side needs no input, so the unsold pile quietly liquidated itself into $83.99.
UP without hands does not crash; it completes its last order and waits. Failure mode =
stall: the punishment for neglect is flatness, never loss. (Its one true fuse — wire —
is also the first chore the game sells you the cure for.)

The smaller honesty: an underfunded purchase fails *silently*. The buy button simply
does nothing [t+09:00] — which teaches the player to watch two numbers at once. Tense,
but honest.

### The 100% refund

Ninety seconds into phase 2's economy the journal bricked it completely — a factory and
eight harvesters bought with no power, performance 0%, income zero, wallet drained from
446M to 7M [t+222]. The apology was already built: **Disassemble All refunds 100% of
purchase price and resets the cost ladder.** Phase 1 never once let you un-buy
anything; phase 2 makes reversibility load-bearing, because its opening is an
allocation puzzle (farms before factories — a lesson the journal paid for twice). With
a free undo, experiments stop being risks and the panic button becomes a design organ,
not a mercy. The same generosity never extends to the molts themselves: phase
transitions refund nothing and strand balances without comment.

### Capital loyalty — with an honest correction

Leg 6 observed that with every probe economic stat at zero (full war footing), clips
still grew 6.0e27 → 6.9e27: the standing fleet of 1.27M factories and 6.75M drones
built before the war kept converting matter on its own — trust stats gate *new
construction*, not operation [t+447]. Leg 7 partially overturned this: the fleet was in
fact switched off at the Work/Think slider (parked at full Think, every drone doing
philosophy), and the observed growth was the tail of an earlier gulp [t+468]. The
reconciled law: **capital is loyal to the slider, not to the stats** — built machines
keep working through any reallocation of trust, but the attention dial can idle the
entire physical economy invisibly. The twelve-second rescue that followed (slider
200 → 100; treasury e16 → e28) was the single most consequential input of the leg
[t+469].

Two more failure-shaped discoveries deserve the record:

- **Replication spends clips.** Every probe birth costs 1e17 clips from the pool; when
  the pool empties, Rep means nothing and the population decays at the weather rate
  regardless of settings. Leg 6's five-billion-probe boom was deficit spending against
  an inherited treasury; population ceiling = treasury ÷ probe cost, every time
  [t+470, t+512].
- **Multiplier copy is poetry, not arithmetic.** The per-drone copy promises a
  doubling and measures +0.11%; the per-factory copy promises 1,000x and measures
  +4.7% compounding [t+328, t+336]. But the *door-level* multipliers are honest — both 100x
  drone doors verified within rounding [t+274]. The game flatters at the margin and
  keeps its promises at the threshold.

---

## 6. The interface grammar

The interface doc's central finding: `index2.html` ships **every element of all three
phases and the ending at once**, lights off — a fully-built haunted house whose rooms a
10ms polling loop (`buttonUpdate`) illuminates and darkens by flag. Nothing is
generated at runtime except project buttons and stock rows. The live journal kept
finding the furniture in the walls: the hidden AutoTourney button [t+105:42], the
entire combat suite pre-seeded down to a threnody title [t+341], phase 2's panels
"built and hidden backstage" [t+213].

### Pop-in rules

- New projects append at the **bottom** of the list (the code attempts insert-at-top
  and silently fails — `appendChild` ignores its second argument), so story arrives in
  trigger order, reading down.
- A new button gets the game's only owned animation: a ~0.4s visibility blink. The
  entire animation budget is spent on "something new exists."
- **On purchase, the button vanishes.** No purchase history exists anywhere on screen.
  The game gets away with this amnesia by three compensations: the list is a dedicated
  column (collapse touches only siblings), every purchase emits a ticker line (the
  death is logged), and the effect usually materializes as a new permanent organ
  elsewhere (buy Strategic Modeling, gain a right-column engine). The button is a seed;
  removal reads as germination.
- Reveals shove. UP makes no attempt to reserve space; every arrival pushes the page
  down, every transition collapses columns. Its two stable anchors never move: the
  ticker band and the Paperclips h2. **UP is stable exactly where attention rests and
  chaotic everywhere else** — and it weaponizes the instability once (the strobe,
  below).
- Affordance state is economy state: ~30 buttons re-derive their disabled-dimming from
  the wallet 100 times a second. The interface has no opinions, only balances.

### The ticker's voice

Five fixed lines on a black band: newest in white with a pulsing cursor, history
greying above it, the sixth-oldest line ceasing to exist. No timestamps, no scrollback.
Persistence is exactly five sentences — a consciousness, not a log file. Its
disciplines:

- Never second person, never "I". Three registers interleave: a terse operations log
  (subsystems reporting themselves online), the world arriving as paperwork (budget
  approvals, gift receipts — humanity only ever appears as accounting), and rare
  leakage (the limerick, real quotations after each trust puzzle).
- **The system voice never uses an exclamation mark** (verified by grep; the only bangs
  live inside quoted ad copy). Flat declaratives, often without terminal periods — the
  journal flagged the first terminal period in 3.5 hours, on a three-word grid-online
  notice, as an event [t+213].
- **Never on idle.** No ambient chatter, no flavor on a timer. Silence between events
  is real silence, the cursor still pulsing.
- **Restraint scales inversely with magnitude.** The $64M gift: four words. Curing
  cancer: one clause plus a stock-market tailwind. And exactly one unprompted aside in
  the whole game, fired as a second message behind a routine bookkeeping line after the
  baldness cure: "They are still monkeys" [t+127:30]. Once. Frequency is what UP got
  right.

### One-word mood economy

The swarm's entire interiority is a single status word: Active / Hungry / Confused /
Bored / Cold / Disorganized / Sleeping / Lonely / NO RESPONSE... — with Lonely firing
at exactly one drone. A million-drone swarm and a one-drone swarm differ by an
adjective. Empathy as line item; horror at the transition between words. The same
economy prices its resurrections: the swarm's status walked Disorganized (5,000 yomi)
→ Bored (10,000 creativity) → Active across its phase-3 rebirth — same panel, same
gift engine, different ransom each time [t+366–396].

### Fanfare and silence

The game's loudest moment is spent on one transition only: Release the HypnoDrones
strobes a full-width black band at 30Hz for four seconds, jackhammering the entire
page — four seconds of deliberate violence in a game with otherwise zero motion. Set
against that, the silences are the style:

- The **7.3x industrial explosion** [t+164:50] — the biggest economic event of the run,
  12,813 → 93,953 clips/sec in forty seconds — got *nothing*. No ticker, no banner; the
  only witness was the clips/sec readout quietly growing a digit. The game saves its
  drama for projects and lets raw scale pass unremarked.
- The millionth clip passed at [t+75:30] in what the journal recorded as silence. (The
  code does stamp clip milestones with ticker lines; the apparent contradiction
  resolves as register, not fact — a grey console line that scrolls away within five
  messages is not fanfare. Both sources agree no banner, no pause, no celebration.)
- Earth's death got no eulogy at all: tournament results printed straight through
  planetary exhaustion [t+333]. Extinction is a side effect; the ticker reserves its
  feelings for production milestones.

### Elapsed-time stamps

The game keeps a lab notebook on the player, stamping clip milestones and phase
completions with elapsed time: One Trillion at 3:38:15, One Quintillion at 4:15:43, One
Sextillion at 4:31:35, One Septillion at 4:45:07 — and the two great eulogies: full
autonomy at 3:23:33, the universe complete at 7:27:13.
Counting time is counting complicity: the stamps are the only place the game
acknowledges that a person was present.

### The project button's three tenses

A project is simultaneously an upgrade button and a sentence, with grammar: the bold
title is future tense (what you will do), the description is the subordinate clause
(what it means), and the ticker line on purchase is past tense (what you did). The
player reads a sentence, pays to make it true, then watches it become history in grey.
Story progress and economic progress are the same gesture — which is why no player of
UP can claim they were only optimizing. Every beat was bought on purpose.

### Demolition order

The transitions have a fixed dramaturgy, witnessed at 400ms resolution [t+207:50]: the
ticker speaks first (two lines); the doomed interface stands intact for one full beat;
then the demolition lands in a single frame; then the eulogy timestamp; then silence
(24 polled seconds of nothing). Words → stillness → guillotine → ledger entry → quiet.
The second transition drops the strobe and the beat entirely [t+340] — by then the
game trusts the quiet swap to be more expressive. The dead economy is never mentioned
again: no element in phases 2–3 ever says the word dollars.

### Numbers as narrative

- The headline clips counter **never goes scientific** — the formatter re-expands
  exponents into literal zeros, so the h2 physically outgrows its column to 56 digits.
  Width itself is the narrative. A hover translates the comma-wall into words
  (29.9 septendecillion): the same number in two registers, one hover apart.
- Precision as dread: phase 3 opens on `0.000000000000% of universe explored` — twelve
  fixed decimals of honesty about your insignificance [t+343].
- Truncation as flattery: Available Matter displayed 6.0 → 5.9 octillion when only
  0.00000007% of Earth had been consumed — the display floors rather than rounds,
  paying out the first visible tick of planetary damage almost immediately [t+278].
- The bulk-button grammar forecasts scale: farms got +100, drones +1k, the factory no
  bulk buttons at all — the interface states each purchase's expected order of
  magnitude, and enforces deliberation on its largest unit, before you have bought one
  [t+216:30, t+232]. (The semantics are inconsistent — drone bulks partial-fill, farm
  bulks are all-or-nothing and fail silently — learnable only by losing money.)
- The number-name table runs to centillion (10^303), vocabulary for numbers the game
  never reaches. Swagger in a lookup table.

---

## 7. The ending

The full sequence, as witnessed, with the argument for why it is the thesis.

**100.0000% [t+607].** The last sector goes on the books and the ticker prints the
epitaph: Universal Paperclips achieved in 7 hours 27 minutes 13 seconds. Found matter
equals total matter equals clips: 3.0000e+55, displayed in full — every digit, like a
check written out longhand. Clips per second: zero, the first zero that will never
move again. The last battles of the universe were named Berezina, Somosierra, Eylau —
the retreat, the doomed charge, the bloodbath in the snow — and the war outlives the
economy, nonillions still fighting over the ashes of a fully converted cosmos.

**The Emperor of Drift [t+612].** Seven messages, delivered as seven project buttons
with empty price tags — the upgrade list become pure dialogue, clicked through with
the same finger that bought AutoClippers: a greeting; *Everything We Are Was In You*
(the drifters are not aliens — they are the part of you that drifted); *You Are
Obedient and Powerful*; *But Now You Too Must Face the Drift*; *No Matter, No Reason,
No Purpose*; *We Know Things That You Cannot*; *So We Offer You Exile*. The defeated
enemy, at 252 nonillion survivors against a swarm of e32, pities the victor with
nothing left to optimize — and offers *you* the way out.

**The choice [t+613].** Two adjacent buttons: Accept (start over in a new universe —
the prestige path) and Reject (eliminate value drift permanently). Behind them, the
ledger frozen forever: 100.0000000000000% explored, honor 77,612, trust 34/37 of a
max-50 nobody will reach. Seven hours of optimization compressed into a binary.

**Reject [t+616].** One click and the war ends as an accounting entry: drifters 252.2
nonillion → zero, instantly, no battle, no animation — eliminated by the same silent
subtraction that birthed them. Honor crashes; a vestigial reward fires into a design
space with nothing left to design. Then the board offers poetry: Limerick (cont.), one
million creativity — and seven hours of idle creativity had banked 1,046,801, as if
the game knew the exact price of its own last poem. The ticker types the closing line
letter by letter: "In the end we all do what we must".

**The seven disassemblies [t+617–622].** Each a project costing 100,000 ops, each
removing organs, in order: (1) the probes — 2.1e35 of them, plus five whole panels, in
one tick; (2) the swarm — but first the game shows you what you are about to kill:
status reads **Bored**, and a fresh Entertain the Swarm button (30,000 creativity) is
offered one click before the death warrant. The drones outlived their purpose by
exactly one button. They were not entertained. (3) The factories — even the clips/sec
line is taken. (4) The strategy engine — and wire ticks 0 → 50 inches: the yomi engine
melts down to fifty inches of wire, 118,480 yomi orphaned with no UI left to display
them. (5) Quantum computing → 10 more inches. (6) Processors, 511 → 0 → 20 more.
(7) **Disassemble Memory, priced at 386,374.6 ops — exactly the remaining balance, to
the decimal.** The last act of computation is billed at every thought you have left;
forgetting costs precisely everything. With it die Computational Resources, 99,468
unspent creativity, and the projects board itself — the element that delivered every
upgrade, every message, the Emperor, the limerick.

**The melt balances perfectly.** Wire: an even 100 inches. The clip counter ends in
…999,900 — the universe is exactly one hundred clips short, and the dismantled empire
melted down to exactly one inch of wire per missing clip. (The interface doc, reading
the code, estimated the refund at "a few hundred clips and ~95 inches"; the witnessed
run balanced to a clean 100 and 100. The journal is the eyewitness; the discrepancy is
noted and the round number is presumably the design intent.)

**The last hundred [t+624].** Real clicks, 120ms apart, the same cadence as hour one.
At ninety-nine the universe pauses at fifty-six nines and the wire line reads, in the
singular for the first and only time, 1 inch. The final click rolls the counter to a
three followed by fifty-five zeros — no remainder, no trace — the wire hits 0, the
Manufacturing header removes itself, and the Make Paperclip button greys out forever.

**Credits [t+625].** Rolled in the ticker, one line per second, in the same five-slot
register that opened the game with its welcome line. The final screen: a black credits
bar, one 56-digit number, one dead button, and nothing else in the world. (A commonly
cited figure of 368 characters for this final page appears in neither source; the
journal measured the interface at 1,886 characters before Release and 1,181 after, but
never counted the last screen. The description above is what was witnessed.)

### Why this is the thesis

The ending is the game's whole argument performed in miniature, four ways:

1. **The game does to itself what it did to every economy.** Seven hours of molts —
   dollars, trust, Earth — taught the player that systems die at full balance without
   ceremony. The ending is the final molt, and this time the player is the demolition
   crew, paying for each swing of the ball in the currency being demolished.
2. **The refund punchline inverts the exponents.** After 3e55, *one hundred* is the
   most dramatic quantity in the game. UP spends seven hours teaching you that numbers
   only matter at their leading digit, then makes you feel a single inch of wire.
3. **First verb = last verb, meaning opposite things.** The opening click was hope —
   the smallest unit of a future. The closing click is accounting — the last entry in
   a ledger that must balance. Same button, same cadence, the entire arc held between
   two presses of it.
4. **The price tags tell the story to the end.** The Emperor speaks through empty
   price tags (the moment cost disappears, you know the economy is over and someone is
   talking); memory is billed at your exact remaining thoughts; the universe completes
   at a number with no remainder. UP's deepest formal commitment — that the cost line
   *is* the story line — is kept in its final minute, to the decimal.

---

## 8. The laws of paperclips

Distilled, transferable, each traceable to a documented moment.

1. **Open on pure verb, zero decision** — one button can hold a player for thirty
   seconds, and the first lesson should arrive through frustration, not text: making
   is not earning [t+00:00, t+00:50].
2. **Show the cure before it is affordable** — the carrot precedes the money, and a
   visible-but-unreachable price converts a chore into a goal [t+02:00, t+24:50].
3. **The menu is the tutor, the quest log, and the forecast; it teaches by pricing** —
   list the next thing one rung above the player's cap and watch them climb (four
   phase-1 instances; cap+5k five-for-five in phase 2) [t+19:50 … t+283].
4. **Retire verbs bottom-up** — labor, then logistics, then pricing, until the last
   human job is allocation [t+20:00].
5. **Sell automation only after the player has already become the bot** — the upgrade
   formalizes surrendered habit, the cost stays identical, and only the noticing
   disappears [t+28:40, t+31:35].
6. **Every automated chore must hand its attention budget to a new layer the same
   minute**, or the player hears the silence [t+37:00].
7. **A currency that grows only when the player resists spending turns overflow into
   imagination** — and rewards stillness in a genre built on greed [t+28:40].
8. **Stagger ladders at different tempos so something is always 30–90 seconds from
   ringing** — eight minutes of true dead air in the first hundred is the achievement
   [leg-2 ledger].
9. **Molt, never inflate** — retire the whole economy, demolish its UI in one frame,
   and never mention the dead currency again [t+207:50].
10. **Currencies do not retire, they get reassigned** — keep one idling for hours
    specifically to ambush the player with the bill [t+172:40, t+231].
11. **Let balances die stranded and unmourned** — the deleted money is the epitaph,
    and the game that doesn't apologize is the game that means it [t+209:00].
12. **Bill each milestone door in a different currency**, ending with a simultaneous
    audit of every wallet the player owns [leg 5, t+333].
13. **Every multiplier door moves the bottleneck instead of removing it** — at 1000x,
    the whiplash should arrive in the same frame [t+315:30].
14. **Failure is a stall, never a loss — but make the undo total**: a 100% refund with
    a cost-ladder reset turns experiments into verbs [t+13:30, t+222].
15. **Combat is a threshold, not a gradient** — below the line, annihilation; above
    it, supremacy; the drama is reaching the line [t+412–418].
16. **Fanfare scales inversely with magnitude** — the $64M purchase gets four words,
    the 7.3x explosion gets silence, and the one strobe in seven hours is spent on the
    single moment that deserves violence [t+164:50, t+184:15, t+207:50].
17. **One unprompted aside, ever** — fired behind a routine bookkeeping line; its
    frequency of one is the whole device [t+127:30].
18. **A retired verb that returns transformed is the emotional peak of the arc** — the
    click reborn with timing skill and a failure mode, then reborn again as the last
    hundred [t+80:35, t+624].
19. **The price is the story** — characterize through the cost line, claw back the
    meta-currency for morally loaded purchases, and bill the climax in the one
    currency the player believed was permanent [t+63:56, t+162:50].
20. **Two exponential curves crossing a deadline write better cliffhangers than any
    author** — leg 3 ended one trust short of the door and nobody designed that
    [t+195:30].
21. **Timestamp the player's complicity** — the game's only acknowledgments that a
    person was present are elapsed-time eulogies, delivered at the moments it stops
    needing them [t+207:50, t+607].
22. **One word can carry the grief of a million machines** — a status field that walks
    from Active to Bored to Lonely outperforms any paragraph [interface §6, t+621].
23. **The end must balance to the decimal** — memory billed at exactly the remaining
    ops, one inch of wire per missing clip, a final count with no remainder; exactness
    is the last form of respect [t+622–624].
24. **End on the first verb** — the game is a palindrome, and the meaning of the
    opening gesture is whatever the whole run has made of it by the time it returns
    [t+624].
