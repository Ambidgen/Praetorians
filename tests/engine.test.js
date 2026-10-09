import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CAUSES,
  EMPERORS,
  EVENTS,
  REIGN_DAYS,
  START_STATS,
  STATS,
  UPKEEP,
  PERKS,
  DIFFICULTIES,
  PASSIVES,
  ADVISOR,
  ADVISOR_CALM,
} from '../js/data.js';
import {
  advisorLine,
  checkEnd,
  createReign,
  epitaphText,
  gambleChance,
  legacyScore,
  netTone,
  plainName,
  recordReign as recordReignV2,
  scaleEffects,
  unlockedPerks,
  lockedPerks,
  applyUpkeep,
  currentEvent,
  drawCandidates,
  eligibleEvents,
  emptySave,
  isDanger,
  deltaTone,
  newlyEligible,
  nextEvent,
  rankFor,
  recordReign,
  resolveChoice,
  summarizeSave,
  unlockedEmperors,
} from '../js/engine.js';
import { makeRng, hashString } from '../js/util.js';
import { lookFor, GRID } from '../js/portrait.js';

const STAT_KEYS = STATS.map((s) => s.key);
const EMPEROR_TAGS = new Set(EMPERORS.flatMap((e) => e.tags || []));

// ---------------------------------------------------------------- content

test('emperor ids are unique and mods only touch known stats', () => {
  const ids = EMPERORS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const e of EMPERORS) {
    for (const key of Object.keys(e.mods || {})) {
      assert.ok(STAT_KEYS.includes(key), `${e.id} modifies unknown stat ${key}`);
    }
    assert.ok(e.name && e.title && e.blurb && e.end, `${e.id} is missing copy`);
  }
});

test('event ids are unique and every choice is well formed', () => {
  const ids = EVENTS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const ev of EVENTS) {
    assert.ok(ev.choices.length >= 2 && ev.choices.length <= 3, `${ev.id} should have 2–3 choices`);
    for (const choice of ev.choices) {
      assert.ok(choice.label, `${ev.id} has a choice without a label`);
      if (choice.gamble) {
        assert.ok(choice.gamble.chance > 0 && choice.gamble.chance < 1, `${ev.id} gamble chance`);
        for (const side of [choice.gamble.win, choice.gamble.lose]) {
          assert.ok(side.result, `${ev.id} gamble outcome needs a result`);
          for (const key of Object.keys(side.effects || {})) assert.ok(STAT_KEYS.includes(key), `${ev.id} unknown stat ${key}`);
        }
      } else {
        assert.ok(choice.result, `${ev.id} choice needs a result`);
        for (const key of Object.keys(choice.effects || {})) assert.ok(STAT_KEYS.includes(key), `${ev.id} unknown stat ${key}`);
      }
    }
    for (const tag of ev.requires || []) {
      assert.ok(EMPEROR_TAGS.has(tag), `${ev.id} requires tag "${tag}" that no emperor has`);
    }
  }
});

test('every emperor has enough distinct events to fill a reign', () => {
  for (const e of EMPERORS) {
    const reign = createReign(e, { rng: makeRng(1) });
    assert.ok(
      eligibleEvents(reign).length >= REIGN_DAYS,
      `${e.id} only has ${eligibleEvents(reign).length} events for ${REIGN_DAYS} days`,
    );
  }
});

test('every ending cause has copy', () => {
  for (const [key, cause] of Object.entries(CAUSES)) {
    assert.ok(cause.title && cause.epitaph, `${key} is missing copy`);
  }
});

// ---------------------------------------------------------------- utilities

test('seeded rng is deterministic and in range', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 100; i++) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
  assert.equal(hashString('goose'), hashString('goose'));
});

