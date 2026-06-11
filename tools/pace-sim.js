/* pace-sim v2 — pure-math bots play tithe, act 1 through the last star.
 * (the click rate is the law: if a benchmark needs grinding, the game is wrong, not the bot)
 *
 * SYNC WARNING: every constant below is a hand-mirror of index.html.
 * If you change UPKEEP / ARRIVE / ARRIVE_CD / SURGE / OFFER / RATS / job bases
 * / costs / mults in the game, change them HERE TOO or the sim lies.
 *
 * v1 benchmarks (CLAUDE.md + DESIGN-V2 §10) — all still binding:
 *   first villager < 60s · first building < 45s · no wall > 180s pre-hollow ·
 *   first offering < 8 min · first miracle 1-4 min after the turn · tease < 12 min ·
 *   faith 4 by minute 9 · temple < 14 min · molt 2 at 10-13 · the wall is the only
 *   flat road · ascension 18-22 · three staggered timers · no post-molt flat > 3 min ·
 *   skies 8/7/6 and falling · full run 34-38 · the last star ends it
 *
 * v2 contract (DESIGN-V3 §6) — three bots, instrumented:
 *   Z  zero clicks after the first offering (2.0/s before) — must COMPLETE the game
 *   R  0.8 clicks/s — the relaxed human, reference timings
 *   F  2.0 clicks/s — the motivated hand, banded windows
 *   checks: zero-click completion · click share <= 12% · overtake < 4:30 and the
 *   hand <= 25% of automation from 4:00 · policy spread ±20% · R90 to the LAST STAR
 *   (the Wall exempt) · decision density >= 4/300s pre-ascension, >= 2 after ·
 *   carrot invariant (exactly one priced unaffordable row per active column) ·
 *   dial fairness ±15% · broke-ascend probe · field-event density (a scene quantum
 *   changes <= every 20s through ascension, <= every 30s in act 3)
 *
 *   XFAIL ledger below: checks the OLD economy is known to fail, each tagged with
 *   the milestone that must clear it. The ledger may only shrink. An XPASS means
 *   the milestone landed — remove the entry.
 */

"use strict";

/* ---------- mirrored constants ---------- */
const UPKEEP = 0.25;
const ARRIVE = { base: 15, rate: 1.3 };
const ARRIVE_CD = 20;
const SURGE  = { x: 8, s: 90 };
const OFFER  = { base: 5, rate: 1.5 };
const CAP_HUT = 2;
const RATS = { at: 120, drain: 0.5 };
const FAITH_GATES = [25, 65, 130, 235, 405, 680, 1125, 2900];
const FAITH_MAX = 13;
const FAVOR_CAP_PER = 200;
const LEGEND_RATE = 0.3;
const DOUBT_S = 90;                       /* heresy compounds */
const SIGN = { cost: 220, rate: 1.5 };    /* doubt -> 0; half again each time */

const JOBS = {
  f: { base: 0.50, out: "food"  },
  w: { base: 0.35, out: "wood"  },
  m: { base: 0.25, out: "stone" },
  p: { base: 0.20, out: "favor", eats: 2 },
};
const BLD = {  /* max = field anchors, mirrored from index.html */
  hut:    { cost: { wood: 12 },            rate: 1.30, max: 5 },
  farm:   { cost: { wood: 25 },            rate: 1.18, max: 3, job: "f", per: 0.25 },
  quarry: { cost: { wood: 60 },            rate: 1.18, max: 1, job: "m", per: 0.25 },
  sawpit: { cost: { wood: 50, stone: 15 }, rate: 1.18, max: 1, job: "w", per: 0.25 },
  granary:{ cost: { wood: 80, stone: 40 }, rate: 1.18, max: 1 },  /* offline cap x8 — no value to a bot that never leaves */
};
const PROJ = {
  fire:    { cost: { wood: 10 } },
  tools:   { cost: { wood: 30, stone: 10 }, allJobs: 1.5 },
  rats:    { cost: { wood: 60 } },
  shrineX: { cost: { stone: 90, wood: 60 }, showStone: 70 },
  temple:  { cost: { stone: 120, wood: 80, favor: 150 } },  /* worship x2; needs faith 4 */
  tithe:   { cost: { favor: 250, food: 60, wood: 80, stone: 30 } },  /* molt 2 — the axe comes back out for the last bill */
  songs:   { cost: { legend: 20 } },   /* worship x1.5 */
  calendar:{ cost: { legend: 45 } },   /* arrivals x0.8 */
  count:   { cost: { legend: 90 } },   /* a decimal place — no rate, only dread */
  lights:  { cost: { favor: 90 } },    /* the race is seen: faith N / 13, the ascension row */
  ascend:  { cost: { favor: 2000 } },  /* + 13 faith + the flock */
};
const MIR = {
  goodyear:  { cost: 60 },   /* arrivals at half the food (arriveAt x0.5) */
  obedience: { cost: 150 },  /* favor x2; teases the tithe */
  quickening:{ cost: 350 },  /* arrivals x2 again, road cd 20s -> 10s; the bot buys it for the race */
};
const CULT_ARRIVE = 0.85;    /* per cultivator (jobs.c) */

/* act 3 — the board, the silence, the skies (§7) */
const HERALD3 = { cost: 400, rate: 1.25, grow: 0.02, cap: 144 };
const WORLDS_PER_SKY = 14;
const WORLD3 = { base: 40, rate: 1.55 };  /* herald-seconds for world i */
const SOUL3  = { base: 1e6, rate: 3 };
const SKY_MULT = 1000;
const REAP_RATE = 4;
const SILENCE3 = { born: 5, every: 40, mult: 2 };
const VIGIL_RATE = 8;
const SKY_DOOR = 2.0e12;
const MIR3 = { tongues: 1200, hush: 2500 };  /* hush scales x1000^g; tongues never does */
const SEED_BANK = 400;    /* the first seed — the favor cap (2,600) is the ceiling on the stake */

const DT = 0.25;          // sim step
const WANT_P = 3;         // priests the bot chases after the turn
const CLICK_R = 0.8;      // the relaxed human
const CLICK_F = 2.0;      // the motivated hand

/* v2 contract numbers (DESIGN-V3 §6) */
const V2 = {
  CLICK_SHARE: 0.12, OVERTAKE_S: 270, OVERTAKE_PROD: 8, HAND_FRAC: 0.25, HAND_FROM: 240,
  POLICY_SPREAD: 0.20, R90: 90, DD_PRE: 4, DD_POST: 2, DD_WIN: 300,
  DIAL_SPREAD: 0.15, BROKE_S: 120, FIELD_PRE: 20, FIELD_ACT3: 30,
};

