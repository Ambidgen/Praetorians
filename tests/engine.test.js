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
} from '../js/data.js';
import {
  checkEnd,
  createReign,
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
  // Expected = before + choice effect + daily upkeep, clamped to 0..100.
  for (const key of STAT_KEYS) {
    const delta = (choice.effects || {})[key] || 0;
    const expected = Math.max(0, Math.min(100, before[key] + delta + (UPKEEP[key] || 0)));
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
