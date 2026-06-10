// lab utility: plays the game headless to interesting states and writes
// save JSONs for lab/seed.html screenshots. run: node lab/mksave.js <outdir>
"use strict";
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const outdir = process.argv[2] || __dirname;

const vc = new VirtualConsole();
vc.on("jsdomError", e => { if (!/canvas/i.test(String(e && e.message))) console.error(e); });

function boot(storage = {}) {
  return new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      const store = storage;
      Object.defineProperty(window, "localStorage", { value: {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; },
      }});
      window.matchMedia = () => ({ matches: true }); // reduced motion; phase irrelevant to saves
      window.confirm = () => true;
      window.prompt = () => null;
    }});
}

const store = {};
const w = boot(store).window, d = w.document, G = w.__tithe;
const S = G.state;
const ff = s => { S.last = Date.now() - s * 1000; G.tick(); };
const click = id => { ff(0.001); d.getElementById(id).click(); };

S.seed = 1234567; // a fixed, good-looking field

/* ---- play act 1: fire, hut, villagers, farm, quarry, tools ---- */
for (let i = 0; i < 3; i++) click("act-berries");
S.wood = 10; S.totalWood = 10; click("proj-fire");
S.wood = 12; click("bld-hut");
S.food = 16; ff(0.1);                    // villager 1
S.food = 60; ff(21);                     // villager 2, after the road
click("jp-f"); click("jp-f");
S.wood = 25; click("bld-farm");
S.wood = 60; click("bld-quarry");
click("jm-f"); click("jp-m");
S.wood = 30; S.stone = 10; S.totalStone = 10; click("proj-tools");
S.wood = 16; click("bld-hut");           // hut 2 -> cap 4
S.food = 40; ff(21);                     // villager 3, after the road
S.food = 50; ff(21);                     // villager 4
click("jp-f"); click("jp-w");
S.wood = 55; S.stone = 16; ff(0.001); click("bld-sawpit");

/* shot 1 — act 1 mid: cozy, working, pre-hollow */
S.food = 24.3; S.wood = 18.6; S.stone = 41.2;
S.totalFood = 280; S.totalWood = 410; S.totalStone = 60;
ff(0.001); G.save();
fs.writeFileSync(path.join(outdir, "save-act1.json"), store["tithe-save"]);
console.log("save-act1.json  pop", S.pop, "jobs", JSON.stringify(S.jobs));

/* ---- on to the turn: hollow, excavation, offerings, priests, miracles ---- */
S.totalStone = 155; ff(0.1);             // the hollow appears
S.stone = 90; S.wood = 60; click("proj-shrineX");
click("offer");                          // the turn — offering 1
S.food = 60; ff(21);                     // the road takes time; one walks in
S.food = 80; ff(21);                     // the second waits out the cooldown too
click("jp-p");                           // a priest
S.favor = 60; click("mir-goodyear");
S.favor = 150; click("mir-obedience");
S.wood = 20; click("proj-rats");         // the granary kept (revealed back in act 1)
click("offer");                          // offering 2
click("offer");                          // offering 3
S.food = 90; ff(0.1);

/* shot 2 — after the turn: red, flecks, priests, the tithe teased */
S.food = 31.7; S.wood = 12.4; S.stone = 8.9; S.favor = 11.2;
S.totalFavor = 140; S.surgeLeft = 64;
ff(0.001); G.save();
fs.writeFileSync(path.join(outdir, "save-act2.json"), store["tithe-save"]);
console.log("save-act2.json  pop", S.pop, "offerings", S.offerings, "turn1", S.turn1,
  "jobs", JSON.stringify(S.jobs), "mir", JSON.stringify(S.mir));