/* the XFAIL ledger — what the OLD economy is known to fail, and which milestone clears it.
 * may only shrink. an XPASS = the milestone landed; remove the line. */
const XFAIL = {
  "v2 zero-click completion":   "V3-M1/M2 — automation cannot finish the old game",
  "v2 click share <= 12%":      "V3-M1 — clicking is the optimal wood source",
  "v2 overtake by 4:30":        "V3-M1 — the hand beats the maxed village forever",
  "v2 policy spread within 20%":"V3-M1 — a no-wood-click policy can never pay the wood bills",
  "v2 R90 to the last star":    "V3-M2/M4 — the plateau and the sky back-halves",
  "v2 decision density":        "V3-M5 — purchases cluster in bursts",
  "v2 carrot invariant":        "V3-M5 — columns run empty or crowded",
  "v2 dial fairness":           "V3-M3 — the dial does not exist yet",
  "v2 broke-ascend probe":      "V3-M4 — the first herald is not yet free",
  "v2 field-event density":     "V3-M6 — the field has no late channels yet",
};

/* ---------- mirrored economy ---------- */
const bldCost = (s, id) => {
  const d = BLD[id], c = {};
  for (const k of Object.keys(d.cost)) c[k] = Math.ceil(d.cost[k] * Math.pow(d.rate, s.bld[id]));
  return c;
};
const afford = (s, c) => Object.keys(c).every(k => s[k] >= c[k]);
const pay = (s, c) => { for (const k of Object.keys(c)) s[k] -= c[k]; };
const bldJobMult = (s, j) => Object.keys(BLD).reduce((m, id) =>
  m * (BLD[id].job === j ? 1 + BLD[id].per * s.bld[id] : 1), 1);
/* law 15 — a threshold, not a gradient */
const stalled = s => s.proj.tithe && s.doubt > 0 && s.doubt * 2 >= s.pop;
const signCost = s => Math.ceil(SIGN.cost * Math.pow(SIGN.rate, s.signs));
/* favor takes no surge, no flint — the gift feeds the fields, never the shrine */
const jobRate = (s, j) => {
  if (JOBS[j].out === "favor") return stalled(s) ? 0 :
    s.jobs[j] * JOBS[j].base * (s.mir.obedience ? 2 : 1) * (s.proj.temple ? 2 : 1) * (s.proj.songs ? 1.5 : 1);
  return s.jobs[j] * JOBS[j].base * bldJobMult(s, j) *
    (s.proj.tools ? PROJ.tools.allJobs : 1) *
    (s.surgeLeft > 0 ? SURGE.x : 1);
};
const prodOf = (s, cur) => Object.keys(JOBS).reduce((t, j) => t + (JOBS[j].out === cur ? jobRate(s, j) : 0), 0);
const congRate = s => (!s.proj.tithe || stalled(s)) ? 0 :
  (s.cong || 0) * JOBS.p.base * 0.5 * (s.mir.obedience ? 2 : 1) * (s.proj.temple ? 2 : 1) * (s.proj.songs ? 1.5 : 1);
const upkeep = s => (s.pop + s.jobs.p * ((JOBS.p.eats || 1) - 1)) * UPKEEP;
const ratsDrain = s => (s.ratsSeen && !s.proj.rats) ? RATS.drain : 0;
const cap = s => s.bld.hut * CAP_HUT;
const arriveAt = s => ARRIVE.base * Math.pow(ARRIVE.rate, s.pop) * (s.mir.goodyear ? 0.5 : 1)
  * (s.mir.quickening ? 0.5 : 1) * (s.proj.calendar ? 0.8 : 1) * Math.pow(CULT_ARRIVE, s.jobs.c);
const arriveCdS = s => ARRIVE_CD * (s.mir.quickening ? 0.5 : 1);
const clickPow = s => s.proj.tools ? 2 : 1;
/* the spine — faith derived, favor capped, every grant through one door */
const faithOf = s => s.offerings === 0 ? 0 :
  Math.min(FAITH_MAX, 1 + (s.deeper || 0) + FAITH_GATES.filter(g => s.totalFavor >= g).length);
const favorCap = s => FAVOR_CAP_PER * Math.max(1, faithOf(s));
const grantFavor = (s, y) => {
  const cp = favorCap(s);
  if (s.favor >= cp || y <= 0) return 0;
  if (y >= cp - s.favor) { y = cp - s.favor; s.favor = cp; } else { s.favor += y; }
  s.totalFavor += y; return y;
};
/* molt 2: one slider decides, the rows report — mirrored from deriveJobs() */
function deriveJobs(s, u) {
  const away = Math.min(s.doubt, s.pop);
  const stock = s.pop - away;
  const fields = Math.round((1 - u) * stock);
  const shrine = stock - fields;
  const p = Math.min(shrine, faithOf(s));
  const per = JOBS.f.base * bldJobMult(s, "f") * (s.proj.tools ? PROJ.tools.allJobs : 1);
  const need = per > 0 ? Math.ceil((s.pop + p) * UPKEEP / per) : fields;
  const f = Math.min(fields, need);
  return { f, p, c: fields - f, cong: shrine - p };
}

