/* pace-sim — a pure-math bot plays tithe at a HUMAN 0.8 clicks/s, act 1 THROUGH act 2.
 * (the click rate is the law: if a benchmark needs grinding, the game is wrong, not the bot)
 *
 * SYNC WARNING: every constant below is a hand-mirror of index.html.
 * If you change UPKEEP / ARRIVE / ARRIVE_CD / SURGE / OFFER / RATS / job bases
 * / costs / mults in the game, change them HERE TOO or the sim lies.
 *
 * benchmarks (CLAUDE.md + DESIGN-V2 §10):
 *   first villager  < 60s
 *   first building  < 45s
 *   no stretch between events > 180s before the shrine is excavated
 *   first offering  < 480s (8 min)
 *   first miracle   1-4 min after the turn (earned, not instant)
 *   the tithe teased < 12 bot-min total (the second-session hook lands in one)
 *   faith 4 by bot minute 9 (the spine climbs while the bot answers)
 *   the temple < 14 bot-min (act 2's first big sink lands the same evening)
 *   molt 2 (the tithe) at bot minute 10-13 (the last bill the old economy pays)
 *   the hunger wall: after excavation, WITHOUT the offering nothing new
 *   ever unlocks — the sim measures how flat that road is.
 *   ascension at bot minute 18-22 (the race fits the evening)
 *   the final stretch holds three live timers (gate 8, the herd, the bank)
 *   staggered 30-90s apart, and no post-molt flat stretch > 3 min (law 8/20)
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

const CLICK_RATE = 0.8;   // clicks/s — a relaxed human; clickPower 1, x2 with tools
const DT = 0.25;          // sim step
const WANT_P = 3;         // priests the bot chases after the turn

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

/* ---------- sim ---------- */
function freshSim() {
  return {
    t: 0, food: 0, wood: 0, stone: 0, favor: 0,
    totalFood: 0, totalWood: 0, totalStone: 0, totalFavor: 0,
    pop: 0, jobs: { f: 0, w: 0, m: 0, p: 0, c: 0 },
    bld: { hut: 0, farm: 0, quarry: 0, sawpit: 0, granary: 0 },
    proj: {}, mir: {}, offerings: 0, surgeLeft: 0, arriveCd: 0, ratsSeen: false,
    deeper: 0, legend: 0, faithSeen: 0,
    doubt: 0, doubtT: 0, signs: 0, cong: 0,
    heralds: 0, heraldSeeds: 0, worlds: 0, worldProg: 0, souls: 0, galaxy: 0,
    slider: 0, silenceBorn: false, silenceT: 0, faint: 0, dimT: 0, vigil: false, hush: 0,
    endState: 0,
    minFoodRate3p: Infinity,
    events: [],
  };
}
const mark = (s, label) => s.events.push({ t: s.t, label });

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
  mark(s, "offering " + s.offerings + (s.offerings === 1 ? " — the turn" : ""));
}

function doDeeper(s) {
  /* the button's second life: rungs of 1, 2, 4, 8 — no surge, no yield, one point of faith */
  const n = Math.pow(2, s.deeper);
  s.pop -= n; s.deeper++; s.doubt++;
  s.offerings += n;
  s.arriveCd = Math.max(s.arriveCd, arriveCdS(s));
  mark(s, "a deeper offering — " + n);
}

/* the shared physics: clicks, gains, doubt, legend, mouths, arrivals */
function tickSim(s, click) {
  const cp = s.proj.tools ? 2 : 1;
  s[click] += CLICK_RATE * cp * DT;
  s["total" + click[0].toUpperCase() + click.slice(1)] += CLICK_RATE * cp * DT;
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
  if (s.surgeLeft > 0) s.surgeLeft -= DT;
  s.t += DT;
}

