// Persistence wrapper. Keeps the game playable even when localStorage is blocked (e.g. file://).
import { DEFAULT_SETTINGS, DIFFICULTIES } from './data.js';
import { emptySave } from './engine.js';

const KEY = 'praetorians.save.v1';

// Fill in anything missing from older saves, and discard values we no longer recognise.
function normalise(parsed) {
  const base = emptySave();
  const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
  if (!DIFFICULTIES[settings.difficulty]) settings.difficulty = DEFAULT_SETTINGS.difficulty;
  settings.sound = Boolean(settings.sound);
  return { ...base, reigns: parsed.reigns, settings };
}

export function loadSave() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.reigns)) return emptySave();
    return normalise(parsed);
  } catch {
    return emptySave();
  }
}

export function saveSave(save) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable. The run still works, it just will not be remembered.
  }
}

// Wipe the Ledger but keep the player's settings (sound, difficulty).
export function clearSave(settings) {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // Ignore.
  }
  return { ...emptySave(), settings: { ...DEFAULT_SETTINGS, ...settings } };
}