/* ---------- visibility mirror (the carrot model; reveal predicates from index.html) ---------- */
const SHOW = {
  bld: {
    hut:     s => !!s.proj.fire,
    farm:    s => s.pop >= 2,
    quarry:  s => s.bld.farm >= 1,
    sawpit:  s => s.bld.quarry >= 1,
    granary: s => s.offerings > 0,
  },
  proj: {
    fire:     s => s.totalWood >= 6,
    tools:    s => s.totalStone >= 3,
    rats:     s => s.ratsSeen,
    shrineX:  s => s.totalStone >= PROJ.shrineX.showStone,
    temple:   s => faithOf(s) >= 4,
    tithe:    s => !!s.mir.obedience,
    songs:    s => s.legend > 0,
    calendar: s => !!s.proj.songs,
    count:    s => !!s.proj.calendar,
    lights:   s => s.offerings >= 6,
    ascend:   s => !!s.proj.lights,
  },
  mir: {
    goodyear:   s => s.offerings > 0,
    obedience:  s => !!s.mir.goodyear,
    quickening: s => !!s.mir.obedience && faithOf(s) >= 5,
  },
};
/* rows the player can be saving toward, per column, with live costs */
function carrotRows(s) {
  const rows = [];
  if (!s.proj.tithe) {  /* the works column lives until molt 2 */
    for (const id of Object.keys(BLD)) {
      if (s.bld[id] >= BLD[id].max) continue;
      if (!SHOW.bld[id](s)) continue;
      rows.push({ col: "works", id, ok: afford(s, bldCost(s, id)) });
    }
  }
  if (!s.proj.ascend) {
    for (const id of Object.keys(PROJ)) {
      if (id === "ascend") continue;  /* the horizon row, not a carrot */
      if (s.proj[id]) continue;
      if (!SHOW.proj[id](s)) continue;
      if (s.proj.tithe && (PROJ[id].cost.wood || PROJ[id].cost.stone) && !PROJ[id].cost.legend) continue; /* folded after the molt */
      rows.push({ col: "und", id, ok: afford(s, PROJ[id].cost) });
    }
    for (const id of Object.keys(MIR)) {
      if (s.mir[id]) continue;
      if (!SHOW.mir[id](s)) continue;
      rows.push({ col: "und", id, ok: s.favor >= MIR[id].cost });
    }
    if (s.proj.tithe && s.doubt > 0) rows.push({ col: "und", id: "sign", ok: s.favor >= signCost(s) });
  } else if (!s.endState) {
    rows.push({ col: "und", id: "herald", ok: s.favor >= heraldCostS(s) });
    if (s.heralds >= HERALD3.cap * 0.5 && !s.mir.tongues)
      rows.push({ col: "und", id: "tongues", ok: s.favor >= MIR3.tongues });
    if (s.worlds >= WORLDS_PER_SKY && s.galaxy < 2)
      rows.push({ col: "und", id: "sky", ok: s.souls >= skyCostS(s) });
  }
  return rows;
}

/* ---------- instrumentation ---------- */
function instrument(s) {
  /* rings: a row flips affordable, a row reveals, or any marked event (marks ring on their own) */
  const rows = carrotRows(s);
  const seen = s._rowSeen || (s._rowSeen = {});
  for (const r of rows) {
    if (!(r.id in seen)) { seen[r.id] = r.ok; s.rings.push(s.t); continue; }  /* reveal */
    if (!seen[r.id] && r.ok) s.rings.push(s.t);                               /* affordable */
    seen[r.id] = r.ok;
  }
  /* carrot invariant sample (1/s): per active column, count visible+priced+unaffordable */
  if (Math.floor(s.t) > (s._carT || -1)) {
    s._carT = Math.floor(s.t);
    for (const col of ["works", "und"]) {
      const live = rows.filter(r => r.col === col);
      if (live.length === 0) continue;            /* a finished column is exempt */
      const carrots = live.filter(r => !r.ok).length;
      if (carrots !== 1) s.carrotBad++;
      s.carrotN++;
    }
  }
  /* field quanta: counts the canvas can show today (builds, figures, flecks, walker, stars) */
  const fk = [
    s.bld.hut, s.bld.farm, s.bld.quarry, s.bld.sawpit, s.bld.granary,
    s.proj.fire ? 1 : 0, s.proj.shrineX ? 1 : 0, s.proj.temple ? 1 : 0,
    s.pop, s.offerings, s.arriveCd > 0 ? 1 : 0,
    s.proj.ascend ? 1 : 0, s.worlds, s.galaxy, s.faint, Math.floor(Math.min(36, s.heralds)),
  ].join("|");
  if (fk !== s._fieldKey) { s._fieldKey = fk; s.fieldEv.push(s.t); }
}
const decide = s => s.decisions.push(s.t);

/* ---------- sim state ---------- */
function freshSim(clickRate) {
  return {
    t: 0, clickRate: clickRate, zeroAfterTurn: false, policy: "balanced",
    food: 0, wood: 0, stone: 0, favor: 0,
    totalFood: 0, totalWood: 0, totalStone: 0, totalFavor: 0,
    clickFood: 0, clickWood: 0,
    pop: 0, jobs: { f: 0, w: 0, m: 0, p: 0, c: 0 },
    bld: { hut: 0, farm: 0, quarry: 0, sawpit: 0, granary: 0 },
    proj: {}, mir: {}, offerings: 0, surgeLeft: 0, arriveCd: 0, ratsSeen: false,
    deeper: 0, legend: 0, faithSeen: 0,
    doubt: 0, doubtT: 0, signs: 0, cong: 0,
    heralds: 0, heraldSeeds: 0, worlds: 0, worldProg: 0, souls: 0, galaxy: 0,
    slider: 0, silenceBorn: false, silenceT: 0, faint: 0, dimT: 0, vigil: false, hush: 0,
    endState: 0,
    minFoodRate3p: Infinity, tOvertake: Infinity, handBad: 0, handN: 0,
    carrotBad: 0, carrotN: 0,
    events: [], rings: [], decisions: [], fieldEv: [],
  };
}
const mark = (s, label) => { s.events.push({ t: s.t, label }); s.rings.push(s.t); };

/* bot job policy: feed the mouths first, then priests (post-turn), then stone */
function alloc(s) {
  const fPer = JOBS.f.base * bldJobMult(s, "f") * (s.proj.tools ? 1.5 : 1);
  const wantP = s.offerings > 0 ? Math.min(WANT_P, faithOf(s)) : 0;  /* the priests fit the faith */
  const J = { f: 0, w: 0, m: 0, p: 0, c: 0 };
  let left = s.pop;
  const need = (s.pop + wantP) * UPKEEP + ratsDrain(s) + 0.01;
  J.f = Math.min(left, Math.ceil(need / fPer)); left -= J.f;
  J.p = Math.min(left, wantP); left -= J.p;
  if (s.bld.quarry > 0) { J.m = left; } else { J.w = left; }
  s.jobs = J;
}

function doOffer(s) {
  s.pop--; s.offerings++;
  grantFavor(s, OFFER.base * Math.pow(OFFER.rate, s.offerings - 1));
  s.surgeLeft = SURGE.s;
  s.arriveCd = Math.max(s.arriveCd, arriveCdS(s));
  alloc(s);
  if (s.zeroAfterTurn) s.clickRate = 0;   /* bot Z lets go of the verbs here */
  decide(s);
  mark(s, "offering " + s.offerings + (s.offerings === 1 ? " — the turn" : ""));
}

