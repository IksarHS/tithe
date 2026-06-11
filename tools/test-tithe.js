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
ok(hutBtn.nextElementSibling.textContent === "room for 2", "the one-time tease gives way to the rate");
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
ok(S().pop === 2, "food over the bar: the second villager simply comes");
ok(d.getElementById("popLine").textContent.indexOf("next at") === -1, "at cap, no one is promised");
const farmBtn = d.getElementById("bld-farm");
ok(!!farmBtn, "the farm is teased at two villagers");
S().wood = 25; ff(0.001); farmBtn.click();
ok(S().bld.farm === 1, "rows in the dirt");
ok(farmBtn.nextElementSibling.textContent === "foragers ×1.25", "the farm states its work");
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
ok(toolsBtn.nextElementSibling.textContent === "hands ×1.5", "flint states its work");
{
  const fBefore = S().food;
  d.getElementById("act-berries").click();
  ok(near(S().food, fBefore + 2), "flint fits the hand: one click grants two");
}

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
ok(d.getElementById("h-shrine").textContent === "the hollow", "the panel does not yet know its name");
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
ok(d.getElementById("h-shrine").textContent === "the shrine", "the first offering buys the word");
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
ok(d.getElementById("shrineTease").textContent === "", "the sentence lives exactly as long as the gift");
ok(d.getElementById("surgeLine").textContent === "next · 7 favor", "between deals, the shrine quotes the next price");

/* ---------- priests and miracles ---------- */

S().bld.hut = 2;  /* room first: the clamp law holds even in tests */
S().pop = 4; S().jobs = { f:1, w:0, m:1, p:0, c:0 }; ff(0.001);
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
const barBefore = G.arriveAt();
S().favor = 60; ff(0.001); gyBtn.click();
ok(S().mir.goodyear === true, "the rain falls when asked");
ok(near(G.arriveAt(), barBefore * 0.5), "a good year halves the bar for the next arrival");
ok(near(G.jobRate("f"), 1 * 0.5 * 1.25 * 1.5), "the fields keep their own pace — the year draws people, not yield");
ok(gyBtn.nextElementSibling.textContent === "arrivals ×2", "the miracle states its work");
const obBtn = d.getElementById("mir-obedience");
ok(!!obBtn, "obedience follows");
S().favor = 150; ff(0.001); obBtn.click();
ok(S().mir.obedience === true && near(G.jobRate("p"), 0.2 * 2), "worship doubled");
const titheBtn = d.getElementById("proj-tithe");
ok(!!titheBtn && titheBtn.disabled, "the tithe is teased, out of reach");
ok(titheBtn.querySelector(".co").textContent === "250 favor + 60 food + 80 wood + 30 stone",
  "the tithe names its bill — four currencies at once");

/* ---------- the second offering ---------- */

const popB2 = S().pop;
d.getElementById("offer").click();
ok(S().pop === popB2 - 1 && S().offerings === 2, "the shrine takes another");
ok(near(S().favor, 7.5, 0.5), "the yield escalates (7.5)");
ok(d.getElementById("favorVal").classList.contains("blood"), "the red spreads to the favor count");
ok(d.getElementById("shrineTease").textContent === "", "the line about your hands has left");
sc = G.villageScene();
ok(sc.flecks.length === 2, "two flecks now; never mentioned");

/* ---------- the shrine takes only from a full village ---------- */

S().food = 1; S().pop = 1; ff(0.001);
ok(d.getElementById("offer").disabled, "below a full village, the shrine waits");
{
  const popG = S().pop;
  d.getElementById("offer").click();
  ok(S().pop === popG && S().offerings === 2, "and clicking changes nothing");
}
S().pop = G.cap(); ff(0.001);
ok(!d.getElementById("offer").disabled, "a full village relights the button");
S().pop = 3; S().food = 999; ff(0.001);

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
  ok(S2.bld.hut === 2 && S2.bld.farm === 1 && S2.bld.quarry === 1, "reload: the works stand");
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
  ok(G3.state.v === 7, "version restamped");
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
  ok(GV.state.v === 7, "and leaves restamped");
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
  SG.wood = 60; SG.last = Date.now() - 100; GG.tick();
  ratsBtn.click();
  ok(SG.proj.rats === true, "sixty wood buys a watcher — a real price against the next work");
  ok(ratsBtn.querySelector(".co").textContent === "kept", "the row reads kept");
  ok(near(GG.rateOf("food"), 0), "the larder settles");
  ok(ratsBtn.nextElementSibling.textContent === "", "the stick is put down");
}

/* ---------- the works are finite: the ledger may not outgrow the picture ---------- */

{
  const stX = {};
  const wX = boot(stX).window, dX = wX.document, GX = wX.__tithe, SX = GX.state;
  SX.proj.fire = true; SX.bld.hut = 5; SX.wood = 9999;
  SX.last = Date.now() - 100; GX.tick();
  const hb = dX.getElementById("bld-hut");
  ok(hb.disabled, "five huts: the row goes quiet");
  ok(hb.querySelector(".co").textContent === "", "no sixth price is quoted");
  ok(hb.nextElementSibling.textContent === "room for 10", "the rate line holds the total");
  hb.click();
  ok(SX.bld.hut === 5, "clicking buys nothing past the anchors");
  ok(GX.villageScene().builds.filter(b => b.sprite === "hut").length === 5, "and the field shows all five");
}

/* ---------- a v2 ledger with thirteen huts meets the picture ---------- */

{
  const sv = JSON.parse(store["tithe-save"]);
  sv.v = 2; sv.bld = { hut: 13, farm: 7, quarry: 3, sawpit: 2 };
  sv.pop = 22; sv.jobs = { f: 10, w: 6, m: 4, p: 2 };
  const stB = { "tithe-save": JSON.stringify(sv) };
  const GB = boot(stB).window.__tithe;
  ok(GB.state.bld.hut === 5 && GB.state.bld.farm === 3 &&
     GB.state.bld.quarry === 1 && GB.state.bld.sawpit === 1,
    "the works fold back to their anchors");
  ok(GB.state.pop === 10, "the flock fits the huts");
  const JB = GB.state.jobs;
  ok(JB.f + JB.w + JB.m + JB.p <= GB.state.pop, "the jobs table follows the head count");
  ok(GB.state.v === 7, "restamped v7");
}

/* ---------- the spine: faith is born at the turn ---------- */

{
  const stF = {};
  const wF = boot(stF).window, dF = wF.document, GF = wF.__tithe, SF = GF.state;
  ok(dF.getElementById("row-legend").classList.contains("ghost"), "legend reserves its slot as a ghost");
  ok(dF.getElementById("faithLine").classList.contains("ghost"), "the faith line waits unseen");
  ok(GF.faithOf() === 0, "before the turn there is no faith");
  SF.proj.fire = true; SF.proj.shrineX = true; SF.bld.hut = 1;
  SF.pop = 2; SF.food = 999;
  SF.last = Date.now() - 1; GF.tick();
  dF.getElementById("offer").click();
  ok(SF.turn1 === true && GF.faithOf() === 1, "faith is born at 1 — one of them believed first");
  ok(dF.getElementById("faithLine").textContent === "faith 1", "the line states it plainly");
  ok(!dF.getElementById("faithLine").classList.contains("ghost"), "and steps out of its ghost");
  ok(dF.getElementById("row-legend").classList.contains("ghost"), "legend waits — at the turn there is no story yet");
  SF.totalFavor = 25;
  ok(GF.faithOf() === 2, "the first gate opens at 25");
  SF.totalFavor = 2900;
  ok(GF.faithOf() === 9, "all eight gates: faith 9");
  SF.deeper = 4;
  ok(GF.faithOf() === 13, "four deeper offerings reach the ceiling");
  SF.deeper = 9;
  ok(GF.faithOf() === 13, "and the ceiling holds");
}