test('portrait look is stable per emperor and has a full palette', () => {
  for (const e of EMPERORS) {
    const first = lookFor(e);
    const second = lookFor(e);
    assert.deepEqual(first, second);
    for (const key of ['skin', 'skinShade', 'cloth', 'clothShade', 'hair', 'bg', 'bgDark']) {
      assert.match(first.palette[key], /^#[0-9a-f]{6}$/i, `${e.id} palette ${key}`);
    }
  }
  assert.equal(GRID, 24);
});

// ---------------------------------------------------------------- candidates

test('drawCandidates returns distinct, unlocked emperors', () => {
  const rng = makeRng(7);
  const picks = drawCandidates({ reignsServed: 0, count: 3, rng });
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map((p) => p.id)).size, 3);
  for (const p of picks) assert.ok((p.unlockAt ?? 0) <= 0, `${p.id} should be locked at 0 reigns`);
});

test('late unlocks appear only after enough reigns', () => {
  const early = unlockedEmperors(0).map((e) => e.id);
  assert.ok(!early.includes('anserus'));
  const later = unlockedEmperors(8).map((e) => e.id);
  assert.ok(later.includes('anserus') && later.includes('cassia') && later.includes('bartholomew'));
  assert.deepEqual(newlyEligible(1).map((e) => e.id), ['anserus']);
  assert.deepEqual(newlyEligible(0), []);
});

test('drawCandidates avoids the previous emperor when it can', () => {
  for (let seed = 1; seed < 50; seed++) {
    const picks = drawCandidates({ reignsServed: 0, count: 3, rng: makeRng(seed), avoid: ['lucia'] });
    assert.ok(!picks.some((p) => p.id === 'lucia'), `seed ${seed} drew the avoided emperor`);
  }
});

// ---------------------------------------------------------------- reign flow

test('createReign applies emperor modifiers and clamps to 0..100', () => {
  const tiberius = EMPERORS.find((e) => e.id === 'tiberius');
  const reign = createReign(tiberius, { rng: makeRng(3) });
  assert.equal(reign.stats.paranoia, START_STATS.paranoia + 25);
  assert.equal(reign.stats.plebs, START_STATS.plebs - 5);

  const fake = { id: 'x', name: 'X', mods: { treasury: 999, plebs: -999 } };
  const clamped = createReign(fake, { rng: makeRng(3) });
  assert.equal(clamped.stats.treasury, 100);
  assert.equal(clamped.stats.plebs, 0);
});

test('resolveChoice applies deterministic effects, logs, and advances the day', () => {
  const dorcas = EMPERORS.find((e) => e.id === 'dorcas');
  const reign = createReign(dorcas, { rng: makeRng(11) });
  const ev = nextEvent(reign);
  assert.equal(currentEvent(reign).id, ev.id);
  const before = { ...reign.stats };
  const choice = ev.choices[0];
  const result = resolveChoice(reign, 0);
  assert.equal(reign.day, 1);
  assert.equal(reign.used.length, 1);
  assert.equal(reign.log.length, 1);
  assert.equal(reign.current, ev.id, 'event stays on the table until the player moves on');
  // Expected = (before + passive-scaled choice effect, clamped), then + daily upkeep, clamped.
  const scaled = scaleEffects(dorcas, choice.effects || {});
  for (const key of STAT_KEYS) {
    const delta = scaled[key] || 0;
    const afterChoice = Math.max(0, Math.min(100, before[key] + delta));
    const expected = Math.max(0, Math.min(100, afterChoice + (UPKEEP[key] || 0)));
    assert.equal(reign.stats[key], expected, `${key} after ${choice.label}`);
  }
  assert.equal(result.result, choice.result);
  assert.deepEqual(result.upkeep, Object.fromEntries(Object.entries(UPKEEP).filter(([, v]) => v !== 0)));
});

test('an event is never repeated within the same reign', () => {
  const reign = createReign(EMPERORS[0], { rng: makeRng(99) });
  const seen = new Set();
  while (!reign.over) {
    const ev = nextEvent(reign);
    assert.ok(ev, 'ran out of events');
    assert.ok(!seen.has(ev.id), `${ev.id} repeated`);
    seen.add(ev.id);
    resolveChoice(reign, 0);
  }
});