function doDeeper(s) {
  /* the button's second life: rungs of 1, 2, 4, 8 — no surge, no yield, one point of faith */
  const n = Math.pow(2, s.deeper);
  s.pop -= n; s.deeper++; s.doubt++;
  s.offerings += n;
  s.arriveCd = Math.max(s.arriveCd, arriveCdS(s));
  decide(s);
  mark(s, "a deeper offering — " + n);
}

/* the shared physics: clicks, gains, doubt, legend, mouths, arrivals */
function tickSim(s, click) {
  const cp = clickPow(s);
  const got = s.clickRate * cp * DT;
  s[click] += got;
  s["total" + click[0].toUpperCase() + click.slice(1)] += got;
  if (click === "food") s.clickFood += got; else if (click === "wood") s.clickWood += got;
  /* law 15: favor flows only until the stall lands, even inside one step */
  let favDt = DT;
  if (s.proj.tithe && s.doubt > 0) {
    if (stalled(s)) favDt = 0;
    else {
      const k = Math.ceil(s.pop / 2 - s.doubt);
      favDt = Math.min(DT, Math.max(0, k * DOUBT_S - s.doubtT));
    }
  }
  grantFavor(s, (prodOf(s, "favor") + congRate(s)) * favDt);
  for (const cur of ["food", "wood", "stone"]) {
    const p = prodOf(s, cur);
    if (p > 0) {
      s[cur] += p * DT;
      s["total" + cur[0].toUpperCase() + cur.slice(1)] += p * DT;
    }
  }
  /* heresy compounds: one more every ninety seconds, while any remain */
  if (s.doubt > 0) {
    s.doubtT += DT;
    while (s.doubtT >= DOUBT_S) { s.doubtT -= DOUBT_S; s.doubt++; }
  } else s.doubtT = 0;
  if (s.offerings > 0 && s.favor >= favorCap(s)) s.legend += LEGEND_RATE * DT;
  const fNow = faithOf(s);
  if (fNow > s.faithSeen) { s.faithSeen = fNow; if (fNow > 1) mark(s, "faith " + fNow); }
  s.food = Math.max(0, s.food - (upkeep(s) + ratsDrain(s)) * DT);
  if (!s.ratsSeen && s.totalFood >= RATS.at) { s.ratsSeen = true; mark(s, "rats in the stores"); }
  /* arrivals are instant; only an offering leaves a gap on the road */
  s.arriveCd = Math.max(0, s.arriveCd - DT);
  if (s.proj.fire && s.pop < cap(s) && s.food >= arriveAt(s) && s.arriveCd === 0) {
    s.pop++; mark(s, "villager " + s.pop);
  }
  if (!s.proj.tithe && s.jobs.p >= WANT_P) {
    const fr = prodOf(s, "food") - upkeep(s) - ratsDrain(s);
    if (fr < s.minFoodRate3p) s.minFoodRate3p = fr;
  }
  /* the race's three clocks, marked the moment each lands */
  if (s.proj.tithe) {
    if (!s.tG8 && FAITH_GATES.every(g => s.totalFavor >= g)) { s.tG8 = s.t; mark(s, "the last gate"); }
    if (!s.tRb && s.deeper === 4 && s.pop >= cap(s)) { s.tRb = s.t; mark(s, "the herd rebuilt"); }
    if (!s.tBank && s.favor >= PROJ.ascend.cost.favor) { s.tBank = s.t; mark(s, "the bank — 2,000 favor"); }
  }
  /* v2: the overtake clock and the hand-vs-automation ledger */
  if (s.tOvertake === Infinity && prodOf(s, "wood") >= V2.OVERTAKE_PROD) s.tOvertake = s.t;
  if (s.t >= V2.HAND_FROM && !s.proj.tithe) {
    const hand = s.clickRate * cp;
    if (hand > 0) {
      for (const cur of ["food", "wood"]) {
        s.handN++;
        if (hand > V2.HAND_FRAC * prodOf(s, cur)) s.handBad++;
      }
    }
  }
  if (s.surgeLeft > 0) s.surgeLeft -= DT;
  s.t += DT;
  instrument(s);
}

/* the race: one slider, one ladder, one bank (law 20) */
function stepRace(s) {
  /* the wallet crosses (§4): nobody ascends broke — the bot banks the first
     three seeds' favor on top of the bill, as a player staring at
     `a herald — 400 favor` would */
  if (faithOf(s) >= FAITH_MAX && s.favor >= PROJ.ascend.cost.favor + SEED_BANK) {
    s.favor -= PROJ.ascend.cost.favor; s.proj.ascend = true;
    s.pop = 0; s.doubt = 0;
    decide(s);
    mark(s, "ascension — molt 3"); return;
  }
  /* worship's running cost: on the plateau ride the rung's one doubt-seed to
     three (the sign bought at the cap pumps the gate ladder); in the push, pay
     only when the silence is total */
  const wantSign = s.proj.calendar ? stalled(s) : (stalled(s) || s.doubt >= 3);
  if (wantSign && s.favor >= signCost(s)) {
    const c = signCost(s);
    s.favor -= c; s.signs++; s.doubt = 0; s.doubtT = 0;
    decide(s);
    mark(s, "a sign — " + c + " favor");
  }
  else if (!s.proj.lights && s.favor >= PROJ.lights.cost.favor) {
    s.favor -= PROJ.lights.cost.favor; s.proj.lights = true; decide(s); mark(s, "other lights — the race is seen");
  }
  else if (!s.proj.songs && s.legend >= PROJ.songs.cost.legend) {
    s.legend -= PROJ.songs.cost.legend; s.proj.songs = true; decide(s); mark(s, "the songs");
  }
  else if (!s.proj.calendar && s.legend >= PROJ.calendar.cost.legend) {
    s.legend -= PROJ.calendar.cost.legend; s.proj.calendar = true; decide(s); mark(s, "a calendar");
  }
  /* the first rung starts the doubt clock; rungs 2-3 wait until the shopping
     is done (the calendar closes the plateau); the 8-rung waits for a half-full
     bank — nobody guts the village while the row reads empty (the gut-check) */
  else if (s.deeper === 0 && s.pop >= cap(s)) { doDeeper(s); }
  else if (s.proj.calendar && s.deeper >= 1 && s.deeper < 3 &&
           s.pop >= Math.pow(2, s.deeper)) { doDeeper(s); }
  else if (s.proj.calendar && s.deeper === 3 && s.pop >= cap(s) &&
           s.favor >= 1800) { doDeeper(s); }

  /* the relaxed line: shrine-heavy, one eye on the larder */
  const u = s.food > 60 ? 0.85 : s.food > 25 ? 0.7 : 0.5;
  const dv = deriveJobs(s, u);
  s.jobs = { f: dv.f, w: 0, m: 0, p: dv.p, c: dv.c };
  s.cong = dv.cong;
  tickSim(s, "food");
}

