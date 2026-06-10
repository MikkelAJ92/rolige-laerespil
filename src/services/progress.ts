// src/services/progress.ts
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.progress.v2';
const OLD_CLOCK_KEY = 'rl.progress.v1';
const OLD_WORDS_KEY = 'rl.words.v1';
const THRESHOLD = 5;

export interface ActivityProgress {
  level: number;
  correctByLevel: Record<number, number>;
  trophies: string[];
  collection: string[];
}

export interface ProgressState {
  activities: Record<string, ActivityProgress>;
}

export interface RecordResult {
  state: ProgressState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function defaultActivity(): ActivityProgress {
  return { level: 1, correctByLevel: {}, trophies: [], collection: [] };
}

export function getActivity(state: ProgressState, id: string): ActivityProgress {
  return state.activities[id] ?? defaultActivity();
}

function normalize(o: Partial<ActivityProgress> | null | undefined): ActivityProgress {
  const base = defaultActivity();
  if (!o) return base;
  return {
    level: typeof o.level === 'number' ? o.level : base.level,
    correctByLevel: { ...(o.correctByLevel ?? {}) },
    trophies: Array.isArray(o.trophies) ? [...o.trophies] : [],
    collection: Array.isArray(o.collection) ? [...o.collection] : [],
  };
}

export function load(store: Storage = localStorage): ProgressState {
  const existing = getJSON<ProgressState | null>(KEY, null, store);
  if (existing && existing.activities) {
    const activities: Record<string, ActivityProgress> = {};
    for (const [id, a] of Object.entries(existing.activities)) activities[id] = normalize(a);
    return { activities };
  }
  // Migrér gamle v1-nøgler.
  const activities: Record<string, ActivityProgress> = {};
  const oldClock = getJSON<Partial<ActivityProgress> | null>(OLD_CLOCK_KEY, null, store);
  if (oldClock) activities.clock = normalize(oldClock);
  const oldWords = getJSON<Partial<ActivityProgress> | null>(OLD_WORDS_KEY, null, store);
  if (oldWords) activities.words = normalize(oldWords);
  const migrated: ProgressState = { activities };
  if (oldClock || oldWords) save(migrated, store);
  return migrated;
}

export function save(state: ProgressState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function recordCorrect(state: ProgressState, id: string, level: number, maxLevel: number): RecordResult {
  const prev = getActivity(state, id);
  const next: ActivityProgress = {
    level: prev.level,
    correctByLevel: { ...prev.correctByLevel },
    trophies: [...prev.trophies],
    collection: [...prev.collection],
  };
  next.correctByLevel[level] = (next.correctByLevel[level] ?? 0) + 1;
  const count = next.correctByLevel[level];

  const newTrophies: string[] = [];
  let unlockedDino: string | null = null;
  let leveledUp = false;

  if (count % THRESHOLD === 0) {
    const trophyId = `${id}-lvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `${id}-dino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < maxLevel) {
      next.level = level + 1;
      leveledUp = true;
    }
  }

  return {
    state: { activities: { ...state.activities, [id]: next } },
    newTrophies,
    unlockedDino,
    leveledUp,
  };
}

export function totalTrophies(state: ProgressState): number {
  return Object.values(state.activities).reduce((sum, a) => sum + a.trophies.length, 0);
}

export function allDinos(state: ProgressState): string[] {
  return Object.values(state.activities).flatMap((a) => a.collection);
}

export function overallRank(state: ProgressState): number {
  const levels = Object.values(state.activities).map((a) => a.level);
  return levels.length ? Math.max(1, ...levels) : 1;
}
