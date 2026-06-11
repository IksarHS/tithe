/* pace-sim — a pure-math bot plays tithe at a HUMAN 0.8 clicks/s, act 1 THROUGH act 2.
 * (the click rate is the law: if a benchmark needs grinding, the game is wrong, not the bot)
 *
 * SYNC WARNING: every constant below is a hand-mirror of index.html.
 * If you change UPKEEP / ARRIVE / ARRIVE_CD / SURGE / OFFER / RATS / job bases
 * / costs / mults in the game, change them HERE TOO or the sim lies.
 *
 * benchmarks (CLAUDE.md):
 *   first villager  < 60s
 *   first building  < 45s
 *   no stretch between events > 180s before the shrine is excavated
 *   first offering  < 480s (8 min)
 *   first miracle   1-4 min after the turn (earned, not instant)
 *   the tithe teased < 12 bot-min total (the second-session hook lands in one)
 *   faith 4 by bot minute 9 (the spine climbs while the bot answers)
 *   the temple < 14 bot-min (act 2's first big sink lands the same evening)
 *   the hunger wall: after excavation, WITHOUT the offering nothing new
 *   ever unlocks — the sim measures how flat that road is.
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
const FAITH_GATES = [25, 65, 130, 235, 405, 680, 1125, 1850];
const FAVOR_CAP_PER = 200;
const LEGEND_RATE = 0.3;

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
};
const MIR = {
  goodyear:  { cost: 60 },   /* arrivals at half the food (arriveAt x0.5) */
  obedience: { cost: 150 },  /* favor x2; teases the tithe */
  quickening:{ cost: 350 },  /* arrivals x2 again, road cd 20s -> 10s; needs faith 5 (bot skips it) */
};
const CULT_ARRIVE = 0.85;    /* per cultivator (jobs.c) — bot allocates none yet */

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
/* favor takes no surge, no flint — the gift feeds the fields, never the shrine */
const jobRate = (s, j) => {
  if (JOBS[j].out === "favor") return s.jobs[j] * JOBS[j].base * (s.mir.obedience ? 2 : 1) * (s.proj.temple ? 2 : 1);
  return s.jobs[j] * JOBS[j].base * bldJobMult(s, j) *
    (s.proj.tools ? PROJ.tools.allJobs : 1) *
    (s.surgeLeft > 0 ? SURGE.x : 1);
};
const prodOf = (s, cur) => Object.keys(JOBS).reduce((t, j) => t + (JOBS[j].out === cur ? jobRate(s, j) : 0), 0);
const upkeep = s => (s.pop + s.jobs.p * ((JOBS.p.eats || 1) - 1)) * UPKEEP;
const ratsDrain = s => (s.ratsSeen && !s.proj.rats) ? RATS.drain : 0;
const cap = s => s.bld.hut * CAP_HUT;
const arriveAt = s => ARRIVE.base * Math.pow(ARRIVE.rate, s.pop) * (s.mir.goodyear ? 0.5 : 1)
  * (s.mir.quickening ? 0.5 : 1) * Math.pow(CULT_ARRIVE, s.jobs.c);
const arriveCdS = s => ARRIVE_CD * (s.mir.quickening ? 0.5 : 1);
/* the spine — faith derived, favor capped, every grant through one door */
const faithOf = s => s.offerings === 0 ? 0 :
  Math.min(13, 1 + (s.deeper || 0) + FAITH_GATES.filter(g => s.totalFavor >= g).length);
const favorCap = s => FAVOR_CAP_PER * Math.max(1, faithOf(s));
const grantFavor = (s, y) => {
  const cp = favorCap(s);
  if (s.favor >= cp || y <= 0) return 0;
  if (y >= cp - s.favor) { y = cp - s.favor; s.favor = cp; } else { s.favor += y; }
  s.totalFavor += y; return y;
};

