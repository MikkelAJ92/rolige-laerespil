import { LEVELS, type LevelKey } from '../domain/time';

const KEY = 'alfred.progress.v1';

export interface Progress {
  stars: number;
  trophies: number;
  starRow: number;
  level: LevelKey;
  mode: 'read' | 'set';
}

export function defaultProgress(): Progress {
  return { stars: 0, trophies: 0, starRow: 0, level: 'timer', mode: 'read' };
}

const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

export function loadProgress(store: Storage = localStorage): Progress {
  const d = defaultProgress();
  try {
    const raw = store.getItem(KEY);
    if (raw == null) return d;
    const o = JSON.parse(raw) as Partial<Progress>;
    const level: LevelKey = (o.level && o.level in LEVELS ? o.level : d.level) as LevelKey;
    const mode: 'read' | 'set' = o.mode === 'set' ? 'set' : 'read';
    return {
      stars: num(o.stars, d.stars),
      trophies: num(o.trophies, d.trophies),
      starRow: num(o.starRow, d.starRow, 0, 4),
      level,
      mode,
    };
  } catch {
    return d;
  }
}

export function saveProgress(p: Progress, store: Storage = localStorage): void {
  try {
    store.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignorér quota-fejl */
  }
}
