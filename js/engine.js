// Pure game logic. No DOM access, so it can be unit-tested under Node.
import {
  CAUSES,
  EMPERORS,
  EVENTS,
  REIGN_DAYS,
  RANKS,
  START_STATS,
  STATS,
  UPKEEP,
} from './data.js';
import { clamp, shuffle } from './util.js';

// ---- Candidates -----------------------------------------------------------

export function unlockedEmperors(reignsServed) {
  return EMPERORS.filter((e) => reignsServed >= (e.unlockAt ?? 0));
}

// Draw `count` distinct candidates from the unlocked pool.
// `avoid` is a list of emperor ids to skip when possible (e.g. the last reign's emperor).
export function drawCandidates({ reignsServed = 0, count = 3, rng = Math.random, avoid = [] } = {}) {
  const pool = unlockedEmperors(reignsServed);
  let options = pool.filter((e) => !avoid.includes(e.id));
  if (options.length < count) options = pool;
  return shuffle(options, rng).slice(0, Math.min(count, options.length));
}

// Emperors that have just become eligible because of the latest reign count.
export function newlyEligible(reignsServed) {
  if (reignsServed <= 0) return [];
  return EMPERORS.filter((e) => (e.unlockAt ?? 0) === reignsServed);
}

// ---- Reign lifecycle ------------------------------------------------------

export function createReign(emperor, { rng = Math.random } = {}) {
  const stats = { ...START_STATS };
  for (const [key, delta] of Object.entries(emperor.mods || {})) {
    stats[key] = clamp(stats[key] + delta);
  }
  return {
    emperor,
    stats,
    day: 0,
    length: REIGN_DAYS,
    used: [],
    current: null, // id of the event currently on the table
    log: [],
    over: null, // { key, title, text, epitaph } once the reign has ended
    rng,
    recorded: false,
  };
}

export function eligibleEvents(reign) {
  const tags = reign.emperor.tags || [];
  return EVENTS.filter(
    (ev) =>
      !reign.used.includes(ev.id) &&
      (!ev.requires || ev.requires.some((tag) => tags.includes(tag))),
  );
}

// Choose the next event. Emperor-specific events get 4x weight.
export function nextEvent(reign) {
  const pool = eligibleEvents(reign);
  if (pool.length === 0) return null;
  const weighted = [];
  for (const ev of pool) {
    const weight = ev.requires ? 4 : 1;
    for (let i = 0; i < weight; i++) weighted.push(ev);
  }
  const ev = weighted[Math.floor(reign.rng() * weighted.length)];
  reign.current = ev.id;
  return ev;
}

export function currentEvent(reign) {
  return EVENTS.find((e) => e.id === reign.current) || null;
}

// Apply the player's choice on the current event. Mutates `reign`, returns a summary.
export function resolveChoice(reign, choiceIndex) {
  const ev = currentEvent(reign);
  if (!ev) throw new Error('No event is on the table.');
  const choice = ev.choices[choiceIndex];
  if (!choice) throw new Error(`No choice at index ${choiceIndex}.`);

  let outcome = choice;
  if (choice.gamble) {
    outcome = reign.rng() < choice.gamble.chance ? choice.gamble.win : choice.gamble.lose;
  }
  const deltas = { ...(outcome.effects || {}) };
  for (const [key, delta] of Object.entries(deltas)) {
    reign.stats[key] = clamp(reign.stats[key] + delta);
  }

  // Daily upkeep happens whether or not you liked the choice.
  const upkeep = applyUpkeep(reign);

  // Keep reign.current set so the event stays on the table behind the outcome modal.
  // nextEvent() replaces it when the player moves on.
  reign.used.push(ev.id);
  reign.day += 1;
  reign.log.push({
    day: reign.day,
    eventTitle: ev.title,
    choiceLabel: choice.label,
    result: outcome.result,
    deltas,
    upkeep,
    gamble: Boolean(choice.gamble),
  });

  checkEnd(reign);
  return {
    event: ev,
    choice,
    result: outcome.result,
    deltas,
    upkeep,
    gamble: Boolean(choice.gamble),
    over: reign.over,
  };
}

// Apply UPKEEP to every stat. Returns the deltas that were actually applied.
export function applyUpkeep(reign) {
  const applied = {};
  for (const [key, delta] of Object.entries(UPKEEP)) {
    if (!delta) continue;
    const before = reign.stats[key];
    reign.stats[key] = clamp(before + delta);
    applied[key] = reign.stats[key] - before;
  }
  return applied;
}

// Ends the reign if any condition is met. Order matters: the first match wins.
export function checkEnd(reign) {
  if (reign.over) return reign.over;
  const s = reign.stats;
  let key = null;
  if (s.treasury <= 0) key = 'bankrupt';
  else if (s.plebs <= 0) key = 'riot';
  else if (s.senate <= 0) key = 'senate';
  else if (s.paranoia >= 100) key = 'purge';
  else if (s.morale <= 0) key = 'mutiny';
  else if (reign.day >= reign.length) key = 'natural';

  if (!key) return null;
  const cause = CAUSES[key];
  const name = reign.emperor.name.replace(/"[^"]*"/g, '').trim();
  const text = key === 'natural' ? reign.emperor.end : cause.text.replace(/\{name\}/g, name);
  reign.over = { key, title: cause.title, text, epitaph: cause.epitaph };
  return reign.over;
}

// Whether a stat is close to a failure state (for UI warnings).
export function isDanger(statKey, value) {
  const stat = STATS.find((s) => s.key === statKey);
  if (!stat) return false;
  return stat.dir === 1 ? value <= 15 : value >= 85;
}

// Good/bad classification of a delta, for UI colouring.
export function deltaTone(statKey, delta) {
  const stat = STATS.find((s) => s.key === statKey);
  if (!stat || delta === 0) return 'neutral';
  return Math.sign(delta) === stat.dir ? 'good' : 'bad';
}

export function rankFor(reignsServed) {
  let rank = RANKS[0];
  for (const r of RANKS) if (reignsServed >= r.min) rank = r;
  return rank.title;
}

// ---- Records --------------------------------------------------------------

export function emptySave() {
  return { version: 1, reigns: [] };
}

// Build a serialisable record for a finished reign. Idempotent via reign.recorded.
export function recordReign(save, reign) {
  if (!reign.over || reign.recorded) return save;
  reign.recorded = true;
  save.reigns.push({
    emperorId: reign.emperor.id,
    name: reign.emperor.name,
    title: reign.emperor.title,
    days: reign.day,
    cause: reign.over.key,
    causeTitle: reign.over.title,
    causeText: reign.over.text,
    finalStats: { ...reign.stats },
    at: new Date().toISOString(),
  });
  return save;
}

export function summarizeSave(save) {
  const reigns = save.reigns;
  const endings = {};
  for (const r of reigns) endings[r.cause] = (endings[r.cause] || 0) + 1;
  const mostCommon = Object.entries(endings).sort((a, b) => b[1] - a[1])[0];
  return {
    served: reigns.length,
    longest: reigns.reduce((max, r) => Math.max(max, r.days), 0),
    mostCommonCause: mostCommon ? mostCommon[0] : null,
    rank: rankFor(reigns.length),
  };
}