/* ---------- sim ---------- */
function freshSim() {
  return {
    t: 0, food: 0, wood: 0, stone: 0, favor: 0,
    totalFood: 0, totalWood: 0, totalStone: 0, totalFavor: 0,
    pop: 0, jobs: { f: 0, w: 0, m: 0, p: 0, c: 0 },
    bld: { hut: 0, farm: 0, quarry: 0, sawpit: 0, granary: 0 },
    proj: {}, mir: {}, offerings: 0, surgeLeft: 0, arriveCd: 0, ratsSeen: false,
    deeper: 0, legend: 0, faithSeen: 0,
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

/* bot goal: what to buy next, what to click toward it */
function step(s, allowOffer) {
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
      } else if (s.pop >= cap(s) && s.pop > 1) { doOffer(s); return; }
      /* the temple wants wood again — the axe comes back out of the shed */
      click = (s.mir.obedience && !s.proj.temple && s.wood < PROJ.temple.cost.wood) ? "wood" : "food";
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

  /* tick */
  const cp = s.proj.tools ? 2 : 1;
  s[click] += CLICK_RATE * cp * DT;
  s["total" + click[0].toUpperCase() + click.slice(1)] += CLICK_RATE * cp * DT;
  for (const cur of ["food", "wood", "stone", "favor"]) {
    const p = prodOf(s, cur);
    if (p > 0) {
      if (cur === "favor") { grantFavor(s, p * DT); continue; }
      s[cur] += p * DT;
      s["total" + cur[0].toUpperCase() + cur.slice(1)] += p * DT;
    }
  }
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
  if (s.jobs.p >= WANT_P) {
    const fr = prodOf(s, "food") - upkeep(s) - ratsDrain(s);
    if (fr < s.minFoodRate3p) s.minFoodRate3p = fr;
  }
  if (s.surgeLeft > 0) s.surgeLeft -= DT;
  s.t += DT;
}

/* ---------- run A: the bot that answers ---------- */
const A = freshSim();
while (!A.proj.temple && A.t < 1800) step(A, true);

const at = label => { const e = A.events.find(e => e.label === label || e.label.startsWith(label)); return e ? e.t : Infinity; };
const tVillager = at("villager 1");
const tBuilding = at("hut 1");
const tHollow   = at("shrineX");
const tOffer    = at("offering 1");
const tMiracle  = at("miracle: a good year");
const tTease    = at("miracle: obedience");
const tFaith4   = at("faith 4");
const tTemple   = at("temple");

/* gaps between events up to the excavation */
const pre = A.events.filter(e => e.t <= tHollow);
let worstGap = 0, worstAt = 0, prev = 0;
for (const e of pre) { if (e.t - prev > worstGap) { worstGap = e.t - prev; worstAt = e.t; } prev = e.t; }

/* ---------- run B: the bot that refuses (from the excavation) ---------- */
const B = freshSim();
while (!B.proj.shrineX && B.t < 1200) step(B, false);
const bStart = B.t, bEvents = B.events.length;
const stoneRateFlat = prodOf(B, "stone");
while (B.t < bStart + 300) step(B, false);
const refusedNews = B.events.slice(bEvents).filter(e => !/^(hut|farm|quarry|sawpit|villager|rats)/.test(e.label));

/* ---------- report ---------- */
const mm = t => t === Infinity ? "never" : Math.floor(t / 60) + ":" + String(Math.round(t % 60)).padStart(2, "0");
console.log("tithe pace-sim — bot at " + CLICK_RATE + " clicks/s\n");
for (const e of A.events) console.log("  " + mm(e.t).padStart(6) + "  " + e.label);
console.log("\n  surge: stone " + stoneRateFlat.toFixed(2) + "/s flat -> " + (stoneRateFlat * SURGE.x).toFixed(2) + "/s for " + SURGE.s + "s after the offering");
console.log("  refusal: " + Math.round(300) + "s past the hollow without offering -> " + refusedNews.length + " new unlocks (the road is flat by design)");
console.log("  three priests: worst food rate " + (A.minFoodRate3p === Infinity ? "n/a" : A.minFoodRate3p.toFixed(2) + "/s") + " (the squeeze the appetite tuning watches)\n");

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
check("the wall is the only flat road",  refusedNews.length === 0, refusedNews.map(e => e.label).join(", ") || "nothing new without the offering");

process.exit(fail ? 1 : 0);
