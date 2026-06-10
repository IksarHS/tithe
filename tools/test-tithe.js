// headless playtest of index.html — boot, the village, jobs, the shrine,
// the offering, the turn, miracles, saves, offline, the field. run: npm test
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");

const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/canvas/i.test(String(e && e.message))) console.error(e); });
["error","warn","log","info"].forEach(k => vc.on(k, (...a) => console[k](...a)));

function boot(storage = {}, motion = false) {
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      const store = storage;
      Object.defineProperty(window, "localStorage", { value: {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
      }});
      window.matchMedia = () => ({ matches: !motion });
      window.confirm = () => true;
      window.prompt = () => null;
    }});
  return dom;
}

let failures = 0;
const ok = (cond, name) => { console.log((cond ? "PASS" : "FAIL") + "  " + name); if (!cond) failures++; };
const near = (a, b, eps = 0.05) => Math.abs(a - b) < eps;

/* ---------- boot: the screen contract ---------- */

const store = {};
const dom = boot(store);
const w = dom.window, d = w.document;
const G = w.__tithe;
const S = () => G.state;
function ff(s) { S().last = Date.now() - s * 1000; G.tick(); }

ok(!!d.getElementById("work") && !!d.getElementById("field"), "both regions exist at boot");
ok(d.getElementById("scene").tagName === "CANVAS", "the field is a poster canvas");
const css = d.querySelector("style").textContent.replace(/\s/g, "");
ok(/body{[^}]*overflow:hidden/.test(css), "one screen: body never scrolls");
ok(/#work{[^}]*overflow:hidden/.test(css), "one screen: the work region never scrolls");
ok(/\.hidden{display:none!important}/.test(css), "hidden always wins the cascade");
ok(!/\.gen\.ct{[^}]*--blood/.test(css), "owned counts are never blood — red waits for the turn");
ok(/button:disabled\.co,button:disabled\.ct{color:var\(--faint\)}/.test(css),
  "an unaffordable row dims as one unit");
ok(d.getElementById("sec-stores").classList.contains("hidden"), "stores hidden at boot");
ok(d.getElementById("sec-village").classList.contains("hidden"), "the village hidden at boot");
ok(d.getElementById("sec-proj").classList.contains("hidden"), "undertakings hidden at boot");
ok(d.getElementById("sec-shrine").classList.contains("hidden"), "the shrine hidden at boot");
ok(d.getElementById("sec-mir").classList.contains("hidden"), "miracles hidden at boot");
ok(d.getElementById("act-wood").classList.contains("ghost"), "cut wood reserves its slot as a ghost");
ok(["f","w","m","p"].every(j => d.getElementById("job-" + j).classList.contains("ghost")),
  "all four job rows reserve their slots as ghosts");

/* ---------- first verbs ---------- */

for (let i = 0; i < 3; i++) d.getElementById("act-berries").click();
ok(S().food === 3 && S().clicks === 3, "three berries gathered");
ok(!d.getElementById("sec-stores").classList.contains("hidden"), "stores revealed by the first gather");
ok(d.getElementById("foodVal").textContent === "3.0", "stores count decimals");
ok(d.getElementById("row-favor").classList.contains("hidden"), "favor does not exist yet");
ok(!d.getElementById("act-wood").classList.contains("ghost"), "cut wood appears at 3 food");

for (let i = 0; i < 6; i++) d.getElementById("act-wood").click();
ok(!d.getElementById("sec-proj").classList.contains("hidden"), "undertakings revealed at 6 wood");
const fireBtn = d.getElementById("proj-fire");
ok(!!fireBtn, "a fire is teased");
ok(fireBtn.disabled, "the fire is out of reach at 6 wood");
for (let i = 0; i < 4; i++) d.getElementById("act-wood").click();
ok(!fireBtn.disabled, "ten wood will light it");
fireBtn.click();
ok(S().proj.fire === true && S().wood === 0, "the fire takes all ten");
ok(fireBtn.querySelector(".co").textContent === "lit", "built once; the row reads lit");
let sc = G.villageScene();
ok(sc.builds.some(b => b.sprite === "fire" && b.col === G.ANCHORS.fire.col), "the fire burns at its anchor");
ok(sc.smoke.length === 3, "smoke stands over the fire");

/* ---------- shelter and the first villager ---------- */

ok(!d.getElementById("sec-bld").classList.contains("hidden"), "works revealed by the fire");
const hutBtn = d.getElementById("bld-hut");
ok(!!hutBtn && hutBtn.disabled, "a hut is teased, unaffordable");
S().wood = 12; ff(0.001);
hutBtn.click();
ok(S().bld.hut === 1 && G.cap() === 2, "a hut raises the cap to two");
sc = G.villageScene();
ok(sc.builds.some(b => b.sprite === "hut"), "the hut stands at its anchor");
ok(!d.getElementById("sec-village").classList.contains("hidden"), "the village panel wakes with the first hut");
ok(d.getElementById("popLine").textContent === "villagers 0 / 2 · idle 0 · next at 15 food",
  "the empty hut names its price");

S().food = 20; ff(0.2);
ok(S().pop === 1, "food draws the first villager");
ok(!d.getElementById("sec-village").classList.contains("hidden"), "the village panel stays awake");
ok(d.getElementById("popLine").textContent.indexOf("villagers 1 / 2") === 0, "the head count reads honest");
ok(!d.getElementById("job-f").classList.contains("ghost"), "forager slot is live");
ok(!d.getElementById("job-w").classList.contains("ghost"), "woodcutter slot is live");
ok(d.getElementById("job-m").classList.contains("ghost"), "mason waits for the quarry");
ok(d.getElementById("job-p").classList.contains("ghost"), "no priests yet");
sc = G.villageScene();
ok(sc.figures.length === 1 && sc.figures[0].job === "i", "one figure on the field, idle");

/* ---------- jobs and upkeep ---------- */

d.getElementById("jp-f").click();
ok(S().jobs.f === 1 && G.idle() === 0, "one forager allocated");
ok(d.getElementById("jp-w").disabled, "no idle hands left to allocate");
ok(near(G.rateOf("food"), 0.5 - 0.25), "forager nets against the mouths (+0.25/s)");
S().food = 10; ff(10);
ok(near(S().food, 12.5, 0.2), "ten seconds of work feed the stores");

d.getElementById("jm-f").click();
S().food = 0; ff(21);
ok(S().pop === 0, "an empty larder: one walks into the treeline");
ok(G.idle() === 0 && S().jobs.f === 0, "the jobs table follows the head count");
S().food = 30; ff(0.2);
ok(S().pop === 1, "food draws another; no one ever dies on screen");

/* ---------- the climb: farm, quarry, mason, tools ---------- */

S().food = 60; ff(0.2);
ok(S().pop === 1, "the road takes time: no second arrival inside the cooldown");
ff(20.2);
ok(S().pop === 2, "the second villager comes at a steeper price, and on foot");
ok(d.getElementById("popLine").textContent.indexOf("next at") === -1, "at cap, no one is promised");
const farmBtn = d.getElementById("bld-farm");
ok(!!farmBtn, "the farm is teased at two villagers");
S().wood = 25; ff(0.001); farmBtn.click();
ok(S().bld.farm === 1, "rows in the dirt");
d.getElementById("jp-f").click(); d.getElementById("jp-f").click();
ok(S().jobs.f === 2, "two foragers");
ok(near(G.rateOf("food"), 2 * 0.5 * 1.25 - 0.5), "the farm multiplies the foragers");

const quarryBtn = d.getElementById("bld-quarry");
ok(!!quarryBtn, "the quarry is teased after the farm");
S().wood = 60; ff(0.001); quarryBtn.click();
ok(S().bld.quarry === 1, "the hill opens");
ok(!d.getElementById("job-m").classList.contains("ghost"), "masons can work now");
d.getElementById("jm-f").click();
d.getElementById("jp-m").click();
ok(S().jobs.m === 1, "one mason at the face");
ff(10);
ok(S().stone > 3 && !d.getElementById("row-stone").classList.contains("hidden"), "stone piles up on its own line");
const toolsBtn = d.getElementById("proj-tools");
ok(!!toolsBtn, "stone tools teased once stone is real");
S().wood = 30; S().stone = 10; ff(0.001); toolsBtn.click();
ok(S().proj.tools === true, "flint edges");
ok(near(G.jobRate("m"), 0.25 * 1.25 * 1.5), "tools sharpen every trade");

/* ---------- the hollow ---------- */

sc = G.villageScene();
ok(!sc.builds.some(b => b.sprite === "hollow"), "no hollow before the stone is broken");
S().totalStone = 70; ff(0.001);
const exBtn = d.getElementById("proj-shrineX");
ok(!!exBtn, "the hollow is found at 70 stone");
ok(exBtn.disabled, "found, not yet affordable — the dark thing waits on the hill");
sc = G.villageScene();
ok(sc.builds.some(b => b.sprite === "hollow" && b.col === G.ANCHORS.hollow.col),
  "the hollow opens on the quarry hill — it was always there");
ok(d.getElementById("sec-shrine").classList.contains("hidden"), "the shrine keeps its silence until opened");
S().stone = 90; S().wood = 60; ff(0.001); exBtn.click();
ok(S().proj.shrineX === true, "the hollow is excavated");
ok(!d.getElementById("sec-shrine").classList.contains("hidden"), "the shrine panel wakes");
sc = G.villageScene();
ok(sc.builds.some(b => b.sprite === "shrine"), "the shrine stands where the hollow was");
ok(d.getElementById("shrineTease").textContent === "it was waiting.", "the tease is quiet");
ok(d.getElementById("surgeLine").textContent === "yield ×8 · 90s",
  "the deal is on the table before the first click");

/* ---------- the offering and the turn ---------- */

const name1 = G.nextName();
ok(d.getElementById("offer").textContent === "an offering — " + name1,
  "the cost line carries a name in calm type");
const popBefore = S().pop;
const stoneRatePre = G.rateOf("stone");
ok(d.getElementById("h-act").textContent === "actions", "before: actions");
ok(d.getElementById("act-berries").textContent === "gather berries", "before: the verbs are yours");
d.getElementById("offer").click();
ok(S().pop === popBefore - 1, "the offering takes one");
ok(S().offerings === 1 && near(S().favor, 5), "the first favor arrives");
ok(S().turn1 === true, "the turn has happened");
ok(near(G.rateOf("stone"), stoneRatePre * 8, stoneRatePre * 8 * 0.01 + 0.001), "everything runs at eight");
ok(d.getElementById("h-act").textContent === "answers", "actions were answers all along");
ok(d.getElementById("act-berries").textContent === "grant berries" &&
   d.getElementById("act-wood").textContent === "grant wood", "the verbs turn with you");
ok(d.getElementById("h-village").textContent === "the flock", "the village is the flock");
ok(d.getElementById("popLine").textContent.indexOf("stock ") === 0, "villagers are stock");
ok(d.getElementById("shrineTease").textContent === "they were never your hands.", "the beat lands, once, quietly");
ok(!d.getElementById("row-favor").classList.contains("hidden"), "favor on its own line");
ok(!d.getElementById("job-p").classList.contains("ghost"), "priests can be allocated");
ok(!d.getElementById("sec-mir").classList.contains("hidden"), "miracles open");
const name2 = G.nextName();
ok(name2 !== name1, "the next name is already on the button");
sc = G.villageScene();
ok(sc.flecks.length === 1, "the picture remembers: one fleck at the shrine");
ok(d.getElementById("h-shrine").classList.contains("blood"), "the red begins at the shrine");
ok(/^yield ×8 · \d+s$/.test(d.getElementById("surgeLine").textContent),
  "the clock runs in the same grammar as the deal");

S().food = 999; ff(1);
ok(S().pop === popBefore - 1, "no replacement walks in on the heels of an offering");
ff(20);
ok(S().pop === popBefore, "the gap walks itself closed only after the cooldown");

S().surgeLeft = 0; ff(0.001);
ok(near(G.rateOf("stone"), stoneRatePre, 0.01), "the hum fades; the rates settle");
ok(d.getElementById("surgeLine").textContent === "", "between deals, the line holds its tongue");

/* ---------- priests and miracles ---------- */

S().pop = 4; S().jobs = { f:1, w:0, m:1, p:0 }; ff(0.001);
d.getElementById("jp-p").click();
ok(S().jobs.p === 1, "one priest");
ok(near(G.jobRate("p"), 0.2), "worship flows at its own pace — no flint sharpens a prayer");
ok(near(G.upkeep(), (4 + 1) * 0.25), "priests eat double");

S().surgeLeft = 50; ff(0.001);
ok(near(G.jobRate("p"), 0.2), "the gift feeds the fields, never the shrine");
ok(near(G.jobRate("f"), 1 * 0.5 * 1.25 * 1.5 * 8), "the fields run at eight while the prayer keeps walking");
S().surgeLeft = 0; ff(0.001);

const gyBtn = d.getElementById("mir-goodyear");
ok(!!gyBtn, "a good year is offered");
S().favor = 60; ff(0.001); gyBtn.click();
ok(S().mir.goodyear === true, "the rain falls when asked");
ok(near(G.jobRate("f"), 1 * 0.5 * 1.25 * 1.5 * 2), "food doubled by the year");
const obBtn = d.getElementById("mir-obedience");
ok(!!obBtn, "obedience follows");
S().favor = 150; ff(0.001); obBtn.click();
ok(S().mir.obedience === true && near(G.jobRate("p"), 0.2 * 2), "worship doubled");
const titheBtn = d.getElementById("proj-tithe");
ok(!!titheBtn && titheBtn.disabled, "the tithe is teased, out of reach");
ok(titheBtn.querySelector(".co").textContent === "soon", "the tithe says only: soon");

/* ---------- the second offering ---------- */

const popB2 = S().pop;
d.getElementById("offer").click();
ok(S().pop === popB2 - 1 && S().offerings === 2, "the shrine takes another");
ok(near(S().favor, 7.5, 0.5), "the yield escalates (7.5)");
ok(d.getElementById("favorVal").classList.contains("blood"), "the red spreads to the favor count");
ok(d.getElementById("shrineTease").textContent === "", "the line about your hands has left");
sc = G.villageScene();
ok(sc.flecks.length === 2, "two flecks now; never mentioned");

/* ---------- tone law ---------- */

const toneClone = d.body.cloneNode(true);
for (const sEl of toneClone.querySelectorAll("script,style")) sEl.remove();
ok(toneClone.textContent.indexOf("!") === -1, "tone law: not one exclamation mark");
const flavors = [].concat(G.BLD, G.PROJ, G.MIR).map(x =>
  (typeof x.flavor === "function" ? x.flavor({ ratsIdx: 0 }) : x.flavor || "") + (x.name || ""));
ok(flavors.every(f => f === f.toLowerCase() && f.indexOf("!") === -1), "defs are lowercase and calm");

/* ---------- save / reload ---------- */

const offerLabel = d.getElementById("offer").textContent;
w.dispatchEvent(new w.Event("beforeunload"));
ok(!!store["tithe-save"], "save written on beforeunload");
{
  const w2 = boot(store).window, d2 = w2.document, G2 = w2.__tithe;
  const S2 = G2.state;
  ok(S2.pop === S().pop && S2.offerings === 2 && S2.turn1 === true, "reload: the flock, the count, the turn");
  ok(S2.bld.hut === 1 && S2.bld.farm === 1 && S2.bld.quarry === 1, "reload: the works stand");
  ok(S2.proj.fire && S2.proj.tools && S2.proj.shrineX, "reload: the undertakings hold");
  ok(S2.mir.goodyear && S2.mir.obedience, "reload: miracles persist");
  ok(d2.getElementById("h-act").textContent === "answers", "reload: the renames hold from the first frame");
  ok(d2.getElementById("offer").textContent === offerLabel, "reload: the same name waits on the button");
  const sc2 = G2.villageScene();
  ok(sc2.flecks.length === 2 && sc2.builds.some(b => b.sprite === "shrine"), "reload: the picture still remembers");
  ok(d2.getElementById("favorVal").classList.contains("blood"), "reload: the red does not wash off");
  ok(["hut","farm","quarry","sawpit"].every(id => !!d2.getElementById("bld-" + id)),
    "reload: every works row is rebuilt");
  ok(["fire","tools","shrineX","tithe"].every(id => !!d2.getElementById("proj-" + id)),
    "reload: every undertaking row is rebuilt");
  ok(!!d2.getElementById("mir-goodyear") && !!d2.getElementById("mir-obedience"),
    "reload: the miracle rows are rebuilt");
  ok(!d2.getElementById("sec-bld").classList.contains("hidden") &&
     !d2.getElementById("sec-proj").classList.contains("hidden") &&
     !d2.getElementById("sec-mir").classList.contains("hidden"),
    "reload: no panel forgets it was open");
  ok(!d2.getElementById("bld-hut").querySelector(".btn") ||
     !d2.getElementById("bld-hut").classList.contains("reveal"),
    "reload: rebuilt rows do not replay their reveal");
}

/* ---------- migration and corruption ---------- */

{
  const sv = JSON.parse(store["tithe-save"]);
  delete sv.mir; delete sv.offerings; delete sv.turn1; delete sv.walkPhase;
  const st2 = { "tithe-save": JSON.stringify(sv) };
  const G3 = boot(st2).window.__tithe;
  ok(G3.state.offerings === 0 && G3.state.turn1 === false && typeof G3.state.mir === "object",
    "a stripped save walks in with defaults");
  ok(G3.state.v === 2, "version restamped");
}
{
  const st3 = { "tithe-save": "{broken" };
  const G4 = boot(st3).window.__tithe;
  ok(G4.state.pop === 0 && G4.state.seed > 0, "a corrupted save falls back to a fresh field");
}

/* ---------- offline ---------- */

{
  const sv = JSON.parse(store["tithe-save"]);
  sv.jobs = { f:0, w:1, m:0, p:0 }; sv.pop = 1; sv.bld = { hut:1, farm:0, quarry:0, sawpit:0 };
  sv.proj = { fire:true }; sv.mir = {}; sv.surgeLeft = 0; sv.food = 1000; sv.wood = 0;
  sv.last = Date.now() - 2 * 3600 * 1000;
  const st4 = { "tithe-save": JSON.stringify(sv) };
  const w5 = boot(st4).window, G5 = w5.__tithe;
  G5.tick();
  ok(near(G5.state.wood, 0.35 * 3600, 3), "two hours away count one hour (the cap)");
  ok(near(G5.state.food, 1000 + (0 - 0.25) * 3600, 3), "the mouths kept eating while you were away");
}

/* ---------- the surge pays in seconds, not stamps ---------- */

{
  const stS = {};
  const GS = boot(stS).window.__tithe, SS = GS.state;
  SS.proj.fire = true; SS.bld.hut = 1; SS.bld.quarry = 1;
  SS.pop = 2; SS.jobs.m = 1; SS.food = 5;
  SS.surgeLeft = 2; SS.last = Date.now() - 10000;
  GS.tick();
  ok(near(SS.stone, 0.3125 * 24, 0.4), "the surge pays exactly its seconds, even across one big tick");
  ok(SS.surgeLeft === 0, "and not one second more");
}

/* ---------- a v1 save walks in with a wall-clock stamp ---------- */

{
  const sv = JSON.parse(store["tithe-save"]);
  delete sv.surgeLeft; sv.v = 1; sv.surgeUntil = sv.last + 30000;
  const stV = { "tithe-save": JSON.stringify(sv) };
  const GV = boot(stV).window.__tithe;
  ok(near(GV.state.surgeLeft, 30, 1.5), "a v1 stamp converts to seconds owed");
  ok(GV.state.v === 2, "and leaves restamped");
}

/* ---------- rats in the granary ---------- */

{
  const stG = {};
  const wG = boot(stG).window, dG = wG.document, GG = wG.__tithe, SG = GG.state;
  SG.proj.fire = true; SG.bld.hut = 1; SG.pop = 2; SG.jobs.f = 1;
  SG.food = 18; SG.totalFood = 119;
  SG.last = Date.now() - 100; GG.tick();
  ok(!dG.getElementById("proj-rats"), "the granary is quiet under 120 food");
  SG.totalFood = 121; SG.last = Date.now() - 100; GG.tick();
  const ratsBtn = dG.getElementById("proj-rats");
  ok(!!ratsBtn, "abundance draws them out");
  const watcher = GG.nameAt(SG.ratsIdx);
  ok(ratsBtn.nextElementSibling.textContent === watcher + " sits up with a stick.",
    "the crisis takes a name, not a number");
  ok(GG.nextName() !== watcher, "the watcher is spoken for; the shrine looks past them");
  ok(near(GG.rateOf("food"), 0.5 - 0.5 - 0.5), "the rats eat what the forager gathers");
  SG.wood = 15; SG.last = Date.now() - 100; GG.tick();
  ratsBtn.click();
  ok(SG.proj.rats === true, "fifteen wood buys a watcher");
  ok(ratsBtn.querySelector(".co").textContent === "kept", "the row reads kept");
  ok(near(GG.rateOf("food"), 0), "the larder settles");
  ok(ratsBtn.nextElementSibling.textContent === "", "the stick is put down");
}

/* ---------- the field: determinism and the actors law ---------- */

ok(JSON.stringify(G.genVillage(123)) === JSON.stringify(G.genVillage(123)), "the field is seed-deterministic");
ok(JSON.stringify(G.genVillage(123)) !== JSON.stringify(G.genVillage(124)), "a different seed, a different field");

{
  /* reduced motion (default boot): figures park at their sites */
  const stR = {};
  const wR = boot(stR).window, dR = wR.document, GR = wR.__tithe;
  GR.state.proj.fire = true; GR.state.bld.hut = 1; GR.state.pop = 1; GR.state.seen["village"] = 1;
  const a = GR.villageScene().figures[0];
  GR.state.walkPhase += 7;
  const b = GR.villageScene().figures[0];
  ok(a.col === b.col && a.row === b.row, "reduced motion: the figures hold still");
  ok(near(a.col, GR.SITES.i.col - 2, 0.01) && near(a.row, GR.SITES.i.row, 0.01),
    "reduced motion: parked at the site, not mid-stride");
}
{
  /* ambient motion: the walk advances with time */
  const stM = {};
  const wM = boot(stM, true).window, GM = wM.__tithe;
  GM.state.proj.fire = true; GM.state.bld.hut = 1; GM.state.pop = 2; GM.state.jobs.f = 1;
  const p0 = GM.state.walkPhase;
  GM.state.last = Date.now() - 2000; GM.tick();
  ok(GM.state.walkPhase > p0, "motion: the village walks");
  const f0 = GM.villageScene().figures.map(f => f.col.toFixed(2)).join(",");
  GM.state.last = Date.now() - 1500; GM.tick();
  const f1 = GM.villageScene().figures.map(f => f.col.toFixed(2)).join(",");
  ok(f0 !== f1, "motion: the figures are somewhere else now");
}
{
  /* the cap on the crowd */
  const stC = {};
  const GC = boot(stC).window.__tithe;
  GC.state.pop = 40; GC.state.bld.hut = 5;
  ok(GC.villageScene().figures.length === 24, "the field holds twenty-four figures at most");
}

/* ---------- the end ---------- */

console.log(failures === 0 ? "\nALL TESTS PASSED" : "\n" + failures + " FAILURES");
process.exit(failures ? 1 : 0);