/* ---------- the cap and the legend: the god must sit still ---------- */

{
  const stL = {};
  const GL = boot(stL).window.__tithe, SL = GL.state;
  SL.turn1 = true; SL.favor = 195;
  const got = GL.grantFavor(10);
  ok(SL.favor === 200, "favor meets its cap exactly — no drift at the rim");
  ok(got === 5 && SL.totalFavor === 5, "only what fits is counted");
  ok(GL.grantFavor(50) === 0 && SL.totalFavor === 5, "at the cap, grants add nothing — the gates freeze with the stillness");
  SL.last = Date.now() - 10000; GL.tick();
  ok(near(SL.legend, 3, 0.1), "ten still seconds: three legend");
  SL.favor = 100;
  const lgB = SL.legend;
  SL.last = Date.now() - 10000; GL.tick();
  ok(SL.legend === lgB, "spent favor: the story stops");
}
{
  const stL2 = {};
  const wL2 = boot(stL2).window, dL2 = wL2.document, GL2 = wL2.__tithe, SL2 = GL2.state;
  SL2.turn1 = true; SL2.favor = 200;
  SL2.last = Date.now() - 5000; GL2.tick();
  ok(!dL2.getElementById("row-legend").classList.contains("ghost"), "the first legend wakes its row");
  ok(dL2.getElementById("legendRate").textContent !== "", "at the cap, the rate is quoted");
  SL2.favor = 50;
  SL2.last = Date.now() - 100; GL2.tick();
  ok(dL2.getElementById("legendRate").textContent === "", "below it, the line goes quiet");
}

/* ---------- the priests fit the faith ---------- */

{
  const stP = {};
  const wP = boot(stP).window, dP = wP.document, GP = wP.__tithe, SP = GP.state;
  SP.turn1 = true; SP.proj.fire = true; SP.bld.hut = 3; SP.pop = 5; SP.food = 999;
  SP.last = Date.now() - 1; GP.tick();
  dP.getElementById("jp-p").click();
  ok(SP.jobs.p === 1, "one priest at faith 1");
  dP.getElementById("jp-p").click();
  ok(SP.jobs.p === 1, "a second is not taken");
  ok(dP.getElementById("jp-p").disabled, "the row says so without words");
  SP.totalFavor = 25; GP.render();
  ok(!dP.getElementById("jp-p").disabled, "faith 2 makes room");
  dP.getElementById("jp-p").click();
  ok(SP.jobs.p === 2, "and a second kneels");
}

/* ---------- a v3 ledger meets the cap ---------- */

{
  const sv = JSON.parse(store["tithe-save"]);
  sv.v = 3; sv.turn1 = true; sv.totalFavor = 30;
  sv.favor = 999; sv.bld = { hut: 3, farm: 1, quarry: 1, sawpit: 0 };
  sv.pop = 6; sv.jobs = { f: 1, w: 0, m: 1, p: 5 };
  const stM = { "tithe-save": JSON.stringify(sv) };
  const GM = boot(stM).window.__tithe;
  ok(GM.state.favor === 400, "favor folds back under the cap (faith 2)");
  ok(GM.state.jobs.p === 2, "the priests fit the faith");
  ok(GM.state.v === 7 && GM.state.universes === 1, "restamped v7; one universe, as always");
}

/* ---------- the cultivator: arrivals, not the larder ---------- */

{
  const stC2 = {};
  const wC2 = boot(stC2).window, dC2 = wC2.document, GC2 = wC2.__tithe, SC2 = GC2.state;
  ok(dC2.getElementById("job-c").classList.contains("ghost"), "the cultivator slot waits as a ghost");
  SC2.proj.fire = true; SC2.bld.hut = 2; SC2.pop = 4; SC2.food = 999;  /* at cap: no arrival mid-test */
  SC2.turn1 = true; SC2.mir.goodyear = true;
  SC2.last = Date.now() - 1; GC2.tick();
  ok(!dC2.getElementById("job-c").classList.contains("ghost"), "a good year wakes the cultivators");
  const barB = GC2.arriveAt();
  dC2.getElementById("jp-c").click();
  ok(SC2.jobs.c === 1, "one cultivator in the rows");
  ok(near(GC2.arriveAt(), barB * 0.85, barB * 0.01), "the bar comes down by fifteen parts");
  dC2.getElementById("jp-c").click();
  ok(near(GC2.arriveAt(), barB * 0.85 * 0.85, barB * 0.01), "and they compound");
  ok(GC2.prodOf("food") === 0, "the cultivator tends arrivals, not the larder");
  ok(near(GC2.upkeep(), 4 * 0.25), "and eats like anyone");
  SC2.jobs = { f:0, w:0, m:0, p:0, c:1 };
  const figC = GC2.villageScene().figures[0];
  ok(figC.job === "c" && near(figC.row, GC2.SITES.c.row, 0.01), "the cultivator walks to the farms");
}

/* ---------- the granary: the night holds eight hours ---------- */

{
  const stG2 = {};
  const wG2 = boot(stG2).window, dG2 = wG2.document, GG2 = wG2.__tithe, SG2 = GG2.state;
  SG2.proj.fire = true; SG2.bld.hut = 1; SG2.pop = 1; SG2.food = 50;
  ok(GG2.capS() === 3600, "before the granary, one hour is all the night keeps");
  SG2.turn1 = true;
  SG2.last = Date.now() - 1; GG2.tick();
  const gBtn = dG2.getElementById("bld-granary");
  ok(!!gBtn, "the turn teases the granary");
  ok(gBtn.disabled, "eighty wood and forty stone — not yet");
  SG2.wood = 80; SG2.stone = 40; SG2.last = Date.now() - 1; GG2.tick();
  gBtn.click();
  ok(SG2.bld.granary === 1 && SG2.wood === 0 && SG2.stone === 0, "the granary takes its price");
  ok(GG2.capS() === 8 * 3600, "the night holds eight hours now");
  ok(gBtn.nextElementSibling.textContent === "away · 8 h", "the granary states its work");
  ok(gBtn.disabled && gBtn.querySelector(".co").textContent === "", "one granary; no second is quoted");
  ok(GG2.villageScene().builds.some(b => b.sprite === "granary" && b.col === GG2.ANCHORS.granary.col),
    "it stands in the meadow's last open run");
}
{
  /* ten hours away count eight — the granary's word is kept offline */
  const sv = {
    v: 4, turn1: true, pop: 1, food: 8000, wood: 0,
    jobs: { f:0, w:1, m:0, p:0, c:0 }, bld: { hut:1, farm:0, quarry:0, sawpit:0, granary:1 },
    proj: { fire: true }, mir: {}, surgeLeft: 0,
    last: Date.now() - 10 * 3600 * 1000,
  };
  const st8 = { "tithe-save": JSON.stringify(sv) };
  const G8 = boot(st8).window.__tithe;
  G8.tick();
  ok(near(G8.state.wood, 0.35 * 8 * 3600, 3), "ten hours away count eight");
}

/* ---------- the temple: the hollow learns its name ---------- */

