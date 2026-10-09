// Persistence wrapper. Keeps the game playable even when localStorage is blocked (e.g. file://).
import { emptySave } from './engine.js';

const KEY = 'praetorians.save.v1';

export function loadSave() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.reigns)) return emptySave();
    return parsed;
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

export function clearSave() {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // Ignore.
  }
  return emptySave();
}