/* ---------- act 3: the board, the silence, the skies (§7) ---------- */
const heraldCostS = s => Math.ceil(HERALD3.cost * Math.pow(HERALD3.rate, s.heraldSeeds));
const worldNeedS  = i => WORLD3.base * Math.pow(WORLD3.rate, i);
const worldSoulsS = (s, i) => SOUL3.base * Math.pow(SOUL3.rate, i) * Math.pow(SKY_MULT, s.galaxy);
const vigilCostS  = s => VIGIL_RATE * Math.pow(SKY_MULT, s.galaxy);
const hushCostS   = s => MIR3.hush * Math.pow(SKY_MULT, s.galaxy);
const hushOn      = s => s.hush === s.galaxy + 1;
const skyCostS    = s => SKY_DOOR * Math.pow(SKY_MULT, s.galaxy);

/* mirror of the game's act-3 tick: reap first, then spread, then the silence */
function tickBoard(s) {
  s.favor += s.worlds * REAP_RATE * Math.pow(SKY_MULT, s.galaxy) * s.slider * DT;
  const sp = 1 - s.slider, conv = s.mir.tongues ? 2 : 1;
  if (s.heralds > 0 && sp > 0) {
    s.heralds = Math.min(HERALD3.cap, s.heralds + HERALD3.grow * s.heralds * sp * DT);
    /* §7.4 mirror: in the third sky the heralds stop one short of the last star */
    const lim = WORLDS_PER_SKY - (s.galaxy === 2 ? 1 : 0);
    if (s.worlds < lim) {
      s.worldProg += s.heralds * sp * DT * conv;
      while (s.worlds < lim &&
             s.worldProg >= worldNeedS(s.worlds) * (s.faint > 0 ? SILENCE3.mult : 1)) {
        s.worldProg -= worldNeedS(s.worlds) * (s.faint > 0 ? SILENCE3.mult : 1);
        s.souls += worldSoulsS(s, s.worlds);
        s.worlds++;
        s.rings.push(s.t);  /* a star flips — the board's heartbeat */
        if (s.faint > 0) s.faint--;  /* relit by being taken */
      }
    }
  }
  if (!s.silenceBorn && s.worlds >= SILENCE3.born) {
    s.silenceBorn = true; s.dimT = 0; s.faint = Math.min(1, WORLDS_PER_SKY - s.worlds);
    mark(s, "the silence — a light goes faint");
  }
  if (s.silenceBorn) {
    s.silenceT += DT;
    const vc = hushOn(s) ? 0 : vigilCostS(s) * DT;
    if (s.vigil && s.favor >= vc) { s.favor -= vc; s.dimT = 0; }
    else {
      if (s.vigil) s.vigil = false;
      s.dimT += DT;
      while (s.dimT >= SILENCE3.every && s.faint < WORLDS_PER_SKY - s.worlds) {
        s.dimT -= SILENCE3.every; s.faint++;
      }
      if (s.faint >= WORLDS_PER_SKY - s.worlds) s.dimT = 0;
    }
  }
  s.t += DT;
  instrument(s);
}

/* the board bot: seed, spread, split the dial for the vigil when the reap
   can carry it, take the doors the moment they open */
function stepBoard(s) {
  /* the doors and the end */
  if (s.worlds >= WORLDS_PER_SKY && s.galaxy < 2 && s.souls >= skyCostS(s)) {
    s.souls -= skyCostS(s); s.galaxy++;
    /* the door is narrow: of a gross of heralds, a dozen cross (§7.4) */
    if (s.heralds > 1) s.heralds = Math.max(1, Math.sqrt(s.heralds));
    s.worlds = 0; s.worldProg = 0; s.faint = 0; s.dimT = 0;
    decide(s);
    mark(s, "another sky — " + (s.galaxy + 1)); tickBoard(s); return;
  }
  if (s.galaxy === 2 && s.worlds === WORLDS_PER_SKY - 1 && s.heralds >= 1) {
    s.souls += worldSoulsS(s, WORLDS_PER_SKY - 1);
    s.worlds = WORLDS_PER_SKY; s.heralds = 0; s.heraldSeeds = 0;
    s.endState = 1; mark(s, "the last star — dark"); return;
  }
  /* shopping, one bill a step; seeds past the first are incidental */
  if ((s.heraldSeeds < 1 || (s.heraldSeeds < 3 && s.worlds >= 4)) && s.favor >= heraldCostS(s)) {
    s.favor -= heraldCostS(s); s.heraldSeeds++; s.heralds++;
    decide(s);
    if (s.heraldSeeds === 1) mark(s, "a herald — the first seed");
  } else if (!s.mir.tongues && s.heralds >= HERALD3.cap * 0.9 && s.favor >= MIR3.tongues) {
    s.favor -= MIR3.tongues; s.mir.tongues = true; decide(s); mark(s, "tongues — every door opens from inside");
  } else if (s.silenceBorn && s.silenceT >= 90 && !hushOn(s) && s.faint < WORLDS_PER_SKY - s.worlds &&
             s.favor >= hushCostS(s) + vigilCostS(s) * 30) {
    s.favor -= hushCostS(s); s.hush = s.galaxy + 1; decide(s); mark(s, "the hush — sky " + (s.galaxy + 1));
  }
  /* the vigil: pay-as-you-go from the moment the silence is born — a dim
     doubles a world, and the doubled worlds cost more than the watch */
  s.vigil = hushOn(s) || (s.silenceBorn && s.favor >= vigilCostS(s) * DT);
  /* the dial: the vigil names its reap share; tongues waits for the cap, then
     a hard burst — reaping while the heralds still grow stretches the sky */
  const M = Math.pow(SKY_MULT, s.galaxy);
  const bill = s.heraldSeeds < 1 ? heraldCostS(s)
             : !s.mir.tongues && s.heralds >= HERALD3.cap * 0.9 ? MIR3.tongues : 0;
  const vigilShare = s.vigil && !hushOn(s) && s.worlds > 0
    ? Math.min(0.6, vigilCostS(s) * 1.15 / (s.worlds * REAP_RATE * M)) : 0;
  const newSlider = Math.min(0.7, vigilShare + (bill > 0 && s.favor < bill && s.worlds >= 2 ? 0.45 : 0));
  if (Math.abs(newSlider - s.slider) >= 0.1) decide(s);
  s.slider = newSlider;
  tickBoard(s);
}

