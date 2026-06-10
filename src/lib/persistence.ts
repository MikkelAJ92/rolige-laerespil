import { LEVELS, type LevelKey } from '../domain/time';
import { type Stats, type BucketStat, defaultStats } from '../domain/mastery';

const KEY = 'alfred.progress.v1';

export interface Progress {
  stars: number;
  trophies: number;
  starRow: number;
  level: LevelKey;
  mode: 'read' | 'set';
  sound: boolean;
}

export function defaultProgress(): Progress {
  return { stars: 0, trophies: 0, starRow: 0, level: 'timer', mode: 'read', sound: true };
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
      sound: o.sound === false ? false : true,
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

const STATS_KEY = 'alfred.stats.v1';

export function loadStats(store: Storage = localStorage): Stats {
  try {
    const raw = store.getItem(STATS_KEY);
    if (raw == null) return defaultStats();
    const o = JSON.parse(raw) as Record<string, Partial<BucketStat> | null>;
    const out: Stats = {};
    for (const [k, v] of Object.entries(o ?? {})) {
      const minute = Number(k);
      if (!Number.isInteger(minute) || minute < 0 || minute > 55 || minute % 5 !== 0) continue;
      if (v == null || typeof v !== 'object') continue;
      out[minute] = {
        correct: num(v.correct, 0),
        wrong: num(v.wrong, 0),
        streak: num(v.streak, 0),
      };
    }
    return out;
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: Stats, store: Storage = localStorage): void {
  try {
    store.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignorér quota-fejl */
  }
}