test('checkEnd triggers each failure state in priority order', () => {
  const base = () => createReign({ id: 'x', name: 'X "Test"', title: 't', mods: {}, end: 'Natural end.' }, { rng: makeRng(5) });

  let r = base();
  r.stats.treasury = 0;
  assert.equal(checkEnd(r).key, 'bankrupt');

  r = base();
  r.stats.plebs = 0;
  assert.equal(checkEnd(r).key, 'riot');

  r = base();
  r.stats.senate = 0;
  assert.equal(checkEnd(r).key, 'senate');

  r = base();
  r.stats.paranoia = 100;
  assert.equal(checkEnd(r).key, 'purge');

  r = base();
  r.stats.morale = 0;
  assert.equal(checkEnd(r).key, 'mutiny');

  r = base();
  r.day = REIGN_DAYS;
  const over = checkEnd(r);
  assert.equal(over.key, 'natural');
  assert.equal(over.text, 'Natural end.');

  r = base();
  assert.equal(checkEnd(r), null);
});

test('gamble outcomes are chosen by the reign rng', () => {
  const ev = EVENTS.find((e) => e.choices.some((c) => c.gamble));
  const idx = ev.choices.findIndex((c) => c.gamble);
  const emp = EMPERORS[0];
  const outcomes = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const reign = createReign(emp, { rng: makeRng(seed) });
    reign.current = ev.id;
    reign.used = [];
    const res = resolveChoice(reign, idx);
    assert.equal(res.gamble, true);
    outcomes.add(res.result);
  }
  assert.ok(outcomes.size >= 2, 'gamble never produced two different outcomes');
});

test('recordReign is idempotent and summarizeSave reflects it', () => {
  const save = emptySave();
  const reign = createReign(EMPERORS[1], { rng: makeRng(2) });
  reign.day = 3;
  reign.stats.treasury = 0;
  checkEnd(reign);
  recordReign(save, reign);
  recordReign(save, reign);
  assert.equal(save.reigns.length, 1);
  const summary = summarizeSave(save);
  assert.equal(summary.served, 1);
  assert.equal(summary.longest, 3);
  assert.equal(summary.mostCommonCause, 'bankrupt');
});

test('ranks climb with reigns served', () => {
  assert.equal(rankFor(0), 'Recruit, Unpaid');
  assert.equal(rankFor(3), 'Praetorian, Second Class');
  assert.equal(rankFor(15), 'Eternal Guard of the Revolving Door');
});

test('danger and tone helpers respect stat direction', () => {
  assert.equal(isDanger('treasury', 10), true);
  assert.equal(isDanger('treasury', 60), false);
  assert.equal(isDanger('paranoia', 90), true);
  assert.equal(deltaTone('paranoia', -5), 'good');
  assert.equal(deltaTone('paranoia', 5), 'bad');
  assert.equal(deltaTone('plebs', 5), 'good');
});

// ---------------------------------------------------------------- simulation

test('random playthroughs always end, with varied causes and no repeats', () => {
  const causes = new Map();
  for (let seed = 1; seed <= 600; seed++) {
    const rng = makeRng(seed);
    const emp = EMPERORS[seed % EMPERORS.length];
    const reign = createReign(emp, { rng });
    let guard = 0;
    while (!reign.over) {
      if (++guard > 50) assert.fail(`reign ${seed} did not terminate`);
      const ev = nextEvent(reign);
      assert.ok(ev, `no event for ${emp.id}`);
      const pick = Math.floor(rng() * ev.choices.length);
      resolveChoice(reign, pick);
    }
    assert.ok(reign.day >= 1 && reign.day <= REIGN_DAYS);
    causes.set(reign.over.key, (causes.get(reign.over.key) || 0) + 1);
  }
  // Every ending should be reachable in a random run.
  for (const key of ['bankrupt', 'riot', 'senate', 'purge', 'mutiny', 'natural']) {
    assert.ok(causes.get(key), `ending "${key}" never happened in 600 random reigns`);
  }
});

test('the game is not trivially winnable by always picking the first choice', () => {
  let natural = 0;
  const total = 300;
  for (let seed = 1; seed <= total; seed++) {
    const reign = createReign(EMPERORS[seed % EMPERORS.length], { rng: makeRng(seed) });
    while (!reign.over) {
      nextEvent(reign);
      resolveChoice(reign, 0);
    }
    if (reign.over.key === 'natural') natural++;
  }
  // Informational guard: both survival and failure should happen in real numbers.
  assert.ok(natural > 0 && natural < total, `natural endings: ${natural}/${total}`);
});

