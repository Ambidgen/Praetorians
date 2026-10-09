// Pure game logic. No DOM access, so it can be unit-tested under Node.
import {
  ADVISOR,
  ADVISOR_CALM,
  CAUSES,
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  EMPERORS,
  EVENTS,
  PASSIVES,
  PERKS,
  REIGN_DAYS,
  RANKS,
  START_STATS,
  STATS,
  UPKEEP,
} from './data.js';
import { clamp, shuffle } from './util.js';

// ---- Names ----------------------------------------------------------------

// "Gaius Tertius \"Little Boots\"" -> "Gaius Tertius"
export function plainName(name) {
  return String(name).replace(/"[^"]*"/g, '').trim();
}

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

// ---- Perks ----------------------------------------------------------------

export function unlockedPerks(reignsServed) {
  return PERKS.filter((p) => reignsServed >= p.unlockAt);
}

export function lockedPerks(reignsServed) {
  return PERKS.filter((p) => reignsServed < p.unlockAt);
}

// ---- Effects --------------------------------------------------------------

// Apply the emperor's passive factors to a set of stat effects.
// A nonzero effect never rounds down to zero, so passives can never silently erase a change.
export function scaleEffects(emperor, effects = {}) {
  const factors = PASSIVES[emperor?.id] || {};
  const out = {};
  for (const [key, value] of Object.entries(effects)) {
    const factor = factors[key] ?? 1;
    let scaled = Math.round(value * factor);
    if (scaled === 0 && value !== 0) scaled = Math.sign(value);
    out[key] = scaled;
  }
  return out;
}

// Chance of a gamble succeeding, including any perk bonus. Capped so nothing is ever certain.
export function gambleChance(reign, choice) {
  if (!choice?.gamble) return 0;
  return clamp(choice.gamble.chance + (reign.perk?.chanceBonus || 0), 0, 0.95);
}

// ---- Reign lifecycle ------------------------------------------------------

export function createReign(emperor, { rng = Math.random, difficulty = DEFAULT_SETTINGS.difficulty, perkId = null } = {}) {
  const perk = PERKS.find((p) => p.id === perkId) || null;
  const stats = { ...START_STATS };
  for (const [key, delta] of Object.entries(emperor.mods || {})) {
    stats[key] = clamp(stats[key] + delta);
  }
  for (const [key, delta] of Object.entries(perk?.mods || {})) {
    stats[key] = clamp(stats[key] + delta);
  }
  return {
    emperor,
    stats,
    day: 0,
    length: REIGN_DAYS,
    used: [],
    flags: new Set(), // set by earlier choices, unlocks follow-up events
    current: null, // id of the event currently on the table
    log: [],
    over: null, // { key, title, text, epitaph } once the reign has ended
    rng,
    recorded: false,
    record: null, // the saved record, once recorded
    difficulty: DIFFICULTIES[difficulty] ? difficulty : DEFAULT_SETTINGS.difficulty,
    perk,
  };
}

export function eligibleEvents(reign) {
  const tags = reign.emperor.tags || [];
  return EVENTS.filter(
    (ev) =>
      !reign.used.includes(ev.id) &&
      (!ev.requires || ev.requires.some((tag) => tags.includes(tag))) &&
      (!ev.needsFlag || reign.flags.has(ev.needsFlag)),
  );
}