{
  const stT = {};
  const wT = boot(stT).window, dT = wT.document, GT = wT.__tithe, ST = GT.state;
  ST.proj.fire = true; ST.proj.shrineX = true; ST.bld.hut = 2; ST.pop = 4;
  ST.turn1 = true; ST.offerings = 1; ST.food = 999;
  ST.last = Date.now() - 1; GT.tick();
  ok(!dT.getElementById("proj-temple"), "the temple keeps quiet below faith 4");
  ST.totalFavor = 130;
  ST.last = Date.now() - 1; GT.tick();
  const tBtn = dT.getElementById("proj-temple");
  ok(!!tBtn, "faith 4: the temple is teased");
  ok(GT.villageScene().builds.some(b => b.sprite === "shrine"), "the shrine still stands meanwhile");
  ST.jobs.p = 1;
  ok(near(GT.jobRate("p"), 0.2), "worship before: one prayer's pace");
  ST.stone = 120; ST.wood = 80; ST.favor = 150;
  ST.last = Date.now() - 1; GT.tick();
  tBtn.click();
  ok(ST.proj.temple === true && ST.stone === 0 && ST.wood === 0 && near(ST.favor, 0, 0.01),
    "stone, wood and favor — the temple takes all three");
  ok(near(GT.jobRate("p"), 0.4), "worship doubled under the roof");
  ok(tBtn.querySelector(".co").textContent === "raised", "the row reads raised");
  const scT = GT.villageScene();
  ok(scT.builds.some(b => b.sprite === "temple" && b.col === GT.ANCHORS.hollow.col),
    "the temple grows at the shrine's own anchor");
  ok(!scT.builds.some(b => b.sprite === "shrine" || b.sprite === "hollow"),
    "one anchor, one life at a time");
  ok(scT.flecks.length === 1, "the flecks are not washed by the raising");
}

/* ---------- the quickening: the cradles answer ---------- */

{
  const stQ = {};
  const wQ = boot(stQ).window, dQ = wQ.document, GQ = wQ.__tithe, SQ = GQ.state;
  SQ.proj.fire = true; SQ.proj.shrineX = true; SQ.bld.hut = 2; SQ.pop = 4; SQ.food = 999;
  SQ.turn1 = true; SQ.offerings = 1; SQ.mir.goodyear = true; SQ.mir.obedience = true;
  SQ.totalFavor = 130;
  SQ.last = Date.now() - 1; GQ.tick();
  ok(!dQ.getElementById("mir-quickening"), "below faith 5, the cradles keep their own counsel");
  ok(GQ.arriveCdS() === 20, "the road takes its twenty seconds");
  SQ.totalFavor = 235;
  SQ.last = Date.now() - 1; GQ.tick();
  const qBtn = dQ.getElementById("mir-quickening");
  ok(!!qBtn, "faith 5: the quickening is offered");
  SQ.favor = 350; SQ.last = Date.now() - 1; GQ.tick();
  qBtn.click();
  ok(SQ.mir.quickening === true && SQ.favor === 0, "three hundred fifty favor, paid");
  ok(near(GQ.arriveAt(), 15 * Math.pow(1.3, 4) * 0.5 * 0.5, 0.05),
    "the bar halves on top of the year — the bottleneck moves to food");
  ok(GQ.arriveCdS() === 10, "and the road shortens to ten");
}

/* ---------- molt 2: the tithe — the last bill the old economy ever pays ---------- */

{
  const stD = {};
  const wD = boot(stD).window, dD = wD.document, GD = wD.__tithe, SD = GD.state;
  const tk = () => { SD.last = Date.now() - 1; GD.tick(); };
  /* a village on the eve: act 1 done, the temple raised, the bill affordable */
  SD.proj.fire = true; SD.proj.tools = true; SD.proj.rats = true; SD.proj.shrineX = true;
  SD.proj.temple = true;
  SD.mir.goodyear = true; SD.mir.obedience = true;
  SD.bld.hut = 4; SD.bld.farm = 3; SD.bld.quarry = 1; SD.bld.sawpit = 1; SD.bld.granary = 1;
  SD.pop = 8; SD.jobs = { f:3, w:1, m:1, p:2, c:1 };
  SD.turn1 = true; SD.offerings = 7; SD.nameIdx = 8; SD.totalFavor = 405;
  SD.totalFood = 130; SD.totalWood = 100; SD.totalStone = 100;
  SD.favor = 250; SD.food = 200; SD.wood = 80; SD.stone = 30;
  tk();
  const billBtn = dD.getElementById("proj-tithe");
  ok(!!billBtn && !billBtn.disabled, "the bill can be paid");
  ok(dD.getElementById("sliderRow").classList.contains("ghost"), "the slider waits unseen");
  ok(dD.getElementById("earlyWorks").classList.contains("hidden"), "the summary line waits unseen");
  ok(!dD.getElementById("jm-f").disabled, "the hands are still yours");
  ok(dD.getElementById("bld-hut").querySelector(".co").textContent === "35 wood",
    "a fifth hut still has a price");

  billBtn.click();
  /* one render, the whole molt */
  ok(SD.proj.tithe === true && near(SD.favor, 0, 0.01) && near(SD.food, 140, 0.01)
    && near(SD.wood, 0, 0.01) && near(SD.stone, 0, 0.01),
    "audited in four currencies at once");
  ok(billBtn.querySelector(".co").textContent === "standing", "the row reads standing");
  ok(dD.getElementById("row-wood").classList.contains("ghost")
    && dD.getElementById("row-stone").classList.contains("ghost"),
    "wood and stone leave the ledger; the slots keep their shape");
  ok(dD.getElementById("woodVal").textContent === "" && dD.getElementById("stoneRate").textContent === "",
    "never mentioned again");
  ok(["f","w","m","p","c"].every(j =>
    dD.getElementById("jp-"+j).disabled && dD.getElementById("jm-"+j).disabled),
    "every plus and minus dies on the same frame");
  ok(!dD.getElementById("sliderRow").classList.contains("ghost"), "the slider steps out of its ghost");
  ok(!dD.getElementById("earlyWorks").classList.contains("hidden"), "the early works fold into one line");
  ok(["fire","tools","rats","shrineX"].every(id =>
    dD.getElementById("proj-"+id).parentElement.classList.contains("hidden")),
    "the act-1 rows are folded away");
  ok(!dD.getElementById("proj-temple").parentElement.classList.contains("hidden"),
    "the temple stays on the books");
  ok(dD.getElementById("bld-hut").querySelector(".co").textContent === ""
    && dD.getElementById("bld-hut").disabled,
    "the works freeze: counts remain, costs vanish");
  ok(dD.getElementById("offer").textContent === "a deeper offering — 1",
    "the button transmutes in place: a number where the name was");
  ok(dD.getElementById("surgeLine").classList.contains("hidden"), "the surge line retires");
  ok(dD.getElementById("act-wood").classList.contains("ghost"), "the wood verb dies with its row");
  {
    const wood0 = SD.wood;
    dD.getElementById("act-wood").click();
    ok(SD.wood === wood0, "and clicking it grants nothing");
  }

  /* the rows are readouts now: one slider decides */
  ok(SD.jobs.f === 3 && SD.jobs.w === 0 && SD.jobs.m === 0 && SD.jobs.p === 4 && SD.jobs.c === 1,
    "the slider takes the rows: feed first, tend the rest, the shrine keeps four");
  ok(dD.getElementById("jn-f").textContent === "3", "the readout reports what the slider decides");
  ok(dD.getElementById("popLine").textContent.indexOf("congregation") >= 0,
    "the flock line counts the congregation");
  ok(GD.buyBld(GD.BLD.find(b => b.id === "hut")) === undefined && SD.bld.hut === 4,
    "nothing more is built by hand");

  /* lean toward the shrine: priests to the faith cap, the rest at half a voice */
  dD.getElementById("slider").value = "88";
  dD.getElementById("slider").dispatchEvent(new wD.Event("input"));
  ok(near(SD.slider, 0.88, 0.001) && SD.jobs.f === 1 && SD.jobs.p === 6 && SD.jobs.c === 0,
    "the slider leans and the rows follow");
  ok(near(GD.congRate(), 1 * 0.2 * 0.5 * 2 * 2, 0.001), "one kneels outside the priesthood, at half a voice");
  ok(near(GD.prodOf("favor"), 6 * 0.2 * 2 * 2 + 0.4, 0.001), "the tithe flows on its own");
  ok(GD.villageScene().figures.some(f => f.job === "g"), "the congregation walks to the shrine");

  /* the ladder: rungs of 1, 2, 4, 8 — each one point of faith */
  const offerD = dD.getElementById("offer");
  offerD.click();
  ok(SD.pop === 7 && SD.deeper === 1 && SD.offerings === 8, "the first rung takes one");
  ok(GD.faithOf() === 7, "and faith climbs by one");
  ok(SD.arriveCd >= 19, "the gap must still be seen");
  tk();
  ok(offerD.textContent === "a deeper offering — 2" && offerD.disabled,
    "the next rung doubles, and waits on a full village");
  SD.pop = 8; SD.arriveCd = 0; tk();
  ok(!offerD.disabled, "the herd rebuilt, the rung opens");
  offerD.click();
  ok(SD.pop === 6 && SD.deeper === 2 && GD.faithOf() === 8, "the second rung takes two");
  SD.pop = 8; SD.arriveCd = 0; tk(); offerD.click();
  ok(SD.pop === 4 && SD.deeper === 3 && GD.faithOf() === 9, "the third rung takes four");
  SD.pop = 8; SD.arriveCd = 0; tk(); offerD.click();
  ok(SD.pop === 0 && SD.deeper === 4 && GD.faithOf() === 10, "the eighth-rung guts the village");
  ok(SD.offerings === 7 + 1 + 2 + 4 + 8, "the picture remembers each of them");
  ok(GD.villageScene().flecks.length === 22, "twenty-two flecks; never mentioned");
  tk();
  ok(offerD.textContent === "a deeper offering — 8" && offerD.disabled, "the ladder ends at four rungs");
  SD.pop = 8; tk();
  { const dp = SD.deeper; offerD.click();
    ok(SD.deeper === dp && SD.pop === 8, "no fifth rung is ever taken"); }
  ok(dD.getElementById("faithLine").textContent === "faith 10", "the line states it plainly");

  /* the molt survives a reload */
  wD.dispatchEvent(new wD.Event("beforeunload"));
  const wD2 = boot(stD).window, dD2 = wD2.document;
  ok(!dD2.getElementById("sliderRow").classList.contains("ghost"), "reload: the slider holds its place");
  ok(!dD2.getElementById("earlyWorks").classList.contains("hidden"), "reload: the early works stay folded");
  ok(dD2.getElementById("row-wood").classList.contains("ghost"), "reload: wood does not come back");
  ok(dD2.getElementById("offer").textContent === "a deeper offering — 8", "reload: the ladder remembers its rung");
}

