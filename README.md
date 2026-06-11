# tithe

a village. a hill. something under the hill.

play it at https://iksarhs.github.io/tithe/ — or open `index.html`
in any browser. single file, no build, no dependencies, no server.
it saves locally and a run takes about an hour, attended.

## development

```
npm install     # jsdom, the only dev dependency (the game has none)
npm test        # headless playtest — boots the real page, plays it, 600+ assertions
npm run pace    # pure-math pacing sim against the design benchmarks
```

both must be green before any commit. design notes live in `docs/` —
reading them spoils the game.

## roadmap

the build order lived in `docs/DESIGN-V2.md` §10; all eleven milestones
have landed. what remains is what playtesters find.

## known edges

- the sign ladder outgrows the favor bank about seven signs deep.
  this is the wall, and it is load-bearing.
- saves migrate forward across versions, never backward.
- the field needs a canvas 2d context; everything else degrades.