// Choose the next event. Follow-ups get 6x weight, emperor-specific 4x, general 1x.
export function nextEvent(reign) {
  const pool = eligibleEvents(reign);
  if (pool.length === 0) return null;
  const weighted = [];
  for (const ev of pool) {
    const weight = ev.needsFlag ? 6 : ev.requires ? 4 : 1;
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
    outcome = reign.rng() < gambleChance(reign, choice) ? choice.gamble.win : choice.gamble.lose;
  }
  const deltas = scaleEffects(reign.emperor, outcome.effects || {});
  for (const [key, delta] of Object.entries(deltas)) {
    reign.stats[key] = clamp(reign.stats[key] + delta);
  }

  // Consequence chains: flags set here can unlock follow-up events later.
  for (const flag of [...(choice.setFlags || []), ...(outcome.setFlags || [])]) {
    reign.flags.add(flag);
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

// Apply UPKEEP to every stat, scaled by difficulty. Returns the deltas actually applied.
export function applyUpkeep(reign) {
  const mult = DIFFICULTIES[reign.difficulty]?.upkeepMult ?? 1;
  const applied = {};
  for (const [key, base] of Object.entries(UPKEEP)) {
    const delta = Math.round(base * mult);
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
  const name = plainName(reign.emperor.name);
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

// Net verdict for an outcome: +1 if more good than bad, -1 if more bad, 0 otherwise.
export function netTone(deltas) {
  let net = 0;
  for (const [key, delta] of Object.entries(deltas || {})) {
    const tone = deltaTone(key, delta);
    if (tone === 'good') net++;
    else if (tone === 'bad') net--;
  }
  return Math.sign(net);
}

// Cynical advisor commentary about whichever stat is closest to failure.
export function advisorLine(reign) {
  let worstKey = null;
  let worstDanger = -1;
  for (const stat of STATS) {
    const value = reign.stats[stat.key];
    const danger = stat.dir === 1 ? 100 - value : value;
    if (danger > worstDanger) {
      worstDanger = danger;
      worstKey = stat.key;
    }
  }
  if (worstDanger < 55 || !worstKey) return ADVISOR_CALM[reign.day % ADVISOR_CALM.length];
  const lines = ADVISOR[worstKey];
  return lines[reign.day % lines.length];
}

// ---- Scoring --------------------------------------------------------------

// Legacy: days served, a healthy-empire bonus, and a bonus for how the reign ended.
export function legacyScore({ days, stats, cause }) {
  const healthy = stats.treasury + stats.plebs + stats.senate + stats.morale;
  const calm = 100 - stats.paranoia;
  const endingBonus = { natural: 250, mutiny: 150, abdicated: 50 }[cause] ?? 0;
  return days * 100 + healthy + calm + endingBonus;
}

// ---- Ranks ----------------------------------------------------------------

export function rankFor(reignsServed) {
  let rank = RANKS[0];
  for (const r of RANKS) if (reignsServed >= r.min) rank = r;
  return rank.title;
}

// ---- Records --------------------------------------------------------------

export function emptySave() {
  return { version: 1, reigns: [], settings: { ...DEFAULT_SETTINGS } };
}

// Build a serialisable record for a finished reign. Idempotent via reign.recorded.
export function recordReign(save, reign) {
  if (!reign.over || reign.recorded) return save;
  reign.recorded = true;
  const record = {
    emperorId: reign.emperor.id,
    name: reign.emperor.name,
    title: reign.emperor.title,
    days: reign.day,
    cause: reign.over.key,
    causeTitle: reign.over.title,
    causeText: reign.over.text,
    epitaph: reign.over.epitaph,
    finalStats: { ...reign.stats },
    difficulty: reign.difficulty,
    perkId: reign.perk ? reign.perk.id : null,
    legacy: legacyScore({ days: reign.day, stats: reign.stats, cause: reign.over.key }),
    at: new Date().toISOString(),
  };
  reign.record = record;
  save.reigns.push(record);
  return save;
}

// Shareable one-paragraph epitaph for a recorded reign.
export function epitaphText(record) {
  const days = `${record.days} day${record.days === 1 ? '' : 's'}`;
  return [
    `Here lies ${plainName(record.name)}, ${record.title}.`,
    `Served ${days}, ended by ${record.causeTitle.toLowerCase()}. Legacy: ${record.legacy}.`,
    `"${record.epitaph}"`,
    '#Praetorians: Choose Your Emperor...As Many Times as it Takes!',
  ].join(' ');
}

export function summarizeSave(save) {
  const reigns = save.reigns;
  const endings = {};
  for (const r of reigns) endings[r.cause] = (endings[r.cause] || 0) + 1;
  const mostCommon = Object.entries(endings).sort((a, b) => b[1] - a[1])[0];
  return {
    served: reigns.length,
    longest: reigns.reduce((max, r) => Math.max(max, r.days), 0),
    bestLegacy: reigns.reduce((max, r) => Math.max(max, r.legacy || 0), 0),
    mostCommonCause: mostCommon ? mostCommon[0] : null,
    rank: rankFor(reigns.length),
  };
}