/* ---------- molt 2: the old ledgers never open again ---------- */

{
  const stE = {};
  const wE = boot(stE).window, dE = wE.document, GE = wE.__tithe, SE = GE.state;
  SE.proj.fire = true; SE.proj.shrineX = true; SE.proj.tithe = true;
  SE.mir.goodyear = true; SE.mir.obedience = true;
  SE.bld.hut = 2; SE.pop = 4; SE.turn1 = true; SE.offerings = 7;
  SE.totalFavor = 130; SE.totalWood = 100; SE.totalStone = 100; SE.totalFood = 50;
  SE.wood = 999; SE.stone = 999; SE.favor = 200; SE.food = 200;
  SE.last = Date.now() - 1; GE.tick();
  const tBtn = dE.getElementById("proj-temple");
  ok(!!tBtn && tBtn.disabled, "a stash without a ledger buys nothing");
  GE.buyProj(GE.PROJ.find(p => p.id === "temple"));
  ok(!SE.proj.temple, "the tithe was wood and stone's last bill");
}

/* ---------- doubt, the sign, the aside ---------- */

{
  const stH = {};
  const wH = boot(stH, true).window, dH = wH.document, GH = wH.__tithe, SH = GH.state;
  /* a settled post-molt village: hut 4 (cap 8), pop 8, faith 6, slider at rest */
  SH.proj.fire = true; SH.proj.tools = true; SH.proj.rats = true; SH.proj.shrineX = true;
  SH.proj.temple = true; SH.proj.tithe = true;
  SH.mir.goodyear = true; SH.mir.obedience = true;
  SH.bld.hut = 4; SH.bld.farm = 3; SH.bld.quarry = 1; SH.bld.sawpit = 1; SH.bld.granary = 1;
  SH.pop = 8; SH.turn1 = true; SH.offerings = 7; SH.nameIdx = 8; SH.totalFavor = 405;
  SH.totalFood = 130; SH.totalWood = 100; SH.totalStone = 100;
  SH.favor = 600; SH.food = 200;
  const tk = () => { SH.last = Date.now() - 1; GH.tick(); };
  tk();

  ok(SH.doubt === 0 && !SH.aside && !dH.getElementById("mir-sign"),
    "doubt waits for the first rung");

  dH.getElementById("offer").click();
  ok(SH.doubt === 1 && SH.deeper === 1, "the first rung breeds the first doubt");
  tk();
  const signBtn = dH.getElementById("mir-sign");
  ok(!!signBtn, "a sign appears when the first one turns away");
  ok(signBtn.querySelector(".co").textContent === "220 favor", "and names its price");

  /* the field: parked at the treeline, facing away, never walking */
  const dbt = GH.villageScene().figures.filter(f => f.job === "d");
  ok(dbt.length === 1, "one stands at the treeline");
  ok(near(dbt[0].col, 10, 0.01) && near(dbt[0].row, 10.2, 0.01) && dbt[0].away === true,
    "parked at the trees, facing away");
  SH.walkPhase += 7;
  const dbt2 = GH.villageScene().figures.filter(f => f.job === "d")[0];
  ok(dbt2.col === dbt[0].col && dbt2.row === dbt[0].row, "and never walks, motion or not");

  /* below half the stock, doubt is only a tax */
  ok(SH.jobs.f === 2 && SH.jobs.p === 3 && GH.deriveJobs().d === 1,
    "a doubter neither works nor worships");
  ok(GH.prodOf("favor") > 0, "below half the stock, doubt is only a tax");

  /* the threshold, exactly: pop 7 turns at four; pop 8 turns at four too */
  SH.doubt = 3; GH.applyTithe();
  ok(!GH.stalled() && GH.prodOf("favor") > 0, "three of seven: the tithe still flows");
  SH.doubt = 4; GH.applyTithe(); GH.render();
  ok(GH.stalled() && GH.prodOf("favor") === 0 && GH.congRate() === 0,
    "four of seven crosses half the stock: the tithe halts entirely");
  ok(dH.getElementById("favorRate").textContent === "+0.00/s",
    "the readout reads zero, not nothing");
  SH.pop = 8; SH.doubt = 4; GH.applyTithe();
  ok(GH.stalled(), "four of eight: half exactly is the threshold");
  SH.doubt = 3; GH.applyTithe();
  ok(!GH.stalled(), "three of eight is only a tax");

  /* heresy compounds: one more every ninety seconds, while any remain */
  SH.doubtT = 0;
  const fav0 = SH.favor, rate0 = GH.prodOf("favor");
  SH.last = Date.now() - 90 * 1000; GH.tick();
  ok(SH.doubt === 4, "ninety seconds of doubt: one more");
  ok(near(SH.favor, fav0 + rate0 * 90, 0.5), "favor flowed right up to the stall");
  const fav1 = SH.favor;
  SH.last = Date.now() - 90 * 1000; GH.tick();
  ok(SH.doubt === 5 && near(SH.favor, fav1, 0.01), "stalled: another doubt, not another favor");
  const dd = GH.villageScene().figures.filter(f => f.job === "d");
  ok(dd.length === 5 && new Set(dd.map(f => f.row.toFixed(2))).size === 5,
    "five at the trees, each in their own place");

  /* the crossing is exact even across one long tick */
  SH.doubt = 1; SH.doubtT = 0; SH.favor = 100; GH.applyTithe();
  const fav2 = SH.favor, rate2 = GH.prodOf("favor");
  SH.last = Date.now() - 400 * 1000; GH.tick();
  ok(SH.doubt === 5 && near(SH.favor, fav2 + rate2 * 270, 1),
    "favor flows only until the stall lands, even across one long tick");

  /* a sign: bought mid-stall, cures all of it, costs half again next time */
  GH.render();
  ok(!signBtn.disabled, "the sign can be bought mid-stall");
  const favB = SH.favor;
  signBtn.click();
  ok(SH.doubt === 0 && SH.doubtT === 0 && SH.signs === 1, "they remember why they kneel");
  ok(near(SH.favor, favB - 220, 0.01), "two hundred twenty, paid in favor");
  ok(GH.prodOf("favor") > 0, "and the tithe resumes");
  ok(signBtn.querySelector(".co").textContent === "330 favor", "the next sign costs half again");
  ok(signBtn.parentElement.querySelector(".tease").textContent === "", "the tease spends itself");
  SH.favor = 500; GH.render();
  signBtn.click();
  ok(SH.signs === 2 && signBtn.querySelector(".co").textContent === "495 favor", "and half again");

  /* the one aside: fired by the crossing, sixty seconds, never again */
  tk();
  ok(!SH.aside && dH.getElementById("shrineTease").textContent === "",
    "no aside while the fields outweigh the shrine");
  dH.getElementById("slider").value = "88";
  dH.getElementById("slider").dispatchEvent(new wH.Event("input"));
  tk();
  ok(SH.aside === true && SH.asideLeft > 59,
    "the shrine outweighs the fields: the aside arrives");
  ok(dH.getElementById("shrineTease").textContent === "they do not count themselves.",
    "and says the only thing it ever says");
  SH.last = Date.now() - 30 * 1000; GH.tick();
  ok(dH.getElementById("shrineTease").textContent === GH.ASIDE.text, "half a minute in, still speaking");
  SH.last = Date.now() - 31 * 1000; GH.tick();
  ok(SH.asideLeft === 0 && dH.getElementById("shrineTease").textContent === "", "sixty seconds, no more");
  SH.last = Date.now() - 5 * 1000; GH.tick();
  ok(SH.aside === true && dH.getElementById("shrineTease").textContent === "",
    "the condition holds; the aside does not return");

  /* reload: the signs, the spent aside, the row at zero doubt */
  wH.dispatchEvent(new wH.Event("beforeunload"));
  const wH2 = boot(stH).window, dH2 = wH2.document, GH2 = wH2.__tithe;
  ok(GH2.state.signs === 2 && GH2.state.aside === true, "reload: the signs and the aside are remembered");
  ok(!!dH2.getElementById("mir-sign"), "reload: the sign keeps its row at zero doubt");
  ok(dH2.getElementById("mir-sign").querySelector(".co").textContent === "495 favor",
    "reload: the ladder holds its rung");
  ok(dH2.getElementById("shrineTease").textContent === "", "reload: the aside stays spent");

  /* an old save learns the new fields */
  const mg = GH.migrate({ v:4, turn1:true, pop:4, bld:{hut:2}, deeper:2 });
  ok(mg.signs === 0 && mg.aside === false && mg.doubt === 0 && mg.v === 7,
    "an old save learns the new fields at their defaults");
}