// ---------------------------------------------------------------- v0.2

test('every flag that unlocks a follow-up is set by some choice', () => {
  const setters = new Set();
  for (const ev of EVENTS) {
    for (const c of ev.choices) {
      for (const f of [...(c.setFlags || []), ...((c.gamble && [...(c.gamble.win.setFlags || []), ...(c.gamble.lose.setFlags || [])]) || [])]) setters.add(f);
    }
  }
  for (const ev of EVENTS.filter((e) => e.needsFlag)) {
    assert.ok(setters.has(ev.needsFlag), `${ev.id} needs flag "${ev.needsFlag}" that nothing sets`);
  }
});

test('choosing a flag-setting option makes its follow-up eligible, and not before', () => {
  const reign = createReign(EMPERORS.find((e) => e.id === 'little_boots'), { rng: makeRng(4) });
  const followUpIds = EVENTS.filter((e) => e.needsFlag).map((e) => e.id);
  assert.ok(!eligibleEvents(reign).some((e) => followUpIds.includes(e.id)), 'follow-up appeared with no flags');
  reign.flags.add('baker_blamed');
  assert.ok(eligibleEvents(reign).some((e) => e.id === 'bakers_organise'), 'bakers_organise should unlock');
});

test('resolveChoice records flags set by the chosen option', () => {
  const reign = createReign(EMPERORS[0], { rng: makeRng(8) });
  reign.current = 'bread_situation';
  resolveChoice(reign, 1); // "Blame the bakers, publicly."
  assert.ok(reign.flags.has('baker_blamed'));
});

test('passives scale effects, preserve sign, and never erase a nonzero change', () => {
  const dorcas = EMPERORS.find((e) => e.id === 'dorcas');
  assert.deepEqual(scaleEffects(dorcas, { treasury: 20, plebs: -5 }), { treasury: 25, plebs: -5 });
  const anserus = EMPERORS.find((e) => e.id === 'anserus');
  assert.deepEqual(scaleEffects(anserus, { paranoia: 1 }), { paranoia: 1 }, 'a 1 should not round to 0');
  assert.deepEqual(scaleEffects({ id: 'nobody' }, { morale: -7 }), { morale: -7 });
  for (const id of Object.keys(PASSIVES)) assert.ok(EMPERORS.some((e) => e.id === id), `passive for unknown emperor ${id}`);
});

test('perks unlock by reigns served and their stat mods apply at reign start', () => {
  assert.deepEqual(unlockedPerks(0), []);
  assert.ok(unlockedPerks(1).some((p) => p.id === 'iron_rations'));
  assert.ok(lockedPerks(1).some((p) => p.id === 'loud_herald'));
  const base = createReign(EMPERORS[0], { rng: makeRng(1) });
  const withPerk = createReign(EMPERORS[0], { rng: makeRng(1), perkId: 'shadow_ledger' });
  assert.equal(withPerk.stats.treasury, Math.min(100, base.stats.treasury + 12));
  assert.equal(withPerk.perk.id, 'shadow_ledger');
  const bogus = createReign(EMPERORS[0], { rng: makeRng(1), perkId: 'not_a_perk' });
  assert.equal(bogus.perk, null);
});

test('loaded dice raise gamble odds, capped below certainty', () => {
  const choice = { gamble: { chance: 0.5, win: {}, lose: {} } };
  assert.equal(gambleChance({ perk: null }, choice), 0.5);
  assert.ok(Math.abs(gambleChance({ perk: PERKS.find((p) => p.id === 'loaded_dice') }, choice) - 0.65) < 1e-9);
  assert.ok(gambleChance({ perk: { chanceBonus: 5 } }, choice) <= 0.95);
});