/* bot goal: what to buy next, what to click toward it.
   policy shades the act-1 click choice: food-first / wood-first / balanced */
function step(s, allowOffer) {
  if (s.proj.tithe) { stepRace(s); return; }
  alloc(s);

  let click = s.policy === "food-first" ? "food" : "wood", buy = null;
  if (!s.proj.fire)            { buy = ["proj", "fire"];   click = s.totalFood < 3 ? "food" : "wood"; }
  else if (s.bld.hut < 1)      { buy = ["bld", "hut"]; }
  else if (s.pop < 2)          { click = "food"; }                      /* draw villagers */
  else if (s.bld.farm < 1)     { buy = ["bld", "farm"]; }
  else if (s.bld.quarry < 1)   { buy = ["bld", "quarry"]; }
  else if (!s.proj.tools)      { buy = ["proj", "tools"]; }
  else if (!s.proj.shrineX) {
    /* the grind: build out the finite works, then masons carry it to the hollow */
    if (s.totalStone >= PROJ.shrineX.showStone && afford(s, PROJ.shrineX.cost)) buy = ["proj", "shrineX"];
    else if (s.bld.sawpit < BLD.sawpit.max && afford(s, bldCost(s, "sawpit"))) buy = ["bld", "sawpit"];
    else if (s.bld.farm < BLD.farm.max && afford(s, bldCost(s, "farm")))       buy = ["bld", "farm"];
    else if (s.pop >= cap(s) && s.bld.hut < BLD.hut.max && afford(s, bldCost(s, "hut"))) buy = ["bld", "hut"];
    else if (s.pop < cap(s)) click = "food";
    if (s.policy === "wood-first") click = "wood";
  }
  else if (allowOffer) {
    /* act 2: the turn, then priests, miracles, more offerings */
    if (s.offerings === 0 && s.pop > 1) { doOffer(s); return; }
    if (s.offerings > 0) {
      if (!s.mir.goodyear && s.favor >= MIR.goodyear.cost) {
        s.favor -= MIR.goodyear.cost; s.mir.goodyear = true; decide(s); mark(s, "miracle: a good year");
      } else if (s.mir.goodyear && !s.mir.obedience && s.favor >= MIR.obedience.cost) {
        s.favor -= MIR.obedience.cost; s.mir.obedience = true; decide(s);
        mark(s, "miracle: obedience — the tithe teased"); return;
      } else if (s.mir.obedience && !s.proj.temple && faithOf(s) >= 4 && afford(s, PROJ.temple.cost)) {
        pay(s, PROJ.temple.cost); s.proj.temple = true; decide(s); mark(s, "temple"); return;
      } else if (s.proj.temple && !s.proj.tithe && afford(s, PROJ.tithe.cost)) {
        pay(s, PROJ.tithe.cost); s.proj.tithe = true; decide(s); mark(s, "the tithe — molt 2");
        /* the share is judged PER CURRENCY and the worst one counts — a food
           bank from surged fields must not launder a hand-built wood economy */
        s.moltSnap = { favor: s.favor, totalFavor: s.totalFavor, food: s.food, legend: s.legend,
                       clickShare: Math.max(s.clickFood / Math.max(1, s.totalFood),
                                            s.clickWood / Math.max(1, s.totalWood)) };
        return;
      } else if (s.pop >= cap(s) && s.pop > 1) { doOffer(s); return; }
      /* the temple wants wood again — the axe comes back out of the shed; the tithe asks once more */
      click = (s.mir.obedience && !s.proj.temple && s.wood < PROJ.temple.cost.wood) ? "wood"
            : (s.proj.temple && !s.proj.tithe && s.wood < PROJ.tithe.cost.wood) ? "wood" : "food";
    }
  }

  /* the rats jump any queue: 60 wood against a standing leak — a real decision now */
  if (s.ratsSeen && !s.proj.rats) buy = ["proj", "rats"];

  if (buy) {
    const [kind, id] = buy;
    const c = kind === "bld" ? bldCost(s, id) : PROJ[id].cost;
    if (afford(s, c)) {
      /* a decision iff some OTHER priced row was simultaneously affordable */
      const others = carrotRows(s).filter(r => r.ok && r.id !== id).length;
      pay(s, c);
      if (kind === "bld") { s.bld[id]++; mark(s, id + " " + s.bld[id]); }
      else { s.proj[id] = true; mark(s, id === "rats" ? "rats kept" : id); }
      if (others > 0) decide(s);
      alloc(s);
    }
  }

  tickSim(s, click);
}

/* ---------- run drivers ---------- */
function runFull(clickRate, opts) {
  const s = freshSim(clickRate);
  if (opts && opts.zeroAfterTurn) s.zeroAfterTurn = true;
  if (opts && opts.policy) s.policy = opts.policy;
  while (!s.proj.ascend && s.t < 3000) step(s, true);
  while (s.proj.ascend && !s.endState && s.t < 6000) stepBoard(s);
  return s;
}
function runToMolt(clickRate, policy) {
  const s = freshSim(clickRate);
  s.policy = policy;
  while (!s.proj.tithe && s.t < 3000) step(s, true);
  return s.proj.tithe ? s.t : Infinity;
}
/* the broke-ascend probe: cross with the bill paid exactly, nothing banked */
function runBrokeProbe() {
  const s = freshSim(0);
  s.proj = { ascend: true }; s.mir = {}; s.favor = 0; s.pop = 0;
  s.offerings = 21; s.deeper = 4; s.totalFavor = 3000; s.slider = 0;
  /* mirrors the game at ascend: heralds as granted by ascend() — none today */
  const t0 = s.t;
  while (s.worlds < 1 && s.t < t0 + 600) stepBoard(s);
  return s.worlds >= 1 ? s.t - t0 : Infinity;
}

/* ---------- run A: the reference bot (R, 0.8 c/s) ---------- */
const A = runFull(CLICK_R);