/* ---------- the race: other lights, the ladder's ceiling, the door ---------- */

{
  const stR = {};
  const wR = boot(stR).window, dR = wR.document, GR = wR.__tithe, SR = GR.state;
  /* the same settled post-molt village the doubt block keeps */
  SR.proj.fire = true; SR.proj.tools = true; SR.proj.rats = true; SR.proj.shrineX = true;
  SR.proj.temple = true; SR.proj.tithe = true;
  SR.mir.goodyear = true; SR.mir.obedience = true;
  SR.bld.hut = 4; SR.bld.farm = 3; SR.bld.quarry = 1; SR.bld.sawpit = 1; SR.bld.granary = 1;
  SR.pop = 8; SR.turn1 = true; SR.offerings = 7; SR.nameIdx = 8; SR.totalFavor = 405;
  SR.totalFood = 130; SR.totalWood = 100; SR.totalStone = 100;
  SR.favor = 600; SR.food = 200;
  const tk = () => { SR.last = Date.now() - 1; GR.tick(); };
  tk();

  /* other lights: six offerings in, the scouts return */
  const liteBtn = dR.getElementById("proj-lights");
  ok(!!liteBtn && liteBtn.querySelector(".co").textContent === "90 favor",
    "the scouts come back quiet, for ninety favor");
  ok(dR.getElementById("faithLine").textContent === "faith 6",
    "before the lights, faith has no ceiling");
  ok(!dR.getElementById("proj-songs"), "no legend yet, no songs");
  ok(!dR.getElementById("proj-ascend"), "the door waits on the lights");

  liteBtn.click();
  ok(SR.proj.lights === true && near(SR.favor, 510, 0.01), "the lights are seen");
  ok(dR.getElementById("faithLine").textContent === "faith 6 / 13",
    "the ceiling is shown long before it is reachable");

  /* the standing threat: visible, priced in three terms, refused */
  const ascBtn = dR.getElementById("proj-ascend");
  ok(!!ascBtn, "the door appears the moment the race is seen");
  ok(ascBtn.querySelector(".co").textContent === "13 faith + the flock + 2,000 favor",
    "it states its price in three terms");
  ok(ascBtn.disabled, "and stays out of reach for most of the act");
  ok(ascBtn.parentElement.querySelector(".tease").textContent ===
    "begin again. the village will not remember. you will.", "the tease says what it costs to win");

  /* the songs: legend's first purchase, worship half again */
  SR.legend = 25; tk();
  const songBtn = dR.getElementById("proj-songs");
  ok(!!songBtn && songBtn.querySelector(".co").textContent === "20 legend",
    "the songs are paid in story");
  const r0 = GR.prodOf("favor");
  songBtn.click();
  ok(SR.proj.songs === true && near(SR.legend, 5, 0.01), "twenty legend, sung");
  ok(near(GR.prodOf("favor"), r0 * 1.5, 0.001), "they sing and the tithe grows half again");
  ok(songBtn.querySelector(".co").textContent === "sung"
    && songBtn.parentElement.querySelector(".tease").textContent === "favor ×1.5",
    "the flavor gives way to the rate");

  /* a calendar: the days get names, the road runs faster */
  const calBtn = dR.getElementById("proj-calendar");
  ok(!!calBtn, "the calendar follows the songs");
  const a0 = GR.arriveAt();
  SR.legend = 50; tk();
  calBtn.click();
  ok(SR.proj.calendar === true && near(GR.arriveAt(), a0 * 0.8, 0.01),
    "named days bring them sooner");
  ok(calBtn.parentElement.querySelector(".tease").textContent === "arrivals ×1.25",
    "and the line owns the arithmetic");

  /* the count: the bank stops rounding when it matters most */
  const cntBtn = dR.getElementById("proj-count");
  ok(!!cntBtn, "the count follows the calendar");
  SR.favor = 1150; tk();
  ok(dR.getElementById("favorVal").textContent !== "1150.0",
    "above a thousand the bank rounds");
  SR.legend = 95; tk();
  cntBtn.click();
  ok(SR.proj.count === true && dR.getElementById("favorVal").textContent === "1150.0",
    "counted: every head, every hand, every tenth");
  ok(cntBtn.parentElement.querySelector(".tease").textContent === "to the tenth",
    "precision as dread");

  /* the door audits every wallet: rich, and still refused */
  SR.deeper = 3; SR.totalFavor = 2900; SR.favor = 2400; SR.pop = 8; tk();
  ok(GR.faithOf() === 12 && dR.getElementById("faithLine").textContent === "faith 12 / 13",
    "all eight gates and three rungs: one short");
  ok(ascBtn.disabled, "two thousand in hand buys nothing at faith twelve");
  GR.buyProj(GR.PROJ.find(p => p.id === "ascend"));
  ok(!SR.proj.ascend && near(SR.favor, 2400, 0.01), "the door audits every wallet");

  /* the thirteenth point is a key */
  SR.deeper = 4; SR.doubt = 2; tk();
  ok(GR.faithOf() === 13 && !ascBtn.disabled, "thirteen: the door unlocks");
  ascBtn.click();
  ok(SR.proj.ascend === true && near(SR.favor, 400, 0.01), "two thousand favor, spent");
  ok(SR.pop === 0 && SR.doubt === 0 && SR.doubtT === 0, "the flock is spent, not exchanged");
  ok(["f","w","m","p","c"].every(j => SR.jobs[j] === 0), "no hands remain at any post");
  ok(ascBtn.querySelector(".co").textContent === "begun", "the row reads begun");
  ok(dR.getElementById("faithLine").textContent === "faith 13 / 13",
    "faith dies complete");

  /* after ascension no road leads here anymore */
  SR.food = 999; SR.arriveCd = 0; tk(); tk();
  ok(SR.pop === 0, "no road leads here anymore");

  /* the race survives a reload */
  wR.dispatchEvent(new wR.Event("beforeunload"));
  const wR2 = boot(stR).window, dR2 = wR2.document, GR2 = wR2.__tithe;
  ok(GR2.state.proj.ascend === true && GR2.state.pop === 0, "reload: the village stays spent");
  ok(dR2.getElementById("proj-ascend").querySelector(".co").textContent === "begun",
    "reload: the door stays open behind you");
  ok(dR2.getElementById("faithLine").textContent === "faith 13 / 13",
    "reload: the ceiling holds its mark");
  ok(dR2.getElementById("proj-count").querySelector(".co").textContent === "counted",
    "reload: the count keeps counting");
}

