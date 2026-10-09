# Praetorians
A Dark Cozy Pixel Art Praetorian Guard Simulator.

**Praetorians: Choose Your Emperor...As Many Times as it Takes!**

Satirical, cynical, absurdist. You are a Praetorian. Your job is to serve whichever emperor the lottery produces, keep the Treasury, the mob, the Senate, your own paranoia and the Guard in line, and survive eight days. Probably not. Try again.

## Running the prototype

No dependencies and no build step. Requires Node 18+.

```sh
npm start        # serves on http://0.0.0.0:8080 (override with PORT=...)
npm test         # engine tests, including a 600-run simulation
```

Or open `index.html` through any static file server.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `css/style.css` | Shell and pixel-art styling (lamplit stone, brass trim, scanlines) |
| `js/data.js` | All content: stats, emperors, events, endings, ranks, headlines, daily upkeep |
| `js/engine.js` | Pure game logic: reign flow, choices, gambles, endings, saves |
| `js/portrait.js` | Procedural 24×24 pixel portraits (human, goose, ghost, potato) |
| `js/main.js` | UI controller: title, lottery, reign, outcome, endings, Hall of Emperors |
| `js/store.js` | localStorage persistence (the Ledger survives reloads) |
| `tests/engine.test.js` | Content integrity, state machine, and balance simulation |
| `server.js` | Zero-dependency static server bound to `0.0.0.0` |

## Design notes (prototype)

- **Stats:** Treasury, Mob Mood, Senate Patience, Paranoia (lower is better), Guard Morale.
- **Each day** you pick one of three choices, then daily upkeep is applied regardless.
- **Endings:** bankruptcy, riot, senate vote, purge (paranoia hits 100), mutiny (morale hits 0; the Guard is you, so you become emperor), or natural causes after eight days.
- **Lottery:** candidates are drawn from the unlocked pool. Re-rolls are unlimited, and the Senate eventually notices.
- **Progression:** every reign is recorded in the Hall of Emperors. Some candidates only enter the lottery after enough reigns.