const at = label => { const e = A.events.find(e => e.label === label || e.label.startsWith(label)); return e ? e.t : Infinity; };
const tVillager = at("villager 1");
const tBuilding = at("hut 1");
const tHollow   = at("shrineX");
const tOffer    = at("offering 1");
const tMiracle  = at("miracle: a good year");
const tTease    = at("miracle: obedience");
const tFaith4   = at("faith 4");
const tTemple   = at("temple");
const tTithe    = at("the tithe — molt 2");
const tAscend   = at("ascension — molt 3");
const tSky2     = at("another sky — 2");
const tSky3     = at("another sky — 3");
const tDark     = at("the last star — dark");
const skyLen    = [tSky2 - tAscend, tSky3 - tSky2, tDark - tSky3];

/* gaps between events up to the excavation */
const pre = A.events.filter(e => e.t <= tHollow);
let worstGap = 0, worstAt = 0, prev = 0;
for (const e of pre) { if (e.t - prev > worstGap) { worstGap = e.t - prev; worstAt = e.t; } prev = e.t; }

/* the race's three clocks, and how flat the road after the molt runs */
const timers = [A.tG8, A.tRb, A.tBank].filter(t => t !== undefined).sort((a, b) => a - b);
const tGaps = timers.length === 3 ? [timers[1] - timers[0], timers[2] - timers[1]] : [];
const post = A.events.filter(e => e.t >= tTithe && e.t <= tAscend);
let postGap = 0, postAt = 0, pv = tTithe;
for (const e of post) { if (e.t - pv > postGap) { postGap = e.t - pv; postAt = e.t; } pv = e.t; }

/* ---------- run B: the bot that refuses (from the excavation) ---------- */
const B = freshSim(CLICK_R);
while (!B.proj.shrineX && B.t < 1200) step(B, false);
const bStart = B.t, bEvents = B.events.length;
const stoneRateFlat = prodOf(B, "stone");
while (B.t < bStart + 300) step(B, false);
const refusedNews = B.events.slice(bEvents).filter(e => !/^(hut|farm|quarry|sawpit|villager|rats)/.test(e.label));

/* ---------- v2 runs: Z (lets go at the turn), F (2.0 c/s), the policy trio, the probe ---------- */
const Z = runFull(CLICK_F, { zeroAfterTurn: true });
const F = runFull(CLICK_F);
const zDark = Z.events.find(e => e.label.startsWith("the last star")) ? Z.events.find(e => e.label.startsWith("the last star")).t : Infinity;
const fAscE = F.events.find(e => e.label.startsWith("ascension"));
const fAsc  = fAscE ? fAscE.t : Infinity;
const polT  = ["food-first", "wood-first", "balanced"].map(p => runToMolt(CLICK_R, p));
const polSpread = Math.max(...polT) === Infinity ? Infinity : (Math.max(...polT) - Math.min(...polT)) / Math.min(...polT);
const brokeT = runBrokeProbe();

/* v2 metric: click share at the molt (run A) */
const clickShare = A.moltSnap ? A.moltSnap.clickShare : 1;

/* v2 metric: R90 — worst ring gap, 30s to the dark, the Wall window exempt (run A) */
function worstRingGap(s, from, to, exemptA, exemptB) {
  const ring = s.rings.filter(t => t >= from && t <= to).sort((a, b) => a - b);
  let worst = 0, at = 0, p = from;
  for (const t of ring.concat([to])) {
    const a = p, b = t;
    const overlapsWall = b > exemptA && a < exemptB;
    if (!overlapsWall && b - a > worst) { worst = b - a; at = b; }
    p = t;
  }
  return { worst, at };
}
const r90 = worstRingGap(A, 30, tDark === Infinity ? A.t : tDark, tHollow, tOffer);

/* v2 metric: decision density — min decisions in any 300s window (run A) */
function minWindow(times, from, to, win) {
  if (to - from < win) return Infinity;
  const ts = times.filter(t => t >= from && t <= to).sort((a, b) => a - b);
  let worst = Infinity;
  for (let w = from; w + win <= to; w += 10) {
    const n = ts.filter(t => t >= w && t < w + win).length;
    if (n < worst) worst = n;
  }
  return worst;
}
const ddPre  = minWindow(A.decisions, 30, tAscend === Infinity ? A.t : tAscend, V2.DD_WIN);
const ddPost = tDark === Infinity ? 0 : minWindow(A.decisions, tAscend, tDark, V2.DD_WIN);

/* v2 metric: field-event density (run A) */
function worstFieldGap(s, from, to) {
  const ev = s.fieldEv.filter(t => t >= from && t <= to).sort((a, b) => a - b);
  let worst = 0, p = from;
  for (const t of ev.concat([to])) { if (t - p > worst) worst = t - p; p = t; }
  return worst;
}
const fieldPre  = worstFieldGap(A, 0, tAscend === Infinity ? A.t : tAscend);
const fieldAct3 = tDark === Infinity ? Infinity : worstFieldGap(A, tAscend, tDark);

/* ---------- report ---------- */
const mm = t => (t === Infinity || t === undefined) ? "never" : Math.floor(t / 60) + ":" + String(Math.round(t % 60)).padStart(2, "0");
console.log("tithe pace-sim v2 — R " + CLICK_R + " c/s · F " + CLICK_F + " c/s · Z lets go at the turn\n");
for (const e of A.events) console.log("  " + mm(e.t).padStart(6) + "  " + e.label);
console.log("\n  surge: stone " + stoneRateFlat.toFixed(2) + "/s flat -> " + (stoneRateFlat * SURGE.x).toFixed(2) + "/s for " + SURGE.s + "s after the offering");
console.log("  refusal: 300s past the hollow without offering -> " + refusedNews.length + " new unlocks (the road is flat by design)");
console.log("  three priests: worst food rate " + (A.minFoodRate3p === Infinity ? "n/a" : A.minFoodRate3p.toFixed(2) + "/s") + " (the squeeze the appetite tuning watches)");
const ms = A.moltSnap || {};
console.log("  at the molt: favor " + Math.round(ms.favor) + " · totalFavor " + Math.round(ms.totalFavor) + " · food " + Math.round(ms.food) + " · legend " + (ms.legend || 0).toFixed(1));
console.log("  the race: " + A.signs + " sign" + (A.signs === 1 ? "" : "s") + " bought · gate 8 " + mm(A.tG8) + " · herd " + mm(A.tRb) + " · bank " + mm(A.tBank));
console.log("  the skies: " + skyLen.map(t => mm(t)).join(" / ") + " · souls at the end " + A.souls.toExponential(2));
console.log("  v2: click share " + (clickShare * 100).toFixed(0) + "% · overtake " + mm(A.tOvertake) +
  " · hand-beats-automation " + (A.handN ? Math.round(100 * A.handBad / A.handN) + "% of post-4:00 samples" : "n/a"));