/* ---------- molt 3: the board wakes where the village was ---------- */

{
  const stA = {};
  const wA = boot(stA).window, dA = wA.document, GA = wA.__tithe, SA = GA.state;
  /* the village the race left behind, one frame after the door */
  SA.proj.fire = true; SA.proj.tools = true; SA.proj.rats = true; SA.proj.shrineX = true;
  SA.proj.temple = true; SA.proj.tithe = true; SA.proj.songs = true; SA.proj.calendar = true;
  SA.proj.lights = true; SA.proj.ascend = true;
  SA.mir.goodyear = true; SA.mir.obedience = true;
  SA.bld.hut = 5; SA.bld.farm = 3; SA.bld.quarry = 1; SA.bld.sawpit = 1; SA.bld.granary = 1;
  SA.turn1 = true; SA.offerings = 21; SA.nameIdx = 22; SA.deeper = 4;
  SA.totalFavor = 3000; SA.totalFood = 6000; SA.totalWood = 400; SA.totalStone = 300;
  SA.pop = 2; SA.jobs = { f:0, w:0, m:0, p:0, c:0 };
  SA.favor = 500; SA.food = 6000; SA.legend = 12; SA.slider = 0.5; SA.tithedLine = 60;
  const tk = s => { SA.last = Date.now() - (s ? s * 1000 : 1); GA.tick(); };
  tk();            /* reveals fire while two stragglers stand */
  SA.pop = 0; tk(); /* then the village is empty, as the door left it */

  /* the frame (§4): every piece in its place and the meaning changed */
  ok(dA.getElementById("popLine").textContent === "the first village: tithed",
    "the population line is an epitaph");
  ok(dA.getElementById("foodVal").textContent === "" &&
     dA.getElementById("row-food").classList.contains("ghost"),
    "the larder leaves the ledger the way wood did");
  ok(!dA.getElementById("row-souls").classList.contains("ghost") &&
     dA.getElementById("soulsVal").textContent === "0",
    "the souls row wakes from its boot-long ghost");
  ok(dA.getElementById("sendL").textContent === "spread" &&
     dA.getElementById("sendR").textContent === "reap",
    "the same dial, new ends");
  ok(["f","w","m","p","c"].every(j => dA.getElementById("job-" + j).classList.contains("ghost")),
    "the jobs rows blank; the slots hold");
  ok(["hut","farm","quarry","sawpit","granary"].every(id =>
     dA.getElementById("bld-" + id).parentElement.classList.contains("ghost")),
    "the works go dark");
  const herBtn = dA.getElementById("bld-herald");
  ok(!!herBtn && herBtn.querySelector(".nm").textContent === "a herald" &&
     herBtn.querySelector(".co").textContent === "400 favor",
    "one new tenant in the works list");
  ok(herBtn.parentElement.querySelector(".tease").textContent === "it walks until it is heard.",
    "and it says the one thing it ever says");
  ok(!dA.getElementById("bld-recall"), "no recall before the first seed");
  ok(!dA.getElementById("congWorks").classList.contains("hidden") &&
     dA.getElementById("congWorks").textContent === "the congregation — done",
    "the congregation folds to one line");
  ok(["temple","tithe","songs","calendar","count","lights","ascend"].every(id =>
     dA.getElementById("proj-" + id).parentElement.classList.contains("hidden")),
    "the act-2 rows are folded away");
  ok(["goodyear","obedience","quickening"].every(id =>
     dA.getElementById("mir-" + id).parentElement.classList.contains("ghost")),
    "the miracles blank; the slots wait");
  ok(dA.getElementById("act-berries").classList.contains("ghost"),
    "the first verb is gone");
  const fd0 = SA.food;
  dA.getElementById("act-berries").click();
  ok(SA.food === fd0, "and clicking where it was grants nothing");

  /* the field (§4): dark, still, and always the board */
  let scA = GA.villageScene();
  ok(scA.dark === true, "the field knows the village is over");
  ok(scA.builds.some(b => b.sprite === "ember") && !scA.builds.some(b => b.sprite === "fire"),
    "the fire is out; the hearth remains");
  ok(scA.builds.some(b => b.sprite === "temple"), "the temple alone keeps its post");
  ok(scA.smoke.length === 0, "the smoke stops");
  ok(scA.figures.length === 0, "the figures are gone");
  ok(scA.flecks.length === 21, "the flecks remain — the picture still remembers");
  SA.arriveCd = 10;
  ok(GA.villageScene().walker === null, "no walker, ever again: no road leads here");
  SA.arriveCd = 0;
  ok(Array.isArray(scA.stars) && scA.stars.length === 14 &&
     scA.stars.every(st => st.state === "lit"),
    "fourteen stars, drawn since first boot, now lit to take");

  /* the stamp expires; the board reads out */
  tk(61);
  ok(dA.getElementById("popLine").textContent === "worlds 0 / 14 · souls 0",
    "sixty seconds, then the ledger of lights");

  /* a herald: four hundred favor, then the ladder */
  herBtn.click();
  ok(near(SA.favor, 100, 0.01) && SA.heralds === 1 && SA.heraldSeeds === 1 && SA.heraldSpent === 400,
    "the first seed is bought");
  ok(herBtn.querySelector(".co").textContent === "500 favor", "the next costs a quarter again");
  ok(herBtn.parentElement.querySelector(".tease").textContent === "",
    "the flavor spends itself on the first seed");
  const recBtn = dA.getElementById("bld-recall");
  ok(!!recBtn && recBtn.querySelector(".co").textContent === "400 favor",
    "recall appears, reading exactly what came in");
  ok(GA.villageScene().figures.some(f => f.job === "h" && f.row === 5.6),
    "one red figure on the ridgeline");

  /* spread converts and replicates (§7.1, §7.2) */
  SA.slider = 0;  /* full spread */
  tk(10);
  ok(near(SA.heralds, 1.2, 0.01), "it walks until it is heard: heralds replicate");
  ok(near(SA.worldProg, 12, 0.1) && SA.worlds === 0, "twelve herald-seconds toward the first world");
  tk(30);
  ok(SA.worlds === 1 && SA.souls === 1e6, "the first world is tithed: a million souls");
  ok(near(SA.heralds, 1.92, 0.01) && near(SA.worldProg, 29.6, 0.2),
    "the spill carries into the second world");
  scA = GA.villageScene();
  ok(scA.stars[0].state === "red" && scA.stars.filter(st => st.state === "red").length === 1,
    "the first star turns the only red the game owns");
  ok(dA.getElementById("popLine").textContent === "worlds 1 / 14 · souls 1m",
    "the flock line counts worlds now");
  ok(dA.getElementById("soulsVal").textContent === "1m", "a million, spelled small");
  SA.proj.count = true; GA.render();
  ok(dA.getElementById("soulsVal").textContent === "1.0m", "the count keeps its tenth even here");

  /* reap pays favor; the cap and the legend died with the flock */
  SA.slider = 1;  /* full reap */
  const f1 = SA.favor, t1 = SA.totalFavor, l1 = SA.legend;
  tk(10);
  ok(near(SA.favor, f1 + 8, 0.05) && near(SA.totalFavor, t1 + 8, 0.05),
    "one world pays eight favor in ten seconds");
  ok(near(SA.heralds, 1.92, 0.01) && near(SA.worldProg, 29.6, 0.2),
    "at full reap the board holds its breath");
  SA.favor = 5000;  /* far past the old cap */
  tk(10);
  ok(near(SA.favor, 5008, 0.05), "the cap died with the flock that set it");
  ok(SA.legend === l1, "legend never accrues again");
  ok(dA.getElementById("legendRate").textContent === "", "its rate line stays empty");
  ok(dA.getElementById("favorRate").textContent === "+0.80/s", "the reap reads on the favor line");

  /* recall: 100% of the seed cost, any time (law 14) */
  SA.favor = 1000;
  herBtn.click();
  ok(SA.heraldSeeds === 2 && SA.heraldSpent === 900 && near(SA.favor, 500, 0.01),
    "a second seed at five hundred");
  ok(herBtn.querySelector(".ct").textContent === "2", "the count floors the fraction");
  const t2 = SA.totalFavor;
  recBtn.click();
  ok(near(SA.favor, 1400, 0.01) && SA.heralds === 0 && SA.heraldSeeds === 0 && SA.heraldSpent === 0,
    "every seed favor comes home; the heralds do not");
  ok(SA.totalFavor === t2, "returned, not granted: the total never moves");
  ok(herBtn.querySelector(".co").textContent === "400 favor" && herBtn.querySelector(".ct").textContent === "",
    "the ladder resets to its first rung");
  ok(recBtn.disabled && recBtn.querySelector(".co").textContent === "",
    "recall goes quiet with nothing out");

  /* the cap is a fibonacci square: 144, and the cost text empties */
  SA.worlds = 14;  /* a full sky holds the board still */
  SA.heralds = 143.5; SA.heraldSeeds = 5; SA.heraldSpent = 2000; SA.slider = 0;
  tk(10);
  ok(SA.heralds === 144, "one hundred forty-four, and not one more");
  ok(herBtn.querySelector(".nm").textContent === "heralds" &&
     herBtn.querySelector(".ct").textContent === "144" &&
     herBtn.querySelector(".co").textContent === "" && herBtn.disabled,
    "the row reads heralds 144 and the cost text empties");
  ok(GA.villageScene().figures.filter(f => f.job === "h").length === 7,
    "never more than seven on the ridgeline");

  /* the last world of the sky; the board stops at fourteen */
  SA.worlds = 13; SA.worldProg = 0; SA.souls = 0; SA.heralds = 10;
  SA.heraldSeeds = 3; SA.heraldSpent = 1525;
  tk(1802);
  ok(SA.worlds === 14 && SA.souls === 1594323e6, "the fourteenth world: the sky total lands");
  ok(GA.fmt(SA.souls) === "1.6t", "spelled in trillions, quietly");
  const s14 = SA.souls;
  tk(10);
  ok(SA.worlds === 14 && SA.souls === s14, "a full sky converts nothing more");
  ok(dA.getElementById("popLine").textContent === "worlds 14 / 14 · souls 1.6t",
    "the line reads a finished sky");

  /* reload: the board survives the night */
  SA.heralds = 12.7;
  wA.dispatchEvent(new wA.Event("beforeunload"));
  const wA2 = boot(stA).window, dA2 = wA2.document, GA2 = wA2.__tithe;
  ok(GA2.state.worlds === 14 && GA2.state.souls === s14 && near(GA2.state.heralds, 12.7, 0.01),
    "reload: worlds, souls, heralds all kept");
  ok(dA2.getElementById("bld-herald").querySelector(".co").textContent === "782 favor",
    "reload: the ladder holds its third rung");
  ok(dA2.getElementById("bld-recall").querySelector(".co").textContent === "1.5k favor",
    "reload: recall still reads the way home");
  ok(dA2.getElementById("sendL").textContent === "spread" &&
     dA2.getElementById("popLine").textContent === "worlds 14 / 14 · souls 1.6t",
    "reload: the board is still the board");
  ok(!dA2.getElementById("row-souls").classList.contains("ghost"),
    "reload: the souls row stays awake");

  /* an old save learns the board's fields */
  const mgA = GA.migrate({ v:5, turn1:true, pop:4, bld:{hut:2} });
  ok(mgA.heraldSeeds === 0 && mgA.worldProg === 0 && mgA.tithedLine === 0 && mgA.v === 7,
    "a v5 save learns the board at its defaults");

  /* the spelled suffixes (§7.1) */
  ok(GA.fmt(1e9) === "1b" && GA.fmt(2.4e12) === "2.4t" &&
     GA.fmt(2.4e15) === "2.4qa" && GA.fmt(3.1e18) === "3.1qi",
    "fmt climbs to the quintillion");
  ok(GA.fmt(1500, true) === "1.5k" && GA.fmt(1000, true) === "1.0k" && GA.fmt(5, true) === "5.0",
    "and the count keeps the tenth at every rung");
}