/* the race: one slider, one ladder, one bank (law 20) */
function stepRace(s) {
  /* the wallet crosses (§4): nobody ascends broke — the bot banks the first
     three seeds' favor on top of the bill, as a player staring at
     `a herald — 400 favor` would */
  if (faithOf(s) >= FAITH_MAX && s.favor >= PROJ.ascend.cost.favor + SEED_BANK) {
    s.favor -= PROJ.ascend.cost.favor; s.proj.ascend = true;
    s.pop = 0; s.doubt = 0;
    mark(s, "ascension — molt 3"); return;
  }
  /* worship's running cost: on the plateau ride the rung's one doubt-seed to
     three (the sign bought at the cap pumps the gate ladder); in the push, pay
     only when the silence is total */
  const wantSign = s.proj.calendar ? stalled(s) : (stalled(s) || s.doubt >= 3);
  if (wantSign && s.favor >= signCost(s)) {
    const c = signCost(s);
    s.favor -= c; s.signs++; s.doubt = 0; s.doubtT = 0;
    mark(s, "a sign — " + c + " favor");
  }
  else if (!s.proj.lights && s.favor >= PROJ.lights.cost.favor) {
    s.favor -= PROJ.lights.cost.favor; s.proj.lights = true; mark(s, "other lights — the race is seen");
  }
  else if (!s.proj.songs && s.legend >= PROJ.songs.cost.legend) {
    s.legend -= PROJ.songs.cost.legend; s.proj.songs = true; mark(s, "the songs");
  }
  else if (!s.proj.calendar && s.legend >= PROJ.calendar.cost.legend) {
    s.legend -= PROJ.calendar.cost.legend; s.proj.calendar = true; mark(s, "a calendar");
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
    if (s.heraldSeeds === 1) mark(s, "a herald — the first seed");
  } else if (!s.mir.tongues && s.heralds >= HERALD3.cap * 0.9 && s.favor >= MIR3.tongues) {
    s.favor -= MIR3.tongues; s.mir.tongues = true; mark(s, "tongues — every door opens from inside");
  } else if (s.silenceBorn && s.silenceT >= 90 && !hushOn(s) && s.faint < WORLDS_PER_SKY - s.worlds &&
             s.favor >= hushCostS(s) + vigilCostS(s) * 30) {
    s.favor -= hushCostS(s); s.hush = s.galaxy + 1; mark(s, "the hush — sky " + (s.galaxy + 1));
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
  s.slider = Math.min(0.7, vigilShare + (bill > 0 && s.favor < bill && s.worlds >= 2 ? 0.45 : 0));
  tickBoard(s);
}

/* bot goal: what to buy next, what to click toward it */
function step(s, allowOffer) {
  if (s.proj.tithe) { stepRace(s); return; }
  alloc(s);

  let click = "wood", buy = null;
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
  }
  else if (allowOffer) {
    /* act 2: the turn, then priests, miracles, more offerings */
    if (s.offerings === 0 && s.pop > 1) { doOffer(s); return; }
    if (s.offerings > 0) {
      if (!s.mir.goodyear && s.favor >= MIR.goodyear.cost) {
        s.favor -= MIR.goodyear.cost; s.mir.goodyear = true; mark(s, "miracle: a good year");
      } else if (s.mir.goodyear && !s.mir.obedience && s.favor >= MIR.obedience.cost) {
        s.favor -= MIR.obedience.cost; s.mir.obedience = true;
        mark(s, "miracle: obedience — the tithe teased"); return;
      } else if (s.mir.obedience && !s.proj.temple && faithOf(s) >= 4 && afford(s, PROJ.temple.cost)) {
        pay(s, PROJ.temple.cost); s.proj.temple = true; mark(s, "temple"); return;
      } else if (s.proj.temple && !s.proj.tithe && afford(s, PROJ.tithe.cost)) {
        pay(s, PROJ.tithe.cost); s.proj.tithe = true; mark(s, "the tithe — molt 2");
        s.moltSnap = { favor: s.favor, totalFavor: s.totalFavor, food: s.food, legend: s.legend };
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
      pay(s, c);
      if (kind === "bld") { s.bld[id]++; mark(s, id + " " + s.bld[id]); }
      else { s.proj[id] = true; mark(s, id === "rats" ? "rats kept" : id); }
      alloc(s);
    }
  }

  tickSim(s, click);
}

/* ---------- run A: the bot that answers ---------- */
const A = freshSim();
while (!A.proj.ascend && A.t < 1800) step(A, true);
/* act 3: the same bot keeps the same hands until the last star */
while (A.proj.ascend && !A.endState && A.t < 3600) stepBoard(A);

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
const B = freshSim();
while (!B.proj.shrineX && B.t < 1200) step(B, false);
const bStart = B.t, bEvents = B.events.length;
const stoneRateFlat = prodOf(B, "stone");
while (B.t < bStart + 300) step(B, false);
const refusedNews = B.events.slice(bEvents).filter(e => !/^(hut|farm|quarry|sawpit|villager|rats)/.test(e.label));

/* ---------- report ---------- */
const mm = t => (t === Infinity || t === undefined) ? "never" : Math.floor(t / 60) + ":" + String(Math.round(t % 60)).padStart(2, "0");
console.log("tithe pace-sim — bot at " + CLICK_RATE + " clicks/s\n");
for (const e of A.events) console.log("  " + mm(e.t).padStart(6) + "  " + e.label);
console.log("\n  surge: stone " + stoneRateFlat.toFixed(2) + "/s flat -> " + (stoneRateFlat * SURGE.x).toFixed(2) + "/s for " + SURGE.s + "s after the offering");
console.log("  refusal: " + Math.round(300) + "s past the hollow without offering -> " + refusedNews.length + " new unlocks (the road is flat by design)");
console.log("  three priests: worst food rate " + (A.minFoodRate3p === Infinity ? "n/a" : A.minFoodRate3p.toFixed(2) + "/s") + " (the squeeze the appetite tuning watches)");
const ms = A.moltSnap || {};
console.log("  at the molt: favor " + Math.round(ms.favor) + " · totalFavor " + Math.round(ms.totalFavor) + " · food " + Math.round(ms.food) + " · legend " + (ms.legend || 0).toFixed(1));
console.log("  the race: " + A.signs + " sign" + (A.signs === 1 ? "" : "s") + " bought · gate 8 " + mm(A.tG8) + " · herd " + mm(A.tRb) + " · bank " + mm(A.tBank));
console.log("  the skies: " + skyLen.map(t => mm(t)).join(" / ") + " · souls at the end " + A.souls.toExponential(2) + "\n");

let fail = 0;
const check = (name, cond, detail) => { console.log((cond ? "PASS  " : "FAIL  ") + name + "  (" + detail + ")"); if (!cond) fail++; };
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

process.exit(fail ? 1 : 0);