console.log("  v2: Z (lets go at the turn) reaches the dark: " + mm(zDark) + " · F ascends " + mm(fAsc) + " (R " + mm(tAscend) + ")");
console.log("  v2: policy molts " + polT.map(mm).join(" / ") + " · spread " + (polSpread === Infinity ? "n/a" : Math.round(polSpread * 100) + "%"));
console.log("  v2: R90 worst ring gap " + Math.round(r90.worst) + "s ending " + mm(r90.at) +
  " · decisions/300s pre " + (ddPre === Infinity ? "n/a" : ddPre) + " post " + ddPost);
console.log("  v2: carrot invariant " + (A.carrotN ? Math.round(100 * (1 - A.carrotBad / A.carrotN)) + "% of samples hold" : "n/a") +
  " · field gaps pre " + Math.round(fieldPre) + "s act3 " + Math.round(fieldAct3) + "s");
console.log("  v2: broke-ascend first world " + (brokeT === Infinity ? "never" : Math.round(brokeT) + "s") + "\n");

let fail = 0, xpass = 0;
const check = (name, cond, detail) => {
  const expected = XFAIL[name];
  if (cond && expected) { console.log("XPASS " + name + "  (" + detail + ") — remove from the XFAIL ledger: " + expected); xpass++; }
  else if (cond)        { console.log("PASS  " + name + "  (" + detail + ")"); }
  else if (expected)    { console.log("XFAIL " + name + "  (" + detail + ") — " + expected); }
  else                  { console.log("FAIL  " + name + "  (" + detail + ")"); fail++; }
};

/* v1 — all still binding */
check("first villager < 60s",            tVillager < 60,  mm(tVillager));
check("first building < 45s",            tBuilding < 45,  mm(tBuilding));
check("no wall > 180s before the hollow", worstGap <= 180, Math.round(worstGap) + "s ending " + mm(worstAt));
check("first offering < 8min",           tOffer < 480,    mm(tOffer));
check("first miracle 1-4min after turn", tMiracle - tOffer >= 60 && tMiracle - tOffer <= 240, mm(tMiracle) + " (turn +" + Math.round(tMiracle - tOffer) + "s)");
check("the tithe teased < 12min total",  tTease < 720,    mm(tTease));
check("faith 4 by bot minute 9",         tFaith4 < 540,   mm(tFaith4));
check("the temple < 14min bot",          tTemple < 840,   mm(tTemple));
check("molt 2 at bot minute 10-13",      tTithe >= 600 && tTithe <= 780, mm(tTithe));
check("the wall is the only flat road",  refusedNews.length === 0, refusedNews.map(e => e.label).join(", ") || "nothing new without the offering");
check("ascension at bot minute 18-22",   tAscend >= 1080 && tAscend <= 1320, mm(tAscend));
check("three timers, staggered 30-90s",  tGaps.length === 2 && tGaps.every(g => g >= 30 && g <= 90),
  timers.map(mm).join(" / ") + (tGaps.length === 2 ? " · gaps " + tGaps.map(g => Math.round(g) + "s").join(", ") : " · a clock is missing"));
check("no flat stretch > 3min after the molt", postGap <= 180 && tAscend !== Infinity, Math.round(postGap) + "s ending " + mm(postAt));
check("sky 1 under 8 min",  skyLen[0] <= 480, mm(skyLen[0]));
check("sky 2 under 7 min",  skyLen[1] <= 420, mm(skyLen[1]));
check("sky 3 under 6 min",  skyLen[2] <= 360, mm(skyLen[2]));
check("each sky falls faster",            skyLen[0] > skyLen[1] && skyLen[1] > skyLen[2],
  skyLen.map(t => Math.round(t) + "s").join(" > "));
check("the full run 34-38 min",           tDark >= 2040 && tDark <= 2280, mm(tDark));
check("the last star ends it",            A.endState === 1 && A.heralds === 0,
  "souls frozen at " + A.souls.toExponential(2));

/* v2 — the machine's contract (DESIGN-V3 §6) */
check("v2 zero-click completion",         zDark !== Infinity, "Z reaches the dark at " + mm(zDark));
check("v2 click share <= 12%",            clickShare <= V2.CLICK_SHARE, Math.round(clickShare * 100) + "% of the worst currency at the molt");
check("v2 overtake by 4:30",              A.tOvertake <= V2.OVERTAKE_S && A.handBad === 0,
  "wood prod 8/s at " + mm(A.tOvertake) + " · hand beats automation in " + (A.handN ? Math.round(100 * A.handBad / A.handN) : 0) + "% of samples");
check("v2 policy spread within 20%",      polSpread <= V2.POLICY_SPREAD, polT.map(mm).join(" / "));
check("v2 R90 to the last star",          r90.worst <= V2.R90 && tDark !== Infinity, Math.round(r90.worst) + "s ending " + mm(r90.at));
check("v2 decision density",              ddPre >= V2.DD_PRE && ddPost >= V2.DD_POST,
  "min/300s: pre " + (ddPre === Infinity ? "n/a" : ddPre) + " (need " + V2.DD_PRE + ") · post " + ddPost + " (need " + V2.DD_POST + ")");
check("v2 carrot invariant",              A.carrotN > 0 && A.carrotBad === 0,
  Math.round(100 * (1 - A.carrotBad / Math.max(1, A.carrotN))) + "% of samples hold exactly one carrot");
check("v2 dial fairness",                 false, "the dial lands at V3-M3");
check("v2 broke-ascend probe",            brokeT <= V2.BROKE_S, brokeT === Infinity ? "never" : Math.round(brokeT) + "s to the first world");
check("v2 field-event density",           fieldPre <= V2.FIELD_PRE && fieldAct3 <= V2.FIELD_ACT3,
  "worst gaps: pre-ascension " + Math.round(fieldPre) + "s (need <=" + V2.FIELD_PRE + ") · act 3 " + Math.round(fieldAct3) + "s (need <=" + V2.FIELD_ACT3 + ")");

if (xpass) console.log("\n  " + xpass + " XPASS — a milestone landed; shrink the ledger.");
process.exit(fail ? 1 : 0);