/* ---------- before the molt, the board does not exist ---------- */

{
  const stP = {};
  const GP = boot(stP).window.__tithe, dP = boot(stP).window.document;
  ok(GP.villageScene().stars === null, "no board before ascension");
  GP.buyHerald();
  ok(GP.state.heralds === 0, "no herald walks before the door opens");
  ok(!dP.getElementById("bld-herald"), "the works list does not know the word yet");
  ok(dP.getElementById("row-souls").classList.contains("ghost"),
    "the souls row sits as a ghost from first boot");
  ok(dP.getElementById("sendL").textContent === "fields" &&
     dP.getElementById("sendR").textContent === "shrine",
    "the dial keeps its old ends");
  ok(!dP.getElementById("bld-vigil") && !dP.getElementById("mir-tongues") &&
     !dP.getElementById("mir-hush"),
    "no vigil, no tongues, no hush before the door");
}

/* ---------- the silence and the vigil: the rival nothing-god ---------- */

{
  const stS = {};
  const wS = boot(stS).window, dS = wS.document, GS = wS.__tithe, SS = GS.state;
  /* the same dead village, five worlds short of the visitor */
  SS.proj.fire = true; SS.proj.tools = true; SS.proj.rats = true; SS.proj.shrineX = true;
  SS.proj.temple = true; SS.proj.tithe = true; SS.proj.songs = true; SS.proj.calendar = true;
  SS.proj.lights = true; SS.proj.ascend = true;
  SS.mir.goodyear = true; SS.mir.obedience = true;
  SS.bld.hut = 5; SS.bld.farm = 3; SS.bld.quarry = 1; SS.bld.sawpit = 1; SS.bld.granary = 1;
  SS.turn1 = true; SS.offerings = 21; SS.nameIdx = 22; SS.deeper = 4;
  SS.totalFavor = 3000; SS.pop = 2; SS.jobs = { f:0, w:0, m:0, p:0, c:0 };
  SS.favor = 500; SS.food = 6000; SS.legend = 12; SS.slider = 0; SS.tithedLine = 0;
  const tk = s => { SS.last = Date.now() - (s ? s * 1000 : 1); GS.tick(); };
  tk();            /* reveals fire while two stragglers stand */
  SS.pop = 0; tk(); /* then the village is empty, as the door left it */

  /* four worlds in: no silence, no vigil */
  SS.heralds = 1; SS.heraldSeeds = 1; SS.heraldSpent = 400; SS.seen.heraldT = 1;
  SS.worlds = 4; SS.worldProg = 262; SS.souls = 0;
  ok(!SS.silenceBorn && !dS.getElementById("bld-vigil"),
    "before the fifth world, no one keeps watch");

  /* born at the fifth, honest to the digit (§7.3) */
  tk(1);  /* 262 + 1.02 herald-seconds crosses worldNeed(4) = 262.144 */
  ok(SS.worlds === 5 && SS.silenceBorn === true && SS.faint === 1,
    "born at the fifth world, honest to the digit");
  let scS = GS.villageScene();
  ok(scS.stars[5].state === "faint" &&
     scS.stars.filter(st => st.state === "faint").length === 1,
    "one unconverted light goes faint between two renders");
  ok(dS.getElementById("popLine").textContent === "worlds 5 / 14 · souls 81m",
    "and no text announces it");
  const vigBtn = dS.getElementById("bld-vigil");
  ok(!!vigBtn && vigBtn.querySelector(".nm").textContent === "the vigil" &&
     vigBtn.querySelector(".co").textContent === "8 favor/s",
    "the vigil appears with the silence, price per second");
  ok(vigBtn.querySelector(".ct").textContent === "", "and no one holds it yet");
  ok(!dS.getElementById("mir-hush"), "the hush is not yet conceivable");

  /* unheld: one light per forty seconds (the birth tick paid its own dt in) */
  SS.dimT = 0;
  tk(40);
  ok(SS.faint === 2, "unheld, it dims one light each forty seconds");
  tk(39);
  ok(SS.faint === 2 && near(SS.dimT, 39, 0.1), "thirty-nine seconds is not forty");
  tk(1);
  ok(SS.faint === 3 && SS.worlds === 5, "forty is");
  scS = GS.villageScene();
  ok(scS.stars.slice(5, 8).every(st => st.state === "faint"),
    "the dark stands between the wall and the next light");
  ok(scS.stars.slice(0, 5).every(st => st.state === "red"),
    "it never touches a tithed world");

  /* the vigil holds; the treasury pays */
  SS.favor = 100;
  vigBtn.click();
  ok(SS.vigil === true && vigBtn.querySelector(".ct").textContent === "held",
    "the vigil is held");
  tk(10);
  ok(near(SS.favor, 20, 0.01) && SS.faint === 3 && SS.dimT === 0,
    "held: eight favor a second, zero losses");
  tk(10);
  ok(SS.vigil === false && near(SS.favor, 20, 0.01) && near(SS.dimT, 10, 0.1),
    "the treasury starves and the vigil lapses");
  ok(vigBtn.querySelector(".ct").textContent === "", "no hand on it now");

  /* a dimmed world costs double — a stall, never a loss (§7.1) */
  SS.heralds = 1; SS.worldProg = 838;  /* worldNeed(5) x 2 = 838.86 */
  tk(1);
  ok(SS.worlds === 6 && SS.faint === 2,
    "a dimmed world costs double — and is relit by being taken");
  scS = GS.villageScene();
  ok(scS.stars[5].state === "red" && scS.stars[6].state === "faint",
    "the wall advances one light");

  /* with every light dim, the clock has nothing to count */
  SS.faint = 8; SS.dimT = 0;  /* all eight unconverted, taken */
  tk(50);
  ok(SS.faint === 8 && SS.dimT === 0, "with every light dim the clock stops at the rim");

  /* tongues (§7.3): the eighth world earns the doubling */
  ok(!dS.getElementById("mir-tongues"), "tongues is not yet earned at six worlds");
  SS.worlds = 8; SS.faint = 0; SS.dimT = 0; SS.worldProg = 0; SS.favor = 2000;
  tk();
  const tonBtn = dS.getElementById("mir-tongues");
  ok(!!tonBtn && !tonBtn.parentElement.classList.contains("ghost"),
    "tongues arrives lit among the blanked slots");
  ok(tonBtn.querySelector(".co").textContent === "1.2k favor", "twelve hundred favor");
  ok(tonBtn.parentElement.querySelector(".tease").textContent === "every door opens from inside.",
    "and says its one line");
  tonBtn.click();
  ok(SS.mir.tongues === true && near(SS.favor, 800, 0.01) &&
     tonBtn.querySelector(".co").textContent === "granted",
    "every door opens from inside");
  SS.heralds = 1; SS.worldProg = 0;
  tk(10);
  ok(near(SS.worldProg, 24, 0.1), "the heralds convert at twice the pace");

  /* the hush (§7.3): ninety seconds of the silence, then a way out */
  const hushBtn = dS.getElementById("mir-hush");
  ok(!!hushBtn && hushBtn.querySelector(".co").textContent === "2.5k favor",
    "ninety seconds of it, and the hush can be asked for");
  SS.favor = 3000; GS.render();  /* the wallet must be seen before the button unlocks */
  hushBtn.click();
  ok(SS.mir.hush === 1 && GS.hushActive() === true &&
     hushBtn.querySelector(".co").textContent === "granted",
    "the hush knows which sky bought it");
  ok(vigBtn.querySelector(".co").textContent === "", "the vigil's price column empties");
  vigBtn.click();
  tk(10);
  ok(SS.vigil === true && near(SS.favor, 500, 0.01) && SS.faint === 0,
    "held for nothing, this sky");

  /* the silence survives a reload */
  wS.dispatchEvent(new wS.Event("beforeunload"));
  const wS2 = boot(stS).window, dS2 = wS2.document, GS2 = wS2.__tithe;
  ok(GS2.state.silenceBorn === true && GS2.state.mir.hush === 1 &&
     GS2.state.vigil === true && GS2.state.faint === 0,
    "reload: the silence is remembered");
  ok(dS2.getElementById("bld-vigil").querySelector(".ct").textContent === "held" &&
     dS2.getElementById("bld-vigil").querySelector(".co").textContent === "",
    "reload: still held, still free");
  ok(dS2.getElementById("mir-tongues").querySelector(".co").textContent === "granted",
    "reload: the doors stay open");

  /* a v6 save meets the silence at its defaults */
  const mgS = GS2.migrate({ v:6, turn1:true, worlds:7, proj:{ ascend:true } });
  ok(mgS.silenceBorn === false && mgS.faint === 0 && mgS.silenceT === 0 &&
     mgS.dimT === 0 && mgS.v === 7,
    "a v6 save meets the silence at its defaults");
}

/* ---------- the road is seen: a pending arrival walks in from the treeline ---------- */

{
  const stW = {};
  const GW = boot(stW).window.__tithe, SW = GW.state;
  SW.proj.fire = true; SW.bld.hut = 1; SW.pop = 1; SW.food = 999;
  SW.arriveCd = 10;  /* as after an offering */
  let scW = GW.villageScene();
  ok(!!scW.walker, "someone is on the road");
  const wc0 = scW.walker.col;
  SW.arriveCd = 2;
  scW = GW.villageScene();
  ok(scW.walker.col > wc0, "closer now");
  SW.arriveCd = 0;
  ok(GW.villageScene().walker === null, "arrived: the road is empty");
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