test('difficulty scales upkeep: Clement is gentler, Cynical is harsher', () => {
  const clement = createReign(EMPERORS[0], { rng: makeRng(1), difficulty: 'clement' });
  const cynical = createReign(EMPERORS[0], { rng: makeRng(1), difficulty: 'cynical' });
  const roman = createReign(EMPERORS[0], { rng: makeRng(1), difficulty: 'roman' });
  const before = (r) => ({ ...r.stats });
  const b1 = before(clement);
  const c1 = applyUpkeep(clement);
  const r1 = applyUpkeep(roman);
  const y1 = applyUpkeep(cynical);
  assert.ok(Math.abs(c1.treasury) < Math.abs(r1.treasury), 'clement treasury upkeep should be smaller');
  assert.ok(Math.abs(y1.treasury) > Math.abs(r1.treasury), 'cynical treasury upkeep should be larger');
  assert.equal(b1.treasury + c1.treasury, clement.stats.treasury);
  assert.equal(createReign(EMPERORS[0], { difficulty: 'nonsense' }).difficulty, 'roman');
  assert.ok(DIFFICULTIES.roman.upkeepMult === 1);
});

test('advisor speaks about the most endangered stat, and is calm when nothing is wrong', () => {
  const reign = createReign(EMPERORS[0], { rng: makeRng(1) });
  reign.day = 0;
  assert.ok(ADVISOR_CALM.includes(advisorLine(reign)));
  reign.stats.treasury = 5;
  assert.ok(ADVISOR.treasury.includes(advisorLine(reign)));
  const paranoid = createReign(EMPERORS[0], { rng: makeRng(1) });
  paranoid.stats.paranoia = 95;
  assert.ok(ADVISOR.paranoia.includes(advisorLine(paranoid)));
});

test('legacy score rewards days, a healthy realm, and a natural ending', () => {
  const healthy = { treasury: 60, plebs: 60, senate: 60, morale: 60, paranoia: 10 };
  const natural = legacyScore({ days: 8, stats: healthy, cause: 'natural' });
  const bankrupt = legacyScore({ days: 8, stats: healthy, cause: 'bankrupt' });
  assert.ok(natural > bankrupt);
  assert.ok(legacyScore({ days: 8, stats: healthy, cause: 'natural' }) > legacyScore({ days: 3, stats: healthy, cause: 'natural' }));
  assert.ok(legacyScore({ days: 8, stats: { ...healthy, paranoia: 90 }, cause: 'natural' }) < natural);
});

test('recorded reigns carry legacy, epitaph and difficulty, and epitaphs are shareable', () => {
  const save = emptySave();
  const reign = createReign(EMPERORS[0], { rng: makeRng(2), difficulty: 'cynical', perkId: 'iron_rations' });
  reign.day = 8;
  checkEnd(reign);
  recordReignV2(save, reign);
  const rec = save.reigns[0];
  assert.equal(rec.difficulty, 'cynical');
  assert.equal(rec.perkId, 'iron_rations');
  assert.equal(rec.legacy, reign.record.legacy);
  assert.equal(reign.record, rec);
  const text = epitaphText(rec);
  assert.ok(text.includes(plainName(EMPERORS[0].name)));
  assert.ok(text.includes('Choose Your Emperor...As Many Times as it Takes!'));
  assert.ok(text.includes(String(rec.legacy)));
});

test('netTone classifies an outcome as good, bad, or neutral', () => {
  assert.equal(netTone({ treasury: 10, paranoia: -5 }), 1);
  assert.equal(netTone({ treasury: -10, plebs: -5 }), -1);
  assert.equal(netTone({ treasury: 5, plebs: -5 }), 0);
});

test('follow-ups do not break the simulation: reigns still end, and flag-driven events do appear', () => {
  let sawFollowUp = false;
  for (let seed = 1; seed <= 400; seed++) {
    const rng = makeRng(seed);
    const reign = createReign(EMPERORS[seed % EMPERORS.length], { rng, difficulty: seed % 3 === 0 ? 'cynical' : 'roman' });
    let guard = 0;
    while (!reign.over) {
      if (++guard > 50) assert.fail(`reign ${seed} did not terminate`);
      const ev = nextEvent(reign);
      assert.ok(ev, 'no event');
      if (ev.needsFlag) sawFollowUp = true;
      resolveChoice(reign, Math.floor(rng() * ev.choices.length));
    }
  }
  assert.ok(sawFollowUp, 'no follow-up event ever appeared in 400 reigns');
});
