# Praetorians: Ten Recommendations (v0.2)

Each recommendation below is implemented in this branch. The "Where" column points at the code.

| # | Recommendation | Why | Where |
|---|---|---|---|
| 1 | **Keyboard controls.** 1–3 to choose, Enter to continue, R to re-roll, M to mute. | Reigns are a rhythm of decisions. Mouse-only play slows that down, and the keys are discoverable from on-screen hints. | `js/main.js` (keydown handler), keyhints in the UI |
| 2 | **Consequence chains.** Some choices set flags that unlock follow-up events later in the reign. | Decisions should echo. Choosing to blame the bakers should come back to bite. | `setFlags` on choices, `needsFlag` on events, `reign.flags` in `js/engine.js` |
| 3 | **Emperor passives.** Each emperor amplifies or mutes particular stats. | Right now the candidates are cosmetic. Passives make choosing an emperor a strategic decision. | `PASSIVES` in `js/data.js`, `scaleEffects()` in `js/engine.js` |
| 4 | **Difficulty tiers.** Clement, Roman, and Cynical scale the daily upkeep. | One difficulty cannot suit both players who want a gentle satire and players who want to suffer. | `DIFFICULTIES` in `js/data.js`, `applyUpkeep()` |
| 5 | **Twelve new events.** Six follow-ups and six general. | Content is the fastest way to make reigns feel different from one another. | `EVENTS` in `js/data.js` (now 42 total) |
| 6 | **Guard perks.** Unlocked by reigns served and chosen on the lottery screen. | Gives long-term progression beyond the Hall of Emperors, and a reason to keep serving. | `PERKS` in `js/data.js`, perk row on the lottery screen |
| 7 | **Legacy score.** Days served, a healthy realm, and a bonus for how the reign ended. | A single number that makes runs comparable, and gives the Hall a leaderboard feel. | `legacyScore()` in `js/engine.js`, Hall and ending screens |
| 8 | **Shareable epitaph.** One click copies a short, shareable epitaph with the tagline. | The slogan is the marketing line. Players should be able to carry it out of the game. | `epitaphText()` in `js/engine.js`, "Copy Epitaph" button |
| 9 | **Synthesised sound effects.** WebAudio blips for choices, gambles, good and bad outcomes, and the doom ending. Mute toggle. | Audio gives immediate feedback with no asset pipeline. Players can mute it. | `js/audio.js`, Sound button, M key |
| 10 | **Cynical advisor.** In-character commentary about whichever stat is closest to failure. | Makes danger legible, and it is where the satire does its work. | `advisorLine()` in `js/engine.js`, `ADVISOR` in `js/data.js` |

## Notes on balance

A random-choice simulation of 3,000 reigns per difficulty (run in Node, not part of the test suite) gave these natural-survival rates:

- Clement: about 83% survive.
- Roman: about 61% survive.
- Cynical: about 21% survive, and purges are common.

Always taking the first choice is still punished, with bankruptcy most common on Roman and Cynical. The Cynical numbers are deliberately harsh, so revisit them after playtesting.

## Backlog for next time

- Playtest Cynical difficulty. The purge rate under random play looks high.
- Give follow-up events a visible hint on the ledger, so players can see chains forming.
- Add an emperor "portrait pack" variant for the goose and ghost, once more species are added.
